import { ModelType } from "../types";

export interface APIRequest {
  model: string;
  prompt: string;
  context?: string;
  stepIndex?: number;
  previousOutputs?: string[];
}

export interface APIResponse {
  success: boolean;
  data?: string;
  error?: string;
  needs_clarification?: boolean;
  clarification_question?: string;
  metadata?: {
    tokensUsed?: number;
    strategy?: string;
    processingTime?: number;
  };
}

// Mock implementation for demonstration
export async function sendRequest(request: APIRequest): Promise<APIResponse> {
  // Simulate API delay
  await new Promise((resolve) =>
    setTimeout(resolve, 1000 + Math.random() * 2000)
  );

  // Simulate different scenarios based on step index
  const stepIndex = request.stepIndex || 0;

  if (stepIndex === 2 && Math.random() < 0.3) {
    return {
      success: false,
      needs_clarification: true,
      clarification_question:
        "Could you please specify whether you want the analysis to focus on technical implementation or business impact?",
    };
  }

  if (Math.random() < 0.1) {
    return {
      success: false,
      error: "API temporarily unavailable. Please try again.",
    };
  }

  // Generate mock response based on model
  const responses = {
    gpt: `Creative response from GPT for: "${request.prompt.slice(0, 50)}..."
    
Here's an innovative approach with fresh perspectives and engaging content that builds on your objectives.`,

    claude: `Analytical response from Claude for: "${request.prompt.slice(
      0,
      50
    )}..."
    
I've carefully analyzed your request and identified the logical structure and key reasoning points that need to be addressed.`,

    gemini: `Document-based response from Gemini for: "${request.prompt.slice(
      0,
      50
    )}..."
    
Using my vast document analysis capabilities, I've processed the information and generated comprehensive insights.`,

    grok: `Research-based response from Grok for: "${request.prompt.slice(
      0,
      50
    )}..."
    
Based on the latest data and current trends, here are the key findings and supporting evidence.`,
  };

  return {
    success: true,
    data:
      responses[request.model as ModelType] ||
      `Response from ${request.model}: Mock output for testing the workflow.`,
    metadata: {
      tokensUsed: Math.floor(Math.random() * 1000) + 200,
      processingTime: Math.floor(Math.random() * 3000) + 500,
    },
  };
}
