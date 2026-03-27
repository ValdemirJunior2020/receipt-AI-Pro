// File: client/app/(main)/subscription.tsx

import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import type { PurchasesPackage } from "react-native-purchases";
import { auth } from "../../src/lib/firebase/client";
import {
  buyPackage,
  getEntitlementId,
  loadCurrentOffering,
  refreshPlanFromRevenueCat,
  restoreUserPurchases,
} from "../../src/lib/purchases";

export default function SubscriptionScreen() {
  const [loading, setLoading] = useState(true);
  const [busyPackageId, setBusyPackageId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [errorText, setErrorText] = useState("");

  const entitlementId = useMemo(() => getEntitlementId(), []);

  const loadScreen = useCallback(async () => {
    try {
      const uid = auth.currentUser?.uid;

      if (!uid) {
        setErrorText("Please sign in first.");
        setPackages([]);
        setIsPro(false);
        return;
      }

      setLoading(true);
      setErrorText("");

      const offering = await loadCurrentOffering(uid);
      const state = await refreshPlanFromRevenueCat(uid);

      setIsPro(state.isPro);
      setPackages(offering?.availablePackages ?? []);

      if (!offering || !offering.availablePackages?.length) {
        setErrorText(
          "No subscription products are available right now. Check the App Store product, RevenueCat product mapping, entitlement, and current offering."
        );
      }
    } catch (error: any) {
      console.error("SUBSCRIPTION LOAD ERROR:", error);
      setPackages([]);
      setIsPro(false);
      setErrorText(error?.message || "Could not load subscriptions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadScreen();
    }, [loadScreen])
  );

  async function handleBuy(pkg: PurchasesPackage) {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("Please sign in first.");

      setBusyPackageId(pkg.identifier);

      const result = await buyPackage(uid, pkg);
      setIsPro(result.isPro);

      Alert.alert("Success", "Your Pro subscription is now active.");
      await loadScreen();
    } catch (error: any) {
      console.error("PURCHASE ERROR:", error);

      if (error?.userCancelled) return;

      Alert.alert(
        "Purchase failed",
        error?.message || "The purchase could not be completed."
      );
    } finally {
      setBusyPackageId(null);
    }
  }

  async function handleRestore() {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("Please sign in first.");

      setRestoring(true);

      const result = await restoreUserPurchases(uid);
      setIsPro(result.isPro);

      Alert.alert(
        result.isPro ? "Purchases restored" : "Nothing found",
        result.isPro
          ? "Your Pro access has been restored."
          : "No active subscription was found for this Apple ID."
      );

      await loadScreen();
    } catch (error: any) {
      console.error("RESTORE ERROR:", error);
      Alert.alert("Restore failed", error?.message || "Could not restore purchases.");
    } finally {
      setRestoring(false);
    }
  }

  return (
    <LinearGradient colors={["#08121d", "#0d1b2a"]} style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
          </Pressable>

          <Text style={styles.headerTitle}>Subscription</Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.card}>
          <Text style={styles.eyebrow}>Current access</Text>
          <Text style={styles.mainTitle}>
            {isPro ? "ReceiptAI Pro Active" : "ReceiptAI Free"}
          </Text>
          <Text style={styles.description}>
            Unlock unlimited scans, advanced AI insights, smart tracking, and export tools.
          </Text>

          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={18} color="#4ade80" />
            <Text style={styles.featureText}>Unlimited receipt scans</Text>
          </View>

          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={18} color="#4ade80" />
            <Text style={styles.featureText}>AI insights and summaries</Text>
          </View>

          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={18} color="#4ade80" />
            <Text style={styles.featureText}>Budget tracking tools</Text>
          </View>

          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={18} color="#4ade80" />
            <Text style={styles.featureText}>Restore purchases support</Text>
          </View>

          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator color="#4ade80" />
              <Text style={styles.helperText}>Loading subscription options...</Text>
            </View>
          ) : packages.length > 0 ? (
            <View style={styles.packageList}>
              {packages.map((pkg) => {
                const busy = busyPackageId === pkg.identifier;

                return (
                  <View key={pkg.identifier} style={styles.packageCard}>
                    <Text style={styles.packageTitle}>
                      {pkg.product.title || pkg.identifier}
                    </Text>

                    <Text style={styles.packagePrice}>{pkg.product.priceString}</Text>

                    <Text style={styles.packageDescription}>
                      {pkg.product.description || "Auto-renewable subscription"}
                    </Text>

                    <Pressable
                      style={[styles.buyBtn, (busy || isPro) && styles.disabledBtn]}
                      onPress={() => handleBuy(pkg)}
                      disabled={busy || isPro}
                    >
                      {busy ? (
                        <ActivityIndicator color="#08121d" />
                      ) : (
                        <Text style={styles.buyBtnText}>
                          {isPro ? "Already Active" : "Subscribe with Apple"}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ) : isPro ? (
            <View style={styles.centerBox}>
              <Text style={styles.helperText}>Your Pro access is already active.</Text>
            </View>
          ) : (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>Subscription unavailable</Text>
              <Text style={styles.errorText}>
                {errorText ||
                  "No products were returned from RevenueCat. Check your Apple product and offering setup."}
              </Text>
            </View>
          )}

          <Pressable
            style={[styles.restoreBtn, restoring && styles.disabledRestoreBtn]}
            onPress={handleRestore}
            disabled={restoring}
          >
            {restoring ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.restoreBtnText}>Restore Purchases</Text>
            )}
          </Pressable>

          <Text style={styles.footnote}>
            Entitlement used in this build: {entitlementId}
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "web" ? 24 : 60,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
  },
  headerSpacer: {
    width: 42,
    height: 42,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  eyebrow: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  mainTitle: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 8,
  },
  description: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  featureText: {
    color: "#ffffff",
    fontSize: 14,
    marginLeft: 10,
  },
  centerBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  helperText: {
    color: "rgba(255,255,255,0.72)",
    marginTop: 10,
    fontSize: 13,
    textAlign: "center",
  },
  packageList: {
    marginTop: 18,
    gap: 14,
  },
  packageCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  packageTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  packagePrice: {
    color: "#A3E635",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 8,
  },
  packageDescription: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  buyBtn: {
    backgroundColor: "#A3E635",
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  buyBtnText: {
    color: "#08121d",
    fontSize: 14,
    fontWeight: "900",
  },
  restoreBtn: {
    marginTop: 18,
    borderRadius: 14,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  disabledRestoreBtn: {
    opacity: 0.6,
  },
  restoreBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  footnote: {
    marginTop: 16,
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    textAlign: "center",
  },
  errorBox: {
    marginTop: 18,
    backgroundColor: "rgba(127,29,29,0.35)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.3)",
  },
  errorTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 6,
  },
  errorText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    lineHeight: 18,
  },
});