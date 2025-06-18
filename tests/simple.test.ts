describe("Simple Tests", () => {
  test("Jest is working", () => {
    expect(1 + 1).toBe(2);
  });

  test("Global test utils are available", () => {
    expect(testUtils).toBeDefined();
    expect(typeof testUtils.hasApiKey).toBe("function");
    expect(typeof testUtils.createMockStream).toBe("function");
  });

  test("Environment variables work", () => {
    expect(typeof process.env.NODE_ENV).toBe("string");
  });

  test("Mock stream creation", async () => {
    const mockStream = testUtils.createMockStream([
      { type: "start" },
      { type: "token", content: "test" },
      { type: "end" },
    ]);

    expect(mockStream).toBeInstanceOf(ReadableStream);

    const reader = mockStream.getReader();
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

    expect(events).toHaveLength(3);
    expect(events[0].type).toBe("start");
    expect(events[1].type).toBe("token");
    expect(events[2].type).toBe("end");
  });
});
