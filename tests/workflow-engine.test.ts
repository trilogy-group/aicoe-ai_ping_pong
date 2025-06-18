// Mock the models configuration first
jest.mock("../src/lib/models.json", () => ({
  retryPolicy: {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
  },
  enabledDrivers: {
    gpt: true,
    claude: true,
    gemini: true,
    grok: true,
  },
  fallbacks: {
    grok: "gemini",
    gemini: "gpt",
    claude: "gpt",
    gpt: null,
  },
  stepOverrides: {
    article: {
      "deep-research": "gemini",
      "creative-polish": "gpt",
    },
  },
}));

// Mock the drivers object
jest.mock("../src/lib/models", () => ({
  drivers: {
    gpt: {
      name: "gpt",
      limit: 128000,
      caps: ["logic-audit", "creative-polish"],
      call: jest.fn().mockResolvedValue(
        new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();
            controller.enqueue(
              encoder.encode(JSON.stringify({ type: "start" }) + "\n")
            );
            controller.enqueue(
              encoder.encode(
                JSON.stringify({ type: "token", content: "Mock response" }) +
                  "\n"
              )
            );
            controller.enqueue(
              encoder.encode(JSON.stringify({ type: "end" }) + "\n")
            );
            controller.close();
          },
        })
      ),
    },
    claude: {
      name: "claude",
      limit: 200000,
      caps: ["long-form-narrative", "logical-reasoning"],
      call: jest.fn().mockResolvedValue(
        new ReadableStream({
          start(controller) {
            controller.close();
          },
        })
      ),
    },
    gemini: {
      name: "gemini",
      limit: 1000000,
      caps: ["long-context", "multimodal"],
      call: jest.fn().mockResolvedValue(
        new ReadableStream({
          start(controller) {
            controller.close();
          },
        })
      ),
    },
    grok: {
      name: "grok",
      limit: 1000000,
      caps: ["math", "live-web"],
      call: jest.fn().mockResolvedValue(
        new ReadableStream({
          start(controller) {
            controller.close();
          },
        })
      ),
    },
  },
}));

import { WorkflowEngine } from "../src/lib/workflow-engine";
import type {
  StepDefinition,
  WorkflowContext,
} from "../src/lib/workflow-engine";

describe("WorkflowEngine", () => {
  let engine: WorkflowEngine;

  beforeEach(() => {
    engine = new WorkflowEngine();
  });

  describe("Initialization", () => {
    test("creates WorkflowEngine instance", () => {
      expect(engine).toBeInstanceOf(WorkflowEngine);
    });

    test("has required public methods", () => {
      expect(typeof engine.getDriverCapabilities).toBe("function");
      expect(typeof engine.previewPrompt).toBe("function");
      expect(typeof engine.runStep).toBe("function");
      expect(typeof engine.getDriverStatus).toBe("function");
      expect(typeof engine.toggleDriver).toBe("function");
    });
  });

  describe("Driver Capabilities", () => {
    test("returns correct driver capabilities", () => {
      const capabilities = engine.getDriverCapabilities();

      expect(capabilities.gpt).toContain("logic-audit");
      expect(capabilities.gpt).toContain("creative-polish");
      expect(capabilities.claude).toContain("long-form-narrative");
      expect(capabilities.claude).toContain("logical-reasoning");
      expect(capabilities.gemini).toContain("long-context");
      expect(capabilities.gemini).toContain("multimodal");
      expect(capabilities.grok).toContain("math");
      expect(capabilities.grok).toContain("live-web");
    });
  });

  describe("Context Management", () => {
    test("stores step outputs correctly", () => {
      const context: WorkflowContext = {
        stepOutputs: [],
        clarificationHistory: {},
      };

      engine.storeStepOutput(context, 0, "First step output");
      engine.storeStepOutput(context, 2, "Third step output");

      expect(context.stepOutputs[0]).toBe("First step output");
      expect(context.stepOutputs[1]).toBe(""); // Auto-filled empty
      expect(context.stepOutputs[2]).toBe("Third step output");
    });

    test("stores clarifications correctly", () => {
      const context: WorkflowContext = {
        stepOutputs: [],
        clarificationHistory: {},
      };

      engine.storeClarification(context, "step1", "User clarification");

      expect(context.clarificationHistory).toBeDefined();
      expect(context.clarificationHistory!["step1"]).toBe("User clarification");
    });
  });

  describe("Prompt Rendering", () => {
    test("renders basic templates", () => {
      const context: WorkflowContext = {
        stepOutputs: ["Previous output"],
        userInput: "User input",
        clarificationHistory: {},
      };

      const template = "{{userInput}} - {{step1}}";
      const preview = engine.previewPrompt(template, context);

      expect(preview).toContain("User input");
      expect(preview).toContain("Previous output");
    });

    test("handles clarification placeholders", () => {
      const context: WorkflowContext = {
        stepOutputs: [],
        userInput: "User input",
        clarificationHistory: {
          step1: "User provided clarification",
        },
      };

      const template = "{{userInput}} {{clarification:step1}}";
      const preview = engine.previewPrompt(template, context);

      expect(preview).toContain("User input");
      expect(preview).toContain("User provided clarification");
    });

    test("handles missing template variables gracefully", () => {
      const context: WorkflowContext = {
        stepOutputs: [],
        clarificationHistory: {},
      };

      const template = "{{userInput}} - {{step1}} - {{clarification:missing}}";
      const preview = engine.previewPrompt(template, context);

      // Should contain placeholders for missing variables
      expect(preview).toContain("{{userInput}}");
      expect(preview).toContain("{{step1}}");
      // Missing clarification should be removed
      expect(preview).not.toContain("{{clarification:missing}}");
    });
  });

  describe("Driver Status", () => {
    test("can get driver status", () => {
      const status = engine.getDriverStatus();

      expect(typeof status.gpt).toBe("boolean");
      expect(typeof status.claude).toBe("boolean");
      expect(typeof status.gemini).toBe("boolean");
      expect(typeof status.grok).toBe("boolean");
    });

    test("can toggle driver status", () => {
      engine.toggleDriver("gpt", false);
      const status = engine.getDriverStatus();
      expect(status.gpt).toBe(false);

      engine.toggleDriver("gpt", true);
      const statusAfter = engine.getDriverStatus();
      expect(statusAfter.gpt).toBe(true);
    });
  });
});
