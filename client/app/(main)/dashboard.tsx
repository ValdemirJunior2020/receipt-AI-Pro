// File: C:\Users\Valdemir Goncalves\Desktop\Projetos-2026\ReceiptAI-Pro\client\app\(main)\dashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { auth, db } from "../../src/lib/firebase/client";

const USER_AVATAR = "https://randomuser.me/api/portraits/men/32.jpg";

type ReceiptCategory =
  | "Groceries"
  | "Dining Out"
  | "Transport"
  | "Utilities"
  | "Shopping"
  | "Other";

type ReceiptDoc = {
  id: string;
  userId: string;
  merchant: string | null;
  date: string | null;
  total: number | null;
  currency: string | null;
  category: ReceiptCategory;
  line_items: { name: string; qty: number | null; price: number | null }[];
  raw_text: string | null;
  createdAt?: any;
};

function parseAmount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.,-]/g, "").replace(/,/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;

  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();

  if (typeof value === "object" && value !== null && "seconds" in (value as any)) {
    const seconds = Number((value as any).seconds);
    if (Number.isFinite(seconds)) return new Date(seconds * 1000);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    const direct = new Date(trimmed);
    if (!Number.isNaN(direct.getTime())) return direct;

    const mmddyy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (mmddyy) {
      const month = Number(mmddyy[1]) - 1;
      const day = Number(mmddyy[2]);
      let year = Number(mmddyy[3]);
      if (year < 100) year += 2000;
      const d = new Date(year, month, day);
      if (!Number.isNaN(d.getTime())) return d;
    }
  }

  return null;
}

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

function formatShortDate(value: unknown) {
  const date = parseDate(value);
  if (!date) return "No date";

  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const year = `${date.getFullYear()}`.slice(-2);
  return `${month}/${day}/${year}`;
}

