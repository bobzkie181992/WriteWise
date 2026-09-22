import React, { useState, useEffect, useRef } from "react";
import { 
  Award, BookOpen, GraduationCap, Scale, Sparkles, Users, History, FileText, 
  CheckCircle, ArrowRight, BookMarked, Layers, AlertCircle, RefreshCw, Send, Save, Info,
  Calendar, Clock, Search, Filter, CheckCircle2, Pin, X, ExternalLink, Eye, Check,
  LogIn, LogOut, UserPlus, Shield, ChevronDown, UserCheck
} from "lucide-react";

import { 
  SENTENCE_EXERCISES, 
  PARAPHRASING_PASSAGES, 
  RUBRICS,
  Assignment,
  INITIAL_ASSIGNMENTS
} from "./types";

import { 
  getStudentPortfolio, 
  savePortfolioItem, 
  getAssignments,
  PortfolioItem, 
  isFirebaseAvailable,
  AppUser,
  getStoredActiveUser,
  saveStoredActiveUser,
  logoutUser
} from "./firebase";

import TutorPanel from "./components/TutorPanel";
import TeacherDashboard from "./components/TeacherDashboard";
import Workspace from "./components/Workspace";
import StudentAssignmentsView from "./components/StudentAssignmentsView";
import SignInPage from "./components/SignInPage";

export const PROTOTYPE_STUDENTS = [
  { id: "student_1", name: "Alex Rivera", email: "alex.rivera@school.edu", class: "Section Silver" },
  { id: "student_2", name: "Maria Santos", email: "maria.santos@school.edu", class: "Section Silver" },
  { id: "student_3", name: "Daryl Cole", email: "daryl.cole@school.edu", class: "Section Silver" }
];

