// File: client/src/lib/firebase/auth.ts
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User,
} from "firebase/auth";
import { auth } from "./client";

export function subscribeToAuth(cb: (u: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}

export async function login(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}

export async function signup(email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}

export async function logout() {
  await signOut(auth);
}

export async function deleteAccountWithPassword(password: string) {
  const user = auth.currentUser;
  if (!user?.email) throw new Error("No signed-in user.");

  // Firebase requires recent login to delete account
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);

  await deleteUser(user);
}