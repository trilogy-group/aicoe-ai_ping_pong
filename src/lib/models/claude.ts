/** src/lib/models/claude.ts */
import Anthropic from "@anthropic-ai/sdk";
import { StreamChunk, RetryableError, FatalError, LLMDriver } from "./types";

let anthropicClient: any = null;

async function getAnthropicClient() {
  if (typeof process === "undefined" || !process.env?.ANTHROPIC_API_KEY) {
    throw new FatalError(
      "Anthropic API key not configured. Please add ANTHROPIC_API_KEY to your .env file."
    );
  }

  if (!anthropicClient) {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  return anthropicClient;
}

export const claudeCall: LLMDriver["call"] = async (
  prompt: string,
  ctx: string[] = []
) => {
  try {
    const client = await getAnthropicClient();
    console.log(`🧠 Claude request (${prompt.length} chars)`);

    // Determine system prompt
    const isFinalArticleStep =
      prompt.includes("ultimate-final-article") ||
      prompt.includes(
        "DELIVER ONLY the complete, final, publication-ready article content"
      ) ||
      prompt.includes("Begin the article immediately");

    const defaultSystemPrompt =
      "You are Claude, an AI assistant created by Anthropic. You excel at long-form narrative, structural analysis, and logical reasoning. " +
      "When tackling complex requests, think step by step and show your reasoning as analysis, followed by a clear answer.";

    const finalArticlePrompt =
      "You are Claude, a master content creator. For final article production: DO NOT provide thinking, analysis, or meta-commentary. " +
      "DELIVER ONLY the complete, final article content. Begin immediately with the article title and content.";

    const systemPrompt = isFinalArticleStep
      ? finalArticlePrompt
      : defaultSystemPrompt;

    // Send request as a readable stream
    const stream = (await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
      stream: true,
    })) as AsyncIterable<StreamChunk>;

    let lastMessage = "";
    // Read all chunks, update lastMessage on each
    for await (const chunk of stream) {
      // Each chunk may have a 'text' property with incremental content
      if (typeof (chunk as any).text === "string") {
        lastMessage = (chunk as any).text;
      }
    }

    if (!lastMessage) {
      throw new FatalError("No content received from Claude stream");
    }

    console.log(
      "🧠 Claude final message:",
      lastMessage.substring(0, 100) + "..."
    );

    // Convert string to ReadableStream of token events to match driver interface
    const encoder = new TextEncoder();
    return new ReadableStream({
      start(controller) {
        // start event
        controller.enqueue(
          encoder.encode(JSON.stringify({ type: "start" }) + "\n")
        );
        // single token with full message
        controller.enqueue(
          encoder.encode(
            JSON.stringify({ type: "token", content: lastMessage }) + "\n"
          )
        );
        // end event
        controller.enqueue(
          encoder.encode(JSON.stringify({ type: "end" }) + "\n")
        );
        controller.close();
      },
    });
  } catch (error: any) {
    if (error.status === 429) {
      throw new RetryableError("Claude API rate limit exceeded");
    } else if (error.status >= 500) {
      throw new RetryableError(`Claude server error: ${error.status}`);
    } else if (error.status === 401 || error.status === 403) {
      throw new FatalError("Claude API key invalid or access denied");
    } else {
      throw new FatalError(`Claude API error: ${error.message}`);
    }
  }
};

export const claudeMeta = {
  name: "claude" as const,
  limit: 200000,
  caps: [
    "long-form-narrative",
    "structural-analysis",
    "logical-reasoning",
    "comprehensive-review",
    "human-like-voice",
  ],
};
