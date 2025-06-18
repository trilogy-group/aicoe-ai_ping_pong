/** src/lib/models/types.ts - Shared types without circular dependencies */

export interface StreamChunk {
  type: "start" | "token" | "end" | "error";
  content?: string;
  message?: string;
}

export interface LLMDriver {
  name: string;
  call: (prompt: string, ctx?: string[]) => Promise<ReadableStream>;
  limit: number;
  caps: string[];
}

export class RetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RetryableError";
  }
}

export class FatalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FatalError";
  }
}

export type LLM = "gpt" | "claude" | "gemini" | "grok";
