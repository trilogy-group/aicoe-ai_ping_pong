import React from "react";
import {
  CheckCircle,
  Circle,
  Loader2,
  AlertCircle,
  Clock,
  Bot,
} from "lucide-react";
import { Step } from "../types";

interface StepMarkerProps {
  step: Step;
  stepIndex: number;
  isActive: boolean;
  onClick: () => void;
}

const modelIcons = {
  gpt: "🤖",
  claude: "🧠",
  grok: "⚡",
} as const;

const modelColors = {
  gpt: "border-green-400 bg-green-50",
  claude: "border-orange-400 bg-orange-50",
  grok: "border-purple-400 bg-purple-50",
} as const;

const statusIcons = {
  idle: Circle,
  running: Loader2,
  done: CheckCircle,
  error: AlertCircle,
  needs_clarification: Clock,
};

const statusColors = {
  idle: "text-gray-400",
  running: "text-blue-500 animate-spin",
  done: "text-green-500",
  error: "text-red-500",
  needs_clarification: "text-yellow-500",
};

export const StepMarker: React.FC<StepMarkerProps> = ({
  step,
  stepIndex,
  isActive,
  onClick,
}) => {
  // Type guard for model
  const isValidModel = (model: string): model is keyof typeof modelIcons => {
    return model in modelIcons;
  };

  // Type guard for status
  const isValidStatus = (
    status: string
  ): status is keyof typeof statusIcons => {
    return status in statusIcons;
  };

  const safeModel = isValidModel(step.model) ? step.model : "gpt";
  const safeStatus = isValidStatus(step.status) ? step.status : "idle";
  const StatusIcon = statusIcons[safeStatus];

  return (
    <div
      onClick={onClick}
      className={`group relative cursor-pointer transition-all duration-200 ${
        isActive ? "transform scale-105" : "hover:transform hover:scale-102"
      }`}
    >
      <div
        className={`relative bg-white rounded-xl border-2 p-4 shadow-sm transition-all duration-200 ${
          isActive
            ? `${modelColors[safeModel]} border-2 shadow-lg`
            : safeStatus === "done"
            ? "border-green-200 bg-green-50 hover:border-green-300"
            : safeStatus === "error"
            ? "border-red-200 bg-red-50 hover:border-red-300"
            : safeStatus === "running"
            ? "border-blue-200 bg-blue-50 hover:border-blue-300"
            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
        }`}
      >
        {/* Active indicator */}
        {isActive && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border">
              <span className="text-sm">{modelIcons[safeModel]}</span>
            </div>
            <div className="text-xs font-bold text-gray-700">
              Step {stepIndex + 1}
            </div>
          </div>
          <StatusIcon className={`w-4 h-4 ${statusColors[safeStatus]}`} />
        </div>

        <div className="space-y-2">
          <h4
            className={`font-semibold text-sm leading-tight ${
              isActive ? "text-gray-900" : "text-gray-800"
            }`}
          >
            {step.title}
          </h4>

          <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
            {step.description}
          </p>

          {/* Progress indicator for completed steps */}
          {safeStatus === "done" && step.output && (
            <div className="text-xs text-gray-500 bg-white bg-opacity-70 rounded px-2 py-1 truncate">
              ✓ {step.output.slice(0, 50)}...
            </div>
          )}

          {/* Error indicator */}
          {safeStatus === "error" && step.error && (
            <div className="text-xs text-red-600 bg-red-100 rounded px-2 py-1 truncate">
              ⚠ {step.error.slice(0, 40)}...
            </div>
          )}

          {/* Running indicator */}
          {safeStatus === "running" && (
            <div className="text-xs text-blue-600 bg-blue-100 rounded px-2 py-1 flex items-center space-x-1">
              <Bot className="w-3 h-3" />
              <span>Processing...</span>
            </div>
          )}
        </div>

        {/* Bottom accent line */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-xl transition-all duration-200 ${
            isActive
              ? safeModel === "gpt"
                ? "bg-gradient-to-r from-green-400 to-emerald-500"
                : safeModel === "claude"
                ? "bg-gradient-to-r from-orange-400 to-red-500"
                : "bg-gradient-to-r from-purple-400 to-pink-500"
              : safeStatus === "done"
              ? "bg-green-300"
              : safeStatus === "error"
              ? "bg-red-300"
              : safeStatus === "running"
              ? "bg-blue-300"
              : "bg-gray-200"
          }`}
        />
      </div>
    </div>
  );
};
