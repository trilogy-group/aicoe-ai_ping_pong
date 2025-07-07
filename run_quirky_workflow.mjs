import axios from "axios";
import fs from "fs";
import path from "path";

// The 10 quirky topics to be generated
const topics = [
  {
    id: 1,
    title: "The AI Trinity: Can Three Models in a Loop Simulate Consciousness?",
  },
  {
    id: 2,
    title: "Digital Psychoanalysis: Using AI Ping-Pong to Debug Your Own Brain",
  },
  {
    id: 3,
    title:
      "The Anti-AI AI: Building an Orchestrated System to Fight Persuasive AI",
  },
  {
    id: 4,
    title:
      "Culinary Anarchy: Inventing Unthinkable Food with an AI Flavor Committee",
  },
  {
    id: 5,
    title: "AI as a Spiritual Companion: The Coming Age of Algorithmic Gurus",
  },
  {
    id: 6,
    title: "Generative History: Using AI Ping-Pong to Simulate Lost Worlds",
  },
  {
    id: 7,
    title:
      "The Death of the Brainstorm: Why AI Committees Will Kill Corporate Creativity",
  },
  {
    id: 8,
    title:
      "AI Art Heists: Can an AI Committee Plan the Perfect (Fictional) Crime?",
  },
  {
    id: 9,
    title:
      "Investing by Ouija Board: Using Emergent AI Strategy for Financial Markets",
  },
  {
    id: 10,
    title:
      "The Babel Fish Protocol: Real-Time Universal Translation via AI Ping-Pong",
  },
];

