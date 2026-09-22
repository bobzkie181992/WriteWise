import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  deleteDoc,
  doc,
  getDocFromServer
} from "firebase/firestore";
import { 
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  User as FirebaseUser
} from "firebase/auth";
import { Assignment, INITIAL_ASSIGNMENTS } from "./types";
import firebaseConfig from "../firebase-applet-config.json";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  const currentUser = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo: currentUser?.providerData?.map((p: any) => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error:", JSON.stringify(errInfo));
  return errInfo;
}

export let app: any;
export let db: any;
export let auth: any;
export let isFirebaseAvailable = false;

try {
  app = initializeApp(firebaseConfig);
  // CRITICAL: Initialize Firestore with the exact database ID from firebase-applet-config.json
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  auth = getAuth(app);
  isFirebaseAvailable = true;
  console.log("Firebase initialized successfully with database:", firebaseConfig.firestoreDatabaseId);

  // Connection validation per skill specification
  getDocFromServer(doc(db, "test", "connection")).catch((error) => {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Please check your Firebase configuration or network connection.");
    }
  });
} catch (error) {
  console.error("Firebase Initialization Failed. Falling back to robust local database:", error);
}

// -------------------------------------------------------------
// USER IDENTITY & AUTHENTICATION MODELS
// -------------------------------------------------------------
export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: "student" | "teacher";
  className?: string;
  photoURL?: string;
}

export const DEFAULT_USERS: AppUser[] = [
  {
    uid: "teacher_escrina",
    displayName: "Mr. J. F. Escrina",
    email: "jfescrin@carsu.edu.ph",
    role: "teacher",
    className: "Grade 11 Faculty",
  },
  {
    uid: "student_1",
    displayName: "Alex Rivera",
    email: "alex.rivera@school.edu",
    role: "student",
    className: "Section Silver",
  },
  {
    uid: "student_2",
    displayName: "Maria Santos",
    email: "maria.santos@school.edu",
    role: "student",
    className: "Section Silver",
  },
  {
    uid: "student_3",
    displayName: "Daryl Cole",
    email: "daryl.cole@school.edu",
    role: "student",
    className: "Section Silver",
  }
];

const ACTIVE_USER_STORAGE_KEY = "writewise_active_user_session";

export function getStoredActiveUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Failed to read active user from localStorage:", e);
  }
  // Default to first student if not yet set
  return DEFAULT_USERS[1];
}

export function saveStoredActiveUser(user: AppUser | null): void {
  try {
    if (user) {
      localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
    }
  } catch (e) {
    console.warn("Failed to store active user to localStorage:", e);
  }
}

// Login with Email & Password
export async function loginWithEmail(email: string, pass: string): Promise<AppUser> {
  const cleanEmail = email.trim().toLowerCase();
  
  // 1. Try Firebase Auth
  if (isFirebaseAvailable && auth) {
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      const isTeacher = cleanEmail.includes("teacher") || cleanEmail === "jfescrin@carsu.edu.ph";
      const user: AppUser = {
        uid: cred.user.uid,
        email: cred.user.email || cleanEmail,
        displayName: cred.user.displayName || (isTeacher ? "Instructor Escrina" : cleanEmail.split("@")[0]),
        role: isTeacher ? "teacher" : "student",
        className: isTeacher ? "Grade 11 Faculty" : "Section Silver"
      };
      saveStoredActiveUser(user);
      return user;
    } catch (fbErr: any) {
      console.warn("Firebase Auth sign in failed, checking local profiles:", fbErr?.code || fbErr?.message);
    }
  }

  // 2. Check predefined demo accounts
  const match = DEFAULT_USERS.find(u => u.email.toLowerCase() === cleanEmail);
  if (match) {
    saveStoredActiveUser(match);
    return match;
  }

  // 3. Fallback seamless user generation
  const isTeacher = cleanEmail.includes("teacher") || cleanEmail.includes("faculty") || cleanEmail === "jfescrin@carsu.edu.ph";
  const nameFromEmail = cleanEmail.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  const fallbackUser: AppUser = {
    uid: "user_" + Math.random().toString(36).substr(2, 9),
    email: cleanEmail,
    displayName: nameFromEmail || (isTeacher ? "Teacher User" : "Student User"),
    role: isTeacher ? "teacher" : "student",
    className: isTeacher ? "Faculty" : "Section Silver"
  };
  saveStoredActiveUser(fallbackUser);
  return fallbackUser;
}

