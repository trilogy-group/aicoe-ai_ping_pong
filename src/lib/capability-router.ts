import { LLM, drivers } from "./models";
import modelsConfig from "./models.json";

export interface CapabilityRequirement {
  tags: string[];
  prioritizeBy?: "cost" | "latency" | "context" | "accuracy";
}

export interface DriverMetadata {
  name: LLM;
  caps: string[];
  limit: number;
  costTier: "low" | "medium" | "high";
  latencyMs50p: number;
  accuracyScore: number;
}

/**
 * Enhanced driver metadata with performance characteristics
 */
export const driverMetadata: Record<LLM, DriverMetadata> = {
  gpt: {
    name: "gpt",
    caps: [
      "logic_audit",
      "creative_polish",
      "fact_checking",
      "json_output",
      "human-like-voice",
      "long-form-narrative",
    ],
    limit: 128000,
    costTier: "medium",
    latencyMs50p: 800,
    accuracyScore: 9.2,
  },
  claude: {
    name: "claude",
    caps: [
      "long_form_narrative",
      "structural_analysis",
      "logical_reasoning",
      "source_verification",
      "logic-audit",
      "fact-checking",
      "comprehensive-review",
    ],
    limit: 200000,
    costTier: "medium",
    latencyMs50p: 1200,
    accuracyScore: 9.4,
  },
  gemini: {
    name: "gemini",
    caps: [
      "high_volume_research",
      "multimodal_rag",
      "document_analysis",
      "long_context",
      "high-context-analysis",
      "comprehensive-review",
      "document-analysis",
      "fact-checking",
      "source-verification",
    ],
    limit: 1000000,
    costTier: "low",
    latencyMs50p: 1500,
    accuracyScore: 8.8,
  },
  grok: {
    name: "grok",
    caps: [
      "stem_math_reasoning",
      "real_time_data",
      "live_web",
      "source_validation",
      "live-web",
      "real-time-data",
      "fact-checking",
      "high-volume-research",
    ],
    limit: 1000000,
    costTier: "high",
    latencyMs50p: 2000,
    accuracyScore: 8.6,
  },
};

/**
 * Cost scoring (lower is better)
 */
const getCostScore = (tier: string): number => {
  switch (tier) {
    case "low":
      return 1;
    case "medium":
      return 2;
    case "high":
      return 3;
    default:
      return 2;
  }
};

/**
 * Intelligent capability-aware driver selection
 * This is the core "novelty" that transforms static routing into adaptive orchestration
 */
export function selectOptimalDriver(
  requirement: CapabilityRequirement,
  enabledDrivers: Record<LLM, boolean> = modelsConfig.enabledDrivers
): LLM {
  const { tags, prioritizeBy = "accuracy" } = requirement;

  // Filter to enabled drivers
  const availableDrivers = Object.values(driverMetadata).filter(
    (driver) => enabledDrivers[driver.name]
  );

  if (availableDrivers.length === 0) {
    console.warn("⚠️ No enabled drivers available, falling back to GPT");
    return "gpt";
  }

  // Find drivers that can handle ALL required capabilities
  const capableDrivers = availableDrivers.filter((driver) =>
    tags.every((tag) => driver.caps.includes(tag))
  );

  // If no driver has all capabilities, fall back to the one with most matches
  const candidateDrivers =
    capableDrivers.length > 0
      ? capableDrivers
      : availableDrivers
          .map((driver) => ({
            ...driver,
            matchScore: tags.filter((tag) => driver.caps.includes(tag)).length,
          }))
          .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
          .slice(0, Math.max(1, Math.ceil(availableDrivers.length / 2))); // Top 50%

  // Apply prioritization strategy
  let selectedDriver: DriverMetadata;

  switch (prioritizeBy) {
    case "cost":
      selectedDriver = candidateDrivers.reduce((best, current) =>
        getCostScore(current.costTier) < getCostScore(best.costTier)
          ? current
          : best
      );
      break;

    case "latency":
      selectedDriver = candidateDrivers.reduce((best, current) =>
        current.latencyMs50p < best.latencyMs50p ? current : best
      );
      break;

    case "context":
      selectedDriver = candidateDrivers.reduce((best, current) =>
        current.limit > best.limit ? current : best
      );
      break;

    case "accuracy":
    default:
      selectedDriver = candidateDrivers.reduce((best, current) =>
        current.accuracyScore > best.accuracyScore ? current : best
      );
      break;
  }

  console.log(
    `🎯 Capability routing: ${tags.join(
      "+"
    )} → ${selectedDriver.name.toUpperCase()} ` +
      `(${
        capableDrivers.length > 0 ? "perfect match" : "best available"
      }, optimized for ${prioritizeBy})`
  );

  return selectedDriver.name;
}

/**
 * Fallback chain with capability awareness
 */
export function getDriverWithFallback(
  primaryChoice: LLM,
  enabledDrivers: Record<LLM, boolean> = modelsConfig.enabledDrivers
): LLM {
  // If primary choice is enabled, use it
  if (enabledDrivers[primaryChoice]) {
    return primaryChoice;
  }

  // Follow fallback chain from config
  const fallbacks = modelsConfig.fallbacks;
  let currentChoice: LLM | null = primaryChoice;

  while (currentChoice && fallbacks[currentChoice]) {
    const fallbackChoice = fallbacks[currentChoice] as LLM;
    if (enabledDrivers[fallbackChoice]) {
      console.log(
        `🔄 Fallback: ${primaryChoice} → ${fallbackChoice} (${primaryChoice} disabled)`
      );
      return fallbackChoice;
    }
    currentChoice = fallbackChoice;
  }

  // Last resort: find any enabled driver
  const anyEnabled = Object.keys(enabledDrivers).find(
    (driver) => enabledDrivers[driver as LLM]
  ) as LLM;

  if (anyEnabled) {
    console.warn(`⚠️ Emergency fallback: ${primaryChoice} → ${anyEnabled}`);
    return anyEnabled;
  }

  // Absolute fallback
  console.error("🚨 No enabled drivers found, using GPT as last resort");
  return "gpt";
}

/**
 * Get capability match score for debugging/UI
 */
export function getCapabilityMatchScore(
  requirements: string[],
  driverName: LLM
): { score: number; matches: string[]; missing: string[] } {
  const driver = driverMetadata[driverName];
  const matches = requirements.filter((req) => driver.caps.includes(req));
  const missing = requirements.filter((req) => !driver.caps.includes(req));

  return {
    score: requirements.length > 0 ? matches.length / requirements.length : 1,
    matches,
    missing,
  };
}
