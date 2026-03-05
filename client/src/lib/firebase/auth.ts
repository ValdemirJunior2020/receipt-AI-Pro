import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './client';

export function subscribeToAuth(cb: (u: any) => void) {
  return onAuthStateChanged(auth, cb);
}
