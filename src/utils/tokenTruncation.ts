/** src/utils/tokenTruncation.ts */
import { LLM, drivers } from "../lib/models";

/**
 * Rough token estimation for English text
 * More accurate than character count, less overhead than full tokenization
 */
function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English text
  // This is a conservative estimate to ensure we stay under limits
  return Math.ceil(text.length / 3.5);
}

/**
 * Truncate prompt to fit within model's context limit
 * Phase 5.1: Token-safe truncation with observability
 */
export function truncateForModel(
  prompt: string,
  modelName: LLM
): {
  truncatedPrompt: string;
  originalTokens: number;
  truncatedTokens: number;
  truncationPercent: number;
  wasTruncated: boolean;
} {
  const driver = drivers[modelName];
  const limit = driver.limit;

  const originalTokens = estimateTokens(prompt);

  // If already under limit, return as-is
  if (originalTokens <= limit) {
    return {
      truncatedPrompt: prompt,
      originalTokens,
      truncatedTokens: originalTokens,
      truncationPercent: 0,
      wasTruncated: false,
    };
  }

  // Calculate target character count (with 10% safety margin)
  const safetyMargin = 0.9;
  const targetTokens = Math.floor(limit * safetyMargin);
  const targetCharacters = Math.floor(targetTokens * 3.5);

  // Truncate intelligently - prefer to cut from middle to preserve context
  let truncatedPrompt: string;

  if (prompt.length > targetCharacters) {
    const startChars = Math.floor(targetCharacters * 0.3); // 30% from start
    const endChars = Math.floor(targetCharacters * 0.3); // 30% from end

    const start = prompt.substring(0, startChars);
    const end = prompt.substring(prompt.length - endChars);

    truncatedPrompt =
      start +
      `\n\n[... content truncated for ${modelName.toUpperCase()} context limit ...]\n\n` +
      end;
  } else {
    truncatedPrompt = prompt.substring(0, targetCharacters);
  }

  const truncatedTokens = estimateTokens(truncatedPrompt);
  const truncationPercent = Math.round(
    ((originalTokens - truncatedTokens) / originalTokens) * 100
  );

  // Log for observability (Phase 5.3)
  if (truncationPercent > 0) {
    console.warn(
      `⚠️ Prompt truncated for ${modelName.toUpperCase()}: ${originalTokens} → ${truncatedTokens} tokens (${truncationPercent}% reduction)`
    );
  }

  return {
    truncatedPrompt,
    originalTokens,
    truncatedTokens,
    truncationPercent,
    wasTruncated: true,
  };
}

/**
 * Smart truncation that preserves important sections
 */
export function intelligentTruncate(
  prompt: string,
  modelName: LLM,
  preserveSections: string[] = []
): {
  truncatedPrompt: string;
  originalTokens: number;
  truncatedTokens: number;
  truncationPercent: number;
  wasTruncated: boolean;
} {
  const driver = drivers[modelName];
  const limit = driver.limit;
  const originalTokens = estimateTokens(prompt);

  if (originalTokens <= limit) {
    return {
      truncatedPrompt: prompt,
      originalTokens,
      truncatedTokens: originalTokens,
      truncationPercent: 0,
      wasTruncated: false,
    };
  }

  // Calculate preserved content size
  const preservedContent = preserveSections.join("\n\n");
  const preservedTokens = estimateTokens(preservedContent);

  // Ensure preserved content fits within limit
  if (preservedTokens >= limit * 0.8) {
    console.warn(
      `⚠️ Preserved sections too large for ${modelName}, falling back to basic truncation`
    );
    return truncateForModel(prompt, modelName);
  }

  // Truncate non-preserved content
  const targetTokens = Math.floor(limit * 0.9); // 10% safety margin
  const availableTokens = targetTokens - preservedTokens;
  const availableChars = Math.floor(availableTokens * 3.5);

  // Find sections to truncate
  let workingPrompt = prompt;

  // Remove preserved sections temporarily
  preserveSections.forEach((section) => {
    workingPrompt = workingPrompt.replace(section, "");
  });

  // Truncate remaining content
  if (workingPrompt.length > availableChars) {
    workingPrompt =
      workingPrompt.substring(0, availableChars) +
      `\n[... truncated for ${modelName.toUpperCase()} limit ...]`;
  }

  // Reassemble with preserved sections
  const truncatedPrompt = preservedContent + "\n\n" + workingPrompt;
  const truncatedTokens = estimateTokens(truncatedPrompt);
  const truncationPercent = Math.round(
    ((originalTokens - truncatedTokens) / originalTokens) * 100
  );

  console.log(
    `🎯 Smart truncation for ${modelName.toUpperCase()}: ${originalTokens} → ${truncatedTokens} tokens (${truncationPercent}% reduction, preserved ${
      preserveSections.length
    } sections)`
  );

  return {
    truncatedPrompt,
    originalTokens,
    truncatedTokens,
    truncationPercent,
    wasTruncated: true,
  };
}

/**
 * Get model context information for UI display
 */
export function getModelContextInfo(): Record<
  LLM,
  { limit: number; description: string }
> {
  return {
    gpt: {
      limit: drivers.gpt.limit,
      description: "128K tokens - Good for most tasks",
    },
    claude: {
      limit: drivers.claude.limit,
      description: "200K tokens - Excellent for long documents",
    },
    gemini: {
      limit: drivers.gemini.limit,
      description: "1M tokens - Massive context for research",
    },
    grok: {
      limit: drivers.grok.limit,
      description: "1M tokens - Real-time data analysis",
    },
  };
}
