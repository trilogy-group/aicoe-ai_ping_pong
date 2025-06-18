import { create } from "zustand";
import { persist } from "zustand/middleware";
import { scenarios } from "../lib/prompts";
import {
  hydrate,
  buildContext,
  buildContextWithUserInput,
} from "../lib/interpolate";
import type { Step, SessionState } from "../types";
import modelConfig from "../lib/models.json";

interface ModelSettings {
  enabledDrivers: {
    gpt: boolean;
    claude: boolean;
    gemini: boolean;
    grok: boolean;
  };
}

interface SessionStore extends SessionState {
  // Actions
  setScenario: (scenarioId: string) => void;
  loadScenario: (scenarioId: string, userInput: string) => void;
  setStep: (stepIndex: number, patch: Partial<Step>) => void;
  advance: () => void;
  runStep: (stepIndex: number) => Promise<void>;
  runAll: () => Promise<void>;
  runAllSteps: () => Promise<void>;
  resetSession: () => void;
  submitClarification: (
    stepIndex: number,
    clarification: string
  ) => Promise<void>;
  isRunning: boolean;
  // Model settings
  modelSettings: ModelSettings;
  toggleModel: (model: keyof ModelSettings["enabledDrivers"]) => void;
  // User input storage
  userInput: string;
}

const initialState: SessionState = {
  currentScenario: null,
  steps: [],
  currentIdx: 0,
  metadata: {
    totalSteps: 0,
    completedSteps: 0,
    estimatedTimeRemaining: 0,
    totalTokensUsed: 0,
  },
  isRunningAll: false,
};

const initialModelSettings: ModelSettings = {
  enabledDrivers: {
    gpt: true,
    claude: true,
    gemini: true,
    grok: true,
  },
};

