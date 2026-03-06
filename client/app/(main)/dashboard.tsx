// File: client/app/(main)/dashboard.tsx
import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

const USER_AVATAR =
  "https://randomuser.me/api/portraits/men/32.jpg";

const RECEIPT_IMAGE =
  "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80";

type CategoryRow = {
  key: string;
  label: string;
  merchant: string;
  amount: string;
  date: string;
  icon: React.ComponentProps<typeof Ionicons>["name"] | string;
  iconType: "ion" | "fa5" | "mci";
  iconBg: string;
};

export default function DashboardScreen() {
  const rows: CategoryRow[] = useMemo(
    () => [
      {
        key: "groceries",
        label: "GROCERIES",
        merchant: "Erewhon",
        amount: "142.30",
        date: "Oct 26",
        iconType: "ion",
        icon: "basket",
        iconBg: "#00E676",
      },
      {
        key: "dining",
        label: "DINING OUT",
        merchant: "Osteria Mozza",
        amount: "88.75",
        date: "Oct 26",
        iconType: "ion",
        icon: "restaurant",
        iconBg: "#E65100",
      },
      {
        key: "transport",
        label: "TRANSPORT",
        merchant: "Uber",
        amount: "34.10",
        date: "Oct 26",
        iconType: "fa5",
        icon: "car-side",
        iconBg: "#000000",
      },
      {
        key: "utilities",
        label: "UTILITIES",
        merchant: "DWP",
        amount: "115.00",
        date: "Oct 26",
        iconType: "mci",
        icon: "flash",
        iconBg: "#1976D2",
      },
    ],
    []
  );

  return (
    <LinearGradient colors={["#0A1520", "#071019"]} style={styles.screen}>
      <View style={styles.safeTop} />

      <View style={styles.header}>
        <Image source={{ uri: USER_AVATAR }} style={styles.avatar} />

        <View style={styles.headerTitleWrap}>
          <Image
            source={require("../../assets/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>
            ReceiptAI <Text style={styles.headerAccent}>Pro</Text>
          </Text>
        </View>

        <Pressable style={styles.bell} onPress={() => {}}>
          <Ionicons name="notifications" size={20} color="#fff" />
          <View style={styles.dot} />
        </Pressable>
      </View>

      <Pressable
        style={styles.scanCard}
        onPress={() => router.push("/(main)/capture")}
      >
        <View style={styles.scanIconOuter}>
          <View style={styles.scanIconInner}>
            <Ionicons name="camera" size={20} color="#0A1520" />
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.scanTitle}>Scan Receipt</Text>
          <Text style={styles.scanSub}>Snap & Categorize Instantly</Text>
        </View>
      </Pressable>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Scans</Text>
          <Pressable onPress={() => router.push("/(main)/receipt")}>
            <Text style={styles.seeAll}>See All</Text>
          </Pressable>
        </View>

        <View style={styles.receiptCard}>
          <Image source={{ uri: RECEIPT_IMAGE }} style={styles.receiptImg} />
          <View style={styles.overlay}>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />

            <View style={styles.dataBox}>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Date:</Text>
                <Text style={styles.dataValue}>Oct 26</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Total:</Text>
                <Text style={styles.dataValue}>$142.30</Text>
              </View>

              <View style={styles.itemList}>
                <Text style={styles.itemText}>Organic Milk</Text>
                <Text style={styles.itemText}>Coffee</Text>
                <Text style={styles.itemText}>Snacks</Text>
              </View>

              <View style={styles.processing}>
                <View style={styles.spinnerDot} />
                <Text style={styles.processingText}>AI Processing...</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.list}>
          {rows.map((r) => (
            <Pressable
              key={r.key}
              style={styles.row}
              onPress={() => router.push("/(main)/receipt")}
            >
              <View style={[styles.iconCircle, { backgroundColor: r.iconBg }]}>
                {r.iconType === "ion" ? (
                  <Ionicons name={r.icon as any} size={18} color="#fff" />
                ) : r.iconType === "fa5" ? (
                  <FontAwesome5 name={r.icon as any} size={16} color="#fff" />
                ) : (
                  <MaterialCommunityIcons
                    name={r.icon as any}
                    size={18}
                    color="#fff"
                  />
                )}
              </View>

              <View style={styles.rowMid}>
                <Text style={styles.rowLabel}>{r.label}</Text>
                <Text style={styles.rowMerchant}>{r.merchant}</Text>
              </View>

              <View style={styles.rowRight}>
                <Text style={styles.rowAmount}>${r.amount}</Text>
                <Text style={styles.rowDate}>{r.date}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeTop: { height: Platform.OS === "web" ? 12 : 44 },

  header: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.85)",
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 28,
    height: 28,
    marginBottom: 4,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  headerAccent: { color: "#00E676" },

  bell: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    position: "relative",
  },
  dot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#FF5252",
  },

  scanCard: {
    marginHorizontal: 18,
    marginTop: 6,
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    shadowColor: "#00E676",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  scanIconOuter: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  scanIconInner: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#00E676",
    alignItems: "center",
    justifyContent: "center",
  },
  scanTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
  scanSub: { color: "rgba(255,255,255,0.65)", marginTop: 2, fontSize: 12 },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 24,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 8,
  },
  sectionTitle: { color: "#fff", fontSize: 14, fontWeight: "700" },
  seeAll: { color: "#00E676", fontSize: 12, fontWeight: "700" },

  receiptCard: {
    height: 170,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    marginBottom: 14,
  },
  receiptImg: { width: "100%", height: "100%" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.12)",
  },

  cornerTL: {
    position: "absolute",
    top: 12,
    left: 12,
    width: 18,
    height: 18,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: "#00E676",
  },
  cornerTR: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 18,
    height: 18,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: "#00E676",
  },
  cornerBL: {
    position: "absolute",
    bottom: 12,
    left: 12,
    width: 18,
    height: 18,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: "#00E676",
  },
  cornerBR: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 18,
    height: 18,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: "#00E676",
  },

  dataBox: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: [{ translateX: -110 }, { translateY: -54 }],
    width: 220,
    padding: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.94)",
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  dataLabel: { color: "#1A1E25", fontSize: 12, fontWeight: "700" },
  dataValue: { color: "#1A1E25", fontSize: 12, fontWeight: "700" },
  itemList: { marginTop: 6, marginBottom: 8 },
  itemText: { color: "rgba(20,24,30,0.85)", fontSize: 11, fontWeight: "600" },
  processing: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
  spinnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00E676",
  },
  processingText: { color: "#1A1E25", fontSize: 11, fontWeight: "700" },

  list: { gap: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  rowMid: { flex: 1 },
  rowLabel: { color: "#fff", fontSize: 12, fontWeight: "900" },
  rowMerchant: {
    color: "rgba(255,255,255,0.65)",
    marginTop: 2,
    fontSize: 11,
    fontWeight: "600",
  },
  rowRight: { alignItems: "flex-end" },
  rowAmount: { color: "#fff", fontSize: 12, fontWeight: "800" },
  rowDate: {
    color: "rgba(255,255,255,0.60)",
    marginTop: 2,
    fontSize: 10,
    fontWeight: "600",
  },
});