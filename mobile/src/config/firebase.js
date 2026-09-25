import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBTO-Pd3qPubtL299D-aDoUgShyzBeBnYs",
  authDomain: "funapp-2e00d.firebaseapp.com",
  projectId: "funapp-2e00d",
  storageBucket: "funapp-2e00d.firebasestorage.app",
  messagingSenderId: "343159049565",
  appId: "1:343159049565:web:c4454926f92948ba5aecb4",
  measurementId: "G-Y59R9DNGJV"
};

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth, firebaseConfig };
