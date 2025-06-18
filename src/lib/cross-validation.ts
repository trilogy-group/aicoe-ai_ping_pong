import { LLM, drivers } from "./models";

export interface ValidationResult {
  model: LLM;
  content: string;
  confidence: number;
  sources: string[];
  flags: string[];
}

export interface CrossValidationReport {
  originalContent: string;
  validations: ValidationResult[];
  agreement: {
    score: number; // 0-1, higher is better
    conflictingPoints: string[];
    consensus: string;
  };
  recommendation: "accept" | "review" | "reject";
  finalContent?: string;
}

/**
 * Calculate content similarity using simple token overlap
 * In production, you'd want more sophisticated NLP similarity
 */
function calculateAgreementScore(
  validation1: string,
  validation2: string
): number {
  const tokens1 = validation1.toLowerCase().split(/\s+/);
  const tokens2 = validation2.toLowerCase().split(/\s+/);

  const intersection = tokens1.filter((token) => tokens2.includes(token));
  const union = [...new Set([...tokens1, ...tokens2])];

  return intersection.length / union.length;
}

/**
 * Extract potential source citations from content
 */
function extractSources(content: string): string[] {
  const sourcePatterns = [
    /\[Source: ([^\]]+)\]/g,
    /\(Source: ([^)]+)\)/g,
    /According to ([^,\.]+)/g,
    /https?:\/\/[^\s]+/g,
  ];

  const sources: string[] = [];
  sourcePatterns.forEach((pattern) => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      sources.push(match[1] || match[0]);
    }
  });

  return [...new Set(sources)]; // Remove duplicates
}

/**
 * Run single model validation
 */
async function runSingleValidation(
  content: string,
  model: LLM,
  validationType: "fact_check" | "source_verify" | "logic_audit"
): Promise<ValidationResult> {
  const driver = drivers[model];

  const prompts = {
    fact_check: `As ${model.toUpperCase()}, perform rigorous fact-checking on the following content. Rate your confidence 1-10 and identify any potential misinformation, unsupported claims, or factual errors. List specific issues:

${content}

Format your response as:
CONFIDENCE: [1-10]
SOURCES: [list any sources mentioned]
FLAGS: [list any concerns or issues]
ASSESSMENT: [your detailed analysis]`,

    source_verify: `As ${model.toUpperCase()}, verify the reliability and accuracy of sources cited in the following content. Check for credibility, recency, and proper attribution:

${content}

Format your response as:
CONFIDENCE: [1-10] 
SOURCES: [evaluate each source mentioned]
FLAGS: [unreliable sources or citation issues]
ASSESSMENT: [your source verification analysis]`,

    logic_audit: `As ${model.toUpperCase()}, audit the logical reasoning and consistency in the following content. Check for logical fallacies, contradictions, and reasoning gaps:

${content}

Format your response as:
CONFIDENCE: [1-10]
SOURCES: [evidence supporting the logic]
FLAGS: [logical issues or contradictions]
ASSESSMENT: [your logical analysis]`,
  };

  const prompt = prompts[validationType];
  const stream = await driver.call(prompt, []);

  // Collect stream into full response
  let response = "";
  const reader = stream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split("\n").filter((line) => line.trim());

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.type === "token" && data.content) {
            response += data.content;
          }
        } catch (e) {
          // Skip non-JSON lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  // Parse structured response
  const confidenceMatch = response.match(/CONFIDENCE:\s*(\d+)/);
  const sourcesMatch = response.match(/SOURCES:\s*([^\n]+)/);
  const flagsMatch = response.match(/FLAGS:\s*([^\n]+)/);

  return {
    model,
    content: response,
    confidence: confidenceMatch ? parseInt(confidenceMatch[1]) / 5 : 0.5,
    sources: sourcesMatch ? [sourcesMatch[1]] : extractSources(content),
    flags: flagsMatch ? [flagsMatch[1]] : [],
  };
}

/**
 * Run cross-model validation to identify discrepancies
 * This implements the "near-zero factual errors" promise
 */
