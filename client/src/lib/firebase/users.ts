// File: client/src/lib/firebase/users.ts
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./client";

export type UserPlan = "free" | "pro";

export type UserProfile = {
  uid: string;
  email: string;
  plan: UserPlan;
  subscriptionStatus: "inactive" | "active";
  createdAt?: any;
  updatedAt?: any;
};

export async function ensureUserProfile(uid: string, email: string) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      uid,
      email,
      plan: "free",
      subscriptionStatus: "inactive",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

// Temporary upgrade helper until RevenueCat/App Store products are connected.
export async function setUserPlan(
  uid: string,
  plan: UserPlan,
  subscriptionStatus: "inactive" | "active"
) {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, {
    plan,
    subscriptionStatus,
    updatedAt: serverTimestamp(),
  });
}