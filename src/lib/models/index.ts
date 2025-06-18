/** src/lib/models/index.ts */
// Re-export types from the types file
export type { LLM, LLMDriver, StreamChunk } from "./types";
export { RetryableError, FatalError } from "./types";

// Note: Individual model implementations are now handled by the API server
// The frontend uses the /api/run endpoint for all model interactions

export class ClarificationNeeded extends Error {
  constructor(public schema: any, message = "Clarification required") {
    super(message);
    this.name = "ClarificationNeeded";
  }
}

// Driver implementations (to be imported from individual files)
export { grokCall, grokMeta } from "./grok";
export { geminiCall, geminiMeta } from "./gemini";
export { claudeCall, claudeMeta } from "./claude";
export { gptCall, gptMeta } from "./gpt";

// Import driver implementations
import { grokCall, grokMeta } from "./grok";
import { geminiCall, geminiMeta } from "./gemini";
import { claudeCall, claudeMeta } from "./claude";
import { gptCall, gptMeta } from "./gpt";
import type { LLM, LLMDriver } from "./types";

// Export complete drivers object with unified interface
export const drivers: Record<LLM, LLMDriver> = {
  gpt: {
    name: gptMeta.name,
    call: gptCall,
    limit: gptMeta.limit,
    caps: gptMeta.caps,
  },
  claude: {
    name: claudeMeta.name,
    call: claudeCall,
    limit: claudeMeta.limit,
    caps: claudeMeta.caps,
  },
  gemini: {
    name: geminiMeta.name,
    call: geminiCall,
    limit: geminiMeta.limit,
    caps: geminiMeta.caps,
  },
  grok: {
    name: grokMeta.name,
    call: grokCall,
    limit: grokMeta.limit,
    caps: grokMeta.caps,
  },
};