export async function runCrossValidation(
  content: string,
  enabledModels: LLM[] = ["gpt", "claude"],
  validationType: "fact_check" | "source_verify" | "logic_audit" = "fact_check"
): Promise<CrossValidationReport> {
  console.log(
    `🔍 Cross-validation: Running ${validationType} with ${enabledModels
      .join(", ")
      .toUpperCase()}`
  );

  // Run parallel validations
  const validationPromises = enabledModels.map((model) =>
    runSingleValidation(content, model, validationType)
  );

  const validations = await Promise.all(validationPromises);

  // Calculate agreement between validations
  let totalAgreement = 0;
  let comparisons = 0;
  const conflictingPoints: string[] = [];

  for (let i = 0; i < validations.length; i++) {
    for (let j = i + 1; j < validations.length; j++) {
      const agreement = calculateAgreementScore(
        validations[i].content,
        validations[j].content
      );
      totalAgreement += agreement;
      comparisons++;

      // Identify conflicts if agreement is low
      if (agreement < 0.7) {
        conflictingPoints.push(
          `${validations[i].model.toUpperCase()} vs ${validations[
            j
          ].model.toUpperCase()}: Low agreement (${Math.round(
            agreement * 100
          )}%)`
        );
      }
    }
  }

  const agreementScore = comparisons > 0 ? totalAgreement / comparisons : 1;

  // Determine recommendation
  const avgConfidence =
    validations.reduce((sum, v) => sum + v.confidence, 0) / validations.length;
  const hasFlags = validations.some((v) => v.flags.length > 0);

  let recommendation: "accept" | "review" | "reject";
  if (agreementScore > 0.8 && avgConfidence > 0.7 && !hasFlags) {
    recommendation = "accept";
  } else if (agreementScore > 0.6 && avgConfidence > 0.5) {
    recommendation = "review";
  } else {
    recommendation = "reject";
  }

  // Generate consensus (use highest confidence model's assessment)
  const bestValidation = validations.reduce((best, current) =>
    current.confidence > best.confidence ? current : best
  );

  const report: CrossValidationReport = {
    originalContent: content,
    validations,
    agreement: {
      score: agreementScore,
      conflictingPoints,
      consensus: bestValidation.content,
    },
    recommendation,
  };

  console.log(
    `📊 Cross-validation complete: ${Math.round(
      agreementScore * 100
    )}% agreement, ` +
      `${Math.round(
        avgConfidence * 100
      )}% avg confidence → ${recommendation.toUpperCase()}`
  );

  return report;
}

/**
 * Smart validation that chooses models based on validation type
 */
export async function smartValidation(
  content: string,
  validationType: "fact_check" | "source_verify" | "logic_audit" = "fact_check"
): Promise<CrossValidationReport> {
  // Choose optimal models for validation type
  let modelPair: LLM[];

  switch (validationType) {
    case "fact_check":
      modelPair = ["gpt", "claude"]; // Best logical reasoning combination
      break;
    case "source_verify":
      modelPair = ["grok", "gemini"]; // Best research and current info
      break;
    case "logic_audit":
      modelPair = ["claude", "gpt"]; // Best analytical reasoning
      break;
  }

  return runCrossValidation(content, modelPair, validationType);
}

/**
 * Generate discrepancy report for UI display
 */
export function generateDiscrepancyReport(report: CrossValidationReport): {
  summary: string;
  details: string[];
  actions: string[];
} {
  const { agreement, validations, recommendation } = report;

  const summary = `${Math.round(
    agreement.score * 100
  )}% model agreement - ${recommendation.toUpperCase()} recommended`;

  const details = [
    `Models: ${validations.map((v) => v.model.toUpperCase()).join(", ")}`,
    `Average confidence: ${Math.round(
      (validations.reduce((s, v) => s + v.confidence, 0) / validations.length) *
        100
    )}%`,
    `Conflicts: ${agreement.conflictingPoints.length}`,
    ...agreement.conflictingPoints,
  ];

  const actions = [];
  if (recommendation === "reject") {
    actions.push("⚠️ Significant discrepancies found - manual review required");
  } else if (recommendation === "review") {
    actions.push("🔍 Minor discrepancies - consider additional verification");
  } else {
    actions.push("✅ High confidence - ready to proceed");
  }

  return { summary, details, actions };
}
