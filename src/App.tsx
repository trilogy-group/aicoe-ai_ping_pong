import React, { useState, useEffect } from "react";
import { useSession } from "./store/useSession";
import {
  Play,
  RotateCcw,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getAllScenarios } from "./lib/prompts";
import ReactMarkdown from "react-markdown";
import Guide from "./components/Guide";
import DataDocs from "./components/DataDocs";

function App() {
  const COLORS = {
    gpt: "#4ade80",
    claude: "#fb923c",
    grok: "#c084fc",
    gemini: "#60a5fa",
    none: "#ffffff",
    red: "#fb3c3c",
    yellow: "#f59e0b",
    gray: "#808080",
    green: "#4ade80",
    blue: "#60a5fa",
  };

  const {
    currentScenario,
    steps,
    currentIdx,
    resetSession,
    loadScenario,
    runAllSteps,
    isRunning: isWorkflowRunning,
  } = useSession();

  const [showGuide, setShowGuide] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [input, setInput] = useState("");
  const [selectedScenario, setSelectedScenario] = useState("article");
  const [showPrompt, setShowPrompt] = useState(true);
  const [isLogPanelOpen, setIsLogPanelOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("none");
  const [leftPaddleY, setLeftPaddleY] = useState(200);
  const [rightPaddleY, setRightPaddleY] = useState(200);
  const [isLeftHovered, setIsLeftHovered] = useState(false);
  const [isRightHovered, setIsRightHovered] = useState(false);
  const [ballHit, setBallHit] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  const scenarios = getAllScenarios();

  // Check URL param e.g., ?page=guide or ?page=docs
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get("page")?.toLowerCase();
    if (pageParam === "guide") {
      setShowGuide(true);
    } else if (pageParam === "docs" || pageParam === "data") {
      setShowDocs(true);
    }
  }, []);

  // Sync URL query param with Guide / Docs visibility
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const current = params.get("page")?.toLowerCase();
    if (showGuide) {
      if (current !== "guide") params.set("page", "guide");
    } else if (showDocs) {
      if (current !== "docs") params.set("page", "docs");
    } else {
      if (current) params.delete("page");
    }
    const query = params.toString();
    const newUrl = `${window.location.pathname}${query ? `?${query}` : ""}${
      window.location.hash
    }`;
    window.history.replaceState({}, "", newUrl);
  }, [showGuide, showDocs]);

  const handleRun = () => {
    if (input.trim()) {
      loadScenario(selectedScenario, input.trim());
      setShowPrompt(false);
      setIsLogPanelOpen(true);
      setTimeout(() => {
        runAllSteps();
      }, 300);
    }
  };

  const handleReset = () => {
    resetSession();
    setInput("");
    setShowPrompt(true);
  };

  const toggleLogPanel = () => {
    setIsLogPanelOpen(!isLogPanelOpen);
  };

  // Get current active models
  const getActiveModels = () => {
    if (!steps.length) return [];
    const currentStep = steps[currentIdx];
    if (!currentStep) return [];

    if (isWorkflowRunning) {
      return [currentStep.model];
    }

    return [];
  };

  const activeModels = getActiveModels();
  const completedSteps = steps.filter((s) => s.status === "done").length;

  // Get current model for ball color
  const getCurrentModelColor = () => {
    if (!isWorkflowRunning || !steps.length) return COLORS.none;
    const currentStep = steps[currentIdx];
    if (!currentStep) return COLORS.none;

    return COLORS[currentStep.model] || COLORS.none;
  };

  const setModel = () => {
    if (!steps.length) return "none";
    const currentStep = steps[currentIdx];
    if (!currentStep) return "none";

    setSelectedModel(currentStep.model);
  };

  // Get latest output for markdown display
  const getMarkdownContent = () => {
    const defaultContent = {
      title: "AI Ping-Pong Studio v4 - Multi-Model Workflow Engine",
      content: `## 🏓 What is AI Ping-Pong?

Like ping-pong bounces a ball between players, we bounce your request between different AI models. Each AI adds their expertise:

• **GPT**: Creative writing  
• **Claude**: Logical analysis  
• **Gemini**: Research & facts  
• **Grok**: Real-time data  

## How It Works

 **Request -> AI Ping-Pong -> Researched Result in 10 minutes**

Ready to start the rally?`,
    };

    if (!steps.length) {
      return defaultContent;
    }

    const getCurrentStepDescription = () => {
      if (!steps.length) {
        defaultContent.content = "Processing your request";
        return defaultContent;
      }
      const previousStep = steps[currentIdx - 1];
      if (!previousStep) {
        defaultContent.content = "Processing your request";
        return defaultContent;
      }

      // if this is the final step, return the output
      if (currentIdx === steps.length - 1 && !isWorkflowRunning) {
        const finalStep = steps[currentIdx];
        defaultContent.content = finalStep.output || "";
        defaultContent.title = "Final Output";
      } else {
        // otherwise, return the previous step's output
        defaultContent.content = previousStep.output || "";
        defaultContent.title = previousStep.title || "";
      }

      // if the content is empty, return the content from the previous step
      if (!defaultContent.content) {
        defaultContent.content =
          previousStep.output || "Processing your request";
      }

      return defaultContent;
    };

    return getCurrentStepDescription();
  };

  const markdownContent = getMarkdownContent();

  useEffect(() => {
    setModel();
  }, [steps]);

  // Mouse tracking for paddles
  const handleMouseMove = (e: MouseEvent) => {
    const mouseY = e.clientY;
    const screenHeight = window.innerHeight;
    const paddleY = Math.max(0, Math.min(screenHeight - 200, mouseY - 140)); // Constrain paddle within screen bounds

    // Ball position (fixed at 200px from top)
    const ballY = 200;
    const ballTolerance = 60; // How close mouse needs to be to ball

    // Left paddle zone (left 150px of screen)
    if (e.clientX < 150) {
      setIsLeftHovered(true);
      setLeftPaddleY(paddleY);

      // Check if mouse is near ball when ball is on left side
      if (Math.abs(mouseY - ballY) < ballTolerance && e.clientX < 50) {
        setBallHit(true);
        setTimeout(() => setBallHit(false), 150);
      }
    } else {
      setIsLeftHovered(false);
    }

    // Right paddle zone (right 150px of screen)
    if (e.clientX > window.innerWidth - 150) {
      setIsRightHovered(true);
      setRightPaddleY(paddleY);

      // Check if mouse is near ball when ball is on right side
      if (
        Math.abs(mouseY - ballY) < ballTolerance &&
        e.clientX > window.innerWidth - 50
      ) {
        setBallHit(true);
        setTimeout(() => setBallHit(false), 150);
      }
    } else {
      setIsRightHovered(false);
    }
  };

  const handleMouseLeave = () => {
    setIsLeftHovered(false);
    setIsRightHovered(false);
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  if (showGuide) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowGuide(false)}
          className="fixed top-4 left-4 z-50 bg-gray-800 text-gray-200 px-3 py-1 rounded hover:bg-gray-700 text-sm flex items-center space-x-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <Guide />
      </div>
    );
  }

  if (showDocs) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDocs(false)}
          className="fixed top-4 left-4 z-50 bg-gray-800 text-gray-200 px-3 py-1 rounded hover:bg-gray-700 text-sm flex items-center space-x-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <DataDocs />
      </div>
    );
  }

  return (
    <>
      {showDisclaimer && (
        <div
          className="relative bg-amber-100 text-amber-800 text-sm px-3 py-2 text-center"
          style={{ zIndex: 9999 }}
        >
          ⚠️ Demo notice: This application is experimental and credits for the
          AI models are limited. Service may stop once the quota is exhausted.
          Use for demonstration and visual exploration only.
          <button
            onClick={() => setShowDisclaimer(false)}
            className="absolute right-2 top-1 text-amber-800 hover:text-amber-900 font-bold"
            aria-label="Dismiss demo notice"
          >
            ×
          </button>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;700&display=swap');
        
        /* Pong Ball Animation - Linear speed based on screen pixels */
        @keyframes pong {
          0%   { transform: translateX(0px); }
          50%  { transform: translateX(calc(100vw - 28px)); }
          100% { transform: translateX(0px); }
        }
        
        /* Paddle Animations - Linear movement timed to ball */
        @keyframes paddleLeft {
          0%   { transform: translateY(180px); }
          2%   { transform: translateY(200px); }
          98%  { transform: translateY(200px); }
          100% { transform: translateY(180px); }
        }
        
        @keyframes paddleRight {
          0%   { transform: translateY(200px); }
          48%  { transform: translateY(200px); }
          50%  { transform: translateY(180px); }
          52%  { transform: translateY(200px); }
          100% { transform: translateY(200px); }
        }
        
        .ball {
          position: fixed;
          top: 200px;
          left: 0;
          width: 28px;
          height: 28px;
          border-radius: 9999px;
          background: ${getCurrentModelColor()};
          filter: drop-shadow(0 0 12px ${getCurrentModelColor()});
          animation: pong 10s linear infinite;
          transform: ${ballHit ? "scale(1.3)" : "scale(1)"};
          z-index: 0;
          transition: transform 0.1s ease-out, background 0.3s ease, filter 0.3s ease;
        }
        
        /* Paddles */
        .paddle-left {
          position: fixed;
          top: 100px;
          left: 8px;
          width: 6px;
          height: 80px;
          background: linear-gradient(to bottom, ${
            COLORS.none
          }, rgba(255,255,255,0.3), ${COLORS.none});
          border-radius: 3px;
          filter: drop-shadow(0 0 8px ${COLORS.none});
          animation: ${
            isLeftHovered ? "none" : "paddleLeft 10s linear infinite"
          };
          transform: translateY(${isLeftHovered ? leftPaddleY : 0}px);
          transition: ${isLeftHovered ? "none" : "transform 0.1s ease-out"};
          z-index: 0;
        }
        
        .paddle-right {
          position: fixed;
          top: 100px;
          right: 8px;
          width: 6px;
          height: 80px;
          background: linear-gradient(to bottom, ${
            COLORS.none
          }, rgba(255,255,255,0.3), ${COLORS.none});
          border-radius: 3px;
          filter: drop-shadow(0 0 8px ${COLORS.none});
          animation: ${
            isRightHovered ? "none" : "paddleRight 10s linear infinite"
          };
          transform: translateY(${isRightHovered ? rightPaddleY : 0}px);
          transition: ${isRightHovered ? "none" : "transform 0.1s ease-out"};
          z-index: 0;
        }
        
        /* Hover zones for paddle interaction */
        .paddle-zone-left {
          position: fixed;
          top: 0;
          left: 0;
          width: 150px;
          height: 100vh;
          z-index: 1;
          cursor: none;
        }
        
        .paddle-zone-right {
          position: fixed;
          top: 0;
          right: 0;
          width: 150px;
          height: 100vh;
          z-index: 1;
          cursor: none;
        }
        
        /* Vertical Rails */
        .rail-left {
          position: fixed;
          top: 0;
          left: 0;
          width: 2px;
          height: 100vh;
          background: linear-gradient(to bottom, transparent, ${
            COLORS.none
          }, transparent);
          filter: blur(0.5px);
          z-index: 0;
        }
        
        .rail-right {
          position: fixed;
          top: 0;
          right: 0;
          width: 2px;
          height: 100vh;
          background: linear-gradient(to bottom, transparent, ${
            COLORS.none
          }, transparent);
          filter: blur(0.5px);
          z-index: 0;
        }
        
        /* Model LEDs */
        .model-led {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          transition: all 200ms ease-out;
          opacity: 0.3;
        }
        
        .model-led.active {
          opacity: 1;
          box-shadow: 0 0 8px currentColor;
        }
        
        .gpt { background: ${COLORS.gpt}; }
        .claude { background: ${COLORS.claude}; }
        .grok { background: ${COLORS.grok}; }
        .gemini { background: ${COLORS.gemini}; }
        .none { background: ${COLORS.none}; }

        .gpt-text { color: #10a37f; }
        .claude-text { color: #d97706; }
        .grok-text { color: ${COLORS.grok}; }
        .gemini-text { color: ${COLORS.gemini}; }
        .none-text { color: ${COLORS.none}; }

        /* Execution Log Panel Animation */
        .log-panel {
          transform: translateX(0);
          transition: transform 0.3s ease-in-out;
        }
        
        .log-panel.closed {
          transform: translateX(100%);
        }
        
        .main-content {
          transition: margin-right 0.3s ease-in-out;
        }
        
        .main-content.expanded {
          margin-right: 0;
        }
        
        /* Execution Log Styling */
        .execution-log {
          height: calc(100vh - 120px);
          overflow-y: auto;
        }
        
        .execution-log::-webkit-scrollbar {
          width: 4px;
        }
        
        .execution-log::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1);
        }
        
        .execution-log::-webkit-scrollbar-thumb {
          background: rgba(0, 255, 191, 0.3);
          border-radius: 2px;
        }
        
        .execution-log::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 255, 191, 0.5);
        }
        
        .step-status-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }
        
        /* Toggle Button */
        .toggle-button {
          position: fixed;
          top: 50%;
          right: ${isLogPanelOpen ? "320px" : "0px"};
          transform: translateY(-50%);
          z-index: 30;
          transition: right 0.3s ease-in-out;
          background: #1a1a1a;
          border: 1px solid #374151;
          border-right: ${isLogPanelOpen ? "1px solid #374151" : "none"};
          border-radius: ${isLogPanelOpen ? "8px 0 0 8px" : "8px 0 0 8px"};
          width: 32px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #9ca3af;
          hover:color: #ffffff;
          hover:background: #374151;
        }
        
        /* Markdown styling */
        .markdown-content {
          line-height: 1.6;
          color: #e5e7eb;
        }
        
        .markdown-content h1 {
          color: ${COLORS.none};
          font-size: 1.875rem;
          font-weight: 700;
          margin-bottom: 1rem;
          border-bottom: 1px solid rgba(0, 255, 191, 0.2);
          padding-bottom: 0.5rem;
        }

        .markdown-content.gpt-text h1,
        .markdown-content.gpt-text h2 {
          color: ${COLORS.gpt};
        }

        .markdown-content.claude-text h1,
        .markdown-content.claude-text h2 {
          color: ${COLORS.claude};
        }

        .markdown-content.grok-text h1,
        .markdown-content.grok-text h2 {
          color: ${COLORS.grok};
        }

        .markdown-content.gemini-text h1,
        .markdown-content.gemini-text h2 {
          color: ${COLORS.gemini};
        }

        .markdown-content.none-text h1,
        .markdown-content.none-text h2 {
          color: ${COLORS.none};
        }

        .markdown-content h2 {
          color: ${COLORS.none};
          font-size: 1.5rem;
          font-weight: 600;
        }
        
        .markdown-content h3 {
          color: ${COLORS.none};
          font-size: 1.25rem;
          font-weight: 500;
          margin: 1.25rem 0 0.5rem 0;
        }
        
        .markdown-content p {
          margin-bottom: 1rem;
        }

        .markdown-content a {
          color: ${COLORS.blue};
        }
        
        .markdown-content ul, .markdown-content ol {
          margin-bottom: 1rem;
          padding-left: 1.5rem;
        }
        
        .markdown-content li {
          margin-bottom: 0.25rem;
        }
        
        .markdown-content code {
          background: rgba(0, 255, 191, 0.1);
          color: ${COLORS.none};
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          font-family: 'Space Grotesk', monospace;
        }
        
        .markdown-content pre {
          background: #0f172a;
          border: 1px solid rgba(0, 255, 191, 0.2);
          color: ${COLORS.none};
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1rem 0;
        }
        
        .markdown-content pre code {
          background: none;
          color: inherit;
          padding: 0;
        }
        
        .markdown-content strong {
          color: ${COLORS.none};
          font-weight: 600;
        }
        
        .markdown-content blockquote {
          border-left: 4px solid ${COLORS.none};
          padding-left: 1rem;
          margin: 1rem 0;
          color: ${COLORS.none};
          font-style: italic;
        }
        
        /* Fade transitions */
        .fade-enter {
          opacity: 0;
          transform: translateY(10px);
        }
        
        .fade-enter-active {
          opacity: 1;
          transform: translateY(0);
          transition: all 300ms ease-out;
        }
        
        .fade-exit {
          opacity: 1;
          transform: translateY(0);
        }
        
        .fade-exit-active {
          opacity: 0;
          transform: translateY(-10px);
          transition: all 300ms ease-out;
          pointer-events: none;
        }

        /* Bang/Impact Animations */
        @keyframes bang {
          0% { 
            transform: scale(1);
            opacity: 1;
          }
          50% { 
            transform: scale(1.5);
            opacity: 0.8;
          }
          100% { 
            transform: scale(2);
            opacity: 0;
          }
        }
        

      `}</style>

      <div className="min-h-screen bg-[#0B0B0B] text-white relative overflow-hidden">
        {/* Background Rails */}
        <div className="rail-left"></div>
        <div className="rail-right"></div>

        {/* Paddle Hover Zones */}
        <div className="paddle-zone-left"></div>
        <div className="paddle-zone-right"></div>

        {/* Paddles */}
        <div className="paddle-left"></div>
        <div className="paddle-right"></div>

        {/* Pong Ball */}
        <div className={`ball ${selectedModel}`}></div>

        {/* Header */}
        <div className="relative z-10 text-center pt-2 pb-2">
          <h1
            className="text-3xl font-bold mb-4"
            style={{ fontFamily: "Space Grotesk, monospace" }}
          >
            AI Ping-Pong Studio
          </h1>

          {/* Model LEDs */}
          <div className="flex items-center justify-center space-x-3">
            <div className="flex items-center space-x-1">
              <div
                className={`model-led gpt ${
                  activeModels.includes("gpt") ? "active" : ""
                }`}
              ></div>
              <span className="text-xs text-gray-500">GPT</span>
            </div>
            <div className="flex items-center space-x-1">
              <div
                className={`model-led claude ${
                  activeModels.includes("claude") ? "active" : ""
                }`}
              ></div>
              <span className="text-xs text-gray-500">Claude</span>
            </div>
            <div className="flex items-center space-x-1">
              <div
                className={`model-led grok ${
                  activeModels.includes("grok") ? "active" : ""
                }`}
              ></div>
              <span className="text-xs text-gray-500">Grok</span>
            </div>
            <div className="flex items-center space-x-1">
              <div
                className={`model-led gemini ${
                  activeModels.includes("gemini") ? "active" : ""
                }`}
              ></div>
              <span className="text-xs text-gray-500">Gemini</span>
            </div>
          </div>
        </div>

        {/* Toggle Button for Execution Log */}
        <button
          onClick={toggleLogPanel}
          className="toggle-button hover:bg-gray-600 transition-colors"
          title={isLogPanelOpen ? "Hide execution log" : "Show execution log"}
        >
          {isLogPanelOpen ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* Main Layout: Split between content and execution log */}
        <div className="relative z-10 flex h-[calc(100vh-120px)]">
          {/* Main Content Area */}
          <div
            className={`flex-1 flex flex-col items-center px-8 overflow-y-auto main-content ${
              !isLogPanelOpen ? "expanded" : ""
            }`}
          >
            {/* Progress Indicator */}
            {currentScenario && (
              <div className="text-center text-sm text-gray-500 mb-4">
                {/* Progress Bar */}
                <div className="w-64 bg-gray-800 rounded-full h-2 mb-2 mx-auto">
                  <div
                    className={`bg-gradient-to-r h-2 rounded-full transition-all duration-500 ease-out ${selectedModel}`}
                    style={{
                      width: `${(completedSteps / steps.length) * 100}%`,
                    }}
                  ></div>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span>
                    Step {currentIdx + 1} of {steps.length}
                  </span>
                  <span>•</span>
                  <span>{markdownContent.title}</span>
                  {isWorkflowRunning && (
                    <>
                      <span>•</span>
                      <span className={`text-[${COLORS.none}]`}>
                        Running {steps[currentIdx]?.model?.toUpperCase()}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Markdown Card */}
            <div
              className="w-full max-w-2xl bg-[#141414] rounded-lg p-8 shadow-lg border border-gray-800 flex-1 min-h-0"
              style={{
                boxShadow:
                  "0 4px 20px rgba(0, 255, 191, 0.07), 0 1px 3px rgba(0, 0, 0, 0.3)",
                maxBlockSize: "min-content",
              }}
            >
              <div
                className={`markdown-content ${selectedModel}-text h-full overflow-y-auto`}
              >
                <ReactMarkdown>{markdownContent.content}</ReactMarkdown>
              </div>
            </div>

            {/* Input Prompt Section */}
            <div
              className={`mt-8 w-full max-w-2xl transition-all duration-300 pointer-events-auto justify-center`}
              style={{
                display: showPrompt ? "flex" : "none",
              }}
            >
              <div className="flex flex-col items-center justify-center align-middle gap-3 w-full">
                <select
                  value={selectedScenario}
                  onChange={(e) => setSelectedScenario(e.target.value)}
                  className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300 focus:border-[${COLORS.none}] focus:outline-none transition-colors h-[40px] w-full`}
                >
                  {scenarios.map((scenario) => (
                    <option
                      key={scenario.id}
                      value={scenario.id}
                      className="bg-gray-900"
                    >
                      {scenario.name}
                    </option>
                  ))}
                </select>

                <div className="flex w-full gap-3 items-center">
                  <div className="flex-1">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Enter your request... (up to 1000+ characters)"
                      className={`w-full bg-gray-900 border border-gray-700 rounded px-4 py-3 text-white placeholder-gray-500 focus:border-[${COLORS.none}] focus:outline-none transition-colors resize-none h-full`}
                      rows={4}
                      maxLength={20000}
                      disabled={isWorkflowRunning}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                          handleRun();
                        }
                      }}
                    />
                    <div className="text-xs text-gray-500 mt-1 text-right">
                      {input.length}/20000 characters{" "}
                      {input.length > 0 && "• Ctrl+Enter to run"}
                    </div>
                  </div>
                  <button
                    onClick={handleRun}
                    disabled={isWorkflowRunning || !input.trim()}
                    className={`h-full px-6 py-3 text-black rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all ${selectedModel}`}
                  >
                    <div className="flex items-center space-x-2">
                      <Play className="w-4 h-4" />
                      <span>Run</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Reset Button */}
            {!showPrompt && (
              <div className="mt-8 mb-4">
                <button
                  onClick={handleReset}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </button>
              </div>
            )}
          </div>

          {/* Execution Log Side Panel */}
          <div
            className={`w-80 bg-[#1a1a1a] border-l border-gray-800 flex flex-col fixed right-0 top-0 h-full z-20 log-panel ${
              !isLogPanelOpen ? "closed" : ""
            }`}
          >
            {/* Execution Log Header */}
            <div className="p-4 border-b border-gray-800 mt-2">
              <h2
                className={`text-lg font-semibold [${COLORS.none}] flex items-center`}
              >
                <div
                  className={`w-2 h-2 bg-[${COLORS.none}] rounded-full mr-2 animate-pulse`}
                ></div>
                Execution Log
              </h2>
            </div>

            {/* Step List */}
            <div className="execution-log flex-1 p-4">
              {steps.length > 0 ? (
                <div className="space-y-3">
                  {steps.map((step, index) => {
                    const isActive = index === currentIdx && isWorkflowRunning;
                    const isCompleted = step.status === "done";
                    const hasError = step.status === "error";
                    const needsClarification =
                      step.status === "needs_clarification";

                    return (
                      <div
                        key={step.id}
                        className={`p-3 rounded-lg border transition-all duration-200 ${
                          isActive
                            ? `border-[${COLORS.none}] bg-[${COLORS.none}]/5`
                            : isCompleted
                            ? `border-${COLORS.gpt}-600/50 bg-${COLORS.gpt}-600/5`
                            : hasError
                            ? `border-${COLORS.red}-600/50 bg-${COLORS.red}-600/5`
                            : needsClarification
                            ? `border-${COLORS.yellow}-600/50 bg-${COLORS.yellow}-600/5`
                            : `border-${COLORS.gray}-700 bg-${COLORS.gray}-900/30`
                        }`}
                      >
                        {/* Step Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {/* Status Icon */}
                            {step.status === "running" ? (
                              <Loader
                                className={`step-status-icon [${COLORS.none}] animate-spin`}
                              />
                            ) : step.status === "done" ? (
                              <CheckCircle
                                className="step-status-icon"
                                style={{ color: COLORS.green }}
                              />
                            ) : step.status === "error" ? (
                              <AlertCircle
                                className="step-status-icon"
                                style={{ color: COLORS.red }}
                              />
                            ) : step.status === "needs_clarification" ? (
                              <AlertCircle
                                className="step-status-icon"
                                style={{ color: COLORS.yellow }}
                              />
                            ) : (
                              <Clock
                                className="step-status-icon"
                                style={{ color: COLORS.gray }}
                              />
                            )}

                            {/* Step Title */}
                            <span className="font-medium text-sm text-white">
                              {step.title}
                            </span>
                          </div>

                          {/* Model Badge */}
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                              step.model === "gpt"
                                ? "bg-green-600/20 text-green-400"
                                : step.model === "claude"
                                ? "bg-orange-600/20 text-orange-400"
                                : step.model === "grok"
                                ? "bg-purple-600/20 text-purple-400"
                                : "bg-blue-600/20 text-blue-400"
                            }`}
                          >
                            {step.model.toUpperCase()}
                          </span>
                        </div>

                        {/* Step Description */}
                        <p className="text-xs text-gray-400 mb-2">
                          {step.description}
                        </p>

                        {/* Time Estimate */}
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>~{step.timeEstimate}m</span>
                        </div>

                        {/* Error Message */}
                        {step.error && (
                          <div className="mt-2 p-2 bg-red-600/10 border border-red-600/20 rounded text-xs text-red-400">
                            {step.error}
                          </div>
                        )}

                        {/* Clarification Question */}
                        {step.clarificationQuestion && (
                          <div className="mt-2 p-2 bg-yellow-600/10 border border-yellow-600/20 rounded text-xs text-yellow-400">
                            {step.clarificationQuestion}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">⚡</div>
                  <p>No workflow running</p>
                  <p className="text-xs mt-1">
                    Start a workflow to see execution steps
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Workflow Status */}
        {isWorkflowRunning && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-20">
            <div className="bg-gray-900 border border-gray-700 rounded-full px-4 py-2 flex items-center space-x-2">
              <div
                className={`w-2 h-2 bg-[${COLORS.none}] rounded-full animate-pulse`}
              ></div>
              <span className="text-sm text-gray-300">
                AI models collaborating...
              </span>
            </div>
          </div>
        )}

        {/* Guide Toggle fixed button */}
        <button
          onClick={() => {
            setShowGuide(true);
            setShowDocs(false);
          }}
          className="fixed top-4 left-4 z-50 bg-gray-800 text-gray-200 px-3 py-1 rounded hover:bg-gray-700 text-sm flex items-center space-x-1"
        >
          <ChevronRight className="w-4 h-4" />
          <span>Guide</span>
        </button>

        {/* Docs Toggle Button */}
        <button
          onClick={() => {
            setShowDocs(true);
            setShowGuide(false);
          }}
          className="fixed top-4 right-4 z-50 bg-gray-800 text-gray-200 px-3 py-1 rounded hover:bg-gray-700 text-sm flex items-center space-x-1"
        >
          <ChevronRight className="w-4 h-4" />
          <span>Docs</span>
        </button>
      </div>
    </>
  );
}

export default App;
