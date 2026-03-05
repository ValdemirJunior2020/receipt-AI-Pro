import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function MainLayout() {
  const { t } = useTranslation();
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name='dashboard' options={{ title: t('tabs.dashboard') }} />
      <Tabs.Screen name='capture' options={{ title: t('tabs.scan') }} />
      <Tabs.Screen name='insights' options={{ title: t('tabs.insights') }} />
      <Tabs.Screen name='export' options={{ title: t('tabs.reports') }} />
      <Tabs.Screen name='settings' options={{ title: t('tabs.settings') }} />
      <Tabs.Screen name='receipt/[id]' options={{ href: null }} />
    </Tabs>
  );
}
