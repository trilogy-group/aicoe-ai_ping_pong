// Test driver metadata directly without circular dependencies
describe("Driver Metadata", () => {
  test("GPT driver metadata", async () => {
    // Dynamic import to avoid circular dependency issues
    const gptModule = await import("../src/lib/models/gpt");
    const { gptMeta } = gptModule;

    expect(gptMeta.name).toBe("gpt");
    expect(gptMeta.limit).toBe(128000);
    expect(gptMeta.caps).toContain("logic-audit");
    expect(gptMeta.caps).toContain("creative-polish");
  });

  test("Claude driver metadata", async () => {
    const claudeModule = await import("../src/lib/models/claude");
    const { claudeMeta } = claudeModule;

    expect(claudeMeta.name).toBe("claude");
    expect(claudeMeta.limit).toBe(200000);
    expect(claudeMeta.caps).toContain("long-form-narrative");
    expect(claudeMeta.caps).toContain("logical-reasoning");
  });

  test("Gemini driver metadata", async () => {
    const geminiModule = await import("../src/lib/models/gemini");
    const { geminiMeta } = geminiModule;

    expect(geminiMeta.name).toBe("gemini");
    expect(geminiMeta.limit).toBe(1000000);
    expect(geminiMeta.caps).toContain("long-context");
    expect(geminiMeta.caps).toContain("multimodal");
  });

  test("Grok driver metadata", async () => {
    const grokModule = await import("../src/lib/models/grok");
    const { grokMeta } = grokModule;

    expect(grokMeta.name).toBe("grok");
    expect(grokMeta.limit).toBe(1000000);
    expect(grokMeta.caps).toContain("math");
    expect(grokMeta.caps).toContain("live-web");
  });
});

describe("Driver Interface Compliance", () => {
  const driverNames = ["gpt", "claude", "gemini", "grok"] as const;

  test.each(driverNames)(
    "%s driver has required call function",
    async (driverName) => {
      const driverModule = await import(`../src/lib/models/${driverName}`);
      const callFunction = driverModule[`${driverName}Call`];
      const metaObject = driverModule[`${driverName}Meta`];

      expect(typeof callFunction).toBe("function");
      expect(metaObject).toBeDefined();
      expect(metaObject.name).toBe(driverName);
      expect(typeof metaObject.limit).toBe("number");
      expect(metaObject.limit).toBeGreaterThan(0);
      expect(Array.isArray(metaObject.caps)).toBe(true);
      expect(metaObject.caps.length).toBeGreaterThan(0);
    }
  );
});

// Integration tests with real API calls - only run if API keys are available
describe("Driver API Integration", () => {
  const apiKeyMap = {
    gpt: "OPENAI_API_KEY",
    claude: "ANTHROPIC_API_KEY",
    gemini: "GOOGLE_API_KEY",
    grok: "XAI_API_KEY",
  } as const;

  const drivers = ["gpt", "claude", "gemini", "grok"] as const;

  test.each(drivers)(
    "%s driver returns ReadableStream (integration)",
    async (driverName) => {
      if (!testUtils.hasApiKey(apiKeyMap[driverName])) {
        console.log(
          `⏭️  Skipping ${driverName} integration test - missing API key`
        );
        return;
      }

      try {
        const driverModule = await import(`../src/lib/models/${driverName}`);
        const driverCall = driverModule[`${driverName}Call`];

        const streamPromise = driverCall("Test prompt for integration", []);

        expect(streamPromise).toBeInstanceOf(Promise);
        const stream = await streamPromise;
        expect(stream).toBeInstanceOf(ReadableStream);

        // Read a few chunks to verify it's working
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let chunksRead = 0;

        while (chunksRead < 3) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          expect(typeof chunk).toBe("string");
          chunksRead++;
        }

        reader.releaseLock();
      } catch (error) {
        // Handle API errors gracefully in tests
        if (error instanceof Error && error.message.includes("API key")) {
          console.log(
            `⏭️  Skipping ${driverName} - API key issue: ${error.message}`
          );
          return;
        }
        throw error;
      }
    }
  );

  test("all drivers handle missing API keys appropriately", async () => {
    // This test verifies error handling without making actual API calls
    const originalEnv = process.env;

    try {
      // Temporarily remove all API keys
      process.env = { ...originalEnv };
      delete process.env.OPENAI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.GOOGLE_API_KEY;
      delete process.env.XAI_API_KEY;

      for (const driverName of drivers) {
        try {
          const driverModule = await import(`../src/lib/models/${driverName}`);
          const driverCall = driverModule[`${driverName}Call`];

          await driverCall("test", []);
          fail(
            `Expected ${driverName} driver to throw error for missing API key`
          );
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toMatch(/API key|not configured/i);
        }
      }
    } finally {
      // Restore original environment
      process.env = originalEnv;
    }
  });
});
