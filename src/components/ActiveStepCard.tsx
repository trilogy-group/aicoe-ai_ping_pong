import React from "react";
import { useSession } from "../store/useSession";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Bot,
  Clock,
  Zap,
} from "lucide-react";
import { Step } from "../types";

interface ActiveStepCardProps {
  step: Step;
  stepIndex: number;
}

const modelIcons = {
  gpt: "🤖",
  claude: "🧠",
  grok: "⚡",
} as const;

const modelColors = {
  gpt: "from-green-400 to-emerald-500",
  claude: "from-orange-400 to-red-500",
  grok: "from-purple-400 to-pink-500",
} as const;

const modelNames = {
  gpt: "GPT",
  claude: "Claude",
  grok: "Grok",
} as const;

export const ActiveStepCard: React.FC<ActiveStepCardProps> = ({
  step,
  stepIndex,
}) => {
  const isRunning = step.status === "running";
  const isDone = step.status === "done";
  const hasError = step.status === "error";
  const needsClarification = step.status === "needs_clarification";

  // Type guard for model
  const isValidModel = (model: string): model is keyof typeof modelIcons => {
    return model in modelIcons;
  };

  const safeModel = isValidModel(step.model) ? step.model : "gpt";

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div
        className={`bg-gradient-to-r ${modelColors[safeModel]} p-6 text-white relative overflow-hidden`}
      >
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-2xl">{modelIcons[safeModel]}</span>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <h2 className="text-2xl font-bold">{step.title}</h2>
                  <span className="text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full backdrop-blur-sm">
                    Step {stepIndex + 1}
                  </span>
                </div>
                <p className="text-white text-opacity-90 text-lg">
                  {step.description}
                </p>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center space-x-2">
              {isRunning && (
                <div className="flex items-center space-x-2 bg-white bg-opacity-20 px-4 py-2 rounded-xl backdrop-blur-sm">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-medium">Running...</span>
                </div>
              )}
              {isDone && (
                <div className="flex items-center space-x-2 bg-emerald-500 bg-opacity-20 px-4 py-2 rounded-xl backdrop-blur-sm border border-emerald-300">
                  <CheckCircle className="w-5 h-5 text-emerald-100" />
                  <span className="font-medium text-emerald-100">Complete</span>
                </div>
              )}
              {hasError && (
                <div className="flex items-center space-x-2 bg-red-500 bg-opacity-20 px-4 py-2 rounded-xl backdrop-blur-sm border border-red-300">
                  <AlertCircle className="w-5 h-5 text-red-100" />
                  <span className="font-medium text-red-100">Error</span>
                </div>
              )}
              {needsClarification && (
                <div className="flex items-center space-x-2 bg-yellow-500 bg-opacity-20 px-4 py-2 rounded-xl backdrop-blur-sm border border-yellow-300">
                  <Clock className="w-5 h-5 text-yellow-100" />
                  <span className="font-medium text-yellow-100">
                    Needs Input
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Model Badge */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-white bg-opacity-20 px-4 py-2 rounded-xl backdrop-blur-sm">
              <Bot className="w-4 h-4" />
              <span className="font-semibold">{modelNames[safeModel]}</span>
            </div>
            <div className="text-sm text-white text-opacity-80">
              {step.description?.includes("synthesis")
                ? "Creative synthesis and natural language flow"
                : step.description?.includes("analysis")
                ? "Logical structuring and analysis"
                : step.description?.includes("research")
                ? "Real-time data retrieval and validation"
                : "AI-powered processing"}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 space-y-8">
        {/* Error Display */}
        {hasError && step.error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h4 className="font-semibold text-red-800">Error</h4>
            </div>
            <p className="text-red-700 leading-relaxed">{step.error}</p>
          </div>
        )}

        {/* Clarification Display */}
        {needsClarification && step.clarificationQuestion && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-3">
              <Clock className="w-5 h-5 text-yellow-600" />
              <h4 className="font-semibold text-yellow-800">
                Clarification Needed
              </h4>
            </div>
            <p className="text-yellow-700 leading-relaxed">
              {step.clarificationQuestion}
            </p>
          </div>
        )}

        {/* Output Section */}
        {step.output && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <Bot className="w-5 h-5 mr-2 text-green-500" />
                Output
              </h3>
              {isDone && (
                <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Complete</span>
                </div>
              )}
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-6 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                {step.output}
              </pre>
            </div>
          </div>
        )}

        {/* Running Status */}
        {isRunning && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
            <div className="flex items-center justify-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-blue-800 font-medium">
                Processing with {modelNames[safeModel]}...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