// Register with Email & Password
export async function registerWithEmail(
  email: string, 
  pass: string, 
  displayName: string, 
  role: "student" | "teacher", 
  className?: string
): Promise<AppUser> {
  const cleanEmail = email.trim().toLowerCase();
  let createdUid = "user_" + Math.random().toString(36).substr(2, 9);

  if (isFirebaseAvailable && auth) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      createdUid = cred.user.uid;
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }
    } catch (fbErr: any) {
      console.warn("Firebase Auth registration failed, creating local profile:", fbErr?.code || fbErr?.message);
    }
  }

  const newUser: AppUser = {
    uid: createdUid,
    email: cleanEmail,
    displayName: displayName || (role === "teacher" ? "Instructor" : "Student"),
    role,
    className: className || (role === "teacher" ? "Senior High Faculty" : "Section Silver")
  };
  saveStoredActiveUser(newUser);
  return newUser;
}

// Google Sign-In
export async function loginWithGoogle(): Promise<AppUser> {
  if (isFirebaseAvailable && auth) {
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const isTeacher = (cred.user.email || "").includes("teacher") || cred.user.email === "jfescrin@carsu.edu.ph";
      const user: AppUser = {
        uid: cred.user.uid,
        email: cred.user.email || "google_user@school.edu",
        displayName: cred.user.displayName || "Google Scholar",
        role: isTeacher ? "teacher" : "student",
        className: isTeacher ? "Senior High Faculty" : "Section Silver",
        photoURL: cred.user.photoURL || undefined
      };
      saveStoredActiveUser(user);
      return user;
    } catch (e) {
      console.warn("Google popup sign-in blocked or cancelled, falling back:", e);
    }
  }

  // Fallback Google Mock User
  const defaultGoogleUser: AppUser = {
    uid: "google_escrina",
    displayName: "Prof. J. F. Escrina",
    email: "jfescrin@carsu.edu.ph",
    role: "teacher",
    className: "Senior High Faculty"
  };
  saveStoredActiveUser(defaultGoogleUser);
  return defaultGoogleUser;
}

// Log Out User
export async function logoutUser(): Promise<void> {
  if (isFirebaseAvailable && auth) {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn("Firebase sign out failed:", e);
    }
  }
  saveStoredActiveUser(null);
}

// -------------------------------------------------------------
// SECURE DATA PERSISTENCE LAYER (Firestore + LocalStorage fallback)
// -------------------------------------------------------------
// Interfaces
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

export interface ActivityLog {
  id?: string;
  userId: string;
  studentName: string;
  action: string;
  level: number;
  details: string;
  timestamp: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  studentsCount: number;
  writingLevel: string;
  scaffoldingTier: number;
}

export type { Assignment };

// Memory database fallback for immediate offline use and testing
const getLocalPortfolio = (): PortfolioItem[] => {
  const data = localStorage.getItem("ai_balanced_portfolio");
  if (!data) {
    const initialItems = getInitialSamplePortfolios();
    saveLocalPortfolio(initialItems);
    return initialItems;
  }
  return JSON.parse(data);
};

const saveLocalPortfolio = (items: PortfolioItem[]) => {
  localStorage.setItem("ai_balanced_portfolio", JSON.stringify(items));
};

const getLocalActivities = (): ActivityLog[] => {
  const data = localStorage.getItem("ai_student_activities");
  return data ? JSON.parse(data) : [];
};

const saveLocalActivities = (activities: ActivityLog[]) => {
  localStorage.setItem("ai_student_activities", JSON.stringify(activities.slice(0, 50)));
};

