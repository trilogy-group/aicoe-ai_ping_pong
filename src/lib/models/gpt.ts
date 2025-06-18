/** src/lib/models/gpt.ts */
import OpenAI from "openai";
import { StreamChunk, RetryableError, FatalError, LLMDriver } from "./types";

let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (typeof process === "undefined" || !process.env?.OPENAI_API_KEY) {
    throw new FatalError(
      "OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file."
    );
  }

  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return openai;
}

export const gptCall: LLMDriver["call"] = async (
  prompt: string,
  ctx: string[] = []
) => {
  try {
    const client = getOpenAIClient();

    console.log(`🤖 GPT streaming request (${prompt.length} chars)`);

    const stream = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful AI assistant focused on providing practical, actionable responses with accurate, up-to-date information. Stay focused on the user's specific request and avoid generic business language. Be engaging and creative while remaining helpful and direct.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 4096,
      temperature: 0.7,
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
    // Handle OpenAI specific errors
    if (error.status === 429) {
      throw new RetryableError("OpenAI API rate limit exceeded");
    } else if (error.status >= 500) {
      throw new RetryableError(`OpenAI server error: ${error.status}`);
    } else if (error.status === 401 || error.status === 403) {
      throw new FatalError("OpenAI API key invalid or access denied");
    } else {
      throw new FatalError(`OpenAI API error: ${error.message}`);
    }
  }
};

export const gptMeta = {
  name: "gpt" as const,
  limit: 128000,
  caps: [
    "logic-audit",
    "creative-polish",
    "fact-checking",
    "json-output",
    "consistency",
  ],
};
