// File: client/src/lib/firebase/receipts.ts
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  limit,
  serverTimestamp,
  where,
  Timestamp,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./client";

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
  date: string | null; // "YYYY-MM-DD" if available
  total: number | null;
  currency: string | null; // "USD"
  category: ReceiptCategory;
  line_items: { name: string; qty: number | null; price: number | null }[];
  raw_text: string | null;
  createdAt?: any;
};

export async function saveReceipt(userId: string, data: Omit<ReceiptDoc, "userId" | "createdAt">) {
  const col = collection(db, "receipts");
  const docRef = await addDoc(col, {
    userId,
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getRecentReceipts(userId: string, take = 10) {
  const col = collection(db, "receipts");
  const q = query(col, where("userId", "==", userId), orderBy("createdAt", "desc"), limit(take));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as ReceiptDoc) }));
}

export async function deleteReceipt(receiptId: string) {
  await deleteDoc(doc(db, "receipts", receiptId));
}