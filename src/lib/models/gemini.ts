/** src/lib/models/gemini.ts */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { StreamChunk, RetryableError, FatalError, LLMDriver } from "./types";

let geminiClient: any = null;

async function getGeminiClient() {
  if (typeof process === "undefined" || !process.env?.GEMINI_API_KEY) {
    throw new FatalError(
      "Gemini API key not configured. Please add GEMINI_API_KEY to your .env file."
    );
  }

  if (!geminiClient) {
    // Using dynamic import for Google Generative AI
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  return geminiClient;
}

export const geminiCall: LLMDriver["call"] = async (
  prompt: string,
  ctx: string[] = []
) => {
  try {
    const client = await getGeminiClient();
    const model = client.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        topK: 40,
        topP: 0.95,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
    });

    console.log(`💎 Gemini streaming request (${prompt.length} chars)`);

    const fullPrompt = `You are Gemini, Google's AI with massive context capabilities and multimodal understanding. Focus on providing current, well-researched information that directly addresses the user's specific request. Stay practical and avoid generic corporate responses.

${prompt}`;

    // Use native generateContentStream
    const result = await model.generateContentStream(fullPrompt);

    return new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          // Send start event
          const startChunk: StreamChunk = { type: "start" };
          controller.enqueue(encoder.encode(JSON.stringify(startChunk) + "\n"));

          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              const tokenChunk: StreamChunk = {
                type: "token",
                content: text,
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
    // Handle Gemini-specific errors
    if (error.message?.includes("RATE_LIMIT_EXCEEDED")) {
      throw new RetryableError("Gemini API rate limit exceeded");
    } else if (error.message?.includes("QUOTA_EXCEEDED")) {
      throw new RetryableError("Gemini API quota exceeded");
    } else if (error.message?.includes("INVALID_API_KEY")) {
      throw new FatalError("Gemini API key invalid or access denied");
    } else if (error.message?.includes("BLOCKED")) {
      throw new FatalError("Content blocked by Gemini safety filters");
    } else {
      throw new FatalError(`Gemini API error: ${error.message}`);
    }
  }
};

export const geminiMeta = {
  name: "gemini" as const,
  limit: 1000000, // 1M token context
  caps: [
    "long-context",
    "multimodal",
    "document-analysis",
    "high-volume-research",
  ],
};
