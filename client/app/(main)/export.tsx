// File: client/app/(main)/export.tsx
import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

type BudgetItem = {
  id: string;
  category: string;
  spent: number;
  budget: number;
  color: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
};

const COLORS = {
  bgTop: "#0A1520",
  bgBottom: "#071019",
  card: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.10)",
  text: "#FFFFFF",
  sub: "rgba(255,255,255,0.68)",
  green: "#00E676",
  yellow: "#FFC857",
  red: "#FF6B6B",
  blue: "#4DA3FF",
};

export default function BudgetScreen() {
  const items: BudgetItem[] = useMemo(
    () => [
      {
        id: "1",
        category: "Groceries",
        spent: 324.2,
        budget: 450,
        color: "#00E676",
        icon: "basket-outline",
      },
      {
        id: "2",
        category: "Dining Out",
        spent: 185.5,
        budget: 160,
        color: "#FF8A3D",
        icon: "restaurant-outline",
      },
      {
        id: "3",
        category: "Transport",
        spent: 74.3,
        budget: 120,
        color: "#4DA3FF",
        icon: "car-outline",
      },
      {
        id: "4",
        category: "Utilities",
        spent: 115,
        budget: 140,
        color: "#9B6BFF",
        icon: "flash-outline",
      },
    ],
    []
  );

  const totalSpent = items.reduce((sum, item) => sum + item.spent, 0);
  const totalBudget = items.reduce((sum, item) => sum + item.budget, 0);
  const remaining = totalBudget - totalSpent;

  return (
    <LinearGradient colors={[COLORS.bgTop, COLORS.bgBottom]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <Text style={styles.title}>Budget</Text>
          <Text style={styles.subtitle}>Track limits and see what is left this month</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>Total Budget</Text>
                <Text style={styles.summaryValue}>${totalBudget.toFixed(2)}</Text>
              </View>

              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>Spent</Text>
                <Text style={styles.summaryValue}>${totalSpent.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.remainingWrap}>
              <Text style={styles.remainingLabel}>Remaining</Text>
              <Text
                style={[
                  styles.remainingValue,
                  { color: remaining >= 0 ? COLORS.green : COLORS.red },
                ]}
              >
                ${remaining.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Category Budgets</Text>

            {items.map((item) => {
              const percent = Math.min((item.spent / item.budget) * 100, 100);
              const overBudget = item.spent > item.budget;

              return (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemTop}>
                    <View style={styles.itemLeft}>
                      <View style={[styles.iconWrap, { backgroundColor: item.color }]}>
                        <Ionicons name={item.icon} size={18} color="#fff" />
                      </View>

                      <View>
                        <Text style={styles.itemCategory}>{item.category}</Text>
                        <Text style={styles.itemMeta}>
                          ${item.spent.toFixed(2)} of ${item.budget.toFixed(2)}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.statusText,
                        { color: overBudget ? COLORS.red : COLORS.green },
                      ]}
                    >
                      {overBudget ? "Over" : "On Track"}
                    </Text>
                  </View>

                  <View style={styles.progressBg}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${percent}%`,
                          backgroundColor: overBudget ? COLORS.red : item.color,
                        },
                      ]}
                    />
                  </View>

                  <Text style={styles.percentText}>{percent.toFixed(0)}% used</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Budget Advice</Text>

            <AdviceRow
              title="Dining Out is above target"
              text="This category is already over budget. Reducing restaurant spending will help the fastest."
              icon="warning-outline"
              color={COLORS.red}
            />

            <AdviceRow
              title="Groceries are stable"
              text="Groceries are under control and still below the monthly target."
              icon="checkmark-circle-outline"
              color={COLORS.green}
            />

            <AdviceRow
              title="Use scanning to stay updated"
              text="Each new receipt should update this page automatically once your real scan data is connected."
              icon="scan-outline"
              color={COLORS.blue}
            />
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function AdviceRow({
  title,
  text,
  icon,
  color,
}: {
  title: string;
  text: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
}) {
  return (
    <View style={styles.adviceRow}>
      <View style={[styles.adviceIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={18} color="#fff" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.adviceTitle}>{title}</Text>
        <Text style={styles.adviceText}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  container: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "web" ? 18 : 54,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    color: COLORS.sub,
    marginTop: 4,
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    padding: 12,
  },
  summaryLabel: {
    color: COLORS.sub,
    fontSize: 12,
    fontWeight: "700",
  },
  summaryValue: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 6,
  },
  remainingWrap: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  remainingLabel: {
    color: COLORS.sub,
    fontSize: 12,
    fontWeight: "700",
  },
  remainingValue: {
    fontSize: 28,
    fontWeight: "900",
    marginTop: 6,
  },
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  itemCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  itemTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  itemLeft: {
    flexDirection: "row",
    gap: 10,
    flex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  itemCategory: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },
  itemMeta: {
    color: COLORS.sub,
    fontSize: 12,
    marginTop: 2,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },
  progressBg: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    marginTop: 12,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  percentText: {
    color: COLORS.sub,
    fontSize: 11,
    marginTop: 8,
    fontWeight: "700",
  },
  adviceRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
  },
  adviceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  adviceTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 4,
  },
  adviceText: {
    color: COLORS.sub,
    lineHeight: 19,
    fontSize: 12,
  },
});