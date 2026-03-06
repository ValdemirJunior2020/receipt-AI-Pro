// File: client/app/(main)/subscription.tsx
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { auth } from "../../src/lib/firebase/client";
import { getUserProfile, setUserPlan } from "../../src/lib/firebase/users";

export default function SubscriptionScreen() {
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [status, setStatus] = useState<"inactive" | "active">("inactive");

  useEffect(() => {
    let alive = true;
    (async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const profile = await getUserProfile(uid);
      if (!alive || !profile) return;
      setPlan(profile.plan);
      setStatus(profile.subscriptionStatus);
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function activateProTestMode() {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("No signed-in user.");
      setBusy(true);
      await setUserPlan(uid, "pro", "active");
      setPlan("pro");
      setStatus("active");
      Alert.alert(
        "Pro activated",
        "Temporary test mode enabled. Replace this with RevenueCat/App Store purchases next."
      );
    } catch (err: any) {
      Alert.alert("Upgrade failed", err?.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function revertToFree() {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("No signed-in user.");
      setBusy(true);
      await setUserPlan(uid, "free", "inactive");
      setPlan("free");
      setStatus("inactive");
      Alert.alert("Plan changed", "You are back on the free plan.");
    } catch (err: any) {
      Alert.alert("Update failed", err?.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <LinearGradient colors={["#0A1520", "#071019"]} style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </Pressable>
          <Text style={styles.title}>Subscription</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.planCard}>
          <Text style={styles.planLabel}>Current Plan</Text>
          <Text style={styles.planName}>{plan === "pro" ? "ReceiptAI Pro" : "ReceiptAI Free"}</Text>
          <Text style={styles.planMeta}>
            Status: {status === "active" ? "Active" : "Inactive"}
          </Text>
        </View>

        <View style={styles.priceCard}>
          <Text style={styles.sectionTitle}>ReceiptAI Pro</Text>
          <Text style={styles.price}>$4.99 / month</Text>

          <Feature text="Unlimited receipt scans" />
          <Feature text="AI insights and smart recommendations" />
          <Feature text="Budget tools and tracking" />
          <Feature text="Receipt export and monthly reports" />
          <Feature text="No scan limits" />

          <Pressable
            style={[styles.primaryBtn, busy && { opacity: 0.6 }]}
            onPress={activateProTestMode}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#071019" />
            ) : (
              <Text style={styles.primaryBtnText}>Activate Pro (Test Mode)</Text>
            )}
          </Pressable>

          <Text style={styles.helper}>
            Production version: replace this button with RevenueCat + App Store subscription products.
          </Text>
        </View>

        <View style={styles.freeCard}>
          <Text style={styles.sectionTitle}>Free Plan</Text>
          <Text style={styles.freeText}>5 receipt scans per month + basic dashboard.</Text>

          <Pressable
            style={[styles.secondaryBtn, busy && { opacity: 0.6 }]}
            onPress={revertToFree}
            disabled={busy}
          >
            <Text style={styles.secondaryBtnText}>Use Free Plan</Text>
          </Pressable>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <View style={styles.featureRow}>
      <Ionicons name="checkmark-circle" size={18} color="#00E676" />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: {
    padding: 18,
    paddingTop: Platform.OS === "web" ? 18 : 54,
    paddingBottom: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  title: { color: "#fff", fontSize: 22, fontWeight: "800" },

  planCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 16,
    marginBottom: 14,
  },
  planLabel: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    fontWeight: "700",
  },
  planName: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 6,
  },
  planMeta: {
    color: "#00E676",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
  },

  priceCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  price: {
    color: "#00E676",
    fontSize: 32,
    fontWeight: "900",
    marginTop: 8,
    marginBottom: 14,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  featureText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 14,
    flex: 1,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#00E676",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  primaryBtnText: {
    color: "#071019",
    fontWeight: "900",
    fontSize: 15,
  },
  helper: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },

  freeCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 16,
  },
  freeText: {
    color: "rgba(255,255,255,0.72)",
    marginTop: 8,
    marginBottom: 14,
  },
  secondaryBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#24344A",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    color: "#fff",
    fontWeight: "800",
  },
});