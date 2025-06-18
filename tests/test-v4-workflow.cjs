#!/usr/bin/env node

/**
 * AI Ping-Pong Studio v4 Integration Tests
 * Tests the model-agnostic orchestration core with streaming workflows
 */

require("dotenv").config();
const axios = require("axios");

const API_BASE = "http://localhost:3002";
const TEST_TIMEOUT = 30000;

// Test scenarios
const testScenarios = {
  // Happy path: GPT → Gemini → Claude → Multi-Model Validation → Final Verification
  happyPath: {
    id: "happy-path",
    scenarioId: "article",
    steps: [
      {
        id: "clarify-brief",
        model: "gpt",
        title: "Brief Clarification",
        status: "idle",
        rawPrompt: "Clarify the core goal of this request: {{userInput}}",
      },
      {
        id: "deep-research",
        model: "gemini",
        title: "Deep Research",
        status: "idle",
        rawPrompt: "Research comprehensive information about: {{step1}}",
      },
      {
        id: "logical-enhancement",
        model: "claude",
        title: "Logical Enhancement",
        status: "idle",
        rawPrompt: "Analyze and enhance the logical structure of: {{step2}}",
      },
      {
        id: "multi-model-source-validation",
        model: "all-models",
        title: "Multi-Model Source Validation",
        status: "idle",
        rawPrompt: "Validate sources across all models",
      },
      {
        id: "final-source-verification",
        model: "claude",
        title: "Final Source Verification",
        status: "idle",
        rawPrompt: "Final verification with Claude reasoning",
      },
    ],
    context: {
      userInput: "Write an article about the benefits of renewable energy",
      stepOutputs: [],
    },
  },

  // Math path: GPT → Grok → Claude → Multi-Model Validation → Final Verification
  mathPath: {
    id: "math-path",
    scenarioId: "research",
    steps: [
      {
        id: "clarify-scope",
        model: "gpt",
        title: "Scope Clarification",
        status: "idle",
        rawPrompt:
          "Define the scope of this mathematical research: {{userInput}}",
      },
      {
        id: "deep-dive-research",
        model: "grok",
        title: "STEM Research",
        status: "idle",
        rawPrompt: "Perform deep mathematical analysis on: {{step1}}",
      },
      {
        id: "logical-analysis",
        model: "claude",
        title: "Logical Analysis",
        status: "idle",
        rawPrompt: "Verify and analyze the logic of: {{step2}}",
      },
      {
        id: "multi-model-source-validation",
        model: "all-models",
        title: "Multi-Model Source Validation",
        status: "idle",
        rawPrompt: "Validate sources across all models",
      },
      {
        id: "final-source-verification",
        model: "claude",
        title: "Final Source Verification",
        status: "idle",
        rawPrompt: "Final verification with Claude reasoning",
      },
    ],
    context: {
      userInput:
        "Calculate the optimal solar panel angle for maximum energy efficiency",
      stepOutputs: [],
    },
  },

  // Source validation test with deliberate misinformation
  sourceValidationTest: {
    id: "source-validation-test",
    scenarioId: "article",
    steps: [
      {
        id: "deep-research",
        model: "gemini",
        title: "Research with Potential Issues",
        status: "idle",
        rawPrompt:
          "Research information about solar energy, but include some fictional claims like 'Solar panels can achieve 98% efficiency' and 'The fictional SolarMax 5000 is the world's best panel'",
      },
      {
        id: "multi-model-source-validation",
        model: "all-models",
        title: "Multi-Model Source Validation",
        status: "idle",
        rawPrompt: "Validate sources across all models",
      },
      {
        id: "final-source-verification",
        model: "claude",
        title: "Final Source Verification",
        status: "idle",
        rawPrompt: "Final verification with Claude reasoning",
      },
    ],
    context: {
      userInput:
        "Research solar energy with some fictional elements for testing",
      stepOutputs: [],
    },
  },

  // Grok disabled fallback test
  grokFallback: {
    id: "grok-fallback",
    scenarioId: "research",
    steps: [
      {
        id: "deep-dive-research",
        model: "grok",
        title: "Research with Fallback",
        status: "idle",
        rawPrompt: "Research current trends in: {{userInput}}",
      },
    ],
    context: {
      userInput: "AI model architectures 2024",
      stepOutputs: [],
    },
  },
};

