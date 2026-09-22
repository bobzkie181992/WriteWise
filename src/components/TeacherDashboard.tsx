import React, { useState, useEffect, useMemo } from "react";
import { 
  Users, 
  BookOpen, 
  Scale, 
  Award, 
  TrendingUp, 
  Calendar, 
  ArrowRight, 
  MessageSquare, 
  Save, 
  CheckSquare, 
  Edit2, 
  Trash2, 
  UserPlus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
  Search,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Sliders,
  FileText,
  Activity,
  X,
  Send,
  Eye,
  Percent,
  Check
} from "lucide-react";
import { 
  ClassGroup, 
  Assignment, 
  RUBRICS, 
  INITIAL_CLASSES, 
  INITIAL_ASSIGNMENTS 
} from "../types";
import { 
  getAllStudentPortfolios,
  getStudentPortfolio, 
  updatePortfolioItemFeedback, 
  getRecentActivities,
  getAssignments,
  saveAssignment,
  deleteAssignment,
  PortfolioItem,
  ActivityLog
} from "../firebase";

export default function TeacherDashboard() {
  const [classes, setClasses] = useState<ClassGroup[]>(INITIAL_CLASSES);
  const [assignments, setAssignments] = useState<Assignment[]>(INITIAL_ASSIGNMENTS);
  const [selectedClassId, setSelectedClassId] = useState<string>("class_silver");
  
  // Active Tab: "feed" (All Student Activities), "roster" (Cohort Students & Tiers), "activity_log" (Live Action Audit), "assignments" (Class Tasks)
  const [activeTab, setActiveTab] = useState<"feed" | "roster" | "activity_log" | "assignments">("feed");

  // All student submissions loaded from database
  const [allSubmissions, setAllSubmissions] = useState<PortfolioItem[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  
  // Real-time activity log
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);

  // Filtering states for the Activity Feed
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "checked" | "needs_revision">("all");
  const [studentFilter, setStudentFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Student active details for cohort/individual review
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentPortfolio, setStudentPortfolio] = useState<PortfolioItem[]>([]);

  // Detailed Activity Checking / Grading Modal / Drawer
  const [checkingSubmission, setCheckingSubmission] = useState<PortfolioItem | null>(null);
  const [checkStatus, setCheckStatus] = useState<"checked" | "needs_revision" | "pending">("checked");
  const [teacherFeedback, setTeacherFeedback] = useState("");
  const [score, setScore] = useState<number>(85);
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({});
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [feedbackSuccessToast, setFeedbackSuccessToast] = useState(false);

  // New assignment creator state
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [newAsTitle, setNewAsTitle] = useState("");
  const [newAsDesc, setNewAsDesc] = useState("");
  const [newAsLevel, setNewAsLevel] = useState("essay");
  const [newAsTier, setNewAsTier] = useState(2);
  const [newAsDue, setNewAsDue] = useState("2026-10-30");

  // Student CRUD states
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editScore, setEditScore] = useState(0);

  const currentClass = classes.find(c => c.id === selectedClassId) || classes[0];

  // Quick feedback presets for teachers
  const FEEDBACK_PRESETS = [
    "🌟 Excellent structural clarity, strong arguable claim, and fluid transitions!",
    "💡 Solid point! Elaborate further on your supporting explanation and scholarly evidence.",
    "✍️ Check subject-verb agreement and review compound sentence punctuation.",
    "🎯 Great progress on voice development! Keep refining your paragraph unity.",
    "📚 Include proper in-text citation with author and publication year (APA 7th format).",
    "🔄 Good start! Please revise the thesis to clearly list your three supporting arguments."
  ];

  // Load all student submissions, activities, and assignments
  const loadAllData = async () => {
    setLoadingSubmissions(true);
    try {
      const items = await getAllStudentPortfolios();
      setAllSubmissions(items);

      const logs = await getRecentActivities();
      setRecentActivities(logs);

      const asItems = await getAssignments();
      setAssignments(asItems);
    } catch (e) {
      console.error("Error loading submissions:", e);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Filtered submissions for the Activity Feed
  const filteredSubmissions = useMemo(() => {
    return allSubmissions.filter((item) => {
      // Status filter
      if (statusFilter !== "all") {
        const itemStatus = item.status || (item.teacherFeedback ? "checked" : "pending");
        if (itemStatus !== statusFilter) return false;
      }
      // Student filter
      if (studentFilter !== "all" && item.userId !== studentFilter) {
        return false;
      }
      // Type filter
      if (typeFilter !== "all" && item.type !== typeFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const studentName = item.studentName?.toLowerCase() || "";
        const title = item.title?.toLowerCase() || "";
        const draft = item.draft?.toLowerCase() || "";
        if (!studentName.includes(q) && !title.includes(q) && !draft.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [allSubmissions, statusFilter, studentFilter, typeFilter, searchQuery]);

  // Cohort Analytics Summary
  const stats = useMemo(() => {
    const total = allSubmissions.length;
    const pending = allSubmissions.filter(s => (s.status === "pending" || (!s.status && !s.teacherFeedback))).length;
    const checked = allSubmissions.filter(s => s.status === "checked" || !!s.teacherFeedback).length;
    const scoredItems = allSubmissions.filter(s => s.score !== undefined);
    const avgScore = scoredItems.length > 0
      ? Math.round(scoredItems.reduce((acc, s) => acc + (s.score || 0), 0) / scoredItems.length)
      : 88;
    const avgAiIndependent = allSubmissions.length > 0
      ? Math.round(
          allSubmissions.reduce((acc, s) => acc + (s.aiBalanceMeter?.independent || 85), 0) /
          allSubmissions.length
        )
      : 85;

    return { total, pending, checked, avgScore, avgAiIndependent };
  }, [allSubmissions]);

  // Open Checking Drawer/Modal for a specific student activity
  const handleOpenCheckingModal = (sub: PortfolioItem) => {
    setCheckingSubmission(sub);
    setTeacherFeedback(sub.teacherFeedback || "");
    setScore(sub.score !== undefined ? sub.score : 85);
    setCheckStatus(sub.status || (sub.teacherFeedback ? "checked" : "pending"));
    setRubricScores(sub.rubricEvaluation || {});
    setFeedbackSuccessToast(false);
  };

  // Close Checking Drawer
  const handleCloseCheckingModal = () => {
    setCheckingSubmission(null);
  };

  // Save Feedback & Score for an activity
  const handleSaveChecking = async () => {
    if (!checkingSubmission || !checkingSubmission.id) return;
    setSavingFeedback(true);
    try {
      await updatePortfolioItemFeedback(
        checkingSubmission.id,
        teacherFeedback,
        score,
        checkStatus,
        rubricScores
      );

      // Update in allSubmissions state
      const updated = allSubmissions.map(item => 
        item.id === checkingSubmission.id 
          ? { ...item, teacherFeedback, score, status: checkStatus, rubricEvaluation: rubricScores, checkedAt: new Date().toISOString(), checkedBy: "Teacher" } 
          : item
      );
      setAllSubmissions(updated);

      // Update studentPortfolio state if open
      setStudentPortfolio(prev => 
        prev.map(item => item.id === checkingSubmission.id 
          ? { ...item, teacherFeedback, score, status: checkStatus, rubricEvaluation: rubricScores } 
          : item
        )
      );

      // Update active checkingSubmission
      setCheckingSubmission(prev => prev ? {
        ...prev,
        teacherFeedback,
        score,
        status: checkStatus,
        rubricEvaluation: rubricScores
      } : null);

      setFeedbackSuccessToast(true);
      setTimeout(() => setFeedbackSuccessToast(false), 4000);
    } catch (e) {
      console.error(e);
      alert("Failed to save evaluation. Please retry.");
    } finally {
      setSavingFeedback(false);
    }
  };

  // Student Selection for Individual Portfolio view
  const handleSelectStudent = async (student: any) => {
    setSelectedStudentId(student.id);
    setStudentPortfolio([]);
    try {
      const data = await getStudentPortfolio(student.id);
      setStudentPortfolio(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Add Student to Cohort
  const handleAddStudent = () => {
    if (!newStudentName.trim() || !newStudentEmail.trim()) {
      alert("Please provide both name and email for the new student!");
      return;
    }
    const newStudent = {
      id: "student_" + Math.random().toString(36).substr(2, 9),
      name: newStudentName,
      email: newStudentEmail,
      submittedCount: 0,
      averageScore: 0
    };
    
    setClasses(prev => 
      prev.map(c => 
        c.id === selectedClassId 
          ? { 
              ...c, 
              students: [...c.students, newStudent], 
              studentsCount: c.students.length + 1 
            } 
          : c
      )
    );
    setShowAddStudent(false);
    setNewStudentName("");
    setNewStudentEmail("");
  };

  // Edit Student
  const handleEditStudent = (studentId: string, updatedName: string, updatedEmail: string, updatedScore: number) => {
    if (!updatedName.trim() || !updatedEmail.trim()) {
      alert("Name and email cannot be empty!");
      return;
    }
    setClasses(prev => 
      prev.map(c => 
        c.id === selectedClassId 
          ? {
              ...c,
              students: c.students.map(s => 
                s.id === studentId 
                  ? { ...s, name: updatedName, email: updatedEmail, averageScore: updatedScore } 
                  : s
              )
            } 
          : c
      )
    );
    setEditingStudentId(null);
  };

  // Remove Student
  const handleDeleteStudent = (studentId: string) => {
    if (confirm("Are you sure you want to remove this student from the cohort?")) {
      setClasses(prev => 
        prev.map(c => 
          c.id === selectedClassId 
            ? {
                ...c,
                students: c.students.filter(s => s.id !== studentId),
                studentsCount: Math.max(0, c.students.length - 1)
              } 
            : c
        )
      );
      if (selectedStudentId === studentId) {
        setSelectedStudentId(null);
        setStudentPortfolio([]);
      }
    }
  };

  // Change class scaffolding tier
  const handleClassTierChange = (newTier: number) => {
    setClasses(prev => 
      prev.map(c => c.id === selectedClassId ? { ...c, scaffoldingTier: newTier } : c)
    );
  };

  // Change class writing level
  const handleClassLevelChange = (level: string) => {
    setClasses(prev => 
      prev.map(c => c.id === selectedClassId ? { ...c, writingLevel: level } : c)
    );
  };

  // Create Assignment
  const handleCreateAssignment = async () => {
    if (!newAsTitle.trim()) return;
    const newAs: Assignment = {
      id: "as_" + Math.random().toString(36).substr(2, 9),
      title: newAsTitle,
      description: newAsDesc,
      level: newAsLevel,
      scaffoldingTier: newAsTier,
      dueDate: newAsDue,
      submissionsCount: 0,
      assignedBy: "Mr. Escrina (Writing Instructor)",
      assignedClass: currentClass.name,
      targetWords: newAsLevel === "sentence" ? 80 : newAsLevel === "paragraph" ? 150 : newAsLevel === "concept_paper" ? 600 : 400
    };
    await saveAssignment(newAs);
    setAssignments(prev => [newAs, ...prev]);
    setShowAddAssignment(false);
    setNewAsTitle("");
    setNewAsDesc("");
  };

  // Delete Assignment
  const handleDeleteAssignment = async (asId: string) => {
    if (confirm("Are you sure you want to remove this assignment from the curriculum?")) {
      await deleteAssignment(asId);
      setAssignments(prev => prev.filter(a => a.id !== asId));
    }
  };

  // Helper for activity type badges
  const getActivityBadge = (type: string) => {
    switch (type) {
      case "concept_paper":
        return { label: "Level 5 • Concept Paper", bg: "bg-amber-100 text-amber-800 border-amber-200" };
      case "research":
      case "reference":
        return { label: "Level 4 • Research & Citations", bg: "bg-emerald-100 text-emerald-800 border-emerald-200" };
      case "essay":
        return { label: "Level 3 • Essay Writing", bg: "bg-purple-100 text-purple-800 border-purple-200" };
      case "paragraph":
        return { label: "Level 2 • Paragraph Scaffolding", bg: "bg-indigo-100 text-indigo-800 border-indigo-200" };
      case "sentence":
        return { label: "Level 1 • Sentence Drill", bg: "bg-blue-100 text-blue-800 border-blue-200" };
      case "practice":
        return { label: "Practice • Sentence Prediction", bg: "bg-teal-100 text-teal-800 border-teal-200" };
      default:
        return { label: type.toUpperCase(), bg: "bg-slate-100 text-slate-700 border-slate-200" };
    }
  };

  return (
    <div className="space-y-6" id="teacher_activity_monitor">
      
      {/* 1. TEACHER SUITE HEADER & COHORT ANALYTICS OVERVIEW */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Teacher Oversight Portal
              </span>
              <span className="text-xs text-slate-400 font-medium">Academic Year 2026</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mt-1">Student Activity Monitor & Evaluation Suite</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              View, inspect drafts, review student AI reflections, and check student writing activities across cohorts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Cohort Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Cohort:</label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedStudentId(null);
                }}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={loadAllData}
              disabled={loadingSubmissions}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all text-xs font-semibold flex items-center gap-1.5"
              title="Refresh Activities"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingSubmissions ? "animate-spin text-indigo-600" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Analytic Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 pt-5">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 text-center sm:text-left">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Submissions</div>
            <div className="text-xl font-extrabold text-slate-800 mt-1 flex items-center justify-center sm:justify-start gap-1.5">
              <FileText className="w-4 h-4 text-indigo-600" />
              {stats.total}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">across all scaffolding levels</div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-3.5 text-center sm:text-left">
            <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Needs Teacher Check</div>
            <div className="text-xl font-extrabold text-amber-900 mt-1 flex items-center justify-center sm:justify-start gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              {stats.pending}
            </div>
            <div className="text-[10px] text-amber-700 mt-0.5">pending review & score</div>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-2xl p-3.5 text-center sm:text-left">
            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Checked & Graded</div>
            <div className="text-xl font-extrabold text-emerald-900 mt-1 flex items-center justify-center sm:justify-start gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {stats.checked}
            </div>
            <div className="text-[10px] text-emerald-700 mt-0.5">feedback delivered</div>
          </div>

          <div className="bg-indigo-50/70 border border-indigo-200/60 rounded-2xl p-3.5 text-center sm:text-left">
            <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Cohort Avg Grade</div>
            <div className="text-xl font-extrabold text-indigo-900 mt-1 flex items-center justify-center sm:justify-start gap-1.5">
              <Award className="w-4 h-4 text-indigo-600" />
              {stats.avgScore}%
            </div>
            <div className="text-[10px] text-indigo-700 mt-0.5">based on rubrics</div>
          </div>

          <div className="bg-teal-50/70 border border-teal-200/60 rounded-2xl p-3.5 text-center sm:text-left col-span-2 sm:col-span-1">
            <div className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">AI Independence</div>
            <div className="text-xl font-extrabold text-teal-900 mt-1 flex items-center justify-center sm:justify-start gap-1.5">
              <Percent className="w-4 h-4 text-teal-600" />
              {stats.avgAiIndependent}%
            </div>
            <div className="text-[10px] text-teal-700 mt-0.5">student original authorship</div>
          </div>
        </div>
      </div>

      {/* 2. PRIMARY NAVIGATION TABS */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl px-3 pt-2 shadow-3xs gap-1 sm:gap-2">
        <button
          onClick={() => setActiveTab("feed")}
          className={`px-4 py-3 text-xs font-bold rounded-xl transition-all flex items-center gap-2 border-b-2 ${
            activeTab === "feed"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Student Activities Feed</span>
          {stats.pending > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-amber-500 text-white rounded-full">
              {stats.pending}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("roster")}
          className={`px-4 py-3 text-xs font-bold rounded-xl transition-all flex items-center gap-2 border-b-2 ${
            activeTab === "roster"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Cohort Roster & Tiers ({currentClass.studentsCount})</span>
        </button>

        <button
          onClick={() => setActiveTab("activity_log")}
          className={`px-4 py-3 text-xs font-bold rounded-xl transition-all flex items-center gap-2 border-b-2 ${
            activeTab === "activity_log"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Live Action Audit</span>
        </button>

        <button
          onClick={() => setActiveTab("assignments")}
          className={`px-4 py-3 text-xs font-bold rounded-xl transition-all flex items-center gap-2 border-b-2 ${
            activeTab === "assignments"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Class Assignments ({assignments.length})</span>
        </button>
      </div>

      {/* 3. TAB 1: ALL STUDENT ACTIVITIES FEED (View and Check Activity) */}
      {activeTab === "feed" && (
        <div className="space-y-4">
          
          {/* Filter & Search Toolbar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name, topic, or draft keyword..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e: any) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">⏳ Needs Check ({stats.pending})</option>
                  <option value="checked">✓ Checked ({stats.checked})</option>
                  <option value="needs_revision">⚠️ Needs Revision</option>
                </select>
              </div>

              {/* Student Filter */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Student:</span>
                <select
                  value={studentFilter}
                  onChange={(e) => setStudentFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="all">All Students</option>
                  {currentClass.students.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Activity Type Filter */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Level:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="all">All Levels</option>
                  <option value="sentence">Level 1: Sentence</option>
                  <option value="paragraph">Level 2: Paragraph</option>
                  <option value="essay">Level 3: Essay</option>
                  <option value="research">Level 4: Research</option>
                  <option value="concept_paper">Level 5: Concept Paper</option>
                  <option value="practice">Practice Writing</option>
                </select>
              </div>
            </div>
          </div>

          {/* Activity Submissions List */}
          {loadingSubmissions ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
              Loading student activities from database...
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="font-semibold text-sm text-slate-600">No student activities found</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No submissions match your active filter criteria. Clear filters or switch cohorts to review other student activity.
              </p>
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setStudentFilter("all");
                  setTypeFilter("all");
                  setSearchQuery("");
                }}
                className="px-4 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl text-xs hover:bg-indigo-100 transition-all"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSubmissions.map((item, idx) => {
                const badge = getActivityBadge(item.type);
                const isChecked = item.status === "checked" || !!item.teacherFeedback;
                const isPending = !isChecked && item.status !== "needs_revision";
                const isRevision = item.status === "needs_revision";

                return (
                  <div
                    key={item.id || idx}
                    className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-5 shadow-xs transition-all space-y-3 relative group"
                  >
                    {/* Top Row: Student Identity, Activity Badge, Status, Date */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-3xs">
                          {item.studentName ? item.studentName.split(" ").map(n => n[0]).join("") : "ST"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-800">{item.studentName || "Alex Rivera"}</span>
                            <span className="text-[10px] text-slate-400">{item.studentEmail || "student@school.edu"}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                              {badge.label}
                            </span>
                            <span className="text-xs font-semibold text-slate-700 capitalize truncate max-w-xs">
                              {item.title}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badges & Grade */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isPending && (
                          <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 font-bold text-[10px] rounded-lg flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" /> Needs Teacher Check
                          </span>
                        )}

                        {isChecked && (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px] rounded-lg flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Checked by Teacher
                            </span>
                            {item.score !== undefined && (
                              <span className="px-2 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-[10px] rounded-lg">
                                Grade: {item.score}/100
                              </span>
                            )}
                          </div>
                        )}

                        {isRevision && (
                          <span className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[10px] rounded-lg flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-rose-600" /> Revision Requested
                          </span>
                        )}

                        <span className="text-[11px] text-slate-400 font-medium ml-1">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Student Draft Snippet */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed line-clamp-3 font-mono">
                      {item.draft}
                    </div>

                    {/* Student Reflection & WriteWise Balance */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 pt-1">
                      {item.reflection ? (
                        <div className="text-indigo-800 italic truncate max-w-xl">
                          <span className="font-semibold text-slate-600 not-italic">Student Reflection:</span> "{item.reflection}"
                        </div>
                      ) : (
                        <div className="text-slate-400 italic">No reflection recorded</div>
                      )}

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                          {item.aiBalanceMeter?.independent || 85}% Student / {item.aiBalanceMeter?.aiAssisted || 15}% AI
                        </span>
                        
                        {/* Primary Check & Grade Action Button */}
                        <button
                          onClick={() => handleOpenCheckingModal(item)}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-3xs group-hover:scale-[1.02]"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>{isChecked ? "Review Evaluation" : "Check & Grade Activity"}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Teacher Feedback Preview (if already checked) */}
                    {item.teacherFeedback && (
                      <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800 flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Your Teacher Feedback:</span> {item.teacherFeedback}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. TAB 2: COHORT ROSTER & SCAFFOLDING TIERS */}
      {activeTab === "roster" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Cohort Scaffolding Tier Controls (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-sm">Classroom Scaffolding Config</h3>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase">
                  Target Writing Level:
                </label>
                <select
                  value={currentClass.writingLevel}
                  onChange={(e) => handleClassLevelChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Level 1 - Word and Sentence">Level 1 - Word and Sentence</option>
                  <option value="Level 2 - Paragraph">Level 2 - Paragraph</option>
                  <option value="Level 3 - Essay Writing">Level 3 - Essay Writing</option>
                  <option value="Level 4 - Research Writing">Level 4 - Research Writing</option>
                  <option value="Level 5 - Concept Paper">Level 5 - Concept Paper Proposal</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase">
                  Enforce Max Scaffolding Tier:
                </label>
                <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl">
                  {[1, 2, 3, 4].map((t) => (
                    <button
                      key={t}
                      onClick={() => handleClassTierChange(t)}
                      className={`py-2 text-xs font-bold rounded-lg transition-all ${
                        currentClass.scaffoldingTier === t
                          ? "bg-white text-indigo-600 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Tier {t}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Tier 1 = Full Guidance • Tier 2 = Moderate Support • Tier 3 = Light Prompts • Tier 4 = Independent Writing
                </p>
              </div>
            </div>

            {/* Other Cohorts */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-800 text-sm">Switch Active Cohort</h3>
              <div className="space-y-2">
                {classes.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedClassId(c.id);
                      setSelectedStudentId(null);
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                      selectedClassId === c.id
                        ? "bg-indigo-50/70 border-indigo-300 text-indigo-900 font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{c.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{c.studentsCount} Students • {c.writingLevel}</div>
                    </div>
                    <span className="text-[10px] px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full font-bold">
                      Tier {c.scaffoldingTier}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Student Roster & Individual Activity Inspection (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-800 text-sm">Enrolled Students in {currentClass.name}</h3>
                </div>
                <button
                  onClick={() => {
                    setShowAddStudent(!showAddStudent);
                    setEditingStudentId(null);
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-3xs"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Enroll Student
                </button>
              </div>

              {/* Add Student Form */}
              {showAddStudent && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Jonathan Mercer"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g., jonathan.mercer@school.edu"
                      value={newStudentEmail}
                      onChange={(e) => setNewStudentEmail(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleAddStudent}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all text-xs"
                    >
                      Confirm Enrollment
                    </button>
                  </div>
                </div>
              )}

              {/* Student Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {currentClass.students.map((st) => {
                  const studentSubmissions = allSubmissions.filter(s => s.userId === st.id);
                  const studentPending = studentSubmissions.filter(s => s.status === "pending" || (!s.status && !s.teacherFeedback)).length;
                  const isSelected = selectedStudentId === st.id;

                  return (
                    <div
                      key={st.id}
                      onClick={() => handleSelectStudent(st)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {editingStudentId === st.id ? (
                        <div className="space-y-2 w-full" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-white text-slate-800 border border-slate-300 rounded-lg p-2 text-xs"
                            placeholder="Name"
                          />
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="w-full bg-white text-slate-800 border border-slate-300 rounded-lg p-2 text-xs"
                            placeholder="Email"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditStudent(st.id, editName, editEmail, editScore)}
                              className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingStudentId(null)}
                              className="px-3 py-1 bg-slate-400 text-white text-xs font-bold rounded-lg"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                isSelected ? "bg-white text-indigo-600" : "bg-indigo-100 text-indigo-700"
                              }`}>
                                {st.name.split(" ").map(n => n[0]).join("")}
                              </div>
                              <div>
                                <div className="font-bold text-xs">{st.name}</div>
                                <div className={`text-[10px] ${isSelected ? "text-indigo-200" : "text-slate-400"}`}>
                                  {st.email}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  setEditingStudentId(st.id);
                                  setEditName(st.name);
                                  setEditEmail(st.email);
                                  setEditScore(st.averageScore);
                                }}
                                className={`p-1 rounded hover:bg-black/10 transition-all ${
                                  isSelected ? "text-indigo-200 hover:text-white" : "text-slate-400 hover:text-slate-600"
                                }`}
                                title="Edit Student"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(st.id)}
                                className={`p-1 rounded hover:bg-black/10 transition-all ${
                                  isSelected ? "text-indigo-200 hover:text-white" : "text-slate-400 hover:text-rose-600"
                                }`}
                                title="Remove Student"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-dashed border-slate-300/30 text-[10px]">
                            <span className="font-semibold">
                              {studentSubmissions.length} activities logged
                            </span>
                            {studentPending > 0 ? (
                              <span className={`px-2 py-0.5 rounded-full font-bold ${
                                isSelected ? "bg-amber-400 text-amber-950" : "bg-amber-100 text-amber-800"
                              }`}>
                                {studentPending} to check
                              </span>
                            ) : (
                              <span className={`font-semibold ${isSelected ? "text-indigo-200" : "text-emerald-600"}`}>
                                All Checked ✓
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Individual Student Selected History */}
            {selectedStudentId && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="font-bold text-slate-800 text-sm">
                    Activity History for {currentClass.students.find(s => s.id === selectedStudentId)?.name}
                  </h4>
                  <button
                    onClick={() => setSelectedStudentId(null)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Close History
                  </button>
                </div>

                {studentPortfolio.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs italic">
                    This student hasn't saved any writing drills or drafts yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {studentPortfolio.map((sub, i) => (
                      <div
                        key={sub.id || i}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 hover:border-indigo-300 transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md">
                              {sub.type}
                            </span>
                            <span className="font-bold text-xs text-slate-800 capitalize">{sub.title}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{sub.draft}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {sub.score !== undefined && (
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                              {sub.score}/100
                            </span>
                          )}
                          <button
                            onClick={() => handleOpenCheckingModal(sub)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> Check
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. TAB 3: LIVE ACTION AUDIT STREAM */}
      {activeTab === "activity_log" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Real-Time Student Activity Audit Trail</h3>
              <p className="text-xs text-slate-500 mt-0.5">Live stream of student exercise completions, drafts, and revisions</p>
            </div>
            <button
              onClick={loadAllData}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Sync Stream
            </button>
          </div>

          {recentActivities.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs italic">
              No recent student activity events logged yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentActivities.map((act, i) => (
                <div key={act.id || i} className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                      {act.studentName ? act.studentName[0] : "S"}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">
                        {act.studentName} <span className="font-normal text-slate-600">— {act.action}</span>
                      </div>
                      {act.details && (
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 italic">{act.details}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 shrink-0">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. TAB 4: CLASS ASSIGNMENTS */}
      {activeTab === "assignments" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Active Curriculum Assignments</h3>
              <p className="text-xs text-slate-500 mt-0.5">Tasks assigned to {currentClass.name}</p>
            </div>
            <button
              onClick={() => setShowAddAssignment(!showAddAssignment)}
              className="text-xs font-bold px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-3xs flex items-center gap-1.5"
            >
              + Create Assignment
            </button>
          </div>

          {showAddAssignment && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">ASSIGNMENT TITLE</label>
                <input
                  type="text"
                  placeholder="e.g., Persuasive Position Paper on AI Ethics"
                  value={newAsTitle}
                  onChange={(e) => setNewAsTitle(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">PROMPT / INSTRUCTIONS</label>
                <textarea
                  placeholder="Provide instructions and expectations here..."
                  value={newAsDesc}
                  onChange={(e) => setNewAsDesc(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs h-20 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">WRITING LEVEL</label>
                  <select
                    value={newAsLevel}
                    onChange={(e) => setNewAsLevel(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="sentence">Sentence</option>
                    <option value="paragraph">Paragraph</option>
                    <option value="essay">Essay</option>
                    <option value="research">Research</option>
                    <option value="concept_paper">Concept Paper</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">REQUIRED TIER</label>
                  <select
                    value={newAsTier}
                    onChange={(e) => setNewAsTier(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value={1}>Tier 1 (Heavy Scaffolding)</option>
                    <option value={2}>Tier 2 (Moderate Support)</option>
                    <option value={3}>Tier 3 (Light Support)</option>
                    <option value={4}>Tier 4 (Independent)</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleCreateAssignment}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all text-xs"
              >
                Assign to Cohort
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.map((as) => (
              <div key={as.id} className="border border-slate-200 rounded-2xl p-4.5 bg-slate-50 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-slate-800 text-xs">{as.title}</div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md uppercase shrink-0">
                    {as.level}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-normal line-clamp-2">{as.description}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200/60">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Due: {as.dueDate}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-indigo-600">
                      Tier {as.scaffoldingTier}
                    </span>
                    <button
                      onClick={() => handleDeleteAssignment(as.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                      title="Delete assignment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. TEACHER'S "CHECK & EVALUATE ACTIVITY" MODAL / INSPECTOR */}
      {checkingSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-3xs shrink-0">
                  {checkingSubmission.studentName ? checkingSubmission.studentName.split(" ").map(n => n[0]).join("") : "ST"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{checkingSubmission.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getActivityBadge(checkingSubmission.type).bg}`}>
                      {getActivityBadge(checkingSubmission.type).label}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                    <span className="font-semibold text-slate-700">{checkingSubmission.studentName || "Student"}</span>
                    <span>•</span>
                    <span>{checkingSubmission.studentEmail || "student@school.edu"}</span>
                    <span>•</span>
                    <span>Submitted {new Date(checkingSubmission.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCloseCheckingModal}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Scrollable inspection area */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              
              {/* Toast for success */}
              {feedbackSuccessToast && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-emerald-800 flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Activity successfully checked, graded, and feedback returned to the student!
                  </div>
                  <button onClick={() => setFeedbackSuccessToast(false)} className="text-emerald-700 hover:text-emerald-900">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* SECTION A: STUDENT DRAFT & COMPARISON */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Student Submission Text
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Word count: {checkingSubmission.draft.split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
                  {checkingSubmission.draft}
                </div>

                {checkingSubmission.revisedDraft && (
                  <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4.5 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                    <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-2">Student Revised Version:</div>
                    {checkingSubmission.revisedDraft}
                  </div>
                )}
              </div>

              {/* SECTION B: STUDENT REFLECTION & INTEGRITY METER */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 space-y-1.5">
                  <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Student AI-Use Self Reflection
                  </div>
                  <p className="text-xs text-indigo-900 italic leading-relaxed">
                    "{checkingSubmission.reflection || "Student completed this exercise independently without recorded reflection."}"
                  </p>
                </div>

                <div className="bg-teal-50/60 border border-teal-100 rounded-2xl p-4 space-y-1.5">
                  <div className="text-[10px] font-bold text-teal-700 uppercase tracking-wider flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5" /> WriteWise AI-Balance Meter
                  </div>
                  <div className="text-sm font-extrabold text-teal-900">
                    {checkingSubmission.aiBalanceMeter?.independent || 85}% Student Authored • {checkingSubmission.aiBalanceMeter?.aiAssisted || 15}% AI Guided
                  </div>
                  <p className="text-[10px] text-teal-700">
                    Student maintained authentic self-authorship while using predictive next-word/sentence completions.
                  </p>
                </div>
              </div>

              {/* SECTION C: RUBRIC EVALUATION MATRIX */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                    Standard Rubric Assessment Matrix
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold">4 = Exemplary • 3 = Proficient • 2 = Developing • 1 = Needs Work</span>
                </div>

                <div className="space-y-2">
                  {(RUBRICS[checkingSubmission.type as keyof typeof RUBRICS] || RUBRICS.essay).slice(0, 4).map((rub, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-white border border-slate-100 rounded-xl gap-2">
                      <div>
                        <span className="font-bold text-slate-800 text-xs">{rub.criterion}:</span>{" "}
                        <span className="text-slate-500 text-[11px]">{rub.desc}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {[4, 3, 2, 1].map((val) => (
                          <button
                            key={val}
                            onClick={() => {
                              setRubricScores(prev => ({ ...prev, [rub.criterion]: val }));
                            }}
                            className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all ${
                              rubricScores[rub.criterion] === val
                                ? "bg-indigo-600 text-white shadow-3xs"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION D: TEACHER CHECKING, STATUS, SCORING & FEEDBACK */}
              <div className="border-t border-slate-100 pt-4 space-y-4">
                
                {/* 1. Review Status Radio Buttons */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">
                    Evaluation Check Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setCheckStatus("checked")}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        checkStatus === "checked"
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Checked & Approved
                    </button>

                    <button
                      onClick={() => setCheckStatus("needs_revision")}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        checkStatus === "needs_revision"
                          ? "bg-rose-600 border-rose-600 text-white shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5" /> Needs Revision
                    </button>

                    <button
                      onClick={() => setCheckStatus("pending")}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        checkStatus === "pending"
                          ? "bg-amber-600 border-amber-600 text-white shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" /> Pending Review
                    </button>
                  </div>
                </div>

                {/* 2. Numerical Score Control */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">
                      Numeric Grade Score (0 - 100)
                    </label>
                    <input
                      type="number"
                      value={score}
                      onChange={(e) => setScore(Number(e.target.value))}
                      max={100}
                      min={0}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-base font-extrabold text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">
                      Quick Grade Presets
                    </label>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {[100, 95, 90, 85, 80, 75].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setScore(preset)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            score === preset
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {preset}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Teacher Feedback Textarea & Presets */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">
                      Teacher Constructive Feedback & Comments
                    </label>
                    <span className="text-[10px] text-slate-400">Returned directly to student portfolio</span>
                  </div>

                  <textarea
                    placeholder="Write detailed, supportive feedback guiding the student's next revisions..."
                    value={teacherFeedback}
                    onChange={(e) => setTeacherFeedback(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3.5 text-xs text-slate-800 h-28 focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
                  />

                  {/* Quick Preset Feedback Chips */}
                  <div className="mt-2 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Insert Quick Presets:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {FEEDBACK_PRESETS.map((preset, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setTeacherFeedback(prev => prev ? `${prev}\n${preset}` : preset);
                          }}
                          className="text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200 transition-all text-left"
                        >
                          + {preset.slice(0, 40)}...
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer: Save and Close */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={handleCloseCheckingModal}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-all"
              >
                Close Without Saving
              </button>

              <button
                onClick={handleSaveChecking}
                disabled={savingFeedback}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all shadow-xs flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingFeedback ? "Saving Evaluation..." : "Save Evaluation & Return to Student"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