export const useSession = create<SessionStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      modelSettings: initialModelSettings,
      userInput: "",

      get isRunning() {
        return get().isRunningAll;
      },

      setScenario: (scenarioId: string) => {
        const scenario = scenarios[scenarioId];
        if (!scenario) return;

        // Create steps with hydrated prompts
        const stepsWithPrompts = scenario.steps.map((step) => ({
          ...step,
          prompt: step.rawPrompt, // Start with raw prompt, will be hydrated on execution
        }));

        set({
          currentScenario: scenarioId,
          steps: stepsWithPrompts,
          currentIdx: 0,
          metadata: {
            totalSteps: scenario.steps.length,
            completedSteps: 0,
            estimatedTimeRemaining: scenario.estimatedMinutes,
            totalTokensUsed: 0,
          },
        });
      },

      loadScenario: (scenarioId: string, userInput: string) => {
        const scenario = scenarios[scenarioId];
        if (!scenario) return;

        // Create steps with hydrated prompts that include user input
        const stepsWithPrompts = scenario.steps.map((step) => ({
          ...step,
          prompt:
            step.rawPrompt?.replace("{{userInput}}", userInput) ||
            step.rawPrompt, // Replace userInput placeholder
          rawPrompt: step.rawPrompt, // Keep original for future hydration
        }));

        set({
          currentScenario: scenarioId,
          steps: stepsWithPrompts,
          currentIdx: 0,
          userInput: userInput, // Store user input for context building
          metadata: {
            totalSteps: scenario.steps.length,
            completedSteps: 0,
            estimatedTimeRemaining: scenario.estimatedMinutes,
            totalTokensUsed: 0,
          },
        });
      },

      setStep: (stepIndex: number, patch: Partial<Step>) => {
        const { steps } = get();
        if (stepIndex < 0 || stepIndex >= steps.length) return;

        const newSteps = [...steps];
        newSteps[stepIndex] = { ...newSteps[stepIndex], ...patch };

        // Update metadata
        const completedSteps = newSteps.filter(
          (s) => s.status === "done"
        ).length;
        const remainingSteps = newSteps.length - completedSteps;
        const avgTimePerStep =
          newSteps.reduce((acc, s) => acc + s.timeEstimate, 0) /
          newSteps.length;

        set({
          steps: newSteps,
          metadata: {
            ...get().metadata,
            completedSteps,
            estimatedTimeRemaining: remainingSteps * avgTimePerStep,
          },
        });
      },

      advance: () => {
        const { currentIdx, steps } = get();
        if (currentIdx < steps.length - 1) {
          set({ currentIdx: currentIdx + 1 });
        }
      },

      runStep: async (stepIndex: number) => {
        const { steps, setStep, userInput } = get();
        const step = steps[stepIndex];
        if (!step || step.status === "running") return;

        try {
          setStep(stepIndex, {
            status: "running",
            output: "",
            error: undefined,
          });

          // Hydrate prompt with previous outputs and user input
          const outputs = steps.slice(0, stepIndex).map((s) => s.output || "");
          const context = buildContextWithUserInput(outputs, userInput);
          // Safety check for rawPrompt - fallback to prompt if rawPrompt is undefined
          const promptToHydrate = step.rawPrompt || step.prompt || "";
          const hydratedPrompt = hydrate(promptToHydrate, context);

          setStep(stepIndex, { prompt: hydratedPrompt });

          // Call API
          const response = await fetch("/api/run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              step: {
                id: step.id,
                model: step.model,
                prompt: hydratedPrompt,
                rawPrompt: step.rawPrompt,
              },
              context: {
                stepOutputs: outputs,
                userInput: userInput,
              },
              scenarioId: get().currentScenario || "article",
            }),
          });

          if (!response.ok) {
            const errorResponse = await response.json().catch(() => ({}));
            throw new Error(
              errorResponse.error ||
                `API request failed: ${response.status}. ${response.statusText}`
            );
          }

          // Handle regular JSON response (non-streaming)
          const result = await response.json();

          if (result.success) {
            setStep(stepIndex, {
              status: "done",
              output: result.result,
            });
            // Auto-advance to next step
            if (stepIndex === get().currentIdx) {
              get().advance();
            }
          } else {
            throw new Error(result.error || "Unknown API error");
          }
        } catch (error) {
          setStep(stepIndex, {
            status: "error",
            error:
              error instanceof Error ? error.message : "Unknown error occurred",
          });
        }
      },

      runAll: async () => {
        const { steps, runStep } = get();
        set({ isRunningAll: true });

        try {
          for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            if (step.status !== "done") {
              await runStep(i);

              // Wait for step to complete before proceeding
              while (get().steps[i].status === "running") {
                await new Promise((resolve) => setTimeout(resolve, 100));
              }

              // Stop if there's an error or clarification needed
              const currentStep = get().steps[i];
              if (
                currentStep.status === "error" ||
                currentStep.status === "needs_clarification"
              ) {
                break;
              }
            }
          }
        } finally {
          set({ isRunningAll: false });
        }
      },

      runAllSteps: async () => {
        // Alias for runAll to match the interface
        return get().runAll();
      },

      resetSession: () => {
        set({
          ...initialState,
          modelSettings: get().modelSettings, // Preserve model settings
          userInput: "", // Reset user input
        });
      },

      submitClarification: async (stepIndex: number, clarification: string) => {
        const { steps, setStep, userInput } = get();
        const step = steps[stepIndex];
        if (!step) return;

        try {
          setStep(stepIndex, { status: "running" });

          // Append clarification to the original prompt with enhanced context
          const outputs = steps.slice(0, stepIndex).map((s) => s.output || "");
          const context = buildContextWithUserInput(outputs, userInput);
          const clarifiedPrompt = `${
            step.rawPrompt || step.prompt
          }\n\nClarification: ${clarification}`;
          const hydratedClarifiedPrompt = hydrate(clarifiedPrompt, context);

          const response = await fetch("/api/run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              step: {
                id: step.id,
                model: step.model,
                prompt: hydratedClarifiedPrompt,
                rawPrompt: step.rawPrompt,
              },
              context: {
                stepOutputs: outputs,
                userInput: userInput,
              },
              scenarioId: get().currentScenario || "article",
            }),
          });

          if (!response.ok) {
            const errorResponse = await response.json().catch(() => ({}));
            throw new Error(
              errorResponse.error || `API request failed: ${response.status}`
            );
          }

          // Handle regular JSON response (non-streaming)
          const result = await response.json();

          if (result.success) {
            setStep(stepIndex, {
              status: "done",
              output: result.result,
              clarificationQuestion: undefined,
            });
            // Auto-advance if this was the current step
            if (stepIndex === get().currentIdx) {
              get().advance();
            }
          } else {
            throw new Error(result.error || "Unknown API error");
          }
        } catch (error) {
          setStep(stepIndex, {
            status: "error",
            error:
              error instanceof Error ? error.message : "Unknown error occurred",
          });
        }
      },

      toggleModel: (model: keyof ModelSettings["enabledDrivers"]) => {
        const { modelSettings } = get();
        const newModelSettings = {
          ...modelSettings,
          enabledDrivers: {
            ...modelSettings.enabledDrivers,
            [model]: !modelSettings.enabledDrivers[model],
          },
        };
        set({ modelSettings: newModelSettings });
      },
    }),
    {
      name: "ping-pong-session",
      partialize: (state) => ({
        currentScenario: state.currentScenario,
        steps: state.steps,
        currentIdx: state.currentIdx,
        metadata: state.metadata,
        modelSettings: state.modelSettings,
        userInput: state.userInput, // Persist user input
      }),
    }
  )
);
