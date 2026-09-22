import React, { useState } from "react";
import { Sparkles, HelpCircle, Send, MessageSquare, Scale, CheckCircle, RefreshCw, AlertCircle, Play } from "lucide-react";

interface TutorPanelProps {
  level: string; // "sentence" | "paragraph" | "essay" | "research"
  module: string; // e.g. "title" | "introduction" | "thesis" | "body" | "conclusion" | "referencing"
  studentDraft: string;
  context?: any;
  onApplyRevisedDraft?: (revised: string) => void;
  skillsPracticed: string[];
}

export default function TutorPanel({
  level,
  module,
  studentDraft,
  context,
  onApplyRevisedDraft,
  skillsPracticed
}: TutorPanelProps) {
  // Scaffolding Tier (Default Tier 2: Guided Practice)
  const [tier, setTier] = useState<number>(2);
  const [messages, setMessages] = useState<{ sender: "user" | "ai"; text: string; time: string }[]>([
    {
      sender: "ai",
      text: "Hi! I'm your WriteWise Writing Coach. What writing concept can we tackle together today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"coach" | "checklist" | "show_me">("coach");

  // Show Me How Mini-Lesson state
  const [lessonText, setLessonText] = useState("");

  // Check My Writing state
  const [checkedResults, setCheckedResults] = useState<{
    feedback: string;
    criteria: { category: string; marker: "green" | "yellow" | "blue" | "red"; title: string; description: string }[];
  } | null>(null);

  // Custom text input and mode selectors for universal checking
  const [useCustomText, setUseCustomText] = useState(false);
  const [customText, setCustomText] = useState("");
  const [auditType, setAuditType] = useState<"errors" | "plagiarism">("errors");
  const [plagiarismResults, setPlagiarismResults] = useState<{
    originalityScore: number;
    similarityPercent: number;
    aiRelianceProbability: number;
    similarityDetails: { text: string; source: string; matchPercent: number }[];
    flaggedAiSections: string[];
    suggestions: string[];
  } | null>(null);

  // AI Balance Percentage Calculations
  const getBalancePercentages = () => {
    switch (tier) {
      case 1: return { independent: 30, aiAssisted: 70 };
      case 2: return { independent: 50, aiAssisted: 50 };
      case 3: return { independent: 80, aiAssisted: 20 };
      case 4: return { independent: 95, aiAssisted: 5 };
      default: return { independent: 50, aiAssisted: 50 };
    }
  };

  const balance = getBalancePercentages();

  // Send a message in tutor chat
  const handleSendChat = async (inputStr?: string) => {
    const textToSend = inputStr || chatInput;
    if (!textToSend.trim()) return;

    // Add user message
    const userMsg = {
      sender: "user" as const,
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    if (!inputStr) setChatInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/gemini/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          module,
          tier,
          mode: "chat",
          studentDraft,
          userInput: textToSend,
          context
        })
      });

      const data = await response.json();
      const aiMsg = {
        sender: "ai" as const,
        text: data.text || "I was unable to formulate a prompt. Please ask something else!",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        { sender: "ai", text: "I had trouble reaching my server. Please check your connection and try again.", time: "Now" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Trigger "Show Me How" feature
  const handleShowMeHow = async () => {
    setActiveTab("show_me");
    setLoading(true);
    setLessonText("Loading mini-lesson...");
    try {
      const response = await fetch("/api/gemini/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          module,
          tier,
          mode: "show_me_how",
          studentDraft,
          context
        })
      });
      const data = await response.json();
      setLessonText(data.text);
    } catch (e) {
      setLessonText("Unable to load the mini-lesson right now. Let's try again in a bit!");
    } finally {
      setLoading(false);
    }
  };

  // Trigger "Check My Writing" feature
  const handleCheckMyWriting = async () => {
    const textToScan = useCustomText ? customText : studentDraft;
    if (!textToScan || !textToScan.trim()) {
      alert("Please write, paste, or select some text first so I can analyze it!");
      return;
    }
    setActiveTab("checklist");
    setLoading(true);
    setCheckedResults(null);
    try {
      const response = await fetch("/api/gemini/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          module,
          tier,
          mode: "check_writing",
          studentDraft: textToScan,
          context
        })
      });
      const data = await response.json();
      setCheckedResults(data);
    } catch (e) {
      console.error(e);
      alert("Error evaluating writing. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger "Check Plagiarism & Originality" feature
  const handleCheckPlagiarism = async () => {
    const textToScan = useCustomText ? customText : studentDraft;
    if (!textToScan || !textToScan.trim()) {
      alert("Please write, paste, or select some text first so I can scan it!");
      return;
    }
    setActiveTab("checklist");
    setLoading(true);
    setPlagiarismResults(null);
    try {
      const response = await fetch("/api/gemini/originality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftText: textToScan
        })
      });
      const data = await response.json();
      setPlagiarismResults(data);
    } catch (e) {
      console.error(e);
      alert("Error checking plagiarism. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden flex flex-col h-full shadow-sm" id="tutor_panel">
      {/* Scaffold Tiers Selector */}
      <div className="bg-white border-b border-slate-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
            <span className="font-semibold text-slate-800 text-sm">AI Scaffolding Tier</span>
          </div>
          <span className="text-xs font-medium px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
            Tier {tier}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg">
          {[1, 2, 3, 4].map((t) => (
            <button
              key={t}
              onClick={() => setTier(t)}
              className={`py-1 text-xs font-semibold rounded-md transition-all ${
                tier === t
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              T{t}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-slate-500 mt-2 italic leading-tight">
          {tier === 1 && "Tier 1 (Explicit Guidance): Full mini-lessons, explicit structure, and formulas."}
          {tier === 2 && "Tier 2 (Guided Practice): Hints, guiding prompts, and step-by-step revision questions."}
          {tier === 3 && "Tier 3 (Critical AI Use): Student writes first; AI reviews and suggests critical edits."}
          {tier === 4 && "Tier 4 (Independent): General feedback and proofreading only. Standard self-reliance."}
        </p>
      </div>

      {/* AI Balance Meter & Skills Practiced */}
      <div className="bg-indigo-950 text-white px-4 py-3.5">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-medium tracking-wide">AI BALANCE METER</span>
          </div>
          <span className="text-[11px] text-slate-300">Development Indicator</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-full bg-indigo-900/50 rounded-full h-3 overflow-hidden p-0.5 border border-indigo-800">
            <div className="flex h-full rounded-full overflow-hidden">
              <div 
                className="bg-emerald-400 transition-all duration-500" 
                style={{ width: `${balance.independent}%` }} 
                title="Independent Writing"
              />
              <div 
                className="bg-indigo-400 transition-all duration-500" 
                style={{ width: `${balance.aiAssisted}%` }} 
                title="AI Assistance"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-between text-[11px] text-slate-300">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Independent: <strong>{balance.independent}%</strong>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            AI Scaffold: <strong>{balance.aiAssisted}%</strong>
          </span>
        </div>

        {/* Skills Practiced Checklist */}
        <div className="border-t border-indigo-900 mt-3 pt-2.5">
          <div className="text-[10px] font-bold uppercase text-slate-300 tracking-wider mb-1.5">Skills Practiced</div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {["Sentence structure", "Paragraph development", "Argument mapping", "Referencing"].map((skill, idx) => {
              const isPracticed = skillsPracticed.includes(skill);
              return (
                <span key={idx} className="flex items-center gap-1 text-[11px]">
                  <span className={`w-3 h-3 rounded-full flex items-center justify-center border text-[8px] font-bold ${
                    isPracticed 
                      ? "bg-emerald-500 border-emerald-400 text-white" 
                      : "border-indigo-800 text-indigo-700 bg-indigo-950"
                  }`}>
                    {isPracticed && "✓"}
                  </span>
                  <span className={isPracticed ? "text-slate-100" : "text-indigo-400 line-through"}>{skill}</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Tabs */}
      <div className="flex border-b border-slate-200 bg-white text-xs">
        <button
          onClick={() => setActiveTab("coach")}
          className={`flex-1 py-2.5 text-center font-medium border-b-2 transition-all ${
            activeTab === "coach"
              ? "border-indigo-600 text-indigo-600 bg-slate-50"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Coach Chat
        </button>
        <button
          onClick={() => setActiveTab("show_me")}
          className={`flex-1 py-2.5 text-center font-medium border-b-2 transition-all ${
            activeTab === "show_me"
              ? "border-indigo-600 text-indigo-600 bg-slate-50"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Mini-Lessons
        </button>
        <button
          onClick={() => setActiveTab("checklist")}
          className={`flex-1 py-2.5 text-center font-medium border-b-2 transition-all ${
            activeTab === "checklist"
              ? "border-indigo-600 text-indigo-600 bg-slate-50"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Writing Audit
        </button>
      </div>

      {/* Main Panel Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-between min-h-[300px]">
        {activeTab === "coach" && (
          <div className="flex flex-col h-full justify-between gap-3">
            {/* Messages */}
            <div className="flex-1 space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col max-w-[85%] ${
                    msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                  }`}
                >
                  <div
                    className={`rounded-2xl px-3 py-2.5 text-xs ${
                      msg.sender === "user"
                        ? "bg-indigo-600 text-white rounded-br-none"
                        : "bg-slate-200 text-slate-800 rounded-bl-none border border-slate-300"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-slate-400 text-xs mt-2 pl-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                  <span>AI Coach is brainstorming...</span>
                </div>
              )}
            </div>

            {/* Quick Prompts & Inputs */}
            <div className="border-t border-slate-200 pt-3">
              {/* Quick Prompt Suggestions */}
              <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none">
                <button 
                  onClick={() => handleSendChat("Refine my thesis idea.")}
                  className="whitespace-nowrap px-2 py-1 text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-full font-medium"
                >
                  💡 Refine Thesis
                </button>
                <button 
                  onClick={() => handleSendChat("Give me a transition hint.")}
                  className="whitespace-nowrap px-2 py-1 text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-full font-medium"
                >
                  🔗 Transition tips
                </button>
                <button 
                  onClick={() => handleSendChat("How should I cite an online news article?")}
                  className="whitespace-nowrap px-2 py-1 text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-full font-medium"
                >
                  📖 Cite Web
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask your AI Writing Coach..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                />
                <button
                  onClick={() => handleSendChat()}
                  disabled={loading || !chatInput.trim()}
                  className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 transition-all flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "show_me" && (
          <div className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex items-start gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-indigo-900">Show Me How Feature</h4>
                <p className="text-[11px] text-indigo-700 mt-1">
                  Instead of giving you a direct answer, I'll explain the concept step-by-step and prompt you to write it yourself.
                </p>
              </div>
            </div>

            <button
              onClick={handleShowMeHow}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-3 rounded-xl text-xs transition-all shadow-xs"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-white" />
              )}
              Load Mini-Lesson for current section
            </button>

            {lessonText && (
              <div className="bg-white border border-slate-200 p-3.5 rounded-xl text-xs text-slate-700 whitespace-pre-line leading-relaxed shadow-xs">
                {lessonText}
              </div>
            )}
          </div>
        )}

        {activeTab === "checklist" && (
          <div className="space-y-4">
            <div className="bg-slate-100 border border-slate-200 p-3 rounded-xl flex items-start gap-2">
              <Scale className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-800">Universal Checker & Plagiarism Audit</h4>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-normal">
                  Evaluate any sentence, paragraph, or essay draft for academic integrity, grammar errors, and logical flow.
                </p>
              </div>
            </div>

            {/* Selector: Source Text */}
            <div className="space-y-1.5 bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Select Source Draft:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setUseCustomText(false)}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                    !useCustomText
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Current Activity Draft
                </button>
                <button
                  type="button"
                  onClick={() => setUseCustomText(true)}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                    useCustomText
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  ✍️ Paste Custom Text
                </button>
              </div>

              {!useCustomText ? (
                <div className="mt-2 p-2 bg-indigo-50 border border-indigo-100/60 rounded-lg text-[11px] text-indigo-900 italic line-clamp-2">
                  <strong>Scanning draft:</strong> "{studentDraft || "(Your active activity draft is currently empty)"}"
                </div>
              ) : (
                <div className="space-y-1 mt-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Enter custom sentence, paragraph or essay:</span>
                  <textarea
                    placeholder="Type or paste your sentence, paragraph or essay here..."
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs h-24 focus:ring-1 focus:ring-indigo-500 outline-none leading-relaxed"
                  />
                </div>
              )}
            </div>

            {/* Selector: Check Type */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/60 rounded-xl">
              <button
                type="button"
                onClick={() => setAuditType("errors")}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  auditType === "errors"
                    ? "bg-white text-indigo-700 shadow-3xs"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                🔍 Check for Errors
              </button>
              <button
                type="button"
                onClick={() => setAuditType("plagiarism")}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  auditType === "plagiarism"
                    ? "bg-white text-indigo-700 shadow-3xs"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                🛡️ Plagiarism & AI Scan
              </button>
            </div>

            {/* Call Action Button */}
            {auditType === "errors" ? (
              <button
                onClick={handleCheckMyWriting}
                disabled={loading || !(useCustomText ? customText : studentDraft)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-3 rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  "✓ Scan for Sentence & Essay Errors"
                )}
              </button>
            ) : (
              <button
                onClick={handleCheckPlagiarism}
                disabled={loading || !(useCustomText ? customText : studentDraft)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-3 rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  "🛡️ Verify Plagiarism & AI Reliance"
                )}
              </button>
            )}

            {/* Results Rendering */}
            {auditType === "errors" && checkedResults && (
              <div className="space-y-3 mt-2 animate-fade-in">
                <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed italic">
                  <strong>Writing Feedback:</strong> {checkedResults.feedback}
                </div>

                {checkedResults.criteria && checkedResults.criteria.length > 0 ? (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {checkedResults.criteria.map((item, idx) => {
                      const markerBg = 
                        item.marker === "green" ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
                        item.marker === "yellow" ? "bg-amber-50 border-amber-200 text-amber-800" :
                        item.marker === "blue" ? "bg-sky-50 border-sky-200 text-sky-800" :
                        "bg-rose-50 border-rose-200 text-rose-800";

                      const dotColor = 
                        item.marker === "green" ? "bg-emerald-500" :
                        item.marker === "yellow" ? "bg-amber-500" :
                        item.marker === "blue" ? "bg-sky-500" :
                        "bg-rose-500";

                      return (
                        <div key={idx} className={`p-2.5 rounded-lg border text-[11px] leading-relaxed ${markerBg}`}>
                          <div className="flex items-center gap-1.5 font-bold mb-1">
                            <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
                            <span>{item.category}: {item.title}</span>
                          </div>
                          <p className="opacity-95">{item.description}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-2">No writing errors flagged. Excellent work!</p>
                )}
              </div>
            )}

            {auditType === "plagiarism" && plagiarismResults && (
              <div className="space-y-3 mt-2 animate-fade-in">
                {/* Plagiarism and AI probability results */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Originality Index</span>
                    <span className="text-sm font-black text-emerald-700 block">{plagiarismResults.originalityScore}% Original</span>
                    <span className="text-[10px] text-slate-500 block">Similarity risk: {plagiarismResults.similarityPercent}%</span>
                  </div>

                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-center space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">AI Probability</span>
                    <span className="text-sm font-black text-indigo-700 block">{plagiarismResults.aiRelianceProbability}% AI</span>
                    <span className="text-[10px] text-slate-500 block">Syntactic pattern match</span>
                  </div>
                </div>

                {/* Plagiarism Similarity details */}
                {plagiarismResults.similarityDetails && plagiarismResults.similarityDetails.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">⚠️ Plagiarism Similarity Matches:</span>
                    <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                      {plagiarismResults.similarityDetails.map((match, i) => (
                        <div key={i} className="p-2 bg-rose-50 border border-rose-100 rounded-lg text-[10px] space-y-0.5">
                          <div className="flex justify-between font-bold text-rose-800">
                            <span>Source: {match.source}</span>
                            <span>{match.matchPercent}% Match</span>
                          </div>
                          <p className="text-rose-700 italic">"{match.text}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Flagged passages */}
                {plagiarismResults.flaggedAiSections && plagiarismResults.flaggedAiSections.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">🤖 Machine/AI-Generated Structures:</span>
                    <div className="space-y-1.5 max-h-[100px] overflow-y-auto">
                      {plagiarismResults.flaggedAiSections.map((sect, i) => (
                        <p key={i} className="p-2 bg-amber-50 border border-amber-100 text-amber-800 italic rounded-lg text-[10px]">
                          "{sect}"
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Suggestions */}
                {plagiarismResults.suggestions && plagiarismResults.suggestions.length > 0 && (
                  <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px]">
                    <span className="font-bold text-slate-700 block mb-1">💡 Suggested Corrections:</span>
                    <ul className="list-disc pl-4 space-y-1 leading-relaxed text-slate-600">
                      {plagiarismResults.suggestions.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Safety Disclaimer */}
      <div className="bg-slate-100 border-t border-slate-200 p-2 text-center text-[10px] text-slate-500 font-medium">
        🛡️ Core Philosophy: AI scaffolding guides you, but YOU write the paper.
      </div>
    </div>
  );
}