// Realistic initial sample student work so the teacher has activity to review immediately
function getInitialSamplePortfolios(): PortfolioItem[] {
  return [
    {
      id: "seed_1",
      userId: "student_1",
      studentName: "Alex Rivera",
      studentEmail: "alex.rivera@school.edu",
      type: "concept_paper",
      title: "Concept Paper: Interactive Pedagogical Scaffolding in Senior High",
      draft: "Title: Interactive Pedagogical Scaffolding in Senior High School Writing\n\nBackground & Rationale: Traditional writing instruction often struggles to address diverse learner readiness. Digital scaffolding provides adaptive, real-time sentence construction prompts that guide students through iterative formulation.\n\nProject Description: This inquiry establishes a 5-tier scaffolded writing workshop. Students begin with sentence mechanics and systematically advance through paragraph synthesis to scholarly proposals.\n\nMethodology: Mixed-method design combining weekly portfolio log audits, AI-assistance balance tracking, and teacher rubric evaluations.",
      reflection: "Drafted using the predictive Smart Suggest system. Balanced 80% independent composition with selective predictive completions.",
      aiBalanceMeter: { independent: 80, aiAssisted: 20 },
      skillsPracticed: ["Concept Formulation", "Research Rationale", "Methodological Synthesis"],
      scaffoldingTier: 5,
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
      status: "pending"
    },
    {
      id: "seed_2",
      userId: "student_2",
      studentName: "Maria Santos",
      studentEmail: "maria.santos@school.edu",
      type: "essay",
      title: "Argumentative Essay: Regulating Smartphone Usage in Study Halls",
      draft: "Modern teenagers encounter persistent cognitive fragmentation when smartphones remain accessible during independent study sessions. While digital connectivity offers rapid resource retrieval, notification interruptions dismantle sustained attention. Empirical studies indicate students require up to twenty minutes to re-establish deep focus after answering a non-academic notification. Therefore, implementing scheduled device-free focus intervals safeguards academic performance.",
      reflection: "Focused on developing counterarguments and linking topic sentences with scholarly citations.",
      aiBalanceMeter: { independent: 88, aiAssisted: 12 },
      skillsPracticed: ["Argumentative Claims", "Evidence Integration", "Transition Linking"],
      scaffoldingTier: 3,
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
      status: "checked",
      score: 92,
      teacherFeedback: "Excellent argumentation Maria! Your counterpoint is well handled and your evidence is cited smoothly.",
      checkedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      checkedBy: "Teacher"
    },
    {
      id: "seed_3",
      userId: "student_3",
      studentName: "Daryl Cole",
      studentEmail: "daryl.cole@school.edu",
      type: "sentence",
      title: "Sentence Correction: Subject-Verb Agreement Drill",
      draft: "Original: The group of Grade 11 research students are presenting their findings today.\nStudent Correction: The group of Grade 11 research students is presenting its findings today.",
      reflection: "Recognized that the true grammatical subject is 'group' (collective singular), requiring the singular verb 'is'.",
      aiBalanceMeter: { independent: 95, aiAssisted: 5 },
      skillsPracticed: ["Subject-Verb Agreement", "Sentence Architecture"],
      scaffoldingTier: 1,
      createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hours ago
      status: "pending"
    },
    {
      id: "seed_4",
      userId: "student_1",
      studentName: "Alex Rivera",
      studentEmail: "alex.rivera@school.edu",
      type: "practice",
      title: "Practice Writing: Scholarly Drafting",
      draft: "Although rapid advancements in digital communication present new avenues for collaborative scholarship, maintaining critical student self-authorship remains the cornerstone of authentic academic achievement.",
      reflection: "Used real-time sentence completion to explore different transition variations.",
      aiBalanceMeter: { independent: 75, aiAssisted: 25 },
      skillsPracticed: ["Free Writing", "Sentence Completion", "Voice Development"],
      scaffoldingTier: 3,
      createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(), // 6 hours ago
      status: "checked",
      score: 88,
      teacherFeedback: "Strong complex sentence structure! Great use of the subordinating conjunction 'Although'.",
      checkedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      checkedBy: "Teacher"
    }
  ];
}

// Database APIs
export async function savePortfolioItem(item: Omit<PortfolioItem, "id" | "createdAt">): Promise<string> {
  const newItem: PortfolioItem = {
    ...item,
    status: item.status || "pending",
    createdAt: new Date().toISOString()
  };

  // Log activity
  logStudentActivity({
    userId: item.userId,
    studentName: item.studentName || "Student",
    action: `Submitted ${item.type}: "${item.title}"`,
    level: item.scaffoldingTier,
    details: item.draft.slice(0, 100) + "..."
  });

  if (isFirebaseAvailable && db) {
    try {
      const colRef = collection(db, "portfolio");
      const docRef = await addDoc(colRef, newItem);
      return docRef.id;
    } catch (e) {
      console.warn("Firestore save failed, using LocalStorage:", e);
    }
  }

  // Fallback to local storage
  const items = getLocalPortfolio();
  const id = "local_" + Math.random().toString(36).substr(2, 9);
  items.unshift({ id, ...newItem });
  saveLocalPortfolio(items);
  return id;
}

