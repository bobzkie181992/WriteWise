export interface PortfolioItem {
  id?: string;
  userId: string;
  studentName?: string;
  studentEmail?: string;
  type: string; // "sentence" | "paragraph" | "essay" | "title" | "introduction" | "thesis" | "conclusion" | "reference" | "revision" | "reflection" | "concept_paper" | "practice"
  title: string;
  draft: string;
  revisedDraft?: string;
  reflection?: string;
  aiFeedback?: any;
  aiBalanceMeter?: { independent: number; aiAssisted: number };
  skillsPracticed: string[];
  createdAt: string;
  teacherFeedback?: string;
  score?: number;
  status?: "pending" | "checked" | "needs_revision";
  scaffoldingTier: number;
  rubricEvaluation?: Record<string, number>;
  checkedAt?: string;
  checkedBy?: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  studentsCount: number;
  writingLevel: string;
  scaffoldingTier: number;
  students: { id: string; name: string; email: string; submittedCount: number; averageScore: number }[];
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  level: string; // "sentence" | "paragraph" | "essay" | "research" | "concept_paper"
  scaffoldingTier: number;
  dueDate: string;
  submissionsCount?: number;
  assignedBy?: string;
  assignedClass?: string;
  targetWords?: number;
  rubricFocus?: string[];
  status?: "not_started" | "in_progress" | "submitted" | "completed";
}

export interface SentenceExercise {
  id: string;
  category: "subject_verb" | "fragment" | "combining" | "clarity";
  title: string;
  instruction: string;
  original: string;
  hint: string;
  expectedConcept: string;
}

// -------------------------------------------------------------
// STATIC LEARNING CONTENT & EXERCISES
// -------------------------------------------------------------
export const SENTENCE_EXERCISES: SentenceExercise[] = [
  {
    id: "s1",
    category: "subject_verb",
    title: "Subject-Verb Agreement",
    instruction: "Correct the agreement issue in this sentence. Pay attention to singular vs. plural subjects.",
    original: "The group of Grade 11 research students are presenting their findings today.",
    hint: "Identify the main subject of the sentence. Is it 'group' (singular) or 'students' (plural)? Make the verb agree with the true subject.",
    expectedConcept: "singular subject 'group' requires the singular verb 'is'"
  },
  {
    id: "s2",
    category: "fragment",
    title: "Sentence Fragments",
    instruction: "Combine or expand the fragment so it represents a complete thought with a subject and verb.",
    original: "Because online learning offers flexible schedules but requires high self-discipline.",
    hint: "This sentence starts with a subordinating conjunction 'Because' but has no main independent clause. Remove 'Because' or complete the thought.",
    expectedConcept: "removing 'Because' or adding an independent clause"
  },
  {
    id: "s3",
    category: "combining",
    title: "Combining Sentences",
    instruction: "Combine these two choppy sentences into one clear, compound or complex sentence.",
    original: "Social media use is increasing among teens. It affects their sleep cycles negatively.",
    hint: "Use coordinating conjunctions (like 'and', 'but') or relative clauses (e.g., 'which negatively affects...') to join these ideas fluidly.",
    expectedConcept: "compound or complex sentence construction"
  },
  {
    id: "s4",
    category: "clarity",
    title: "Clarity and Wordiness",
    instruction: "Revise this sentence to make it concise and active. Remove unnecessary filler words.",
    original: "At this point in time, it is highly imperative that students must read books for the purpose of widening their horizons.",
    hint: "Avoid bloated phrases like 'At this point in time' (use 'Now') or 'for the purpose of widening' (use 'to widen'). Keep the verb active.",
    expectedConcept: "concise, direct phrasing"
  }
];

export const PARAPHRASING_PASSAGES = [
  {
    id: "p1",
    source: "Dr. Elena Santos (2023)",
    original: "The pervasive nature of smartphones in high school classrooms has fundamentally altered how teenagers allocate their cognitive focus, leading to a measurable decline in attention spans during lectures.",
    mainIdea: "Smartphones in class distract high schoolers and shorten their attention spans during lectures."
  },
  {
    id: "p2",
    source: "Academic Integrity Association (2024)",
    original: "When students outsource their writing tasks fully to generative AI, they bypass the critical struggle of language formulation, which is essential for deep conceptual understanding and cognitive growth.",
    mainIdea: "Using AI to write completely stops students from developing writing and critical thinking skills."
  }
];

// -------------------------------------------------------------
// WRITING ASSESSMENT RUBRICS
// -------------------------------------------------------------
export const RUBRICS = {
  sentence: [
    { criterion: "Sentence Structure", desc: "Complete thoughts, correct clauses, and variety." },
    { criterion: "Grammar & Agreement", desc: "No subject-verb or verb tense errors." },
    { criterion: "Clarity & Conciseness", desc: "No wordiness or dangling modifiers." },
    { criterion: "Punctuation & Spelling", desc: "Proper commas, periods, capitalization, and spelling." }
  ],
  paragraph: [
    { criterion: "Topic Sentence", desc: "Clear, focused central claim that sets up the paragraph." },
    { criterion: "Evidence & Explanation", desc: "Specific, cited evidence backed by explanation." },
    { criterion: "Coherence & Unity", desc: "Logical flow, single theme, proper transitions." },
    { criterion: "Concluding Sentence", desc: "Synthesizes the paragraph without repeating the opening." }
  ],
  essay: [
    { criterion: "Title & Hook", desc: "Specific title and engaging introduction context." },
    { criterion: "Thesis Statement", desc: "Clear, arguable, three-part position statement." },
    { criterion: "Body Development", desc: "Well-structured paragraphs using CLAIM-EVIDENCE-EXPLANATION-LINK." },
    { criterion: "Counterargument", desc: "Fair presentation of opposing view with structured rebuttal." },
    { criterion: "Conclusion", desc: "Restates claim, synthesizes points, provides final insight." },
    { criterion: "Referencing (APA 7th)", desc: "Proper in-text citations and complete reference list." }
  ],
  research: [
    { criterion: "Research Focus", desc: "Clearly defined research problem or analytical inquiry." },
    { criterion: "Literature Synthesis", desc: "Synthesizes scholarly views instead of just summarizing." },
    { criterion: "Methodology", desc: "Clear description of research methods or text analysis." },
    { criterion: "Evidence Evaluation", desc: "Integrates evaluated sources critically and objectively." },
    { criterion: "Academic Tone", desc: "Objective, formal language with scholarly precision." },
    { criterion: "Referencing & Integrity", desc: "Flawless APA 7th reference entries and academic honesty." }
  ]
};

