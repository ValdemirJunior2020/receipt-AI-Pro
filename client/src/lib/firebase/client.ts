// File: client/src/lib/firebase/client.ts
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase Web config is public by design.
// Hardcoding it here is fine and will unblock your app immediately.
const firebaseConfig = {
  apiKey: "AIzaSyCTAhjyJxKiOQ9P9jcq0LQyoTykPlsuWaQ",
  authDomain: "receipt-ai-pro.firebaseapp.com",
  projectId: "receipt-ai-pro",
  storageBucket: "receipt-ai-pro.firebasestorage.app",
  messagingSenderId: "542571244409",
  appId: "1:542571244409:web:de048f098d1e7490abdda8",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;