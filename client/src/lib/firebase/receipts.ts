// File: client/src/lib/firebase/receipts.ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "./client";
import { getUserProfile } from "./users";

export type ReceiptCategory =
  | "Groceries"
  | "Dining Out"
  | "Transport"
  | "Utilities"
  | "Shopping"
  | "Other";

export type ReceiptDoc = {
  userId: string;
  merchant: string | null;
  date: string | null;
  total: number | null;
  currency: string | null;
  category: ReceiptCategory;
  line_items: { name: string; qty: number | null; price: number | null }[];
  raw_text: string | null;
  createdAt?: any;
};

export async function saveReceipt(
  userId: string,
  data: Omit<ReceiptDoc, "userId" | "createdAt">
) {
  const col = collection(db, "receipts");
  const docRef = await addDoc(col, {
    userId,
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getRecentReceipts(userId: string, take = 20) {
  const col = collection(db, "receipts");
  const q = query(
    col,
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(take)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as ReceiptDoc) }));
}

export async function deleteReceipt(receiptId: string) {
  await deleteDoc(doc(db, "receipts", receiptId));
}

export async function getMonthlyReceiptCount(userId: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const col = collection(db, "receipts");
  const q = query(
    col,
    where("userId", "==", userId),
    where("createdAt", ">=", startOfMonth),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);
  return snap.size;
}

export async function getScanGate(userId: string) {
  const profile = await getUserProfile(userId);
  const count = await getMonthlyReceiptCount(userId);

  const plan = profile?.plan || "free";
  const limit = plan === "pro" ? Infinity : 5;
  const remaining = limit === Infinity ? Infinity : Math.max(limit - count, 0);
  const allowed = plan === "pro" ? true : count < 5;

  return {
    plan,
    count,
    limit,
    remaining,
    allowed,
    subscriptionStatus: profile?.subscriptionStatus || "inactive",
  };
}