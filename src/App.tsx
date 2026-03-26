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
import { LogIn, ShieldAlert, User as UserIcon, BarChart3, Users, LogOut, Clock, CheckCircle2, AlertTriangle, Eye, EyeOff, Menu, X, ArrowRight, Plus, ChevronRight, Search, Bell, Settings, Lock, Trash2, Play, ChevronLeft, ChevronRight as ChevronR, Trophy, Medal, Award, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';

// --- Components ---

const LoadingScreen = () => (
  <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-8"
    >
      <div className="relative">
        <div className="w-20 h-20 border-4 border-slate-200 rounded-full" />
        <div className="w-20 h-20 border-4 border-slate-900 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
      </div>
      <div className="text-center">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight font-display">BBDU <span className="italic-sense">Portal</span></h2>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Initializing Secure Environment</p>
      </div>
    </motion.div>
  </div>
);

const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);
  useEffect(() => {
    const handleError = (e: ErrorEvent) => {
      console.error(e);
      setHasError(true);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-card p-12 text-center">
          <div className="w-24 h-24 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-rose-100">
            <ShieldAlert className="w-12 h-12 text-rose-500" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight font-display">System <span className="italic-sense text-rose-500/80">Interruption</span></h2>
          <p className="text-slate-500 font-medium mb-10 leading-relaxed">The application encountered an unexpected error. Our security protocols have paused the session.</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary w-full"
          >
            Restart Application
          </button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

// --- Top 3 Celebration Popup ---
function Top3CelebrationPopup({ rank, name, onClose }: { rank: number, name: string, onClose: () => void }) {
  const configs = {
    1: { icon: Trophy, color: 'from-amber-400 to-yellow-300', border: 'border-amber-300', text: 'text-amber-900', label: '🥇 1st Place!', bg: 'bg-amber-50' },
    2: { icon: Medal, color: 'from-slate-400 to-slate-300', border: 'border-slate-300', text: 'text-slate-800', label: '🥈 2nd Place!', bg: 'bg-slate-50' },
    3: { icon: Award, color: 'from-orange-400 to-amber-300', border: 'border-orange-300', text: 'text-orange-900', label: '🥉 3rd Place!', bg: 'bg-orange-50' },
  }[rank] || { icon: Star, color: 'from-indigo-500 to-indigo-400', border: 'border-indigo-300', text: 'text-indigo-900', label: 'Top 3!', bg: 'bg-indigo-50' };
  const IconComp = configs.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-md"
      onClick={onClose}
    >
      {/* Confetti particles */}
      {Array.from({ length: 24 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 0, x: 0, rotate: 0 }}
          animate={{
            opacity: [0, 1, 0],
            y: [0, -200 - Math.random() * 200],
            x: [(Math.random() - 0.5) * 400],
            rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)]
          }}
          transition={{ duration: 2 + Math.random(), delay: Math.random() * 0.5, ease: 'easeOut' }}
          className="absolute w-3 h-3 rounded-sm pointer-events-none"
          style={{
            background: ['#fbbf24','#f59e0b','#34d399','#60a5fa','#f472b6','#a78bfa'][i % 6],
            left: `${30 + Math.random() * 40}%`,
            top: '50%'
          }}
        />
      ))}
      <motion.div
        initial={{ scale: 0.3, opacity: 0, y: 60 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        onClick={e => e.stopPropagation()}
        className={`relative bg-white rounded-3xl shadow-2xl p-10 max-w-xs w-full mx-4 border-2 ${configs.border} overflow-hidden text-center`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${configs.color} opacity-10`} />
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${configs.color} flex items-center justify-center mx-auto mb-6 shadow-xl`}
        >
          <IconComp className="w-12 h-12 text-white" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-4xl font-black text-slate-900 mb-2 font-display"
        >
          {configs.label}
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-slate-500 font-bold mb-2"
        >
          Congratulations,
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-2xl font-black text-slate-900 mb-8"
        >
          {name}!
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6"
        >
          You're in the top 3 — outstanding!
        </motion.p>
        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-900 text-white font-black rounded-2xl text-sm uppercase tracking-widest hover:bg-slate-800 transition-all"
        >
          Continue
        </button>
      </motion.div>
    </motion.div>
  );
}

// --- Main Application ---

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
            const isAdmin = adminEmails.includes(firebaseUser.email || "");
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || 'Student',
              role: isAdmin ? 'admin' : 'student',
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
      <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500/30">
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

// --- Views ---

