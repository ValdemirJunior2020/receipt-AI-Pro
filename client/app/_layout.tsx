import '../src/i18n';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { subscribeToAuth } from '../src/lib/firebase/auth';
import { useSessionStore } from '../src/store/session';

const qc = new QueryClient();

export default function RootLayout() {
  const setUser = useSessionStore((s) => s.setUser);

  useEffect(() => {
    const unsub = subscribeToAuth(setUser);
    return () => unsub();
  }, [setUser]);

  return (
    <QueryClientProvider client={qc}>
      <StatusBar style='light' />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
