import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { theme } from '../../src/ui/theme';

export default function Dashboard() {
  const { t } = useTranslation();

  return (
    <LinearGradient colors={[theme.bg1, theme.bg2]} style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.avatar} />
        <Text style={styles.title}>{t('appName')}</Text>
        <View style={styles.bell} />
      </View>

      <TouchableOpacity style={styles.scanCard} activeOpacity={0.9}>
        <View style={styles.cameraDot}>
          <Text style={{ color: '#0b1b22', fontWeight: '900' }}>📷</Text>
        </View>
        <Text style={styles.scanTitle}>{t('dashboard.scanReceipt')}</Text>
        <Text style={styles.scanSub}>{t('dashboard.snap')}</Text>
      </TouchableOpacity>

      <View style={styles.row}>
        <Text style={styles.section}>{t('dashboard.recentScans')}</Text>
        <Text style={styles.link}>{t('dashboard.seeAll')}</Text>
      </View>

      <View style={styles.previewCard}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=900&q=60' }}
          style={styles.previewImg}
        />
        <View style={styles.processingPill}>
          <Text style={styles.processingText}>AI Processing…</Text>
        </View>
      </View>

      <View style={styles.list}>
        <View style={styles.item}>
          <Text style={styles.itemLeft}>🛒  GROCERIES</Text>
          <Text style={styles.itemRight}>.30</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.itemLeft}>🍽️  DINING OUT</Text>
          <Text style={styles.itemRight}>.75</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.itemLeft}>🚇  TRANSPORT</Text>
          <Text style={styles.itemRight}>.10</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingTop: 58, paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)' },
  bell: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.10)' },
  title: { flex: 1, color: theme.text, fontSize: 18, fontWeight: '800' },

  scanCard: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)'
  },
  cameraDot: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: theme.mint,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10
  },
  scanTitle: { color: theme.text, fontSize: 18, fontWeight: '900' },
  scanSub: { color: theme.sub, marginTop: 2 },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 },
  section: { color: theme.text, fontWeight: '800' },
  link: { color: theme.sub },

  previewCard: { borderRadius: 18, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.08)' },
  previewImg: { width: '100%', height: 150 },
  processingPill: {
    position: 'absolute', bottom: 10, alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999
  },
  processingText: { color: 'rgba(255,255,255,0.92)', fontWeight: '700' },

  list: { marginTop: 12, gap: 10 },
  item: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    padding: 14, borderRadius: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  itemLeft: { color: theme.text, fontWeight: '800' },
  itemRight: { color: theme.text, fontWeight: '900' }
});
