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

  quirkyOpinion: {
    id: "quirkyOpinion",
    name: "Quirky Opinion Piece (9 Steps)",
    description:
      "Generates a unique, 1000-word opinion piece from a quirky idea using a 9-step multi-model workflow.",
    estimatedMinutes: 14,
    steps: [
      {
        id: "define-angle",
        model: "gpt",
        title: "Step 1: Define Angle",
        description: "Frame the core idea as a provocative opening statement.",
        timeEstimate: 1,
        status: "idle",
        rawPrompt: `Take this quirky topic and turn it into a provocative opening paragraph for a spiky opinion piece.

Topic: "{{userInput}}"

Frame it as a challenge to the conventional wisdom in its domain. The goal is to hook the reader immediately.`,
        prompt: `Take this quirky topic and turn it into a provocative opening paragraph for a spiky opinion piece.

Topic: "{{userInput}}"

Frame it as a challenge to the conventional wisdom in its domain. The goal is to hook the reader immediately.`,
      },
      {
        id: "gather-research",
        model: "gemini",
        title: "Step 2: Gather Research",
        description:
          "Generate supporting points and 'evidence' for the thesis.",
        timeEstimate: 2,
        status: "idle",
        rawPrompt: `Original Topic: "{{userInput}}"
Provocative Angle: "{{step1}}"

Generate 3-4 distinct, insightful supporting points or pieces of 'evidence' that bolster the provocative angle. These should feel like research findings that can be woven into a larger argument.`,
        prompt: `Original Topic: "{{userInput}}"
Provocative Angle: "{{step1}}"

Generate 3-4 distinct, insightful supporting points or pieces of 'evidence' that bolster the provocative angle. These should feel like research findings that can be woven into a larger argument.`,
      },
      {
        id: "synthesize-findings",
        model: "gpt",
        title: "Step 3: Synthesize Findings",
        description:
          "Weave the research into a coherent introductory narrative.",
        timeEstimate: 2,
        status: "idle",
        rawPrompt: `Topic: "{{userInput}}"
Angle: "{{step1}}"
Supporting Points: "{{step2}}"

Write a compelling introduction (~200 words). Start with the provocative angle, then seamlessly weave in the supporting points to build a section titled "The Flaw in Our Current Thinking".`,
        prompt: `Topic: "{{userInput}}"
Angle: "{{step1}}"
Supporting Points: "{{step2}}"

Write a compelling introduction (~200 words). Start with the provocative angle, then seamlessly weave in the supporting points to build a section titled "The Flaw in Our Current Thinking".`,
      },
      {
        id: "structure-argument",
        model: "claude",
        title: "Step 4: Structure the Core Argument",
        description: "Flesh out the central thesis of the piece.",
        timeEstimate: 2,
        status: "idle",
        rawPrompt: `Topic: "{{userInput}}"

Based on the introduction below, write a powerful, clear section (~250 words) titled "A New Paradigm: The Power of the Committee". This section must explicitly state the core thesis of the topic and explain why it's a paradigm shift.

Introduction:
"{{step3}}"`,
        prompt: `Topic: "{{userInput}}"

Based on the introduction below, write a powerful, clear section (~250 words) titled "A New Paradigm: The Power of the Committee". This section must explicitly state the core thesis of the topic and explain why it's a paradigm shift.

Introduction:
"{{step3}}"`,
      },
      {
        id: "validate-and-counter",
        model: "gemini",
        title: "Step 5: Add Skeptic's View",
        description:
          "Generate counter-arguments to make the piece more robust.",
        timeEstimate: 2,
        status: "idle",
        rawPrompt: `Topic: "{{userInput}}"
Core Argument: "{{step4}}"

Play the role of a skeptical critic. Write a section (~200 words) for this article called "The Skeptic's View: Acknowledging the Hurdles". Identify 2-3 strong potential counter-arguments or challenges to the core argument. Then, briefly address them to show the idea is robust.`,
        prompt: `Topic: "{{userInput}}"
Core Argument: "{{step4}}"

Play the role of a skeptical critic. Write a section (~200 words) for this article called "The Skeptic's View: Acknowledging the Hurdles". Identify 2-3 strong potential counter-arguments or challenges to the core argument. Then, briefly address them to show the idea is robust.`,
      },
      {
        id: "develop-scenario",
        model: "gpt",
        title: "Step 6: Develop Narrative Scenario",
        description: "Create a concrete story to illustrate the main idea.",
        timeEstimate: 2,
        status: "idle",
        rawPrompt: `Topic: "{{userInput}}"
Core Argument: "{{step4}}"

Write a short, vivid, narrative scenario (~200 words) for a section called "A Glimpse into the Future: A Practical Scenario". This story should make the abstract core argument concrete and easy to visualize for the reader.`,
        prompt: `Topic: "{{userInput}}"
Core Argument: "{{step4}}"

Write a short, vivid, narrative scenario (~200 words) for a section called "A Glimpse into the Future: A Practical Scenario". This story should make the abstract core argument concrete and easy to visualize for the reader.`,
      },
      {
        id: "add-implications",
        model: "claude",
        title: "Step 7: Analyze Implications",
        description: "Explore the second-order consequences of the idea.",
        timeEstimate: 1,
        status: "idle",
        rawPrompt: `Based on the topic "{{userInput}}", write a brief section (~150 words) called "The Unseen Implications". Discuss the profound, second-order consequences of this idea, such as new jobs, new skills required, and new ways of measuring success.`,
        prompt: `Based on the topic "{{userInput}}", write a brief section (~150 words) called "The Unseen Implications". Discuss the profound, second-order consequences of this idea, such as new jobs, new skills required, and new ways of measuring success.`,
      },
      {
        id: "polish-and-conclude",
        model: "gpt",
        title: "Step 8: Write Conclusion",
        description: "Add a powerful concluding paragraph.",
        timeEstimate: 1,
        status: "idle",
        rawPrompt: `Write a powerful, decisive concluding paragraph (~100 words) for an opinion piece on the topic of "{{userInput}}". The conclusion should be titled "The Future is Orchestrated" and assert that this new way of thinking is inevitable.`,
        prompt: `Write a powerful, decisive concluding paragraph (~100 words) for an opinion piece on the topic of "{{userInput}}". The conclusion should be titled "The Future is Orchestrated" and assert that this new way of thinking is inevitable.`,
      },
      {
        id: "final-assembly",
        model: "gpt",
        title: "Step 9: Final Assembly",
        description: "Assemble all parts into a final, formatted article.",
        timeEstimate: 1,
        status: "idle",
        rawPrompt: `Assemble the following components into a single, cohesive, and well-formatted markdown article.

**Quirky Idea (for context, don't include in output):** 
"{{userInput}}"

**Part 1: Introduction**
"{{step3}}"

**Part 2: Core Argument**
"{{step4}}"

**Part 3: Narrative Scenario**
"{{step6}}"

**Part 4: Skeptic's View**
"{{step5}}"

**Part 5: Implications**
"{{step7}}"

**Part 6: Conclusion**
"{{step8}}"

---
**Instructions:**
1.  Combine these parts into a flowing article.
2.  Add a main title using the original quirky idea.
3.  Add the subtitle: "An opinion piece inspired by the multi-model philosophy."
4.  Add the citation line: '*Inspired by the philosophy of multi-model orchestration in "[AI Ping-Pong: Manual Multi-Model Workflow for 98% Content Quality](https://trilogyai.substack.com/p/ai-ping-pong)" by Stanislav Huseletov*'
5.  Ensure all section headers are formatted correctly as markdown headers.`,
        prompt: `Assemble the following components into a single, cohesive, and well-formatted markdown article.

**Quirky Idea (for context, don't include in output):** 
"{{userInput}}"

**Part 1: Introduction**
"{{step3}}"

**Part 2: Core Argument**
"{{step4}}"

**Part 3: Narrative Scenario**
"{{step6}}"

**Part 4: Skeptic's View**
"{{step5}}"

**Part 5: Implications**
"{{step7}}"

**Part 6: Conclusion**
"{{step8}}"

---
**Instructions:**
1.  Combine these parts into a flowing article.
2.  Add a main title using the original quirky idea.
3.  Add the subtitle: "An opinion piece inspired by the multi-model philosophy."
4.  Add the citation line: '*Inspired by the philosophy of multi-model orchestration in "[AI Ping-Pong: Manual Multi-Model Workflow for 98% Content Quality](https://trilogyai.substack.com/p/ai-ping-pong)" by Stanislav Huseletov*'
5.  Ensure all section headers are formatted correctly as markdown headers.`,
      },
    ],
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
