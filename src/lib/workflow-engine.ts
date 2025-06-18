/** src/lib/workflow-engine.ts */
import {
  drivers,
  LLM,
  ClarificationNeeded,
  RetryableError,
  FatalError,
} from "./models";
import modelsConfig from "./models.json";
import { truncateForModel } from "../utils/tokenTruncation";
import { getAllScenarios } from "./prompts";
import { hydrate, buildContextWithUserInput } from "./interpolate";
import {
  selectOptimalDriver,
  getDriverWithFallback,
  CapabilityRequirement,
  driverMetadata,
} from "./capability-router";
import { runCrossValidation, smartValidation } from "./cross-validation";

export interface StepDefinition {
  id: string;
  model: LLM;
  title: string;
  description: string;
  timeEstimate: number;
  status: "idle" | "running" | "done" | "error" | "needs_clarification";
  rawPrompt: string;
  prompt: string;
  tags?: string[]; // Capability tags for step
}

export interface WorkflowContext {
  stepOutputs: string[];
  userInput?: string;
  clarificationHistory?: Record<string, any>;
  scenarioId: string;
  clarifications: Record<string, string>;
  metadata: {
    startTime: Date;
    estimatedDuration: number;
    totalSteps: number;
    actualModelUsed?: Record<string, LLM>; // Track which models were actually selected
    validationResults?: Record<string, any>;
  };
}

export interface ExecutionResult {
  success: boolean;
  stream?: ReadableStream;
  error?: string;
  needsClarification?: {
    schema: any;
    message: string;
  };
  retryCount?: number;
}

export interface WorkflowStep {
  id: string;
  model: LLM;
  title: string;
  description: string;
  rawPrompt: string;
  timeEstimate: number;
  // NEW: Capability-aware routing
  capabilities?: string[];
  prioritizeBy?: "cost" | "latency" | "context" | "accuracy";
  requiresValidation?: boolean;
  validationType?: "fact_check" | "source_verify" | "logic_audit";
}

export interface WorkflowStepResult {
  success: boolean;
  output?: string;
  actualModel?: LLM; // The model that was actually used (after capability routing)
  routingReason?: string;
  validationReport?: any;
  error?: string;
  metadata: {
    startTime: Date;
    endTime: Date;
    tokensUsed: number;
    wasTruncated: boolean;
    truncationPercent?: number;
  };
}

export interface MultiModelValidationRequest {
  content: string;
  enabledModels: LLM[];
  userInput?: string;
  retryCount?: number;
}

export class WorkflowEngine {
  private retryPolicy = modelsConfig.retryPolicy;
  private enabledDrivers: Record<LLM, boolean>;
  private driverStates: Record<LLM, boolean> = {
    gpt: true,
    claude: true,
    gemini: true,
    grok: true,
  };

  constructor() {
    // Load initial state from config
    this.enabledDrivers = { ...modelsConfig.enabledDrivers };
    this.driverStates = { ...modelsConfig.enabledDrivers };
  }

  /**
   * Legacy step execution for backwards compatibility
   */
  async executeStep(
    step: StepDefinition,
    context: WorkflowContext,
    scenarioId: string,
    retryCount = 0
  ): Promise<ExecutionResult> {
    return this.runStepLegacy(step, context, scenarioId, retryCount);
  }

  /**
   * Legacy core step execution logic
   */
  async runStepLegacy(
    step: StepDefinition,
    context: WorkflowContext,
    scenarioId: string,
    retryCount = 0
  ): Promise<ExecutionResult> {
    try {
      // Determine the model to use (with overrides and fallbacks)
      const targetModel = this.resolveModel(step, scenarioId);

      if (!targetModel) {
        return {
          success: false,
          error: "No available model for this step",
        };
      }

      // Render the prompt with context interpolation
      const renderedPrompt = this.renderPrompt(step.rawPrompt, context);

      // Phase 5.2: Apply token-safe truncation right before driver invocation
      const {
        truncatedPrompt,
        originalTokens,
        truncatedTokens,
        truncationPercent,
        wasTruncated,
      } = truncateForModel(renderedPrompt, targetModel);

      // Phase 5.3: Log truncation for observability
      if (wasTruncated) {
        console.warn(
          `📊 Step "${
            step.id
          }" truncated: ${originalTokens} → ${truncatedTokens} tokens (${truncationPercent}% reduction) for ${targetModel.toUpperCase()}`
        );
      }

      console.log(
        `🚀 Workflow Engine: Executing step "${
          step.id
        }" with ${targetModel.toUpperCase()} (${truncatedTokens} tokens)`
      );

      // Get the driver and execute with truncated prompt
      const driver = drivers[targetModel];
      const stream = await driver.call(truncatedPrompt, context.stepOutputs);

      return {
        success: true,
        stream,
      };
    } catch (error) {
      return this.handleExecutionError(
        error,
        step,
        context,
        scenarioId,
        retryCount
      );
    }
  }

