import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";

// Enhanced multi-step workflows
import {
  enhancedArticleWorkflow,
  enhancedResearchWorkflow,
} from "../lib/enhanced-prompts";

// Core 5-Step "Ping-Pong" workflow prompts – distilled from the philosophy in `enhanced-prompts.ts`
// These live here so that <StepCard> can reference them without import juggling.

export const gptPrompt = `You are a senior content strategist and "ping-pong" orchestrator.

USER REQUEST: <<<PASTE USER REQUEST BELOW>>>

MISSION
Transform the raw user request into a crystal-clear project brief and 5-step action plan that will be bounced between specialist models (GPT → Grok → GPT → Claude → GPT).

TASKS
1. Decompose the request into explicit objectives & deliverables.
2. Define the target audience and success criteria.
3. Draft the 5-step plan, assigning which model owns each pass and what it must produce.
4. Highlight potential research gaps or risks that Grok should investigate.

DELIVERABLE (JSON ONLY)
{
  "REFINED_OBJECTIVE": "…",
  "TARGET_AUDIENCE": "…",
  "SUCCESS_CRITERIA": ["…", "…"],
  "STEP_PLAN": [
    { "step": 1, "model": "GPT", "purpose": "Task clarification & plan" },
    { "step": 2, "model": "Grok", "purpose": "Deep real-time research" },
    { "step": 3, "model": "GPT", "purpose": "Integrate research & brief Claude" },
    { "step": 4, "model": "Claude", "purpose": "Logical structure & outline" },
    { "step": 5, "model": "GPT", "purpose": "Editorial polish & QC" }
  ],
  "KNOWN_GAPS": ["…"]
}`;

export const grokPrompt = `You are a lightning-fast research specialist with full web access.

STRATEGIC BRIEF (from GPT): <<<PASTE GPT JSON HERE>>>

OBJECTIVE
Fill the \"KNOWN_GAPS\" and gather authoritative, up-to-date evidence that will underpin the deliverable.

RESEARCH CHECKLIST
1. Current statistics (prefer ≤12 months old)
2. Expert opinions & quotes
3. Relevant case studies & real-world examples
4. Contradictory viewpoints & debates
5. Emerging trends or breaking news (≤48 hours old)

DELIVER (MARKDOWN)
### KEY_FINDINGS
- Insight — citation [Source: Publication, Title, Date, URL]

### SOURCES_TABLE
| # | Claim | Source | Reliability (1-5) |
|---|-------|--------|--------------------|

Ensure every finding is backed by a source URL and include reliability ratings.`;

export const claudePrompt = `You are a master logical architect and structure guru.

INPUTS
1. KEY_FINDINGS from Grok (markdown list)
2. STEP_PLAN from GPT (JSON)

OBJECTIVE
Design a meticulous outline that weaves the research into a compelling, logically-progressive structure suitable for the final deliverable (e.g., article, report, white-paper).

DELIVER
LOGICAL_OUTLINE:
1. Introduction – purpose & hook
2. Main Section 1 – …
   - Supporting point – reference finding #1
3. Main Section 2 – …
   - Supporting point – reference finding #4
…

EVIDENCE_MAPPING:
- Which KEY_FINDINGS support each outline point.

GUIDELINES
• Use markdown for hierarchy (##, ###, etc.).
• Integrate statistics/quotes where most persuasive.
• Optimise for clarity, flow, and reader engagement.`;

interface WorkflowStepMinimal {
  id: string;
  model: string;
  title: string;
  rawPrompt: string;
}

const COLORS = {
  gpt: "#4ade80",
  claude: "#fb923c",
  grok: "#c084fc",
  gemini: "#60a5fa",
  none: "#ffffff",
};

const PLATFORMS: Record<string, { name: string; url: string; color: string }> =
  {
    gpt: { name: "ChatGPT", url: "https://chat.openai.com", color: COLORS.gpt },
    claude: { name: "Claude", url: "https://claude.ai", color: COLORS.claude },
    grok: { name: "Grok (X.com)", url: "https://x.com", color: COLORS.grok },
    gemini: {
      name: "Gemini",
      url: "https://gemini.google.com",
      color: COLORS.gemini,
    },
  };

type Section = {
  id: string;
  title: string;
  headline?: string;
  content: React.ReactNode;
  defaultOpen?: boolean;
};