// The 9-step workflow definition, mirroring prompts.ts
const workflow = [
  {
    id: "define-angle",
    model: "gpt",
    prompt: `Take this quirky topic and turn it into a provocative opening paragraph for a spiky opinion piece.

Topic: "{{userInput}}"

Frame it as a challenge to the conventional wisdom in its domain. The goal is to hook the reader immediately.`,
  },
  {
    id: "gather-research",
    model: "gemini",
    prompt: `Original Topic: "{{userInput}}"
Provocative Angle: "{{step1}}"

Generate 3-4 distinct, insightful supporting points or pieces of 'evidence' that bolster the provocative angle. These should feel like research findings that can be woven into a larger argument.`,
  },
  {
    id: "synthesize-findings",
    model: "gpt",
    prompt: `Topic: "{{userInput}}"
Angle: "{{step1}}"
Supporting Points: "{{step2}}"

Write a compelling introduction (~200 words). Start with the provocative angle, then seamlessly weave in the supporting points to build a section titled "The Flaw in Our Current Thinking".`,
  },
  {
    id: "structure-argument",
    model: "claude",
    prompt: `Topic: "{{userInput}}"

Based on the introduction below, write a powerful, clear section (~250 words) titled "A New Paradigm: The Power of the Committee". This section must explicitly state the core thesis of the topic and explain why it's a paradigm shift.

Introduction:
"{{step3}}"`,
  },
  {
    id: "validate-and-counter",
    model: "gemini",
    prompt: `Topic: "{{userInput}}"
Core Argument: "{{step4}}"

Play the role of a skeptical critic. Write a section (~200 words) for this article called "The Skeptic's View: Acknowledging the Hurdles". Identify 2-3 strong potential counter-arguments or challenges to the core argument. Then, briefly address them to show the idea is robust.`,
  },
  {
    id: "develop-scenario",
    model: "gpt",
    prompt: `Topic: "{{userInput}}"
Core Argument: "{{step4}}"

Write a short, vivid, narrative scenario (~200 words) for a section called "A Glimpse into the Future: A Practical Scenario". This story should make the abstract core argument concrete and easy to visualize for the reader.`,
  },
  {
    id: "add-implications",
    model: "claude",
    prompt: `Based on the topic "{{userInput}}", write a brief section (~150 words) called "The Unseen Implications". Discuss the profound, second-order consequences of this idea, such as new jobs, new skills required, and new ways of measuring success.`,
  },
  {
    id: "polish-and-conclude",
    model: "gpt",
    prompt: `Write a powerful, decisive concluding paragraph (~100 words) for an opinion piece on the topic of "{{userInput}}". The conclusion should be titled "The Future is Orchestrated" and assert that this new way of thinking is inevitable.`,
  },
  {
    id: "final-assembly",
    model: "gpt",
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
];

const API_URL = "http://localhost:3002/api/generate"; // The port from your server file

/**
 * Hydrates a prompt template with the outputs of previous steps.
 * @param {string} template The prompt template with placeholders like {{step1}}.
 * @param {string} userInput The initial user input.
 * @param {Record<string, string>} stepOutputs The outputs from previous steps.
 * @returns {string} The hydrated prompt.
 */
function hydratePrompt(template, userInput, stepOutputs) {
  let hydrated = template.replace(/{{userInput}}/g, userInput);
  for (const [stepId, output] of Object.entries(stepOutputs)) {
    const placeholder = new RegExp(`{{${stepId}}}`, "g");
    hydrated = hydrated.replace(placeholder, output);
  }
  return hydrated;
}

/**
 * Calls the API to execute a single step of the workflow.
 * @param {object} step The workflow step object.
 * @param {string} userInput The initial user input.
 * @param {Record<string, string>} stepOutputs The outputs from previous steps.
 * @returns {Promise<string>} The response from the model.
 */
async function executeStep(step, userInput, stepOutputs) {
  const prompt = hydratePrompt(step.prompt, userInput, stepOutputs);
  console.log(`\n--- Executing Step: ${step.id} (Model: ${step.model}) ---`);
  console.log(`Prompting with: ${prompt.substring(0, 100)}...`);

  try {
    const response = await axios.post(API_URL, {
      model: step.model,
      prompt: prompt,
      context: {
        userInput: userInput,
        stepOutputs: Object.values(stepOutputs),
      },
    });

    // Check if the response and its data are what we expect
    if (response.data && typeof response.data.text === "string") {
      const result = response.data.text;
      console.log(`Result: ${result.substring(0, 100)}...`);
      return result;
    } else {
      // Log the unexpected structure for debugging
      console.error(
        `Error: Unexpected API response structure for step ${step.id}:`
      );
      console.error(JSON.stringify(response.data, null, 2));
      return `[ERROR: Step ${step.id} received an invalid response structure.]`;
    }
  } catch (error) {
    console.error(`Error executing step ${step.id}:`, error.message);
    if (error.response) {
      // Also log the response data if the request itself failed
      console.error(
        "Error Response Data:",
        JSON.stringify(error.response.data, null, 2)
      );
    }
    return `[ERROR: Step ${step.id} failed]`;
  }
}

/**
 * Runs the entire 9-step workflow for a single topic.
 * @param {string} topicTitle The title of the topic to generate.
 * @returns {Promise<string>} The final generated article.
 */
async function runWorkflowForTopic(topicTitle) {
  const stepOutputs = {};
  for (let i = 0; i < workflow.length; i++) {
    const step = workflow[i];
    // A bit of a hack to reference previous steps by number, e.g., {{step1}}
    const stepIdForReferencing = `step${i + 1}`;
    const result = await executeStep(step, topicTitle, stepOutputs);
    stepOutputs[stepIdForReferencing] = result;
  }
  // The last step is the final assembly
  return stepOutputs[`step${workflow.length}`];
}

/**
 * Main function to generate all articles and save them to files.
 */
async function main() {
  const outputDir = "generated_quirky_articles";
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  console.log(
    `🚀 Starting generation of ${topics.length} quirky opinion pieces...`
  );

  for (const topic of topics) {
    console.log(`\n\n=================================================`);
    console.log(
      `Generating article ${topic.id}/${topics.length}: ${topic.title}`
    );
    console.log(`=================================================`);

    const finalArticle = await runWorkflowForTopic(topic.title);
    const filename = `${outputDir}/article_${topic.id}_${topic.title
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 50)}.md`;

    fs.writeFileSync(filename, finalArticle);
    console.log(`\n✅ Successfully saved article to ${filename}`);
  }

  console.log(`\n\n🎉 All ${topics.length} articles have been generated!`);
  console.log(`Find them in the '${outputDir}' directory.`);
}

main().catch((error) => {
  console.error("A critical error occurred:", error);
});
