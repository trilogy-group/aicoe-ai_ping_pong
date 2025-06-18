import React, { useState } from "react";
import { X, FileText, Zap } from "lucide-react";

interface UserInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userInput: string) => void;
  workflowName: string;
}

export const UserInputModal: React.FC<UserInputModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  workflowName,
}) => {
  const [userInput, setUserInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!userInput.trim()) return;

    setIsSubmitting(true);
    await onSubmit(userInput.trim());
    setIsSubmitting(false);
    setUserInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Describe Your Project</h2>
                <p className="text-blue-100">
                  {workflowName} • AI-Powered Workflow
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center hover:bg-opacity-30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Project Description
            </label>
            <p className="text-sm text-gray-600 mb-4">
              Describe your project, research question, or task in as much
              detail as you'd like. The AI will analyze your input and create a
              comprehensive workflow tailored to your needs.
            </p>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Example: I need to research the impact of remote work on employee productivity in tech companies. I want to understand current trends, analyze benefits and challenges, and provide recommendations for HR policies..."
              className="w-full h-48 p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none resize-none text-sm leading-relaxed"
            />
            <div className="text-xs text-gray-500 mt-2">
              Tip: Press Cmd+Enter (Mac) or Ctrl+Enter (Windows) to submit
            </div>
          </div>

          {/* Examples */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-900 mb-3">
              Example Inputs:
            </h4>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>
                  <strong>Research:</strong> "Analyze the environmental impact
                  of cryptocurrency mining"
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>
                  <strong>Email Response:</strong> "Client is asking about
                  project delays and budget overruns"
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>
                  <strong>Article:</strong> "Write about the future of AI in
                  healthcare and patient outcomes"
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {userInput.length} characters
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!userInput.trim() || isSubmitting}
              className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-all ${
                !userInput.trim() || isSubmitting
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>{isSubmitting ? "Starting..." : "Start Workflow"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