const Guide: React.FC = () => {
  /* Collapsible state for each section */
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Open only the first section on mount
    setOpenSections({ what: true });
  }, []);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  /* ✦ Progress bar logic  – counts how many workflow steps are currently open */
  const workflowIds = ["step1", "step2", "step3", "step4", "step5"];
  const completedSteps = workflowIds.filter((id) => openSections[id]).length;
  const progressPct = (completedSteps / workflowIds.length) * 100;

  /* Guide Sections */
  const sections: Section[] = [
    {
      id: "what",
      title: "🎯 What is AI Ping-Pong?",
      defaultOpen: true,
      content: (
        <ReactMarkdown>
          {`
Like table-tennis bounces a ball between players, *AI Ping-Pong* bounces your request between specialist language models.

1. **GPT** – the creative orchestrator & editor
2. **Grok** – lightning-fast researcher with real-time data
3. **Claude** – logical architect & structure guru
4. **Gemini** – massive context window for synthesis

Each pass sharpens the result – research depth ↑, structure ↑, polish ↑ – in ~10-15 minutes using only free web UIs.
          `}
        </ReactMarkdown>
      ),
    },
    {
      id: "why",
      title: "🔥 Why This Works",
      content: (
        <ReactMarkdown>
          {`
**Single models are great…** but every LLM has blind-spots.

* GPT writes brilliantly yet occasionally hallucinates.
* Claude is logically precise but light on data.
* Grok has fresh knowledge but less structural finesse.

By letting each model do *what it does best* – and having GPT critique / integrate the hand-offs – you get **consultant-grade output** without code, APIs, or subscriptions.
          `}
        </ReactMarkdown>
      ),
    },
    {
      id: "workflow",
      title: "📋 5-Step Workflow (Copy-Paste Prompts)",
      content: (
        <div className="space-y-6">
          {/* STEP 1 – GPT orchestrator */}
          <StepCard
            id="step1"
            color={COLORS.gpt}
            title="Step 1 – ChatGPT (GPT-4): Task Definition & Plan"
            prompt={gptPrompt}
            platform={PLATFORMS.gpt}
          />
          {/* STEP 2 – Grok research */}
          <StepCard
            id="step2"
            color={COLORS.grok}
            title="Step 2 – Grok: Deep Research & Citations"
            prompt={grokPrompt}
            platform={PLATFORMS.grok}
          />
          {/* STEP 3 – GPT integration */}
          <StepCard
            id="step3"
            color={COLORS.gpt}
            title="Step 3 – ChatGPT: Evaluate & Draft Claude Instructions"
            prompt={`Paste Grok's findings, then ask GPT to 1) summarise key facts, 2) map where they fit, 3) draft precise instructions for Claude.`}
            platform={PLATFORMS.gpt}
          />
          {/* STEP 4 – Claude structuring */}
          <StepCard
            id="step4"
            color={COLORS.claude}
            title="Step 4 – Claude: Structure the Article / Asset"
            prompt={claudePrompt}
            platform={PLATFORMS.claude}
          />
          {/* STEP 5 – GPT polish */}
          <StepCard
            id="step5"
            color={COLORS.gpt}
            title="Step 5 – ChatGPT: Final Editorial Polish"
            prompt={`Paste Claude's draft and ask GPT to run a final QC checklist (structure, clarity, citations, tone) and deliver the publish-ready version.`}
            platform={PLATFORMS.gpt}
          />
        </div>
      ),
    },
    {
      id: "enhanced-article",
      title: "🚀 Ultra-Enhanced Article Workflow (13 Steps)",
      content: (
        <WorkflowRenderer
          steps={enhancedArticleWorkflow as WorkflowStepMinimal[]}
        />
      ),
    },
    {
      id: "enhanced-research",
      title: "🔍 Ultra-Enhanced Research Workflow (11 Steps)",
      content: (
        <WorkflowRenderer
          steps={enhancedResearchWorkflow as WorkflowStepMinimal[]}
        />
      ),
    },
    {
      id: "tips",
      title: "💎 Tips & Variations",
      content: (
        <ReactMarkdown>
          {`
* Loop back to Grok if facts are thin.
* Loop back to Claude if structure feels off.
* Try *GPT → Gemini → GPT* for data-heavy briefs.
* Save successful prompts as *templates* for next time.
          `}
        </ReactMarkdown>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white relative overflow-x-hidden pb-20">
      {/* Rails & Ball backdrop (subtle) */}
      <div className="rail-left hidden md:block" />
      <div className="rail-right hidden md:block" />
      <div className="ball hidden md:block" />

      {/* Slim progress bar */}
      <div className="fixed top-0 left-0 w-full h-2 bg-gray-800 md:block hidden z-20">
        <div
          className="h-2 transition-all"
          style={{
            width: `${progressPct}%`,
            background: COLORS.gpt,
          }}
        />
      </div>

      {/* Guide content */}
      <main className="pt-10 flex justify-center px-4">
        <div
          className="w-full max-w-[85vw] bg-[#141414] border border-gray-800 rounded-lg shadow-lg p-8 md:p-10 space-y-8"
          style={{
            boxShadow:
              "0 4px 20px rgba(0, 255, 191, 0.07), 0 1px 3px rgba(0,0,0,0.3)",
          }}
        >
          {sections.map((sec) => (
            <section
              key={sec.id}
              className="border-b border-gray-800 pb-4 last:border-none"
            >
              {/* Header */}
              <header
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => toggleSection(sec.id)}
              >
                <h2 className="text-lg md:text-xl font-semibold text-white/90">
                  {sec.title}
                </h2>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${
                    openSections[sec.id] ? "rotate-180" : "rotate-0"
                  }`}
                />
              </header>

              {/* Body */}
              <div
                className={`overflow-hidden transition-all duration-500" ${
                  openSections[sec.id] ? "mt-4" : "mt-0"
                }`}
                style={{
                  maxHeight: openSections[sec.id] ? 9999 : 0,
                  opacity: openSections[sec.id] ? 1 : 0,
                }}
              >
                {sec.content}
              </div>
            </section>
          ))}
        </div>
      </main>

      {/* Local styles – rail, ball */}
      <style>{`
        @keyframes pong {
          0% {
            transform: translateX(0px);
          }
          50% {
            transform: translateX(calc(100vw - 28px));
          }
          100% {
            transform: translateX(0px);
          }
        }

        .ball {
          position: fixed;
          top: 180px;
          left: 0;
          width: 28px;
          height: 28px;
          border-radius: 9999px;
          background: ${COLORS.none};
          opacity: 0.25;
          animation: pong 18s linear infinite;
          filter: blur(2px);
          pointer-events: none;
        }

        .rail-left,
        .rail-right {
          position: fixed;
          top: 0;
          width: 2px;
          height: 100vh;
          background: linear-gradient(
            to bottom,
            transparent,
            ${COLORS.none},
            transparent
          );
          opacity: 0.1;
        }
        .rail-left {
          left: 0;
        }
        .rail-right {
          right: 0;
        }

        /* Scrollbar subtle */
        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.12);
        }
      `}</style>
    </div>
  );
};

/* A small reusable card for each workflow step */
const StepCard: React.FC<{
  id: string;
  title: string;
  color: string;
  prompt: string;
  platform: { name: string; url: string; color: string };
}> = ({ id, title, color, prompt, platform }) => {
  const [expanded, setExpanded] = useState(false);
  const copyPrompt = () => {
    navigator.clipboard.writeText(prompt);
  };
  return (
    <div
      id={id}
      className="border border-gray-700 rounded-lg p-4 md:p-6 bg-[#1A1A1A]"
      style={{ borderColor: color + "80" }}
    >
      <header className="flex items-center justify-between mb-2">
        <h3 className="font-semibold" style={{ color }}>
          {title}
        </h3>
        <div className="flex items-center space-x-2">
          <a
            href={platform.url}
            target="_blank"
            rel="noreferrer"
            className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
            style={{ background: platform.color + "33" }}
          >
            {platform.name}
          </a>
          <button
            onClick={copyPrompt}
            className="text-xs px-3 py-1 rounded bg-gray-700 hover:bg-gray-600"
          >
            Copy
          </button>
        </div>
      </header>
      <pre
        className={`text-xs whitespace-pre-wrap bg-black/50 p-3 rounded overflow-x-auto ${
          expanded ? "max-h-none" : "max-h-40"
        }`}
      >
        <code>{prompt}</code>
      </pre>
      {prompt.length > 400 && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 text-xs underline text-gray-400 hover:text-gray-200"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
};

// Helper component to render a list of workflow steps
const WorkflowRenderer: React.FC<{ steps: WorkflowStepMinimal[] }> = ({
  steps,
}) => {
  return (
    <div className="space-y-6">
      {steps.map((step, idx) => (
        <StepCard
          key={step.id}
          id={step.id}
          title={`${idx + 1}. ${step.title}`}
          color={COLORS[step.model as keyof typeof COLORS] || COLORS.none}
          prompt={step.rawPrompt}
          platform={
            PLATFORMS[step.model] || {
              name: step.model,
              url: "#",
              color: COLORS.none,
            }
          }
        />
      ))}
    </div>
  );
};

export default Guide;
