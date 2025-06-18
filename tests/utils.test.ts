// Mock the models import before other imports
jest.mock("../src/lib/models", () => ({
  drivers: {
    gpt: {
      name: "gpt",
      limit: 128000,
      caps: ["logic-audit", "creative-polish"],
    },
    claude: {
      name: "claude",
      limit: 200000,
      caps: ["long-form-narrative", "logical-reasoning"],
    },
    gemini: {
      name: "gemini",
      limit: 1000000,
      caps: ["long-context", "multimodal"],
    },
    grok: { name: "grok", limit: 1000000, caps: ["math", "live-web"] },
  },
}));

import {
  truncateForModel,
  intelligentTruncate,
  getModelContextInfo,
} from "../src/utils/tokenTruncation";
import { wrapStream, wrapDriverStream } from "../src/utils/streamWrapper";
import {
  streamToState,
  handleDriverStream,
  parseStreamedResponse,
} from "../src/utils/streamToState";

describe("Token Truncation Utils", () => {
  describe("truncateForModel", () => {
    test("returns prompt unchanged when under limit", () => {
      const shortPrompt = "This is a short prompt";
      const result = truncateForModel(shortPrompt, "gpt");

      expect(result.wasTruncated).toBe(false);
      expect(result.truncatedPrompt).toBe(shortPrompt);
      expect(result.truncationPercent).toBe(0);
    });

    test("truncates long prompts appropriately", () => {
      const longPrompt = "A".repeat(500000); // Very long prompt
      const result = truncateForModel(longPrompt, "gpt");

      expect(result.wasTruncated).toBe(true);
      expect(result.truncatedPrompt.length).toBeLessThan(longPrompt.length);
      expect(result.truncationPercent).toBeGreaterThan(0);
      expect(result.originalTokens).toBeGreaterThan(result.truncatedTokens);
    });

    test("respects different model limits", () => {
      // Create a prompt that's guaranteed to trigger truncation for GPT but not Gemini
      // GPT limit: ~128K tokens, Gemini limit: ~1M tokens
      // Rough estimate: 1 token ≈ 4 characters, so 600K characters ≈ 150K tokens (exceeds GPT limit)
      const largePrompt = "B".repeat(600000); // 600K characters should exceed GPT's 128K token limit

      const gptResult = truncateForModel(largePrompt, "gpt");
      const geminiResult = truncateForModel(largePrompt, "gemini");

      // GPT has 128K token limit, should definitely truncate a 600K character prompt
      // Gemini has 1M token limit, should not truncate this prompt
      expect(gptResult.wasTruncated).toBe(true);
      expect(geminiResult.wasTruncated).toBe(false);
    });
  });

  describe("intelligentTruncate", () => {
    test("preserves specified sections", () => {
      const longPrompt = "HEADER\n" + "A".repeat(500000) + "\nFOOTER";
      const preserveSections = ["HEADER", "FOOTER"];

      const result = intelligentTruncate(longPrompt, "gpt", preserveSections);

      expect(result.truncatedPrompt).toContain("HEADER");
      expect(result.truncatedPrompt).toContain("FOOTER");
      expect(result.wasTruncated).toBe(true);
    });
  });

  describe("getModelContextInfo", () => {
    test("returns correct model limits", () => {
      const info = getModelContextInfo();

      expect(info.gpt.limit).toBe(128000);
      expect(info.claude.limit).toBe(200000);
      expect(info.gemini.limit).toBe(1000000);
      expect(info.grok.limit).toBe(1000000);

      expect(info.gpt.description).toContain("128K");
      expect(info.gemini.description).toContain("1M");
    });
  });
});

describe("Stream Utils", () => {
  describe("wrapStream", () => {
    test("adds start and end events to stream", async () => {
      const originalStream = testUtils.createMockStream([
        { type: "token", content: "test content" },
      ]);

      const wrappedStream = wrapStream(originalStream);
      const reader = wrappedStream.getReader();
      const decoder = new TextDecoder();

      const events: any[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            events.push(JSON.parse(line));
          } catch (e) {
            // Skip non-JSON lines
          }
        }
      }

      expect(events[0]).toEqual({ type: "start" });
      expect(events[events.length - 1]).toEqual({ type: "end" });
      expect(events.some((e) => e.type === "token")).toBe(true);
    });
  });

  describe("wrapDriverStream", () => {
    test("handles driver stream with error recovery", async () => {
      const streamPromise = Promise.resolve(
        testUtils.createMockStream([{ type: "token", content: "success" }])
      );

      const wrappedStream = wrapDriverStream("gpt", streamPromise);
      const reader = wrappedStream.getReader();
      const decoder = new TextDecoder();

      let hasStart = false;
      let hasEnd = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const event = JSON.parse(line);
            if (event.type === "start") hasStart = true;
            if (event.type === "end") hasEnd = true;
          } catch (e) {
            // Skip non-JSON
          }
        }
      }

      expect(hasStart).toBe(true);
      expect(hasEnd).toBe(true);
    });
  });
});

describe("Stream State Utils", () => {
  describe("parseStreamedResponse", () => {
    test("parses valid JSON response", () => {
      const jsonResponse = '{"success": true, "data": "test"}';
      const result = parseStreamedResponse(jsonResponse);

      expect(result.success).toBe(true);
      expect(result.data).toBe("test");
    });

    test("handles plain text response", () => {
      const textResponse = "Plain text response";
      const result = parseStreamedResponse(textResponse);

      expect(result.success).toBe(true);
      expect(result.data).toBe("Plain text response");
    });
  });

  describe("handleDriverStream", () => {
    test("processes stream events correctly", async () => {
      const mockStream = testUtils.createMockStream([
        { type: "start" },
        { type: "token", content: "Hello" },
        { type: "token", content: " World" },
        { type: "end" },
      ]);

      const streamPromise = Promise.resolve(mockStream);

      let startCalled = false;
      let completeCalled = false;
      let finalContent = "";

      const result = await handleDriverStream(streamPromise, {
        onStart: () => {
          startCalled = true;
        },
        onChunk: (chunk) => {
          finalContent += chunk;
        },
        onComplete: (content) => {
          completeCalled = true;
          expect(content).toBe("Hello World");
        },
        driverName: "test",
      });

      expect(startCalled).toBe(true);
      expect(completeCalled).toBe(true);
      expect(result).toBe("Hello World");
      expect(finalContent).toBe("Hello World");
    });

    test("handles stream errors", async () => {
      const mockStream = testUtils.createMockStream([
        { type: "start" },
        { type: "error", message: "Test error" },
      ]);

      const streamPromise = Promise.resolve(mockStream);

      let errorCalled = false;

      try {
        await handleDriverStream(streamPromise, {
          onError: (error) => {
            errorCalled = true;
            expect(error.message).toBe("Test error");
          },
          driverName: "test",
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("Test error");
      }

      expect(errorCalled).toBe(true);
    });
  });
});
