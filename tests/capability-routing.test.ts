import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  selectOptimalDriver,
  getDriverWithFallback,
  getCapabilityMatchScore,
  driverMetadata,
} from "../src/lib/capability-router";
import {
  runCrossValidation,
  smartValidation,
} from "../src/lib/cross-validation";
import { WorkflowEngine } from "../src/lib/workflow-engine";

describe("Capability-Aware Routing System", () => {
  describe("selectOptimalDriver", () => {
    it("should select Grok for mathematical reasoning tasks", () => {
      const result = selectOptimalDriver({
        tags: ["stem_math_reasoning"],
        prioritizeBy: "accuracy",
      });

      expect(result).toBe("grok");
    });

    it("should select Claude for logical analysis tasks", () => {
      const result = selectOptimalDriver({
        tags: ["logical_reasoning", "structural_analysis"],
        prioritizeBy: "accuracy",
      });

      expect(result).toBe("claude");
    });

    it("should select Gemini for long context tasks", () => {
      const result = selectOptimalDriver({
        tags: ["long_context", "document_analysis"],
        prioritizeBy: "context",
      });

      expect(result).toBe("gemini");
    });

    it("should prioritize by cost when specified", () => {
      const result = selectOptimalDriver({
        tags: ["creative_polish"],
        prioritizeBy: "cost",
      });

      // Should prefer lower cost models
      expect(["gpt", "gemini"]).toContain(result);
    });

    it("should handle disabled drivers gracefully", () => {
      const enabledDrivers = {
        gpt: false,
        claude: true,
        gemini: false,
        grok: false,
      };

      const result = selectOptimalDriver(
        {
          tags: ["logical_reasoning"],
          prioritizeBy: "accuracy",
        },
        enabledDrivers
      );

      expect(result).toBe("claude");
    });

    it("should fall back to best available when no perfect match", () => {
      const result = selectOptimalDriver({
        tags: ["nonexistent_capability"],
        prioritizeBy: "accuracy",
      });

      // Should return some valid driver
      expect(["gpt", "claude", "gemini", "grok"]).toContain(result);
    });
  });

  describe("getDriverWithFallback", () => {
    it("should return primary choice if enabled", () => {
      const enabledDrivers = {
        gpt: true,
        claude: true,
        gemini: true,
        grok: true,
      };

      const result = getDriverWithFallback("grok", enabledDrivers);
      expect(result).toBe("grok");
    });

    it("should follow fallback chain when primary disabled", () => {
      const enabledDrivers = {
        gpt: true,
        claude: false,
        gemini: false,
        grok: false,
      };

      const result = getDriverWithFallback("grok", enabledDrivers);
      expect(result).toBe("gpt"); // grok -> gemini -> gpt
    });

    it("should return emergency fallback when all preferred disabled", () => {
      const enabledDrivers = {
        gpt: false,
        claude: false,
        gemini: false,
        grok: true,
      };

      const result = getDriverWithFallback("claude", enabledDrivers);
      expect(result).toBe("grok"); // Any enabled driver
    });
  });

  describe("getCapabilityMatchScore", () => {
    it("should return perfect score for exact matches", () => {
      const result = getCapabilityMatchScore(["logic_audit"], "gpt");

      expect(result.score).toBe(1);
      expect(result.matches).toContain("logic_audit");
      expect(result.missing).toHaveLength(0);
    });

    it("should return partial score for partial matches", () => {
      const result = getCapabilityMatchScore(
        ["logic_audit", "nonexistent_capability"],
        "gpt"
      );

      expect(result.score).toBe(0.5);
      expect(result.matches).toContain("logic_audit");
      expect(result.missing).toContain("nonexistent_capability");
    });

    it("should return zero score for no matches", () => {
      const result = getCapabilityMatchScore(["nonexistent_capability"], "gpt");

      expect(result.score).toBe(0);
      expect(result.matches).toHaveLength(0);
      expect(result.missing).toContain("nonexistent_capability");
    });
  });
});

