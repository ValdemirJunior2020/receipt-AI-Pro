import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './en.json';
import ptBR from './pt-BR.json';
import es from './es.json';

const STORAGE_KEY = 'receiptai.language';

export async function getInitialLanguage() {
  const saved = await AsyncStorage.getItem(STORAGE_KEY);
  if (saved) return saved;
  const device = Localization.getLocales()?.[0]?.languageTag || 'en';
  if (device.startsWith('pt')) return 'pt-BR';
  if (device.startsWith('es')) return 'es';
  return 'en';
}

export async function setLanguage(lang: 'en' | 'pt-BR' | 'es') {
  await AsyncStorage.setItem(STORAGE_KEY, lang);
  await i18n.changeLanguage(lang);
}

(async () => {
  const lng = await getInitialLanguage();

  i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: "v4",
      resources: {
        en: { translation: en },
        'pt-BR': { translation: ptBR },
        es: { translation: es }
      },
      lng,
      fallbackLng: 'en',
      interpolation: { escapeValue: false }
    });
})();
export default i18n;
