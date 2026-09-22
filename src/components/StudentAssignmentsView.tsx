import React, { useState } from "react";
import { 
  FileText, Calendar, Clock, CheckCircle2, AlertCircle, Search, 
  Filter, ChevronRight, ArrowRight, BookOpen, Layers, Award, 
  Sparkles, RefreshCw, Eye, X, Check, Pin, MessageSquare, UserCheck
} from "lucide-react";
import { Assignment, RUBRICS } from "../types";
import { PortfolioItem } from "../firebase";

export interface StudentAssignmentsViewProps {
  assignments: Assignment[];
  portfolio: PortfolioItem[];
  currentStudent: { id: string; name: string; email: string; class: string };
  onStartAssignment: (assignment: Assignment) => void;
  onRefreshAssignments: () => void;
  loadingAssignments: boolean;
}

export default function StudentAssignmentsView({
  assignments,
  portfolio,
  currentStudent,
  onStartAssignment,
  onRefreshAssignments,
  loadingAssignments
}: StudentAssignmentsViewProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "submitted" | "checked">("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssignmentModal, setSelectedAssignmentModal] = useState<Assignment | null>(null);
  const [expandedDraftId, setExpandedDraftId] = useState<string | null>(null);

  // Match assignment to student's portfolio submission
  const getSubmission = (as: Assignment): PortfolioItem | undefined => {
    if (!portfolio || portfolio.length === 0) return undefined;
    
    // Direct title matching
    const matchByTitle = portfolio.find(p => {
      const pTitle = (p.title || "").toLowerCase();
      const asTitle = (as.title || "").toLowerCase();
      return pTitle.includes(asTitle.slice(0, 14)) || asTitle.includes(pTitle.slice(0, 14));
    });
    if (matchByTitle) return matchByTitle;

    // Fallback matching by writing level
    return portfolio.find(p => p.type === as.level);
  };

  // Status counters
  const totalCount = assignments.length;
  const pendingCount = assignments.filter(a => !getSubmission(a)).length;
  const submittedCount = assignments.filter(a => {
    const s = getSubmission(a);
    return s && s.status !== "checked" && !s.teacherFeedback;
  }).length;
  const checkedCount = assignments.filter(a => {
    const s = getSubmission(a);
    return s && (s.status === "checked" || !!s.teacherFeedback || s.score !== undefined);
  }).length;

  // Filtered list
  const filteredAssignments = assignments.filter(as => {
    const sub = getSubmission(as);
    const isChecked = sub && (sub.status === "checked" || !!sub.teacherFeedback || sub.score !== undefined);
    const isSubmitted = sub && !isChecked;
    const isPending = !sub;

    if (statusFilter === "pending" && !isPending) return false;
    if (statusFilter === "submitted" && !isSubmitted) return false;
    if (statusFilter === "checked" && !isChecked) return false;

    if (levelFilter !== "all" && as.level !== levelFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (as.title || "").toLowerCase().includes(q);
      const matchDesc = (as.description || "").toLowerCase().includes(q);
      const matchLevel = (as.level || "").toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLevel) return false;
    }

    return true;
  });

  // Helper for level badges
  const getLevelBadge = (level: string) => {
    switch (level) {
      case "sentence":
        return { label: "Level 1 • Sentence", bg: "bg-blue-50 text-blue-700 border-blue-200" };
      case "paragraph":
        return { label: "Level 2 • Paragraph", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "essay":
        return { label: "Level 3 • Essay", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" };
      case "research":
        return { label: "Level 4 • Research & APA", bg: "bg-purple-50 text-purple-700 border-purple-200" };
      case "concept_paper":
        return { label: "Level 5 • Concept Paper", bg: "bg-amber-50 text-amber-800 border-amber-200" };
      default:
        return { label: "Writing Task", bg: "bg-slate-100 text-slate-700 border-slate-200" };
    }
  };

  const getTierBadge = (tier: number) => {
    switch (tier) {
      case 1:
        return { label: "Tier 1: Heavy Scaffolding", bg: "bg-rose-50 text-rose-700 border-rose-200" };
      case 2:
        return { label: "Tier 2: Worked Examples", bg: "bg-amber-50 text-amber-700 border-amber-200" };
      case 3:
        return { label: "Tier 3: Moderate Support", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" };
      default:
        return { label: "Tier 4: Independent Drafting", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    }
  };

  // Helper for rubric focus keywords based on level
  const getRubricFocusItems = (level: string): string[] => {
    switch (level) {
      case "sentence":
        return ["Subject-Verb Agreement", "Sentence Boundary", "Conciseness", "Punctuation"];
      case "paragraph":
        return ["Topic Sentence", "Supporting Evidence", "Explanation", "Cohesive Transitions"];
      case "essay":
        return ["Clear Thesis Statement", "Argument Progression", "Counterargument & Rebuttal", "Cohesive Conclusion"];
      case "research":
        return ["APA 7th Referencing", "Synthesized Paraphrasing", "In-Text Citations", "Academic Objectivity"];
      case "concept_paper":
        return ["Project Rationale", "Measurable Objectives", "Methodological Design", "Expected Impact"];
      default:
        return ["Clarity & Focus", "Grammar & Structure", "Depth of Analysis"];
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6" id="student_assignments_container">
      {/* 1. HEADER SECTION */}
      <div className="border-b border-slate-100 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                Teacher Curriculum Assignments
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Instructor: <strong className="text-slate-700 font-semibold">Mr. Escrina (Writing Instructor)</strong> • Assigned Class: <span className="text-indigo-600 font-bold">{currentStudent.class}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            onClick={onRefreshAssignments}
            disabled={loadingAssignments}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-slate-200"
            title="Reload latest assignments from instructor"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAssignments ? "animate-spin text-indigo-600" : ""}`} />
            <span>{loadingAssignments ? "Syncing..." : "Refresh Tasks"}</span>
          </button>
        </div>
      </div>

      {/* 2. SUMMARY METRICS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Tasks</div>
          <div className="text-xl font-black text-slate-800 mt-1">{totalCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">In current curriculum</div>
        </div>

        <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3.5">
          <div className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">To Do (Pending)</div>
          <div className="text-xl font-black text-amber-800 mt-1">{pendingCount}</div>
          <div className="text-[10px] text-amber-600/90 mt-0.5">Requires your submission</div>
        </div>

        <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-3.5">
          <div className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">Submitted</div>
          <div className="text-xl font-black text-blue-800 mt-1">{submittedCount}</div>
          <div className="text-[10px] text-blue-600/90 mt-0.5">Under teacher review</div>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3.5">
          <div className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Checked & Graded</div>
          <div className="text-xl font-black text-emerald-800 mt-1">{checkedCount}</div>
          <div className="text-[10px] text-emerald-600/90 mt-0.5">Feedback ready to read</div>
        </div>
      </div>

      {/* 3. SEARCH & FILTERS CONTROLS */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shrink-0 overflow-x-auto">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === "all" ? "bg-indigo-600 text-white shadow-3xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Tasks ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === "pending" ? "bg-indigo-600 text-white shadow-3xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              To Do ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter("submitted")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === "submitted" ? "bg-indigo-600 text-white shadow-3xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Submitted ({submittedCount})
            </button>
            <button
              onClick={() => setStatusFilter("checked")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === "checked" ? "bg-indigo-600 text-white shadow-3xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Graded ({checkedCount})
            </button>
          </div>

          {/* Level Filter Dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none cursor-pointer pr-7 shadow-3xs"
              >
                <option value="all">All Writing Levels</option>
                <option value="sentence">Level 1: Sentence</option>
                <option value="paragraph">Level 2: Paragraph</option>
                <option value="essay">Level 3: Essay</option>
                <option value="research">Level 4: Research & Citations</option>
                <option value="concept_paper">Level 5: Concept Paper</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search assignments by title, keywords, topic, or instructions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-1 focus:ring-indigo-500 shadow-3xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. ASSIGNMENTS LIST */}
      {filteredAssignments.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl p-8 space-y-2">
          <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
          <div className="font-bold text-slate-700 text-sm">No assignments found matching your filter</div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search keywords or switching your status filter to "All Tasks".
          </p>
          <button
            onClick={() => {
              setStatusFilter("all");
              setLevelFilter("all");
              setSearchQuery("");
            }}
            className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((as) => {
            const sub = getSubmission(as);
            const isChecked = sub && (sub.status === "checked" || !!sub.teacherFeedback || sub.score !== undefined);
            const isSubmitted = sub && !isChecked;
            const isPending = !sub;

            const lvlBadge = getLevelBadge(as.level);
            const tierBadge = getTierBadge(as.scaffoldingTier);
            const rubricItems = getRubricFocusItems(as.level);

            return (
              <div
                key={as.id}
                className={`border rounded-2xl p-5 transition-all shadow-3xs space-y-4 ${
                  isChecked 
                    ? "border-emerald-200 bg-gradient-to-br from-emerald-50/20 via-white to-white" 
                    : isSubmitted
                      ? "border-blue-200 bg-gradient-to-br from-blue-50/20 via-white to-white"
                      : "border-slate-200 bg-white hover:border-indigo-200"
                }`}
              >
                {/* Top Row: Badges, Due Date & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg border uppercase tracking-wider ${lvlBadge.bg}`}>
                      {lvlBadge.label}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${tierBadge.bg}`}>
                      {tierBadge.label}
                    </span>
                    {as.targetWords && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                        🎯 Target: {as.targetWords} words
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      Due: {as.dueDate}
                    </span>
                  </div>
                </div>

                {/* Assignment Title & Instructor Info */}
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-base">
                    {as.title}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Assigned by: <strong className="text-slate-700 font-semibold">{as.assignedBy || "Mr. Escrina"}</strong> • Assigned to: <span className="font-semibold text-slate-700">{as.assignedClass || "Section Silver"}</span>
                  </p>
                </div>

                {/* Teacher Instructions Box */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-700 leading-relaxed space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Teacher's Assignment Prompt & Expectations:</span>
                  </div>
                  <p className="text-slate-600 whitespace-pre-wrap pl-5">
                    {as.description}
                  </p>
                </div>

                {/* Rubric Focus Tags */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                    Graded Rubric Focus:
                  </span>
                  {rubricItems.map((rf, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-semibold bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md"
                    >
                      ✓ {rf}
                    </span>
                  ))}
                </div>

                {/* 5. SUBMISSION & TEACHER EVALUATION STATUS PANEL */}
                {isChecked && sub && (
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/70 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="p-1 bg-emerald-600 text-white rounded-lg">
                          <CheckCircle2 className="w-4 h-4" />
                        </span>
                        <div>
                          <div className="font-extrabold text-xs text-emerald-950 flex items-center gap-2">
                            Checked & Graded by Teacher
                          </div>
                          <div className="text-[10px] text-emerald-800">
                            Evaluated by {sub.checkedBy || "Mr. Escrina"} on {sub.checkedAt ? new Date(sub.checkedAt).toLocaleDateString() : "Recent"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="bg-white border border-emerald-300 rounded-xl px-3 py-1 shadow-3xs flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-black text-emerald-800">
                            Score: {sub.score ?? 90}/100
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Teacher's Written Feedback Callout */}
                    <div className="bg-white border border-emerald-200 rounded-xl p-3.5 space-y-1.5 shadow-3xs">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-900">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Teacher's Written Feedback:</span>
                      </div>
                      <p className="text-xs text-slate-800 italic leading-relaxed pl-5 whitespace-pre-wrap">
                        "{sub.teacherFeedback || "Excellent academic voice and structure! Your arguments are well substantiated."}"
                      </p>
                    </div>

                    {/* Rubric Breakdown if available */}
                    {sub.rubricEvaluation && Object.keys(sub.rubricEvaluation).length > 0 && (
                      <div className="bg-white/80 border border-emerald-200/60 rounded-xl p-3 space-y-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                          Criterion Scoring Breakdown:
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {Object.entries(sub.rubricEvaluation).map(([key, val]) => (
                            <div key={key} className="bg-emerald-50/50 p-2 rounded-lg border border-emerald-100 text-center">
                              <div className="text-[9px] text-slate-500 font-bold uppercase truncate">{key}</div>
                              <div className="text-xs font-black text-emerald-800 mt-0.5">{String(val)} / 4 pts</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Submitted text preview toggle */}
                    <div className="pt-1 flex items-center justify-between">
                      <button
                        onClick={() => setExpandedDraftId(expandedDraftId === as.id ? null : as.id)}
                        className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {expandedDraftId === as.id ? "Hide My Submitted Draft" : "View My Submitted Draft"}
                      </button>

                      <button
                        onClick={() => onStartAssignment(as)}
                        className="px-3 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-lg text-xs transition-all shadow-3xs"
                      >
                        Revise in Workspace
                      </button>
                    </div>

                    {expandedDraftId === as.id && (
                      <div className="bg-white border border-emerald-200 rounded-xl p-3.5 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto">
                        <div className="font-bold text-slate-800 mb-1">Your Submitted Draft:</div>
                        {sub.draft}
                      </div>
                    )}
                  </div>
                )}

                {isSubmitted && sub && (
                  <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1 bg-blue-600 text-white rounded-lg">
                          <Clock className="w-4 h-4" />
                        </span>
                        <div>
                          <div className="font-extrabold text-xs text-blue-950">
                            Activity Submitted — Pending Teacher Review
                          </div>
                          <div className="text-[10px] text-blue-800">
                            Submitted on {new Date(sub.createdAt).toLocaleDateString()} • In queue for teacher check
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full border border-blue-200">
                        Status: In Review
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-normal">
                      Your draft has been submitted to your teacher's grading feed. Once evaluated, your score, rubric points, and instructional suggestions will appear right here.
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => setExpandedDraftId(expandedDraftId === as.id ? null : as.id)}
                        className="text-[11px] font-bold text-blue-800 hover:text-blue-950 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {expandedDraftId === as.id ? "Hide Submitted Draft" : "View Submitted Draft"}
                      </button>

                      <button
                        onClick={() => onStartAssignment(as)}
                        className="px-3 py-1 bg-white hover:bg-blue-100 text-blue-800 border border-blue-300 font-bold rounded-lg text-xs transition-all shadow-3xs"
                      >
                        Update Draft in Workspace
                      </button>
                    </div>

                    {expandedDraftId === as.id && (
                      <div className="bg-white border border-blue-200 rounded-xl p-3.5 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto">
                        <div className="font-bold text-slate-800 mb-1">Your Submitted Draft:</div>
                        {sub.draft}
                      </div>
                    )}
                  </div>
                )}

                {isPending && (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="p-1.5 bg-amber-100 text-amber-700 rounded-xl">
                        <AlertCircle className="w-4 h-4" />
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          Assignment Pending — Ready for Your Draft
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Due on {as.dueDate} • Recommended Level: {lvlBadge.label}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onStartAssignment(as)}
                      className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-3xs"
                    >
                      <span>Draft in Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Bottom Action bar */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => setSelectedAssignmentModal(as)}
                    className="text-slate-500 hover:text-indigo-600 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    View Detailed Rubric & Scaffolding Guide
                  </button>

                  <button
                    onClick={() => onStartAssignment(as)}
                    className="text-indigo-600 hover:text-indigo-800 font-bold text-[11px] flex items-center gap-1 transition-colors"
                  >
                    <span>{isPending ? "Start Working" : "Open Workspace"}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. DETAILED ASSIGNMENT & RUBRIC MODAL */}
      {selectedAssignmentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5 animate-scale-up">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
                    {selectedAssignmentModal.level.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    Tier {selectedAssignmentModal.scaffoldingTier}
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-lg mt-1">
                  {selectedAssignmentModal.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Assigned by {selectedAssignmentModal.assignedBy || "Mr. Escrina"} • Due: {selectedAssignmentModal.dueDate}
                </p>
              </div>

              <button
                onClick={() => setSelectedAssignmentModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Prompt Details */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Teacher's Prompt & Directions
              </h4>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {selectedAssignmentModal.description}
              </div>
            </div>

            {/* Rubrics Checklist */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Instructor Rubric Criteria
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {getRubricFocusItems(selectedAssignmentModal.level).map((crit, i) => (
                  <div key={i} className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-3 text-xs flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-800">{crit}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Scored from 1 (Novice) to 4 (Exemplary Academic Voice).
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setSelectedAssignmentModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const target = selectedAssignmentModal;
                  setSelectedAssignmentModal(null);
                  onStartAssignment(target);
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition-all flex items-center gap-1.5 shadow-3xs"
              >
                <span>Launch in Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
