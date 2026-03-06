// File: client/app/(main)/receipt.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function ReceiptScreen() {
  const receipts = [
    {
      id: "1",
      merchant: "Erewhon",
      total: "$142.30",
      date: "Oct 26",
      category: "Groceries",
    },
    {
      id: "2",
      merchant: "Osteria Mozza",
      total: "$88.75",
      date: "Oct 26",
      category: "Dining Out",
    },
    {
      id: "3",
      merchant: "Uber",
      total: "$34.10",
      date: "Oct 26",
      category: "Transport",
    },
  ];

  return (
    <LinearGradient colors={["#0A1520", "#071019"]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </Pressable>

            <View style={styles.titleWrap}>
              <ImageLogo />
              <Text style={styles.title}>All Receipts</Text>
            </View>

            <View style={{ width: 40 }} />
          </View>

          {receipts.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.merchant}>{item.merchant}</Text>
                <Text style={styles.amount}>{item.total}</Text>
              </View>

              <View style={styles.rowBetween}>
                <Text style={styles.meta}>{item.category}</Text>
                <Text style={styles.meta}>{item.date}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function ImageLogo() {
  return (
    <View style={styles.logoWrap}>
      {/* local logo */}
      <Ionicons name="receipt-outline" size={14} color="#00E676" />
    </View>
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
  logoWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    marginBottom: 4,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
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
  merchant: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  amount: {
    color: "#00E676",
    fontSize: 15,
    fontWeight: "900",
  },
  meta: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    marginTop: 6,
    fontWeight: "600",
  },
});