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
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import type { PurchasesPackage } from "react-native-purchases";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../../src/lib/firebase/client";
import { APP_RESTORE_COPY } from "../../src/config/legal";
import {
  buyPackage,
  getEntitlementId,
  loadCurrentOffering,
  refreshPlanFromRevenueCat,
  restoreUserPurchases,
} from "../../src/lib/purchases";
import SubscriptionDetails from "../../src/ui/SubscriptionDetails";

type ProfileAccess = {
  isPro: boolean;
  plan: string;
  subscriptionStatus: string;
  email: string;
};

async function getProfileAccess(uid: string): Promise<ProfileAccess> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return {
      isPro: false,
      plan: "free",
      subscriptionStatus: "inactive",
      email: "",
    };
  }

  const data = snap.data() as any;

  const plan =
    typeof data?.plan === "string" ? data.plan.toLowerCase().trim() : "free";

  const subscriptionStatus =
    typeof data?.subscriptionStatus === "string"
      ? data.subscriptionStatus.toLowerCase().trim()
      : "inactive";

  const email = typeof data?.email === "string" ? data.email : "";

  return {
    isPro: plan === "pro" && subscriptionStatus === "active",
    plan,
    subscriptionStatus,
    email,
  };
}

export default function SubscriptionScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";

  const [loading, setLoading] = useState(true);
  const [busyPackageId, setBusyPackageId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [errorText, setErrorText] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPlan, setAccountPlan] = useState("free");
  const [accountSubscriptionStatus, setAccountSubscriptionStatus] =
    useState("inactive");

  const entitlementId = useMemo(() => getEntitlementId(), []);

  const loadScreen = useCallback(async () => {
    try {
      const uid = auth.currentUser?.uid;

      if (!uid) {
        setErrorText("Please sign in first.");
        setPackages([]);
        setIsPro(false);
        setAccountEmail("");
        setAccountPlan("free");
        setAccountSubscriptionStatus("inactive");
        return;
      }

      setLoading(true);
      setErrorText("");

      const profile = await getProfileAccess(uid);
      const offering = await loadCurrentOffering(uid);
      const availablePackages = offering?.availablePackages ?? [];

      setAccountEmail(profile.email);
      setAccountPlan(profile.plan);
      setAccountSubscriptionStatus(profile.subscriptionStatus);
      setPackages(availablePackages);

      if (profile.isPro) {
        setIsPro(true);
        setErrorText("");
        return;
      }

      const revenueCatState = await refreshPlanFromRevenueCat(uid);
      setIsPro(revenueCatState.isPro);

      if (revenueCatState.isPro) {
        setErrorText("");
        return;
      }

      if (!availablePackages.length) {
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

      Alert.alert("Success", "Your ReceiptAI Pro subscription is now active.");
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
          ? "Your ReceiptAI Pro access has been restored."
          : "No active subscription was found for this Apple ID."
      );

      await loadScreen();
    } catch (error: any) {
      console.error("RESTORE ERROR:", error);
      Alert.alert(
        "Restore failed",
        error?.message || "Could not restore purchases."
      );
    } finally {
      setRestoring(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <LinearGradient
        colors={isDark ? ["#08121D", "#0D1B2A"] : ["#EEF4FF", "#E5EDF9"]}
        style={styles.page}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable
              style={styles.iconBtn}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons
                name="arrow-back"
                size={20}
                color={isDark ? "#FFFFFF" : "#0F172A"}
              />
            </Pressable>

            <Text style={[styles.headerTitle, !isDark && styles.textDark]}>
              Subscription
            </Text>

            <View style={styles.headerSpacer} />
          </View>

          <View style={[styles.card, !isDark && styles.cardLight]}>
            <Text style={[styles.eyebrow, !isDark && styles.eyebrowLight]}>
              Auto-renewable subscription
            </Text>

            <Text style={[styles.mainTitle, !isDark && styles.textDark]}>
              {isPro ? "ReceiptAI Pro Active" : "Upgrade to ReceiptAI Pro"}
            </Text>

            <Text style={[styles.description, !isDark && styles.textMutedDark]}>
              ReceiptAI Pro unlocks unlimited scans, advanced AI insights, smart
              tracking, exports, and restore support.
            </Text>

            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={18} color="#4ADE80" />
              <Text style={[styles.featureText, !isDark && styles.textDark]}>
                Unlimited receipt scans
              </Text>
            </View>

            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={18} color="#4ADE80" />
              <Text style={[styles.featureText, !isDark && styles.textDark]}>
                AI insights and summaries
              </Text>
            </View>

            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={18} color="#4ADE80" />
              <Text style={[styles.featureText, !isDark && styles.textDark]}>
                Budget tracking tools
              </Text>
            </View>

            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={18} color="#4ADE80" />
              <Text style={[styles.featureText, !isDark && styles.textDark]}>
                Restore purchases support
              </Text>
            </View>

            <View style={[styles.noticeCard, !isDark && styles.noticeCardLight]}>
              <Text style={[styles.noticeHeading, !isDark && styles.textDark]}>
                Subscription information
              </Text>
              <Text style={[styles.noticeText, !isDark && styles.textMutedDark]}>
                The package title, duration, price, Privacy Policy, and Terms of
                Use are shown directly above the purchase button.
              </Text>
            </View>

            {loading ? (
              <View style={styles.centerBox}>
                <ActivityIndicator color="#4ADE80" />
                <Text style={[styles.helperText, !isDark && styles.textMutedDark]}>
                  Loading subscription options...
                </Text>
              </View>
            ) : (
              <>
                {isPro ? (
                  <View style={styles.activeBox}>
                    <Text style={styles.activeTitle}>Pro access is already active</Text>
                    <Text style={styles.activeText}>
                      This account already has access to premium features.
                    </Text>

                    {!!accountEmail ? (
                      <Text style={styles.activeMeta}>Account: {accountEmail}</Text>
                    ) : null}

                    <Text style={styles.activeMeta}>
                      Plan: {accountPlan} · Status: {accountSubscriptionStatus}
                    </Text>
                  </View>
                ) : null}

                {packages.length > 0 ? (
                  <View style={styles.packageList}>
                    {packages.map((pkg) => {
                      const busy = busyPackageId === pkg.identifier;
                      const disabled = isPro || busyPackageId !== null;

                      return (
                        <SubscriptionDetails
                          key={pkg.identifier}
                          pkg={pkg}
                          isDark={isDark}
                          busy={busy}
                          disabled={disabled}
                          subscribeButtonText={
                            isPro
                              ? "Already active on this account"
                              : "Subscribe with Apple"
                          }
                          onPressSubscribe={isPro ? undefined : () => handleBuy(pkg)}
                        />
                      );
                    })}
                  </View>
                ) : isPro ? (
                  <View style={styles.secondaryNoticeBox}>
                    <Text style={styles.secondaryNoticeTitle}>
                      Subscription already active
                    </Text>
                    <Text style={styles.secondaryNoticeText}>
                      This account is active, but no package metadata was returned in
                      the current offering. Verify the product is attached to the
                      active RevenueCat offering before resubmitting.
                    </Text>
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
              </>
            )}

            <Pressable
              style={[styles.restoreBtn, restoring && styles.disabledRestoreBtn]}
              onPress={handleRestore}
              disabled={restoring}
              accessibilityRole="button"
              accessibilityLabel="Restore previous purchases"
            >
              {restoring ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.restoreBtnText}>Restore Purchases</Text>
              )}
            </Pressable>

            <Text style={[styles.restoreCopy, !isDark && styles.textMutedDark]}>
              {APP_RESTORE_COPY}
            </Text>

            <Text style={[styles.footnote, !isDark && styles.textMutedDark]}>
              Entitlement used in this build: {entitlementId}
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#08121D",
  },
  page: {
    flex: 1,
  },
  content: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "web" ? 24 : 20,
    paddingBottom: 32,
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
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },
  headerSpacer: {
    width: 42,
    height: 42,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  cardLight: {
    backgroundColor: "rgba(255,255,255,0.88)",
    borderColor: "rgba(15,23,42,0.08)",
  },
  eyebrow: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  eyebrowLight: {
    color: "#475569",
  },
  mainTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 8,
  },
  description: {
    color: "rgba(255,255,255,0.80)",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
  },
  textDark: {
    color: "#0F172A",
  },
  textMutedDark: {
    color: "#475569",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  featureText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginLeft: 10,
    fontWeight: "600",
  },
  noticeCard: {
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 16,
    padding: 14,
    backgroundColor: "rgba(163,230,53,0.10)",
    borderWidth: 1,
    borderColor: "rgba(163,230,53,0.18)",
  },
  noticeCardLight: {
    backgroundColor: "rgba(163,230,53,0.12)",
    borderColor: "rgba(132,204,22,0.25)",
  },
  noticeHeading: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 6,
  },
  noticeText: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
    lineHeight: 19,
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
  activeBox: {
    marginTop: 18,
    backgroundColor: "rgba(20,83,45,0.35)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(74,222,128,0.35)",
  },
  activeTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 6,
  },
  activeText: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    lineHeight: 18,
  },
  activeMeta: {
    color: "rgba(255,255,255,0.70)",
    fontSize: 12,
    marginTop: 8,
  },
  packageList: {
    marginTop: 18,
  },
  secondaryNoticeBox: {
    marginTop: 18,
    backgroundColor: "rgba(37,99,235,0.24)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.35)",
  },
  secondaryNoticeTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 6,
  },
  secondaryNoticeText: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 13,
    lineHeight: 18,
  },
  restoreBtn: {
    marginTop: 18,
    borderRadius: 14,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  disabledRestoreBtn: {
    opacity: 0.6,
  },
  restoreBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  restoreCopy: {
    marginTop: 10,
    color: "rgba(255,255,255,0.68)",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
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
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.3)",
  },
  errorTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 6,
  },
  errorText: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 13,
    lineHeight: 18,
  },
});