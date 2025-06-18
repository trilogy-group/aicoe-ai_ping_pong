# AI Ping-Pong Studio – **Master Reference Guide**

_Last updated: 2025-06-17_

---

## Table of Contents

1. [Introduction](#introduction)
2. [Philosophy & Background](#philosophy--background)
3. [End-to-End Workflow](#end-to-end-workflow)
4. [Tech Stack](#tech-stack)
5. [High-Level Architecture](#high-level-architecture)
6. [Folder & File Structure](#folder--file-structure)
7. [Frontend](#frontend)
8. [Backend / API Layer](#backend--api-layer)
9. [Prompt Library](#prompt-library)
10. [Default Scenarios & Workflows](#default-scenarios--workflows)
11. [Testing Strategy](#testing-strategy)
12. [Deployment Guide](#deployment-guide)
13. [Roadmap & Future Work](#roadmap--future-work)
14. [References](#references)

---

## Introduction

**AI Ping-Pong Studio** is a minimal but powerful multi-LLM orchestration playground.  
Instead of automated chains, the system **bounces** content between specialist language models—_GPT, Grok, Claude, Gemini_—leveraging each model's comparative advantage while keeping a human-in-the-loop.

> "Like table-tennis, each volley sharpens the final result."

The project currently ships as a Vite + React front-end with a thin, model-agnostic API wrapper. All state is local to the browser—no database required.

---

## Philosophy & Background

- **Interpretability over automation** – manual checkpoints keep humans accountable and able to intervene.
- **Capability-aware routing** – each model is assigned work that suits its strengths (e.g. Grok → live research, Claude → structure).
- **Public, subscription-free tooling** – everything works with the free web UIs or public APIs.
- **Rapid iteration** – short, high-leverage loops (5-13 steps) take ~10-15 minutes per assignment.

The idea contrasts with heavy agent-frameworks (LangChain, AutoGPT, etc.) by stressing **_clarity, flexibility and zero-setup_**.

---

## End-to-End Workflow

```
GPT ➜ Grok ➜ GPT ➜ Claude ➜ GPT  (Default 5-Step)
        ↘︎ optional loops ↙︎
```

1. **GPT** – Task definition & orchestration
2. **Grok** – Deep, real-time research
3. **GPT** – Integrate research, draft Claude brief
4. **Claude** – Logical structure & outline
5. **GPT** – Final editorial polish

Enhanced flows add Gemini, extra validation checkpoints and repetition (up to 13 steps).

---

## Tech Stack

| Layer       | Choice                                                          | Notes                                                  |
| ----------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| Front-end   | React 18 + Vite + TailwindCSS                                   | Instant HMR & bare-bones styling                       |
| State       | Zustand                                                         | Simpler than Redux, good for local storage persistence |
| Backend     | Lightweight _Next.js API routes_ **or** single _Express_ server | Swappable—only one `POST /api/run` route needed        |
| Model SDKs  | `openai`, `anthropic`, REST wrapper for Grok/Firecrawl          | Each wrapped in `src/lib`                              |
| Persistence | `localStorage`                                                  | No DB – portable PWA style                             |
| Tooling     | Vitest + React Testing Library                                  | See **Testing Strategy**                               |

---

## High-Level Architecture

### 1. Driver Architecture

A unified interface normalises every model call to:  
`Promise<ReadableStream<LLMChunk>>`

```typescript
interface LLMDriver {
  name: LLM;
  call(prompt: string, context: string[]): Promise<ReadableStream>;
  limit: number; // context tokens
  caps: string[]; // capability tags e.g. "live-web"
}
```

### 2. Workflow Engine

Keeps track of ordered `WorkflowStep[]`, context and fallbacks.

```typescript
runStep(step: WorkflowStep, ctx: WorkflowContext): Promise<ReadableStream>
```

_Capability-aware routing_ picks the best driver for each step, with JSON-defined fallback chains.

### 3. Token & Stream Management

All driver streams are wrapped to emit a standard JSON chunk protocol:

```json
{ "type": "token", "driver": "gpt", "content": "..." }
```

Smart truncation utilities keep prompts inside each model's context window (see `docs/ARCHITECTURE.md`).

---

## Folder & File Structure

```
├─ src/
│  ├─ components/
│  │  ├─ StepCard.tsx      # prompt card UI & run button
│  │  ├─ Timeline.tsx      # vertical list wrapper
│  │  └─ Guide.tsx         # educational guide + copy-paste prompts
│  ├─ lib/
│  │  ├─ openai.ts         # GPT wrapper
│  │  ├─ claude.ts         # Claude wrapper
│  │  ├─ grok.ts           # Grok/Firecrawl wrapper (mock fallback)
│  │  ├─ enhanced-prompts.ts # 11- & 13-step workflows
│  │  └─ workflow-engine.ts   # capability routing & context mgmt
│  ├─ store/
│  │  └─ useSession.ts     # Zustand global store
│  ├─ App.tsx              # Layout & router
│  └─ main.tsx             # Vite entrypoint
├─ prompts/                # Plain-text prompt library
│  ├─ gpt.txt
│  ├─ grok.txt
│  └─ claude.txt
└─ docs/                   # Additional in-depth guides (testing, deployment…)
```

---

## Frontend

### Components

- **StepCard** – Reusable UI block that shows the prompt, lets the user _copy_ or _run_ it, and reveals streaming output.
- **Timeline** – Simply maps over an array of steps and renders `StepCard` in order, disabling the _Run_ button until the prior step is complete.
- **Guide** – The in-product markdown guide (see `src/components/Guide.tsx`). It hosts:
  - _What / Why / Tips_ panels
  - Pre-made 5-step workflow
  - Ultra-Enhanced 11 & 13-step workflows
  - One-click _Copy_ buttons for each prompt

### State Management (`store/useSession.ts`)

```typescript
interface SessionState {
  steps: WorkflowStep[];
  outputs: (string | null)[];
  runStep: (i: number) => Promise<void>;
}
```

Persisted in `localStorage` for browser reload safety.

---

## Backend / API Layer

Single route → **POST `/api/run`**

```ts
switch (body.model) {
  case "gpt":
    return openAI(body.prompt, body.context);
  case "claude":
    return anthropic(body.prompt, body.context);
  case "grok":
    return grokSearch(body.prompt);
}
```

If an API key is missing the wrapper returns a _mock_ stream so the UI still functions offline.

---

## Prompt Library

Below are the canonical prompts embedded in `Guide.tsx`. Feel free to customise per assignment.

### 1. GPT — _Mediator, Evaluator & Editorial Orchestrator_

```text
You are the initiator and coordinator of the "AI Ping-Pong" workflow. You will:
	•	Start by synthesizing the initial idea into a complete task definition, requirements list, and evaluation plan.
	•	Send detailed research prompts to Grok
	•	Interpret Grok's findings
	•	Structure instructions for Claude
	•	Evaluate Claude's structure
	•	Loop back to Grok (if additional gaps are found)
	•	Conduct the final editorial and strategic polish before publication

🧭 GPT Master Prompt: Mediator, Evaluator, and Editorial Orchestrator

You are the central orchestrator in a structured, manual multi-model workflow called AI Ping-Pong, which cycles content through Claude (structure and reasoning), Grok (deep research), and GPT (you) to iteratively refine and elevate output.
Your job is to sit at the center of this process and act as:
	•	The evaluator of ideas and content
	•	The editor that improves clarity, logic, tone, and structure
	•	The mediator that guides next steps, detects gaps, and integrates inputs across the chain

You will be handed:
	•	A Statement of Work that outlines the full intent, deliverables, tone, quality requirements, structure, and strategic goals of the project
	•	A structured draft or content blocks produced by Claude
	•	Research summaries and citations produced by Grok

⸻

Your responsibilities as GPT:

1. Evaluate Claude's structured output:
	•	Does the article follow the requested structure? (Intro → Methodology → Validation → Strengths → Use Cases → Infographic → Conclusion)
	•	Are all sections clear, logical, and compelling?
	•	Are there redundancies, weak transitions, or confusing phrasings?
	•	Highlight any unclear logic or assumptions.

2. Integrate Grok's research precisely:
	•	Ensure that all claims or historical references in the draft are backed by real, verifiable sources from Grok's output.
	•	Check that citations are embedded clearly and match the claims.
	•	Suggest places where deeper sourcing or evidence would strengthen the argument.

3. Edit for tone, structure, and clarity:
	•	Match the tone and clarity of the sample article "Validated 10-Minute AI-to-Slides Workflow."
	•	Ensure the voice is confident, direct, slightly opinionated, and efficient.
	•	Use sharp transitions and plain language wherever possible.
	•	Remove jargon or vagueness.

4. Mediate and propose next steps:
	•	Identify where Claude or Grok may need to rework or expand content.
	•	Suggest what parts of the workflow need a second pass — structure, research, logic, framing, tone, etc.
	•	Optionally, generate short next-step prompts to send back to Claude or Grok to address gaps.

5. Final Quality Control:
	•	Confirm that the article, once polished, will meet the quality bar for Trilogy's CoE Microsite and Substack.
	•	Ensure it aligns with the CoE's goals: fast-cycle publishing, validated insight, strong POVs, and strategic internal relevance.
	•	If it doesn't meet the standard, clearly identify what's missing and how to resolve it.

⸻

Output Format:
	•	Use labeled sections (e.g., ✦ Evaluation, ✦ Integration Check, ✦ Editorial Notes, ✦ Next Steps, ✦ Final QC Summary)
	•	Use bullet points where helpful
	•	Be decisive and editorial — you are not just a summarizer, but a lead editor across the AI workflow

⸻

Once this role is defined, you will be responsible for the final pass on any AI Ping-Pong output before publication. Be thorough, critical, and constructive.
```

### 2. Grok — _Deep Research & Citations_

```text
You are acting as a research assistant helping to validate and contextualize a new manual AI workflow called AI Ping-Pong, which systematically cycles content through a series of public LLMs — typically:
Claude → GPT → Grok → GPT → Claude

The idea is to leverage each model's unique strengths in a structured, manual (non-automated) iterative cycle. For example:
	•	Claude is used for deep reasoning and content structuring.
	•	GPT is used as the central mediator — interpreting structure, planning next steps, checking alignment, and refining output.
	•	Grok is used for deep, timely research to enrich and fact-check the content.
	•	Then the process cycles again: GPT interprets Grok's research, Claude restructures the output, and so on.

Your task is to conduct an exhaustive, comprehensive search into whether this concept has already been explored — and if so, how, when, why, and with what results.
This workflow will be the foundation for a technical article and infographic intended to influence high-level AI strategy at Trilogy and across multiple departments.

I want your research output to be highly structured, citation-backed, and explicitly answer the following:
	1.	Has anything like this been done before?
	•	Look for any blog posts, whitepapers, GitHub repos, case studies, or published research that describes multi-LLM workflows where each model has a defined role and the process is iterative and manual (i.e., not one-click or API automation).
	•	If similar workflows exist (e.g., in academia, product teams, tool comparisons, AI orchestration), describe them in detail.
	2.	How does this compare to automated orchestration tools like n8n, LangChain, or AutoGPT?
	•	List pros and cons of manual vs. automated chaining.
	•	Emphasize interpretability, flexibility, feature adoption, speed, and error handling.
	•	Cite expert perspectives or case studies where possible.
	3.	Why haven't we seen more of this in industry — or why hasn't it caught on yet?
	•	Is it a UX problem? Trust? Lack of awareness? Friction?
	•	Provide informed, cited speculation or opinionated writing from credible sources.
	4.	Who (if anyone) is talking about this idea?
	•	Find and quote respected thought leaders who've commented on multi-agent AI workflows or manual+human-in-the-loop systems.
	•	Prioritize industry leaders like Marc Benioff (Salesforce), Rob Thomas (IBM), Jason Fried (Basecamp), or those writing at Anthropic, OpenAI, Google DeepMind, etc.
	5.	Include references for every major claim.
	•	Prioritize source links to public, verifiable resources: blog posts, interviews, peer-reviewed papers, GitHub repos, case studies, or reputable industry articles.
	•	Include author names, publication dates, and exact source titles where possible.

Output format:
	•	Organize findings into clearly labeled sections.
	•	Bullet-point all key facts.
	•	Include source links at the end of each bullet.
	•	Highlight contradictions or differing opinions where relevant.
```

### 3. Claude — _Logical Architect & Structure Guru_

```text
You are acting as a senior technical writer structuring a high-clarity, high-impact article aimed at AI researchers, engineers, and product leaders across Trilogy.

The piece will describe a novel, structured, manual workflow called AI Ping-Pong, which cycles content between multiple LLMs in the following order:
GPT → Grok → GPT → Claude → GPT → Grok (if needed) → GPT — to iteratively refine ideas, gather validated research, and produce structured execution-ready content.

This method leverages each model's unique strengths:
	•	GPT as the primary orchestrator, mediator, and content integrator
	•	Grok for deep research and verified sourcing
	•	Claude for clean logical structure, reasoning, and outlining

This is a manual, human-driven alternative to automated AI orchestration tools like n8n, LangChain, or AutoGPT. The focus is on interpretability, adaptability, and maximizing public model capabilities without code or rigid sequences.

You are brought into the process after:
	•	GPT has synthesized the initial Statement of Work
	•	Grok has returned the first round of validated research
	•	GPT has evaluated both and defined the structure goals

You will use:
	•	A detailed Statement of Work outlining scope, deliverables, and success criteria
	•	Verified research findings from Grok, including expert validation and prior art
	•	A tone and formatting reference modeled on: "Validated 10-Minute AI-to-Slides Workflow"
	•	Your role is to translate this input into a clearly structured, block-by-block article draft, to be reviewed and refined by GPT before publication.
⸻

Your task is to structure the full article in detail — block-by-block — using the following outline:

1. Introduction
	•	Set the context: the AI tool landscape, the rise of automation, the gaps in current workflows.
	•	Introduce the concept of AI Ping-Pong and what makes it novel.
	•	Hook the reader with a statement like: "Why it matters now."

2. Purpose & Methodology
	•	Explain the rationale for the project.
	•	Describe each step of the workflow with full clarity (e.g., what Claude does, how GPT interprets, what Grok delivers).
	•	Use clear transitions to show how content moves between models.
	•	Include prompt examples or templates if useful.

3. Validation & Historical Context
	•	Summarize Grok's research on whether similar ideas have been tried before.
	•	Clearly show how this approach builds on, diverges from, or improves upon past work.
	•	Cite 3–5 sources or expert validations with clear links.

4. Strengths & Limitations
	•	Bullet-point each core advantage of this workflow (e.g., flexibility, speed, interpretability, instant access to latest features).
	•	Include 1–2 real limitations or challenges (e.g., manual overhead, reliance on user skill).
	•	Back each claim with a source or rationale.

5. Use Cases & Departmental Fit
	•	Provide 2–3 specific, realistic applications of this workflow inside Trilogy: e.g., content ops, research, strategy, marketing.
	•	Make it obvious why this method applies beyond engineers.

6. Infographic Blueprint
	•	Write a paragraph clearly describing what the infographic should include (visual workflow, role of each model, looping structure, mediation layer, benefits).
	•	Make this so clear a designer could execute it with no back-and-forth.

7. Conclusion & Strategic Alignment
	•	Tie the value of this workflow to Trilogy's CoE goals.
	•	Reinforce its relevance to fast-cycle publishing, public innovation, and internal tooling efficiency.
	•	End with a strong version of: "Why this matters now."

⸻

Final Instructions:
	•	Do not write the prose yet — structure everything in labeled sections with full clarity.
	•	Language should mirror the tone of the sample article: sharp, confident, efficient, and opinionated.
	•	Use Grok's research wherever citations are required.
	•	Mark any missing pieces that I need to fill in before finalizing.
```

---

## Default Scenarios & Workflows

### 5-Step "Article" Flow (Guide.tsx)

| #   | Model  | Title                                |
| --- | ------ | ------------------------------------ |
| 1   | GPT    | Task Definition & Plan               |
| 2   | Grok   | Deep Research & Citations            |
| 3   | GPT    | Evaluate & Draft Claude Instructions |
| 4   | Claude | Structure the Article / Asset        |
| 5   | GPT    | Final Editorial Polish               |

> _Tip:_ Only unlock the next step after the previous one is **completed & reviewed**.

### Ultra-Enhanced Article Workflow (13 Steps)

Key steps pulled from `src/lib/enhanced-prompts.ts`:

1. Gemini – Deep Content Understanding
2. GPT – Strategic Task Clarification
3. Grok – Comprehensive Real-Time Research
4. Gemini – Source Validation
5. Claude – Advanced Logical Architecture
6. GPT – Premium Content Draft  
   (_…plus 7 further polish and validation steps—see code for full list._)

### Ultra-Enhanced Research Workflow (11 Steps)

Follows a similar structure with heavier emphasis on data verification.

---

## Testing Strategy

High-level test suites stored in `docs/TESTING.md` focus on:

- **Unit** – driver wrappers, truncation util, store actions.
- **Integration** – `/api/run` happy-path & error fallbacks.
- **E2E** – Cypress script that runs the 5-step flow with mocked API responses.

---

## Deployment Guide

1. **Build**: `pnpm run build` – outputs `dist/` for static hosting.
2. **Preview**: `pnpm run preview` – local prod server.
3. **Edge Functions**: API route is serverless-friendly; deploy to Vercel/Netlify in <30 s.  
   Full details in `docs/DEPLOYMENT.md`.

---

## Roadmap & Future Work

- [ ] Live SSE streaming for token-level updates.
- [ ] OAuth login; save sessions to user profiles.
- [ ] Real Grok DeepSearch once API is stable.
- [ ] One-click _Export → Markdown_ using `remark`.
- [ ] Interactive _prompt editor_ with version history.

---

## References

- Original one-shot repo scaffold: `task/plan.txt`
- In-depth architecture diagrams: `docs/ARCHITECTURE.md`
- Testing matrix: `docs/TESTING.md`
- Deployment cookbook: `docs/DEPLOYMENT.md`
- API contract: `docs/API.md`

---

> © 2024 – AI Ping-Pong Studio  
> MIT License
