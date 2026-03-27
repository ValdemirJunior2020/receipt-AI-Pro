// File: C:\Users\Valdemir Goncalves\Desktop\Projetos-2026\ReceiptAI-Pro\client\app\(main)\insights.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { auth, db } from "../../src/lib/firebase/client";

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

type TrendPoint = {
  label: string;
  total: number;
};

const CATEGORY_ORDER: ReceiptCategory[] = [
  "Groceries",
  "Dining Out",
  "Transport",
  "Utilities",
  "Shopping",
  "Other",
];

const CATEGORY_COLORS: Record<ReceiptCategory, string> = {
  Groceries: "#00E676",
  "Dining Out": "#60A5FA",
  Transport: "#F59E0B",
  Utilities: "#A78BFA",
  Shopping: "#F472B6",
  Other: "#94A3B8",
};

const CHART_SIZE = Math.min(Dimensions.get("window").width - 120, 220);

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

function formatDayLabel(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export default function InsightsScreen() {
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
            category: CATEGORY_ORDER.includes(data.category) ? data.category : "Other",
            line_items: Array.isArray(data.line_items) ? data.line_items : [],
            raw_text: typeof data.raw_text === "string" ? data.raw_text : null,
            createdAt: data.createdAt ?? null,
          } as ReceiptDoc;
        });

        setReceipts(next);
        setLoading(false);
      },
      (error) => {
        console.log("Insights load error:", error);
        setReceipts([]);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const totalSpend = useMemo(() => {
    return receipts.reduce((sum, receipt) => sum + parseAmount(receipt.total), 0);
  }, [receipts]);

  const categoryTotals = useMemo(() => {
    const totals: Record<ReceiptCategory, number> = {
      Groceries: 0,
      "Dining Out": 0,
      Transport: 0,
      Utilities: 0,
      Shopping: 0,
      Other: 0,
    };

    for (const receipt of receipts) {
      totals[receipt.category] += parseAmount(receipt.total);
    }

    return CATEGORY_ORDER.map((category) => ({
      category,
      total: Number(totals[category].toFixed(2)),
      percent:
        totalSpend > 0 ? Number(((totals[category] / totalSpend) * 100).toFixed(1)) : 0,
      color: CATEGORY_COLORS[category],
    }));
  }, [receipts, totalSpend]);

  const biggestCategory = useMemo(() => {
    const nonZero = categoryTotals.filter((item) => item.total > 0);
    if (!nonZero.length) return { category: "Groceries" as ReceiptCategory, total: 0 };
    return nonZero.reduce((best, item) => (item.total > best.total ? item : best));
  }, [categoryTotals]);

  const trendData = useMemo<TrendPoint[]>(() => {
    const byDay = new Map<string, { date: Date; total: number }>();

    for (const receipt of receipts) {
      const d = parseDate(receipt.date) || parseDate(receipt.createdAt);
      if (!d) continue;

      const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const key = day.toISOString();

      if (!byDay.has(key)) {
        byDay.set(key, { date: day, total: 0 });
      }

      byDay.get(key)!.total += parseAmount(receipt.total);
    }

    return Array.from(byDay.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-7)
      .map((item) => ({
        label: formatDayLabel(item.date),
        total: Number(item.total.toFixed(2)),
      }));
  }, [receipts]);

  const trendMax = useMemo(() => {
    const max = Math.max(0, ...trendData.map((item) => item.total));
    return max > 0 ? max : 1;
  }, [trendData]);

  if (loading) {
    return (
      <LinearGradient colors={["#08131D", "#031019"]} style={styles.page}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#00E676" />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#08131D", "#031019"]} style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.subtitle}>Live totals from your saved receipts</Text>

        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.cardTitle}>Total Spend</Text>
            <Ionicons name="trending-up" size={20} color="#00E676" />
          </View>

          <Text style={styles.totalValue}>{formatMoney(totalSpend)}</Text>
          <Text style={styles.helper}>
            Biggest category: {biggestCategory.category} ({formatMoney(biggestCategory.total)})
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Spending by Category</Text>

          <View style={styles.donutArea}>
            <View
              style={[
                styles.donut,
                {
                  width: CHART_SIZE,
                  height: CHART_SIZE,
                  borderRadius: CHART_SIZE / 2,
                },
              ]}
            >
              <View
                style={[
                  styles.donutCenter,
                  {
                    width: CHART_SIZE * 0.58,
                    height: CHART_SIZE * 0.58,
                    borderRadius: (CHART_SIZE * 0.58) / 2,
                  },
                ]}
              >
                <Text style={styles.centerSmall}>Total</Text>
                <Text style={styles.centerBig}>
                  {totalSpend > 0 ? formatMoney(totalSpend) : "$0"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.legendWrap}>
            {categoryTotals.map((item) => (
              <View key={item.category} style={styles.legendRow}>
                <View style={[styles.dot, { backgroundColor: item.color }]} />
                <Text style={styles.legendCategory}>{item.category}</Text>
                <View style={{ flex: 1 }} />
                <Text style={styles.legendAmount}>{formatMoney(item.total)}</Text>
                <Text style={styles.legendPercent}>{item.percent.toFixed(0)}%</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Totals Trend</Text>

          {trendData.length ? (
            <View style={styles.barChart}>
              {trendData.map((item) => {
                const height = Math.max((item.total / trendMax) * 120, 8);

                return (
                  <View key={item.label} style={styles.barCol}>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { height }]} />
                    </View>
                    <Text style={styles.barAmount}>{formatMoney(item.total)}</Text>
                    <Text style={styles.barLabel}>{item.label}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No trend data yet</Text>
            </View>
          )}
        </View>

        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "web" ? 20 : 54,
    paddingBottom: 36,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },
  subtitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 18,
    marginBottom: 16,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  totalValue: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "900",
    marginTop: 10,
  },
  helper: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 14,
    marginTop: 6,
  },
  donutArea: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  donut: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 24,
    borderColor: "#00E676",
    alignItems: "center",
    justifyContent: "center",
  },
  donutCenter: {
    backgroundColor: "#06131E",
    alignItems: "center",
    justifyContent: "center",
  },
  centerSmall: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    fontWeight: "700",
  },
  centerBig: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 4,
  },
  legendWrap: {
    gap: 10,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  legendCategory: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  legendAmount: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    minWidth: 74,
    textAlign: "right",
  },
  legendPercent: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 13,
    width: 42,
    textAlign: "right",
    marginLeft: 8,
  },
  barChart: {
    minHeight: 190,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 16,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
  },
  barTrack: {
    width: 24,
    height: 130,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    backgroundColor: "#00E676",
    borderRadius: 12,
  },
  barAmount: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    marginTop: 8,
    fontWeight: "700",
  },
  barLabel: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 11,
    marginTop: 4,
  },
  emptyBox: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 14,
    fontWeight: "700",
  },
  backButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: "#24344A",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
});