describe("Cross-Model Validation System", () => {
  // Mock drivers for testing
  const mockDrivers = {
    gpt: {
      call: jest.fn().mockResolvedValue(
        new ReadableStream({
          start(controller) {
            const responses = [
              "CONFIDENCE: 8\n",
              "SOURCES: Wikipedia, Reuters\n",
              "FLAGS: None identified\n",
              "ASSESSMENT: Content appears factually accurate",
            ];

            responses.forEach((response) => {
              controller.enqueue(
                new TextEncoder().encode(
                  JSON.stringify({ type: "token", content: response }) + "\n"
                )
              );
            });
            controller.close();
          },
        })
      ),
    },
    claude: {
      call: jest.fn().mockResolvedValue(
        new ReadableStream({
          start(controller) {
            const responses = [
              "CONFIDENCE: 9\n",
              "SOURCES: Academic journals, official statistics\n",
              "FLAGS: Minor citation format issues\n",
              "ASSESSMENT: High confidence in factual accuracy",
            ];

            responses.forEach((response) => {
              controller.enqueue(
                new TextEncoder().encode(
                  JSON.stringify({ type: "token", content: response }) + "\n"
                )
              );
            });
            controller.close();
          },
        })
      ),
    },
  };

  beforeEach(() => {
    // Mock the drivers module
    jest.doMock("../src/lib/models", () => ({
      drivers: mockDrivers,
    }));
  });

  describe("runCrossValidation", () => {
    it("should run validation across multiple models", async () => {
      const testContent =
        "The Earth orbits the Sun in approximately 365.25 days.";

      const result = await runCrossValidation(
        testContent,
        ["gpt", "claude"],
        "fact_check"
      );

      expect(result.validations).toHaveLength(2);
      expect(result.validations[0].model).toBe("gpt");
      expect(result.validations[1].model).toBe("claude");
      expect(result.agreement.score).toBeGreaterThan(0);
      expect(["accept", "review", "reject"]).toContain(result.recommendation);
    });

    it("should identify high agreement scenarios", async () => {
      const testContent = "Water boils at 100°C at sea level.";

      const result = await runCrossValidation(
        testContent,
        ["gpt", "claude"],
        "fact_check"
      );

      // Both models should agree on basic scientific facts
      expect(result.agreement.score).toBeGreaterThan(0.6);
      expect(result.recommendation).toBe("accept");
    });

    it("should handle validation errors gracefully", async () => {
      const errorDrivers = {
        gpt: {
          call: jest.fn().mockRejectedValue(new Error("API Error")),
        },
      };

      jest.doMock("../src/lib/models", () => ({
        drivers: errorDrivers,
      }));

      // Should not throw, should handle error gracefully
      await expect(
        runCrossValidation("test", ["gpt"], "fact_check")
      ).resolves.toBeDefined();
    });
  });

  describe("smartValidation", () => {
    it("should select optimal models for fact checking", async () => {
      const result = await smartValidation(
        "Test content for fact checking",
        "fact_check"
      );

      expect(result.validations).toHaveLength(2);
      // Should use GPT and Claude for fact checking
      const models = result.validations.map((v) => v.model);
      expect(models).toContain("gpt");
      expect(models).toContain("claude");
    });

    it("should select optimal models for source verification", async () => {
      const result = await smartValidation(
        "Content with sources to verify",
        "source_verify"
      );

      // Should use Grok and Gemini for source verification
      const models = result.validations.map((v) => v.model);
      expect(models).toContain("grok");
      expect(models).toContain("gemini");
    });

    it("should provide recommendation based on agreement", async () => {
      const result = await smartValidation("Test content", "logic_audit");

      expect(["accept", "review", "reject"]).toContain(result.recommendation);
      expect(result.agreement.score).toBeGreaterThanOrEqual(0);
      expect(result.agreement.score).toBeLessThanOrEqual(1);
    });
  });
});