  /**
   * Enhanced step execution with capability-aware routing - NEW IMPLEMENTATION
   */
  async runStep(
    step: WorkflowStep,
    context: WorkflowContext
  ): Promise<ReadableStream> {
    console.log(`🚀 Executing step: ${step.title}`);

    // PHASE 1: Capability-aware model selection
    let targetModel: LLM;
    let routingReason: string;

    if (step.capabilities && step.capabilities.length > 0) {
      // Use intelligent routing based on capabilities
      const requirement: CapabilityRequirement = {
        tags: step.capabilities,
        prioritizeBy: step.prioritizeBy || "accuracy",
      };

      targetModel = selectOptimalDriver(requirement, this.driverStates);
      routingReason = `Capability routing: ${step.capabilities.join(
        "+"
      )} → ${targetModel.toUpperCase()}`;
    } else {
      // Fall back to static assignment with fallback chain
      targetModel = getDriverWithFallback(step.model, this.driverStates);
      routingReason = `Static assignment with fallback: ${step.model} → ${targetModel}`;
    }

    // Store actual model used for analysis
    context.metadata.actualModelUsed = context.metadata.actualModelUsed || {};
    context.metadata.actualModelUsed[step.id] = targetModel;

    console.log(`🎯 ${routingReason}`);

    // PHASE 2: Prompt interpolation and truncation
    const promptContext = buildContextWithUserInput(
      context.stepOutputs,
      context.userInput || ""
    );
    const renderedPrompt = hydrate(step.rawPrompt, {
      ...promptContext,
      ...context.clarifications,
    });

    const {
      truncatedPrompt,
      wasTruncated,
      truncationPercent,
      originalTokens,
      truncatedTokens,
    } = truncateForModel(renderedPrompt, targetModel);

    if (wasTruncated) {
      console.warn(
        `⚠️ Prompt truncated for ${targetModel.toUpperCase()}: ${originalTokens} → ${truncatedTokens} tokens (${truncationPercent}% reduction)`
      );
    }

    // PHASE 3: Execute with selected driver
    const driver = drivers[targetModel];
    const startTime = new Date();

    try {
      const resultStream = await driver.call(
        truncatedPrompt,
        context.stepOutputs
      );

      // PHASE 4: Wrap stream with metadata and validation
      return this.wrapStreamWithEnhancements(resultStream, {
        step,
        context,
        targetModel,
        routingReason,
        startTime,
        wasTruncated,
        truncationPercent,
        originalTokens: originalTokens,
      });
    } catch (error) {
      console.error(
        `❌ Error executing step with ${targetModel.toUpperCase()}:`,
        error
      );

      // Try fallback chain
      const fallbackModel = getDriverWithFallback(
        targetModel,
        this.driverStates
      );
      if (fallbackModel !== targetModel) {
        console.log(
          `🔄 Attempting fallback: ${targetModel} → ${fallbackModel}`
        );
        const fallbackDriver = drivers[fallbackModel];
        const fallbackStream = await fallbackDriver.call(
          truncatedPrompt,
          context.stepOutputs
        );

        return this.wrapStreamWithEnhancements(fallbackStream, {
          step,
          context,
          targetModel: fallbackModel,
          routingReason: `Fallback: ${targetModel} → ${fallbackModel}`,
          startTime,
          wasTruncated,
          truncationPercent,
          originalTokens,
        });
      }

      throw error;
    }
  }

