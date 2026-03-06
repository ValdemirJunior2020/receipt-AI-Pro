// File: client/app/(main)/receipt.tsx
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { auth } from "../../src/lib/firebase/client";
import { getRecentReceipts } from "../../src/lib/firebase/receipts";

export default function ReceiptScreen() {
  const [loading, setLoading] = useState(true);
  const [receipts, setReceipts] = useState<any[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          setReceipts([]);
          setLoading(false);
          return;
        }
        const rows = await getRecentReceipts(uid, 50);
        if (!alive) return;
        setReceipts(rows);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <LinearGradient colors={["#0A1520", "#071019"]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </Pressable>

            <View style={styles.titleWrap}>
              <Ionicons name="receipt-outline" size={16} color="#00E676" />
              <Text style={styles.title}>All Receipts</Text>
            </View>

            <View style={{ width: 40 }} />
          </View>

          {loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator />
            </View>
          ) : receipts.length ? (
            receipts.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.merchant}>{item.merchant || "Unknown merchant"}</Text>
                  <Text style={styles.amount}>
                    {item.total != null ? `$${Number(item.total).toFixed(2)}` : "-"}
                  </Text>
                </View>

                <View style={styles.rowBetween}>
                  <Text style={styles.meta}>{item.category || "Other"}</Text>
                  <Text style={styles.meta}>{item.date || "No date"}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No receipts yet</Text>
              <Text style={styles.emptySub}>Scan your first receipt to see it here.</Text>
              <Pressable style={styles.scanBtn} onPress={() => router.push("/(main)/capture")}>
                <Text style={styles.scanBtnText}>Go Scan</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 24 },
  container: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "web" ? 18 : 54,
  },
  loaderWrap: { paddingVertical: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  title: { color: "#fff", fontSize: 20, fontWeight: "800", marginTop: 4 },
  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 14,
    marginBottom: 12,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  merchant: { color: "#fff", fontSize: 15, fontWeight: "800", flex: 1, marginRight: 10 },
  amount: { color: "#00E676", fontSize: 15, fontWeight: "900" },
  meta: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    marginTop: 6,
    fontWeight: "600",
  },
  emptyCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 18,
  },
  emptyTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  emptySub: {
    color: "rgba(255,255,255,0.7)",
    marginTop: 8,
    marginBottom: 14,
  },
  scanBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#00E676",
    alignItems: "center",
    justifyContent: "center",
  },
  scanBtnText: {
    color: "#071019",
    fontWeight: "900",
  },
});