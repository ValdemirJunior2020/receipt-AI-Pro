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
  isAppleReviewAccount?: boolean;
  createdAt?: any;
  updatedAt?: any;
};

function normalizePlan(value: unknown): UserPlan {
  return typeof value === "string" && value.toLowerCase().trim() === "pro"
    ? "pro"
    : "free";
}

function normalizeSubscriptionStatus(
  value: unknown
): "inactive" | "active" {
  return typeof value === "string" && value.toLowerCase().trim() === "active"
    ? "active"
    : "inactive";
}

export function hasActiveProAccess(
  profile: Partial<UserProfile> | null | undefined
) {
  if (!profile) return false;

  const plan = normalizePlan(profile.plan);
  const subscriptionStatus = normalizeSubscriptionStatus(
    profile.subscriptionStatus
  );
  const isAppleReviewAccount = Boolean(profile.isAppleReviewAccount);

  return (
    (plan === "pro" && subscriptionStatus === "active") ||
    (isAppleReviewAccount && plan === "pro")
  );
}

export async function ensureUserProfile(uid: string, email: string) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      uid,
      email,
      plan: "free",
      subscriptionStatus: "inactive",
      isAppleReviewAccount: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return;
  }

  const data = snap.data() as Partial<UserProfile>;

  await setDoc(
    ref,
    {
      uid,
      email,
      plan: normalizePlan(data.plan),
      subscriptionStatus: normalizeSubscriptionStatus(data.subscriptionStatus),
      isAppleReviewAccount: Boolean(data.isAppleReviewAccount),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  const data = snap.data() as Partial<UserProfile>;

  return {
    uid,
    email: typeof data.email === "string" ? data.email : "",
    plan: normalizePlan(data.plan),
    subscriptionStatus: normalizeSubscriptionStatus(data.subscriptionStatus),
    isAppleReviewAccount: Boolean(data.isAppleReviewAccount),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
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