import React, { useState, useEffect } from 'react';
import { 
  auth, 
  db, 
  onAuthStateChanged, 
  doc, 
  getDoc, 
  setDoc, 
  signOut, 
  signInWithGoogle,
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
  updateDoc,
  addDoc,
  deleteDoc
} from './firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  if (error instanceof Error && error.message.includes('insufficient permissions') && !auth.currentUser) {
    return;
  }
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { UserProfile, AdminConfig, Question, Exam, UserResponse } from './types';
import { 
  LogIn, ShieldAlert, User as UserIcon, BarChart3, Users, LogOut, Clock, 
  CheckCircle2, AlertTriangle, Eye, EyeOff, ArrowRight, Plus, 
  Lock, ChevronLeft, ChevronRight, Trash2, Play, Square, Trophy,
  LayoutDashboard, FileQuestion, Menu, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ─── Podium Animation ──────────────────────────────────────────────────────────

function PodiumCelebration({ rank, name, score, onDismiss }: { rank: 1|2|3, name: string, score: number, onDismiss: () => void }) {
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const colors = {
    1: { bg: 'from-amber-400 to-yellow-300', border: 'border-amber-300', text: 'text-amber-900', glow: 'shadow-amber-400/50' },
    2: { bg: 'from-slate-300 to-slate-200', border: 'border-slate-300', text: 'text-slate-700', glow: 'shadow-slate-400/40' },
    3: { bg: 'from-orange-400 to-amber-300', border: 'border-orange-300', text: 'text-orange-900', glow: 'shadow-orange-400/40' },
  };
  const c = colors[rank];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-md"
      onClick={onDismiss}
    >
      <motion.div
        initial={{ scale: 0.4, y: 100, rotate: -8 }}
        animate={{ scale: 1, y: 0, rotate: 0 }}
        exit={{ scale: 0.4, y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        onClick={e => e.stopPropagation()}
        className={`relative bg-gradient-to-br ${c.bg} border-2 ${c.border} rounded-3xl p-10 max-w-xs w-full text-center shadow-2xl ${c.glow}`}
      >
        {/* Confetti particles */}
        {[...Array(16)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: ['#f59e0b','#6366f1','#10b981','#ef4444','#8b5cf6','#f97316'][i % 6],
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1.5, 1], 
              opacity: [0, 1, 0],
              y: [0, -60 - Math.random() * 60],
              x: [(Math.random() - 0.5) * 80]
            }}
            transition={{ delay: 0.2 + i * 0.06, duration: 1.2 }}
          />
        ))}

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.4, 1] }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
          className="text-7xl mb-4 block"
        >
          {medals[rank]}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`text-3xl font-black ${c.text} font-display mb-1`}
        >
          {rank === 1 ? '1st Place!' : rank === 2 ? '2nd Place!' : '3rd Place!'}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className={`text-lg font-bold ${c.text} opacity-80 mb-2`}
        >
          {name}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.55 }}
          className={`inline-block px-5 py-2 bg-white/40 rounded-2xl ${c.text} font-black text-2xl mb-6`}
        >
          {score} pts
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className={`text-xs font-bold ${c.text} opacity-60 mb-5`}
        >
          You've reached the leaderboard podium!
        </motion.p>

        <button
          onClick={onDismiss}
          className={`w-full py-3 bg-white/30 hover:bg-white/50 ${c.text} font-black rounded-2xl text-sm transition-all`}
        >
          Continue
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Loading Screen ─────────────────────────────────────────────────────────────

const LoadingScreen = () => (
  <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-8"
    >
      <div className="relative">
        <div className="w-16 h-16 border-2 border-white/10 rounded-full" />
        <div className="w-16 h-16 border-2 border-white border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-black text-white tracking-tight">SecureAssess</h2>
        <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Initializing</p>
      </div>
    </motion.div>
  </div>
);

// ─── Error Boundary ─────────────────────────────────────────────────────────────

