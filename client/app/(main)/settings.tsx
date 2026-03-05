import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '../../src/i18n';

export default function Settings() {
  const { t, i18n } = useTranslation();
  return (
    <View style={{ flex: 1, padding: 18, paddingTop: 58 }}>
      <Text style={{ fontSize: 22, fontWeight: '900' }}>{t('settings.title')}</Text>
      <Text style={{ marginTop: 16, fontWeight: '800' }}>{t('settings.language')} ({i18n.language})</Text>

      <TouchableOpacity onPress={() => setLanguage('en')} style={{ paddingVertical: 10 }}>
        <Text>English</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setLanguage('pt-BR')} style={{ paddingVertical: 10 }}>
        <Text>Português (Brasil)</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setLanguage('es')} style={{ paddingVertical: 10 }}>
        <Text>Español</Text>
      </TouchableOpacity>

      <Text style={{ marginTop: 24, fontWeight: '800' }}>{t('settings.privacy')}</Text>
      <Text style={{ marginTop: 6 }}>
        We collect receipt image + extracted text, store it in Firebase, and use it to categorize expenses and generate reports.
      </Text>

      <Text style={{ marginTop: 24, fontWeight: '800' }}>{t('settings.support')}</Text>
      <Text style={{ marginTop: 6 }}>support@yourdomain.com</Text>
    </View>
  );
}
