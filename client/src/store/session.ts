import { create } from 'zustand';
import type { User } from 'firebase/auth';

type SessionState = {
  user: User | null;
  setUser: (u: User | null) => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  setUser: (u) => set({ user: u })
}));
