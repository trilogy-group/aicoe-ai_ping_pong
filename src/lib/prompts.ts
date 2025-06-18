import { Scenario } from "../types";
import {
  enhancedArticleWorkflow,
  enhancedResearchWorkflow,
} from "./enhanced-prompts";

// Helper function to convert WorkflowStep to Step format
function convertWorkflowStepToStep(workflowStep: any, index: number) {
  return {
    id: workflowStep.id,
    model: workflowStep.model,
    title: workflowStep.title,
    description: workflowStep.description,
    timeEstimate: workflowStep.timeEstimate / 5 || 0.5, // Default 0.5 minutes if not specified
    status: "idle" as const,
    rawPrompt: workflowStep.rawPrompt,
    prompt: workflowStep.rawPrompt, // Will be hydrated later
  };
}

export const scenarios: Record<string, Scenario> = {
  // ENHANCED WORKFLOWS (now as default scenarios)
  article: {
    id: "article",
    name: "Article Generation (14 Steps)",
    description:
      "Maximum quality article generation with comprehensive proofreading and final optimization",
    steps: enhancedArticleWorkflow.map(convertWorkflowStepToStep),
    estimatedMinutes: 4,
  },

  research: {
    id: "research",
    name: "Research Report (11 Steps)",
    description:
      "Comprehensive research with strategic validation checkpoints and live data integration",
    steps: enhancedResearchWorkflow.map(convertWorkflowStepToStep),
    estimatedMinutes: 5,
  },

  // LEGACY WORKFLOWS (kept for backward compatibility)
  email: {
    id: "email",
    name: "Email Response Workflow",
    description: "3-step AI workflow for crafting thoughtful email responses",
    estimatedMinutes: 8,
    steps: [
      {
        id: "decode-request",
        model: "gpt",
        title: "Decode Request",
        description: "Understand what they're really asking",
        timeEstimate: 2,
        status: "idle",
        rawPrompt: `I received this email:

{{userInput}}

Help me understand:
- What are they actually asking for?
- What's the urgency level?
- What's the best response approach?
- What key points should I address?
- What tone should I use?

Keep this quick and practical.`,
        prompt: `I received this email:

{{userInput}}

Help me understand:
- What are they actually asking for?
- What's the urgency level?
- What's the best response approach?
- What key points should I address?
- What tone should I use?

Keep this quick and practical.`,
      },
      {
        id: "validate-response",
        model: "gemini",
        title: "Validate Response",
        description: "Fact-check and verify accuracy",
        timeEstimate: 3,
        status: "idle",
        rawPrompt: `Original email: {{userInput}}

My understanding: {{step1}}

Before I respond, verify:
- Are there any facts I should double-check?
- Any company policies or procedures I should reference?
- Any recent developments that might affect my response?
- Any potential sensitivity or escalation risks?

Give me current, accurate information with sources where relevant.`,
        prompt: `Original email: {{userInput}}

My understanding: {{step1}}

Before I respond, verify:
- Are there any facts I should double-check?
- Any company policies or procedures I should reference?
- Any recent developments that might affect my response?
- Any potential sensitivity or escalation risks?

Give me current, accurate information with sources where relevant.`,
      },
      {
        id: "craft-response",
        model: "gpt",
        title: "Craft Response",
        description: "Write a thoughtful reply",
        timeEstimate: 3,
        status: "idle",
        rawPrompt: `Original email: {{userInput}}

Context: {{step1}}
Verification: {{step2}}

Write a professional, helpful response that:
- Directly addresses their request
- Is appropriately toned for the situation
- Includes necessary details without being overwhelming
- Sets clear expectations if needed
- Feels personal and thoughtful

Keep it concise but complete.`,
        prompt: `Original email: {{userInput}}

Context: {{step1}}
Verification: {{step2}}

Write a professional, helpful response that:
- Directly addresses their request
- Is appropriately toned for the situation
- Includes necessary details without being overwhelming
- Sets clear expectations if needed
- Feels personal and thoughtful

Keep it concise but complete.`,
      },
    ],
  },
};

export function getScenario(id: string): Scenario | undefined {
  return scenarios[id];
}

export function getAllScenarios(): Scenario[] {
  return Object.values(scenarios);
}