const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);
  useEffect(() => {
    const handleError = (e: ErrorEvent) => { console.error(e); setHasError(true); };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
          <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-white mb-3">System Error</h2>
          <p className="text-white/50 mb-8">Something went wrong. Please restart.</p>
          <button onClick={() => window.location.reload()} className="w-full py-3 bg-white text-slate-900 font-black rounded-2xl hover:bg-white/90 transition-all">
            Restart
          </button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

// ─── Main App ───────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminConfig, setAdminConfig] = useState<AdminConfig | null>(null);

  useEffect(() => {
    const fetchAdminConfig = async () => {
      try {
        const adminDoc = await getDoc(doc(db, 'config', 'admin'));
        if (adminDoc.exists()) {
          setAdminConfig(adminDoc.data() as AdminConfig);
        } else {
          const initialConfig: AdminConfig = { isInitialized: false };
          await setDoc(doc(db, 'config', 'admin'), initialConfig);
          setAdminConfig(initialConfig);
        }
      } catch (error) {
        console.error('Error fetching admin config:', error);
      }
    };
    fetchAdminConfig();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const profile = userDoc.data() as UserProfile;
            const adminEmails = ["ahmadabdullah007860@gmail.com", "sumansingh.ss1972@gmail.com", "wolfickbriandumbledore@gmail.com"];
            if (adminEmails.includes(firebaseUser.email || "") && profile.role !== 'admin') {
              await updateDoc(doc(db, 'users', firebaseUser.uid), { role: 'admin' });
              profile.role = 'admin';
            }
            if (profile.isTerminated) {
              await signOut(auth);
              alert("Your account has been terminated.");
              setUser(null);
            } else {
              setUser(profile);
            }
          } else {
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || 'Student',
              role: ["ahmadabdullah007860@gmail.com", "sumansingh.ss1972@gmail.com", "wolfickbriandumbledore@gmail.com"].includes(firebaseUser.email || "") ? 'admin' : 'student',
              isFlagged: false,
              isTerminated: false,
              lastActive: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
            setUser(newProfile);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${firebaseUser?.uid || 'unknown'}`);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#f4f4f6] text-slate-900 selection:bg-indigo-500/30">
        <AnimatePresence mode="wait">
          {!user ? (
            <LoginView 
              isAdminMode={isAdminMode} 
              setIsAdminMode={setIsAdminMode} 
              adminConfig={adminConfig}
              setAdminConfig={setAdminConfig}
            />
          ) : user.role === 'admin' ? (
            <AdminDashboard user={user} adminConfig={adminConfig} />
          ) : !user.rollNumber ? (
            <CompleteProfileView user={user} setUser={setUser} />
          ) : (
            <StudentDashboard user={user} setUser={setUser} />
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}

// ─── Complete Profile ────────────────────────────────────────────────────────────

function CompleteProfileView({ user, setUser }: { user: UserProfile, setUser: (u: UserProfile) => void }) {
  const [rollNumber, setRollNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNumber.trim()) { setError('Roll number is required'); return; }
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { rollNumber: rollNumber.trim() });
      setUser({ ...user, rollNumber: rollNumber.trim() });
    } catch (err: any) {
      setError('Failed to update: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="min-h-screen bg-[#0d0d0f] flex items-center justify-center p-6"
    >
      <div className="max-w-sm w-full">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <UserIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2">One More Step</h2>
          <p className="text-white/40 text-sm font-medium">Enter your university roll number to continue.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text" required value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            placeholder="University Roll Number"
            className="w-full px-5 py-4 bg-white/8 border border-white/10 rounded-2xl text-white placeholder-white/30 font-bold text-sm focus:outline-none focus:border-indigo-500/60 focus:bg-white/10 transition-all"
          />
          {error && <p className="text-rose-400 text-xs font-bold">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-black rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Continue'}
          </button>
        </form>
      </div>
    </motion.div>
  );
}

// ─── Login View ─────────────────────────────────────────────────────────────────

function LoginView({ isAdminMode, setIsAdminMode, adminConfig, setAdminConfig }: any) {
  const [adminIdentifier, setAdminIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Roll number gate for students
  const [rollInput, setRollInput] = useState('');
  const [rollStep, setRollStep] = useState(false); // show roll number input before google sign-in
  const [pendingGoogleLogin, setPendingGoogleLogin] = useState(false);

  const handleStudentGoogleLogin = async () => {
    if (!rollInput.trim()) { setError('Please enter your roll number first'); return; }
    setPendingGoogleLogin(true);
    setError('');
    try {
      // Sign in with Google — after auth, if the user doc doesn't have rollNumber, we set it via CompleteProfileView
      // But we also store it in sessionStorage so we can auto-populate after Google redirect
      sessionStorage.setItem('pendingRollNumber', rollInput.trim());
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPendingGoogleLogin(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!adminConfig?.isInitialized) { setIsSettingUp(true); return; }
    try {
      const loginEmail = adminIdentifier.includes('@') ? adminIdentifier : adminConfig.email!;
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        // success
      } else {
        await signOut(auth);
        setError('Unauthorized access');
      }
    } catch (err: any) {
      if (adminIdentifier === adminConfig.hashcode && password === adminConfig.passwordHash) {
        try {
          await signInWithEmailAndPassword(auth, adminConfig.email!, password);
        } catch (e: any) {
          setError('Hashcode login failed: ' + e.message);
        }
      } else {
        setError('Invalid credentials');
      }
    }
  };

  const handleAdminSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, adminIdentifier, password);
      const newHashcode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const newConfig = { email: adminIdentifier, passwordHash: password, hashcode: newHashcode, isInitialized: true };
      await setDoc(doc(db, 'config', 'admin'), newConfig);
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid, email: adminIdentifier, displayName: 'Administrator',
        role: 'admin', isFlagged: false, isTerminated: false, lastActive: new Date().toISOString()
      });
      setAdminConfig(newConfig);
      setIsSettingUp(false);
      alert(`Admin setup complete! Hashcode: ${newHashcode}`);
    } catch (err: any) {
      setError('Setup failed: ' + err.message);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center bg-[#0d0d0f] p-6"
    >
      {/* Grid bg */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      
      <div className="relative max-w-sm w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
            className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl"
          >
            <ShieldAlert className="w-7 h-7 text-slate-900" />
          </motion.div>
          <h1 className="text-3xl font-black text-white tracking-tight">SecureAssess</h1>
          <p className="text-white/30 text-xs font-bold uppercase tracking-[0.25em] mt-1">BBDU Assessment Portal</p>
        </div>

        {/* Card */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          className="bg-white/5 border border-white/10 rounded-3xl p-7 backdrop-blur-sm"
        >
          {/* Tab Toggle */}
          <div className="flex p-1 bg-white/5 rounded-2xl mb-7">
            <button onClick={() => { setIsAdminMode(false); setIsSettingUp(false); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!isAdminMode ? 'bg-white text-slate-900' : 'text-white/40 hover:text-white/70'}`}>
              Student
            </button>
            <button onClick={() => { setIsAdminMode(true); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isAdminMode ? 'bg-white text-slate-900' : 'text-white/40 hover:text-white/70'}`}>
              Admin
            </button>
          </div>

          <AnimatePresence mode="wait">
            {!isAdminMode ? (
              <motion.div key="student" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                className="space-y-5"
              >
                <p className="text-white/50 text-sm font-medium text-center leading-relaxed">
                  Enter your roll number, then sign in with your institutional Google account.
                </p>
                <input
                  type="text"
                  placeholder="University Roll Number"
                  value={rollInput}
                  onChange={e => setRollInput(e.target.value)}
                  className="w-full px-5 py-4 bg-white/8 border border-white/10 rounded-2xl text-white placeholder-white/25 font-bold text-sm focus:outline-none focus:border-indigo-500/60 transition-all"
                />
                {error && <p className="text-rose-400 text-xs font-bold">{error}</p>}
                <button onClick={handleStudentGoogleLogin} disabled={pendingGoogleLogin}
                  className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 font-black py-4 px-6 rounded-2xl hover:bg-white/90 transition-all disabled:opacity-60 text-sm"
                >
                  {pendingGoogleLogin ? (
                    <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
                  ) : (
                    <>
                      <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                      Continue with Google
                    </>
                  )}
                </button>
              </motion.div>
            ) : (
              <motion.form key="admin" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                onSubmit={isSettingUp ? handleAdminSetup : handleAdminLogin}
                className="space-y-4"
              >
                {isSettingUp && (
                  <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-300 text-xs font-bold">
                    First-time setup: create the administrator account.
                  </div>
                )}
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/25" />
                  <input type="text" placeholder={isSettingUp ? "Admin Email" : "Email or Hashcode"}
                    className="w-full pl-12 pr-5 py-4 bg-white/8 border border-white/10 rounded-2xl text-white placeholder-white/25 font-bold text-sm focus:outline-none focus:border-indigo-500/60 transition-all"
                    value={adminIdentifier} onChange={(e) => setAdminIdentifier(e.target.value)} required />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/25" />
                  <input type={showPassword ? "text" : "password"} placeholder="Password"
                    className="w-full pl-12 pr-12 py-4 bg-white/8 border border-white/10 rounded-2xl text-white placeholder-white/25 font-bold text-sm focus:outline-none focus:border-indigo-500/60 transition-all"
                    value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {error && <p className="text-rose-400 text-xs font-bold">{error}</p>}
                <button type="submit" className="w-full py-4 bg-white text-slate-900 font-black rounded-2xl hover:bg-white/90 transition-all text-sm mt-2">
                  {isSettingUp ? 'Initialize Admin' : 'Access Dashboard'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        <p className="text-center text-white/15 text-[10px] font-bold uppercase tracking-widest">© 2026 SecureAssess</p>
      </div>
    </motion.div>
  );
}

// ─── Student Dashboard ───────────────────────────────────────────────────────────

function StudentDashboard({ user, setUser }: { user: UserProfile, setUser: (u: UserProfile) => void }) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [examFinished, setExamFinished] = useState(false);
  const [responses, setResponses] = useState<Record<string, { option: number, timeTaken: number, score: number }>>({});
  const responsesRef = React.useRef<Record<string, { option: number, timeTaken: number, score: number }>>({});
  const questionsRef = React.useRef<Question[]>([]);
  const selectedExamRef = React.useRef<Exam | null>(null);
  const isFinishingRef = React.useRef(false);
  const terminatedAtOnStartRef = React.useRef<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(3600);
  // Podium celebration
  const [podiumData, setPodiumData] = useState<{ rank: 1|2|3, name: string, score: number } | null>(null);
  const [allResponses, setAllResponses] = useState<UserResponse[]>([]);

  useEffect(() => { responsesRef.current = responses; }, [responses]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);
  useEffect(() => { selectedExamRef.current = selectedExam; }, [selectedExam]);

  useEffect(() => {
    if (!isExamStarted || examFinished) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timer); handleFinishExam(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isExamStarted, examFinished]);

  useEffect(() => {
    if (!isExamStarted || examFinished || !selectedExam) return;
    const unsub = onSnapshot(doc(db, 'exams', selectedExam.id), (snap) => {
      const data = snap.data();
      const terminatedAt = data?.terminatedAt ?? null;
      if (terminatedAt && terminatedAt !== terminatedAtOnStartRef.current) {
        handleFinishExam();
      }
    });
    return () => unsub();
  }, [isExamStarted, examFinished, selectedExam]);

  // Only show exams that are "started" by admin (isStarted: true)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'exams'), (snap) => {
      setExams(snap.docs.map(d => ({ id: d.id, ...d.data() } as Exam)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'exams'));
    return () => unsub();
  }, []);

  // Listen to all responses for leaderboard
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'responses'), (snap) => {
      setAllResponses(snap.docs.map(d => d.data() as UserResponse));
    });
    return () => unsub();
  }, []);

  const handleSelectExam = async (exam: Exam) => {
    if ((user.submittedExams ?? []).includes(exam.id)) {
      alert("You have already submitted this exam.");
      return;
    }
    try {
      const qSnap = await getDocs(query(collection(db, 'questions'), where('examId', '==', exam.id)));
      const examQuestions = qSnap.docs.map(d => ({ id: d.id, ...d.data() } as Question));
      if (examQuestions.length === 0) { alert("This exam has no questions yet."); return; }
      setTimeLeft(exam.timeLimit * 60);
      const rSnap = await getDocs(query(collection(db, 'responses'), where('userId', '==', user.uid), where('examId', '==', exam.id)));
      const existingResponses: Record<string, { option: number, timeTaken: number, score: number }> = {};
      rSnap.docs.forEach(d => {
        const data = d.data();
        if (data.selectedOption !== -1) {
          existingResponses[data.questionId] = { option: data.selectedOption, timeTaken: data.timeTaken, score: data.score };
        }
      });
      setResponses(existingResponses);
      setQuestions(examQuestions);
      setSelectedExam(exam);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'exams/responses');
    }
  };

  const handleStartExam = async () => {
    if (!selectedExam) return;
    if ((user.submittedExams ?? []).includes(selectedExam.id)) {
      alert("You have already submitted this exam."); setSelectedExam(null); return;
    }
    try {
      const examSnap = await getDoc(doc(db, 'exams', selectedExam.id));
      terminatedAtOnStartRef.current = examSnap.data()?.terminatedAt ?? null;
      isFinishingRef.current = false;
      await updateDoc(doc(db, 'users', user.uid), { activeExamId: selectedExam.id, examStartTime: new Date().toISOString() });
      setIsExamStarted(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'users');
    }
  };

  const handleFinishExam = async () => {
    if (isFinishingRef.current) return;
    isFinishingRef.current = true;
    setExamFinished(true);
    const currentResponses = responsesRef.current;
    const currentQuestions = questionsRef.current;
    const currentExam = selectedExamRef.current;
    if (!currentExam) return;

    try {
      const alreadySubmitted = user.submittedExams ?? [];
      const updatedSubmittedExams = alreadySubmitted.includes(currentExam.id) ? alreadySubmitted : [...alreadySubmitted, currentExam.id];
      await updateDoc(doc(db, 'users', user.uid), {
        activeExamId: null, examStartTime: null,
        lastActive: new Date().toISOString(), submittedExams: updatedSubmittedExams
      });
      setUser({ ...user, submittedExams: updatedSubmittedExams, activeExamId: undefined, examStartTime: undefined });

      for (const [qId, data] of Object.entries(currentResponses) as [string, { option: number, timeTaken: number, score: number }][]) {
        const question = currentQuestions.find(q => q.id === qId);
        if (!question) continue;
        await setDoc(doc(db, 'responses', `${user.uid}_${qId}`), {
          userId: user.uid, examId: currentExam.id, questionId: qId,
          selectedOption: data.option, timestamp: new Date().toISOString(),
          isCorrect: data.option === question.correctAnswer, timeTaken: data.timeTaken, score: data.score
        });
      }

      // Check for top 3 after submitting
      const myScore = Object.values(currentResponses).reduce((sum, r) => sum + r.score, 0);
      // We'll show podium if they're in top 3 — use a quick check via allResponses
      setTimeout(() => checkPodium(user.uid, myScore), 1000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'responses');
    }
  };

  const checkPodium = async (uid: string, myScore: number) => {
    try {
      const rSnap = await getDocs(collection(db, 'responses'));
      const allR = rSnap.docs.map(d => d.data() as UserResponse);
      const uSnap = await getDocs(collection(db, 'users'));
      const allUsers = uSnap.docs.map(d => d.data() as UserProfile);

      const studentScores: Record<string, number> = {};
      allR.forEach(r => { studentScores[r.userId] = (studentScores[r.userId] || 0) + (r.score || 0); });

      const sorted = Object.entries(studentScores).sort(([, a], [, b]) => b - a);
      const myRank = sorted.findIndex(([id]) => id === uid) + 1;

      if (myRank >= 1 && myRank <= 3) {
        setPodiumData({ rank: myRank as 1|2|3, name: user.displayName, score: myScore });
      }
    } catch (e) { /* ignore */ }
  };

  if (examFinished && !podiumData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#f4f4f6]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-sm w-full text-center bg-white rounded-3xl shadow-xl shadow-slate-200 p-10 border border-slate-100"
        >
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-emerald-100">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Submitted!</h2>
          <p className="text-slate-500 font-medium mb-8 text-sm leading-relaxed">Your responses have been saved successfully.</p>
          <button onClick={() => signOut(auth)} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 text-sm">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </motion.div>
      </div>
    );
  }

  if (isExamStarted) {
    return (
      <>
        <MCQInterface questions={questions} responses={responses} setResponses={setResponses}
          timeLeft={timeLeft} onFinish={handleFinishExam} userId={user.uid} examId={selectedExam?.id} />
        <AnimatePresence>
          {podiumData && (
            <PodiumCelebration rank={podiumData.rank} name={podiumData.name} score={podiumData.score} onDismiss={() => setPodiumData(null)} />
          )}
        </AnimatePresence>
      </>
    );
  }

  const visibleExams = exams.filter(e => e.isStarted && e.isActive && !(e as any).terminatedAt);

  return (
    <>
      <AnimatePresence>
        {podiumData && (
          <PodiumCelebration rank={podiumData.rank} name={podiumData.name} score={podiumData.score} onDismiss={() => setPodiumData(null)} />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-[#f4f4f6]">
        <div className="max-w-lg mx-auto px-4 pt-8 pb-20">
          {user.isFlagged && (
            <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-700">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="text-xs font-bold">Account flagged for suspicious activity.</p>
            </div>
          )}

          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-xl font-black text-slate-900">Hi, {user.displayName.split(' ')[0]} 👋</h1>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">{user.rollNumber} · {user.email}</p>
            </div>
            <button onClick={() => signOut(auth)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {!selectedExam ? (
            <div className="space-y-4">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Available Assessments</h2>
              <div className="space-y-3">
                {visibleExams.map(exam => {
                  const isSubmitted = (user.submittedExams ?? []).includes(exam.id);
                  return (
                    <motion.button whileTap={isSubmitted ? {} : { scale: 0.98 }} key={exam.id}
                      onClick={() => !isSubmitted && handleSelectExam(exam)}
                      disabled={isSubmitted}
                      className={`bg-white rounded-2xl p-5 text-left w-full flex items-center gap-4 shadow-sm border border-slate-100 transition-all ${isSubmitted ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md hover:border-slate-200'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSubmitted ? 'bg-emerald-50 text-emerald-500' : 'bg-indigo-50 text-indigo-600'}`}>
                        {isSubmitted ? <CheckCircle2 className="w-5 h-5" /> : <BarChart3 className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-black text-slate-900 truncate">{exam.name}</h3>
                        <p className="text-slate-400 text-xs font-medium truncate mt-0.5">{isSubmitted ? 'Already submitted' : exam.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isSubmitted ? (
                          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Done</span>
                        ) : (
                          <>
                            <span className="text-[9px] font-black text-slate-400">{exam.timeLimit}m</span>
                            <ArrowRight className="w-4 h-4 text-slate-300" />
                          </>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
                {visibleExams.length === 0 && (
                  <div className="bg-white rounded-2xl p-10 text-center border border-slate-100">
                    <Clock className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-black text-slate-600 mb-1">No assessments available</p>
                    <p className="text-xs text-slate-400 font-medium">Check back later or contact your admin.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <button onClick={() => setSelectedExam(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-black text-slate-900 truncate">{selectedExam.name}</h2>
              </div>
              <div className="bg-white rounded-2xl p-5 space-y-5 border border-slate-100 shadow-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-slate-900">{questions.length}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Questions</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-slate-900">{selectedExam.timeLimit}m</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Time Limit</p>
                  </div>
                </div>
                <div className="bg-indigo-50 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-indigo-900">Speed Bonus</p>
                    <p className="text-[11px] text-indigo-600 font-medium">Answer in ≤10s for max 10 points</p>
                  </div>
                </div>
                <div className="bg-rose-50 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-rose-800">Proctored Exam</p>
                    <p className="text-[11px] text-rose-500 font-medium">Tab switching will flag your account</p>
                  </div>
                </div>
                <button onClick={handleStartExam} className="w-full py-4 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all text-sm flex items-center justify-center gap-2">
                  Begin Assessment <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── MCQ Interface ───────────────────────────────────────────────────────────────

function MCQInterface({ questions, responses, setResponses, timeLeft, onFinish, userId, examId }: any) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [pendingSelection, setPendingSelection] = useState<number | null>(null);
  const firstTapTime = React.useRef<number | null>(null);
  const q = questions[currentIdx];

  useEffect(() => {
    setQuestionStartTime(Date.now());
    setPendingSelection(null);
    firstTapTime.current = null;
    if (responses[questions[currentIdx]?.id] !== undefined) {
      setPendingSelection(responses[questions[currentIdx].id].option);
    }
  }, [currentIdx]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const currentResponse = responses[q.id];
      if (!currentResponse) return;
      try {
        await setDoc(doc(db, 'responses', `${userId}_${q.id}`), {
          userId, examId, questionId: q.id, selectedOption: currentResponse.option,
          timestamp: new Date().toISOString(), isCorrect: currentResponse.option === q.correctAnswer,
          timeTaken: currentResponse.timeTaken, score: currentResponse.score
        });
      } catch (error) { console.error('Auto-save failed:', error); }
    }, 30000);
    return () => clearInterval(interval);
  }, [currentIdx, responses, q, userId, examId]);

  const handleTap = (idx: number) => {
    if (!firstTapTime.current) firstTapTime.current = Date.now();
    setPendingSelection(idx);
  };

  const handleConfirmAndAdvance = async () => {
    if (pendingSelection === null) return;
    const timeToFirstTap = firstTapTime.current
      ? Math.max(1, Math.round((firstTapTime.current - questionStartTime) / 1000))
      : Math.max(1, Math.round((Date.now() - questionStartTime) / 1000));
    const isCorrect = pendingSelection === q.correctAnswer;
    let score = 0;
    if (isCorrect) {
      score = timeToFirstTap <= 10 ? 10 : Math.max(1, Math.round(10 - ((timeToFirstTap - 10) / 50) * 9));
    }
    const newTimeTaken = (responses[q.id]?.timeTaken || 0) + timeToFirstTap;
    const responseData = { option: pendingSelection, timeTaken: newTimeTaken, score };
    setResponses((prev: any) => ({ ...prev, [q.id]: responseData }));
    setQuestionStartTime(Date.now());
    try {
      await setDoc(doc(db, 'responses', `${userId}_${q.id}`), {
        userId, examId, questionId: q.id, selectedOption: pendingSelection,
        timestamp: new Date().toISOString(), isCorrect, timeTaken: newTimeTaken, score
      });
    } catch (error) { console.error('Confirm save failed:', error); }
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      onFinish();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f6]">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <div className="h-1 bg-slate-100 w-full">
          <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-indigo-600 transition-all" />
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${timeLeft < 300 ? 'text-rose-500' : 'text-slate-400'}`} />
            <span className={`text-lg font-black font-mono tracking-tight ${timeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-slate-900'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <span className="text-xs font-black text-slate-400">{currentIdx + 1} / {questions.length}</span>
          <button onClick={onFinish} className="bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider">
            Submit
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-lg w-full mx-auto px-4 pt-5 pb-24">
        <AnimatePresence mode="wait">
          <motion.div key={currentIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }} className="space-y-4"
          >
            <div className="flex gap-1.5 flex-wrap">
              <span className="px-2.5 py-1 bg-slate-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest">{q.section}</span>
              <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                q.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                q.difficulty === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                'bg-rose-50 text-rose-600 border-rose-100'}`}>
                {q.difficulty}
              </span>
            </div>
            <h2 className="text-base font-black text-slate-900 leading-snug">{q.text}</h2>
            <div className="space-y-2.5">
              {q.options.map((option: string, idx: number) => {
                const isSelected = pendingSelection === idx;
                return (
                  <button key={idx} onClick={() => handleTap(idx)}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left active:scale-[0.98] ${
                      isSelected ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-100 text-slate-700 hover:border-slate-300 hover:bg-slate-50'}`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black shrink-0 transition-colors ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="text-sm font-semibold flex-1 leading-snug">{option}</span>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-white/80 shrink-0" />}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between items-center pt-2">
              <div className="flex gap-1 overflow-x-auto max-w-[55%]">
                {questions.map((_: any, i: number) => (
                  <div key={i} className={`shrink-0 h-1.5 rounded-full transition-all duration-300 ${
                    i === currentIdx ? `w-5 ${pendingSelection !== null ? 'bg-indigo-600' : 'bg-slate-400'}` :
                    responses[questions[i].id] ? 'w-1.5 bg-indigo-400' : 'w-1.5 bg-slate-200'}`} />
                ))}
              </div>
              <button disabled={pendingSelection === null} onClick={handleConfirmAndAdvance}
                className={`flex items-center gap-1.5 px-5 py-2.5 text-xs font-black rounded-xl transition-all active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed ${
                  currentIdx === questions.length - 1 ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'}`}
              >
                {currentIdx === questions.length - 1 ? 'Submit' : 'Next'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

// ─── Admin Dashboard ─────────────────────────────────────────────────────────────

function AdminDashboard({ user, adminConfig }: { user: UserProfile, adminConfig: AdminConfig | null }) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'exams' | 'questions' | 'settings'>('analytics');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [responses, setResponses] = useState<UserResponse[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [newExamName, setNewExamName] = useState('');
  const [newExamDesc, setNewExamDesc] = useState('');
  const [newExamTimeLimit, setNewExamTimeLimit] = useState('60');
  const [selectedExamForQuestions, setSelectedExamForQuestions] = useState<Exam | null>(null);
  const [analyticsExamFilter, setAnalyticsExamFilter] = useState<string>('all');
  const [questionAddMode, setQuestionAddMode] = useState<'manual' | 'ai'>('manual');
  const [aiTopic, setAiTopic] = useState('');
  const [aiSection, setAiSection] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [aiCount, setAiCount] = useState(5);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPreview, setAiPreview] = useState<{ text: string; options: string[]; correctAnswer: number; section: string; difficulty: string }[]>([]);
  const [aiError, setAiError] = useState('');
  const [savingAi, setSavingAi] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ examId: string; examName: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const uUnsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => d.data() as UserProfile));
    }, (e) => handleFirestoreError(e, OperationType.GET, 'users'));
    const rUnsub = onSnapshot(collection(db, 'responses'), (snap) => {
      setResponses(snap.docs.map(d => d.data() as UserResponse));
    }, (e) => handleFirestoreError(e, OperationType.GET, 'responses'));
    const qUnsub = onSnapshot(collection(db, 'questions'), (snap) => {
      setQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Question)));
    }, (e) => handleFirestoreError(e, OperationType.GET, 'questions'));
    const eUnsub = onSnapshot(collection(db, 'exams'), (snap) => {
      setExams(snap.docs.map(d => ({ id: d.id, ...d.data() } as Exam)));
    }, (e) => handleFirestoreError(e, OperationType.GET, 'exams'));
    return () => { uUnsub(); rUnsub(); qUnsub(); eUnsub(); };
  }, []);

  const createExam = async () => {
    if (!newExamName) return;
    await addDoc(collection(db, 'exams'), {
      name: newExamName, description: newExamDesc,
      timeLimit: parseInt(newExamTimeLimit) || 60,
      createdAt: new Date().toISOString(),
      isActive: true,
      isStarted: false  // NEW: not visible to students until admin starts it
    });
    setNewExamName(''); setNewExamDesc(''); setNewExamTimeLimit('60');
    showToast('Exam created successfully', 'success');
  };

  const toggleFlag = async (uid: string, current: boolean) => {
    await updateDoc(doc(db, 'users', uid), { isFlagged: !current });
  };

  const toggleTerminate = async (uid: string, current: boolean) => {
    await updateDoc(doc(db, 'users', uid), { isTerminated: !current });
  };

  const startExam = async (id: string) => {
    await updateDoc(doc(db, 'exams', id), { isStarted: true, isActive: true, terminatedAt: null });
    showToast('Exam is now live for students', 'success');
  };

  const terminateExam = (examId: string, examName: string) => {
    setConfirmModal({ examId, examName });
  };

  const doTerminateExam = async () => {
    if (!confirmModal) return;
    const { examId, examName } = confirmModal;
    setConfirmModal(null);
    try {
      await updateDoc(doc(db, 'exams', examId), { terminatedAt: new Date().toISOString(), isActive: false, isStarted: false });
      const activeUsers = users.filter(u => u.activeExamId === examId);
      for (const u of activeUsers) {
        try {
          const alreadySubmitted = u.submittedExams ?? [];
          const updatedSubmittedExams = alreadySubmitted.includes(examId) ? alreadySubmitted : [...alreadySubmitted, examId];
          await updateDoc(doc(db, 'users', u.uid), { activeExamId: null, examStartTime: null, lastActive: new Date().toISOString(), submittedExams: updatedSubmittedExams });
        } catch (err) { console.error(`Failed to force-submit user ${u.uid}:`, err); }
      }
      showToast(`"${examName}" terminated. ${activeUsers.length} session(s) force-submitted.`, 'success');
    } catch (err: any) {
      showToast(`Failed to terminate: ${err.message}`, 'error');
    }
  };

  const resetExamTermination = async (examId: string) => {
    await updateDoc(doc(db, 'exams', examId), { terminatedAt: null, isActive: true, isStarted: true });
    for (const u of users) {
      if ((u.submittedExams ?? []).includes(examId)) {
        try {
          await updateDoc(doc(db, 'users', u.uid), { submittedExams: (u.submittedExams ?? []).filter((id: string) => id !== examId) });
        } catch (err) { console.error(`Failed to reset user ${u.uid}:`, err); }
      }
    }
    showToast('Exam reopened', 'success');
  };

  const deleteQuestion = async (qId: string) => {
    if (!confirm('Delete this question?')) return;
    try {
      await deleteDoc(doc(db, 'questions', qId));
      showToast('Question deleted', 'success');
    } catch (err: any) {
      showToast('Failed to delete: ' + err.message, 'error');
    }
  };

  const filteredResponses = analyticsExamFilter === 'all' ? responses : responses.filter(r => r.examId === analyticsExamFilter);

  const studentRankingData = users
    .filter(u => u.role === 'student')
    .map(student => {
      const studentResponses = filteredResponses.filter(r => r.userId === student.uid);
      const totalScore = studentResponses.reduce((sum, r) => sum + (r.score || 0), 0);
      const examBreakdown = exams.map(exam => {
        const examR = responses.filter(r => r.userId === student.uid && r.examId === exam.id);
        return { examName: exam.name, score: examR.reduce((s, r) => s + (r.score || 0), 0), count: examR.length };
      }).filter(e => e.count > 0);
      return { student, totalScore, totalResponses: studentResponses.length, examBreakdown };
    })
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  const navItems = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'users', label: 'Students', icon: Users },
    { id: 'exams', label: 'Exams', icon: ShieldAlert },
    { id: 'questions', label: 'Assessments', icon: FileQuestion },
    { id: 'settings', label: 'Settings', icon: UserIcon },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f4f6]">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-bold max-w-sm w-full ${
              toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}
          >
            <span>{toast.type === 'success' ? '✓' : '✕'}</span>
            <span className="flex-1">{toast.message}</span>
            <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm modal */}
      <AnimatePresence>
        {confirmModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[998] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setConfirmModal(null)}
          >
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full border border-slate-100"
            >
              <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mb-5 border border-rose-100">
                <Square className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Terminate Exam?</h3>
              <p className="text-sm text-slate-500 font-medium mb-1"><span className="font-black text-slate-800">"{confirmModal.examName}"</span> will be ended for all students.</p>
              <p className="text-xs text-slate-400 font-medium mb-7">All active sessions will be force-submitted. This cannot be undone without reopening.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmModal(null)} className="flex-1 py-3 bg-slate-100 text-slate-700 text-xs font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest">Cancel</button>
                <button onClick={doTerminateExam} className="flex-1 py-3 bg-rose-500 text-white text-xs font-black rounded-2xl hover:bg-rose-600 transition-all uppercase tracking-widest">Terminate</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* ── SIDEBAR ── */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-slate-100 transition-all duration-300 ease-in-out
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-60'}
        w-60
      `}>
        {/* Sidebar header */}
        <div className={`flex items-center border-b border-slate-100 h-16 px-3 ${sidebarCollapsed ? 'justify-center' : 'justify-between px-4'}`}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-sm text-slate-900">SecureAssess</span>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-white" />
            </div>
          )}
          {/* Collapse toggle - desktop only */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-700 transition-all"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          {/* Mobile close */}
          <button onClick={() => setMobileSidebarOpen(false)} className="lg:hidden p-1.5 hover:bg-slate-50 rounded-lg text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button key={item.id}
              onClick={() => { setActiveTab(item.id as any); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center rounded-xl transition-all group relative ${sidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'} ${
                activeTab === item.id ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!sidebarCollapsed && <span className="text-sm font-black">{item.label}</span>}
              {/* Tooltip when collapsed */}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </button>
          ))}
        </nav>

        {/* User & signout */}
        <div className={`border-t border-slate-100 p-2 ${sidebarCollapsed ? '' : ''}`}>
          {!sidebarCollapsed && (
            <div className="px-3 py-2 mb-1">
              <p className="text-xs font-black text-slate-900 truncate">{user.displayName}</p>
              <p className="text-[10px] text-slate-400 font-medium truncate">{user.email}</p>
            </div>
          )}
          <button onClick={() => signOut(auth)}
            className={`w-full flex items-center rounded-xl text-rose-500 hover:bg-rose-50 transition-all ${sidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'}`}
            title={sidebarCollapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-black">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 overflow-y-auto relative min-w-0">
        {/* Mobile topbar */}
        <header className="lg:hidden h-14 border-b border-slate-200 px-4 flex items-center justify-between bg-white/80 backdrop-blur-xl sticky top-0 z-30">
          <button onClick={() => setMobileSidebarOpen(true)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
            <Menu className="w-5 h-5 text-slate-500" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-900 rounded-md flex items-center justify-center">
              <ShieldAlert className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-black text-sm text-slate-900">Admin Portal</span>
          </div>
          <div className="w-8" />
        </header>

        <div className="p-6 lg:p-10 max-w-[1400px] mx-auto">
          <AnimatePresence mode="wait">

            {/* ── ANALYTICS ── */}
            {activeTab === 'analytics' && (
              <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                  <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Analytics</h1>
                    <p className="text-slate-500 font-medium mt-1">Performance metrics across all assessments.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-end">
                    <div className="w-full sm:w-52">
                      <select value={analyticsExamFilter} onChange={(e) => setAnalyticsExamFilter(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:border-indigo-400 transition-all">
                        <option value="all">All Exams</option>
                        {exams.map(exam => <option key={exam.id} value={exam.id}>{exam.name}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                      <div className="flex-1 sm:flex-none bg-white rounded-xl px-5 py-4 border border-slate-100 shadow-sm text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Students</p>
                        <p className="text-3xl font-black text-slate-900">{users.filter(u => u.role === 'student').length}</p>
                      </div>
                      <div className="flex-1 sm:flex-none bg-white rounded-xl px-5 py-4 border border-slate-100 shadow-sm text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Responses</p>
                        <p className="text-3xl font-black text-slate-900">{filteredResponses.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Student Rankings */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">Student Rankings</h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        {analyticsExamFilter === 'all' ? 'Total scores across all exams' : `Scores for: ${exams.find(e => e.id === analyticsExamFilter)?.name}`}
                      </p>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      {studentRankingData.length} students
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                      <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 border-b border-slate-100">
                        <tr>
                          <th className="px-7 py-4">Rank</th>
                          <th className="px-7 py-4">Student</th>
                          <th className="px-7 py-4">Roll No.</th>
                          <th className="px-7 py-4">Score</th>
                          <th className="px-7 py-4">Breakdown</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {studentRankingData.length === 0 ? (
                          <tr><td colSpan={5} className="px-7 py-10 text-center text-slate-400 text-sm italic">No data yet.</td></tr>
                        ) : studentRankingData.map((item) => (
                          <tr key={item.student.uid} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-7 py-5">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                                item.rank === 1 ? 'bg-amber-400 text-white' :
                                item.rank === 2 ? 'bg-slate-300 text-white' :
                                item.rank === 3 ? 'bg-orange-400 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                #{item.rank}
                              </div>
                            </td>
                            <td className="px-7 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-sm">
                                  {item.student.displayName[0]}
                                </div>
                                <div>
                                  <p className="font-black text-slate-900 text-sm">{item.student.displayName}</p>
                                  <p className="text-[11px] text-slate-400">{item.student.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-7 py-5"><span className="font-black text-slate-700 text-sm">{item.student.rollNumber || '—'}</span></td>
                            <td className="px-7 py-5"><span className="text-2xl font-black text-slate-900">{item.totalScore}</span></td>
                            <td className="px-7 py-5">
                              <div className="flex flex-wrap gap-1.5">
                                {item.examBreakdown.map((eb, idx) => (
                                  <span key={idx} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-lg border border-indigo-100 whitespace-nowrap">
                                    {eb.examName}: {eb.score}
                                  </span>
                                ))}
                                {item.examBreakdown.length === 0 && <span className="text-slate-300 text-sm italic">—</span>}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STUDENTS ── */}
            {activeTab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-7">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Students</h1>
                    <p className="text-slate-500 font-medium mt-1">{users.filter(u => u.role === 'student').length} registered</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[700px]">
                      <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 border-b border-slate-100">
                        <tr>
                          <th className="px-7 py-4">Student</th>
                          <th className="px-7 py-4">Roll No.</th>
                          <th className="px-7 py-4">Status</th>
                          <th className="px-7 py-4">Timer</th>
                          <th className="px-7 py-4">Last Active</th>
                          <th className="px-7 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {users.filter(u => u.role === 'student').map((u) => (
                          <tr key={u.uid} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-7 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black">
                                  {u.displayName[0]}
                                </div>
                                <div>
                                  <p className="font-black text-slate-900 text-sm">{u.displayName}</p>
                                  <p className="text-[11px] text-slate-400">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-7 py-5"><span className="font-black text-slate-700 text-sm">{u.rollNumber || '—'}</span></td>
                            <td className="px-7 py-5">
                              <div className="flex gap-1.5 flex-wrap">
                                {u.isFlagged && <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-lg border border-amber-100 uppercase">Flagged</span>}
                                {u.isTerminated && <span className="px-2.5 py-1 bg-rose-50 text-rose-600 text-[10px] font-black rounded-lg border border-rose-100 uppercase">Terminated</span>}
                                {u.activeExamId && <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg border border-indigo-100 uppercase animate-pulse">In Exam</span>}
                                {!u.isFlagged && !u.isTerminated && !u.activeExamId && <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg border border-emerald-100 uppercase">Active</span>}
                              </div>
                            </td>
                            <td className="px-7 py-5">
                              {u.activeExamId && u.examStartTime ? (
                                <div className="flex items-center gap-2 text-rose-500 font-black font-mono text-sm">
                                  <Clock className="w-4 h-4" />
                                  {(() => {
                                    const exam = exams.find(e => e.id === u.activeExamId);
                                    if (!exam) return '—';
                                    const elapsed = Math.floor((Date.now() - new Date(u.examStartTime).getTime()) / 1000);
                                    const remaining = Math.max(0, exam.timeLimit * 60 - elapsed);
                                    const m = Math.floor(remaining / 60);
                                    const s = remaining % 60;
                                    return `${m}:${s.toString().padStart(2, '0')}`;
                                  })()}
                                </div>
                              ) : <span className="text-slate-300 text-sm italic">—</span>}
                            </td>
                            <td className="px-7 py-5 text-xs text-slate-400 font-bold">
                              {u.lastActive ? new Date(u.lastActive).toLocaleString() : 'Never'}
                            </td>
                            <td className="px-7 py-5 text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => toggleFlag(u.uid, u.isFlagged)}
                                  className={`p-2.5 rounded-xl transition-all ${u.isFlagged ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400 hover:text-amber-600 hover:bg-amber-50'}`}>
                                  <AlertTriangle className="w-5 h-5" />
                                </button>
                                <button onClick={() => toggleTerminate(u.uid, u.isTerminated)}
                                  className={`p-2.5 rounded-xl transition-all ${u.isTerminated ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`}>
                                  <ShieldAlert className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── EXAMS ── */}
            {activeTab === 'exams' && (
              <motion.div key="exams" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-7">
                <div>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight">Exams</h1>
                  <p className="text-slate-500 font-medium mt-1">Create exam containers and control their visibility to students.</p>
                </div>

                {/* Create Exam */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7 space-y-6">
                  <h3 className="text-lg font-black text-slate-900">Create New Exam</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Title</label>
                      <input type="text" placeholder="e.g. CS Fundamentals" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-400 transition-all"
                        value={newExamName} onChange={(e) => setNewExamName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                      <input type="text" placeholder="Brief overview" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-400 transition-all"
                        value={newExamDesc} onChange={(e) => setNewExamDesc(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Time Limit (mins)</label>
                      <input type="number" placeholder="60" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-400 transition-all"
                        value={newExamTimeLimit} onChange={(e) => setNewExamTimeLimit(e.target.value)} />
                    </div>
                  </div>
                  <button onClick={createExam} className="px-6 py-3 bg-slate-900 text-white font-black text-sm rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Create Exam
                  </button>
                </div>

                {/* Exam Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {exams.map(exam => {
                    const isTerminated = !!(exam as any).terminatedAt;
                    const isLive = (exam as any).isStarted && !isTerminated;
                    return (
                      <motion.div whileHover={{ y: -3 }} key={exam.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                        <div className="flex justify-between items-start mb-5">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-slate-500" />
                          </div>
                          <span className={`px-3 py-1 text-[10px] font-black rounded-full border uppercase tracking-widest ${
                            isTerminated ? 'bg-rose-50 text-rose-500 border-rose-200' :
                            isLive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                            'bg-slate-50 text-slate-400 border-slate-200'
                          }`}>
                            {isTerminated ? 'Terminated' : isLive ? 'Live' : 'Draft'}
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mb-1">{exam.name}</h3>
                        <p className="text-sm text-slate-500 font-medium mb-5 line-clamp-2">{exam.description}</p>
                        <p className="text-[10px] font-bold text-slate-400 mb-5">{exam.timeLimit} min · {questions.filter(q => q.examId === exam.id).length} questions</p>

                        {/* Status info */}
                        {!(exam as any).isStarted && !isTerminated && (
                          <p className="text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
                            ⚠ Not visible to students until you start it
                          </p>
                        )}

                        <div className="flex flex-col gap-2">
                          {isTerminated ? (
                            <button onClick={() => resetExamTermination(exam.id)}
                              className="w-full py-2.5 bg-emerald-50 text-emerald-700 text-xs font-black rounded-xl hover:bg-emerald-100 transition-all border border-emerald-200 uppercase tracking-widest flex items-center justify-center gap-2">
                              <Play className="w-3.5 h-3.5" /> Reopen Exam
                            </button>
                          ) : isLive ? (
                            <button onClick={() => terminateExam(exam.id, exam.name)}
                              className="w-full py-2.5 bg-rose-50 text-rose-600 text-xs font-black rounded-xl hover:bg-rose-100 transition-all border border-rose-200 uppercase tracking-widest flex items-center justify-center gap-2">
                              <Square className="w-3.5 h-3.5" /> Terminate
                            </button>
                          ) : (
                            <button onClick={() => startExam(exam.id)}
                              className="w-full py-2.5 bg-indigo-50 text-indigo-700 text-xs font-black rounded-xl hover:bg-indigo-100 transition-all border border-indigo-200 uppercase tracking-widest flex items-center justify-center gap-2">
                              <Play className="w-3.5 h-3.5" /> Start Exam
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ── ASSESSMENTS / QUESTIONS ── */}
            {activeTab === 'questions' && (
              <motion.div key="questions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-7">
                {!selectedExamForQuestions ? (
                  <>
                    <div>
                      <h1 className="text-4xl font-black text-slate-900 tracking-tight">Assessments</h1>
                      <p className="text-slate-500 font-medium mt-1">Select an exam to manage its question bank.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {exams.map(exam => (
                        <motion.button whileHover={{ y: -3 }} key={exam.id} onClick={() => setSelectedExamForQuestions(exam)}
                          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-left hover:shadow-md transition-all group"
                        >
                          <div className="flex justify-between items-start mb-5">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-slate-900 transition-all">
                              <BarChart3 className="w-5 h-5 text-slate-500 group-hover:text-white transition-all" />
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Questions</p>
                              <p className="text-2xl font-black text-slate-900">{questions.filter(q => q.examId === exam.id).length}</p>
                            </div>
                          </div>
                          <h3 className="text-lg font-black text-slate-900 mb-1">{exam.name}</h3>
                          <p className="text-sm text-slate-400 font-medium line-clamp-2">{exam.description}</p>
                          <div className="mt-4 flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                            Manage Questions <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setSelectedExamForQuestions(null)} className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 transition-all border border-slate-200">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{selectedExamForQuestions.name}</h1>
                        <p className="text-slate-400 font-medium text-sm mt-0.5">{questions.filter(q => q.examId === selectedExamForQuestions.id).length} questions</p>
                      </div>
                    </div>

                    {/* Add Questions Panel */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="flex border-b border-slate-100">
                        <button onClick={() => setQuestionAddMode('manual')}
                          className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-widest transition-all ${questionAddMode === 'manual' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'}`}>
                          <Plus className="w-4 h-4" /> Manual
                        </button>
                        <button onClick={() => { setQuestionAddMode('ai'); setAiPreview([]); setAiError(''); }}
                          className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-widest transition-all ${questionAddMode === 'ai' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'}`}>
                          <span>✦</span> AI Generate
                        </button>
                      </div>

                      {questionAddMode === 'manual' && (
                        <div className="p-7 space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Question Text</label>
                              <textarea placeholder="Enter question..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 min-h-[110px] focus:outline-none focus:border-indigo-400 transition-all resize-none" id="newQText" />
                            </div>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Section</label>
                                  <input type="text" id="newQSection" placeholder="e.g. AI" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-400 transition-all" />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Difficulty</label>
                                  <select id="newQDiff" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-400 transition-all">
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                  </select>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Options (comma-separated)</label>
                                <input type="text" id="newQOptions" placeholder="Option A, Option B, Option C, Option D" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-400 transition-all" />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correct Option (0-3)</label>
                                <input type="number" id="newQCorrect" min="0" max="3" placeholder="0" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-400 transition-all" />
                              </div>
                            </div>
                          </div>
                          <button onClick={async () => {
                            const text = (document.getElementById('newQText') as HTMLTextAreaElement).value;
                            const section = (document.getElementById('newQSection') as HTMLInputElement).value;
                            const difficulty = (document.getElementById('newQDiff') as HTMLSelectElement).value;
                            const options = (document.getElementById('newQOptions') as HTMLInputElement).value.split(',').map(s => s.trim());
                            const correct = parseInt((document.getElementById('newQCorrect') as HTMLInputElement).value);
                            if (!text || options.length < 2) return;
                            const isDuplicate = questions.some(q => q.examId === selectedExamForQuestions!.id && q.text.toLowerCase() === text.toLowerCase());
                            if (isDuplicate) { alert("Duplicate question."); return; }
                            await addDoc(collection(db, 'questions'), { examId: selectedExamForQuestions!.id, text, section, difficulty, options, correctAnswer: correct });
                            (document.getElementById('newQText') as HTMLTextAreaElement).value = '';
                            (document.getElementById('newQOptions') as HTMLInputElement).value = '';
                            showToast('Question added', 'success');
                          }}
                            className="px-6 py-3 bg-slate-900 text-white font-black text-sm rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Add Question
                          </button>
                        </div>
                      )}

                      {questionAddMode === 'ai' && (
                        <div className="p-7 space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="lg:col-span-2 space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Topic</label>
                              <input type="text" placeholder="e.g. Binary Trees, SQL Joins" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-400 transition-all"
                                value={aiTopic} onChange={e => setAiTopic(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Section</label>
                              <input type="text" placeholder="e.g. Data Structures" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-400 transition-all"
                                value={aiSection} onChange={e => setAiSection(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Difficulty</label>
                              <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-400 transition-all"
                                value={aiDifficulty} onChange={e => setAiDifficulty(e.target.value as any)}>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Count</label>
                              <input type="number" min={1} max={20} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-400 transition-all"
                                value={aiCount} onChange={e => setAiCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))} />
                            </div>
                          </div>
                          <button disabled={!aiTopic.trim() || aiGenerating}
                            onClick={async () => {
                              setAiGenerating(true); setAiError(''); setAiPreview([]);
                              const existingTexts = questions.filter(q => q.examId === selectedExamForQuestions!.id).map(q => q.text);
                              try {
                                const { GoogleGenAI } = await import('@google/genai');
                                const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
                                const prompt = `Generate exactly ${aiCount} unique MCQ questions on the topic: "${aiTopic}". Difficulty: ${aiDifficulty}. Section: ${aiSection || aiTopic}.
IMPORTANT do NOT duplicate these: ${existingTexts.length > 0 ? existingTexts.join('; ') : 'None'}
Return ONLY a JSON array: [{"text":"...","options":["A","B","C","D"],"correctAnswer":0,"section":"${aiSection || aiTopic}","difficulty":"${aiDifficulty}"}]`;
                                const result = await ai.models.generateContent({
                                  model: 'gemini-2.0-flash',
                                  config: { systemInstruction: 'You are an expert MCQ generator. Always respond ONLY with a valid JSON array.' },
                                  contents: prompt,
                                });
                                const raw = result.text || '';
                                setAiPreview(JSON.parse(raw.replace(/```json|```/g, '').trim()));
                              } catch (err: any) {
                                setAiError('Generation failed. Please try again.');
                              } finally {
                                setAiGenerating(false);
                              }
                            }}
                            className="px-6 py-3 bg-slate-900 text-white font-black text-sm rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-40"
                          >
                            {aiGenerating ? (
                              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating…</>
                            ) : (
                              <><span>✦</span> Generate {aiCount} Question{aiCount !== 1 ? 's' : ''}</>
                            )}
                          </button>

                          {aiError && (
                            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-bold flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" /> {aiError}
                            </div>
                          )}

                          {aiPreview.length > 0 && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-black text-slate-700">{aiPreview.length} questions — review before saving</p>
                                <button onClick={() => setAiPreview([])} className="text-xs text-slate-400 hover:text-rose-500 font-black uppercase tracking-widest">Clear</button>
                              </div>
                              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                                {aiPreview.map((q, i) => (
                                  <div key={i} className="p-5 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                                    <div className="flex items-start gap-3">
                                      <p className="font-black text-slate-900 text-sm leading-relaxed flex-1">{i + 1}. {q.text}</p>
                                      <button onClick={() => setAiPreview(prev => prev.filter((_, idx) => idx !== i))}
                                        className="shrink-0 p-1.5 hover:bg-rose-50 rounded-lg text-slate-300 hover:text-rose-400 transition-colors">
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      {q.options.map((opt, oIdx) => (
                                        <div key={oIdx} className={`px-3 py-2 rounded-lg text-xs font-bold border ${oIdx === q.correctAnswer ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-white border-slate-100 text-slate-500'}`}>
                                          <span className="opacity-40 mr-1.5">{String.fromCharCode(65 + oIdx)}.</span>{opt}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <button disabled={savingAi}
                                onClick={async () => {
                                  setSavingAi(true);
                                  try {
                                    const existingTexts = questions.filter(q => q.examId === selectedExamForQuestions!.id).map(q => q.text.toLowerCase());
                                    let saved = 0;
                                    for (const q of aiPreview) {
                                      if (!existingTexts.includes(q.text.toLowerCase())) {
                                        await addDoc(collection(db, 'questions'), { examId: selectedExamForQuestions!.id, text: q.text, options: q.options, correctAnswer: q.correctAnswer, section: q.section, difficulty: q.difficulty });
                                        saved++;
                                      }
                                    }
                                    setAiPreview([]); setAiTopic('');
                                    showToast(`${saved} question${saved !== 1 ? 's' : ''} added`, 'success');
                                  } catch (err) {
                                    setAiError('Save failed.');
                                  } finally {
                                    setSavingAi(false);
                                  }
                                }}
                                className="w-full py-3.5 bg-slate-900 text-white font-black text-sm rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                {savingAi ? (
                                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                                ) : `Save ${aiPreview.length} Question${aiPreview.length !== 1 ? 's' : ''}`}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Question Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {questions.filter(q => q.examId === selectedExamForQuestions.id).map((q, idx) => (
                        <div key={q.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all group relative">
                          {/* Delete button */}
                          <button
                            onClick={() => deleteQuestion(q.id)}
                            className="absolute top-4 right-4 p-2 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                            title="Delete question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <div className="flex justify-between items-start mb-4 pr-8">
                            <span className="px-2.5 py-1 bg-slate-900 text-white text-[9px] font-black rounded-full uppercase tracking-widest">{q.section}</span>
                            <span className={`px-2.5 py-1 text-[9px] font-black rounded-full border uppercase tracking-widest ${
                              q.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              q.difficulty === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                              'bg-rose-50 text-rose-600 border-rose-100'}`}>
                              {q.difficulty}
                            </span>
                          </div>
                          <p className="text-sm font-black text-slate-900 mb-4 line-clamp-3 leading-relaxed">{idx + 1}. {q.text}</p>
                          <div className="space-y-2">
                            {q.options.map((opt, oIdx) => (
                              <div key={oIdx} className={`px-3 py-2 rounded-lg text-xs font-bold border ${oIdx === q.correctAnswer ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                <span className="opacity-40 mr-1.5">{String.fromCharCode(65 + oIdx)}.</span>{opt}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* ── SETTINGS ── */}
            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-2xl space-y-7">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Settings</h1>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-8">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-white">
                      <UserIcon className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">{user.displayName}</h2>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{user.role}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</p>
                      <div className="px-5 py-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="font-bold text-slate-900 text-sm">{user.email}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Admin Hashcode</p>
                      <div className="px-5 py-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="font-black text-slate-900 font-mono text-sm">{adminConfig?.hashcode || '—'}</p>
                      </div>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</p>
                      <div className="px-5 py-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-3">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-sm font-black text-emerald-700">Verified System Administrator</span>
                      </div>
                    </div>
                  </div>

                  <button onClick={() => signOut(auth)} className="w-full py-4 bg-rose-50 text-rose-600 font-black rounded-xl hover:bg-rose-100 transition-all border border-rose-100 flex items-center justify-center gap-2 text-sm">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