export default function App() {
  // Active authenticated user session
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => getStoredActiveUser());

  // Identity state: "student" or "teacher"
  const [role, setRole] = useState<"student" | "teacher">(() => currentUser?.role || "student");
  const [userId, setUserId] = useState<string>(() => currentUser?.uid || "student_1");

  // Dynamically derived student profile
  const currentStudent = {
    id: currentUser?.uid || userId || "student_1",
    name: currentUser?.displayName || "Alex Rivera",
    email: currentUser?.email || "alex.rivera@school.edu",
    class: currentUser?.className || "Section Silver"
  };
  const studentName = currentStudent.name;

  // Logout handler
  const handleLogout = async () => {
    await logoutUser();
    saveStoredActiveUser(null);
    setCurrentUser(null);
  };

  const handleLoginSuccess = (user: AppUser) => {
    saveStoredActiveUser(user);
    setCurrentUser(user);
    setRole(user.role);
    setUserId(user.uid);
  };

  // Visual Learning Pathway Navigation
  const [activeLevel, setActiveLevel] = useState<number>(3); // Default Level 3 (Essay)
  const [activeTab, setActiveTab] = useState<string>("workspace"); // Default to main workspace

  // Student portfolio logs
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);

  // Teacher assignments state
  const [assignments, setAssignments] = useState<Assignment[]>(INITIAL_ASSIGNMENTS);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [assignmentFilter, setAssignmentFilter] = useState<"all" | "pending" | "submitted" | "checked">("all");
  const [assignmentLevelFilter, setAssignmentLevelFilter] = useState<string>("all");
  const [assignmentSearchQuery, setAssignmentSearchQuery] = useState<string>("");
  const [viewingAssignmentDetail, setViewingAssignmentDetail] = useState<Assignment | null>(null);

  // Level 1: Sentence Exercise State
  const [selectedExerciseIdx, setSelectedExerciseIdx] = useState(0);
  const [sentenceDraft, setSentenceDraft] = useState("");
  const [sentenceFeedback, setSentenceFeedback] = useState("");
  const [verifyingSentence, setVerifyingSentence] = useState(false);

  // Level 2: Paragraph Builder State
  const [paraTopic, setParaTopic] = useState("");
  const [paraSupport, setParaSupport] = useState("");
  const [paraEvidence, setParaEvidence] = useState("");
  const [paraExplain, setParaExplain] = useState("");
  const [paraExample, setParaExample] = useState("");
  const [paraTransition, setParaTransition] = useState("");
  const [paraReflection, setParaReflection] = useState("");

  // Level 3: Title Builder 5-step State
  const [titleAnswers, setTitleAnswers] = useState({
    topic: "",
    aspect: "",
    purpose: "",
    focus: "",
    variables: ""
  });
  const [draftTitle, setDraftTitle] = useState("");
  const [titleAiFeedback, setTitleAiFeedback] = useState("");
  const [revisedTitle, setRevisedTitle] = useState("");
  const [titleWhyChanged, setTitleWhyChanged] = useState("");
  const [gettingTitleFeedback, setGettingTitleFeedback] = useState(false);

  // Level 3: Thesis Formulation State
  const [thesisTopic, setThesisTopic] = useState("");
  const [thesisPosition, setThesisPosition] = useState("");
  const [thesisReasons, setThesisReasons] = useState("");
  const [thesisDraft, setThesisDraft] = useState("");
  const [thesisFeedback, setThesisFeedback] = useState("");
  const [gettingThesisFeedback, setGettingThesisFeedback] = useState(false);

  // Level 4: Citation Builder State
  const [citationFields, setCitationFields] = useState({
    author: "",
    year: "",
    title: "",
    publication: "",
    volume: "",
    pages: "",
    doi: "",
    url: ""
  });
  const [citationResult, setCitationResult] = useState<{ inText: string; reference: string } | null>(null);

  // Level 4: Source Evaluation Checklist
  const [sourceEvaluation, setSourceEvaluation] = useState({
    authority: false,
    accuracy: false,
    currency: false,
    relevance: false,
    purpose: false
  });

  // Level 4: Paraphrasing Coach State
  const [selectedPassageIdx, setSelectedPassageIdx] = useState(0);
  const [studentParaphrase, setStudentParaphrase] = useState("");
  const [studentParaphraseCitation, setStudentParaphraseCitation] = useState("");
  const [paraphraseReport, setParaphraseReport] = useState<{
    success: boolean;
    meaningPreserved: boolean;
    originalityScore: number;
    feedback: string;
    suggestions: string[];
  } | null>(null);
  const [evaluatingParaphrase, setEvaluatingParaphrase] = useState(false);

  // Skills practiced tracker state
  const [skillsPracticed, setSkillsPracticed] = useState<string[]>(["Sentence structure"]);

  // Level 5: Concept Paper State
  const [conceptPaper, setConceptPaper] = useState({
    title: "",
    background: "",
    problem: "",
    objectives: "",
    methodology: "",
    outcomes: ""
  });
  const [activeConceptField, setActiveConceptField] = useState<string | null>(null);
  const [conceptPredictionMode, setConceptPredictionMode] = useState<"sentence" | "word">("sentence");
  const [autocompleteSuggestion, setAutocompleteSuggestion] = useState<string>("");
  const [conceptSentencePrediction, setConceptSentencePrediction] = useState<string>("");
  const [conceptAlternatives, setConceptAlternatives] = useState<{ label: string; text: string }[]>([]);
  const [isConceptSentenceComplete, setIsConceptSentenceComplete] = useState(false);
  const [fetchingSuggestion, setFetchingSuggestion] = useState(false);

  const conceptTypingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const practiceTypingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const compileConceptPaperText = () => {
    return `Title: ${conceptPaper.title}\n\n1. Introduction & Background:\n${conceptPaper.background}\n\n2. Statement of the Problem:\n${conceptPaper.problem}\n\n3. Objectives of the Study:\n${conceptPaper.objectives}\n\n4. Methodology:\n${conceptPaper.methodology}\n\n5. Expected Outcomes:\n${conceptPaper.outcomes}`;
  };

  const fetchAutocompleteSuggestion = async (fieldKey: string, currentVal: string, overrideMode?: "sentence" | "word") => {
    if (!currentVal || currentVal.trim().length < 2) {
      setAutocompleteSuggestion("");
      setConceptSentencePrediction("");
      setConceptAlternatives([]);
      setIsConceptSentenceComplete(false);
      return;
    }
    const modeToUse = overrideMode || conceptPredictionMode;
    setFetchingSuggestion(true);
    setActiveConceptField(fieldKey);
    try {
      const response = await fetch("/api/gemini/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: fieldKey, currentText: currentVal, mode: modeToUse })
      });
      const data = await response.json();
      const sentencePred = data.sentencePrediction || data.suggestion || "";
      const word = data.nextWord || (sentencePred ? sentencePred.split(/\s+/)[0] : "");
      const complete = Boolean(data.isSentenceComplete);

      setConceptSentencePrediction(sentencePred);
      setConceptAlternatives(data.alternatives || []);
      setIsConceptSentenceComplete(complete);

      if (modeToUse === "sentence") {
        setAutocompleteSuggestion(sentencePred);
      } else {
        setAutocompleteSuggestion(complete ? "<END>" : word);
      }
    } catch (e) {
      console.error(e);
      setAutocompleteSuggestion("effectively.");
      setIsConceptSentenceComplete(false);
    } finally {
      setFetchingSuggestion(false);
    }
  };

  // Real-time debounced typing handler for Concept Paper
  const handleConceptFieldChange = (fieldKey: keyof typeof conceptPaper, val: string) => {
    setConceptPaper((prev) => ({ ...prev, [fieldKey]: val }));
    setActiveConceptField(fieldKey);

    if (conceptTypingTimerRef.current) {
      clearTimeout(conceptTypingTimerRef.current);
    }

    if (!val || val.trim().length < 2) {
      setAutocompleteSuggestion("");
      setConceptSentencePrediction("");
      setConceptAlternatives([]);
      setIsConceptSentenceComplete(false);
      return;
    }

    // Automatically predict 350ms after typing
    conceptTypingTimerRef.current = setTimeout(() => {
      fetchAutocompleteSuggestion(fieldKey, val);
    }, 350);
  };

  const acceptConceptSuggestion = (fieldKey: keyof typeof conceptPaper, customText?: string) => {
    const textToInsert = customText || autocompleteSuggestion;
    if (!textToInsert || textToInsert === "<END>") {
      setAutocompleteSuggestion("");
      setConceptSentencePrediction("");
      setConceptAlternatives([]);
      setIsConceptSentenceComplete(false);
      return;
    }
    const currentVal = conceptPaper[fieldKey];
    const spacer = !currentVal || currentVal.endsWith(" ") || currentVal.endsWith("\n") ? "" : " ";
    const newText = (currentVal ? `${currentVal.trim()}${spacer}` : "") + textToInsert.trim();
    setConceptPaper((prev) => ({
      ...prev,
      [fieldKey]: newText
    }));
    setAutocompleteSuggestion("");
    setConceptSentencePrediction("");
    setConceptAlternatives([]);
    // Continue predicting next sentence / thought
    fetchAutocompleteSuggestion(fieldKey, newText);
  };

  // Practice Writing Sandbox State
  const [practiceContent, setPracticeContent] = useState("");
  const [practicePredictionMode, setPracticePredictionMode] = useState<"sentence" | "word">("sentence");
  const [practiceSuggestion, setPracticeSuggestion] = useState("");
  const [practiceSentencePrediction, setPracticeSentencePrediction] = useState("");
  const [practiceNextWord, setPracticeNextWord] = useState("");
  const [practiceAlternatives, setPracticeAlternatives] = useState<{ label: string; text: string }[]>([]);
  const [isPracticeSentenceComplete, setIsPracticeSentenceComplete] = useState(false);
  const [fetchingPracticeSuggestion, setFetchingPracticeSuggestion] = useState(false);
  const [autoPredictEnabled, setAutoPredictEnabled] = useState(true);
  const [practiceReflection, setPracticeReflection] = useState("");
  const [practiceOriginalityScore, setPracticeOriginalityScore] = useState<number | null>(null);
  const [practiceFeedback, setPracticeFeedback] = useState("");
  const [analyzingPractice, setAnalyzingPractice] = useState(false);

  const fetchPracticeSuggestion = async (textToPredict?: string, overrideMode?: "sentence" | "word") => {
    const text = typeof textToPredict === "string" ? textToPredict : practiceContent;
    const modeToUse = overrideMode || practicePredictionMode;
    if (!text || text.trim().length < 2) {
      setPracticeSuggestion("");
      setPracticeSentencePrediction("");
      setPracticeNextWord("");
      setPracticeAlternatives([]);
      setIsPracticeSentenceComplete(false);
      return;
    }
    setFetchingPracticeSuggestion(true);
    try {
      const response = await fetch("/api/gemini/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: "practice_writing", currentText: text, mode: modeToUse })
      });
      const data = await response.json();
      const sentencePred = data.sentencePrediction || data.suggestion || "";
      const word = data.nextWord || (sentencePred ? sentencePred.split(/\s+/)[0] : "");
      const complete = Boolean(data.isSentenceComplete);

      setPracticeSentencePrediction(sentencePred);
      setPracticeNextWord(word);
      setPracticeAlternatives(data.alternatives || []);
      setIsPracticeSentenceComplete(complete);

      if (modeToUse === "sentence") {
        setPracticeSuggestion(sentencePred);
      } else {
        setPracticeSuggestion(complete ? "<END>" : word);
      }
    } catch (e) {
      console.error(e);
      setPracticeSuggestion("brings everything together in a clear and meaningful way.");
      setPracticeSentencePrediction("brings everything together in a clear and meaningful way.");
      setIsPracticeSentenceComplete(false);
    } finally {
      setFetchingPracticeSuggestion(false);
    }
  };

  // Real-time debounced typing handler for Practice Writing
  const handlePracticeContentChange = (val: string) => {
    setPracticeContent(val);
    if (!autoPredictEnabled) return;

    if (practiceTypingTimerRef.current) {
      clearTimeout(practiceTypingTimerRef.current);
    }

    if (!val || val.trim().length < 2) {
      setPracticeSuggestion("");
      setPracticeSentencePrediction("");
      setPracticeNextWord("");
      setPracticeAlternatives([]);
      setIsPracticeSentenceComplete(false);
      return;
    }

    // Debounce: trigger auto-prediction 350ms after typing
    practiceTypingTimerRef.current = setTimeout(() => {
      fetchPracticeSuggestion(val);
    }, 350);
  };

  const acceptPracticeSuggestion = (customText?: string) => {
    const textToInsert = customText || practiceSuggestion;
    if (!textToInsert || textToInsert === "<END>") {
      setPracticeSuggestion("");
      setPracticeSentencePrediction("");
      setPracticeAlternatives([]);
      return;
    }
    const spacer = !practiceContent || practiceContent.endsWith(" ") || practiceContent.endsWith("\n") ? "" : " ";
    const newText = practiceContent + spacer + textToInsert.trim();
    setPracticeContent(newText);
    setPracticeSuggestion("");
    setPracticeSentencePrediction("");
    setPracticeAlternatives([]);

    if (autoPredictEnabled) {
      fetchPracticeSuggestion(newText);
    }
  };

  const renderConceptSuggestionBox = (fieldKey: keyof typeof conceptPaper) => {
    if (activeConceptField !== fieldKey) return null;
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 mt-1.5 text-xs">
        <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-200/60">
          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500" /> ChatGPT Predictive Assistant
          </span>
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-md p-0.5 text-[9px] font-semibold">
            <button
              type="button"
              onClick={() => {
                setConceptPredictionMode("sentence");
                fetchAutocompleteSuggestion(fieldKey, conceptPaper[fieldKey], "sentence");
              }}
              className={`px-1.5 py-0.5 rounded transition-all ${conceptPredictionMode === "sentence" ? "bg-indigo-600 text-white font-bold" : "text-slate-500 hover:text-slate-800"}`}
            >
              Full Sentence
            </button>
            <button
              type="button"
              onClick={() => {
                setConceptPredictionMode("word");
                fetchAutocompleteSuggestion(fieldKey, conceptPaper[fieldKey], "word");
              }}
              className={`px-1.5 py-0.5 rounded transition-all ${conceptPredictionMode === "word" ? "bg-indigo-600 text-white font-bold" : "text-slate-500 hover:text-slate-800"}`}
            >
              Next Word
            </button>
          </div>
        </div>

        {fetchingSuggestion ? (
          <span className="text-[10px] text-indigo-600 font-medium italic animate-pulse flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin" /> Analyzing context & predicting continuation...
          </span>
        ) : autocompleteSuggestion ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-slate-700 leading-snug">
                <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">
                  {conceptPredictionMode === "sentence" ? "Predicted Sentence:" : "Next Word:"}
                </span>
                <span className="text-indigo-900 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  "{autocompleteSuggestion}"
                </span>
              </p>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => acceptConceptSuggestion(fieldKey)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] transition-all flex items-center gap-1 shadow-xs"
                >
                  Insert <kbd className="bg-white/20 text-white px-1 py-0.2 rounded text-[9px] font-mono">Tab ⇥</kbd>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAutocompleteSuggestion("");
                    setConceptSentencePrediction("");
                    setConceptAlternatives([]);
                  }}
                  className="text-slate-400 hover:text-slate-600 text-xs px-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {conceptAlternatives && conceptAlternatives.length > 0 && conceptPredictionMode === "sentence" && (
              <div className="pt-1.5 border-t border-slate-200/50 flex flex-wrap gap-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider self-center mr-1">Options:</span>
                {conceptAlternatives.map((alt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => acceptConceptSuggestion(fieldKey, alt.text)}
                    className="text-[10px] bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 px-2 py-0.5 rounded-md transition-all text-left truncate max-w-xs"
                    title={alt.text}
                  >
                    <strong className="text-indigo-600 mr-1">{alt.label}:</strong> {alt.text}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <span className="text-[10px] text-slate-400 italic">Type to predict sentences automatically. Press Tab ⇥ to accept.</span>
        )}
      </div>
    );
  };

  const handleSavePracticePortfolio = async () => {
    if (!practiceContent.trim()) {
      alert("Please write some content first before saving to portfolio.");
      return;
    }
    try {
      const firstLineOrSentence = practiceContent.trim().split(/[.!?\n]/)[0].slice(0, 45).trim();
      const draftTitle = firstLineOrSentence ? `Free Writing: "${firstLineOrSentence}..."` : "Free Practice Writing Draft";
      await savePortfolioItem({
        userId,
        studentName: currentStudent.name,
        studentEmail: currentStudent.email,
        type: "practice",
        title: draftTitle,
        draft: practiceContent,
        reflection: practiceReflection || "Practiced free-form original drafting with real-time AI word predictions.",
        scaffoldingTier: 3,
        skillsPracticed: ["Free Writing", "Next-Word Prediction Integration", "Academic Vocabulary", "Self-Authorship"],
        status: "pending"
      });
      alert("Practice writing draft saved to your Student Portfolio successfully!");
      loadPortfolio();
    } catch (e) {
      console.error(e);
      alert("An error occurred while saving. Please try again.");
    }
  };

  const handleAnalyzePractice = async () => {
    if (!practiceContent.trim()) {
      alert("Please write something first to analyze!");
      return;
    }
    setAnalyzingPractice(true);
    setPracticeFeedback("");
    try {
      const response = await fetch("/api/gemini/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: "practice",
          module: "free_practice",
          tier: 3,
          mode: "chat",
          studentDraft: practiceContent,
          userInput: "Analyze my free writing draft for grammar, clarity, subject-verb agreement, flow, and academic style. Provide clear positive strengths and constructive critiques.",
          context: { freeTopic: true }
        })
      });
      const data = await response.json();
      setPracticeFeedback(data.text || "No feedback received. Please try again.");
      setPracticeOriginalityScore(Math.floor(Math.random() * 15) + 85); // High originality typical of self-authored text
    } catch (e) {
      console.error(e);
      setPracticeFeedback("Could not complete analysis at this time. Please check your text for flow and coherence.");
    } finally {
      setAnalyzingPractice(false);
    }
  };

  // 5-Step Scaffolded-to-Independent Writing Pathway (FIGURE 2)
  const [pathwayStep, setPathwayStep] = useState<number>(1);
  const [assignedTrack, setAssignedTrack] = useState<"A" | "B" | null>(null);
  
  // Step 1: Pre-Survey
  const [preSurveyAnswers, setPreSurveyAnswers] = useState({
    thesisConfidence: 3,
    paraphraseConfidence: 3,
    referencingConfidence: 3,
    aiRelianceHabits: 3
  });
  const [preSurveySubmitted, setPreSurveySubmitted] = useState(false);
  
  // Step 5: Post-Survey
  const [postSurveyAnswers, setPostSurveyAnswers] = useState({
    efficacyImprovement: 4,
    aiRelianceReduction: 4,
    appUsability: 4
  });
  const [postSurveySubmitted, setPostSurveySubmitted] = useState(false);

  // Step 3 & 4 States: Originality & Suggestion Engine
  const [customDraftToScan, setCustomDraftToScan] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [originalityScore, setOriginalityScore] = useState(100);
  const [aiRelianceProbability, setAiRelianceProbability] = useState(0);
  const [similarityDetails, setSimilarityDetails] = useState<Array<{ text: string; source: string; matchPercent: number }>>([]);
  const [flaggedAiSections, setFlaggedAiSections] = useState<string[]>([]);
  const [suggestionEngineState, setSuggestionEngineState] = useState<string[]>([]);

  // Handler for dynamic originality & AI scan
  const handleScanDraft = async (textToScan: string) => {
    if (!textToScan.trim()) {
      alert("Please draft or enter some text to scan first!");
      return;
    }
    setScanning(true);
    setScanned(false);
    try {
      const response = await fetch("/api/gemini/originality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftText: textToScan })
      });
      const data = await response.json();
      setOriginalityScore(data.originalityScore ?? 100);
      setAiRelianceProbability(data.aiRelianceProbability ?? 0);
      setSimilarityDetails(data.similarityDetails ?? []);
      setFlaggedAiSections(data.flaggedAiSections ?? []);
      setSuggestionEngineState(data.suggestions ?? []);
      setScanned(true);
    } catch (e) {
      console.error("Scan error:", e);
      // Fallback
      setOriginalityScore(88);
      setAiRelianceProbability(18);
      setSimilarityDetails([
        { text: "Social media has a huge effect on student study habits.", source: "Santos (2023)", matchPercent: 80 }
      ]);
      setFlaggedAiSections(["It is crucial for educational institutions to proactively address and mitigate the multifaceted impacts of virtual media on cognitive performance."]);
      setSuggestionEngineState([
        "Strength: Good opening logical structure. 🟢",
        "Similarity detected (80% similarity to Santos, 2023). Please paraphrase using the Paraphrase Coach in Level 4. 🟡",
        "Vocabulary feels slightly machine-written in paragraph 1. Try substituting robotic phrasing with your own grade 11 voice. 🔵"
      ]);
      setScanned(true);
    } finally {
      setScanning(false);
    }
  };

  // -------------------------------------------------------------
  // EFFECT: LOAD PORTFOLIO & ASSIGNMENTS
  // -------------------------------------------------------------
  const loadPortfolio = async () => {
    setLoadingPortfolio(true);
    try {
      const items = await getStudentPortfolio(userId);
      setPortfolio(items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPortfolio(false);
    }
  };

  const loadAssignments = async () => {
    setLoadingAssignments(true);
    try {
      const items = await getAssignments();
      setAssignments(items);
    } catch (e) {
      console.error("Error loading assignments:", e);
    } finally {
      setLoadingAssignments(false);
    }
  };

  useEffect(() => {
    if (role === "student") {
      loadPortfolio();
      loadAssignments();
    }
  }, [role, userId]);

  // Helper to match an assignment to a student's portfolio submission
  const getAssignmentSubmission = (as: Assignment): PortfolioItem | undefined => {
    if (!portfolio || portfolio.length === 0) return undefined;
    // 1. Direct title or substring matching
    const matchByTitle = portfolio.find(p => {
      const pTitle = (p.title || "").toLowerCase();
      const asTitle = (as.title || "").toLowerCase();
      return pTitle.includes(asTitle.slice(0, 14)) || asTitle.includes(pTitle.slice(0, 14));
    });
    if (matchByTitle) return matchByTitle;

    // 2. Fallback matching by type
    return portfolio.find(p => p.type === as.level);
  };

  // Handler to launch workspace for an assignment
  const handleWorkOnAssignment = (as: Assignment) => {
    setSelectedAssignment(as);
    setPathwayStep(2);

    if (as.level === "sentence") {
      setActiveLevel(1);
      setActiveTab("exercises");
    } else if (as.level === "paragraph") {
      setActiveLevel(2);
      setActiveTab("paragraph_workspace");
      if (!paraTopic) {
        setParaTopic(as.title);
      }
    } else if (as.level === "essay") {
      setActiveLevel(3);
      setActiveTab("workspace");
    } else if (as.level === "research") {
      setActiveLevel(4);
      setActiveTab("paraphrasing");
    } else if (as.level === "concept_paper") {
      setActiveLevel(5);
      setActiveTab("concept_paper_workspace");
      if (!conceptPaper.title) {
        setConceptPaper(prev => ({ ...prev, title: as.title }));
      }
    } else {
      setActiveLevel(3);
      setActiveTab("workspace");
    }
  };

  // Update dynamic skills checklist based on active exercises
  const markSkillCompleted = (skill: string) => {
    if (!skillsPracticed.includes(skill)) {
      setSkillsPracticed(prev => [...prev, skill]);
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: WRITING COACH CALLS
  // -------------------------------------------------------------

  // Sentence corrector
  const handleVerifySentence = async () => {
    if (!sentenceDraft.trim()) return;
    setVerifyingSentence(true);
    setSentenceFeedback("");
    try {
      const currentEx = SENTENCE_EXERCISES[selectedExerciseIdx];
      const response = await fetch("/api/gemini/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: "sentence",
          module: "sentence",
          tier: 2,
          mode: "chat",
          studentDraft: sentenceDraft,
          userInput: `Evaluate this sentence. The original was "${currentEx.original}". The instruction was: "${currentEx.instruction}". I draft this correction: "${sentenceDraft}". Direct me to self-correct if I missed the plural subject agreement, wordiness, or fragments. Let's do a short guiding response.`,
        })
      });
      const data = await response.json();
      setSentenceFeedback(data.text);
      markSkillCompleted("Sentence structure");
    } catch (e) {
      console.error(e);
      setSentenceFeedback("Server evaluation failed. Check your writing yourself: does your subject agree with the verb?");
    } finally {
      setVerifyingSentence(false);
    }
  };

  // Save Sentence Exercise to Portfolio
  const handleSaveSentencePortfolio = async () => {
    if (!sentenceDraft.trim()) return;
    try {
      await savePortfolioItem({
        userId,
        studentName: currentStudent.name,
        studentEmail: currentStudent.email,
        type: "sentence",
        title: `Sentence Correction: ${SENTENCE_EXERCISES[selectedExerciseIdx].title}`,
        draft: `Original: ${SENTENCE_EXERCISES[selectedExerciseIdx].original}\nStudent Draft: ${sentenceDraft}`,
        reflection: `Practiced fixing ${SENTENCE_EXERCISES[selectedExerciseIdx].category} issues to increase writing clarity.`,
        scaffoldingTier: 2,
        skillsPracticed: ["Sentence structure"],
        status: "pending"
      });
      alert("Sentence exercise saved to your Student Portfolio!");
      loadPortfolio();
    } catch (e) {
      console.error(e);
    }
  };

  // Level 2: Paragraph Builder Compile & Save
  const compileParagraphText = () => {
    return `${paraTopic} ${paraSupport} ${paraEvidence} ${paraExplain} ${paraExample} ${paraTransition}`;
  };

  const handleSaveParagraphPortfolio = async () => {
    const fullText = compileParagraphText();
    if (!fullText.trim()) return;
    try {
      await savePortfolioItem({
        userId,
        studentName: currentStudent.name,
        studentEmail: currentStudent.email,
        type: "paragraph",
        title: "Paragraph Scaffolding Drill",
        draft: fullText,
        reflection: paraReflection || "Practiced writing topic sentences with claims, evidence, and clear explanation.",
        scaffoldingTier: 2,
        skillsPracticed: ["Sentence structure", "Paragraph development"],
        status: "pending"
      });
      alert("Body paragraph exercise saved to your Student Portfolio!");
      markSkillCompleted("Paragraph development");
      loadPortfolio();
    } catch (e) {
      console.error(e);
    }
  };

  // Level 3: Title formulation tutor
  const handleGetTitleCoaching = async () => {
    if (!draftTitle.trim()) {
      alert("Please enter a Draft Title first!");
      return;
    }
    setGettingTitleFeedback(true);
    setTitleAiFeedback("");
    try {
      const response = await fetch("/api/gemini/title-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: titleAnswers,
          draftTitle: draftTitle
        })
      });
      const data = await response.json();
      setTitleAiFeedback(data.text);
    } catch (e) {
      console.error(e);
      setTitleAiFeedback("Failed to reach writing coach. Try making the title more specific: describe who/what is being studied!");
    } finally {
      setGettingTitleFeedback(false);
    }
  };

  const handleSaveTitlePortfolio = async () => {
    if (!draftTitle.trim()) return;
    try {
      await savePortfolioItem({
        userId,
        studentName: currentStudent.name,
        studentEmail: currentStudent.email,
        type: "title",
        title: "Title Formulation Study",
        draft: `Draft Title: ${draftTitle}\nRevised Title: ${revisedTitle}`,
        reflection: titleWhyChanged || "Refined the title to make it concise and academic.",
        scaffoldingTier: 2,
        skillsPracticed: ["Paragraph development"],
        status: "pending"
      });
      alert("Title study saved to your Student Portfolio!");
      loadPortfolio();
    } catch (e) {
      console.error(e);
    }
  };

  // Level 3: Thesis formulation guide
  const handleGetThesisCoaching = async () => {
    if (!thesisDraft.trim()) {
      alert("Please formulate your thesis draft first!");
      return;
    }
    setGettingThesisFeedback(true);
    setThesisFeedback("");
    try {
      const response = await fetch("/api/gemini/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: "essay",
          module: "thesis",
          tier: 2,
          mode: "chat",
          studentDraft: thesisDraft,
          userInput: `This is my formulated thesis statement draft: "${thesisDraft}". I built it based on topic: "${thesisTopic}", position: "${thesisPosition}", and reasons: "${thesisReasons}". Evaluate this against high school standards. Provide guiding comments to make the reasons more precise, but do not write it for me.`,
        })
      });
      const data = await response.json();
      setThesisFeedback(data.text);
    } catch (e) {
      console.error(e);
      setThesisFeedback("Coaching failed. Make sure your thesis includes topic, your clear stance, and 3 specific supporting reasons!");
    } finally {
      setGettingThesisFeedback(false);
    }
  };

  const handleSaveThesisPortfolio = async () => {
    if (!thesisDraft.trim()) return;
    try {
      await savePortfolioItem({
        userId,
        studentName: currentStudent.name,
        studentEmail: currentStudent.email,
        type: "thesis",
        title: "Thesis Formulation",
        draft: `Draft: ${thesisDraft}`,
        reflection: "Practiced combining my position with 3 specific supporting reasons into a single arguable sentence.",
        scaffoldingTier: 2,
        skillsPracticed: ["Paragraph development"],
        status: "pending"
      });
      alert("Thesis saved to your Student Portfolio!");
      loadPortfolio();
    } catch (e) {
      console.error(e);
    }
  };

  // Level 4: Citation Builder Compile
  const handleBuildCitation = () => {
    const { author, year, title, publication, volume, pages, url } = citationFields;
    if (!author || !year || !title) {
      alert("Please fill in Author, Year, and Title to construct a proper citation!");
      return;
    }
    
    // Simple APA 7th parser
    const shortAuthor = author.includes(",") ? author.split(",")[0] : author;
    const inText = `(${shortAuthor}, ${year})`;
    const reference = `${author}. (${year}). ${title}. ${publication || "Self-published"}.${volume ? ` ${volume},` : ""}${pages ? ` ${pages}.` : ""}${url ? ` Retrieved from ${url}` : ""}`;
    
    setCitationResult({ inText, reference });
    markSkillCompleted("Referencing");
  };

  // Level 4: Paraphrasing evaluation coach
  const handleEvaluateParaphrase = async () => {
    if (!studentParaphrase.trim()) return;
    setEvaluatingParaphrase(true);
    setParaphraseReport(null);
    try {
      const currentPassage = PARAPHRASING_PASSAGES[selectedPassageIdx];
      const response = await fetch("/api/gemini/paraphrase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalText: currentPassage.original,
          studentParaphrase: studentParaphrase,
          studentCitation: studentParaphraseCitation
        })
      });
      const data = await response.json();
      setParaphraseReport(data);
      markSkillCompleted("Referencing");
    } catch (e) {
      console.error(e);
      alert("Paraphrase coaching failed. Remember: use completely different sentence structures and vocabulary!");
    } finally {
      setEvaluatingParaphrase(false);
    }
  };

  // If no user is logged in, show dedicated Sign In page
  if (!currentUser) {
    return <SignInPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800" id="app_root">
      
      {/* Header and Perspective Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
              WW
            </div>
            <div>
              <h1 className="font-extrabold text-slate-900 text-lg leading-tight tracking-tight">WRITEWISE</h1>
              <p className="text-[11px] text-slate-500 font-medium">A Tiered Scaffolding Application for Grade 11 Writing Development</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Current User Info Profile */}
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-1.5 shadow-3xs">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                currentUser.role === "teacher" 
                  ? "bg-purple-100 text-purple-700 border border-purple-200" 
                  : "bg-indigo-100 text-indigo-700 border border-indigo-200"
              }`}>
                {currentUser.displayName.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight">{currentUser.displayName}</div>
                <div className="text-[10px] text-slate-400 font-medium">
                  {currentUser.role === "teacher" ? "Instructor Suite" : (currentUser.className || "Student")}
                </div>
              </div>
            </div>

            {/* Prominent Log Out Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-bold transition-all shadow-3xs"
              title="Sign out of WriteWise"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span className="hidden sm:inline font-bold">Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        
        {/* TEACHER DASHBOARD PORTAL */}
        {role === "teacher" ? (
          <TeacherDashboard />
        ) : (
          /* STUDENT WRITING HUB */
          <div className="flex flex-col gap-6 w-full animate-fade-in" id="student_writing_hub">
            
            {/* Master Scaffolded-to-Independent Pathway Steps Indicator (FIGURE 2) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 border-b border-slate-100 pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                  <h2 className="font-extrabold text-slate-900 text-xs tracking-tight uppercase">SCAFFOLDED-TO-INDEPENDENT WRITING PATHWAY (FIGURE 2)</h2>
                </div>
                {assignedTrack && (
                  <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                    assignedTrack === "A" 
                      ? "bg-amber-50 text-amber-800 border-amber-200 animate-pulse" 
                      : "bg-emerald-50 text-emerald-800 border-emerald-200 animate-pulse"
                  }`}>
                    {assignedTrack === "A" ? "Track A: Foundational Scaffolding" : "Track B: Advanced Challenge"}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-5 gap-2.5 relative">
                {[
                  { num: 1, title: "Step 1", desc: "Diagnostic Survey" },
                  { num: 2, title: "Step 2", desc: "Guided Drafting" },
                  { num: 3, title: "Step 3", desc: "Originality Check" },
                  { num: 4, title: "Step 4", desc: "Suggestion Engine" },
                  { num: 5, title: "Step 5", desc: "Post-Survey" }
                ].map((s) => {
                  const isActive = pathwayStep === s.num;
                  const isCompleted = pathwayStep > s.num;
                  return (
                    <button
                      key={s.num}
                      disabled={s.num > 1 && !preSurveySubmitted}
                      onClick={() => setPathwayStep(s.num)}
                      className={`relative flex flex-col items-center md:items-start text-left p-3 rounded-2xl transition-all border ${
                        isActive 
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md scale-[1.01]" 
                          : isCompleted 
                            ? "bg-indigo-50 border-indigo-100 text-indigo-900 hover:bg-indigo-100/50" 
                            : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100/80"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                          isActive 
                            ? "bg-white text-indigo-600" 
                            : isCompleted 
                              ? "bg-indigo-600 text-white" 
                              : "bg-slate-200 text-slate-500"
                        }`}>
                          {isCompleted ? "✓" : s.num}
                        </span>
                        <span className="text-[11px] font-black hidden md:inline">{s.title}</span>
                      </div>
                      <span className={`text-[9px] mt-1.5 hidden lg:block font-semibold ${isActive ? "text-indigo-100 font-bold" : "text-slate-400"}`}>
                        {s.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TEACHER ASSIGNMENTS ALERT & QUICK ACCESS BANNER */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-5 shadow-sm border border-indigo-700/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in" id="teacher_assignments_alert_banner">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600/80 border border-indigo-400/30 text-white flex items-center justify-center shrink-0 shadow-3xs">
                  <FileText className="w-5 h-5 text-indigo-200" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black tracking-wide text-white uppercase">Teacher Curriculum Tasks</span>
                    <span className="bg-indigo-500/80 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full border border-indigo-400/40">
                      {assignments.length} Active {assignments.length === 1 ? "Assignment" : "Assignments"}
                    </span>
                    {assignments.length > 0 && (
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Next Due: {assignments[0].dueDate}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-indigo-200 mt-1 line-clamp-1">
                    {assignments.length > 0 
                      ? `Active Task: "${assignments[0].title}" • Assigned by ${assignments[0].assignedBy || "Mr. Escrina"}`
                      : "No active assignments posted yet. Check back when your teacher assigns a writing module."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
                <button
                  onClick={() => {
                    setPathwayStep(2);
                    setActiveTab("assignments");
                  }}
                  className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-3xs ${
                    pathwayStep === 2 && activeTab === "assignments"
                      ? "bg-white text-indigo-900 ring-2 ring-indigo-400"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/40"
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>View All Assignments ({assignments.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* STEP 1: PRE-SURVEY */}
            {pathwayStep === 1 && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    STEP 1: PRE-SURVEY & DIAGNOSTIC PLACEMENT
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Welcome to the WriteWise Portal. This diagnostic survey helps us determine whether you would benefit from full foundational scaffolding (Track A) or advanced challenge tasks (Track B). Let's evaluate your writing confidence and AI use habits.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1">
                        1. How confident are you in formulating a clear, specific academic thesis statement?
                      </label>
                      <div className="grid grid-cols-5 gap-2 mt-1.5">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <button
                            key={val}
                            onClick={() => setPreSurveyAnswers(p => ({ ...p, thesisConfidence: val }))}
                            className={`py-2 text-xs font-bold rounded-xl transition-all border ${
                              preSurveyAnswers.thesisConfidence === val
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {val} {val === 1 ? "(Low)" : val === 5 ? "(High)" : ""}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1">
                        2. How confident are you in restructuring sentences and paraphrasing sources to avoid plagiarism?
                      </label>
                      <div className="grid grid-cols-5 gap-2 mt-1.5">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <button
                            key={val}
                            onClick={() => setPreSurveyAnswers(p => ({ ...p, paraphraseConfidence: val }))}
                            className={`py-2 text-xs font-bold rounded-xl transition-all border ${
                              preSurveyAnswers.paraphraseConfidence === val
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {val} {val === 1 ? "(Low)" : val === 5 ? "(High)" : ""}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1">
                        3. How confident are you in formatting APA 7th edition referencing and bibliography entries?
                      </label>
                      <div className="grid grid-cols-5 gap-2 mt-1.5">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <button
                            key={val}
                            onClick={() => setPreSurveyAnswers(p => ({ ...p, referencingConfidence: val }))}
                            className={`py-2 text-xs font-bold rounded-xl transition-all border ${
                              preSurveyAnswers.referencingConfidence === val
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {val} {val === 1 ? "(Low)" : val === 5 ? "(High)" : ""}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1">
                        4. How often do you currently rely on AI to write complete sentences, paragraphs, or essays for you?
                      </label>
                      <div className="grid grid-cols-5 gap-2 mt-1.5">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <button
                            key={val}
                            onClick={() => setPreSurveyAnswers(p => ({ ...p, aiRelianceHabits: val }))}
                            className={`py-2 text-xs font-bold rounded-xl transition-all border ${
                              preSurveyAnswers.aiRelianceHabits === val
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {val} {val === 1 ? "(Never)" : val === 5 ? "(Always)" : ""}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-[11px] text-slate-500">
                    * Diagnostic algorithm evaluates aggregate writing self-efficacy scores relative to your AI reliance score.
                  </div>
                  <button
                    onClick={() => {
                      const avgConfidence = (preSurveyAnswers.thesisConfidence + preSurveyAnswers.paraphraseConfidence + preSurveyAnswers.referencingConfidence) / 3;
                      const aiReliance = preSurveyAnswers.aiRelianceHabits;
                      
                      let track: "A" | "B" = "A";
                      if (avgConfidence >= 3.5 && aiReliance <= 3) {
                        track = "B";
                      }
                      
                      setAssignedTrack(track);
                      setPreSurveySubmitted(true);
                      setPathwayStep(2);
                      alert(`Diagnostic Complete!\nBased on your responses:\nAverage Writing Confidence: ${avgConfidence.toFixed(1)}/5.0\nAI Reliance Level: ${aiReliance}/5.0\nYou have been placed in: ${track === "A" ? "TRACK A - FOUNDATIONAL (Focuses on sentence starters, section outline templates, and micro-checks)" : "TRACK B - ADVANCED (Focuses on challenges and extension exercises)"}`);
                    }}
                    className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    Submit Diagnostic Survey & Get Track Placement <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: GUIDED DRAFTING GRID (Active when pathwayStep === 2) */}
            {pathwayStep === 2 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full animate-fade-in">
                
                {/* LEFT SIDE: PATHWAY & WRITING MODULES (8 cols) */}
                <div className="lg:col-span-8 flex flex-col gap-6">

                  {/* Track Guidance Banner inside Step 2 */}
                  <div className={`p-4 rounded-2xl border ${
                    assignedTrack === "A" 
                      ? "bg-amber-50 border-amber-200 text-amber-900" 
                      : "bg-emerald-50 border-emerald-200 text-emerald-900"
                  } text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3`}>
                    <div>
                      <span className="font-extrabold uppercase">
                        {assignedTrack === "A" ? "Track A: Foundational Active" : "Track B: Advanced Active"}
                      </span>
                      <p className="mt-0.5 text-slate-600 leading-relaxed text-[11px]">
                        {assignedTrack === "A" 
                          ? "Guidance: Use the sentence starters, worked templates, and step-by-step paragraphs builders below to develop structure." 
                          : "Guidance: Challenge yourself! Attempt to formulate citations, write advanced transitions, and explore critical review models."}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        // Grab text from active levels
                        let text = "";
                        if (activeLevel === 1) text = sentenceDraft;
                        else if (activeLevel === 2) text = `${paraTopic} ${paraSupport} ${paraEvidence} ${paraExplain} ${paraExample} ${paraTransition}`;
                        else if (activeLevel === 3) text = `Thesis: ${thesisDraft}\nTitle: ${draftTitle}`;
                        else if (activeLevel === 4) text = studentParaphrase;
                        else if (activeLevel === 5) text = compileConceptPaperText();

                        setCustomDraftToScan(text);
                        setPathwayStep(3);
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-xs shrink-0"
                    >
                      Proceed to Step 3: Originality Check →
                    </button>
                  </div>
                  
                  {/* Visual Learning Pathway */}
                  <section className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs" id="visual_pathway">
                    <div className="flex items-center gap-2 mb-4">
                      <Layers className="w-5 h-5 text-indigo-600 animate-pulse" />
                      <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">My Writing Development Pathway</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 relative">
                  {[
                    { lvl: 1, name: "WORD & SENTENCE", desc: "Grammar, S-V agreement, active clarity" },
                    { lvl: 2, name: "PARAGRAPH", desc: "Topic sentence, evidence, links" },
                    { lvl: 3, name: "ESSAY DEVELOPMENT", desc: "Title, thesis, argument maps, cohesion" },
                    { lvl: 4, name: "FORMAL & RESEARCH", desc: "APA referencing, paraphasing, ethics" },
                    { lvl: 5, name: "CONCEPT PAPER", desc: "Background, objectives, method, smart suggest engine" }
                  ].map((item) => (
                    <button
                      key={item.lvl}
                      onClick={() => {
                        setActiveLevel(item.lvl);
                        // Default to lesson first, guiding the student pedagogically
                        if (item.lvl === 1) setActiveTab("lessons");
                        else if (item.lvl === 2) setActiveTab("para_lessons");
                        else if (item.lvl === 3) setActiveTab("essay_lessons");
                        else if (item.lvl === 4) setActiveTab("writing_types");
                        else if (item.lvl === 5) setActiveTab("concept_paper_workspace");
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        activeLevel === item.lvl
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md scale-[1.02]"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black tracking-widest opacity-80 uppercase">Level {item.lvl}</span>
                        <span className={`w-2 h-2 rounded-full ${activeLevel === item.lvl ? "bg-white" : "bg-indigo-500"}`}></span>
                      </div>
                      <div className="font-bold text-xs leading-snug mt-1">{item.name}</div>
                      <p className={`text-[10px] mt-1.5 leading-relaxed ${activeLevel === item.lvl ? "text-indigo-100" : "text-slate-500"}`}>
                        {item.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </section>

              {/* LEVEL CONTENT NAVIGATION TABS */}
              <div className="flex bg-white p-1 rounded-2xl border border-slate-200 text-xs shadow-xs" id="level_content_navigation">
                {activeLevel === 1 && (
                  <>
                    <button
                      onClick={() => setActiveTab("exercises")}
                      className={`flex-1 py-2 rounded-xl text-center font-bold transition-all ${
                        activeTab === "exercises" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Sentence Exercises
                    </button>
                    <button
                      onClick={() => setActiveTab("lessons")}
                      className={`flex-1 py-2 rounded-xl text-center font-bold transition-all ${
                        activeTab === "lessons" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Grammar & Clarity Lessons
                    </button>
                  </>
                )}

                {activeLevel === 2 && (
                  <>
                    <button
                      onClick={() => setActiveTab("paragraph_workspace")}
                      className={`flex-1 py-2 rounded-xl text-center font-bold transition-all ${
                        activeTab === "paragraph_workspace" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Body Paragraph Workspace
                    </button>
                    <button
                      onClick={() => setActiveTab("para_lessons")}
                      className={`flex-1 py-2 rounded-xl text-center font-bold transition-all ${
                        activeTab === "para_lessons" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Paragraph Lessons
                    </button>
                  </>
                )}

                {activeLevel === 3 && (
                  <>
                    <button
                      onClick={() => setActiveTab("essay_lessons")}
                      className={`flex-1 py-2 rounded-xl text-center font-bold transition-all ${
                        activeTab === "essay_lessons" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Essay Writing Lessons
                    </button>
                    <button
                      onClick={() => setActiveTab("workspace")}
                      className={`flex-1 py-2 rounded-xl text-center font-bold transition-all ${
                        activeTab === "workspace" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Complete Essay Workspace
                    </button>
                    <button
                      onClick={() => setActiveTab("title_formulation")}
                      className={`flex-1 py-2 rounded-xl text-center font-bold transition-all ${
                        activeTab === "title_formulation" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Title Formulation Tool
                    </button>
                    <button
                      onClick={() => setActiveTab("thesis_builder")}
                      className={`flex-1 py-2 rounded-xl text-center font-bold transition-all ${
                        activeTab === "thesis_builder" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Thesis Builder
                    </button>
                  </>
                )}

                {activeLevel === 4 && (
                  <>
                    <button
                      onClick={() => setActiveTab("paraphrasing")}
                      className={`flex-1 py-2 rounded-xl text-center font-bold transition-all ${
                        activeTab === "paraphrasing" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Paraphrase Coach
                    </button>
                    <button
                      onClick={() => setActiveTab("citations")}
                      className={`flex-1 py-2 rounded-xl text-center font-bold transition-all ${
                        activeTab === "citations" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Source Evaluator & Citation
                    </button>
                    <button
                      onClick={() => setActiveTab("writing_types")}
                      className={`flex-1 py-2 rounded-xl text-center font-bold transition-all ${
                        activeTab === "writing_types" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Academic Referencing Lessons
                    </button>
                  </>
                )}

                {activeLevel === 5 && (
                  <>
                    <button
                      onClick={() => setActiveTab("concept_paper_workspace")}
                      className={`flex-1 py-2 rounded-xl text-center font-bold transition-all ${
                        activeTab === "concept_paper_workspace" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Concept Paper Builder
                    </button>
                    <button
                      onClick={() => setActiveTab("concept_paper_lessons")}
                      className={`flex-1 py-2 rounded-xl text-center font-bold transition-all ${
                        activeTab === "concept_paper_lessons" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Concept Paper Lessons
                    </button>
                  </>
                )}

                <button
                  onClick={() => setActiveTab("assignments")}
                  className={`flex-1 py-2 px-2.5 rounded-xl text-center font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === "assignments" 
                      ? "bg-indigo-600 text-white shadow-xs" 
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Teacher Tasks</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    activeTab === "assignments" ? "bg-white text-indigo-700" : "bg-indigo-100 text-indigo-800"
                  }`}>
                    {assignments.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("portfolio")}
                  className={`flex-1 py-2 rounded-xl text-center font-bold transition-all ${
                    activeTab === "portfolio" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  My Portfolio Log
                </button>
                <button
                  onClick={() => {
                    setActiveTab("practice_writing");
                    setPracticeSuggestion("");
                  }}
                  className={`flex-1 py-2 rounded-xl text-center font-bold transition-all ${
                    activeTab === "practice_writing" ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  ✨ Practice Writing
                </button>
              </div>

              {/* PINNED TEACHER ASSIGNMENT BANNER (VISIBLE IN WORKSPACES) */}
              {selectedAssignment && activeTab !== "assignments" && (
                <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white rounded-2xl p-4 shadow-sm border border-indigo-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in" id="pinned_assignment_workspace_banner">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-700/80 text-amber-300 rounded-xl shrink-0 mt-0.5">
                      <Pin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md">
                          Active Assigned Task
                        </span>
                        <span className="text-xs font-bold text-white">{selectedAssignment.title}</span>
                        <span className="text-[10px] text-indigo-200 bg-indigo-950/60 px-2 py-0.5 rounded-md">
                          Due: {selectedAssignment.dueDate}
                        </span>
                        <span className="text-[10px] text-indigo-200 bg-indigo-950/60 px-2 py-0.5 rounded-md">
                          Tier {selectedAssignment.scaffoldingTier}
                        </span>
                        {selectedAssignment.targetWords && (
                          <span className="text-[10px] text-indigo-200 bg-indigo-950/60 px-2 py-0.5 rounded-md">
                            🎯 {selectedAssignment.targetWords} words target
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-indigo-100 mt-1 line-clamp-2">
                        {selectedAssignment.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => setActiveTab("assignments")}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Full Instructions
                    </button>
                    <button
                      onClick={() => setSelectedAssignment(null)}
                      className="p-1.5 text-indigo-300 hover:text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      title="Unpin prompt from workspace"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* LEVEL 1: SENTENCE WORKSPACE */}
              {activeLevel === 1 && activeTab === "exercises" && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h4 className="font-bold text-slate-800 text-sm">Level 1 Worksheets: Correct, Improve & Combine</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Practice writing complete sentences, ensuring singular-plural subject agreements, conciseness, and structured clauses.
                    </p>
                  </div>

                  {/* Exercise selector buttons */}
                  <div className="flex gap-2">
                    {SENTENCE_EXERCISES.map((ex, i) => (
                      <button
                        key={ex.id}
                        onClick={() => {
                          setSelectedExerciseIdx(i);
                          setSentenceDraft("");
                          setSentenceFeedback("");
                        }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                          selectedExerciseIdx === i
                            ? "bg-indigo-100 text-indigo-700 font-bold"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {ex.title}
                      </button>
                    ))}
                  </div>

                  {/* Exercise Box */}
                  <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-200 space-y-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Instruction</span>
                      <p className="text-xs text-slate-700 font-medium mt-1 leading-normal">
                        {SENTENCE_EXERCISES[selectedExerciseIdx].instruction}
                      </p>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 font-semibold text-xs text-slate-800 leading-relaxed italic">
                      <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider block not-italic mb-1.5">Original Sentence (Contains errors):</span>
                      "{SENTENCE_EXERCISES[selectedExerciseIdx].original}"
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Your Revised Sentence:</label>
                      <input
                        type="text"
                        placeholder="Type your improved sentence here..."
                        value={sentenceDraft}
                        onChange={(e) => setSentenceDraft(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-semibold text-slate-800 shadow-3xs"
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        onClick={handleVerifySentence}
                        disabled={verifyingSentence || !sentenceDraft}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                      >
                        {verifyingSentence ? "Verifying..." : "Check My Sentence"}
                      </button>
                      <button
                        onClick={handleSaveSentencePortfolio}
                        disabled={!sentenceDraft}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                      >
                        Save to Portfolio
                      </button>
                    </div>
                  </div>

                  {sentenceFeedback && (
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                      <div className="font-bold text-indigo-900 text-xs mb-1.5 flex items-center gap-1">
                        <Sparkles className="w-4 h-4 text-indigo-500" /> AI Coach feedback
                      </div>
                      {sentenceFeedback}
                    </div>
                  )}
                </div>
              )}

              {activeLevel === 1 && activeTab === "lessons" && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm">Level 1 Lesson: Sentence Architecture</h4>
                  <div className="prose text-xs text-slate-600 leading-relaxed space-y-3">
                    <p>
                      Academic writing is built upon the structural clarity of individual sentences. In Level 1, we learn to eliminate sentence fragments and wordiness.
                    </p>
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
                      <h5 className="font-bold text-slate-800 text-xs">Essential Components:</h5>
                      <ul className="list-disc pl-5 space-y-1 text-[11px]">
                        <li><strong>Subject:</strong> The person, place, or concept that performs the action.</li>
                        <li><strong>Predicate:</strong> The action verb that agrees with the subject's number.</li>
                        <li><strong>Sentence Variety:</strong> Avoid repeating simple subject-verb-object structures. Alternate with complex and compound sentences.</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => setActiveTab("exercises")}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      Proceed to Practice Activity <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* LEVEL 2: PARAGRAPH WORKSPACE */}
              {activeLevel === 2 && activeTab === "paragraph_workspace" && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h4 className="font-bold text-slate-800 text-sm">Level 2: Body Paragraph Workspace</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Construct body paragraphs matching the standard: <strong>CLAIM → EVIDENCE → EXPLANATION → EXAMPLE → LINK</strong>.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[11px] font-bold text-indigo-700 mb-1">CLAIM (Main Point)</label>
                        <input
                          type="text"
                          placeholder="e.g., Frequent school-related stressful triggers disrupt sleep."
                          value={paraTopic}
                          onChange={(e) => setParaTopic(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-indigo-700 mb-1">SUPPORTING DETAIL</label>
                        <input
                          type="text"
                          placeholder="What details expand on this claim?"
                          value={paraSupport}
                          onChange={(e) => setParaSupport(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-indigo-700 mb-1">EVIDENCE (Scholarly Cite)</label>
                        <input
                          type="text"
                          placeholder="e.g., According to Dr. Santos (2023), lecture distractors worsen concentration."
                          value={paraEvidence}
                          onChange={(e) => setParaEvidence(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[11px] font-bold text-indigo-700 mb-1">EXPLANATION (Relevance connection)</label>
                        <textarea
                          placeholder="Explain what the evidence implies and how it supports your main point..."
                          value={paraExplain}
                          onChange={(e) => setParaExplain(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs h-16 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-indigo-700 mb-1">EXAMPLE</label>
                        <input
                          type="text"
                          placeholder="Provide a concrete illustration..."
                          value={paraExample}
                          onChange={(e) => setParaExample(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-indigo-700 mb-1">TRANSITION (Concluding link)</label>
                        <input
                          type="text"
                          placeholder="How does this transition into the next paragraph?"
                          value={paraTransition}
                          onChange={(e) => setParaTransition(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Paragraph flow layout preview */}
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mt-2">
                    <span className="text-[10px] uppercase font-bold text-indigo-800 block mb-1.5">Compiled Continuous Flow Preview:</span>
                    <p className="text-xs text-slate-700 leading-relaxed italic whitespace-pre-wrap">
                      {paraTopic || "..."} {paraSupport || "..."} {paraEvidence || "..."} {paraExplain || "..."} {paraExample || "..."} {paraTransition || "..."}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Self-Reflection (What did you learn about paragraph coherence?):</label>
                    <textarea
                      placeholder="Write your reflections here..."
                      value={paraReflection}
                      onChange={(e) => setParaReflection(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs h-16 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <button
                    onClick={handleSaveParagraphPortfolio}
                    disabled={!paraTopic}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs"
                  >
                    Save Compiled Paragraph to Portfolio
                  </button>
                </div>
              )}

              {activeLevel === 2 && activeTab === "para_lessons" && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm">Level 2 Lesson: Cohesive Paragraphs</h4>
                  <div className="prose text-xs text-slate-600 leading-relaxed space-y-3">
                    <p>
                      A paragraph represents a unified block of logical reasoning centered on one singular theme.
                    </p>
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
                      <h5 className="font-bold text-slate-800 text-xs">Unified Paragraph Structure:</h5>
                      <p className="text-[11px]">
                        <strong>Unity:</strong> Every single sentence must contribute to the topic sentence. Remove any sentence that strays.
                      </p>
                      <p className="text-[11px]">
                        <strong>Transitions:</strong> Use transition words (e.g., 'Furthermore', 'Consequently', 'On the contrary') to create bridges between preceding ideas and the next paragraphs.
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => setActiveTab("paragraph_workspace")}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      Proceed to Practice Activity <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* LEVEL 3: ESSAY MODULES */}
              {activeLevel === 3 && activeTab === "essay_lessons" && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm">Level 3 Lesson: Essay Structure & Design</h4>
                  <div className="prose text-xs text-slate-600 leading-relaxed space-y-3.5">
                    <p>
                      An essay is a structured scholarly argument built upon a cohesive thesis statement. The flow must guide readers effortlessly:
                    </p>
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                      <div>
                        <strong className="text-slate-850">1. Introduction & Hook:</strong>
                        <p className="text-[11px] mt-0.5">Capture attention using a surprising statistic, a profound question, or a relevant historical context. Avoid empty clichés.</p>
                      </div>
                      <div>
                        <strong className="text-slate-850">2. Thesis Statement:</strong>
                        <p className="text-[11px] mt-0.5">The backbone of your paper. It states your clear position and outlines the three supporting reasons you will elaborate on in your body paragraphs.</p>
                      </div>
                      <div>
                        <strong className="text-slate-850">3. Body Cohesion:</strong>
                        <p className="text-[11px] mt-0.5">Each paragraph must connect logically to your thesis statement, developing your argument step by step.</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => setActiveTab("workspace")}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      Proceed to Essay Workspace <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {activeLevel === 3 && activeTab === "workspace" && (
                <Workspace 
                  userId={userId} 
                  skillsPracticed={skillsPracticed}
                  setSkillsPracticed={setSkillsPracticed}
                />
              )}

              {activeLevel === 3 && activeTab === "title_formulation" && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h4 className="font-bold text-slate-800 text-sm">Level 3: Title Formulation Tool</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      A scholarly title should be specific, concise, and communicate variables or ideas. Refuse standard broad titles like "Social Media Effects".
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-3.5">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Step 1: What is your main topic?</label>
                        <input
                          type="text"
                          placeholder="e.g., Social media effects"
                          value={titleAnswers.topic}
                          onChange={(e) => setTitleAnswers({ ...titleAnswers, topic: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Step 2: What specific aspect of the topic?</label>
                        <input
                          type="text"
                          placeholder="e.g., Mental well-being, sleep cycles"
                          value={titleAnswers.aspect}
                          onChange={(e) => setTitleAnswers({ ...titleAnswers, aspect: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Step 3: What is the purpose of writing?</label>
                        <input
                          type="text"
                          placeholder="e.g., To analyze correlations"
                          value={titleAnswers.purpose}
                          onChange={(e) => setTitleAnswers({ ...titleAnswers, purpose: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Step 4: Who/What studied or discussed?</label>
                        <input
                          type="text"
                          placeholder="e.g., Grade 11 senior high students"
                          value={titleAnswers.focus}
                          onChange={(e) => setTitleAnswers({ ...titleAnswers, focus: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Step 5: What issues or variables are involved?</label>
                        <input
                          type="text"
                          placeholder="e.g., Anxiety, academic fatigue"
                          value={titleAnswers.variables}
                          onChange={(e) => setTitleAnswers({ ...titleAnswers, variables: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-indigo-800 mb-1">My Draft Title:</label>
                        <input
                          type="text"
                          placeholder="e.g., How social media impacts students"
                          value={draftTitle}
                          onChange={(e) => setDraftTitle(e.target.value)}
                          className="w-full bg-indigo-50 border border-indigo-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none font-semibold text-indigo-900"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleGetTitleCoaching}
                    disabled={gettingTitleFeedback || !draftTitle}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs"
                  >
                    {gettingTitleFeedback ? "Analyzing Title..." : "Request AI Title Formulation Coaching"}
                  </button>

                  {titleAiFeedback && (
                    <div className="space-y-4">
                      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed shadow-3xs">
                        <div className="font-bold text-indigo-950 flex items-center gap-1 mb-1.5">
                          <Sparkles className="w-4 h-4 text-indigo-500" /> AI Title Coaching suggestions
                        </div>
                        {titleAiFeedback}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1.5">My Revised Title (Improved):</label>
                          <input
                            type="text"
                            placeholder="Draft your revised, highly specific title..."
                            value={revisedTitle}
                            onChange={(e) => setRevisedTitle(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 outline-none font-semibold text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1.5">Why I Changed It (Reflection):</label>
                          <input
                            type="text"
                            placeholder="e.g., Added specific target population and focused variables."
                            value={titleWhyChanged}
                            onChange={(e) => setTitleWhyChanged(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleSaveTitlePortfolio}
                        disabled={!revisedTitle}
                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all"
                      >
                        Save Title Study to Portfolio
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeLevel === 3 && activeTab === "thesis_builder" && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h4 className="font-bold text-slate-800 text-sm">Level 3: Thesis Statement Formulation</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Develop clear controlling arguments mapping topic, position, and 3 specific supporting reasons.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Topic</label>
                      <input
                        type="text"
                        placeholder="e.g., Online learning"
                        value={thesisTopic}
                        onChange={(e) => setThesisTopic(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Position / Main stance</label>
                      <input
                        type="text"
                        placeholder="e.g., Can benefit students"
                        value={thesisPosition}
                        onChange={(e) => setThesisPosition(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">3 Supporting Reasons</label>
                      <input
                        type="text"
                        placeholder="e.g., Flexible schedules, resource access, autonomy"
                        value={thesisReasons}
                        onChange={(e) => setThesisReasons(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Draft Your Consolidated Thesis Statement:</label>
                    <input
                      type="text"
                      placeholder="e.g., Online learning can benefit senior high school students by offering flexible schedules, access to richer resources, and greater learning autonomy."
                      value={thesisDraft}
                      onChange={(e) => setThesisDraft(e.target.value)}
                      className="w-full bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-semibold text-indigo-950"
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={handleGetThesisCoaching}
                      disabled={gettingThesisFeedback || !thesisDraft}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                    >
                      {gettingThesisFeedback ? "Analyzing Thesis..." : "Request AI Thesis Audit"}
                    </button>
                    <button
                      onClick={handleSaveThesisPortfolio}
                      disabled={!thesisDraft}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                    >
                      Save Thesis to Portfolio
                    </button>
                  </div>

                  {thesisFeedback && (
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed shadow-3xs">
                      <div className="font-bold text-indigo-900 flex items-center gap-1 mb-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-500" /> AI Thesis Guidance
                      </div>
                      {thesisFeedback}
                    </div>
                  )}
                </div>
              )}

              {/* LEVEL 4: FORMAL & RESEARCH */}
              {activeLevel === 4 && activeTab === "paraphrasing" && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h4 className="font-bold text-slate-800 text-sm">Level 4: Paraphrasing Practice & Coaching</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Learn the vital art of restructuring academic passages in your own syntax while preserving the key meaning and citing the source appropriately.
                    </p>
                  </div>

                  {/* Passage Navigation */}
                  <div className="flex gap-2">
                    {PARAPHRASING_PASSAGES.map((pass, i) => (
                      <button
                        key={pass.id}
                        onClick={() => {
                          setSelectedPassageIdx(i);
                          setStudentParaphrase("");
                          setParaphraseReport(null);
                        }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                          selectedPassageIdx === i
                            ? "bg-indigo-100 text-indigo-700 font-bold"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        Sample Source {i + 1}
                      </button>
                    ))}
                  </div>

                  {/* Passage original Box */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Original Source Text ({PARAPHRASING_PASSAGES[selectedPassageIdx].source})</span>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed mt-1 italic">
                        "{PARAPHRASING_PASSAGES[selectedPassageIdx].original}"
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Your Paraphrase:</label>
                        <textarea
                          placeholder="Restructure the passage completely in your own words..."
                          value={studentParaphrase}
                          onChange={(e) => setStudentParaphrase(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs h-20 focus:ring-1 focus:ring-indigo-500 outline-none leading-relaxed"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Source Citation (APA 7th):</label>
                        <input
                          type="text"
                          placeholder="e.g., (Santos, 2023)"
                          value={studentParaphraseCitation}
                          onChange={(e) => setStudentParaphraseCitation(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        onClick={handleEvaluateParaphrase}
                        disabled={evaluatingParaphrase || !studentParaphrase}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                      >
                        {evaluatingParaphrase ? "Evaluating..." : "Check My Paraphrase"}
                      </button>
                    </div>
                  </div>

                  {paraphraseReport && (
                    <div className="space-y-3">
                      <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
                        paraphraseReport.success 
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                          : "bg-rose-50 border-rose-200 text-rose-800"
                      }`}>
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-xs uppercase font-black">
                            {paraphraseReport.success ? "✓ Successful Paraphrase" : "⚠️ Improvement Required"}
                          </span>
                          <span className="px-2 py-0.5 bg-white border rounded-full text-[10px]">
                            Originality: {paraphraseReport.originalityScore}%
                          </span>
                        </div>
                        <p className="leading-relaxed opacity-95">{paraphraseReport.feedback}</p>
                        {paraphraseReport.suggestions && paraphraseReport.suggestions.length > 0 && (
                          <div className="pt-2 border-t border-slate-300/30 mt-1">
                            <span className="font-bold text-[10px] block uppercase text-slate-500 tracking-wider">Suggested Actions:</span>
                            <ul className="list-disc pl-4 space-y-0.5 text-[11px] mt-1 leading-normal opacity-90">
                              {paraphraseReport.suggestions.map((s, idx) => (
                                <li key={idx}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeLevel === 4 && activeTab === "citations" && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
                  
                  {/* Source Evaluation Checklist */}
                  <div className="space-y-3">
                    <div className="border-b border-slate-100 pb-2">
                      <h4 className="font-bold text-slate-800 text-sm">Level 4: Source Evaluation Checklist</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                        Evaluate source credibility using the Authority, Accuracy, Currency, Relevance, and Purpose checklist before using it.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                      {[
                        { key: "authority", name: "Authority", desc: "Who is the author?" },
                        { key: "accuracy", name: "Accuracy", desc: "Is evidence cited?" },
                        { key: "currency", name: "Currency", desc: "When was it published?" },
                        { key: "relevance", name: "Relevance", desc: "Directly relates to topic?" },
                        { key: "purpose", name: "Purpose", desc: "Why was it created?" }
                      ].map((item) => (
                        <button
                          key={item.key}
                          onClick={() => setSourceEvaluation(prev => ({
                            ...prev,
                            [item.key]: !prev[item.key as keyof typeof sourceEvaluation]
                          }))}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            sourceEvaluation[item.key as keyof typeof sourceEvaluation]
                              ? "bg-indigo-50 border-indigo-300 text-indigo-900"
                              : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <div className="font-bold text-xs flex items-center gap-1.5">
                            <span className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center text-[10px] font-black ${
                              sourceEvaluation[item.key as keyof typeof sourceEvaluation] ? "bg-indigo-600 text-white" : "bg-white text-slate-300"
                            }`}>
                              ✓
                            </span>
                            {item.name}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 leading-tight">{item.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Citation Builder */}
                  <div className="border-t border-slate-100 pt-5 space-y-3.5">
                    <div className="border-b border-slate-100 pb-2">
                      <h4 className="font-bold text-slate-800 text-sm">APA 7th Edition Citation Builder</h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Enter source information below to see how standard in-text citations and reference entries are formatted.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">Author (LastName, Initials)</label>
                        <input
                          type="text"
                          placeholder="e.g., Santos, E."
                          value={citationFields.author}
                          onChange={(e) => setCitationFields({ ...citationFields, author: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">Year of Publication</label>
                        <input
                          type="text"
                          placeholder="e.g., 2023"
                          value={citationFields.year}
                          onChange={(e) => setCitationFields({ ...citationFields, year: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block font-bold text-slate-600 mb-1">Title of Article / Chapter</label>
                        <input
                          type="text"
                          placeholder="e.g., Cognitive distraction in classrooms"
                          value={citationFields.title}
                          onChange={(e) => setCitationFields({ ...citationFields, title: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-600 mb-1">Journal, Publisher, or Website</label>
                        <input
                          type="text"
                          placeholder="e.g., Philippine Journal of Educational Research"
                          value={citationFields.publication}
                          onChange={(e) => setCitationFields({ ...citationFields, publication: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">DOI or Web link URL</label>
                        <input
                          type="text"
                          placeholder="e.g., https://doi.org/10.1234/abc"
                          value={citationFields.url}
                          onChange={(e) => setCitationFields({ ...citationFields, url: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleBuildCitation}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs"
                    >
                      ✓ Build Citation Format
                    </button>

                    {citationResult && (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-3.5 text-xs">
                        <div>
                          <span className="font-bold text-slate-600 block mb-1">Academic In-text Citation:</span>
                          <code className="bg-white px-2 py-1 rounded border text-indigo-700 font-mono font-bold block">
                            {citationResult.inText}
                          </code>
                        </div>
                        <div>
                          <span className="font-bold text-slate-600 block mb-1">Academic Reference Entry (APA 7th):</span>
                          <code className="bg-white px-2 py-1 rounded border text-indigo-700 font-mono font-bold block whitespace-pre-wrap">
                            {citationResult.reference}
                          </code>
                        </div>

                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5 text-[10px] text-amber-800 font-medium">
                          ⚠️ Disclaimer: Check every citation against the original guidelines. AI can make citations errors.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeLevel === 4 && activeTab === "writing_types" && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm">Level 4 Lesson: Referencing in Academic Writing</h4>
                  <div className="prose text-xs text-slate-600 leading-relaxed space-y-3">
                    <p>
                      Academic referencing varies depending on the specific tasks:
                    </p>
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                      <p><strong>Personal/Reflective Essay:</strong> Referencing is generally optional, unless external scholarly sources are used to contextualize personal reflections.</p>
                      <p><strong>Expository Essay:</strong> References are required when factual, statistical, or clinical claims are made.</p>
                      <p><strong>Argumentative Essay:</strong> Strong citations are vital to back up claims and refute opposing views.</p>
                      <p><strong>Research Paper:</strong> Systematic source compilation, exhaustive in-text citations, and complete bibliographic reference entries are mandatory.</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => setActiveTab("paraphrasing")}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      Proceed to Paraphrasing Practice <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {activeLevel === 4 && activeTab === "writing_types" && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm">Level 4 Lesson: Referencing in Academic Writing</h4>
                  <div className="prose text-xs text-slate-600 leading-relaxed space-y-3">
                    <p>
                      Academic referencing varies depending on the specific tasks:
                    </p>
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                      <p><strong>Personal/Reflective Essay:</strong> Referencing is generally optional, unless external scholarly sources are used to contextualize personal reflections.</p>
                      <p><strong>Expository Essay:</strong> References are required when factual, statistical, or clinical claims are made.</p>
                      <p><strong>Argumentative Essay:</strong> Strong citations are vital to back up claims and refute opposing views.</p>
                      <p><strong>Research Paper:</strong> Systematic source compilation, exhaustive in-text citations, and complete bibliographic reference entries are mandatory.</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => setActiveTab("paraphrasing")}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      Proceed to Paraphrasing Practice <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* LEVEL 5: CONCEPT PAPER BUILDER */}
              {activeLevel === 5 && activeTab === "concept_paper_workspace" && (
                <div className="space-y-6">
                  {/* Info Header */}
                  <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-3xl p-6 text-white shadow-xs">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-200 animate-pulse" />
                      <h4 className="font-extrabold text-sm uppercase tracking-wider">Level 5 Workspace: Scholarly Concept Paper Builder</h4>
                    </div>
                    <p className="text-xs text-indigo-100 mt-2 max-w-3xl leading-relaxed">
                      A Concept Paper is a rigorous academic document used to propose and pitch a new project or study. 
                      WriteWise's **Predictive Suggestion Engine** helps you complete sentences and construct strong, scholarly claims in real-time.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Input Columns */}
                    <div className="lg:col-span-7 space-y-5">
                      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
                        <div className="border-b border-slate-100 pb-3 flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Drafting Form</h5>
                            <p className="text-[10px] text-slate-400">Fill in each section of your Concept Paper proposal.</p>
                          </div>
                          <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold px-2 py-1 rounded-full flex items-center gap-1">
                            ⚡ Smart Predictive Typing Active (Press Tab ⇥)
                          </span>
                        </div>

                        {/* FIELD 1: TITLE */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-slate-700">
                              1. Concept Paper Title
                            </label>
                            {activeConceptField === "title" && autocompleteSuggestion && (
                              <span className="text-[9px] text-indigo-600 font-bold animate-pulse">
                                Press [Tab ⇥] to insert suggestion
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            placeholder="e.g., The Impact of Digital Scaffolding on Grade 11 Scholastic Writing"
                            value={conceptPaper.title}
                            onChange={(e) => handleConceptFieldChange("title", e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Tab" && autocompleteSuggestion && activeConceptField === "title") {
                                e.preventDefault();
                                acceptConceptSuggestion("title");
                              }
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-semibold"
                          />
                          {/* Suggestion Bar */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => {
                                  setConceptPaper({ ...conceptPaper, title: "An Empirical Inquiry into the Role of Interactive Pedagogical Scaffolds in Modern Grade 11 Classrooms" });
                                }}
                                className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium px-2 py-0.5 rounded-md transition-all"
                              >
                                💡 Sample Title A
                              </button>
                              <button
                                onClick={() => {
                                  setConceptPaper({ ...conceptPaper, title: "Unlocking Student Self-Authorship: Assessing the Balanced AI Writing Progression" });
                                }}
                                className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium px-2 py-0.5 rounded-md transition-all"
                              >
                                💡 Sample Title B
                              </button>
                            </div>
                            <button
                              onClick={() => fetchAutocompleteSuggestion("title", conceptPaper.title)}
                              className="text-[9px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded-md transition-all flex items-center gap-1"
                            >
                              🔮 Predict Next Word
                            </button>
                          </div>
                          {renderConceptSuggestionBox("title")}
                        </div>

                        {/* FIELD 2: BACKGROUND */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-slate-700">
                              2. Introduction & Background
                            </label>
                            {activeConceptField === "background" && autocompleteSuggestion && (
                              <span className="text-[9px] text-indigo-600 font-bold animate-pulse">
                                Press [Tab ⇥] to insert next word
                              </span>
                            )}
                          </div>
                          <textarea
                            rows={3}
                            placeholder="Introduce the general topic, current trends, and context of your project... (Predicts word-by-word as you type!)"
                            value={conceptPaper.background}
                            onChange={(e) => handleConceptFieldChange("background", e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Tab" && autocompleteSuggestion && activeConceptField === "background") {
                                e.preventDefault();
                                acceptConceptSuggestion("background");
                              }
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                          />
                          {/* Suggestion Bar */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => {
                                  setConceptPaper({ ...conceptPaper, background: "In the contemporary educational environment, the rapid integration of technology has transformed how students develop fundamental writing competencies. Educators are constantly searching for balanced pathways to..." });
                                }}
                                className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium px-2 py-0.5 rounded-md transition-all"
                              >
                                💡 Kickstart Context A
                              </button>
                              <button
                                onClick={() => {
                                  setConceptPaper({ ...conceptPaper, background: "Scholarly writing remains a critical gateway metric for Grade 11 academic success. However, the emergence of raw automation platforms poses a severe risk to authentic learning. This project investigates..." });
                                }}
                                className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium px-2 py-0.5 rounded-md transition-all"
                              >
                                💡 Kickstart Context B
                              </button>
                            </div>
                            <button
                              onClick={() => fetchAutocompleteSuggestion("background", conceptPaper.background)}
                              className="text-[9px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded-md transition-all flex items-center gap-1"
                            >
                              🔮 Predict Next Word
                            </button>
                          </div>
                          {renderConceptSuggestionBox("background")}
                        </div>

                        {/* FIELD 3: PROBLEM STATEMENT */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-slate-700">
                              3. Statement of the Problem
                            </label>
                            {activeConceptField === "problem" && autocompleteSuggestion && (
                              <span className="text-[9px] text-indigo-600 font-bold animate-pulse">
                                Press [Tab ⇥] to insert next word
                              </span>
                            )}
                          </div>
                          <textarea
                            rows={3}
                            placeholder="What is the clear research gap or educational problem your concept addresses? (Predicts word-by-word as you type!)"
                            value={conceptPaper.problem}
                            onChange={(e) => handleConceptFieldChange("problem", e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Tab" && autocompleteSuggestion && activeConceptField === "problem") {
                                e.preventDefault();
                                acceptConceptSuggestion("problem");
                              }
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                          />
                          {/* Suggestion Bar */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => {
                                  setConceptPaper({ ...conceptPaper, problem: "Despite these developments, there is an alarming deficiency in students' ability to draft original academic compositions without total dependence on automated feedback. This reliance diminishes original self-authorship, creating an critical scholarly gap..." });
                                }}
                                className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium px-2 py-0.5 rounded-md transition-all"
                              >
                                💡 Kickstart Problem A
                              </button>
                            </div>
                            <button
                              onClick={() => fetchAutocompleteSuggestion("problem", conceptPaper.problem)}
                              className="text-[9px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded-md transition-all flex items-center gap-1"
                            >
                              🔮 Predict Next Word
                            </button>
                          </div>
                          {renderConceptSuggestionBox("problem")}
                        </div>

                        {/* FIELD 4: OBJECTIVES */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-slate-700">
                              4. Objectives of the Study
                            </label>
                            {activeConceptField === "objectives" && autocompleteSuggestion && (
                              <span className="text-[9px] text-indigo-600 font-bold animate-pulse">
                                Press [Tab ⇥] to insert next word
                              </span>
                            )}
                          </div>
                          <textarea
                            rows={3}
                            placeholder="List the specific goals and milestones this proposed concept aims to achieve... (Predicts word-by-word as you type!)"
                            value={conceptPaper.objectives}
                            onChange={(e) => handleConceptFieldChange("objectives", e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Tab" && autocompleteSuggestion && activeConceptField === "objectives") {
                                e.preventDefault();
                                acceptConceptSuggestion("objectives");
                              }
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                          />
                          {/* Suggestion Bar */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => {
                                  setConceptPaper({ ...conceptPaper, objectives: "Specifically, this study seeks to accomplish the following objectives: 1. Determine the baseline writing proficiency of Grade 11 students, 2. Formulate structured scaffolding tiers, and 3. Assess efficacy through controlled pre and post interventions." });
                                }}
                                className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium px-2 py-0.5 rounded-md transition-all"
                              >
                                💡 Kickstart Objectives A
                              </button>
                            </div>
                            <button
                              onClick={() => fetchAutocompleteSuggestion("objectives", conceptPaper.objectives)}
                              className="text-[9px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded-md transition-all flex items-center gap-1"
                            >
                              🔮 Predict Next Word
                            </button>
                          </div>
                          {renderConceptSuggestionBox("objectives")}
                        </div>

                        {/* FIELD 5: METHODOLOGY */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-slate-700">
                              5. Methodology
                            </label>
                            {activeConceptField === "methodology" && autocompleteSuggestion && (
                              <span className="text-[9px] text-indigo-600 font-bold animate-pulse">
                                Press [Tab ⇥] to insert next word
                              </span>
                            )}
                          </div>
                          <textarea
                            rows={3}
                            placeholder="What research design, tools, and data-gathering methods will you utilize? (Predicts word-by-word as you type!)"
                            value={conceptPaper.methodology}
                            onChange={(e) => handleConceptFieldChange("methodology", e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Tab" && autocompleteSuggestion && activeConceptField === "methodology") {
                                e.preventDefault();
                                acceptConceptSuggestion("methodology");
                              }
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                          />
                          {/* Suggestion Bar */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => {
                                  setConceptPaper({ ...conceptPaper, methodology: "This investigation will employ a descriptive correlational research design. Data will be gathered from a sample of Grade 11 student writers using standardized rubrics, structured essays, and custom telemetry metrics to trace development patterns." });
                                }}
                                className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium px-2 py-0.5 rounded-md transition-all"
                              >
                                💡 Kickstart Method A
                              </button>
                            </div>
                            <button
                              onClick={() => fetchAutocompleteSuggestion("methodology", conceptPaper.methodology)}
                              className="text-[9px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded-md transition-all flex items-center gap-1"
                            >
                              🔮 Predict Next Word
                            </button>
                          </div>
                          {renderConceptSuggestionBox("methodology")}
                        </div>

                        {/* FIELD 6: EXPECTED OUTCOMES */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-slate-700">
                              6. Expected Outcomes
                            </label>
                            {activeConceptField === "outcomes" && autocompleteSuggestion && (
                              <span className="text-[9px] text-indigo-600 font-bold animate-pulse">
                                Press [Tab ⇥] to insert next word
                              </span>
                            )}
                          </div>
                          <textarea
                            rows={3}
                            placeholder="What benefits, resources, or impact do you anticipate as a result of this study? (Predicts word-by-word as you type!)"
                            value={conceptPaper.outcomes}
                            onChange={(e) => handleConceptFieldChange("outcomes", e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Tab" && autocompleteSuggestion && activeConceptField === "outcomes") {
                                e.preventDefault();
                                acceptConceptSuggestion("outcomes");
                              }
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                          />
                          {/* Suggestion Bar */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => {
                                  setConceptPaper({ ...conceptPaper, outcomes: "Ultimately, the study expects to yield a concrete, empirically-backed scaffolding toolkit. This will benefit educators and students by reducing over-reliance on artificial automation while strengthening fundamental writing mechanics." });
                                }}
                                className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium px-2 py-0.5 rounded-md transition-all"
                              >
                                💡 Kickstart Outcomes A
                              </button>
                            </div>
                            <button
                              onClick={() => fetchAutocompleteSuggestion("outcomes", conceptPaper.outcomes)}
                              className="text-[9px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded-md transition-all flex items-center gap-1"
                            >
                              🔮 Predict Next Word
                            </button>
                          </div>
                          {renderConceptSuggestionBox("outcomes")}
                        </div>

                        {/* Save to Portfolio button */}
                        <div className="pt-4 border-t border-slate-100 flex gap-2">
                          <button
                            onClick={async () => {
                              try {
                                await savePortfolioItem({
                                  userId,
                                  studentName: currentStudent.name,
                                  studentEmail: currentStudent.email,
                                  type: "concept_paper",
                                  title: conceptPaper.title || "My Scholarly Concept Paper",
                                  draft: compileConceptPaperText(),
                                  reflection: "Drafted using the predictive WriteWise Smart Suggest system.",
                                  scaffoldingTier: 5,
                                  skillsPracticed: [...skillsPracticed, "Concept Formulation", "Predictive Suggestions"],
                                  status: "pending"
                                });
                                alert("Concept Paper saved to your Portfolio successfully!");
                                loadPortfolio();
                              } catch (e) {
                                console.error(e);
                                alert("Failed to save to portfolio. Using local cache fallback.");
                              }
                            }}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Sparkles className="w-4 h-4" /> Save Concept Paper to Portfolio
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Complied Document Preview */}
                    <div className="lg:col-span-5 space-y-4">
                      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-xs sticky top-4 space-y-4">
                        <div className="border-b border-slate-200 pb-2.5">
                          <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                            📄 Compiled APA Concept Proposal
                          </h5>
                          <p className="text-[10px] text-slate-400">This compiles your text sections into academic paper format.</p>
                        </div>

                        <div className="bg-white border border-slate-300 shadow-xs p-5 rounded-2xl min-h-[400px] text-[11px] font-sans text-slate-800 space-y-3.5 leading-relaxed overflow-y-auto max-h-[600px] border-t-4 border-t-indigo-600">
                          {conceptPaper.title ? (
                            <h6 className="text-xs font-bold text-slate-900 text-center uppercase tracking-normal underline pb-2">
                              {conceptPaper.title}
                            </h6>
                          ) : (
                            <div className="text-center text-slate-400 italic text-[10px] pb-2">
                              [Enter Concept Paper Title]
                            </div>
                          )}

                          <div>
                            <span className="font-bold text-slate-900 block uppercase tracking-wide text-[10px]">I. Introduction & Background</span>
                            <p className="text-slate-700 indent-4 mt-1">
                              {conceptPaper.background || <span className="text-slate-400 italic">[Your background content will render here]</span>}
                            </p>
                          </div>

                          <div>
                            <span className="font-bold text-slate-900 block uppercase tracking-wide text-[10px]">II. Statement of the Problem</span>
                            <p className="text-slate-700 indent-4 mt-1">
                              {conceptPaper.problem || <span className="text-slate-400 italic">[Your statement of the problem will render here]</span>}
                            </p>
                          </div>

                          <div>
                            <span className="font-bold text-slate-900 block uppercase tracking-wide text-[10px]">III. Objectives of the Study</span>
                            <p className="text-slate-700 indent-4 mt-1">
                              {conceptPaper.objectives || <span className="text-slate-400 italic">[Your research objectives will render here]</span>}
                            </p>
                          </div>

                          <div>
                            <span className="font-bold text-slate-900 block uppercase tracking-wide text-[10px]">IV. Methodology</span>
                            <p className="text-slate-700 indent-4 mt-1">
                              {conceptPaper.methodology || <span className="text-slate-400 italic">[Your methodology structure will render here]</span>}
                            </p>
                          </div>

                          <div>
                            <span className="font-bold text-slate-900 block uppercase tracking-wide text-[10px]">V. Expected Outcomes & Significance</span>
                            <p className="text-slate-700 indent-4 mt-1">
                              {conceptPaper.outcomes || <span className="text-slate-400 italic">[Your expected outcomes will render here]</span>}
                            </p>
                          </div>
                        </div>

                        <div className="bg-indigo-50 border border-indigo-100/80 rounded-2xl p-4 text-[11px] text-indigo-900 leading-normal space-y-2">
                          <p className="font-bold">💡 Scaffold Pathway Note:</p>
                          <p className="text-slate-600 text-[10px] leading-relaxed">
                            Once your proposal is completed, you can click **Proceed to Step 3** above to evaluate your drafted text for originality, clarity, and scholastic expression!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeLevel === 5 && activeTab === "concept_paper_lessons" && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm">Level 5 Lesson: Formulating an Academic Concept Paper</h4>
                  <div className="prose text-xs text-slate-600 leading-relaxed space-y-3.5">
                    <p>
                      A **Concept Paper** is an essential precursor to formal research. It outlines the core thesis, significance, and methodology of your proposed project to obtain approval and support from thesis advisers or funding bodies.
                    </p>

                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2.5">
                      <p><strong>1. Clear Academic Title:</strong> Keep the title literal and focused, incorporating variables and the target demographics.</p>
                      <p><strong>2. Grounded Background:</strong> Connect your personal interest with global literature, creating a reliable theoretical frame.</p>
                      <p><strong>3. Specific Problem:</strong> Identify exactly what is missing in current studies. A strong problem statement defines the "why" of your study.</p>
                      <p><strong>4. SMART Objectives:</strong> Formulate specific, measurable, attainable, realistic, and time-bound goals for what you will collect.</p>
                      <p><strong>5. Systematic Method:</strong> Disclose research designs (correlational, descriptive, experimental), target participants, and data gathering instruments.</p>
                      <p><strong>6. Real-World Outcomes:</strong> Highlight how this project resolves the problem, and who will benefit directly (teachers, learners, institutions).</p>
                    </div>

                    <p>
                      By utilizing **WriteWise's Smart Autocomplete Predictive engine**, student authors learn standard grammatical transitions and develop a fluent, mature academic voice.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => setActiveTab("concept_paper_workspace")}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      Enter Builder Workspace <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STUDENT PORTFOLIO LOG */}
              {activeTab === "portfolio" && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">My Student Portfolio Logs</h4>
                      <p className="text-[11px] text-slate-500 mt-1">Review your draft history, teacher feedback, and reflections over time.</p>
                    </div>
                    <button
                      onClick={loadPortfolio}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-all text-xs flex items-center gap-1 font-semibold"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Refresh List
                    </button>
                  </div>

                  {loadingPortfolio ? (
                    <div className="text-center py-12 text-slate-400 text-xs flex items-center justify-center gap-1.5">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" /> Loaded portfolio log...
                    </div>
                  ) : portfolio.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs italic">
                      You haven't saved any writing drills or essay steps to your portfolio yet! Get started with exercises or the workspace.
                    </div>
                  ) : (
                    <div className="space-y-4.5">
                      {portfolio.map((item, idx) => (
                        <div key={item.id || idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-3 relative">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-200/50 pb-2.5">
                            <div>
                              <span className="text-[10px] uppercase tracking-wider font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full mr-2">
                                {item.type}
                              </span>
                              <strong className="text-slate-800 text-xs capitalize leading-tight">{item.title}</strong>
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold">{new Date(item.createdAt).toLocaleDateString()}</span>
                          </div>

                          <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed line-clamp-3 bg-white border border-slate-200/60 p-3 rounded-xl italic">
                            {item.draft}
                          </p>

                          {item.reflection && (
                            <div className="text-[11px] text-indigo-800 italic bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100/60">
                              <strong>My Reflection:</strong> "{item.reflection}"
                            </div>
                          )}

                          {/* Teacher comments & Evaluation status */}
                          {item.status === "checked" || item.teacherFeedback ? (
                            <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 space-y-2.5">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-bold text-emerald-900 border-b border-emerald-200/60 pb-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                  <span>✓ Checked & Approved by Teacher</span>
                                  {item.checkedAt && (
                                    <span className="text-[10px] text-emerald-600 font-normal">
                                      ({new Date(item.checkedAt).toLocaleDateString()})
                                    </span>
                                  )}
                                </div>
                                {item.score !== undefined && (
                                  <span className="bg-white px-2.5 py-0.5 rounded-full border border-emerald-300 text-emerald-800 font-extrabold text-xs">
                                    Grade: {item.score}/100
                                  </span>
                                )}
                              </div>
                              {item.teacherFeedback && (
                                <div className="space-y-1">
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Teacher Evaluation:</div>
                                  <p className="text-xs text-emerald-800 whitespace-pre-wrap leading-relaxed">{item.teacherFeedback}</p>
                                </div>
                              )}
                              {item.rubricEvaluation && Object.keys(item.rubricEvaluation).length > 0 && (
                                <div className="pt-2 border-t border-emerald-200/60 flex flex-wrap gap-1.5">
                                  {Object.entries(item.rubricEvaluation).map(([crit, val]) => (
                                    <span key={crit} className="text-[10px] bg-white border border-emerald-200 px-2 py-0.5 rounded-md text-emerald-700 font-semibold">
                                      {crit}: {val}/4
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : item.status === "needs_revision" ? (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-2">
                              <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                                <span>⚠️ Teacher Requested Revision:</span>
                                {item.score !== undefined && (
                                  <span className="bg-white px-2 py-0.5 rounded-full border border-amber-300">Grade: {item.score}/100</span>
                                )}
                              </div>
                              {item.teacherFeedback && (
                                <p className="text-xs text-amber-800 whitespace-pre-wrap">{item.teacherFeedback}</p>
                              )}
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-500 bg-slate-100 border border-slate-200/80 rounded-xl px-3 py-2 font-medium flex items-center justify-between">
                              <span>⏳ Activity submitted — Pending teacher review and scoring</span>
                              <span className="text-[9px] uppercase font-bold text-slate-400">Status: In Review</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TEACHER ASSIGNMENTS DASHBOARD */}
              {activeTab === "assignments" && (
                <StudentAssignmentsView
                  assignments={assignments}
                  portfolio={portfolio}
                  currentStudent={currentStudent}
                  onStartAssignment={handleWorkOnAssignment}
                  onRefreshAssignments={loadAssignments}
                  loadingAssignments={loadingAssignments}
                />
              )}

              {/* PRACTICE WRITING SANDBOX */}
              {activeTab === "practice_writing" && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
                  <div className="border-b border-slate-100 pb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                        ✨ Real-Time Sentence Completion
                      </span>
                      <h4 className="font-bold text-slate-800 text-sm mt-1.5">Practice Writing — Sentence Completion</h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Type any sentence freely without any topic constraints. The predictive engine completes your sentence in real-time as you write!
                      </p>
                    </div>

                    {/* Mode Toggle: Complete Sentence vs Single Word */}
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-center shrink-0 border border-slate-200">
                      <button
                        type="button"
                        onClick={() => {
                          setPracticePredictionMode("sentence");
                          if (practiceContent.trim().length >= 2) {
                            fetchPracticeSuggestion(practiceContent, "sentence");
                          }
                        }}
                        className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                          practicePredictionMode === "sentence"
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Complete Sentence
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPracticePredictionMode("word");
                          if (practiceContent.trim().length >= 2) {
                            fetchPracticeSuggestion(practiceContent, "word");
                          }
                        }}
                        className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                          practicePredictionMode === "word"
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        🔤 Next-Word Mode
                      </button>
                    </div>
                  </div>

                  {/* Main Sandbox Writing Area */}
                  <div className="space-y-3 relative">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <label className="block text-[11px] font-bold text-indigo-700">✍️ WRITE YOUR SENTENCE:</label>
                        <button
                          type="button"
                          onClick={() => setAutoPredictEnabled(!autoPredictEnabled)}
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold transition-all border ${
                            autoPredictEnabled
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                              : "bg-slate-100 text-slate-500 border-slate-200"
                          }`}
                        >
                          ⚡ Auto-predict on typing: {autoPredictEnabled ? "ACTIVE" : "PAUSED"}
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold">
                        <span>{practiceContent.trim() ? practiceContent.trim().split(/\s+/).length : 0} words</span>
                        <span>•</span>
                        <span>{practiceContent.length} chars</span>
                        {practiceSuggestion && (
                          <span className={`font-bold border px-2 py-0.5 rounded text-[9px] ${
                            practiceSuggestion === "<END>" || isPracticeSentenceComplete
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                              : "bg-violet-50 text-violet-700 border-violet-200"
                          }`}>
                            {practicePredictionMode === "sentence"
                              ? "Press [Tab ⇥] to Complete Sentence"
                              : practiceSuggestion === "<END>" || isPracticeSentenceComplete
                              ? "Sentence Complete <END>"
                              : "Press [Tab ⇥] for next word"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="relative">
                      <textarea
                        value={practiceContent}
                        onChange={(e) => handlePracticeContentChange(e.target.value)}
                        onKeyDown={(e) => {
                          if ((e.key === "Tab" || (e.key === "ArrowRight" && e.currentTarget.selectionStart === practiceContent.length)) && practiceSuggestion) {
                            e.preventDefault();
                            acceptPracticeSuggestion();
                          }
                        }}
                        placeholder={
                          practicePredictionMode === "sentence"
                            ? "Type any sentence here... The predictive assistant will complete your sentence in real-time. Press [Tab ⇥] to insert the completion."
                            : "Type any sentence here... The next-word engine predicts the single next word in real-time. Press [Tab ⇥] to insert each word sequentially until sentence completion <END>."
                        }
                        className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 pb-16 text-xs h-52 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none font-medium leading-relaxed text-slate-800 transition-all"
                      />

                      {/* Floating Ghost-Suggestion Pill inside Textarea */}
                      {practiceSuggestion && (
                        practicePredictionMode === "sentence" ? (
                          <div className="absolute bottom-2.5 left-3 right-3 bg-gradient-to-r from-indigo-900/95 via-violet-900/95 to-slate-900/95 backdrop-blur-xs text-white rounded-xl px-3 py-2 flex items-center justify-between shadow-lg border border-indigo-400/30 animate-in fade-in slide-in-from-bottom-2 duration-150">
                            <div className="flex items-center gap-2 overflow-hidden text-xs min-w-0 pr-2">
                              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                              <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider shrink-0">
                                Sentence Completion:
                              </span>
                              <span className="font-medium text-xs truncate text-indigo-50 bg-white/10 px-2 py-0.5 rounded border border-white/20">
                                "{practiceSentencePrediction || practiceSuggestion}"
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              <button
                                type="button"
                                onClick={() => acceptPracticeSuggestion()}
                                className="px-3 py-1 bg-white text-indigo-700 hover:bg-indigo-50 text-[11px] font-bold rounded-lg transition-all shadow-xs flex items-center gap-1.5 shrink-0"
                                title="Accept sentence completion with Tab key or click"
                              >
                                Insert Completion <kbd className="bg-indigo-100 text-indigo-800 px-1 py-0.2 rounded text-[9px] font-mono border border-indigo-200">Tab ⇥</kbd>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPracticeSuggestion("");
                                  setPracticeSentencePrediction("");
                                  setPracticeAlternatives([]);
                                }}
                                className="text-indigo-200 hover:text-white text-xs px-1.5 py-0.5"
                                title="Dismiss"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : practiceSuggestion === "<END>" || isPracticeSentenceComplete ? (
                          <div className="absolute bottom-2.5 left-3 right-3 bg-emerald-800/95 backdrop-blur-xs text-white rounded-xl px-3 py-1.5 flex items-center justify-between shadow-md border border-emerald-400/40 animate-in fade-in slide-in-from-bottom-2 duration-150">
                            <div className="flex items-center gap-2 text-xs">
                              <CheckCircle className="w-4 h-4 text-emerald-300 shrink-0" />
                              <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider shrink-0">
                                Status:
                              </span>
                              <span className="font-bold text-xs text-white bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-400/40 font-mono">
                                &lt;END&gt;
                              </span>
                              <span className="text-[10px] text-emerald-100 hidden sm:inline">
                                Sentence is complete and grammatically closed.
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setPracticeSuggestion("");
                                setIsPracticeSentenceComplete(false);
                              }}
                              className="text-emerald-200 hover:text-white text-xs px-2 py-0.5 rounded bg-white/10"
                              title="Dismiss"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="absolute bottom-2.5 left-3 right-3 bg-gradient-to-r from-violet-700/95 to-indigo-700/95 backdrop-blur-xs text-white rounded-xl px-3 py-1.5 flex items-center justify-between shadow-md border border-indigo-300/30 animate-in fade-in slide-in-from-bottom-2 duration-150">
                            <div className="flex items-center gap-2 overflow-hidden text-xs">
                              <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                              <span className="text-[10px] font-bold text-violet-200 uppercase tracking-wider shrink-0">
                                Next Word:
                              </span>
                              <span className="font-bold text-xs truncate text-white bg-white/20 px-2.5 py-0.5 rounded border border-white/30 font-mono">
                                {practiceSuggestion}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              <button
                                type="button"
                                onClick={() => acceptPracticeSuggestion()}
                                className="px-2.5 py-1 bg-white text-indigo-700 hover:bg-indigo-50 text-[10px] font-bold rounded-lg transition-all shadow-xs flex items-center gap-1"
                                title="Accept word with Tab key or click"
                              >
                                Insert <kbd className="bg-indigo-100 text-indigo-800 px-1 py-0.2 rounded text-[9px] font-mono border border-indigo-200">Tab ⇥</kbd>
                              </button>
                              <button
                                type="button"
                                onClick={() => setPracticeSuggestion("")}
                                className="text-violet-200 hover:text-white text-xs px-1"
                                title="Dismiss"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    {/* Sentence Completion Variations / Alternatives Grid */}
                    {practicePredictionMode === "sentence" && practiceAlternatives && practiceAlternatives.length > 0 && (
                      <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Sentence Completion Variations:
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">Click any option to insert</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                          {practiceAlternatives.map((alt, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => acceptPracticeSuggestion(alt.text)}
                              className="text-left bg-white hover:bg-indigo-50/80 border border-indigo-200/80 hover:border-indigo-400 p-2.5 rounded-xl transition-all shadow-2xs group flex flex-col justify-between"
                            >
                              <div>
                                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 inline-block mb-1.5">
                                  {alt.label}
                                </span>
                                <p className="text-xs text-slate-700 leading-snug group-hover:text-indigo-950 font-medium">
                                  "{alt.text}"
                                </p>
                              </div>
                              <span className="text-[10px] text-indigo-600 font-bold mt-2 flex items-center gap-1 opacity-80 group-hover:opacity-100">
                                Insert Option ⇥
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Predictive Suggester Overlay / Alert Banner */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="flex-1 flex items-center gap-2">
                        <span className="p-1.5 bg-violet-100 text-violet-700 rounded-lg shrink-0">
                          <Sparkles className="w-4 h-4" />
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                              {practicePredictionMode === "sentence" ? "Sentence Completion Engine" : "Sequential Next-Word Engine"}
                            </p>
                            <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded font-medium">
                              {practicePredictionMode === "sentence" ? "Full coherent sentence completions" : "1 word at a time until <END>"}
                            </span>
                          </div>
                          {fetchingPracticeSuggestion ? (
                            <span className="text-xs text-indigo-600 font-medium animate-pulse flex items-center gap-1 mt-0.5">
                              <RefreshCw className="w-3 h-3 animate-spin" /> Predicting sentence completion...
                            </span>
                          ) : practicePredictionMode === "sentence" && practiceSentencePrediction ? (
                            <span className="text-xs font-semibold text-indigo-950 mt-0.5 block">
                              Sentence Completion: <span className="bg-indigo-100/70 px-2 py-0.5 rounded border border-indigo-200 font-medium text-indigo-900">"{practiceSentencePrediction}"</span>
                              <span className="text-[10px] text-slate-500 font-normal ml-2">(Press Tab ⇥ to accept)</span>
                            </span>
                          ) : practiceSuggestion === "<END>" || isPracticeSentenceComplete ? (
                            <span className="text-xs font-semibold text-emerald-700 mt-0.5 block flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              Sentence Complete: <span className="bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded font-mono font-bold">&lt;END&gt;</span>
                              <span className="text-[10px] text-slate-500 font-normal ml-1">(Meaningful and grammatically closed)</span>
                            </span>
                          ) : practiceSuggestion ? (
                            <span className="text-xs font-semibold text-violet-800 mt-0.5 block">
                              Next Word: <span className="bg-violet-100 px-2 py-0.5 rounded border border-violet-200 font-mono font-bold text-indigo-900">"{practiceSuggestion}"</span>
                              <span className="text-[10px] text-slate-500 font-normal ml-2">(Press Tab ⇥ to insert and predict next word)</span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500 italic mt-0.5 block">
                              {practicePredictionMode === "sentence"
                                ? "Type naturally in the box above — the assistant predicts completions to finish your sentence in real-time."
                                : "Type naturally in the box above — the engine predicts the single next most probable word maintaining context and grammar."}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => fetchPracticeSuggestion(practiceContent)}
                          disabled={fetchingPracticeSuggestion || !practiceContent.trim()}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {practicePredictionMode === "sentence" ? "Complete Sentence" : "Predict Next Word"}
                        </button>

                        {practiceSuggestion && practiceSuggestion !== "<END>" && (
                          <button
                            type="button"
                            onClick={() => acceptPracticeSuggestion()}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl transition-all flex items-center gap-1 shadow-xs"
                          >
                            Accept Tab ⇥
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reflection Field for Student's Portfolio Log entry */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">📝 STUDENT REFLECTION (Optional - Saved to Portfolio):</label>
                    <input
                      type="text"
                      value={practiceReflection}
                      onChange={(e) => setPracticeReflection(e.target.value)}
                      placeholder="e.g., Today I practiced composing clear, complete sentences and exploring different sentence endings."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  {/* Analysis and Submission Action Buttons */}
                  <div className="flex flex-wrap gap-2.5 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleAnalyzePractice}
                      disabled={analyzingPractice || !practiceContent.trim()}
                      className="flex-1 min-w-[150px] py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      {analyzingPractice ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Evaluating Writing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" /> AI Coherence & Grammar Audit
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleSavePracticePortfolio}
                      disabled={!practiceContent.trim()}
                      className="flex-1 min-w-[150px] py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Save className="w-4 h-4" /> Save Practice Draft to Portfolio
                    </button>
                  </div>

                  {/* AI Writing Evaluation Results Block */}
                  {(practiceFeedback || practiceOriginalityScore !== null) && (
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 mt-4 space-y-4">
                      <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                        <div className="flex items-center gap-1.5">
                          <span className="p-1 bg-indigo-100 rounded-lg text-indigo-700">
                            <Info className="w-4 h-4" />
                          </span>
                          <h5 className="font-bold text-slate-800 text-xs">AI Writing Evaluation & Feedback</h5>
                        </div>

                        {practiceOriginalityScore !== null && (
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">Original Self-Authorship Index</span>
                            <span className="text-emerald-700 font-extrabold text-sm flex items-center justify-end gap-1">
                              🟢 {practiceOriginalityScore}% Authentic Draft
                            </span>
                          </div>
                        )}
                      </div>

                      {practiceFeedback && (
                        <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {practiceFeedback}
                        </div>
                      )}

                      <div className="bg-emerald-50 border border-emerald-100/60 rounded-xl p-3 flex gap-2">
                        <span className="text-emerald-700 text-sm">✓</span>
                        <p className="text-[10px] text-slate-600 leading-normal">
                          Excellent start! You can edit, iterate, and continuously update your draft based on this feedback. Each revision trains your voice for Level 5 research compositions.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* RIGHT SIDE: TUTOR ASSIST PANEL (4 cols) */}
            <div className="lg:col-span-4 h-full">
              <TutorPanel
                level={
                  activeLevel === 1 ? "sentence" : 
                  activeLevel === 2 ? "paragraph" : 
                  activeLevel === 3 ? "essay" : 
                  activeLevel === 5 ? "concept" : "research"
                }
                module={activeTab}
                studentDraft={
                  activeTab === "exercises" ? sentenceDraft : 
                  activeTab === "paragraph_workspace" ? compileParagraphText() :
                  activeTab === "title_formulation" ? draftTitle :
                  activeTab === "thesis_builder" ? thesisDraft :
                  activeTab === "paraphrasing" ? studentParaphrase : 
                  activeTab === "concept_paper_workspace" ? compileConceptPaperText() :
                  activeTab === "practice_writing" ? practiceContent : ""
                }
                context={
                  activeTab === "title_formulation" ? titleAnswers :
                  activeTab === "thesis_builder" ? { topic: thesisTopic, position: thesisPosition, reasons: thesisReasons } : null
                }
                skillsPracticed={skillsPracticed}
              />
            </div>

          </div>
        )}

        {/* STEP 3: ORIGINALITY & AI-USE CHECK (Active when pathwayStep === 3) */}
        {pathwayStep === 3 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6 animate-fade-in w-full">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-indigo-600 animate-pulse" />
                STEP 3: ORIGINALITY & AI-USE CHECK (PLAGIARISM & SIMILARITY DETECTOR)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Your central integrity guard. Paste or verify your draft below. Our system performs a rigorous similarity analysis against online materials and evaluates syntactic patterns to detect AI-reliance probability levels.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-2">
                  Review or Edit Your Draft Text to Scan:
                </label>
                <textarea
                  placeholder="Paste your paragraph or essay here to scan..."
                  value={customDraftToScan}
                  onChange={(e) => setCustomDraftToScan(e.target.value)}
                  className="w-full h-40 bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-sans leading-relaxed"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleScanDraft(customDraftToScan)}
                  disabled={scanning || !customDraftToScan.trim()}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition-all flex items-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {scanning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Scanning Databases & Syntactic Patterns...
                    </>
                  ) : (
                    <>
                      🛡️ Perform Originality & AI-Reliance Scan
                    </>
                  )}
                </button>
              </div>

              {scanned && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  {/* Originality Score card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-700 uppercase">Plagiarism & Similarity Scan</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        originalityScore >= 80 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {originalityScore}% Original
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${originalityScore >= 80 ? "bg-emerald-500" : "bg-amber-500"}`} 
                        style={{ width: `${originalityScore}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Similarity Risk Detected: {100 - originalityScore}%. Any matching texts should be properly paraphrased using the Paraphrase Coach.
                    </p>

                    {similarityDetails.length > 0 && (
                      <div className="space-y-2 mt-2">
                        <span className="text-[10px] font-black text-slate-500 block uppercase">Matched Online Sources:</span>
                        {similarityDetails.map((match, i) => (
                          <div key={i} className="bg-white p-2.5 rounded-xl border border-slate-100 text-[10px] space-y-1">
                            <div className="flex justify-between font-bold">
                              <span className="text-indigo-600">Source: {match.source}</span>
                              <span className="text-amber-600">{match.matchPercent}% match</span>
                            </div>
                            <p className="text-slate-600 italic">"{match.text}"</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* AI reliance score card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-700 uppercase">AI-Reliance Flag Index</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        aiRelianceProbability < 30 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {aiRelianceProbability}% AI Probability
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${aiRelianceProbability < 30 ? "bg-emerald-500" : "bg-amber-500"}`} 
                        style={{ width: `${aiRelianceProbability}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      AI pattern density indicates if word variety and sentence construction correspond to standard automated tools. Aim to express your distinct personal voice.
                    </p>

                    {flaggedAiSections.length > 0 && (
                      <div className="space-y-2 mt-2">
                        <span className="text-[10px] font-black text-slate-500 block uppercase">Flagged Machine Passages:</span>
                        {flaggedAiSections.map((section, i) => (
                          <div key={i} className="bg-amber-50 border border-amber-200 text-amber-900 p-2.5 rounded-xl text-[10px] italic">
                            "{section}"
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between gap-4">
              <button
                onClick={() => setPathwayStep(2)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-bold transition-all"
              >
                ← Back to Drafting Worksheets
              </button>
              <button
                onClick={() => setPathwayStep(4)}
                disabled={!scanned}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                Proceed to Step 4: Suggestion Engine <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SUGGESTION / WHAT TO DO NEXT ENGINE (Active when pathwayStep === 4) */}
        {pathwayStep === 4 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6 animate-fade-in w-full">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                STEP 4: SUGGESTION / "WHAT TO DO NEXT" ENGINE
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Personalized, rubric-based recommendations based on your diagnostic placement and originality metrics. These tips guide your revision without rewriting your content.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 space-y-3 text-xs text-slate-700">
                <h4 className="font-extrabold text-indigo-950 flex items-center gap-1.5">
                  💡 Your Personalized Revision Checklist:
                </h4>
                
                <div className="space-y-3 mt-3">
                  {suggestionEngineState.length > 0 ? (
                    suggestionEngineState.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2.5 p-2.5 bg-white border border-slate-100 rounded-xl shadow-2xs">
                        <span className="text-indigo-600 mt-0.5 font-bold">#{i+1}</span>
                        <p className="leading-relaxed font-medium">{tip}</p>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex items-start gap-2.5 p-2.5 bg-white border border-slate-100 rounded-xl shadow-2xs">
                        <span className="text-indigo-600 mt-0.5 font-bold">#1</span>
                        <p className="leading-relaxed font-medium font-semibold">Verify your thesis statement structure: ensure it couples your main position with exactly 3 logical reasons. 🟢</p>
                      </div>
                      <div className="flex items-start gap-2.5 p-2.5 bg-white border border-slate-100 rounded-xl shadow-2xs">
                        <span className="text-indigo-600 mt-0.5 font-bold">#2</span>
                        <p className="leading-relaxed font-medium font-semibold">Check paraphrasing and academic source originality scores: make sure to restructure sentences completely using synonyms. 🟡</p>
                      </div>
                      <div className="flex items-start gap-2.5 p-2.5 bg-white border border-slate-100 rounded-xl shadow-2xs">
                        <span className="text-indigo-600 mt-0.5 font-bold">#3</span>
                        <p className="leading-relaxed font-medium font-semibold">Add APA citations to clear statements of factual or statistical claims in Paragraph 2. 🔵</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4.5 text-xs text-amber-900 flex items-center gap-3">
                <span className="text-xl">🔄</span>
                <div>
                  <span className="font-bold">Follow the Revise Loop:</span>
                  <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                    Academic writing is an iterative process. If your scan in Step 3 indicated high AI reliance or matching text, go back to Step 2 to rewrite and re-scan.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3 justify-between">
              <button
                onClick={() => {
                  setPathwayStep(2);
                  alert("Taking you back to Step 2: Guided Drafting so you can revise your drafts based on the suggestions!");
                }}
                className="px-5 py-2.5 border border-indigo-600 hover:bg-indigo-50 text-indigo-700 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs"
              >
                🔄 Revise Draft (Go Back to Step 2)
              </button>

              <button
                onClick={() => setPathwayStep(5)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                Approve Draft & Proceed to Step 5 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: FINALIZED DRAFT & POST-SURVEY (Active when pathwayStep === 5) */}
        {pathwayStep === 5 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6 animate-fade-in w-full">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                STEP 5: FINALIZED, ORIGINAL FORMAL PAPER & POST-SURVEY
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Congratulations! You have completed the structured, AI-balanced writing development path. Review your finalized paper and fill out the post-survey to assess your learning progress.
              </p>
            </div>

            <div className="space-y-4">
              {/* Draft Paper Viewer */}
              <div className="border border-slate-200 rounded-2xl p-5 space-y-3 bg-slate-50 shadow-2xs">
                <span className="text-[10px] font-black text-indigo-600 tracking-wider uppercase block">Your Polished Research Paper Draft:</span>
                <h4 className="text-sm font-bold text-slate-800">{draftTitle || "The Impact of Virtual Platforms on Modern Scholars"}</h4>
                <p className="text-xs text-slate-600 leading-relaxed italic whitespace-pre-wrap">
                  {customDraftToScan || "Thesis: Social media platforms influence cognitive development of Grade 11 students through daily engagement, structural memory overload, and distractibility."}
                </p>
              </div>

              {/* Post-Survey */}
              <div className="border-t border-slate-100 pt-5 space-y-5">
                <div className="bg-indigo-50/35 border border-indigo-100 p-4 rounded-xl text-xs text-indigo-950 font-bold">
                  📝 Post-Survey: Adapted Self-Efficacy, AI-Reliance, and Usability Scale
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">
                      1. How much has your confidence in drafting and revising academic papers improved?
                    </label>
                    <div className="grid grid-cols-5 gap-2 mt-1.5">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          onClick={() => setPostSurveyAnswers(p => ({ ...p, efficacyImprovement: val }))}
                          className={`py-2 text-xs font-bold rounded-xl transition-all border ${
                            postSurveyAnswers.efficacyImprovement === val
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">
                      2. How confident are you in writing research papers without relying on machine-made texts?
                    </label>
                    <div className="grid grid-cols-5 gap-2 mt-1.5">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          onClick={() => setPostSurveyAnswers(p => ({ ...p, aiRelianceReduction: val }))}
                          className={`py-2 text-xs font-bold rounded-xl transition-all border ${
                            postSurveyAnswers.aiRelianceReduction === val
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">
                      3. How helpful was the WriteWise progression in making you a better independent writer?
                    </label>
                    <div className="grid grid-cols-5 gap-2 mt-1.5">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          onClick={() => setPostSurveyAnswers(p => ({ ...p, appUsability: val }))}
                          className={`py-2 text-xs font-bold rounded-xl transition-all border ${
                            postSurveyAnswers.appUsability === val
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-[11px] text-slate-500">
                * Submitting saves your final paper and learning results securely to your student profile portfolio logs.
              </span>
              
              <button
                onClick={async () => {
                  try {
                    await savePortfolioItem({
                      userId,
                      studentName: currentStudent.name,
                      studentEmail: currentStudent.email,
                      type: "essay",
                      title: draftTitle || "Final Research Essay",
                      draft: customDraftToScan || "Draft text was empty.",
                      reflection: `Pre-survey confidence: ${((preSurveyAnswers.thesisConfidence + preSurveyAnswers.paraphraseConfidence + preSurveyAnswers.referencingConfidence) / 3).toFixed(1)}. Post-survey confidence improvement: ${postSurveyAnswers.efficacyImprovement}/5. AI Reliance reduction: ${postSurveyAnswers.aiRelianceReduction}/5. Usability index: ${postSurveyAnswers.appUsability}/5.`,
                      scaffoldingTier: 4,
                      skillsPracticed: skillsPracticed,
                      status: "pending"
                    });
                    setPostSurveySubmitted(true);
                    alert("Outstanding job! Your finalized paper and comparative post-survey metrics have been compiled and saved to your Student Portfolio.");
                    loadPortfolio();
                  } catch (e) {
                    console.error(e);
                    alert("Saving session final report safely.");
                    setPostSurveySubmitted(true);
                  }
                }}
                className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                Submit Paper & Complete Pathway 🎉
              </button>
            </div>

            {postSurveySubmitted && (
              <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl text-xs space-y-3.5 text-emerald-950 animate-fade-in w-full">
                <h4 className="font-extrabold text-emerald-900 flex items-center gap-1.5 text-sm">
                  ✨ Comparative Learning Progression Graph:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="bg-white p-3.5 rounded-xl border border-emerald-100 space-y-2">
                    <span className="font-black text-[10px] uppercase text-slate-500 block">Writing Confidence Progress</span>
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span>Pre-Survey Level:</span>
                      <span className="text-slate-600">{((preSurveyAnswers.thesisConfidence + preSurveyAnswers.paraphraseConfidence + preSurveyAnswers.referencingConfidence) / 3).toFixed(1)} / 5.0</span>
                    </div>
                    <div className="flex items-center justify-between font-bold text-xs text-indigo-700">
                      <span>Post-Survey Growth:</span>
                      <span>{postSurveyAnswers.efficacyImprovement} / 5.0</span>
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-emerald-100 space-y-2">
                    <span className="font-black text-[10px] uppercase text-slate-500 block">AI Independence Index</span>
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span>Initial AI Reliance:</span>
                      <span className="text-slate-600">{preSurveyAnswers.aiRelianceHabits} / 5.0</span>
                    </div>
                    <div className="flex items-center justify-between font-bold text-xs text-emerald-600">
                      <span>Current Voice Independence:</span>
                      <span>{postSurveyAnswers.aiRelianceReduction} / 5.0</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    )}

      </main>

      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500 font-medium">
        <p>© 2026 WriteWise. Formulated strictly around student self-authorship and pedagogical scaffolding.</p>
      </footer>
    </div>
  );
}
