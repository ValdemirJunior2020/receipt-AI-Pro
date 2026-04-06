// File: client/app/(main)/subscription.tsx
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
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
import {
  buyPackage,
  getEntitlementId,
  loadCurrentOffering,
  refreshPlanFromRevenueCat,
  restoreUserPurchases,
} from "../../src/lib/purchases";
import {
  APP_PRIVACY_POLICY_URL,
  APP_RESTORE_COPY,
  APP_SUBSCRIPTION_DISCLOSURE,
  APP_TERMS_OF_USE_URL,
} from "../../src/config/legal";

type ProfileAccess = {
  isPro: boolean;
  plan: string;
  subscriptionStatus: string;
  email: string;
};

type SubscriptionPeriodLike = {
  unit?: string;
  value?: number;
  numberOfUnits?: number;
};

function normalizeCurrency(value: number, currencyCode?: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode || "USD",
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

function getSubscriptionPeriod(product: any): SubscriptionPeriodLike | null {
  const raw =
    product?.subscriptionPeriod ??
    product?.defaultOption?.subscriptionPeriod ??
    product?.subscriptionOptions?.[0]?.subscriptionPeriod ??
    null;

  if (!raw) return null;

  return {
    unit: typeof raw?.unit === "string" ? raw.unit.toLowerCase() : undefined,
    value:
      typeof raw?.value === "number"
        ? raw.value
        : typeof raw?.numberOfUnits === "number"
          ? raw.numberOfUnits
          : undefined,
    numberOfUnits:
      typeof raw?.numberOfUnits === "number" ? raw.numberOfUnits : undefined,
  };
}

function getPackageTitle(pkg: PurchasesPackage) {
  const product: any = pkg.product;
  const title =
    typeof product?.title === "string" && product.title.trim().length > 0
      ? product.title.trim()
      : "ReceiptAI Pro";

  return title.replace(/\s*\(.*?\)\s*$/, "").trim();
}

function getPackageDurationLabel(pkg: PurchasesPackage) {
  const product: any = pkg.product;
  const period = getSubscriptionPeriod(product);

  if (!period?.unit) {
    const identifier = pkg.identifier.toLowerCase();
    if (identifier.includes("annual") || identifier.includes("year")) {
      return "Yearly";
    }
    if (identifier.includes("month")) {
      return "Monthly";
    }
    if (identifier.includes("week")) {
      return "Weekly";
    }
    return "Subscription";
  }

  const value = period.value || period.numberOfUnits || 1;

  switch (period.unit) {
    case "day":
    case "days":
      return value === 7 ? "Weekly" : `${value} Day${value > 1 ? "s" : ""}`;
    case "week":
    case "weeks":
      return value === 1 ? "Weekly" : `${value} Weeks`;
    case "month":
    case "months":
      return value === 1 ? "Monthly" : `${value} Months`;
    case "year":
    case "years":
      return value === 1 ? "Yearly" : `${value} Years`;
    default:
      return "Subscription";
  }
}

function getPricePerUnitLabel(pkg: PurchasesPackage) {
  const product: any = pkg.product;
  const price =
    typeof product?.price === "number"
      ? product.price
      : typeof product?.priceAmountMicros === "number"
        ? product.priceAmountMicros / 1_000_000
        : null;

  if (price == null) return null;

  const currencyCode =
    typeof product?.currencyCode === "string" ? product.currencyCode : "USD";

  const period = getSubscriptionPeriod(product);
  const value = period?.value || period?.numberOfUnits || 1;
  const unit = period?.unit;

  if (!unit) return null;

  if (unit === "year" || unit === "years") {
    const monthlyEquivalent = price / (12 * value);
    return `${normalizeCurrency(monthlyEquivalent, currencyCode)}/month equivalent`;
  }

  if (unit === "month" || unit === "months") {
    const monthlyEquivalent = price / value;
    return `${normalizeCurrency(monthlyEquivalent, currencyCode)}/month`;
  }

  if (unit === "week" || unit === "weeks") {
    const weeklyEquivalent = price / value;
    return `${normalizeCurrency(weeklyEquivalent, currencyCode)}/week`;
  }

  if (unit === "day" || unit === "days") {
    const dailyEquivalent = price / value;
    return `${normalizeCurrency(dailyEquivalent, currencyCode)}/day`;
  }

  return null;
}

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

  const openUrl = useCallback(async (url: string, label: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert("Link unavailable", `${label} could not be opened right now.`);
        return;
      }

      await Linking.openURL(url);
    } catch (error: any) {
      Alert.alert("Link unavailable", error?.message || `Could not open ${label}.`);
    }
  }, []);

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

      setAccountEmail(profile.email);
      setAccountPlan(profile.plan);
      setAccountSubscriptionStatus(profile.subscriptionStatus);

      if (profile.isPro) {
        setIsPro(true);
        setPackages([]);
        setErrorText("");
        return;
      }

      const offering = await loadCurrentOffering(uid);
      const revenueCatState = await refreshPlanFromRevenueCat(uid);

      setIsPro(revenueCatState.isPro);
      setPackages(offering?.availablePackages ?? []);

      if (revenueCatState.isPro) {
        setErrorText("");
        return;
      }

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

            <View style={[styles.legalCard, !isDark && styles.legalCardLight]}>
              <Text style={[styles.legalHeading, !isDark && styles.textDark]}>
                Subscription information
              </Text>
              <Text style={[styles.legalText, !isDark && styles.textMutedDark]}>
                Reviewers can verify the subscription title, duration, price, and legal
                links below before purchase.
              </Text>
            </View>

            {loading ? (
              <View style={styles.centerBox}>
                <ActivityIndicator color="#4ADE80" />
                <Text style={[styles.helperText, !isDark && styles.textMutedDark]}>
                  Loading subscription options...
                </Text>
              </View>
            ) : isPro ? (
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
            ) : packages.length > 0 ? (
              <View style={styles.packageList}>
                {packages.map((pkg) => {
                  const busy = busyPackageId === pkg.identifier;
                  const durationLabel = getPackageDurationLabel(pkg);
                  const perUnitLabel = getPricePerUnitLabel(pkg);

                  return (
                    <View
                      key={pkg.identifier}
                      style={[styles.packageCard, !isDark && styles.packageCardLight]}
                      accessible
                      accessibilityRole="summary"
                      accessibilityLabel={`${getPackageTitle(pkg)}, ${durationLabel}, ${
                        (pkg.product as any)?.priceString || "Price unavailable"
                      }`}
                    >
                      <View style={styles.planBadgeRow}>
                        <Text style={styles.planBadge}>ReceiptAI Pro</Text>
                        <Text style={styles.durationBadge}>{durationLabel}</Text>
                      </View>

                      <Text style={[styles.packageTitle, !isDark && styles.textDark]}>
                        {getPackageTitle(pkg)}
                      </Text>

                      <Text style={styles.packagePrice}>
                        {(pkg.product as any)?.priceString || "Price unavailable"}
                      </Text>

                      {!!perUnitLabel ? (
                        <Text style={styles.packagePerUnit}>{perUnitLabel}</Text>
                      ) : null}

                      <Text
                        style={[
                          styles.packageDescription,
                          !isDark && styles.textMutedDark,
                        ]}
                      >
                        {(pkg.product as any)?.description ||
                          "Auto-renewable subscription for ReceiptAI Pro."}
                      </Text>

                      <Pressable
                        style={[styles.buyBtn, busy && styles.disabledBtn]}
                        onPress={() => handleBuy(pkg)}
                        disabled={busy}
                        accessibilityRole="button"
                        accessibilityLabel={`Subscribe to ${getPackageTitle(
                          pkg
                        )}, ${durationLabel}, ${
                          (pkg.product as any)?.priceString || ""
                        }`}
                      >
                        {busy ? (
                          <ActivityIndicator color="#08121D" />
                        ) : (
                          <Text style={styles.buyBtnText}>Subscribe with Apple</Text>
                        )}
                      </Pressable>
                    </View>
                  );
                })}
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

            <View style={[styles.linksSection, !isDark && styles.linksSectionLight]}>
              <Text style={[styles.linksHeading, !isDark && styles.textDark]}>
                Legal
              </Text>

              <Pressable
                style={styles.linkButton}
                onPress={() => openUrl(APP_PRIVACY_POLICY_URL, "Privacy Policy")}
                accessibilityRole="link"
                accessibilityLabel="Open Privacy Policy"
              >
                <Ionicons name="shield-checkmark-outline" size={18} color="#0F172A" />
                <Text style={styles.linkButtonText}>Privacy Policy</Text>
              </Pressable>

              <Pressable
                style={styles.linkButton}
                onPress={() => openUrl(APP_TERMS_OF_USE_URL, "Terms of Use")}
                accessibilityRole="link"
                accessibilityLabel="Open Terms of Use and EULA"
              >
                <Ionicons name="document-text-outline" size={18} color="#0F172A" />
                <Text style={styles.linkButtonText}>Terms of Use / EULA</Text>
              </Pressable>

              <Text style={[styles.disclosureText, !isDark && styles.textMutedDark]}>
                {APP_SUBSCRIPTION_DISCLOSURE}
              </Text>
            </View>

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
  legalCard: {
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 16,
    padding: 14,
    backgroundColor: "rgba(163,230,53,0.10)",
    borderWidth: 1,
    borderColor: "rgba(163,230,53,0.18)",
  },
  legalCardLight: {
    backgroundColor: "rgba(163,230,53,0.12)",
    borderColor: "rgba(132,204,22,0.25)",
  },
  legalHeading: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 6,
  },
  legalText: {
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
    gap: 14,
  },
  packageCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  packageCardLight: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
  },
  planBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  planBadge: {
    backgroundColor: "#0EA5E9",
    color: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: "hidden",
    fontSize: 12,
    fontWeight: "800",
  },
  durationBadge: {
    backgroundColor: "#E2E8F0",
    color: "#0F172A",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: "hidden",
    fontSize: 12,
    fontWeight: "800",
  },
  packageTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  packagePrice: {
    color: "#A3E635",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 4,
  },
  packagePerUnit: {
    color: "#C4F46A",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  packageDescription: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  buyBtn: {
    backgroundColor: "#A3E635",
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  buyBtnText: {
    color: "#08121D",
    fontSize: 15,
    fontWeight: "900",
  },
  linksSection: {
    marginTop: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  linksSectionLight: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
  },
  linksHeading: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  linkButton: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 14,
  },
  linkButtonText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
  },
  disclosureText: {
    marginTop: 6,
    color: "rgba(255,255,255,0.74)",
    fontSize: 12,
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