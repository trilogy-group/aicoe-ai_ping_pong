/** src/lib/models/grok.ts */
import OpenAI from "openai";
import { StreamChunk, RetryableError, FatalError, LLMDriver } from "./types";

// Note: Using OpenAI client as xAI API is compatible with OpenAI interface
let grokClient: any = null;

async function getGrokClient() {
  if (typeof process === "undefined" || !process.env?.GROK_API_KEY) {
    throw new FatalError(
      "Grok API key not configured. Please add GROK_API_KEY to your .env file."
    );
  }

  if (!grokClient) {
    // Using dynamic import to avoid issues with module loading
    const { default: OpenAI } = await import("openai");
    grokClient = new OpenAI({
      apiKey: process.env.GROK_API_KEY,
      baseURL: "https://api.x.ai/v1",
    });
  }

  return grokClient;
}

export const grokCall: LLMDriver["call"] = async (
  prompt: string,
  ctx: string[] = []
) => {
  try {
    const client = await getGrokClient();

    console.log(`🧠 Grok streaming request (${prompt.length} chars)`);

    const stream = await client.chat.completions.create({
      model: "grok-3-beta-think",
      messages: [
        {
          role: "system",
          content:
            "You are Grok, an AI with real-time access to information and strong mathematical reasoning. Focus on providing current data with sources, chain-of-thought reasoning for complex problems, and include contrarian viewpoints when they exist.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 4096,
      temperature: 0.3,
      stream: true,
    });

    return new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          // Send start event
          const startChunk: StreamChunk = { type: "start" };
          controller.enqueue(encoder.encode(JSON.stringify(startChunk) + "\n"));

          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              const tokenChunk: StreamChunk = {
                type: "token",
                content: content,
              };
              controller.enqueue(
                encoder.encode(JSON.stringify(tokenChunk) + "\n")
              );
            }
          }

          // Send end event
          const endChunk: StreamChunk = { type: "end" };
          controller.enqueue(encoder.encode(JSON.stringify(endChunk) + "\n"));
          controller.close();
        } catch (error) {
          const errorChunk: StreamChunk = {
            type: "error",
            message: error instanceof Error ? error.message : "Unknown error",
          };
          controller.enqueue(encoder.encode(JSON.stringify(errorChunk) + "\n"));
          controller.close();
        }
      },
    });
  } catch (error: any) {
    if (error instanceof FatalError) {
      throw error;
    }

    // Handle xAI specific errors
    if (error.status === 429) {
      throw new RetryableError("Grok API rate limit exceeded");
    } else if (error.status >= 500) {
      throw new RetryableError(`Grok server error: ${error.status}`);
    } else if (error.status === 401 || error.status === 403) {
      throw new FatalError("Grok API key invalid or access denied");
    } else {
      throw new FatalError(`Grok API error: ${error.message}`);
    }
  }
};

export const grokMeta = {
  name: "grok" as const,
  limit: 1000000,
  caps: ["math", "live-web", "chain-of-thought", "real-time-data"],
};