function getCategoryPresentation(category: ReceiptCategory) {
  switch (category) {
    case "Groceries":
      return { label: "GROCERIES", iconType: "ion" as const, icon: "basket", iconBg: "#00E676" };
    case "Dining Out":
      return { label: "DINING OUT", iconType: "ion" as const, icon: "restaurant", iconBg: "#E65100" };
    case "Transport":
      return { label: "TRANSPORT", iconType: "fa5" as const, icon: "car-side", iconBg: "#000000" };
    case "Utilities":
      return { label: "UTILITIES", iconType: "mci" as const, icon: "flash", iconBg: "#1976D2" };
    case "Shopping":
      return { label: "SHOPPING", iconType: "ion" as const, icon: "bag-handle", iconBg: "#8B5CF6" };
    default:
      return { label: "OTHER", iconType: "ion" as const, icon: "help-circle", iconBg: "#64748B" };
  }
}

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [receipts, setReceipts] = useState<ReceiptDoc[]>([]);

  useEffect(() => {
    const uid = auth.currentUser?.uid;

    if (!uid) {
      setReceipts([]);
      setLoading(false);
      return;
    }

    const receiptsRef = collection(db, "receipts");
    const receiptsQuery = query(
      receiptsRef,
      where("userId", "==", uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      receiptsQuery,
      (snapshot) => {
        const next = snapshot.docs.map((doc) => {
          const data = doc.data() as any;

          return {
            id: doc.id,
            userId: typeof data.userId === "string" ? data.userId : uid,
            merchant: typeof data.merchant === "string" ? data.merchant : null,
            date: typeof data.date === "string" ? data.date : null,
            total: parseAmount(data.total),
            currency: typeof data.currency === "string" ? data.currency : null,
            category: (
              ["Groceries", "Dining Out", "Transport", "Utilities", "Shopping", "Other"] as ReceiptCategory[]
            ).includes(data.category)
              ? data.category
              : "Other",
            line_items: Array.isArray(data.line_items) ? data.line_items : [],
            raw_text: typeof data.raw_text === "string" ? data.raw_text : null,
            createdAt: data.createdAt ?? null,
          } as ReceiptDoc;
        });

        setReceipts(next);
        setLoading(false);
      },
      (error) => {
        console.log("Dashboard load error:", error);
        setReceipts([]);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const latestReceipt = receipts[0] ?? null;

  const recentRows = useMemo(() => receipts.slice(0, 4), [receipts]);

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

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#00E676" />
            <Text style={styles.loadingText}>Loading your receipts...</Text>
          </View>
        ) : latestReceipt ? (
          <Pressable
            style={styles.latestCard}
            onPress={() => router.push("/(main)/receipt")}
          >
            <View style={styles.latestOverlay}>
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />

              <View style={styles.dataBox}>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Merchant:</Text>
                  <Text style={styles.dataValue} numberOfLines={1}>
                    {latestReceipt.merchant || "Unknown merchant"}
                  </Text>
                </View>

                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Date:</Text>
                  <Text style={styles.dataValue}>
                    {formatShortDate(latestReceipt.date || latestReceipt.createdAt)}
                  </Text>
                </View>

                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Total:</Text>
                  <Text style={styles.dataValue}>
                    {formatMoney(parseAmount(latestReceipt.total))}
                  </Text>
                </View>

                <View style={styles.itemList}>
                  {(latestReceipt.line_items || []).length ? (
                    latestReceipt.line_items.slice(0, 3).map((item, index) => (
                      <Text key={`${item.name}-${index}`} style={styles.itemText}>
                        {item.name}
                      </Text>
                    ))
                  ) : (
                    <Text style={styles.itemText}>
                      {latestReceipt.category || "Receipt saved"}
                    </Text>
                  )}
                </View>

                <View style={styles.processing}>
                  <View style={styles.spinnerDot} />
                  <Text style={styles.processingText}>Saved from your latest scan</Text>
                </View>
              </View>
            </View>
          </Pressable>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={24} color="#00E676" />
            <Text style={styles.emptyTitle}>No receipts yet</Text>
            <Text style={styles.emptySub}>Scan your first receipt to see it here.</Text>
          </View>
        )}

        <View style={styles.list}>
          {recentRows.map((receipt) => {
            const meta = getCategoryPresentation(receipt.category);

            return (
              <Pressable
                key={receipt.id}
                style={styles.row}
                onPress={() => router.push("/(main)/receipt")}
              >
                <View style={[styles.iconCircle, { backgroundColor: meta.iconBg }]}>
                  {meta.iconType === "ion" ? (
                    <Ionicons name={meta.icon as any} size={18} color="#fff" />
                  ) : meta.iconType === "fa5" ? (
                    <FontAwesome5 name={meta.icon as any} size={16} color="#fff" />
                  ) : (
                    <MaterialCommunityIcons
                      name={meta.icon as any}
                      size={18}
                      color="#fff"
                    />
                  )}
                </View>

                <View style={styles.rowMid}>
                  <Text style={styles.rowLabel}>{meta.label}</Text>
                  <Text style={styles.rowMerchant}>
                    {receipt.merchant || "Unknown merchant"}
                  </Text>
                </View>

                <View style={styles.rowRight}>
                  <Text style={styles.rowAmount}>
                    {formatMoney(parseAmount(receipt.total))}
                  </Text>
                  <Text style={styles.rowDate}>
                    {formatShortDate(receipt.date || receipt.createdAt)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
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
    width: 64,
    height: 64,
    marginBottom: 6,
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
    marginBottom: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  scanIconOuter: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "rgba(0,230,118,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  scanIconInner: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#00E676",
    alignItems: "center",
    justifyContent: "center",
  },
  scanTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  scanSub: {
    color: "rgba(255,255,255,0.62)",
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
  sectionHeader: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  seeAll: {
    color: "#00E676",
    fontSize: 13,
    fontWeight: "800",
  },

  loadingCard: {
    minHeight: 130,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 12,
  },
  loadingText: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 13,
    fontWeight: "700",
  },

  latestCard: {
    height: 180,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  latestOverlay: {
    flex: 1,
    backgroundColor: "rgba(7,16,25,0.78)",
    position: "relative",
    padding: 16,
  },
  cornerTL: {
    position: "absolute",
    top: 14,
    left: 14,
    width: 24,
    height: 24,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: "#00E676",
  },
  cornerTR: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 24,
    height: 24,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: "#00E676",
  },
  cornerBL: {
    position: "absolute",
    bottom: 14,
    left: 14,
    width: 24,
    height: 24,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: "#00E676",
  },
  cornerBR: {
    position: "absolute",
    bottom: 14,
    right: 14,
    width: 24,
    height: 24,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: "#00E676",
  },

  dataBox: {
    marginTop: 26,
    alignSelf: "center",
    width: "88%",
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.94)",
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 4,
  },
  dataLabel: { color: "#1A1E25", fontSize: 12, fontWeight: "700" },
  dataValue: { color: "#1A1E25", fontSize: 12, fontWeight: "700", flexShrink: 1 },
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

  emptyCard: {
    minHeight: 160,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  emptySub: {
    color: "rgba(255,255,255,0.66)",
    fontSize: 13,
    textAlign: "center",
  },

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