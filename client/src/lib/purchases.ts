// File: client/src/lib/purchases.ts

import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesOffering,
  PurchasesPackage,
} from "react-native-purchases";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase/client";
import { APPLE_REVIEW_EMAIL } from "./reviewAccess";

const RC_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || "";
const ENTITLEMENT_ID =
  process.env.EXPO_PUBLIC_RC_ENTITLEMENT_ID || "ReceiptAIPro Pro";

let configuredForUserId: string | null = null;

export function getEntitlementId() {
  return ENTITLEMENT_ID;
}

function isAppleReviewEmail(email?: string | null) {
  return (email || "").trim().toLowerCase() === APPLE_REVIEW_EMAIL.toLowerCase();
}

async function syncPlanToFirestore(
  uid: string,
  email: string | null | undefined,
  isPro: boolean
) {
  await setDoc(
    doc(db, "users", uid),
    {
      email: email ?? null,
      plan: isPro ? "pro" : "free",
      subscriptionStatus: isPro ? "active" : "inactive",
      isAppleReviewAccount: isAppleReviewEmail(email),
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

function hasEntitlement(customerInfo: CustomerInfo | null | undefined) {
  return !!customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];
}

async function ensureConfigured(appUserID?: string) {
  if (!RC_API_KEY) return false;

  if (!configuredForUserId || configuredForUserId !== (appUserID || null)) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    await Purchases.configure({
      apiKey: RC_API_KEY,
      appUserID,
    });
    configuredForUserId = appUserID || null;
  }

  return true;
}

export async function loadCurrentOffering(
  uid?: string
): Promise<PurchasesOffering | null> {
  const currentEmail = auth.currentUser?.email;

  if (isAppleReviewEmail(currentEmail)) {
    return null;
  }

  const ok = await ensureConfigured(uid);
  if (!ok) return null;

  const offerings = await Purchases.getOfferings();
  return offerings.current ?? null;
}

export async function refreshPlanFromRevenueCat(uid: string): Promise<{
  isPro: boolean;
  customerInfo: CustomerInfo | null;
}> {
  const currentEmail = auth.currentUser?.email;

  if (isAppleReviewEmail(currentEmail)) {
    await syncPlanToFirestore(uid, currentEmail, true);
    return { isPro: true, customerInfo: null };
  }

  const ok = await ensureConfigured(uid);
  if (!ok) {
    await syncPlanToFirestore(uid, currentEmail, false);
    return { isPro: false, customerInfo: null };
  }

  const customerInfo = await Purchases.getCustomerInfo();
  const isPro = hasEntitlement(customerInfo);

  await syncPlanToFirestore(uid, currentEmail, isPro);

  return { isPro, customerInfo };
}

export async function buyPackage(
  uid: string,
  pkg: PurchasesPackage
): Promise<{
  isPro: boolean;
  customerInfo: CustomerInfo | null;
}> {
  const currentEmail = auth.currentUser?.email;

  if (isAppleReviewEmail(currentEmail)) {
    await syncPlanToFirestore(uid, currentEmail, true);
    return { isPro: true, customerInfo: null };
  }

  const ok = await ensureConfigured(uid);
  if (!ok) {
    throw new Error("RevenueCat is not configured in this build.");
  }

  const { customerInfo } = await Purchases.purchasePackage(pkg);
  const isPro = hasEntitlement(customerInfo);

  await syncPlanToFirestore(uid, currentEmail, isPro);

  return { isPro, customerInfo };
}

export async function restoreUserPurchases(uid: string): Promise<{
  isPro: boolean;
  customerInfo: CustomerInfo | null;
}> {
  const currentEmail = auth.currentUser?.email;

  if (isAppleReviewEmail(currentEmail)) {
    await syncPlanToFirestore(uid, currentEmail, true);
    return { isPro: true, customerInfo: null };
  }

  const ok = await ensureConfigured(uid);
  if (!ok) {
    throw new Error("RevenueCat is not configured in this build.");
  }

  const customerInfo = await Purchases.restorePurchases();
  const isPro = hasEntitlement(customerInfo);

  await syncPlanToFirestore(uid, currentEmail, isPro);

  return { isPro, customerInfo };
}