describe("Enhanced Workflow Engine", () => {
  let workflowEngine: WorkflowEngine;

  beforeEach(() => {
    workflowEngine = new WorkflowEngine();
  });

  describe("capability-aware step execution", () => {
    it("should route steps based on capabilities", async () => {
      const step = {
        id: "test-math",
        model: "gpt", // fallback
        title: "Math Problem",
        description: "Solve complex math",
        capabilities: ["stem_math_reasoning"],
        prioritizeBy: "accuracy" as const,
        timeEstimate: 5,
        rawPrompt: "Solve: {{userInput}}",
      };

      const context = {
        scenarioId: "test",
        stepOutputs: [],
        userInput: "2 + 2 = ?",
        clarifications: {},
        metadata: {
          startTime: new Date(),
          estimatedDuration: 300,
          totalSteps: 1,
        },
      };

      // Mock the drivers to avoid actual API calls
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(
              JSON.stringify({ type: "token", content: "4" }) + "\n"
            )
          );
          controller.close();
        },
      });

      jest.doMock("../src/lib/models", () => ({
        drivers: {
          grok: { call: jest.fn().mockResolvedValue(mockStream) },
        },
      }));

      const result = await workflowEngine.runStep(step, context);
      expect(result).toBeInstanceOf(ReadableStream);

      // Verify model was selected based on capabilities
      expect(context.metadata.actualModelUsed?.["test-math"]).toBe("grok");
    });

    it("should fall back to static assignment when no capabilities", async () => {
      const step = {
        id: "test-general",
        model: "claude",
        title: "General Task",
        description: "General purpose task",
        timeEstimate: 5,
        rawPrompt: "Process: {{userInput}}",
      };

      const context = {
        scenarioId: "test",
        stepOutputs: [],
        userInput: "Hello world",
        clarifications: {},
        metadata: {
          startTime: new Date(),
          estimatedDuration: 300,
          totalSteps: 1,
        },
      };

      const mockStream = new ReadableStream();
      jest.doMock("../src/lib/models", () => ({
        drivers: {
          claude: { call: jest.fn().mockResolvedValue(mockStream) },
        },
      }));

      const result = await workflowEngine.runStep(step, context);
      expect(result).toBeInstanceOf(ReadableStream);

      // Should use fallback to static assignment
      expect(context.metadata.actualModelUsed?.["test-general"]).toBe("claude");
    });
  });

  describe("workflow analysis", () => {
    it("should track routing efficiency", () => {
      const context = {
        scenarioId: "test",
        stepOutputs: [],
        userInput: "",
        clarifications: {},
        metadata: {
          startTime: new Date(),
          estimatedDuration: 300,
          totalSteps: 2,
          actualModelUsed: {
            step1: "gpt",
            step2: "claude",
          },
        },
      };

      // Mock scenario
      jest.doMock("../src/lib/prompts", () => ({
        getAllScenarios: () => [
          {
            id: "test",
            steps: [
              { id: "step1", model: "gpt" },
              { id: "step2", model: "grok" }, // Different from actual
            ],
          },
        ],
      }));

      const analysis = workflowEngine.getWorkflowAnalysis(context);

      expect(analysis.planned).toEqual({ step1: "gpt", step2: "grok" });
      expect(analysis.actual).toEqual({ step1: "gpt", step2: "claude" });
      expect(analysis.routingEfficiency).toBe(0.5); // 1 out of 2 matched
    });
  });

  describe("driver state management", () => {
    it("should toggle driver states", () => {
      workflowEngine.toggleDriver("grok", false);
      const states = workflowEngine.getDriverStates();

      expect(states.grok).toBe(false);
      expect(states.gpt).toBe(true); // Others unchanged
    });

    it("should provide driver capabilities", () => {
      const capabilities = workflowEngine.getDriverCapabilities();

      expect(capabilities.gpt).toContain("logic_audit");
      expect(capabilities.claude).toContain("logical_reasoning");
      expect(capabilities.gemini).toContain("long_context");
      expect(capabilities.grok).toContain("stem_math_reasoning");
    });
  });
});