// -------------------------------------------------------------
// INITIAL TEACHER MOCK DATA
// -------------------------------------------------------------
export const INITIAL_CLASSES: ClassGroup[] = [
  {
    id: "class_silver",
    name: "Grade 11 - Section Silver",
    studentsCount: 3,
    writingLevel: "Level 3 - Essay Writing",
    scaffoldingTier: 2,
    students: [
      { id: "student_1", name: "Alex Rivera", email: "alex.rivera@school.edu", submittedCount: 5, averageScore: 88 },
      { id: "student_2", name: "Maria Santos", email: "maria.santos@school.edu", submittedCount: 6, averageScore: 92 },
      { id: "student_3", name: "Daryl Cole", email: "daryl.cole@school.edu", submittedCount: 4, averageScore: 79 }
    ]
  },
  {
    id: "class_gold",
    name: "Grade 11 - Section Gold",
    studentsCount: 2,
    writingLevel: "Level 4 - Research Writing",
    scaffoldingTier: 3,
    students: [
      { id: "student_4", name: "Chloe Cruz", email: "chloe.cruz@school.edu", submittedCount: 8, averageScore: 95 },
      { id: "student_5", name: "Ryan Vance", email: "ryan.vance@school.edu", submittedCount: 7, averageScore: 84 }
    ]
  }
];

export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: "as_1",
    title: "Persuasive Essay: Social Media Effects on Student Attention",
    description: "Formulate a three-part arguable thesis statement and draft an analytical essay evaluating how notification frequency affects sustained attention in high school classrooms. Integrate at least one counterargument with rebuttal.",
    level: "essay",
    scaffoldingTier: 2,
    dueDate: "2026-10-15",
    submissionsCount: 3,
    assignedBy: "Mr. Escrina (Writing Instructor)",
    assignedClass: "Grade 11 - Section Silver",
    targetWords: 400,
    rubricFocus: ["Thesis Statement", "Body Development", "Counterargument", "APA 7th Referencing"]
  },
  {
    id: "as_2",
    title: "Position Paper: Responsible Generative AI in High School Writing",
    description: "Argue whether AI sentence prediction engines enhance authentic student self-authorship or foster over-reliance. Support your claims with synthesized literature and accurate APA citations.",
    level: "research",
    scaffoldingTier: 3,
    dueDate: "2026-10-25",
    submissionsCount: 1,
    assignedBy: "Mr. Escrina (Writing Instructor)",
    assignedClass: "Grade 11 - Section Silver",
    targetWords: 500,
    rubricFocus: ["Research Focus", "Literature Synthesis", "Academic Tone", "Integrity"]
  },
  {
    id: "as_3",
    title: "Paragraph Synthesis: Climate Resilience in Urban Communities",
    description: "Construct a cohesive body paragraph following the CLAIM-EVIDENCE-EXPLANATION-LINK structure. Use transitional adverbs to connect your evidence to the opening topic sentence.",
    level: "paragraph",
    scaffoldingTier: 1,
    dueDate: "2026-10-05",
    submissionsCount: 2,
    assignedBy: "Mr. Escrina (Writing Instructor)",
    assignedClass: "Grade 11 - Section Silver",
    targetWords: 150,
    rubricFocus: ["Topic Sentence", "Evidence & Explanation", "Coherence & Unity", "Concluding Sentence"]
  },
  {
    id: "as_4",
    title: "Sentence Mechanics: Subject-Verb & Active Voice Drill",
    description: "Identify and correct subject-verb agreement discrepancies, eliminate wordy passive constructions, and practice structured clause coordination.",
    level: "sentence",
    scaffoldingTier: 1,
    dueDate: "2026-10-02",
    submissionsCount: 4,
    assignedBy: "Mr. Escrina (Writing Instructor)",
    assignedClass: "Grade 11 - Section Silver",
    targetWords: 80,
    rubricFocus: ["Sentence Structure", "Grammar & Agreement", "Clarity & Conciseness"]
  },
  {
    id: "as_5",
    title: "Scholarly Concept Paper: Interactive Pedagogical Scaffolding",
    description: "Draft a formal 6-section academic concept paper proposal addressing Senior High School pedagogical tools, research methodology, and anticipated real-world educational outcomes.",
    level: "concept_paper",
    scaffoldingTier: 4,
    dueDate: "2026-11-10",
    submissionsCount: 1,
    assignedBy: "Mr. Escrina (Writing Instructor)",
    assignedClass: "Grade 11 - Section Silver",
    targetWords: 600,
    rubricFocus: ["Research Focus", "Methodology", "Academic Tone", "Expected Outcomes"]
  }
];
