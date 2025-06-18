export type ModelType = "gpt" | "claude" | "grok" | "gemini";

export type StepStatus =
  | "idle"
  | "running"
  | "done"
  | "error"
  | "needs_clarification";

export interface Step {
  id: string;
  model: ModelType;
  title: string;
  description: string;
  rawPrompt: string; // template with {{vars}}
  prompt: string; // hydrated prompt
  timeEstimate: number; // in minutes
  status: StepStatus;
  output?: string;
  error?: string;
  clarificationQuestion?: string;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  steps: Step[];
  estimatedMinutes: number;
}

export interface SessionMetadata {
  totalSteps: number;
  completedSteps: number;
  estimatedTimeRemaining: number;
  totalTokensUsed: number;
}

export interface SessionState {
  currentScenario: string | null;
  steps: Step[];
  currentIdx: number;
  metadata: SessionMetadata;
  isRunningAll: boolean;
  userInput?: string;
}

export interface ApiRequest {
  model: ModelType;
  prompt: string;
  context?: string;
  stepId: string;
  userInput?: string;
}

export interface ApiResponse {
  success: boolean;
  data?: string;
  error?: string;
  needs_clarification?: boolean;
  clarification_question?: string;
}

export interface ModelConfig {
  name: string;
  color: string;
  icon: string;
  description: string;
  strengths: string[];
}