class TestRunner {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: [],
    };
  }

  async runTest(name, testFn) {
    console.log(`\n🧪 Running test: ${name}`);
    try {
      await testFn();
      console.log(`✅ Test passed: ${name}`);
      this.results.passed++;
      this.results.tests.push({ name, status: "passed" });
    } catch (error) {
      console.error(`❌ Test failed: ${name}`);
      console.error(`   Error: ${error.message}`);
      this.results.failed++;
      this.results.tests.push({ name, status: "failed", error: error.message });
    }
  }

  async checkServerHealth() {
    const response = await axios.get(`${API_BASE}/api/health`, {
      timeout: 5000,
    });

    if (response.data.status !== "ok") {
      throw new Error("Server health check failed");
    }

    console.log(`✅ Server healthy - v${response.data.version}`);
    return response.data;
  }

  async testDriverManagement() {
    // Get initial driver status
    const initialStatus = await axios.get(`${API_BASE}/api/drivers`);
    console.log(`📊 Initial drivers:`, initialStatus.data.drivers);

    // Toggle Grok off
    await axios.post(`${API_BASE}/api/drivers/toggle`, {
      driver: "grok",
      enabled: false,
    });

    const disabledStatus = await axios.get(`${API_BASE}/api/drivers`);
    if (disabledStatus.data.drivers.grok !== false) {
      throw new Error("Failed to disable Grok driver");
    }

    // Toggle Grok back on
    await axios.post(`${API_BASE}/api/drivers/toggle`, {
      driver: "grok",
      enabled: true,
    });

    const enabledStatus = await axios.get(`${API_BASE}/api/drivers`);
    if (enabledStatus.data.drivers.grok !== true) {
      throw new Error("Failed to enable Grok driver");
    }

    console.log(`✅ Driver management working correctly`);
  }

  async testWorkflow(scenario) {
    console.log(`📝 Testing workflow: ${scenario.id}`);

    for (let stepIndex = 0; stepIndex < scenario.steps.length; stepIndex++) {
      const step = scenario.steps[stepIndex];

      console.log(
        `🔄 Executing step ${stepIndex + 1}: ${step.title} (${step.model})`
      );

      const startTime = Date.now();

      const response = await axios.post(
        `${API_BASE}/api/run`,
        {
          step,
          context: scenario.context,
          scenarioId: scenario.scenarioId,
        },
        {
          timeout: TEST_TIMEOUT,
        }
      );

      if (response.status !== 200 || !response.data.success) {
        throw new Error(
          `Step ${step.id} failed: ${response.data.error || "Unknown error"}`
        );
      }

      const duration = Date.now() - startTime;
      const output = response.data.result;

      if (!output || output.trim().length < 10) {
        throw new Error(`Step ${step.id} produced insufficient output`);
      }

      // Store output for next step
      scenario.context.stepOutputs[stepIndex] = output;

      console.log(
        `✅ Step completed in ${duration}ms (${output.length} chars)`
      );
    }
  }

  async testFallbackLogic() {
    console.log(`🔄 Testing fallback logic - disabling Grok`);

    // Disable Grok
    await axios.post(`${API_BASE}/api/drivers/toggle`, {
      driver: "grok",
      enabled: false,
    });

    // Test that Grok requests fall back to Gemini
    const scenario = testScenarios.grokFallback;
    const step = scenario.steps[0];

    const response = await axios.post(
      `${API_BASE}/api/run`,
      {
        step,
        context: scenario.context,
        scenarioId: scenario.scenarioId,
      },
      {
        timeout: TEST_TIMEOUT,
      }
    );

    if (response.status !== 200 || !response.data.success) {
      throw new Error("Fallback test failed");
    }

    // Re-enable Grok
    await axios.post(`${API_BASE}/api/drivers/toggle`, {
      driver: "grok",
      enabled: true,
    });

    console.log(`✅ Fallback logic working correctly`);
  }

  async testLegacyApiDeprecation() {
    try {
      await axios.post(`${API_BASE}/api/stream`, {
        step: { id: "test", model: "gpt" },
        context: { userInput: "test" },
      });
      throw new Error("Streaming API should be deprecated");
    } catch (error) {
      if (error.response?.status === 410) {
        console.log(`✅ Streaming API correctly deprecated`);
      } else {
        throw error;
      }
    }
  }

  printResults() {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🧪 TEST RESULTS`);
    console.log(`${"=".repeat(60)}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📊 Total:  ${this.results.passed + this.results.failed}`);

    if (this.results.failed > 0) {
      console.log(`\n❌ Failed tests:`);
      this.results.tests
        .filter((t) => t.status === "failed")
        .forEach((t) => console.log(`   - ${t.name}: ${t.error}`));
    }

    const success = this.results.failed === 0;
    console.log(
      `\n${success ? "🎉 ALL TESTS PASSED!" : "💥 SOME TESTS FAILED"}`
    );
    return success;
  }
}

async function main() {
  console.log(`🚀 AI Ping-Pong Studio v4 Integration Tests`);
  console.log(`📡 Testing server at: ${API_BASE}`);

  const runner = new TestRunner();

  // Core functionality tests
  await runner.runTest("Server Health Check", () => runner.checkServerHealth());
  await runner.runTest("Driver Management", () =>
    runner.testDriverManagement()
  );
  await runner.runTest("Streaming API Deprecation", () =>
    runner.testLegacyApiDeprecation()
  );

  // Workflow tests
  await runner.runTest("Happy Path (GPT→Gemini→Claude→Validation)", () =>
    runner.testWorkflow(testScenarios.happyPath)
  );

  await runner.runTest("Math Path (GPT→Grok→Claude→Validation)", () =>
    runner.testWorkflow(testScenarios.mathPath)
  );

  await runner.runTest("Source Validation Test", () =>
    runner.testWorkflow(testScenarios.sourceValidationTest)
  );

  await runner.runTest("Grok Disabled Fallback", () =>
    runner.testFallbackLogic()
  );

  const success = runner.printResults();
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Test runner failed:", error.message);
    process.exit(1);
  });
}

module.exports = { TestRunner, testScenarios };