export async function getStudentPortfolio(userId: string): Promise<PortfolioItem[]> {
  if (isFirebaseAvailable && db) {
    try {
      const colRef = collection(db, "portfolio");
      const q = query(colRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const items: PortfolioItem[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as PortfolioItem);
      });
      if (items.length > 0) {
        return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    } catch (e) {
      console.warn("Firestore load failed, using LocalStorage:", e);
    }
  }

  // Fallback to local storage
  const items = getLocalPortfolio();
  return items
    .filter(item => item.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// Fetch all student submissions across all students (for Teacher View & Check)
export async function getAllStudentPortfolios(): Promise<PortfolioItem[]> {
  if (isFirebaseAvailable && db) {
    try {
      const colRef = collection(db, "portfolio");
      const querySnapshot = await getDocs(colRef);
      const items: PortfolioItem[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as PortfolioItem);
      });
      if (items.length > 0) {
        return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    } catch (e) {
      console.warn("Firestore load all failed, using LocalStorage:", e);
    }
  }

  // Fallback to local storage
  const items = getLocalPortfolio();
  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function updatePortfolioItemFeedback(
  id: string, 
  teacherFeedback: string, 
  score: number,
  status: "checked" | "needs_revision" | "pending" = "checked",
  rubricEvaluation?: Record<string, number>
): Promise<void> {
  const updatePayload = {
    teacherFeedback,
    score,
    status,
    rubricEvaluation: rubricEvaluation || {},
    checkedAt: new Date().toISOString(),
    checkedBy: "Teacher"
  };

  if (isFirebaseAvailable && db && !id.startsWith("local_") && !id.startsWith("seed_")) {
    try {
      const docRef = doc(db, "portfolio", id);
      await updateDoc(docRef, updatePayload);
      return;
    } catch (e) {
      console.warn("Firestore update failed, updating LocalStorage:", e);
    }
  }

  const items = getLocalPortfolio();
  const index = items.findIndex(item => item.id === id);
  if (index !== -1) {
    items[index] = {
      ...items[index],
      ...updatePayload
    };
    saveLocalPortfolio(items);
  }
}

// Student Real-Time Activity Log APIs
export async function logStudentActivity(activity: Omit<ActivityLog, "id" | "timestamp">): Promise<void> {
  const newActivity: ActivityLog = {
    ...activity,
    timestamp: new Date().toISOString()
  };

  if (isFirebaseAvailable && db) {
    try {
      const colRef = collection(db, "activities");
      await addDoc(colRef, newActivity);
    } catch (e) {
      // Local fallback handled below
    }
  }

  const activities = getLocalActivities();
  const id = "act_" + Math.random().toString(36).substr(2, 9);
  activities.unshift({ id, ...newActivity });
  saveLocalActivities(activities);
}

export async function getRecentActivities(): Promise<ActivityLog[]> {
  if (isFirebaseAvailable && db) {
    try {
      const colRef = collection(db, "activities");
      const querySnapshot = await getDocs(colRef);
      const items: ActivityLog[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as ActivityLog);
      });
      if (items.length > 0) {
        return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 30);
      }
    } catch (e) {
      // Fallback
    }
  }

  return getLocalActivities();
}

// -------------------------------------------------------------
// TEACHER CURRICULUM ASSIGNMENTS APIS
// -------------------------------------------------------------
const getLocalAssignments = (): Assignment[] => {
  const data = localStorage.getItem("ai_teacher_assignments");
  if (!data) {
    saveLocalAssignments(INITIAL_ASSIGNMENTS);
    return INITIAL_ASSIGNMENTS;
  }
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_ASSIGNMENTS;
  } catch {
    return INITIAL_ASSIGNMENTS;
  }
};

const saveLocalAssignments = (items: Assignment[]) => {
  localStorage.setItem("ai_teacher_assignments", JSON.stringify(items));
};

export async function getAssignments(): Promise<Assignment[]> {
  if (isFirebaseAvailable && db) {
    try {
      const colRef = collection(db, "assignments");
      const querySnapshot = await getDocs(colRef);
      const items: Assignment[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as Assignment);
      });
      if (items.length > 0) {
        return items.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      }
    } catch (e) {
      console.warn("Firestore load assignments failed, falling back to local storage:", e);
    }
  }

  return getLocalAssignments();
}

export async function saveAssignment(assignment: Assignment): Promise<string> {
  const asId = assignment.id || "as_" + Math.random().toString(36).substr(2, 9);
  const newAs: Assignment = {
    ...assignment,
    id: asId,
  };

  if (isFirebaseAvailable && db) {
    try {
      const colRef = collection(db, "assignments");
      await addDoc(colRef, newAs);
    } catch (e) {
      console.warn("Firestore save assignment failed, saving locally:", e);
    }
  }

  const items = getLocalAssignments();
  const existingIdx = items.findIndex((a) => a.id === asId);
  if (existingIdx !== -1) {
    items[existingIdx] = newAs;
  } else {
    items.unshift(newAs);
  }
  saveLocalAssignments(items);
  return asId;
}

export async function deleteAssignment(id: string): Promise<void> {
  if (isFirebaseAvailable && db && !id.startsWith("as_") && !id.startsWith("local_")) {
    try {
      const docRef = doc(db, "assignments", id);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn("Firestore delete assignment failed:", e);
    }
  }

  const items = getLocalAssignments().filter((a) => a.id !== id);
  saveLocalAssignments(items);
}

