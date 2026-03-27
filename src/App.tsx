import React, { useState, useEffect, useRef } from 'react';
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
import { LogIn, ShieldAlert, User as UserIcon, BarChart3, Users, LogOut, Clock, CheckCircle2, AlertTriangle, Eye, EyeOff, Menu, X, ArrowRight, Plus, ChevronRight, Search, Bell, Settings, Lock, Trash2, Play, Square, BookOpen, ChevronLeft, Trophy, Star, Zap, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ─── Loading Screen ─────────────────────────────────────────────────────────
const LoadingScreen = () => (
  <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-6"
    >
      <div className="relative w-20 h-20 mx-auto">
        <div className="absolute inset-0 rounded-2xl bg-violet-600/20 animate-ping" />
        <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center shadow-2xl shadow-violet-900/50">
          <ShieldAlert className="w-10 h-10 text-white" />
        </div>
      </div>
      <div>
        <p className="text-slate-400 text-sm font-medium tracking-widest uppercase">Loading SecureAssess</p>
        <div className="flex gap-1 justify-center mt-3">
          {[0,1,2].map(i => (
            <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-500"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  </div>
);

// ─── Error Boundary ──────────────────────────────────────────────────────────
const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);
  useEffect(() => {
    const handleError = (e: ErrorEvent) => { console.error(e.error); };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  if (hasError) return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-6">
      <div className="glass-card p-12 max-w-sm w-full text-center space-y-6">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
        <button onClick={() => window.location.reload()} className="btn-primary w-full">Reload</button>
      </div>
    </div>
  );
  return <>{children}</>;
};

// ─── Podium / Top-3 Celebration ──────────────────────────────────────────────
function PodiumCelebration({ rank, name, score, onClose }: { rank: 1|2|3; name: string; score: number; onClose: () => void }) {
  const medals = {
    1: { emoji: '🥇', label: '1st Place', shimmer: 'gold-shimmer', glow: 'shadow-amber-400/60', bg: 'from-amber-900/80 to-yellow-900/60', border: 'border-amber-500/40', ring: 'bg-amber-400' },
    2: { emoji: '🥈', label: '2nd Place', shimmer: 'silver-shimmer', glow: 'shadow-slate-300/40', bg: 'from-slate-800/80 to-slate-700/60', border: 'border-slate-400/40', ring: 'bg-slate-300' },
    3: { emoji: '🥉', label: '3rd Place', shimmer: 'bronze-shimmer', glow: 'shadow-orange-400/40', bg: 'from-orange-900/80 to-amber-900/60', border: 'border-orange-500/40', ring: 'bg-orange-400' },
  };
  const m = medals[rank];
  const confettiCount = rank === 1 ? 20 : 10;
  const confettiColors = ['#f59e0b','#7c3aed','#06b6d4','#10b981','#ec4899','#f97316'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      {/* Confetti */}
      {rank === 1 && Array.from({ length: confettiCount }).map((_, i) => (
        <motion.div key={i}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-10px',
            background: confettiColors[i % confettiColors.length],
            rotate: Math.random() * 360,
          }}
          animate={{ y: '110vh', rotate: Math.random() * 720, opacity: [1,1,0] }}
          transition={{ duration: 2 + Math.random(), delay: i * 0.1, ease: 'linear' }}
        />
      ))}

      <motion.div
        initial={{ scale: 0.5, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 30 }}
        transition={{ type: 'spring', damping: 12 }}
        onClick={e => e.stopPropagation()}
        className={`relative max-w-sm w-full bg-gradient-to-b ${m.bg} border ${m.border} rounded-3xl p-8 text-center overflow-hidden shadow-2xl ${m.glow}`}
      >
        {/* Glow orb */}
        <div className={`absolute inset-0 bg-gradient-to-b ${m.bg} opacity-60 rounded-3xl`} />
        
        <div className="relative z-10 space-y-5">
          <motion.div
            className="crown-float inline-block text-7xl"
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            {m.emoji}
          </motion.div>

          <div>
            <p className={`text-xs font-black uppercase tracking-widest ${m.shimmer} mb-2`}>{m.label}</p>
            <h2 className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'Clash Display, sans-serif' }}>{name}</h2>
            <p className="text-slate-400 text-sm">reached the <span className="text-white font-bold">Top 3</span> leaderboard!</p>
          </div>

          <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/10 border border-white/20`}>
            <Trophy className={`w-5 h-5 ${rank === 1 ? 'text-amber-400' : rank === 2 ? 'text-slate-300' : 'text-orange-400'}`} />
            <span className="text-2xl font-black text-white" style={{ fontFamily: 'Clash Display, sans-serif' }}>{score}</span>
            <span className="text-slate-400 text-xs">pts</span>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-white/15 hover:bg-white/25 text-white font-bold rounded-2xl transition-all text-sm border border-white/20"
          >
            Continue ✓
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── App Root ────────────────────────────────────────────────────────────────
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
              alert("Your account has been terminated due to policy violations.");
              setUser(null);
            } else {
              setUser(profile);
            }
          } else {
            const adminEmails = ["ahmadabdullah007860@gmail.com", "sumansingh.ss1972@gmail.com", "wolfickbriandumbledore@gmail.com"];
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || 'Student',
              role: adminEmails.includes(firebaseUser.email || "") ? 'admin' : 'student',
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
      <div className="min-h-screen bg-[#0A0A0F] text-slate-100">
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

// ─── Complete Profile View ───────────────────────────────────────────────────
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-6"
    >
      {/* Background orb */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative max-w-md w-full glass-card p-10 space-y-8"
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mx-auto">
            <Hash className="w-8 h-8 text-violet-400" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'Clash Display, sans-serif' }}>Enter Roll Number</h2>
            <p className="text-slate-400 text-sm">Your university roll number is required before accessing the portal.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="micro-label ml-1">University Roll Number</label>
            <div className="relative">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                required
                value={rollNumber}
                onChange={e => setRollNumber(e.target.value)}
                placeholder="e.g. 2023001234"
                className="input-field pl-12"
              />
            </div>
          </div>
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-400 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full py-4">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Login View ───────────────────────────────────────────────────────────────
function LoginView({ isAdminMode, setIsAdminMode, adminConfig, setAdminConfig }: any) {
  const [adminIdentifier, setAdminIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [error, setError] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  const handleGoogleLogin = async () => {
    if (!rollNumber.trim()) { setError('Please enter your roll number first'); return; }
    try {
      setError('');
      setSigningIn(true);
      const result = await signInWithGoogle();
      // After Google sign in, save roll number to user profile
      if (result?.user) {
        const userRef = doc(db, 'users', result.user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          if (!userSnap.data().rollNumber) {
            await updateDoc(userRef, { rollNumber: rollNumber.trim() });
          }
        } else {
          await setDoc(userRef, {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName || 'Student',
            role: 'student',
            rollNumber: rollNumber.trim(),
            isFlagged: false,
            isTerminated: false,
            lastActive: new Date().toISOString()
          });
        }
      }
    } catch (err: any) {
      setError(err.message);
      setSigningIn(false);
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
        } catch (e: any) { setError('Hashcode login failed: ' + e.message); }
      } else {
        setError('Invalid credentials: ' + err.message);
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
      alert(`Admin setup complete! Hashcode: ${newHashcode}. Save this!`);
    } catch (err: any) {
      setError('Setup failed: ' + err.message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-80 h-80 rounded-full bg-violet-600/15 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-60 h-60 rounded-full bg-violet-800/10 blur-3xl" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="relative max-w-md w-full space-y-8">
        {/* Logo */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 shadow-2xl shadow-violet-900/50 mx-auto">
            <ShieldAlert className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight" style={{ fontFamily: 'Clash Display, sans-serif' }}>
              Secure<span className="text-violet-400">Assess</span>
            </h1>
            <p className="text-slate-500 text-xs font-bold tracking-[0.3em] uppercase mt-1">Enterprise Assessment Platform</p>
          </div>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-8"
        >
          {/* Tab Toggle */}
          <div className="flex p-1 bg-white/5 rounded-xl mb-8 border border-white/10">
            <button
              onClick={() => { setIsAdminMode(false); setIsSettingUp(false); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${!isAdminMode ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/50' : 'text-slate-500 hover:text-slate-300'}`}
            >Student</button>
            <button
              onClick={() => { setIsAdminMode(true); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${isAdminMode ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/50' : 'text-slate-500 hover:text-slate-300'}`}
            >Admin</button>
          </div>

          <AnimatePresence mode="wait">
            {!isAdminMode ? (
              <motion.div key="student" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} className="space-y-5">
                <div className="space-y-2">
                  <label className="micro-label ml-1">University Roll Number <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="e.g. 2023001234"
                      className="input-field pl-12"
                      value={rollNumber}
                      onChange={e => setRollNumber(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="border-t border-white/10 pt-5">
                  <p className="text-slate-400 text-sm mb-4 font-medium">Sign in with your institutional Google account</p>
                  <button
                    onClick={handleGoogleLogin}
                    disabled={signingIn}
                    className="w-full flex items-center justify-center gap-3 bg-white/8 border border-white/15 text-slate-200 font-bold py-4 px-6 rounded-2xl hover:bg-white/12 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {signingIn ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                        Continue with Google
                      </>
                    )}
                  </button>
                </div>
                {error && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-400 text-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.form
                key="admin"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                onSubmit={isSettingUp ? handleAdminSetup : handleAdminLogin}
                className="space-y-5"
              >
                {isSettingUp && (
                  <div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-xl text-violet-300 text-sm">
                    Initial setup: Create the primary administrator account.
                  </div>
                )}
                <div className="space-y-2">
                  <label className="micro-label ml-1">Identifier</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      placeholder={isSettingUp ? "Admin Email" : "Email or Hashcode"}
                      className="input-field pl-12"
                      value={adminIdentifier}
                      onChange={e => setAdminIdentifier(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="micro-label ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="input-field pl-12 pr-12"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-400 text-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
                  </div>
                )}
                <button type="submit" className="btn-primary w-full py-4">
                  {isSettingUp ? 'Initialize Admin' : 'Access Dashboard'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        <p className="text-center text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">
          © 2026 SecureAssess
        </p>
      </div>
    </motion.div>
  );
}

// ─── Student Dashboard ────────────────────────────────────────────────────────
function StudentDashboard({ user, setUser }: { user: UserProfile, setUser: (u: UserProfile) => void }) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [examFinished, setExamFinished] = useState(false);
  const [responses, setResponses] = useState<Record<string, { option: number, timeTaken: number, score: number }>>({});
  const [allResponses, setAllResponses] = useState<UserResponse[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [celebrationRank, setCelebrationRank] = useState<1|2|3|null>(null);
  const responsesRef = useRef<Record<string, { option: number, timeTaken: number, score: number }>>({});
  const questionsRef = useRef<Question[]>([]);
  const selectedExamRef = useRef<Exam | null>(null);
  const isFinishingRef = useRef(false);
  const terminatedAtOnStartRef = useRef<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(3600);

  useEffect(() => { responsesRef.current = responses; }, [responses]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);
  useEffect(() => { selectedExamRef.current = selectedExam; }, [selectedExam]);

  // Fetch global responses and users to compute rank
  useEffect(() => {
    const uUnsub = onSnapshot(collection(db, 'users'), snap => setAllUsers(snap.docs.map(d => d.data() as UserProfile)));
    const rUnsub = onSnapshot(collection(db, 'responses'), snap => setAllResponses(snap.docs.map(d => d.data() as UserResponse)));
    return () => { uUnsub(); rUnsub(); };
  }, []);

  useEffect(() => {
    if (!isExamStarted || examFinished) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); handleFinishExam(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isExamStarted, examFinished]);

  useEffect(() => {
    if (!isExamStarted || examFinished || !selectedExam) return;
    const unsub = onSnapshot(doc(db, 'exams', selectedExam.id), snap => {
      const data = snap.data();
      const terminatedAt = data?.terminatedAt ?? null;
      if (terminatedAt && terminatedAt !== terminatedAtOnStartRef.current) handleFinishExam();
    });
    return () => unsub();
  }, [isExamStarted, examFinished, selectedExam]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'exams'), snap => {
      setExams(snap.docs.map(d => ({ id: d.id, ...d.data() } as Exam)));
    }, err => handleFirestoreError(err, OperationType.GET, 'exams'));
    return () => unsub();
  }, []);

  const handleSelectExam = async (exam: Exam) => {
    if ((user.submittedExams ?? []).includes(exam.id)) { alert("Already submitted."); return; }
    try {
      const qSnap = await getDocs(query(collection(db, 'questions'), where('examId', '==', exam.id)));
      const examQuestions = qSnap.docs.map(d => ({ id: d.id, ...d.data() } as Question));
      if (examQuestions.length === 0) { alert("No questions yet."); return; }
      setTimeLeft(exam.timeLimit * 60);
      const rSnap = await getDocs(query(collection(db, 'responses'), where('userId', '==', user.uid), where('examId', '==', exam.id)));
      const existingResponses: Record<string, { option: number, timeTaken: number, score: number }> = {};
      rSnap.docs.forEach(d => {
        const data = d.data();
        if (data.selectedOption !== -1) existingResponses[data.questionId] = { option: data.selectedOption, timeTaken: data.timeTaken, score: data.score };
      });
      setResponses(existingResponses);
      setQuestions(examQuestions);
      setSelectedExam(exam);
    } catch (err) { handleFirestoreError(err, OperationType.GET, 'exams/responses'); }
  };

  const handleStartExam = async () => {
    if (!selectedExam) return;
    if ((user.submittedExams ?? []).includes(selectedExam.id)) { alert("Already submitted."); setSelectedExam(null); return; }
    try {
      const examSnap = await getDoc(doc(db, 'exams', selectedExam.id));
      terminatedAtOnStartRef.current = examSnap.data()?.terminatedAt ?? null;
      isFinishingRef.current = false;
      await updateDoc(doc(db, 'users', user.uid), { activeExamId: selectedExam.id, examStartTime: new Date().toISOString() });
      setIsExamStarted(true);
    } catch (err) { handleFirestoreError(err, OperationType.WRITE, 'users'); }
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
        activeExamId: null, examStartTime: null, lastActive: new Date().toISOString(), submittedExams: updatedSubmittedExams
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
      // Compute rank and show celebration if top 3
      const myScore = Object.values(currentResponses).reduce((sum, r) => sum + r.score, 0);
      const studentScores = allUsers
        .filter(u => u.role === 'student')
        .map(u => {
          const userResponses = allResponses.filter(r => r.userId === u.uid && r.examId === currentExam.id);
          const score = userResponses.reduce((s, r) => s + (r.score || 0), 0);
          return { uid: u.uid, score };
        })
        .sort((a, b) => b.score - a.score);
      // Add current user's score if not yet in allResponses
      const myIdx = studentScores.findIndex(s => s.uid === user.uid);
      if (myIdx === -1) {
        studentScores.push({ uid: user.uid, score: myScore });
        studentScores.sort((a, b) => b.score - a.score);
      } else {
        studentScores[myIdx].score = myScore;
        studentScores.sort((a, b) => b.score - a.score);
      }
      const myRank = studentScores.findIndex(s => s.uid === user.uid) + 1;
      if (myRank >= 1 && myRank <= 3) {
        setTimeout(() => setCelebrationRank(myRank as 1|2|3), 800);
      }
    } catch (err) { handleFirestoreError(err, OperationType.WRITE, 'responses'); }
  };

  if (examFinished) {
    return (
      <>
        <AnimatePresence>
          {celebrationRank && (
            <PodiumCelebration
              rank={celebrationRank}
              name={user.displayName}
              score={Object.values(responsesRef.current).reduce((s, r) => s + r.score, 0)}
              onClose={() => setCelebrationRank(null)}
            />
          )}
        </AnimatePresence>
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#0A0A0F]">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            className="max-w-sm w-full text-center glass-card p-10 space-y-6"
          >
            <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto border border-emerald-500/30 relative">
              <div className="absolute inset-0 bg-emerald-500/10 rounded-3xl animate-ping" />
              <CheckCircle2 className="w-10 h-10 text-emerald-400 relative z-10" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'Clash Display, sans-serif' }}>Submitted!</h2>
              <p className="text-slate-400 text-sm">Your responses have been saved.</p>
            </div>
            <button onClick={() => signOut(auth)} className="btn-primary w-full">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
            <p className="micro-label opacity-40">ID: {user.uid.slice(0,8)}</p>
          </motion.div>
        </div>
      </>
    );
  }

  if (isExamStarted) {
    return (
      <MCQInterface
        questions={questions} responses={responses} setResponses={setResponses}
        timeLeft={timeLeft} onFinish={handleFinishExam} userId={user.uid} examId={selectedExam?.id}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-violet-900/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-lg mx-auto px-4 pt-8 pb-20">
        {user.isFlagged && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3 text-amber-400"
          >
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-xs font-bold">Account flagged for suspicious activity.</p>
          </motion.div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black text-white" style={{ fontFamily: 'Clash Display, sans-serif' }}>
              Hi, <span className="text-violet-400">{user.displayName.split(' ')[0]}</span>
            </h1>
            <p className="text-slate-500 text-xs font-medium mt-0.5 flex items-center gap-1">
              <Hash className="w-3 h-3" /> {user.rollNumber}
            </p>
          </div>
          <button onClick={() => signOut(auth)} className="p-2.5 glass-card text-slate-400 hover:text-rose-400 transition-all active:scale-95">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {!selectedExam ? (
          <div className="space-y-4">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Available Assessments</h2>
            <div className="space-y-3">
              {/* Only show exams that have been started by admin (isStarted: true) */}
              {exams.filter(e => e.isActive && (e as any).isStarted).map(exam => {
                const isSubmitted = (user.submittedExams ?? []).includes(exam.id);
                return (
                  <motion.button
                    whileTap={isSubmitted ? {} : { scale: 0.98 }}
                    key={exam.id}
                    onClick={() => !isSubmitted && handleSelectExam(exam)}
                    disabled={isSubmitted}
                    className={`glass-card p-5 text-left w-full flex items-center gap-4 transition-all border ${isSubmitted ? 'opacity-60 cursor-not-allowed border-white/5' : 'hover:border-violet-500/30 cursor-pointer'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSubmitted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-violet-600/20 text-violet-400'}`}>
                      {isSubmitted ? <CheckCircle2 className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-black text-white truncate" style={{ fontFamily: 'Clash Display, sans-serif' }}>{exam.name}</h3>
                      <p className="text-slate-500 text-xs font-medium truncate mt-0.5">
                        {isSubmitted ? 'Already submitted — cannot retake' : exam.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isSubmitted ? (
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Done</span>
                      ) : (
                        <><span className="text-[9px] font-black text-slate-500">{exam.timeLimit}m</span><ArrowRight className="w-4 h-4 text-slate-600" /></>
                      )}
                    </div>
                  </motion.button>
                );
              })}
              {exams.filter(e => e.isActive && (e as any).isStarted).length === 0 && (
                <div className="glass-card p-10 text-center space-y-3">
                  <Clock className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-sm font-black text-slate-400">No active assessments</p>
                  <p className="text-xs text-slate-600">Exams will appear here when started by your admin.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => setSelectedExam(null)} className="p-2 glass-card text-slate-400 transition-all active:scale-90">
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
              <h2 className="text-base font-black text-white truncate" style={{ fontFamily: 'Clash Display, sans-serif' }}>{selectedExam.name}</h2>
            </div>
            <div className="glass-card p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/8">
                  <p className="text-2xl font-black text-white" style={{ fontFamily: 'Clash Display, sans-serif' }}>{questions.length}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Questions</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/8">
                  <p className="text-2xl font-black text-white" style={{ fontFamily: 'Clash Display, sans-serif' }}>{selectedExam.timeLimit}m</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Time Limit</p>
                </div>
              </div>
              <div className="bg-violet-600/10 border border-violet-500/20 rounded-2xl p-4 flex items-center gap-3">
                <Zap className="w-5 h-5 text-violet-400 shrink-0" />
                <div>
                  <p className="text-xs font-black text-violet-300">Speed Bonus</p>
                  <p className="text-[11px] text-violet-400/70 font-medium">Answer in ≤10s for max 10 points</p>
                </div>
              </div>
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <p className="text-xs font-black text-rose-300">Proctored Exam</p>
                  <p className="text-[11px] text-rose-400/70 font-medium">Tab switching will flag your account</p>
                </div>
              </div>
              <button onClick={handleStartExam} className="btn-primary w-full py-4">
                Begin Assessment <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── MCQ Interface ────────────────────────────────────────────────────────────
function MCQInterface({ questions, responses, setResponses, timeLeft, onFinish, userId, examId }: any) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [pendingSelection, setPendingSelection] = useState<number | null>(null);
  const firstTapTime = useRef<number | null>(null);
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
      } catch (err) { console.error(err); }
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
    } catch (err) { console.error(err); }
    if (currentIdx < questions.length - 1) setCurrentIdx(prev => prev + 1);
    else onFinish();
  };

  const formatTime = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;
  const progress = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0F]">
      <header className="sticky top-0 z-50 bg-[#0D0D14]/95 backdrop-blur-xl border-b border-white/8">
        <div className="h-1 bg-white/5 w-full">
          <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-violet-500 transition-all" />
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${timeLeft < 300 ? 'text-rose-400' : 'text-slate-500'}`} />
            <span className={`text-lg font-black font-mono tracking-tight ${timeLeft < 300 ? 'text-rose-400 animate-pulse' : 'text-white'}`}>{formatTime(timeLeft)}</span>
          </div>
          <span className="text-xs font-black text-slate-500">{currentIdx + 1} <span className="text-slate-700">/</span> {questions.length}</span>
          <button onClick={onFinish} className="bg-rose-600/20 border border-rose-500/30 text-rose-400 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider hover:bg-rose-600/30 transition-all">
            Submit
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-lg w-full mx-auto px-4 pt-5 pb-24">
        <AnimatePresence mode="wait">
          <motion.div key={currentIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }} className="space-y-5">
            <div className="flex gap-2 flex-wrap">
              <span className="px-3 py-1.5 bg-violet-600/20 border border-violet-500/30 text-violet-300 rounded-full text-[9px] font-black uppercase tracking-widest">{q.section}</span>
              <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${q.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : q.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>{q.difficulty}</span>
            </div>
            <h2 className="text-base font-black text-white leading-snug" style={{ fontFamily: 'Clash Display, sans-serif' }}>{q.text}</h2>
            <div className="space-y-2.5">
              {q.options.map((option: string, idx: number) => {
                const isSelected = pendingSelection === idx;
                return (
                  <button key={idx} onClick={() => handleTap(idx)}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left active:scale-[0.98] ${isSelected ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-900/30' : 'bg-white/4 border-white/8 text-slate-300 hover:border-violet-500/40 hover:bg-white/6'}`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black shrink-0 transition-colors ${isSelected ? 'bg-white/20 text-white' : 'bg-white/8 text-slate-500'}`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="text-sm font-semibold flex-1 leading-snug">{option}</span>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-white/70 shrink-0" />}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between items-center pt-2">
              <div className="flex gap-1 overflow-x-auto max-w-[55%]">
                {questions.map((_: any, i: number) => (
                  <div key={i} className={`shrink-0 h-1.5 rounded-full transition-all duration-300 ${i === currentIdx ? 'w-5 ' + (pendingSelection !== null ? 'bg-violet-500' : 'bg-slate-600') : responses[questions[i].id] ? 'w-1.5 bg-violet-400' : 'w-1.5 bg-white/10'}`} />
                ))}
              </div>
              <button disabled={pendingSelection === null} onClick={handleConfirmAndAdvance}
                className={`flex items-center gap-1.5 px-5 py-2.5 text-xs font-black rounded-xl transition-all active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed ${currentIdx === questions.length - 1 ? 'bg-emerald-600 text-white' : 'bg-violet-600 text-white'}`}
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

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
function AdminDashboard({ user, adminConfig }: { user: UserProfile, adminConfig: AdminConfig | null }) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'exams' | 'questions' | 'profile'>('analytics');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [responses, setResponses] = useState<UserResponse[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
  const [confirmModal, setConfirmModal] = useState<{ examId: string; examName: string; action: 'terminate' | 'start' } | null>(null);
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const uUnsub = onSnapshot(collection(db, 'users'), snap => setUsers(snap.docs.map(d => d.data() as UserProfile)), err => handleFirestoreError(err, OperationType.GET, 'users'));
    const rUnsub = onSnapshot(collection(db, 'responses'), snap => setResponses(snap.docs.map(d => d.data() as UserResponse)), err => handleFirestoreError(err, OperationType.GET, 'responses'));
    const qUnsub = onSnapshot(collection(db, 'questions'), snap => setQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Question))), err => handleFirestoreError(err, OperationType.GET, 'questions'));
    const eUnsub = onSnapshot(collection(db, 'exams'), snap => setExams(snap.docs.map(d => ({ id: d.id, ...d.data() } as Exam))), err => handleFirestoreError(err, OperationType.GET, 'exams'));
    return () => { uUnsub(); rUnsub(); qUnsub(); eUnsub(); };
  }, []);

  const createExam = async () => {
    if (!newExamName) return;
    await addDoc(collection(db, 'exams'), {
      name: newExamName, description: newExamDesc,
      timeLimit: parseInt(newExamTimeLimit) || 60,
      createdAt: new Date().toISOString(),
      isActive: true,
      isStarted: false  // New: exam not visible to students until started
    });
    setNewExamName(''); setNewExamDesc(''); setNewExamTimeLimit('60');
    showToast('Exam created! Press Start to make it visible to students.', 'success');
  };

  const toggleFlag = async (uid: string, current: boolean) => await updateDoc(doc(db, 'users', uid), { isFlagged: !current });
  const toggleTerminate = async (uid: string, current: boolean) => await updateDoc(doc(db, 'users', uid), { isTerminated: !current });

  const startExam = (examId: string, examName: string) => setConfirmModal({ examId, examName, action: 'start' });
  const terminateExam = (examId: string, examName: string) => setConfirmModal({ examId, examName, action: 'terminate' });

  const doConfirmAction = async () => {
    if (!confirmModal) return;
    const { examId, examName, action } = confirmModal;
    setConfirmModal(null);
    try {
      if (action === 'start') {
        await updateDoc(doc(db, 'exams', examId), { isStarted: true, startedAt: new Date().toISOString() });
        showToast(`"${examName}" is now live for students!`, 'success');
      } else {
        await updateDoc(doc(db, 'exams', examId), { terminatedAt: new Date().toISOString(), isActive: false, isStarted: false });
        const activeUsers = users.filter(u => u.activeExamId === examId);
        for (const u of activeUsers) {
          const alreadySubmitted = u.submittedExams ?? [];
          const updatedSubmittedExams = alreadySubmitted.includes(examId) ? alreadySubmitted : [...alreadySubmitted, examId];
          await updateDoc(doc(db, 'users', u.uid), { activeExamId: null, examStartTime: null, lastActive: new Date().toISOString(), submittedExams: updatedSubmittedExams });
        }
        showToast(`"${examName}" terminated. ${activeUsers.length} session(s) force-submitted.`, 'success');
      }
    } catch (err: any) {
      showToast(`Action failed: ${err.message}`, 'error');
    }
  };

  const resetExamTermination = async (examId: string) => {
    await updateDoc(doc(db, 'exams', examId), { terminatedAt: null, isActive: true, isStarted: false });
    for (const u of users) {
      if ((u.submittedExams ?? []).includes(examId)) {
        try { await updateDoc(doc(db, 'users', u.uid), { submittedExams: (u.submittedExams ?? []).filter((id: string) => id !== examId) }); }
        catch (err) { console.error(err); }
      }
    }
    showToast('Exam reopened. Start it again to make it visible to students.', 'success');
  };

  const deleteQuestion = async (questionId: string) => {
    try {
      await deleteDoc(doc(db, 'questions', questionId));
      showToast('Question deleted.', 'success');
    } catch (err: any) {
      showToast('Failed to delete: ' + err.message, 'error');
    }
    setDeleteQuestionId(null);
  };

  const filteredResponses = analyticsExamFilter === 'all' ? responses : responses.filter(r => r.examId === analyticsExamFilter);
  const filteredQuestions = analyticsExamFilter === 'all' ? questions : questions.filter(q => q.examId === analyticsExamFilter);

  const studentRankingData = users
    .filter(u => u.role === 'student')
    .map(student => {
      const studentResponses = filteredResponses.filter(r => r.userId === student.uid);
      const totalScore = studentResponses.reduce((sum, r) => sum + (r.score || 0), 0);
      const totalResponses = studentResponses.length;
      const examBreakdown = exams.map(exam => {
        const examResponses = responses.filter(r => r.userId === student.uid && r.examId === exam.id);
        return { examName: exam.name, score: examResponses.reduce((s, r) => s + (r.score || 0), 0), count: examResponses.length };
      }).filter(e => e.count > 0);
      return { student, totalScore, totalResponses, examBreakdown };
    })
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  const navItems = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'users', label: 'Students', icon: Users },
    { id: 'exams', label: 'Exams', icon: BookOpen },
    { id: 'questions', label: 'Assessments', icon: ShieldAlert },
    { id: 'profile', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A0F]">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border text-sm font-bold max-w-sm w-full ${toast.type === 'success' ? 'bg-emerald-600/90 text-white border-emerald-500/50 backdrop-blur-xl' : 'bg-rose-600/90 text-white border-rose-500/50 backdrop-blur-xl'}`}
          >
            <span>{toast.type === 'success' ? '✓' : '✕'}</span>
            <span className="flex-1">{toast.message}</span>
            <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[998] bg-black/70 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setConfirmModal(null)}
          >
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="glass-card p-8 max-w-sm w-full space-y-5"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${confirmModal.action === 'start' ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-rose-500/20 border border-rose-500/30'}`}>
                {confirmModal.action === 'start' ? <Play className="w-6 h-6 text-emerald-400" /> : <Square className="w-6 h-6 text-rose-400" />}
              </div>
              <div>
                <h3 className="text-xl font-black text-white mb-1" style={{ fontFamily: 'Clash Display, sans-serif' }}>
                  {confirmModal.action === 'start' ? 'Start Exam?' : 'Terminate Exam?'}
                </h3>
                <p className="text-sm text-slate-400">
                  {confirmModal.action === 'start'
                    ? `"${confirmModal.examName}" will become visible to all students immediately.`
                    : `"${confirmModal.examName}" will end for all students. This cannot be undone without reopening.`}
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmModal(null)} className="flex-1 py-3 bg-white/8 border border-white/10 text-slate-300 text-xs font-black rounded-xl hover:bg-white/12 transition-all uppercase tracking-widest">Cancel</button>
                <button onClick={doConfirmAction}
                  className={`flex-1 py-3 text-white text-xs font-black rounded-xl transition-all uppercase tracking-widest ${confirmModal.action === 'start' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/30' : 'bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-900/30'}`}
                >
                  {confirmModal.action === 'start' ? '▶ Start' : '⏹ Terminate'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Question Modal */}
      <AnimatePresence>
        {deleteQuestionId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[998] bg-black/70 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setDeleteQuestionId(null)}
          >
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()} className="glass-card p-8 max-w-sm w-full space-y-5"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white mb-1" style={{ fontFamily: 'Clash Display, sans-serif' }}>Delete Question?</h3>
                <p className="text-sm text-slate-400">This action is permanent and cannot be undone.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteQuestionId(null)} className="flex-1 py-3 bg-white/8 border border-white/10 text-slate-300 text-xs font-black rounded-xl hover:bg-white/12 transition-all uppercase tracking-widest">Cancel</button>
                <button onClick={() => deleteQuestion(deleteQuestionId)} className="flex-1 py-3 bg-rose-600 text-white text-xs font-black rounded-xl hover:bg-rose-500 transition-all uppercase tracking-widest shadow-lg shadow-rose-900/30">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Overlay (mobile) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar — collapsible on all screens */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="fixed lg:relative inset-y-0 left-0 z-50 flex flex-col overflow-hidden bg-[#0D0D14] border-r border-white/8"
        style={{ minWidth: 0 }}
      >
        <div className="w-[260px] flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-white/8 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-violet-400" />
              </div>
              <h2 className="text-base font-black text-white" style={{ fontFamily: 'Clash Display, sans-serif' }}>Admin Portal</h2>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-white/8 rounded-xl text-slate-500 hover:text-slate-300 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-white/8 shrink-0">
            <div className="bg-white/4 rounded-2xl p-4 flex items-center gap-3 border border-white/8">
              <div className="w-10 h-10 rounded-xl bg-violet-600/30 flex items-center justify-center text-violet-300 font-black text-sm shrink-0">
                {user.displayName[0]}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-black text-white truncate">{user.displayName}</p>
                <p className="text-[10px] text-violet-400 uppercase tracking-widest font-bold">Administrator</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Sign out */}
          <div className="p-4 border-t border-white/8 shrink-0">
            <button onClick={() => signOut(auth)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-rose-400 hover:bg-rose-500/10 transition-all">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar with sidebar toggle */}
        <header className="h-16 border-b border-white/8 px-6 flex items-center justify-between bg-[#0D0D14]/80 backdrop-blur-xl sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4">
            {/* Sidebar toggle button — visible always */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 hover:bg-white/8 rounded-xl text-slate-400 hover:text-white transition-all border border-white/8"
              title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                <ShieldAlert className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <span className="font-black text-white text-sm" style={{ fontFamily: 'Clash Display, sans-serif' }}>
                {navItems.find(n => n.id === activeTab)?.label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Quick nav icons */}
            <div className="hidden sm:flex items-center gap-1">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  title={item.label}
                  className={`p-2 rounded-xl transition-all ${activeTab === item.id ? 'bg-violet-600/20 text-violet-400' : 'text-slate-600 hover:text-slate-300 hover:bg-white/5'}`}
                >
                  <item.icon className="w-4 h-4" />
                </button>
              ))}
            </div>
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-300 font-black text-xs">
              {user.displayName[0]}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto p-6 sm:p-8">
            <AnimatePresence mode="wait">

              {/* ── Analytics ── */}
              {activeTab === 'analytics' && (
                <motion.div key="analytics" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5">
                    <div>
                      <h1 className="text-4xl font-black text-white" style={{ fontFamily: 'Clash Display, sans-serif' }}>Analytics</h1>
                      <p className="text-slate-500 text-sm mt-1">Performance metrics across all assessments</p>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <select value={analyticsExamFilter} onChange={e => setAnalyticsExamFilter(e.target.value)}
                        className="input-field py-2.5 text-sm w-52">
                        <option value="all">All Exams</option>
                        {exams.map(exam => <option key={exam.id} value={exam.id}>{exam.name}</option>)}
                      </select>
                      <div className="flex gap-3">
                        {[
                          { label: 'Students', val: users.filter(u => u.role === 'student').length },
                          { label: 'Responses', val: filteredResponses.length }
                        ].map(({ label, val }) => (
                          <div key={label} className="glass-card px-5 py-3 text-center">
                            <p className="text-xs text-slate-500 font-bold">{label}</p>
                            <p className="text-2xl font-black text-white" style={{ fontFamily: 'Clash Display, sans-serif' }}>{val}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Top 3 Podium */}
                  {studentRankingData.length >= 1 && (
                    <div className="glass-card p-6 overflow-hidden">
                      <div className="flex items-center gap-3 mb-6">
                        <Trophy className="w-5 h-5 text-amber-400" />
                        <h3 className="font-black text-white" style={{ fontFamily: 'Clash Display, sans-serif' }}>Top Performers</h3>
                      </div>
                      <div className="flex items-end justify-center gap-4">
                        {/* 2nd place */}
                        {studentRankingData[1] && (
                          <div className="podium-rise-delay1 flex flex-col items-center gap-2 flex-1 max-w-[140px]">
                            <div className="w-12 h-12 rounded-full bg-slate-600/40 border-2 border-slate-400/40 flex items-center justify-center text-slate-300 font-black text-lg">
                              {studentRankingData[1].student.displayName[0]}
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-bold text-slate-300 truncate max-w-[120px]">{studentRankingData[1].student.displayName}</p>
                              <p className="silver-shimmer text-base font-black">{studentRankingData[1].totalScore}</p>
                            </div>
                            <div className="w-full bg-gradient-to-t from-slate-600/60 to-slate-500/30 rounded-t-xl border border-slate-500/30 flex items-center justify-center pt-3 pb-6" style={{ height: '80px' }}>
                              <span className="text-2xl">🥈</span>
                            </div>
                          </div>
                        )}
                        {/* 1st place */}
                        {studentRankingData[0] && (
                          <div className="podium-rise flex flex-col items-center gap-2 flex-1 max-w-[160px]">
                            <div className="crown-float text-2xl">👑</div>
                            <div className="w-14 h-14 rounded-full bg-amber-600/40 border-2 border-amber-400/60 flex items-center justify-center text-amber-200 font-black text-xl glow-gold">
                              {studentRankingData[0].student.displayName[0]}
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-bold text-white truncate max-w-[140px]">{studentRankingData[0].student.displayName}</p>
                              <p className="gold-shimmer text-xl font-black">{studentRankingData[0].totalScore}</p>
                            </div>
                            <div className="w-full bg-gradient-to-t from-amber-700/60 to-amber-600/30 rounded-t-xl border border-amber-500/30 flex items-center justify-center pt-3 pb-6" style={{ height: '110px' }}>
                              <span className="text-3xl">🥇</span>
                            </div>
                          </div>
                        )}
                        {/* 3rd place */}
                        {studentRankingData[2] && (
                          <div className="podium-rise-delay2 flex flex-col items-center gap-2 flex-1 max-w-[140px]">
                            <div className="w-12 h-12 rounded-full bg-orange-700/40 border-2 border-orange-500/40 flex items-center justify-center text-orange-200 font-black text-lg">
                              {studentRankingData[2].student.displayName[0]}
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-bold text-slate-300 truncate max-w-[120px]">{studentRankingData[2].student.displayName}</p>
                              <p className="bronze-shimmer text-base font-black">{studentRankingData[2].totalScore}</p>
                            </div>
                            <div className="w-full bg-gradient-to-t from-orange-700/60 to-orange-600/30 rounded-t-xl border border-orange-500/30 flex items-center justify-center pt-3 pb-6" style={{ height: '60px' }}>
                              <span className="text-2xl">🥉</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Student Rankings Table */}
                  <div className="glass-card overflow-hidden">
                    <div className="px-6 py-5 border-b border-white/8 flex items-center justify-between">
                      <h3 className="font-black text-white" style={{ fontFamily: 'Clash Display, sans-serif' }}>Student Rankings</h3>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/8">{studentRankingData.length} students</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[600px]">
                        <thead className="bg-white/3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/8">
                          <tr>
                            <th className="px-6 py-4">Rank</th>
                            <th className="px-6 py-4">Student</th>
                            <th className="px-6 py-4">Roll No.</th>
                            <th className="px-6 py-4">Score</th>
                            <th className="px-6 py-4">Responses</th>
                            <th className="px-6 py-4">Breakdown</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {studentRankingData.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-600 text-sm italic">No data yet.</td></tr>
                          ) : studentRankingData.map(item => (
                            <tr key={item.student.uid} className="hover:bg-white/3 transition-colors">
                              <td className="px-6 py-4">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${item.rank === 1 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : item.rank === 2 ? 'bg-slate-500/20 text-slate-300 border border-slate-500/30' : item.rank === 3 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-white/5 text-slate-500 border border-white/8'}`}>
                                  {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `#${item.rank}`}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-300 font-black text-xs shrink-0">
                                    {item.student.displayName[0]}
                                  </div>
                                  <div>
                                    <p className="font-black text-white text-sm">{item.student.displayName}</p>
                                    <p className="text-[11px] text-slate-500">{item.student.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4"><span className="data-value">{item.student.rollNumber || '—'}</span></td>
                              <td className="px-6 py-4"><span className="text-xl font-black text-white" style={{ fontFamily: 'Clash Display, sans-serif' }}>{item.totalScore}</span></td>
                              <td className="px-6 py-4"><span className="text-slate-400 font-bold text-sm">{item.totalResponses}</span></td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1.5">
                                  {item.examBreakdown.map((eb, idx) => (
                                    <span key={idx} className="px-2.5 py-1 bg-violet-600/10 border border-violet-500/20 text-violet-300 text-[10px] font-black rounded-lg">
                                      {eb.examName}: {eb.score}
                                    </span>
                                  ))}
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

              {/* ── Users ── */}
              {activeTab === 'users' && (
                <motion.div key="users" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-4xl font-black text-white" style={{ fontFamily: 'Clash Display, sans-serif' }}>Students</h1>
                      <p className="text-slate-500 text-sm mt-1">{users.filter(u => u.role === 'student').length} registered students</p>
                    </div>
                  </div>
                  <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[700px]">
                        <thead className="bg-white/3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/8">
                          <tr>
                            <th className="px-6 py-4">Student</th>
                            <th className="px-6 py-4">Roll No.</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Live Timer</th>
                            <th className="px-6 py-4">Last Active</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {users.filter(u => u.role === 'student').map(u => (
                            <tr key={u.uid} className="hover:bg-white/3 transition-colors">
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-300 font-black">
                                    {u.displayName[0]}
                                  </div>
                                  <div>
                                    <p className="font-black text-white">{u.displayName}</p>
                                    <p className="text-xs text-slate-500">{u.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-5"><span className="data-value">{u.rollNumber || '—'}</span></td>
                              <td className="px-6 py-5">
                                <div className="flex flex-wrap gap-1.5">
                                  {u.isFlagged && <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 text-[9px] font-black rounded-lg border border-amber-500/20 uppercase tracking-widest">Flagged</span>}
                                  {u.isTerminated && <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 text-[9px] font-black rounded-lg border border-rose-500/20 uppercase tracking-widest">Terminated</span>}
                                  {u.activeExamId && <span className="px-2.5 py-1 bg-violet-500/10 text-violet-400 text-[9px] font-black rounded-lg border border-violet-500/20 uppercase tracking-widest animate-pulse">In Exam</span>}
                                  {!u.isFlagged && !u.isTerminated && !u.activeExamId && <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-black rounded-lg border border-emerald-500/20 uppercase tracking-widest">Active</span>}
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                {u.activeExamId && u.examStartTime ? (
                                  <div className="flex items-center gap-2 text-rose-400 font-black font-mono text-sm">
                                    <Clock className="w-3.5 h-3.5" />
                                    {(() => {
                                      const exam = exams.find(e => e.id === u.activeExamId);
                                      if (!exam) return '—';
                                      const elapsed = Math.floor((Date.now() - new Date(u.examStartTime).getTime()) / 1000);
                                      const remaining = Math.max(0, exam.timeLimit * 60 - elapsed);
                                      return `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')}`;
                                    })()}
                                  </div>
                                ) : <span className="text-slate-600 text-sm italic">—</span>}
                              </td>
                              <td className="px-6 py-5 text-xs text-slate-500">{u.lastActive ? new Date(u.lastActive).toLocaleString() : 'Never'}</td>
                              <td className="px-6 py-5 text-right">
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => toggleFlag(u.uid, u.isFlagged)} className={`p-2.5 rounded-xl transition-all ${u.isFlagged ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/5 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 border border-white/8'}`}>
                                    <AlertTriangle className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => toggleTerminate(u.uid, u.isTerminated)} className={`p-2.5 rounded-xl transition-all ${u.isTerminated ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-white/5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-white/8'}`}>
                                    <ShieldAlert className="w-4 h-4" />
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

              {/* ── Exams ── */}
              {activeTab === 'exams' && (
                <motion.div key="exams" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
                  <div>
                    <h1 className="text-4xl font-black text-white" style={{ fontFamily: 'Clash Display, sans-serif' }}>Exams</h1>
                    <p className="text-slate-500 text-sm mt-1">Create and manage examination containers</p>
                  </div>

                  {/* Create Exam */}
                  <div className="glass-card p-8 space-y-6">
                    <h3 className="text-xl font-black text-white" style={{ fontFamily: 'Clash Display, sans-serif' }}>Create New Exam</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <div className="space-y-2">
                        <label className="micro-label ml-1">Title</label>
                        <input type="text" placeholder="e.g. CS Fundamentals" className="input-field py-3 text-sm" value={newExamName} onChange={e => setNewExamName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <label className="micro-label ml-1">Description</label>
                        <input type="text" placeholder="Brief overview" className="input-field py-3 text-sm" value={newExamDesc} onChange={e => setNewExamDesc(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <label className="micro-label ml-1">Time (Minutes)</label>
                        <input type="number" placeholder="60" className="input-field py-3 text-sm" value={newExamTimeLimit} onChange={e => setNewExamTimeLimit(e.target.value)} />
                      </div>
                    </div>
                    <div className="p-4 bg-violet-600/10 border border-violet-500/20 rounded-xl text-violet-300 text-sm flex items-start gap-3">
                      <Play className="w-4 h-4 mt-0.5 shrink-0 text-violet-400" />
                      <p>Created exams are <strong>hidden from students</strong> until you press the <strong>Start</strong> button. This lets you add questions first.</p>
                    </div>
                    <button onClick={createExam} className="btn-primary py-3 px-8 text-sm">Create Exam</button>
                  </div>

                  {/* Exam List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {exams.map(exam => {
                      const isTerminated = !!(exam as any).terminatedAt;
                      const isStarted = !!(exam as any).isStarted;
                      return (
                        <motion.div whileHover={{ y: -4 }} key={exam.id} className="glass-card p-6 space-y-5">
                          <div className="flex justify-between items-start">
                            <div className="w-10 h-10 rounded-xl bg-violet-600/15 border border-violet-500/20 flex items-center justify-center">
                              <BookOpen className="w-5 h-5 text-violet-400" />
                            </div>
                            {isTerminated ? (
                              <span className="px-3 py-1 text-[9px] font-black rounded-full border uppercase tracking-widest bg-rose-500/10 text-rose-400 border-rose-500/20">Terminated</span>
                            ) : isStarted ? (
                              <span className="px-3 py-1 text-[9px] font-black rounded-full border uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
                              </span>
                            ) : (
                              <span className="px-3 py-1 text-[9px] font-black rounded-full border uppercase tracking-widest bg-amber-500/10 text-amber-400 border-amber-500/20">Draft</span>
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-white mb-1" style={{ fontFamily: 'Clash Display, sans-serif' }}>{exam.name}</h3>
                            <p className="text-slate-500 text-sm line-clamp-2">{exam.description}</p>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <Clock className="w-3.5 h-3.5" /> {exam.timeLimit}m
                            <span className="w-1 h-1 rounded-full bg-slate-700" />
                            {questions.filter(q => q.examId === exam.id).length} questions
                          </div>
                          <div className="flex flex-col gap-2">
                            {isTerminated ? (
                              <button onClick={() => resetExamTermination(exam.id)} className="w-full py-2.5 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-xl hover:bg-emerald-600/20 transition-all uppercase tracking-widest">
                                ↺ Reopen Exam
                              </button>
                            ) : isStarted ? (
                              <button onClick={() => terminateExam(exam.id, exam.name)} className="w-full py-2.5 bg-rose-600/10 border border-rose-500/20 text-rose-400 text-[10px] font-black rounded-xl hover:bg-rose-600/20 transition-all uppercase tracking-widest flex items-center justify-center gap-1.5">
                                <Square className="w-3 h-3" /> Terminate Exam
                              </button>
                            ) : (
                              <>
                                <button onClick={() => startExam(exam.id, exam.name)} className="w-full py-2.5 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-xl hover:bg-emerald-600/20 transition-all uppercase tracking-widest flex items-center justify-center gap-1.5">
                                  <Play className="w-3 h-3" /> Start Exam
                                </button>
                                <button onClick={() => terminateExam(exam.id, exam.name)} className="w-full py-2.5 bg-rose-600/10 border border-rose-500/20 text-rose-400 text-[10px] font-black rounded-xl hover:bg-rose-600/20 transition-all uppercase tracking-widest flex items-center justify-center gap-1.5">
                                  <Square className="w-3 h-3" /> Terminate
                                </button>
                              </>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* ── Questions / Assessments ── */}
              {activeTab === 'questions' && (
                <motion.div key="questions" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
                  {!selectedExamForQuestions ? (
                    <>
                      <div>
                        <h1 className="text-4xl font-black text-white" style={{ fontFamily: 'Clash Display, sans-serif' }}>Assessments</h1>
                        <p className="text-slate-500 text-sm mt-1">Select an exam to manage its question bank</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {exams.map(exam => (
                          <motion.button whileHover={{ y: -4 }} key={exam.id} onClick={() => setSelectedExamForQuestions(exam)}
                            className="glass-card p-6 text-left group hover:border-violet-500/30 transition-all border border-white/8"
                          >
                            <div className="flex justify-between items-start mb-5">
                              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center group-hover:bg-violet-600/20 group-hover:border-violet-500/30 transition-all">
                                <BookOpen className="w-5 h-5 text-slate-500 group-hover:text-violet-400 transition-colors" />
                              </div>
                              <div className="text-right">
                                <p className="micro-label mb-1">Questions</p>
                                <p className="text-xl font-black text-white" style={{ fontFamily: 'Clash Display, sans-serif' }}>{questions.filter(q => q.examId === exam.id).length}</p>
                              </div>
                            </div>
                            <h3 className="text-lg font-black text-white mb-1" style={{ fontFamily: 'Clash Display, sans-serif' }}>{exam.name}</h3>
                            <p className="text-slate-500 text-sm line-clamp-2">{exam.description}</p>
                            <div className="mt-4 flex items-center gap-2 text-violet-400 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                              Manage Questions <ArrowRight className="w-3 h-3" />
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedExamForQuestions(null)} className="p-2.5 glass-card text-slate-400 hover:text-white transition-all active:scale-90">
                          <ArrowRight className="w-5 h-5 rotate-180" />
                        </button>
                        <div>
                          <h1 className="text-4xl font-black text-white" style={{ fontFamily: 'Clash Display, sans-serif' }}>{selectedExamForQuestions.name}</h1>
                          <p className="text-slate-500 text-sm mt-0.5">{questions.filter(q => q.examId === selectedExamForQuestions.id).length} questions</p>
                        </div>
                      </div>

                      {/* Add Question Card */}
                      <div className="glass-card overflow-hidden">
                        <div className="flex border-b border-white/8">
                          <button onClick={() => setQuestionAddMode('manual')}
                            className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-widest transition-all ${questionAddMode === 'manual' ? 'bg-violet-600/20 text-violet-300 border-b-2 border-violet-500' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}>
                            <Plus className="w-4 h-4" /> Manual
                          </button>
                          <button onClick={() => { setQuestionAddMode('ai'); setAiPreview([]); setAiError(''); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-widest transition-all ${questionAddMode === 'ai' ? 'bg-violet-600/20 text-violet-300 border-b-2 border-violet-500' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}>
                            <Star className="w-4 h-4" /> AI Generate
                          </button>
                        </div>

                        {questionAddMode === 'manual' && (
                          <div className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div className="space-y-2">
                                <label className="micro-label ml-1">Question Text</label>
                                <textarea placeholder="Enter the question..." className="input-field min-h-[100px] py-3 text-sm" id="newQText" />
                              </div>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1.5">
                                    <label className="micro-label ml-1">Section</label>
                                    <input type="text" id="newQSection" placeholder="e.g. AI" className="input-field py-2.5 text-sm" />
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="micro-label ml-1">Difficulty</label>
                                    <select id="newQDiff" className="input-field py-2.5 text-sm">
                                      <option value="easy">Easy</option>
                                      <option value="medium">Medium</option>
                                      <option value="hard">Hard</option>
                                    </select>
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  <label className="micro-label ml-1">Options (comma-separated)</label>
                                  <input type="text" id="newQOptions" placeholder="A, B, C, D" className="input-field py-2.5 text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="micro-label ml-1">Correct Index (0–3)</label>
                                  <input type="number" id="newQCorrect" min="0" max="3" placeholder="0" className="input-field py-2.5 text-sm" />
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
                              showToast('Question added!', 'success');
                            }} className="btn-primary py-3 text-sm w-full">
                              Add Question
                            </button>
                          </div>
                        )}

                        {questionAddMode === 'ai' && (
                          <div className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div className="lg:col-span-2 space-y-2">
                                <label className="micro-label ml-1">Topic</label>
                                <input type="text" placeholder="e.g. Binary Trees" className="input-field py-3 text-sm" value={aiTopic} onChange={e => setAiTopic(e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                <label className="micro-label ml-1">Section</label>
                                <input type="text" placeholder="e.g. Data Structures" className="input-field py-3 text-sm" value={aiSection} onChange={e => setAiSection(e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                <label className="micro-label ml-1">Count</label>
                                <input type="number" min={1} max={20} className="input-field py-3 text-sm" value={aiCount} onChange={e => setAiCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))} />
                              </div>
                            </div>
                            <button disabled={!aiTopic.trim() || aiGenerating}
                              onClick={async () => {
                                setAiGenerating(true); setAiError(''); setAiPreview([]);
                                const existingTexts = questions.filter(q => q.examId === selectedExamForQuestions!.id).map(q => q.text);
                                try {
                                  const { GoogleGenAI } = await import('@google/genai');
                                  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
                                  const prompt = `Generate exactly ${aiCount} unique MCQ questions on: "${aiTopic}". Difficulty: ${aiDifficulty}. Section: ${aiSection || aiTopic}.\nAvoid: ${existingTexts.length > 0 ? existingTexts.join(', ') : 'None'}\nReturn ONLY JSON array: [{"text":"...","options":["A","B","C","D"],"correctAnswer":0,"section":"${aiSection || aiTopic}","difficulty":"${aiDifficulty}"}]`;
                                  const result = await ai.models.generateContent({ model: 'gemini-2.0-flash', config: { systemInstruction: 'Return ONLY valid JSON array of MCQ questions. No markdown, no explanation.' }, contents: prompt });
                                  const clean = (result.text || '').replace(/```json|```/g, '').trim();
                                  setAiPreview(JSON.parse(clean));
                                } catch (err: any) {
                                  setAiError('Generation failed. Try again.');
                                } finally { setAiGenerating(false); }
                              }}
                              className="btn-primary py-3 px-8 disabled:opacity-40 text-sm"
                            >
                              {aiGenerating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating…</> : <><Star className="w-4 h-4" /> Generate {aiCount} Questions</>}
                            </button>
                            {aiError && <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />{aiError}</div>}
                            {aiPreview.length > 0 && (
                              <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                  <p className="text-sm font-bold text-slate-300">{aiPreview.length} questions generated</p>
                                  <button onClick={() => setAiPreview([])} className="text-xs text-slate-500 hover:text-rose-400 font-black uppercase tracking-widest">Clear</button>
                                </div>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                  {aiPreview.map((q, i) => (
                                    <div key={i} className="p-4 bg-white/3 rounded-xl border border-white/8 space-y-3">
                                      <div className="flex items-start justify-between gap-3">
                                        <p className="font-bold text-white text-sm flex-1">{i + 1}. {q.text}</p>
                                        <button onClick={() => setAiPreview(prev => prev.filter((_, idx) => idx !== i))} className="p-1.5 hover:bg-rose-500/15 rounded-lg text-slate-600 hover:text-rose-400 transition-colors shrink-0">
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                      <div className="grid grid-cols-2 gap-1.5">
                                        {q.options.map((opt, oIdx) => (
                                          <div key={oIdx} className={`px-3 py-2 rounded-lg text-xs font-medium border ${oIdx === q.correctAnswer ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-white/3 border-white/8 text-slate-400'}`}>
                                            <span className="opacity-40 mr-1">{String.fromCharCode(65 + oIdx)}.</span>{opt}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <button disabled={savingAi} onClick={async () => {
                                  setSavingAi(true);
                                  try {
                                    const existingTexts = questions.filter(q => q.examId === selectedExamForQuestions!.id).map(q => q.text.toLowerCase());
                                    let saved = 0;
                                    for (const q of aiPreview) {
                                      if (!existingTexts.includes(q.text.toLowerCase())) {
                                        await addDoc(collection(db, 'questions'), { examId: selectedExamForQuestions!.id, ...q });
                                        saved++;
                                      }
                                    }
                                    setAiPreview([]); setAiTopic('');
                                    showToast(`${saved} questions added!`, 'success');
                                  } catch { setAiError('Save failed.'); }
                                  finally { setSavingAi(false); }
                                }} className="btn-primary w-full py-3 text-sm">
                                  {savingAi ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</> : <>Save {aiPreview.length} Questions</>}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Question Bank */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {questions.filter(q => q.examId === selectedExamForQuestions.id).map((q, idx) => (
                          <div key={q.id} className="glass-card p-5 hover:border-violet-500/20 transition-all border border-white/8 group relative space-y-4">
                            <div className="flex justify-between items-start">
                              <div className="flex gap-2 flex-wrap">
                                <span className="px-2.5 py-1 bg-violet-600/20 border border-violet-500/30 text-violet-300 text-[9px] font-black rounded-full uppercase tracking-widest">{q.section}</span>
                                <span className={`px-2.5 py-1 text-[9px] font-black rounded-full border uppercase tracking-widest ${q.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : q.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>{q.difficulty}</span>
                              </div>
                              <button
                                onClick={() => setDeleteQuestionId(q.id)}
                                className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-rose-500/15 rounded-lg text-slate-600 hover:text-rose-400 transition-all shrink-0"
                                title="Delete question"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-sm font-bold text-white leading-snug line-clamp-3">{q.text}</p>
                            <div className="space-y-1.5">
                              {q.options.map((opt: string, oIdx: number) => (
                                <div key={oIdx} className={`px-3 py-2 rounded-lg text-xs font-medium border ${oIdx === q.correctAnswer ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-white/3 border-white/6 text-slate-500'}`}>
                                  <span className="opacity-40 mr-1.5">{String.fromCharCode(65 + oIdx)}.</span>{opt}
                                </div>
                              ))}
                            </div>
                            <div className="absolute top-3 right-12 text-slate-700/30 font-black text-5xl select-none" style={{ fontFamily: 'Clash Display, sans-serif' }}>
                              {(idx + 1).toString().padStart(2, '0')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* ── Profile / Settings ── */}
              {activeTab === 'profile' && (
                <motion.div key="profile" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="max-w-2xl space-y-8">
                  <div>
                    <h1 className="text-4xl font-black text-white" style={{ fontFamily: 'Clash Display, sans-serif' }}>Settings</h1>
                    <p className="text-slate-500 text-sm mt-1">Administrator account information</p>
                  </div>
                  <div className="glass-card p-8 space-y-8">
                    <div className="flex items-center gap-5">
                      <div className="w-20 h-20 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-300 font-black text-3xl" style={{ fontFamily: 'Clash Display, sans-serif' }}>
                        {user.displayName[0]}
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Clash Display, sans-serif' }}>{user.displayName}</h2>
                        <span className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 bg-violet-600/20 border border-violet-500/30 text-violet-300 text-[10px] font-black rounded-full uppercase tracking-widest">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Verified Administrator
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {[
                        { label: 'Email Address', val: user.email },
                        { label: 'Admin Hashcode', val: adminConfig?.hashcode || '—' },
                      ].map(({ label, val }) => (
                        <div key={label} className="space-y-2">
                          <p className="micro-label ml-1">{label}</p>
                          <div className="p-4 bg-white/4 rounded-xl border border-white/8">
                            <p className="text-sm font-bold text-white font-mono">{val}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => auth.signOut()} className="w-full py-4 bg-rose-600/10 border border-rose-500/20 text-rose-400 font-black rounded-2xl hover:bg-rose-600/20 transition-all flex items-center justify-center gap-3">
                      <LogOut className="w-5 h-5" /> Sign Out
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