function CompleteProfileView({ user, setUser }: { user: UserProfile, setUser: (u: UserProfile) => void }) {
  const [rollNumber, setRollNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNumber.trim()) {
      setError('University Roll Number is required');
      return;
    }
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        rollNumber: rollNumber.trim()
      });
      setUser({ ...user, rollNumber: rollNumber.trim() });
    } catch (err: any) {
      setError('Failed to update profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6"
    >
      <div className="max-w-md w-full glass-card p-12">
        <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center mx-auto mb-10 border border-indigo-100">
          <UserIcon className="w-12 h-12 text-indigo-600" />
        </div>
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight font-display">Complete <span className="italic-sense">Profile</span></h2>
          <p className="text-slate-500 font-medium">Please enter your University Roll Number to proceed to the portal.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">University Roll Number</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                <ShieldAlert className="h-6 w-6 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type="text"
                required
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="e.g. 2023001234"
                className="input-field pl-16"
              />
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-5 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-4 text-rose-600 text-sm font-bold"
            >
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? (
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Complete Setup
                <ArrowRight className="w-6 h-6" />
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
}

function LoginView({ isAdminMode, setIsAdminMode, adminConfig, setAdminConfig }: any) {
  const [adminIdentifier, setAdminIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Roll number collection for Google sign-in students
  const [pendingGoogleUser, setPendingGoogleUser] = useState<any>(null);
  const [rollNumberInput, setRollNumberInput] = useState('');
  const [rollNumberLoading, setRollNumberLoading] = useState(false);
  const [rollNumberError, setRollNumberError] = useState('');

  const handleGoogleLogin = async () => {
    try {
      setError('');
      const result = await signInWithGoogle();
      // Check if this user already has a roll number
      if (result?.user) {
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        const adminEmails = ["ahmadabdullah007860@gmail.com", "sumansingh.ss1972@gmail.com", "wolfickbriandumbledore@gmail.com"];
        const isAdmin = adminEmails.includes(result.user.email || "");
        if (!isAdmin && (!userDoc.exists() || !userDoc.data()?.rollNumber)) {
          // Need roll number before proceeding — store pending user info
          setPendingGoogleUser(result.user);
        }
        // If admin or already has roll number, normal onAuthStateChanged flow handles it
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRollNumberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNumberInput.trim()) {
      setRollNumberError('Roll number is required');
      return;
    }
    setRollNumberLoading(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', pendingGoogleUser.uid));
      if (userDoc.exists()) {
        await updateDoc(doc(db, 'users', pendingGoogleUser.uid), { rollNumber: rollNumberInput.trim() });
      } else {
        await setDoc(doc(db, 'users', pendingGoogleUser.uid), {
          uid: pendingGoogleUser.uid,
          email: pendingGoogleUser.email,
          displayName: pendingGoogleUser.displayName || 'Student',
          role: 'student',
          isFlagged: false,
          isTerminated: false,
          lastActive: new Date().toISOString(),
          rollNumber: rollNumberInput.trim()
        });
      }
      setPendingGoogleUser(null);
      // onAuthStateChanged will now detect the user and load the profile
    } catch (err: any) {
      setRollNumberError('Failed to save roll number: ' + err.message);
    } finally {
      setRollNumberLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!adminConfig?.isInitialized) {
      setIsSettingUp(true);
      return;
    }

    try {
      const loginEmail = adminIdentifier.includes('@') ? adminIdentifier : adminConfig.email!;
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        // Success
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
        setError('Invalid credentials: ' + err.message);
      }
    }
  };

  const handleAdminSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, adminIdentifier, password);
      const newHashcode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      const newConfig = {
        email: adminIdentifier,
        passwordHash: password,
        hashcode: newHashcode,
        isInitialized: true
      };
      
      await setDoc(doc(db, 'config', 'admin'), newConfig);
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: adminIdentifier,
        displayName: 'Administrator',
        role: 'admin',
        isFlagged: false,
        isTerminated: false,
        lastActive: new Date().toISOString()
      });
      
      setAdminConfig(newConfig);
      setIsSettingUp(false);
      alert(`Admin setup complete! Your unique hashcode is: ${newHashcode}. Save this!`);
    } catch (err: any) {
      setError('Setup failed: ' + err.message);
    }
  };

  // Roll number collection overlay for Google sign-in
  if (pendingGoogleUser) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-white"
      >
        <div className="max-w-md w-full glass-card p-10">
          <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-indigo-100">
            <UserIcon className="w-10 h-10 text-indigo-600" />
          </div>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-slate-900 mb-3 font-display">One More Step</h2>
            <p className="text-slate-500 font-medium text-sm">Welcome, <span className="font-black text-slate-900">{pendingGoogleUser.displayName || 'Student'}</span>! Please enter your University Roll Number to continue.</p>
          </div>
          <form onSubmit={handleRollNumberSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">University Roll Number</label>
              <div className="relative">
                <ShieldAlert className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={rollNumberInput}
                  onChange={e => setRollNumberInput(e.target.value)}
                  placeholder="e.g. 2023001234"
                  className="input-field pl-14"
                />
              </div>
            </div>
            {rollNumberError && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm font-bold flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                {rollNumberError}
              </div>
            )}
            <button type="submit" disabled={rollNumberLoading} className="btn-primary w-full">
              {rollNumberLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Continue <ArrowRight className="w-5 h-5" /></>}
            </button>
            <button type="button" onClick={async () => { await signOut(auth); setPendingGoogleUser(null); }} className="w-full text-xs text-slate-400 font-bold hover:text-rose-500 transition-colors py-2">
              Cancel & Sign Out
            </button>
          </form>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-white"
    >
      <div className="max-w-md w-full space-y-8 sm:space-y-12">
        <div className="text-center">
          <motion.div 
            initial={{ rotate: -10, scale: 0.9 }}
            animate={{ rotate: 3, scale: 1 }}
            className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-900 rounded-2xl sm:rounded-[2rem] flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-2xl shadow-slate-900/20"
          >
            <ShieldAlert className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
          </motion.div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-2 sm:mb-3 font-display">Secure<span className="italic-sense text-slate-900">Assess</span></h1>
          <p className="text-slate-500 font-medium tracking-wide uppercase text-[8px] sm:text-[10px] font-black tracking-[0.2em] sm:tracking-[0.3em]">Enterprise Assessment Platform</p>
        </div>

        <div className="glass-card p-6 sm:p-10">
          <div className="flex p-1 sm:p-1.5 bg-slate-100 rounded-xl sm:rounded-2xl mb-8 sm:mb-10">
            <button 
              onClick={() => { setIsAdminMode(false); setIsSettingUp(false); setError(''); }}
              className={`flex-1 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${!isAdminMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Student
            </button>
            <button 
              onClick={() => { setIsAdminMode(true); setError(''); }}
              className={`flex-1 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${isAdminMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Admin
            </button>
          </div>

          <AnimatePresence mode="wait">
            {!isAdminMode ? (
              <motion.div
                key="student"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <div className="text-center space-y-4">
                  <p className="text-slate-500 font-medium leading-relaxed text-sm">Sign in with your institutional Google account. You'll be asked for your roll number on first login.</p>
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-700 text-xs font-bold flex items-center gap-3">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    Roll number required for all students
                  </div>
                  <button 
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-4 bg-white border border-slate-200 text-slate-900 font-bold py-5 px-6 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-[0.98]"
                  >
                    <img src="https://www.google.com/favicon.ico" className="w-6 h-6" alt="Google" />
                    Continue with Google
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="admin"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={isSettingUp ? handleAdminSetup : handleAdminLogin}
                className="space-y-6"
              >
                {isSettingUp && (
                  <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-700 text-sm font-medium mb-6">
                    Initial setup: Create the primary administrator account.
                  </div>
                )}
                
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Identifier</label>
                  <div className="relative">
                    <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder={isSettingUp ? "Admin Email" : "Email or Hashcode"}
                      className="input-field pl-16"
                      value={adminIdentifier}
                      onChange={(e) => setAdminIdentifier(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••"
                      className="input-field pl-16 pr-16"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold rounded-2xl flex items-center gap-4"
                  >
                    <AlertTriangle className="w-6 h-6 shrink-0" />
                    {error}
                  </motion.div>
                )}

                <button type="submit" className="btn-primary w-full mt-6">
                  {isSettingUp ? 'Initialize Admin' : 'Access Dashboard'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
        
        <p className="text-center mt-10 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
          &copy; 2026 SecureAssess. <span className="italic-sense text-[10px]">Excellence in Evaluation</span>
        </p>
      </div>
    </motion.div>
  );
}

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
  // Top 3 celebration
  const [celebrationRank, setCelebrationRank] = useState<{ rank: number; name: string } | null>(null);
  const [allResponses, setAllResponses] = useState<UserResponse[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  useEffect(() => { responsesRef.current = responses; }, [responses]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);
  useEffect(() => { selectedExamRef.current = selectedExam; }, [selectedExam]);

  // Listen for all responses and users for ranking
  useEffect(() => {
    const rUnsub = onSnapshot(collection(db, 'responses'), snap => {
      setAllResponses(snap.docs.map(d => d.data() as UserResponse));
    });
    const uUnsub = onSnapshot(collection(db, 'users'), snap => {
      setAllUsers(snap.docs.map(d => d.data() as UserProfile));
    });
    return () => { rUnsub(); uUnsub(); };
  }, []);

  // Check rank whenever responses update
  useEffect(() => {
    if (allResponses.length === 0 || allUsers.length === 0) return;
    const students = allUsers.filter(u => u.role === 'student');
    const ranked = students.map(s => {
      const score = allResponses.filter(r => r.userId === s.uid).reduce((sum, r) => sum + (r.score || 0), 0);
      return { uid: s.uid, name: s.displayName, score };
    }).sort((a, b) => b.score - a.score);
    const myRank = ranked.findIndex(r => r.uid === user.uid) + 1;
    if (myRank >= 1 && myRank <= 3) {
      const myScore = ranked[myRank - 1]?.score || 0;
      if (myScore > 0) {
        setCelebrationRank({ rank: myRank, name: user.displayName });
      }
    }
  }, [allResponses]);

  useEffect(() => {
    if (!isExamStarted || examFinished) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinishExam();
          return 0;
        }
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

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'exams'), (snap) => {
      // Only show exams that admin has started (isActive = true AND startedAt exists)
      setExams(snap.docs.map(d => ({ id: d.id, ...d.data() } as Exam)).filter(e => e.isActive && (e as any).startedAt));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'exams');
    });
    return () => unsub();
  }, []);

  const handleSelectExam = async (exam: Exam) => {
    if ((user.submittedExams ?? []).includes(exam.id)) {
      alert("You have already submitted this exam and cannot attempt it again.");
      return;
    }
    try {
      const qSnap = await getDocs(query(collection(db, 'questions'), where('examId', '==', exam.id)));
      const examQuestions = qSnap.docs.map(d => ({ id: d.id, ...d.data() } as Question));
      if (examQuestions.length === 0) {
        alert("This exam has no questions yet.");
        return;
      }
      setTimeLeft(exam.timeLimit * 60);
      const rSnap = await getDocs(query(
        collection(db, 'responses'), 
        where('userId', '==', user.uid),
        where('examId', '==', exam.id)
      ));
      const existingResponses: Record<string, { option: number, timeTaken: number, score: number }> = {};
      rSnap.docs.forEach(d => {
        const data = d.data();
        if (data.selectedOption !== -1) {
          existingResponses[data.questionId] = {
            option: data.selectedOption,
            timeTaken: data.timeTaken,
            score: data.score
          };
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
      alert("You have already submitted this exam and cannot attempt it again.");
      setSelectedExam(null);
      return;
    }
    try {
      const examSnap = await getDoc(doc(db, 'exams', selectedExam.id));
      terminatedAtOnStartRef.current = examSnap.data()?.terminatedAt ?? null;
      isFinishingRef.current = false;
      await updateDoc(doc(db, 'users', user.uid), {
        activeExamId: selectedExam.id,
        examStartTime: new Date().toISOString()
      });
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
        activeExamId: null,
        examStartTime: null,
        lastActive: new Date().toISOString(),
        submittedExams: updatedSubmittedExams
      });
      setUser({ ...user, submittedExams: updatedSubmittedExams, activeExamId: undefined, examStartTime: undefined });
      for (const [qId, data] of Object.entries(currentResponses) as [string, { option: number, timeTaken: number, score: number }][]) {
        const question = currentQuestions.find(q => q.id === qId);
        if (!question) continue;
        await setDoc(doc(db, 'responses', `${user.uid}_${qId}`), {
          userId: user.uid,
          examId: currentExam.id,
          questionId: qId,
          selectedOption: data.option,
          timestamp: new Date().toISOString(),
          isCorrect: data.option === question.correctAnswer,
          timeTaken: data.timeTaken,
          score: data.score
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'responses');
    }
  };

  if (examFinished) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8F9FA]">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm w-full text-center glass-card p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500" />
          <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-100 relative">
            <div className="absolute inset-0 bg-emerald-500/10 rounded-3xl animate-ping" />
            <CheckCircle2 className="w-10 h-10 text-emerald-500 relative z-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight font-display leading-tight">Submitted!</h2>
          <p className="text-slate-500 font-medium mb-8 leading-relaxed text-sm">Your responses have been saved. You may now sign out.</p>
          <button onClick={() => signOut(auth)} className="btn-primary w-full py-4 text-sm shadow-lg">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
          <p className="mt-5 micro-label tracking-widest opacity-50">ID: {user.uid.slice(0, 8)}</p>
        </motion.div>
      </div>
    );
  }

  if (isExamStarted) {
    return (
      <MCQInterface 
        questions={questions} 
        responses={responses} 
        setResponses={setResponses} 
        timeLeft={timeLeft} 
        onFinish={handleFinishExam}
        userId={user.uid}
        examId={selectedExam?.id}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <AnimatePresence>
        {celebrationRank && (
          <Top3CelebrationPopup
            rank={celebrationRank.rank}
            name={celebrationRank.name}
            onClose={() => setCelebrationRank(null)}
          />
        )}
      </AnimatePresence>
      <div className="max-w-lg mx-auto px-4 pt-8 pb-20">
        {user.isFlagged && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-700"
          >
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-xs font-bold">Account flagged for suspicious activity.</p>
          </motion.div>
        )}

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display">
              Hi, <span className="serif-heading text-indigo-600">{user.displayName.split(' ')[0]}</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">{user.email}</p>
          </div>
          <button 
            onClick={() => signOut(auth)} 
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {!selectedExam ? (
          <div className="space-y-4">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Available Assessments</h2>
            <div className="space-y-3">
              {exams.map(exam => {
                const isSubmitted = (user.submittedExams ?? []).includes(exam.id);
                return (
                  <motion.button
                    whileTap={isSubmitted ? {} : { scale: 0.98 }}
                    key={exam.id}
                    onClick={() => !isSubmitted && handleSelectExam(exam)}
                    disabled={isSubmitted}
                    className={`glass-card p-5 text-left w-full flex items-center gap-4 transition-all ${isSubmitted ? 'opacity-60 cursor-not-allowed bg-slate-50' : 'active:bg-slate-50 cursor-pointer'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSubmitted ? 'bg-emerald-50 text-emerald-500' : 'bg-indigo-50 text-indigo-600'}`}>
                      {isSubmitted ? <CheckCircle2 className="w-5 h-5" /> : <BarChart3 className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-black text-slate-900 font-display truncate">{exam.name}</h3>
                      <p className="text-slate-400 text-xs font-medium truncate mt-0.5">
                        {isSubmitted ? 'Already submitted — cannot retake' : exam.description}
                      </p>
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
              {exams.length === 0 && (
                <div className="glass-card p-10 text-center">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-black text-slate-600 mb-1">No assessments yet</p>
                  <p className="text-xs text-slate-400 font-medium">Check back later or contact your admin.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => setSelectedExam(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all active:scale-90">
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
              <h2 className="text-base font-black text-slate-900 font-display truncate">{selectedExam.name}</h2>
            </div>

            <div className="glass-card p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black text-slate-900 font-display">{questions.length}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Questions</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black text-slate-900 font-display">{selectedExam.timeLimit}m</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Time Limit</p>
                </div>
              </div>

              <div className="bg-indigo-50 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-black text-indigo-900">Speed Bonus</p>
                  <p className="text-[11px] text-indigo-600 font-medium">Answer in ≤10s for max 10 points</p>
                </div>
              </div>

              <div className="bg-rose-50 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-rose-500 rounded-xl flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-black text-rose-800">Proctored Exam</p>
                  <p className="text-[11px] text-rose-500 font-medium">Tab switching will flag your account</p>
                </div>
              </div>

              <button onClick={handleStartExam} className="btn-primary w-full py-4 text-sm shadow-lg">
                Begin Assessment
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

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
          userId,
          examId,
          questionId: q.id,
          selectedOption: currentResponse.option,
          timestamp: new Date().toISOString(),
          isCorrect: currentResponse.option === q.correctAnswer,
          timeTaken: currentResponse.timeTaken,
          score: currentResponse.score
        });
      } catch (error) {
        console.error('Interval auto-save failed:', error);
      }
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
      if (timeToFirstTap <= 10) score = 10;
      else score = Math.max(1, Math.round(10 - ((timeToFirstTap - 10) / 50) * 9));
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
    } catch (error) {
      console.error('Confirm save failed:', error);
    }
    if (currentIdx < questions.length - 1) setCurrentIdx(prev => prev + 1);
    else onFinish();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <div className="h-1 bg-slate-100 w-full">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-indigo-600 transition-all"
          />
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${timeLeft < 300 ? 'text-rose-500' : 'text-slate-400'}`} />
            <span className={`text-lg font-black font-mono tracking-tight ${timeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-slate-900'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <span className="text-xs font-black text-slate-400">
            {currentIdx + 1} <span className="text-slate-300">/</span> {questions.length}
          </span>
          <button onClick={onFinish} className="bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider">
            Submit
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-lg w-full mx-auto px-4 pt-5 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >
            <div className="flex gap-1.5 flex-wrap">
              <span className="px-2.5 py-1 bg-slate-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest">{q.section}</span>
              <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                q.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                q.difficulty === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                'bg-rose-50 text-rose-600 border-rose-100'
              }`}>{q.difficulty}</span>
            </div>
            <h2 className="text-base font-black text-slate-900 leading-snug font-display">{q.text}</h2>
            <div className="space-y-2.5">
              {q.options.map((option: string, idx: number) => {
                const isSelected = pendingSelection === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleTap(idx)}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left active:scale-[0.98] ${
                      isSelected ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-100 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black shrink-0 transition-colors ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="text-sm font-semibold flex-1 leading-snug">{option}</span>
                    {isSelected && (
                      <motion.div layoutId="choice-check" transition={{ duration: 0.15 }}>
                        <CheckCircle2 className="w-5 h-5 text-white/80 shrink-0" />
                      </motion.div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between items-center pt-2">
              <div className="flex gap-1 overflow-x-auto max-w-[55%]">
                {questions.map((_: any, i: number) => (
                  <div
                    key={i}
                    className={`shrink-0 h-1.5 rounded-full transition-all duration-300 ${
                      i === currentIdx 
                        ? 'w-5 ' + (pendingSelection !== null ? 'bg-indigo-600' : 'bg-slate-400')
                        : responses[questions[i].id] ? 'w-1.5 bg-indigo-400' : 'w-1.5 bg-slate-200'
                    }`}
                  />
                ))}
              </div>
              <button
                disabled={pendingSelection === null}
                onClick={handleConfirmAndAdvance}
                className={`flex items-center gap-1.5 px-5 py-2.5 text-xs font-black rounded-xl transition-all active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed ${
                  currentIdx === questions.length - 1 ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
                }`}
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

// --- Collapsible Sidebar Admin ---
function AdminDashboard({ user, adminConfig }: { user: UserProfile, adminConfig: AdminConfig | null }) {
  const [activeTab, setActiveTab] = useState<'live' | 'users' | 'exams' | 'questions' | 'profile'>('live');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [responses, setResponses] = useState<UserResponse[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  // Sidebar: collapsed by default, expanded on hover/toggle
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
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
  // Top 3 celebration for admin view
  const [celebrationRank, setCelebrationRank] = useState<{ rank: number; name: string } | null>(null);
  const prevRankingRef = React.useRef<{ uid: string; rank: number }[]>([]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const uUnsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => d.data() as UserProfile));
    }, (error) => { handleFirestoreError(error, OperationType.GET, 'users'); });
    const rUnsub = onSnapshot(collection(db, 'responses'), (snap) => {
      setResponses(snap.docs.map(d => d.data() as UserResponse));
    }, (error) => { handleFirestoreError(error, OperationType.GET, 'responses'); });
    const qUnsub = onSnapshot(collection(db, 'questions'), (snap) => {
      setQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Question)));
    }, (error) => { handleFirestoreError(error, OperationType.GET, 'questions'); });
    const eUnsub = onSnapshot(collection(db, 'exams'), (snap) => {
      setExams(snap.docs.map(d => ({ id: d.id, ...d.data() } as Exam)));
    }, (error) => { handleFirestoreError(error, OperationType.GET, 'exams'); });
    return () => { uUnsub(); rUnsub(); qUnsub(); eUnsub(); };
  }, []);

  // Detect top 3 rank changes and show celebration
  useEffect(() => {
    if (responses.length === 0 || users.length === 0) return;
    const students = users.filter(u => u.role === 'student');
    const ranked = students.map(s => {
      const score = responses.filter(r => r.userId === s.uid).reduce((sum, r) => sum + (r.score || 0), 0);
      return { uid: s.uid, name: s.displayName, score, rank: 0 };
    }).sort((a, b) => b.score - a.score).map((item, i) => ({ ...item, rank: i + 1 }));

    for (const current of ranked.slice(0, 3)) {
      const prev = prevRankingRef.current.find(p => p.uid === current.uid);
      if (!prev || prev.rank > 3) {
        if (current.score > 0 && prev?.rank !== current.rank) {
          setCelebrationRank({ rank: current.rank, name: current.name });
          break;
        }
      }
    }
    prevRankingRef.current = ranked.map(r => ({ uid: r.uid, rank: r.rank }));
  }, [responses]);

  const createExam = async () => {
    if (!newExamName) return;
    await addDoc(collection(db, 'exams'), {
      name: newExamName,
      description: newExamDesc,
      timeLimit: parseInt(newExamTimeLimit) || 60,
      createdAt: new Date().toISOString(),
      isActive: false, // Not active by default — admin must explicitly start
      startedAt: null
    });
    setNewExamName('');
    setNewExamDesc('');
    setNewExamTimeLimit('60');
  };

  const toggleFlag = async (uid: string, current: boolean) => {
    await updateDoc(doc(db, 'users', uid), { isFlagged: !current });
  };

  const toggleTerminate = async (uid: string, current: boolean) => {
    await updateDoc(doc(db, 'users', uid), { isTerminated: !current });
  };

  const startExam = async (id: string) => {
    await updateDoc(doc(db, 'exams', id), { isActive: true, startedAt: new Date().toISOString(), terminatedAt: null });
    showToast('Exam started — students can now access it.', 'success');
  };

  const toggleExamStatus = async (id: string, current: boolean) => {
    await updateDoc(doc(db, 'exams', id), { isActive: !current });
  };

  const terminateExam = (examId: string, examName: string) => {
    setConfirmModal({ examId, examName });
  };

  const doTerminateExam = async () => {
    if (!confirmModal) return;
    const { examId, examName } = confirmModal;
    setConfirmModal(null);
    try {
      await updateDoc(doc(db, 'exams', examId), { terminatedAt: new Date().toISOString(), isActive: false });
      const activeUsers = users.filter(u => u.activeExamId === examId);
      for (const u of activeUsers) {
        try {
          const alreadySubmitted = u.submittedExams ?? [];
          const updatedSubmittedExams = alreadySubmitted.includes(examId) ? alreadySubmitted : [...alreadySubmitted, examId];
          await updateDoc(doc(db, 'users', u.uid), { activeExamId: null, examStartTime: null, lastActive: new Date().toISOString(), submittedExams: updatedSubmittedExams });
        } catch (err) {
          console.error(`Failed to force-submit user ${u.uid}:`, err);
        }
      }
      const count = activeUsers.length;
      showToast(`"${examName}" terminated. ${count > 0 ? `${count} active session${count !== 1 ? 's' : ''} force-submitted.` : 'No active sessions at the time.'}`, 'success');
    } catch (err: any) {
      showToast(`Failed to terminate "${examName}": ${err.message}`, 'error');
    }
  };

  const resetExamTermination = async (examId: string) => {
    await updateDoc(doc(db, 'exams', examId), { terminatedAt: null, isActive: true });
    for (const u of users) {
      if ((u.submittedExams ?? []).includes(examId)) {
        try {
          await updateDoc(doc(db, 'users', u.uid), { submittedExams: (u.submittedExams ?? []).filter((id: string) => id !== examId) });
        } catch (err) {
          console.error(`Failed to reset submittedExams for user ${u.uid}:`, err);
        }
      }
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm('Delete this question? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'questions', questionId));
      showToast('Question deleted.', 'success');
    } catch (err: any) {
      showToast('Failed to delete: ' + err.message, 'error');
    }
  };

  const filteredResponses = analyticsExamFilter === 'all' ? responses : responses.filter(r => r.examId === analyticsExamFilter);
  const filteredQuestions = analyticsExamFilter === 'all' ? questions : questions.filter(q => q.examId === analyticsExamFilter);

  const sectionData = filteredQuestions.reduce((acc: any, q) => {
    const sectionResponses = filteredResponses.filter(r => r.questionId === q.id);
    const totalScore = sectionResponses.reduce((sum, r) => sum + (r.score || 0), 0);
    const total = sectionResponses.length;
    const existing = acc.find((i: any) => i.name === q.section);
    if (existing) { existing.score += totalScore; existing.total += total; }
    else acc.push({ name: q.section, score: totalScore, total });
    return acc;
  }, []);

  const performanceData = sectionData.map((s: any) => ({
    name: s.name,
    avgScore: s.total > 0 ? Math.round(s.score / s.total) : 0
  }));

  const studentRankingData = users
    .filter(u => u.role === 'student')
    .map(student => {
      const studentResponses = filteredResponses.filter(r => r.userId === student.uid);
      const totalScore = studentResponses.reduce((sum, r) => sum + (r.score || 0), 0);
      const totalResponses = studentResponses.length;
      const examBreakdown = exams.map(exam => {
        const examResponses = responses.filter(r => r.userId === student.uid && r.examId === exam.id);
        const examScore = examResponses.reduce((sum, r) => sum + (r.score || 0), 0);
        return { examName: exam.name, score: examScore, count: examResponses.length };
      }).filter(e => e.count > 0);
      return { student, totalScore, totalResponses, examBreakdown };
    })
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  const navItems = [
    { id: 'live', label: 'Analytics', icon: BarChart3 },
    { id: 'users', label: 'Students', icon: Users },
    { id: 'exams', label: 'Exams', icon: ShieldAlert },
    { id: 'questions', label: 'Assessments', icon: BarChart3 },
    { id: 'profile', label: 'Settings', icon: Settings },
  ];

  const sidebarW = sidebarCollapsed ? 'w-16' : 'w-64';

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FA]">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border text-sm font-bold max-w-sm w-full ${
              toast.type === 'success' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-rose-600 text-white border-rose-500'
            }`}
          >
            <span className="text-lg">{toast.type === 'success' ? '✓' : '✕'}</span>
            <span className="flex-1 leading-snug">{toast.message}</span>
            <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100 transition-opacity text-lg leading-none">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {celebrationRank && (
          <Top3CelebrationPopup rank={celebrationRank.rank} name={celebrationRank.name} onClose={() => setCelebrationRank(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[998] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setConfirmModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full border border-slate-100"
            >
              <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 border border-rose-100">
                <ShieldAlert className="w-7 h-7 text-rose-500" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2 font-display">Terminate Exam?</h3>
              <p className="text-sm text-slate-500 font-medium mb-2">
                <span className="font-black text-slate-800">"{confirmModal.examName}"</span> will be ended for all students.
              </p>
              <p className="text-xs text-slate-400 font-medium mb-8">
                All active sessions will be force-submitted immediately. Answered questions will be saved; unanswered ones will be skipped. This cannot be undone without reopening the exam.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmModal(null)} className="flex-1 py-3 bg-slate-100 text-slate-700 text-xs font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest">
                  Cancel
                </button>
                <button onClick={doTerminateExam} className="flex-1 py-3 bg-rose-500 text-white text-xs font-black rounded-2xl hover:bg-rose-600 transition-all uppercase tracking-widest shadow-lg shadow-rose-500/30">
                  ⏹ Terminate
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Desktop Collapsible Sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r border-slate-200 bg-white z-50 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-16' : 'w-64'}`}
        style={{ minWidth: sidebarCollapsed ? '64px' : '256px' }}
      >
        {/* Toggle button */}
        <div className={`flex items-center border-b border-slate-100 h-16 px-3 ${sidebarCollapsed ? 'justify-center' : 'justify-between px-4'}`}>
          {!sidebarCollapsed && (
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-base font-black text-slate-900 font-display flex items-center gap-2"
            >
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>Admin</span>
            </motion.h2>
          )}
          <button
            onClick={() => setSidebarCollapsed(c => !c)}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-all"
          >
            {sidebarCollapsed ? <ChevronR className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* User badge */}
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-3 py-3 border-b border-slate-100"
          >
            <div className="bg-slate-50 rounded-2xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white text-xs font-black shrink-0">
                {user.displayName[0]}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-black text-slate-900 truncate">{user.displayName}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Admin</p>
              </div>
            </div>
          </motion.div>
        )}
        {sidebarCollapsed && (
          <div className="px-3 py-3 border-b border-slate-100 flex justify-center">
            <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white text-xs font-black">
              {user.displayName[0]}
            </div>
          </div>
        )}

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as any); setIsMobileSidebarOpen(false); }}
              title={sidebarCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black transition-all ${
                activeTab === item.id ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
              } ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-2 border-t border-slate-100">
          <button
            onClick={() => signOut(auth)}
            title={sidebarCollapsed ? 'Sign Out' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black text-rose-500 hover:bg-rose-50 transition-all ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar (slide-over) */}
      <aside className={`fixed lg:hidden inset-y-0 left-0 w-64 border-r border-slate-200 bg-white flex flex-col z-50 transition-transform duration-300 ease-in-out ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-100">
          <h2 className="text-base font-black text-slate-900 font-display flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" /> Admin
          </h2>
          <button onClick={() => setIsMobileSidebarOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="px-3 py-3 border-b border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white text-xs font-black shrink-0">{user.displayName[0]}</div>
            <div>
              <p className="text-xs font-black text-slate-900 truncate">{user.displayName}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Admin</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as any); setIsMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === item.id ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-2 border-t border-slate-100">
          <button onClick={() => signOut(auth)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black text-rose-500 hover:bg-rose-50 transition-all">
            <LogOut className="w-4 h-4 shrink-0" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative scroll-smooth">
        {/* Mobile top bar */}
        <header className="lg:hidden h-14 border-b border-slate-200 px-4 flex items-center justify-between bg-white/80 backdrop-blur-xl sticky top-0 z-30">
          <h2 className="font-black text-slate-900 flex items-center gap-2 font-display text-sm">
            <ShieldAlert className="w-5 h-5 text-slate-900" />
            Admin
          </h2>
          <button onClick={() => setIsMobileSidebarOpen(true)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
            <Menu className="w-5 h-5 text-slate-500" />
          </button>
        </header>

        <div className="max-w-[1600px] mx-auto p-4 sm:p-8 lg:p-12">
          <AnimatePresence mode="wait">
            {activeTab === 'live' && (
              <motion.div 
                key="live"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                  <div className="space-y-2">
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight font-display">Analytics</h1>
                    <p className="text-slate-500 font-medium max-w-md">Real-time performance metrics across all <span className="serif-heading text-indigo-600">active assessments</span>.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-end">
                    <div className="space-y-2 w-full sm:w-56">
                      <label className="micro-label ml-1">Filter by Exam</label>
                      <select
                        value={analyticsExamFilter}
                        onChange={(e) => setAnalyticsExamFilter(e.target.value)}
                        className="input-field py-2.5 text-sm font-black text-slate-900 bg-white border border-slate-200 rounded-2xl px-4 w-full focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      >
                        <option value="all">All Exams</option>
                        {exams.map(exam => (
                          <option key={exam.id} value={exam.id}>{exam.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-4 w-full sm:w-auto">
                      <div className="flex-1 sm:flex-none glass-card px-6 py-5">
                        <p className="micro-label mb-1">Active Users</p>
                        <p className="text-4xl font-black text-slate-900 font-display">{users.filter(u => u.role === 'student').length}</p>
                      </div>
                      <div className="flex-1 sm:flex-none glass-card px-6 py-5">
                        <p className="micro-label mb-1">Responses</p>
                        <p className="text-4xl font-black text-slate-900 font-display">{filteredResponses.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Student Ranking Table */}
                <div className="glass-card overflow-hidden">
                  <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 font-display">Student Rankings</h3>
                      <p className="text-xs text-slate-400 font-medium mt-1">
                        {analyticsExamFilter === 'all' ? 'Total scores across all exams' : `Scores for: ${exams.find(e => e.id === analyticsExamFilter)?.name}`}
                      </p>
                    </div>
                    <div className="px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{studentRankingData.length} students</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[700px]">
                      <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
                        <tr>
                          <th className="px-8 py-5">Rank</th>
                          <th className="px-8 py-5">Student</th>
                          <th className="px-8 py-5">Roll No.</th>
                          <th className="px-8 py-5">Total Score</th>
                          <th className="px-8 py-5">Responses</th>
                          <th className="px-8 py-5">Exam Breakdown</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {studentRankingData.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-8 py-10 text-center text-slate-400 font-medium text-sm italic">No response data available yet.</td>
                          </tr>
                        ) : studentRankingData.map((item) => (
                          <tr key={item.student.uid} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-6">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shadow-sm
                                ${item.rank === 1 ? 'bg-amber-400 text-white' : item.rank === 2 ? 'bg-slate-300 text-white' : item.rank === 3 ? 'bg-orange-300 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                #{item.rank}
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-xs">
                                  {item.student.displayName[0]}
                                </div>
                                <div>
                                  <p className="font-black text-slate-900 text-sm">{item.student.displayName}</p>
                                  <p className="text-[11px] text-slate-400">{item.student.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <span className="font-black text-slate-700 text-sm">{item.student.rollNumber || '—'}</span>
                            </td>
                            <td className="px-8 py-6">
                              <span className="text-2xl font-black text-slate-900 font-display">{item.totalScore}</span>
                            </td>
                            <td className="px-8 py-6">
                              <span className="font-black text-slate-500 text-sm">{item.totalResponses}</span>
                            </td>
                            <td className="px-8 py-6">
                              {item.examBreakdown.length === 0 ? (
                                <span className="text-slate-300 text-sm italic">—</span>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  {item.examBreakdown.map((eb, idx) => (
                                    <span key={idx} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-xl border border-indigo-100 whitespace-nowrap">
                                      {eb.examName}: <span className="text-indigo-900">{eb.score}</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div 
                key="users"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10"
              >
                <div className="flex justify-between items-center">
                  <h1 className="text-5xl font-black text-slate-900 tracking-tight font-display">Students</h1>
                  <div className="glass-card px-6 py-4 text-sm font-black text-slate-500">
                    {users.filter(u => u.role === 'student').length} <span className="serif-heading text-indigo-600 text-base">Registered</span>
                  </div>
                </div>
                <div className="glass-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                      <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
                        <tr>
                          <th className="px-8 py-6">Student Profile</th>
                          <th className="px-8 py-6">Roll Number</th>
                          <th className="px-8 py-6">Status</th>
                          <th className="px-8 py-6">Live Timer</th>
                          <th className="px-8 py-6">Last Activity</th>
                          <th className="px-8 py-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {users.filter(u => u.role === 'student').map((u) => (
                          <tr key={u.uid} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-8 py-8">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-lg">
                                  {u.displayName[0]}
                                </div>
                                <div>
                                  <p className="text-base font-black text-slate-900">{u.displayName}</p>
                                  <p className="text-xs text-slate-400 font-medium">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-8">
                              <p className="text-sm font-black text-slate-900">{u.rollNumber || '—'}</p>
                            </td>
                            <td className="px-8 py-8">
                              <div className="flex gap-2">
                                {u.isFlagged && <span className="px-3 py-1.5 bg-amber-50 text-amber-600 text-[10px] font-black rounded-xl border border-amber-100 uppercase tracking-widest">Flagged</span>}
                                {u.isTerminated && <span className="px-3 py-1.5 bg-rose-50 text-rose-600 text-[10px] font-black rounded-xl border border-rose-100 uppercase tracking-widest">Terminated</span>}
                                {u.activeExamId && <span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-xl border border-indigo-100 uppercase tracking-widest animate-pulse">In Exam</span>}
                                {!u.isFlagged && !u.isTerminated && !u.activeExamId && <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-xl border border-emerald-100 uppercase tracking-widest">Active</span>}
                              </div>
                            </td>
                            <td className="px-8 py-8">
                              {u.activeExamId && u.examStartTime ? (
                                <div className="flex items-center gap-2 text-rose-500 font-black font-mono text-sm">
                                  <Clock className="w-4 h-4" />
                                  {(() => {
                                    const exam = exams.find(e => e.id === u.activeExamId);
                                    if (!exam) return '—';
                                    const start = new Date(u.examStartTime).getTime();
                                    const now = Date.now();
                                    const elapsed = Math.floor((now - start) / 1000);
                                    const total = exam.timeLimit * 60;
                                    const remaining = Math.max(0, total - elapsed);
                                    const m = Math.floor(remaining / 60);
                                    const s = remaining % 60;
                                    return `${m}:${s.toString().padStart(2, '0')}`;
                                  })()}
                                </div>
                              ) : (
                                <span className="text-slate-300 font-medium italic-sense text-sm">—</span>
                              )}
                            </td>
                            <td className="px-8 py-8 text-xs text-slate-400 font-bold italic-sense">
                              {u.lastActive ? new Date(u.lastActive).toLocaleString() : 'Never'}
                            </td>
                            <td className="px-8 py-8 text-right">
                              <div className="flex justify-end gap-3">
                                <button onClick={() => toggleFlag(u.uid, u.isFlagged)} className={`p-3 rounded-xl transition-all ${u.isFlagged ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400 hover:text-amber-600 hover:bg-amber-50'}`}>
                                  <AlertTriangle className="w-5 h-5" />
                                </button>
                                <button onClick={() => toggleTerminate(u.uid, u.isTerminated)} className={`p-3 rounded-xl transition-all ${u.isTerminated ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`}>
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

            {activeTab === 'exams' && (
              <motion.div 
                key="exams"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10"
              >
                <div className="space-y-2">
                  <h1 className="text-5xl font-black text-slate-900 tracking-tight font-display">Exams</h1>
                  <p className="text-slate-500 font-medium max-w-md">Create and manage <span className="serif-heading text-indigo-600">examination containers</span>. Press Start to make an exam visible to students.</p>
                </div>

                <div className="glass-card p-10 sm:p-12 space-y-8">
                  <h3 className="text-2xl font-black text-slate-900 font-display">Create New Exam</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="micro-label ml-3">Exam Title</label>
                      <input type="text" placeholder="e.g. Computer Science Fundamentals" className="input-field" value={newExamName} onChange={(e) => setNewExamName(e.target.value)} />
                    </div>
                    <div className="space-y-3">
                      <label className="micro-label ml-3">Description</label>
                      <input type="text" placeholder="Brief overview" className="input-field" value={newExamDesc} onChange={(e) => setNewExamDesc(e.target.value)} />
                    </div>
                    <div className="space-y-3">
                      <label className="micro-label ml-3">Time Limit (Minutes)</label>
                      <input type="number" placeholder="e.g. 60" className="input-field" value={newExamTimeLimit} onChange={(e) => setNewExamTimeLimit(e.target.value)} />
                    </div>
                  </div>
                  <button onClick={createExam} className="btn-primary py-4 px-12">Initialize Exam</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {exams.map(exam => {
                    const isStarted = !!(exam as any).startedAt;
                    const isTerminated = !!(exam as any).terminatedAt;
                    return (
                      <motion.div whileHover={{ y: -6 }} key={exam.id} className="glass-card p-8 group">
                        <div className="flex justify-between items-start mb-8">
                          <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                            <BarChart3 className="w-7 h-7" />
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            {isTerminated ? (
                              <span className="px-3 py-1 text-[9px] font-black rounded-full border bg-rose-50 text-rose-500 border-rose-200 uppercase tracking-widest">Terminated</span>
                            ) : isStarted ? (
                              <span className="px-3 py-1 text-[9px] font-black rounded-full border bg-emerald-50 text-emerald-600 border-emerald-100 uppercase tracking-widest animate-pulse">Live</span>
                            ) : (
                              <span className="px-3 py-1 text-[9px] font-black rounded-full border bg-slate-50 text-slate-400 border-slate-100 uppercase tracking-widest">Draft</span>
                            )}
                          </div>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2 font-display">{exam.name}</h3>
                        <p className="text-slate-500 font-medium mb-6 line-clamp-2 text-sm leading-relaxed">{exam.description}</p>
                        <div className="text-[10px] text-slate-400 font-bold mb-6 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" /> {exam.timeLimit} min
                        </div>
                        <div className="flex flex-col gap-2">
                          {/* Start button — only shown if not yet started and not terminated */}
                          {!isStarted && !isTerminated && (
                            <button
                              onClick={() => startExam(exam.id)}
                              className="w-full py-3 bg-emerald-600 text-white text-[10px] font-black rounded-2xl hover:bg-emerald-700 transition-all uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                            >
                              <Play className="w-3.5 h-3.5" /> Start Exam
                            </button>
                          )}
                          {isTerminated ? (
                            <button onClick={() => resetExamTermination(exam.id)} className="w-full py-3 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-2xl hover:bg-emerald-100 transition-all border border-emerald-200 uppercase tracking-widest">
                              ↺ Reopen Exam
                            </button>
                          ) : isStarted ? (
                            <button onClick={() => terminateExam(exam.id, exam.name)} className="w-full py-3 bg-rose-50 text-rose-600 text-[10px] font-black rounded-2xl hover:bg-rose-100 transition-all border border-rose-200 uppercase tracking-widest">
                              ⏹ Terminate Exam
                            </button>
                          ) : null}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === 'questions' && (
              <motion.div 
                key="questions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10"
              >
                {!selectedExamForQuestions ? (
                  <>
                    <div className="space-y-2">
                      <h1 className="text-5xl font-black text-slate-900 tracking-tight font-display">Assessments</h1>
                      <p className="text-slate-500 font-medium max-w-md">Select an exam to manage its <span className="serif-heading text-indigo-600">question bank</span>.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {exams.map(exam => (
                        <motion.button
                          whileHover={{ y: -6 }}
                          key={exam.id}
                          onClick={() => setSelectedExamForQuestions(exam)}
                          className="glass-card p-8 text-left group transition-all"
                        >
                          <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                              <BarChart3 className="w-6 h-6" />
                            </div>
                            <div className="text-right">
                              <p className="micro-label mb-1">Questions</p>
                              <p className="text-xl font-black text-slate-900 font-display">{questions.filter(q => q.examId === exam.id).length}</p>
                            </div>
                          </div>
                          <h3 className="text-xl font-black text-slate-900 mb-2 font-display">{exam.name}</h3>
                          <p className="text-slate-500 font-medium line-clamp-2 leading-relaxed text-sm">{exam.description}</p>
                          <div className="mt-6 flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                            View Questions <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-6">
                      <button onClick={() => setSelectedExamForQuestions(null)} className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 transition-all border border-slate-100">
                        <ArrowRight className="w-6 h-6 rotate-180" />
                      </button>
                      <div className="space-y-1">
                        <h1 className="text-5xl font-black text-slate-900 tracking-tight font-display">{selectedExamForQuestions.name}</h1>
                        <p className="text-slate-500 font-medium">Total Questions: <span className="font-black text-slate-900">{questions.filter(q => q.examId === selectedExamForQuestions.id).length}</span></p>
                      </div>
                    </div>

                    {/* Question Addition — Manual / AI Tabs */}
                    <div className="glass-card overflow-hidden">
                      <div className="flex border-b border-slate-100">
                        <button
                          onClick={() => setQuestionAddMode('manual')}
                          className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-widest transition-all ${questionAddMode === 'manual' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'}`}
                        >
                          <Plus className="w-4 h-4" /> Manual Entry
                        </button>
                        <button
                          onClick={() => { setQuestionAddMode('ai'); setAiPreview([]); setAiError(''); }}
                          className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-widest transition-all ${questionAddMode === 'ai' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'}`}
                        >
                          <span className="text-base leading-none">✦</span> Generate with AI
                        </button>
                      </div>

                      {questionAddMode === 'manual' && (
                        <div className="p-8 space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <label className="micro-label ml-3">Question Text</label>
                              <textarea placeholder="Enter the question text..." className="input-field min-h-[120px] py-4" id="newQText" />
                            </div>
                            <div className="space-y-5">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="micro-label ml-3">Section</label>
                                  <input type="text" id="newQSection" placeholder="e.g. AI" className="input-field py-3" />
                                </div>
                                <div className="space-y-2">
                                  <label className="micro-label ml-3">Difficulty</label>
                                  <select id="newQDiff" className="input-field py-3">
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                  </select>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="micro-label ml-3">Options (Comma separated)</label>
                                <input type="text" id="newQOptions" placeholder="Opt 1, Opt 2, Opt 3, Opt 4" className="input-field py-3" />
                              </div>
                              <div className="space-y-2">
                                <label className="micro-label ml-3">Correct Option Index (0-3)</label>
                                <input type="number" id="newQCorrect" min="0" max="3" placeholder="0" className="input-field py-3" />
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={async () => {
                              const text = (document.getElementById('newQText') as HTMLTextAreaElement).value;
                              const section = (document.getElementById('newQSection') as HTMLInputElement).value;
                              const difficulty = (document.getElementById('newQDiff') as HTMLSelectElement).value;
                              const options = (document.getElementById('newQOptions') as HTMLInputElement).value.split(',').map(s => s.trim());
                              const correct = parseInt((document.getElementById('newQCorrect') as HTMLInputElement).value);
                              if (!text || options.length < 2) return;
                              const isDuplicate = questions.some(q => q.examId === selectedExamForQuestions!.id && q.text.toLowerCase() === text.toLowerCase());
                              if (isDuplicate) { alert("This question already exists in this exam."); return; }
                              await addDoc(collection(db, 'questions'), { examId: selectedExamForQuestions!.id, text, section, difficulty, options, correctAnswer: correct });
                              (document.getElementById('newQText') as HTMLTextAreaElement).value = '';
                              (document.getElementById('newQOptions') as HTMLInputElement).value = '';
                            }}
                            className="btn-primary w-full py-4"
                          >
                            Add Question to Bank
                          </button>
                        </div>
                      )}

                      {questionAddMode === 'ai' && (
                        <div className="p-8 space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                            <div className="lg:col-span-2 space-y-3">
                              <label className="micro-label ml-1">Topic / Subject</label>
                              <input type="text" placeholder="e.g. Binary Trees, Newton's Laws" className="input-field py-3" value={aiTopic} onChange={e => setAiTopic(e.target.value)} />
                            </div>
                            <div className="space-y-3">
                              <label className="micro-label ml-1">Section Tag</label>
                              <input type="text" placeholder="e.g. Data Structures" className="input-field py-3" value={aiSection} onChange={e => setAiSection(e.target.value)} />
                            </div>
                            <div className="space-y-3">
                              <label className="micro-label ml-1">Difficulty</label>
                              <select className="input-field py-3" value={aiDifficulty} onChange={e => setAiDifficulty(e.target.value as any)}>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                              </select>
                            </div>
                            <div className="space-y-3">
                              <label className="micro-label ml-1">Number of Questions</label>
                              <input type="number" min={1} max={20} className="input-field py-3" value={aiCount} onChange={e => setAiCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))} />
                            </div>
                          </div>

                          <button
                            disabled={!aiTopic.trim() || aiGenerating}
                            onClick={async () => {
                              setAiGenerating(true);
                              setAiError('');
                              setAiPreview([]);
                              const existingTexts = questions.filter(q => q.examId === selectedExamForQuestions!.id).map(q => q.text);
                              try {
                                const { GoogleGenAI } = await import('@google/genai');
                                const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
                                const prompt = `Generate exactly ${aiCount} unique MCQ questions on the topic: "${aiTopic}".
Difficulty: ${aiDifficulty}
Section tag: ${aiSection || aiTopic}

IMPORTANT: These questions already exist — do NOT duplicate them:
${existingTexts.length > 0 ? existingTexts.map((t,i) => `${i+1}. ${t}`).join('\n') : 'None yet.'}

Return ONLY a JSON array with this exact structure — no markdown, no explanation, no extra text:
[
  {
    "text": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "section": "${aiSection || aiTopic}",
    "difficulty": "${aiDifficulty}"
  }
]
correctAnswer is the 0-based index of the correct option. All questions must have exactly 4 options.`;
                                const result = await ai.models.generateContent({
                                  model: 'gemini-2.0-flash',
                                  config: { systemInstruction: 'You are an expert MCQ question generator for university assessments. Generate unique, clear, and educationally valuable multiple-choice questions. Always respond ONLY with a valid JSON array — no markdown, no explanation, no extra text.' },
                                  contents: prompt,
                                });
                                const raw = result.text || '';
                                const clean = raw.replace(/```json|```/g, '').trim();
                                const parsed = JSON.parse(clean);
                                setAiPreview(parsed);
                              } catch (err: any) {
                                setAiError('Failed to generate questions. Please try again.');
                                console.error(err);
                              } finally {
                                setAiGenerating(false);
                              }
                            }}
                            className="btn-primary py-4 px-10 flex items-center gap-3 disabled:opacity-40"
                          >
                            {aiGenerating ? (
                              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating…</>
                            ) : (
                              <><span className="text-lg">✦</span> Generate {aiCount} Question{aiCount !== 1 ? 's' : ''}</>
                            )}
                          </button>

                          {aiError && (
                            <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm font-bold flex items-center gap-3">
                              <AlertTriangle className="w-5 h-5 shrink-0" /> {aiError}
                            </div>
                          )}

                          {aiPreview.length > 0 && (
                            <div className="space-y-5">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-black text-slate-700">{aiPreview.length} questions generated — review before saving</p>
                                <button onClick={() => setAiPreview([])} className="text-xs text-slate-400 hover:text-rose-500 font-black uppercase tracking-widest">Clear</button>
                              </div>
                              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                {aiPreview.map((q, i) => (
                                  <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                                    <div className="flex items-start justify-between gap-4">
                                      <p className="font-black text-slate-900 text-sm leading-relaxed flex-1">{i + 1}. {q.text}</p>
                                      <button onClick={() => setAiPreview(prev => prev.filter((_, idx) => idx !== i))} className="shrink-0 p-1.5 hover:bg-rose-50 rounded-lg text-slate-300 hover:text-rose-400 transition-colors">
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      {q.options.map((opt, oIdx) => (
                                        <div key={oIdx} className={`px-3 py-2 rounded-xl text-xs font-bold border ${oIdx === q.correctAnswer ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-white border-slate-100 text-slate-500'}`}>
                                          <span className="opacity-40 mr-1">{String.fromCharCode(65 + oIdx)}.</span>{opt}
                                        </div>
                                      ))}
                                    </div>
                                    <div className="flex gap-2">
                                      <span className="px-2.5 py-1 bg-slate-200 text-slate-600 text-[9px] font-black rounded-full uppercase tracking-widest">{q.section}</span>
                                      <span className={`px-2.5 py-1 text-[9px] font-black rounded-full uppercase tracking-widest ${q.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' : q.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>{q.difficulty}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <button
                                disabled={savingAi}
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
                                    setAiPreview([]);
                                    setAiTopic('');
                                    alert(`${saved} question${saved !== 1 ? 's' : ''} added successfully!`);
                                  } catch (err) {
                                    setAiError('Failed to save questions. Please try again.');
                                  } finally {
                                    setSavingAi(false);
                                  }
                                }}
                                className="btn-primary w-full py-4 flex items-center justify-center gap-3"
                              >
                                {savingAi ? (
                                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                                ) : (
                                  <>Save {aiPreview.length} Question{aiPreview.length !== 1 ? 's' : ''} to Bank</>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Question cards with delete button */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {questions.filter(q => q.examId === selectedExamForQuestions.id).map((q, idx) => (
                        <div key={q.id} className="glass-card p-10 hover:shadow-2xl hover:shadow-slate-900/5 transition-all group relative">
                          <div className="absolute top-6 right-6 text-slate-200 font-black text-5xl font-display opacity-20 group-hover:opacity-40 transition-opacity">
                            {(idx + 1).toString().padStart(2, '0')}
                          </div>
                          {/* Delete button */}
                          <button
                            onClick={() => deleteQuestion(q.id)}
                            className="absolute top-4 left-4 p-2 rounded-xl bg-white border border-slate-100 text-slate-300 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all opacity-0 group-hover:opacity-100 z-10 shadow-sm"
                            title="Delete question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="flex justify-between items-start mb-8 relative z-10">
                            <span className="px-4 py-1.5 bg-slate-900 text-white text-[9px] font-black rounded-full uppercase tracking-widest">{q.section}</span>
                            <span className={`px-4 py-1.5 text-[9px] font-black rounded-full border uppercase tracking-widest ${
                              q.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              q.difficulty === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                              'bg-rose-50 text-rose-600 border-rose-100'
                            }`}>{q.difficulty}</span>
                          </div>
                          <p className="text-xl font-black text-slate-900 mb-8 line-clamp-4 leading-relaxed font-display group-hover:text-indigo-600 transition-colors relative z-10">{q.text}</p>
                          <div className="space-y-3 relative z-10">
                            {q.options.map((opt, oIdx) => (
                              <div key={oIdx} className={`p-4 rounded-2xl text-xs font-bold border transition-all ${oIdx === q.correctAnswer ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                <span className="mr-2 opacity-40">{String.fromCharCode(65 + oIdx)}.</span>{opt}
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

            {activeTab === 'profile' && (
              <motion.div 
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-3xl space-y-10"
              >
                <h1 className="text-5xl font-black text-slate-900 tracking-tight font-display">Settings</h1>
                
                <div className="glass-card p-10 sm:p-16 space-y-14 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-slate-50 rounded-full -mr-40 -mt-40" />
                  
                  <div className="flex flex-col sm:flex-row items-center gap-10 relative z-10">
                    <div className="w-32 h-32 rounded-[2.5rem] bg-slate-900 flex items-center justify-center text-white border border-slate-800 shadow-2xl shadow-slate-900/20">
                      <UserIcon className="w-16 h-16" />
                    </div>
                    <div className="text-center sm:text-left">
                      <h2 className="text-4xl font-black text-slate-900 font-display">{user.displayName}</h2>
                      <p className="micro-label mt-3 tracking-[0.4em]">{user.role}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 relative z-10">
                    <div className="space-y-3">
                      <p className="micro-label ml-3">Email Address</p>
                      <div className="p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100">
                        <p className="text-base font-black text-slate-900">{user.email}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="micro-label ml-3">Admin Hash ID</p>
                      <div className="p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100">
                        <p className="text-base font-black text-slate-900 font-mono">{adminConfig?.hashcode || '—'}</p>
                      </div>
                    </div>
                    <div className="space-y-3 sm:col-span-2">
                      <p className="micro-label ml-3">Administrative Status</p>
                      <div className="p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100 flex items-center gap-5">
                        <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/40" />
                        <span className="text-base font-black text-emerald-600">Verified System Administrator</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-12 border-t border-slate-100 relative z-10">
                    <button 
                      onClick={() => auth.signOut()}
                      className="w-full py-6 bg-rose-50 text-rose-600 font-black rounded-[2rem] hover:bg-rose-100 transition-all border border-rose-100 flex items-center justify-center gap-5 text-lg"
                    >
                      <LogOut className="w-6 h-6" />
                      Terminate Admin Session
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
