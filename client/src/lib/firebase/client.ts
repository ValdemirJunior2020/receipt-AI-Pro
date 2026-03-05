// File: client/src/lib/firebase/client.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCTAhjyJxKiOQ9P9jcq0LQyoTykPlsuWaQ",
  authDomain: "receipt-ai-pro.firebaseapp.com",
  projectId: "receipt-ai-pro",
  storageBucket: "receipt-ai-pro.firebasestorage.app",
  messagingSenderId: "542571244409",
  appId: "1:542571244409:web:de048f098d1e7490abdda8",
  measurementId: "G-0DNFHZ9QRY"
};

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics is web-only; keep it safe for RN/Expo
export async function initAnalytics() {
  if (await isSupported()) return getAnalytics(app);
  return null;
}