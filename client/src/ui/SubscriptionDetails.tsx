// client/src/ui/SubscriptionDetails.tsx
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { PurchasesPackage } from "react-native-purchases";
import { Ionicons } from "@expo/vector-icons";

import {
  APP_PRIVACY_POLICY_URL,
  APP_SUBSCRIPTION_DISCLOSURE,
  APP_TERMS_OF_USE_URL,
} from "../config/legal";

type SubscriptionDetailsProps = {
  pkg: PurchasesPackage;
  isDark: boolean;
  busy?: boolean;
  disabled?: boolean;
  subscribeButtonText?: string;
  onPressSubscribe?: () => void;
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
    if (identifier.includes("annual") || identifier.includes("year")) return "Yearly";
    if (identifier.includes("month")) return "Monthly";
    if (identifier.includes("week")) return "Weekly";
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
    return `${normalizeCurrency(price / (12 * value), currencyCode)}/month equivalent`;
  }

  if (unit === "month" || unit === "months") {
    return `${normalizeCurrency(price / value, currencyCode)}/month`;
  }

  if (unit === "week" || unit === "weeks") {
    return `${normalizeCurrency(price / value, currencyCode)}/week`;
  }

  if (unit === "day" || unit === "days") {
    return `${normalizeCurrency(price / value, currencyCode)}/day`;
  }

  return null;
}

export default function SubscriptionDetails({
  pkg,
  isDark,
  busy = false,
  disabled = false,
  subscribeButtonText = "Subscribe with Apple",
  onPressSubscribe,
}: SubscriptionDetailsProps) {
  const title = getPackageTitle(pkg);
  const durationLabel = getPackageDurationLabel(pkg);
  const perUnitLabel = getPricePerUnitLabel(pkg);
  const priceLabel = (pkg.product as any)?.priceString || "Price unavailable";
  const description =
    (pkg.product as any)?.description ||
    "Auto-renewable subscription for ReceiptAI Pro.";

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

  return (
    <View style={[styles.card, !isDark && styles.cardLight]}>
      <View style={styles.badgeRow}>
        <Text style={styles.planBadge}>ReceiptAI Pro</Text>
        <Text style={styles.durationBadge}>{durationLabel}</Text>
      </View>

      <Text style={[styles.title, !isDark && styles.textDark]}>{title}</Text>
      <Text style={styles.price}>{priceLabel}</Text>
      {!!perUnitLabel ? <Text style={styles.perUnit}>{perUnitLabel}</Text> : null}

      <Text style={[styles.description, !isDark && styles.textMutedDark]}>
        {description}
      </Text>

      <View style={[styles.infoCard, !isDark && styles.infoCardLight]}>
        <Text style={[styles.infoHeading, !isDark && styles.textDark]}>
          Subscription information
        </Text>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, !isDark && styles.textMutedDark]}>Title</Text>
          <Text style={[styles.infoValue, !isDark && styles.textDark]}>{title}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, !isDark && styles.textMutedDark]}>Length</Text>
          <Text style={[styles.infoValue, !isDark && styles.textDark]}>{durationLabel}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, !isDark && styles.textMutedDark]}>Price</Text>
          <Text style={[styles.infoValue, !isDark && styles.textDark]}>{priceLabel}</Text>
        </View>

        {!!perUnitLabel ? (
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, !isDark && styles.textMutedDark]}>
              Price per unit
            </Text>
            <Text style={[styles.infoValue, !isDark && styles.textDark]}>{perUnitLabel}</Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.legalCard, !isDark && styles.legalCardLight]}>
        <Text style={[styles.legalHeading, !isDark && styles.textDark]}>Legal</Text>

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
        style={[styles.buyButton, disabled && styles.disabledButton]}
        onPress={onPressSubscribe}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`Subscribe to ${title}, ${durationLabel}, ${priceLabel}`}
      >
        {busy ? (
          <ActivityIndicator color="#08121D" />
        ) : (
          <Text style={styles.buyButtonText}>{subscribeButtonText}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 14,
  },
  cardLight: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 10,
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
    marginRight: 8,
    marginBottom: 8,
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
    marginBottom: 8,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  price: {
    color: "#A3E635",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 4,
  },
  perUnit: {
    color: "#C4F46A",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  description: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  textDark: {
    color: "#0F172A",
  },
  textMutedDark: {
    color: "#475569",
  },
  infoCard: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: "rgba(163,230,53,0.10)",
    borderWidth: 1,
    borderColor: "rgba(163,230,53,0.18)",
    marginBottom: 14,
  },
  infoCardLight: {
    backgroundColor: "rgba(163,230,53,0.12)",
    borderColor: "rgba(132,204,22,0.25)",
  },
  infoHeading: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  infoLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    marginRight: 16,
    flex: 1,
  },
  infoValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
    textAlign: "right",
  },
  legalCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 14,
  },
  legalCardLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
  },
  legalHeading: {
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
    marginBottom: 10,
    paddingHorizontal: 14,
  },
  linkButtonText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 8,
  },
  disclosureText: {
    marginTop: 6,
    color: "rgba(255,255,255,0.74)",
    fontSize: 12,
    lineHeight: 18,
  },
  buyButton: {
    backgroundColor: "#A3E635",
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buyButtonText: {
    color: "#08121D",
    fontSize: 15,
    fontWeight: "900",
  },
});