import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

// Helper for Google Login restricted to domain
export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  const adminEmails = ["ahmadabdullah007860@gmail.com", "sumansingh.ss1972@gmail.com", "wolfickbriandumbledore@gmail.com"];
  if (!user.email?.endsWith('@bbdu.ac.in') && !adminEmails.includes(user.email || '')) {
    await signOut(auth);
    throw new Error('Access restricted to @bbdu.ac.in emails only.');
  }
  return user;
};

export { 
  onAuthStateChanged, 
  signOut,
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  getDocs
};
