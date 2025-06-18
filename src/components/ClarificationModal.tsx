import React, { useState } from "react";
import { useSession } from "../store/useSession";
import { X, MessageCircle, Send } from "lucide-react";

interface ClarificationModalProps {
  stepIndex: number;
  question: string;
  onClose: () => void;
}

export const ClarificationModal: React.FC<ClarificationModalProps> = ({
  stepIndex,
  question,
  onClose,
}) => {
  const { submitClarification } = useSession();
  const [response, setResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!response.trim()) return;

    setIsSubmitting(true);
    try {
      await submitClarification(stepIndex, response);
      onClose();
    } catch (error) {
      console.error("Failed to submit clarification:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Clarification Needed</h2>
                <p className="text-blue-100 text-sm">
                  Step {stepIndex + 1} requires additional input
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center hover:bg-opacity-30 transition-all duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Question */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <MessageCircle className="w-5 h-5 mr-2 text-blue-500" />
              AI Request
            </h3>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <p className="text-gray-800 leading-relaxed">{question}</p>
            </div>
          </div>

          {/* Response Input */}
          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              Your Response
            </label>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-32 p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none resize-none transition-all duration-200"
              placeholder="Please provide the clarification requested above..."
              autoFocus
            />
            <div className="mt-2 text-sm text-gray-500">
              Press{" "}
              <kbd className="px-2 py-1 bg-gray-100 rounded font-mono">
                Cmd+Enter
              </kbd>{" "}
              to submit
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              onClick={handleSubmit}
              disabled={!response.trim() || isSubmitting}
              className={`flex-1 flex items-center justify-center space-x-3 px-6 py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                !response.trim() || isSubmitting
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105"
              }`}
            >
              <Send className="w-5 h-5" />
              <span>{isSubmitting ? "Submitting..." : "Submit Response"}</span>
            </button>

            <button
              onClick={onClose}
              className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