  /**
   * Resolve which model to use for a step, considering overrides, fallbacks, enabled status, and capabilities
   */
  private resolveModel(step: StepDefinition, scenarioId: string): LLM | null {
    // Check step-specific overrides first
    const stepOverrides =
      modelsConfig.stepOverrides[
        scenarioId as keyof typeof modelsConfig.stepOverrides
      ];
    let targetModel: LLM | null = (stepOverrides?.[
      step.id as keyof typeof stepOverrides
    ] || step.model) as LLM;

    // Apply capability-aware routing BEFORE fallback logic
    const capabilityModel = this.selectDriverByCapability(step);
    if (capabilityModel && this.enabledDrivers[capabilityModel]) {
      console.log(
        `🎯 Capability routing: Step "${step.id}" with tags [${step.tags?.join(
          ", "
        )}] → ${capabilityModel.toUpperCase()}`
      );
      targetModel = capabilityModel;
    }

    // Apply toggle & fallback logic: if(!enabledDrivers[m]) m = fallbacks[m];
    while (targetModel && !this.enabledDrivers[targetModel]) {
      const fallback = modelsConfig.fallbacks[targetModel];
      if (fallback === null) {
        return null; // No more fallbacks available
      }
      targetModel = fallback as LLM;
      console.log(
        `🔄 Model ${step.model} disabled, falling back to ${targetModel}`
      );
    }

    return targetModel;
  }

  /**
   * Capability-aware driver selection based on step tags
   * Novel feature: Intelligently routes to best-suited model based on capabilities
   */
  private selectDriverByCapability(step: StepDefinition): LLM | null {
    if (!step.tags || step.tags.length === 0) {
      return null; // No capability requirements
    }

    // Capability-to-driver mapping with priority
    const capabilityRules: Record<string, LLM[]> = {
      math: ["grok", "gpt"], // Grok first for STEM reasoning
      "live-web": ["grok"], // Only Grok has real-time data access
      "chain-of-thought": ["grok", "claude"], // Grok RL training + Claude reasoning
      "real-time-data": ["grok"],
      "long-context": ["gemini", "claude"], // Gemini 1M context, Claude 200K
      multimodal: ["gemini"], // Gemini for images/docs
      "document-analysis": ["gemini", "claude"],
      "high-volume-research": ["gemini"],
      "logic-audit": ["gpt", "claude"], // GPT consistency + Claude reasoning
      "creative-polish": ["gpt"], // GPT for creativity
      "fact-checking": ["gpt", "grok"], // GPT consistency + Grok live data
      "json-output": ["gpt"], // GPT most reliable JSON
      "long-form-narrative": ["claude"], // Claude's strength
      "structural-analysis": ["claude"],
      "logical-reasoning": ["claude", "gpt"],
      "human-like-voice": ["claude"],
    };

    // Find best match by checking each tag
    for (const tag of step.tags) {
      const candidateDrivers = capabilityRules[tag];
      if (candidateDrivers) {
        // Return first enabled driver that has this capability
        for (const driver of candidateDrivers) {
          if (
            this.enabledDrivers[driver] &&
            drivers[driver].caps.includes(tag)
          ) {
            return driver;
          }
        }
      }
    }

    return null; // No capability-based preference found
  }

  /**
   * Render prompt template with context interpolation
   */
  private renderPrompt(template: string, context: WorkflowContext): string {
    let rendered = template;

    // Replace {{userInput}} placeholder
    if (context.userInput) {
      rendered = rendered.replace(/\{\{userInput\}\}/g, context.userInput);
    }

    // Replace {{stepN}} placeholders with previous outputs
    context.stepOutputs.forEach((output, index) => {
      if (output && output.trim()) {
        const placeholder = `{{step${index + 1}}}`;
        rendered = rendered.replace(
          new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g"),
          output
        );
      }
    });

    // Phase 6.1: Handle clarification slots {{clarification:<stepId>}}
    if (context.clarificationHistory) {
      const clarificationPattern = /\{\{clarification:([^}]+)\}\}/g;
      rendered = rendered.replace(clarificationPattern, (match, stepId) => {
        const clarification = context.clarificationHistory?.[stepId];
        if (clarification) {
          // Format clarification nicely in the prompt
          return `\n**Clarification for ${stepId}:**\n${clarification}\n`;
        }
        // If no clarification found, remove the placeholder
        return "";
      });
    }

