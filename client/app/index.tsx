import { Redirect } from 'expo-router';
import { useSessionStore } from '../src/store/session';

export default function Index() {
  const user = useSessionStore((s) => s.user);
  return <Redirect href={user ? '/(main)/dashboard' : '/(auth)/login'} />;
}
