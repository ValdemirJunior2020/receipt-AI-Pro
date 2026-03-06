// File: client/src/lib/firebase/auth.ts
import {
  EmailAuthProvider,
  User,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "./client";
import { ensureUserProfile } from "./users";

export function subscribeToAuth(cb: (u: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}

function cleanFirebaseError(message: string) {
  return message
    .replace("Firebase:", "")
    .replace(/\(auth\/.*?\)\.?/g, "")
    .trim();
}

export async function login(email: string, password: string) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);

    if (cred.user.email) {
      try {
        await ensureUserProfile(cred.user.uid, cred.user.email);
      } catch (profileError) {
        console.error("ensureUserProfile failed after login:", profileError);
      }
    }

    return cred.user;
  } catch (error: any) {
    throw new Error(cleanFirebaseError(error?.message || "Login failed."));
  }
}

export async function signup(email: string, password: string) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);

    if (cred.user.email) {
      try {
        await ensureUserProfile(cred.user.uid, cred.user.email);
      } catch (profileError) {
        console.error("ensureUserProfile failed after signup:", profileError);
      }
    }

    return cred.user;
  } catch (error: any) {
    throw new Error(cleanFirebaseError(error?.message || "Sign up failed."));
  }
}

export async function logout() {
  await signOut(auth);
}

export async function deleteAccountWithPassword(password: string) {
  const user = auth.currentUser;
  if (!user?.email) {
    throw new Error("No signed-in user.");
  }

  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
  await deleteUser(user);
}