    return rendered;
  }

  /**
   * Handle execution errors with retry and fallback logic
   */
  private async handleExecutionError(
    error: any,
    step: StepDefinition,
    context: WorkflowContext,
    scenarioId: string,
    retryCount: number
  ): Promise<ExecutionResult> {
    // Handle clarification requests
    if (error instanceof ClarificationNeeded) {
      return {
        success: false,
        needsClarification: {
          schema: error.schema,
          message: error.message,
        },
      };
    }

    // Handle retryable errors
    if (
      error instanceof RetryableError &&
      retryCount < this.retryPolicy.maxRetries
    ) {
      const delay =
        this.retryPolicy.retryDelay *
        Math.pow(this.retryPolicy.backoffMultiplier, retryCount);

      console.log(
        `⏳ Retrying step "${step.id}" in ${delay}ms (attempt ${
          retryCount + 1
        }/${this.retryPolicy.maxRetries})`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.runStepLegacy(step, context, scenarioId, retryCount + 1);
    }

    // Handle fatal errors or max retries exceeded
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`❌ Step "${step.id}" failed: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
      retryCount,
    };
  }

  /**
   * Store step output in context for future steps
   */
  storeStepOutput(
    context: WorkflowContext,
    stepIndex: number,
    output: string
  ): void {
    // Ensure the outputs array is large enough
    while (context.stepOutputs.length <= stepIndex) {
      context.stepOutputs.push("");
    }

    context.stepOutputs[stepIndex] = output;
  }

  /**
   * Phase 6.2: Store clarification for clean template injection
   */
  storeClarification(
    context: WorkflowContext,
    stepId: string,
    clarification: string
  ): void {
    if (!context.clarificationHistory) {
      context.clarificationHistory = {};
    }

    context.clarificationHistory[stepId] = clarification;

    console.log(
      `📝 Clarification stored for step "${stepId}": ${clarification.substring(
        0,
        100
      )}${clarification.length > 100 ? "..." : ""}`
    );
  }

  /**
   * Get available clarification placeholders for a step
   */
  getAvailableClarifications(context: WorkflowContext): string[] {
    return Object.keys(context.clarificationHistory || {});
  }

  /**
   * Preview how a prompt will render with current context
   */
  previewPrompt(template: string, context: WorkflowContext): string {
    return this.renderPrompt(template, context);
  }

  /**
   * Toggle driver enabled/disabled status
   */
  toggleDriver(driverName: LLM, enabled: boolean): void {
    this.enabledDrivers[driverName] = enabled;
    console.log(`🔧 Driver ${driverName} ${enabled ? "enabled" : "disabled"}`);
  }

  /**
   * Get current driver configuration
   */
  getDriverStatus(): Record<LLM, boolean> {
    return { ...this.enabledDrivers };
  }

  /**
   * Get driver capabilities for UI display
   */
  getDriverCapabilities(): Record<LLM, string[]> {
    return {
      gpt: [...drivers.gpt.caps],
      claude: [...drivers.claude.caps],
      gemini: [...drivers.gemini.caps],
      grok: [...drivers.grok.caps],
    };
  }

  /**
   * Check if a workflow can resume from a specific step
   */
  canResumeFromStep(steps: StepDefinition[], stepIndex: number): boolean {
    return (
      stepIndex >= 0 &&
      stepIndex < steps.length &&
      steps[stepIndex].status !== "done"
    );
  }

  /**
   * Find the first non-completed step for resumption
   */
  findResumePoint(steps: StepDefinition[]): number {
    return steps.findIndex((step) => step.status !== "done");
  }

  /**
   * Validate workflow configuration
   */
  validateWorkflow(steps: StepDefinition[], scenarioId: string): string[] {
    const errors: string[] = [];

    for (const step of steps) {
      const resolvedModel = this.resolveModel(step, scenarioId);
      if (!resolvedModel) {
        errors.push(
          `Step "${step.id}": No available model (${step.model} disabled, no fallbacks)`
        );
      }
    }

    return errors;
  }

  /**
   * Enhanced stream wrapper with validation and metadata
   */
  private wrapStreamWithEnhancements(
    originalStream: ReadableStream,
    metadata: {
      step: WorkflowStep;
      context: WorkflowContext;
      targetModel: LLM;
      routingReason: string;
      startTime: Date;
      wasTruncated: boolean;
      truncationPercent?: number;
      originalTokens: number;
    }
  ): ReadableStream {
    const { step, context, targetModel, routingReason } = metadata;
    let collectedOutput = "";
    let tokenCount = 0;

    return new ReadableStream({
      start(controller) {
        // Send initial metadata
        const startChunk =
          JSON.stringify({
            type: "start",
            stepId: step.id,
            model: targetModel,
            routingReason,
            timestamp: new Date().toISOString(),
            wasTruncated: metadata.wasTruncated,
            truncationPercent: metadata.truncationPercent,
          }) + "\n";

        controller.enqueue(new TextEncoder().encode(startChunk));
      },

      async pull(controller) {
        const reader = originalStream.getReader();

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              // PHASE 5: Run validation if required
              if (step.requiresValidation && collectedOutput.length > 0) {
                try {
                  console.log(
                    `🔍 Running ${
                      step.validationType || "fact_check"
                    } validation for step: ${step.title}`
                  );

                  const validationReport = await smartValidation(
                    collectedOutput,
                    step.validationType || "fact_check"
                  );

                  // Send validation results
                  const validationChunk =
                    JSON.stringify({
                      type: "validation",
                      stepId: step.id,
                      report: validationReport,
                      timestamp: new Date().toISOString(),
                    }) + "\n";

                  controller.enqueue(new TextEncoder().encode(validationChunk));

                  // Store validation results in context
                  context.metadata.validationResults =
                    context.metadata.validationResults || {};
                  context.metadata.validationResults[step.id] =
                    validationReport;
                } catch (validationError) {
                  console.error(
                    `❌ Validation failed for step ${step.id}:`,
                    validationError
                  );
                }
              }

              // Send final metadata
              const endChunk =
                JSON.stringify({
                  type: "end",
                  stepId: step.id,
                  model: targetModel,
                  tokensUsed: tokenCount,
                  executionTime: Date.now() - metadata.startTime.getTime(),
                  timestamp: new Date().toISOString(),
                }) + "\n";

              controller.enqueue(new TextEncoder().encode(endChunk));
              controller.close();
              break;
            }

            // Process content tokens
            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split("\n").filter((line) => line.trim());

            for (const line of lines) {
              try {
                const data = JSON.parse(line);
                if (data.type === "token" && data.content) {
                  collectedOutput += data.content;
                  tokenCount++;
                }

                // Forward the chunk with enhanced metadata
                const enhancedChunk =
                  JSON.stringify({
                    ...data,
                    stepId: step.id,
                    model: targetModel,
                  }) + "\n";

                controller.enqueue(new TextEncoder().encode(enhancedChunk));
              } catch (e) {
                // Forward non-JSON chunks as-is
                controller.enqueue(value);
              }
            }
          }
        } catch (error) {
          console.error("Stream processing error:", error);
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          const errorChunk =
            JSON.stringify({
              type: "error",
              stepId: step.id,
              message: errorMessage,
              timestamp: new Date().toISOString(),
            }) + "\n";

          controller.enqueue(new TextEncoder().encode(errorChunk));
          controller.close();
        } finally {
          reader.releaseLock();
        }
      },
    });
  }

  /**
   * Get workflow analysis - which models were actually used vs planned
   */
  getWorkflowAnalysis(context: WorkflowContext): {
    planned: Record<string, LLM>;
    actual: Record<string, LLM>;
    routingEfficiency: number;
    validationSummary: any;
  } {
    const scenario = getAllScenarios().find((s) => s.id === context.scenarioId);
    const planned = Object.fromEntries(
      scenario?.steps.map((step) => [step.id, step.model]) || []
    );

    const actual = context.metadata.actualModelUsed || {};
    const matches = Object.keys(planned).filter(
      (stepId) => planned[stepId] === actual[stepId]
    ).length;
    const routingEfficiency =
      Object.keys(planned).length > 0
        ? matches / Object.keys(planned).length
        : 1;

    return {
      planned,
      actual,
      routingEfficiency,
      validationSummary: context.metadata.validationResults || {},
    };
  }

  // Legacy methods for backwards compatibility
  async validateWithMultipleModels(
    request: MultiModelValidationRequest
  ): Promise<any> {
    return runCrossValidation(
      request.content,
      request.enabledModels,
      "fact_check"
    );
  }

  getEnabledDrivers(): LLM[] {
    return Object.keys(this.enabledDrivers).filter(
      (key) => this.enabledDrivers[key as LLM]
    ) as LLM[];
  }

  async detectRequiredClarification(
    stepOutput: string,
    userInput: string
  ): Promise<string | null> {
    // Placeholder for clarification detection logic
    return null;
  }

  getDriverValidationErrors(): string[] {
    const errors: string[] = [];
    // Add validation logic here if needed
    return errors;
  }
}

// Export singleton instance
export const workflowEngine = new WorkflowEngine();

// Export runStep for reuse in route handlers (Phase 2.2)
export function runStep(
  step: StepDefinition,
  context: WorkflowContext,
  scenarioId: string,
  retryCount = 0
): Promise<ExecutionResult> {
  return workflowEngine.runStepLegacy(step, context, scenarioId, retryCount);
}
