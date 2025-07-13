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
    name: "Email Response Workflow (Enhanced)",
    description: "4-step AI workflow with comprehensive validation for professional email responses",
    estimatedMinutes: 10,
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
        title: "Comprehensive Email Validation",
        description: "Advanced fact-checking, policy verification, and risk assessment",
        timeEstimate: 5,
        status: "idle",
        rawPrompt: `You are a comprehensive email validation specialist with Google search access. Perform thorough verification before crafting the response.

ORIGINAL EMAIL: {{userInput}}
INITIAL UNDERSTANDING: {{step1}}

COMPREHENSIVE VALIDATION PROTOCOL:
1. FACT VERIFICATION
   - Verify any dates, deadlines, or timelines mentioned
   - Check any statistical claims or data points
   - Validate any references to events, policies, or procedures
   - Cross-check any technical information or specifications

2. POLICY & PROCEDURE VALIDATION
   - Search for relevant company policies or industry standards
   - Check for any recent policy updates or changes
   - Verify compliance requirements if applicable
   - Identify any legal or regulatory considerations

3. CURRENT DEVELOPMENTS CHECK
   - Search for recent news or developments affecting the topic
   - Check for any industry changes or updates
   - Verify any external factors that might impact the response
   - Look for any breaking news or urgent updates

4. SENSITIVITY & RISK ASSESSMENT
   - Identify potential escalation risks or sensitive topics
   - Check for any ongoing controversies or issues
   - Assess reputation risks or public relations considerations
   - Evaluate potential legal or compliance implications

5. CONTEXTUAL INTELLIGENCE
   - Research the sender's background or organization if relevant
   - Check for any relevant history or previous communications
   - Identify any cultural or industry-specific considerations
   - Assess the urgency and priority level accurately

COMPREHENSIVE VALIDATION REPORT:
FACT_VERIFICATION: [All facts checked with sources and accuracy assessment]
POLICY_COMPLIANCE: [Relevant policies, procedures, and compliance requirements]
CURRENT_CONTEXT: [Recent developments, news, or changes affecting the topic]
RISK_ASSESSMENT: [Potential risks, sensitivities, and escalation factors]
BACKGROUND_INTEL: [Relevant context about sender, organization, or situation]
VERIFICATION_SOURCES: [List of sources used for verification with reliability ratings]
RESPONSE_STRATEGY: [Recommended approach based on validation findings]
CRITICAL_CONSIDERATIONS: [Most important factors to address in response]

Use Google search extensively to ensure all information is current, accurate, and comprehensive.`,
        prompt: `You are a comprehensive email validation specialist with Google search access. Perform thorough verification before crafting the response.

ORIGINAL EMAIL: {{userInput}}
INITIAL UNDERSTANDING: {{step1}}

COMPREHENSIVE VALIDATION PROTOCOL:
1. FACT VERIFICATION
   - Verify any dates, deadlines, or timelines mentioned
   - Check any statistical claims or data points
   - Validate any references to events, policies, or procedures
   - Cross-check any technical information or specifications

2. POLICY & PROCEDURE VALIDATION
   - Search for relevant company policies or industry standards
   - Check for any recent policy updates or changes
   - Verify compliance requirements if applicable
   - Identify any legal or regulatory considerations

3. CURRENT DEVELOPMENTS CHECK
   - Search for recent news or developments affecting the topic
   - Check for any industry changes or updates
   - Verify any external factors that might impact the response
   - Look for any breaking news or urgent updates

4. SENSITIVITY & RISK ASSESSMENT
   - Identify potential escalation risks or sensitive topics
   - Check for any ongoing controversies or issues
   - Assess reputation risks or public relations considerations
   - Evaluate potential legal or compliance implications

5. CONTEXTUAL INTELLIGENCE
   - Research the sender's background or organization if relevant
   - Check for any relevant history or previous communications
   - Identify any cultural or industry-specific considerations
   - Assess the urgency and priority level accurately

COMPREHENSIVE VALIDATION REPORT:
FACT_VERIFICATION: [All facts checked with sources and accuracy assessment]
POLICY_COMPLIANCE: [Relevant policies, procedures, and compliance requirements]
CURRENT_CONTEXT: [Recent developments, news, or changes affecting the topic]
RISK_ASSESSMENT: [Potential risks, sensitivities, and escalation factors]
BACKGROUND_INTEL: [Relevant context about sender, organization, or situation]
VERIFICATION_SOURCES: [List of sources used for verification with reliability ratings]
RESPONSE_STRATEGY: [Recommended approach based on validation findings]
CRITICAL_CONSIDERATIONS: [Most important factors to address in response]

Use Google search extensively to ensure all information is current, accurate, and comprehensive.`,
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
      {
        id: "final-email-validation",
        model: "claude",
        title: "Final Email Validation",
        description: "Comprehensive validation of the drafted response",
        timeEstimate: 2,
        status: "idle",
        rawPrompt: `You are a professional communication validator. Review the drafted email response for accuracy, appropriateness, and effectiveness.

ORIGINAL EMAIL: {{userInput}}
VALIDATION RESEARCH: {{step2}}
DRAFTED RESPONSE: {{step3}}

FINAL VALIDATION CHECKLIST:
1. ACCURACY VERIFICATION
   - All facts and information are correct and current
   - No contradictions with the validation research
   - All claims are properly supported

2. TONE & APPROPRIATENESS
   - Professional and suitable for the context
   - Matches the urgency and formality level needed
   - Culturally and situationally appropriate

3. COMPLETENESS & CLARITY
   - All questions and requests are addressed
   - Information is clear and unambiguous
   - No important details are missing

4. RISK ASSESSMENT
   - No potential for misinterpretation
   - No legal, compliance, or reputation risks
   - Appropriate level of commitment and responsibility

5. EFFECTIVENESS EVALUATION
   - Likely to achieve the desired outcome
   - Maintains positive relationships
   - Sets appropriate expectations

VALIDATION ASSESSMENT:
ACCURACY_CHECK: [All facts verified and current]
TONE_APPROPRIATENESS: [Professional and context-appropriate]
COMPLETENESS_RATING: [All requirements addressed]
RISK_EVALUATION: [No significant risks identified]
EFFECTIVENESS_SCORE: [Likely to achieve objectives]
FINAL_RECOMMENDATION: [SEND_AS_IS/MINOR_REVISIONS/MAJOR_REVISIONS]
IMPROVEMENT_SUGGESTIONS: [Specific recommendations if any]

If revisions are needed, provide the corrected version.`,
        prompt: `You are a professional communication validator. Review the drafted email response for accuracy, appropriateness, and effectiveness.

ORIGINAL EMAIL: {{userInput}}
VALIDATION RESEARCH: {{step2}}
DRAFTED RESPONSE: {{step3}}

FINAL VALIDATION CHECKLIST:
1. ACCURACY VERIFICATION
   - All facts and information are correct and current
   - No contradictions with the validation research
   - All claims are properly supported

2. TONE & APPROPRIATENESS
   - Professional and suitable for the context
   - Matches the urgency and formality level needed
   - Culturally and situationally appropriate

3. COMPLETENESS & CLARITY
   - All questions and requests are addressed
   - Information is clear and unambiguous
   - No important details are missing

4. RISK ASSESSMENT
   - No potential for misinterpretation
   - No legal, compliance, or reputation risks
   - Appropriate level of commitment and responsibility

5. EFFECTIVENESS EVALUATION
   - Likely to achieve the desired outcome
   - Maintains positive relationships
   - Sets appropriate expectations

VALIDATION ASSESSMENT:
ACCURACY_CHECK: [All facts verified and current]
TONE_APPROPRIATENESS: [Professional and context-appropriate]
COMPLETENESS_RATING: [All requirements addressed]
RISK_EVALUATION: [No significant risks identified]
EFFECTIVENESS_SCORE: [Likely to achieve objectives]
FINAL_RECOMMENDATION: [SEND_AS_IS/MINOR_REVISIONS/MAJOR_REVISIONS]
IMPROVEMENT_SUGGESTIONS: [Specific recommendations if any]

If revisions are needed, provide the corrected version.`,
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
