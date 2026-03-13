// File: client/app/(main)/capture.tsx
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { auth } from "../../src/lib/firebase/client";
import { getScanGate, saveReceipt } from "../../src/lib/firebase/receipts";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type ReceiptResponse = {
  merchant: string | null;
  date: string | null;
  total: number | null;
  currency: string | null;
  category:
    | "Groceries"
    | "Dining Out"
    | "Transport"
    | "Utilities"
    | "Shopping"
    | "Other";
  line_items: { name: string; qty: number | null; price: number | null }[];
  raw_text: string | null;
};

export default function CaptureScreen() {
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [result, setResult] = useState<ReceiptResponse | null>(null);

  async function onTakeAndAnalyze() {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("Please log in first.");

      const gate = await getScanGate(uid);
      if (!gate.allowed) {
        Alert.alert(
          "Free limit reached",
          "You used all 5 free scans this month. Upgrade to Pro to unlock unlimited scans.",
          [
            {
              text: "Maybe later",
              style: "cancel",
            },
            {
              text: "Upgrade",
              onPress: () => router.push("/(main)/subscription"),
            },
          ]
        );
        return;
      }

      if (Platform.OS === "web") {
        Alert.alert(
          "Camera on Web",
          "Use your phone for real camera capture, or build an upload button for web later."
        );
        return;
      }

      if (!permission?.granted) {
        const res = await requestPermission();
        if (!res.granted) {
          Alert.alert("Permission required", "Camera permission is required.");
          return;
        }
      }

      if (!cameraRef.current) {
        Alert.alert("Camera not ready", "Please wait a second and try again.");
        return;
      }

      setBusy(true);
      setResult(null);

      const photo = await (cameraRef.current as any).takePictureAsync({
        quality: 0.8,
        skipProcessing: true,
      });

      if (!photo?.uri) throw new Error("Photo capture failed.");
      setPreviewUri(photo.uri);

      const form = new FormData();
      form.append(
        "image",
        {
          uri: photo.uri,
          name: "receipt.jpg",
          type: "image/jpeg",
        } as any
      );

      const res = await fetch(`${API_URL}/api/receipt/analyze`, {
        method: "POST",
        body: form,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Failed to analyze receipt.");
      }

      setResult(json);

      await saveReceipt(uid, {
        merchant: json.merchant,
        date: json.date,
        total: json.total,
        currency: json.currency,
        category: json.category,
        line_items: json.line_items || [],
        raw_text: json.raw_text,
      });

      Alert.alert(
        "Receipt saved",
        gate.plan === "free"
          ? `Saved successfully. Free scans left this month: ${gate.remaining - 1}`
          : "Saved successfully.",
        [
          { text: "Dashboard", onPress: () => router.push("/dashboard") },
          { text: "Insights", onPress: () => router.push("/(main)/insights") },
          { text: "Stay here", style: "cancel" },
        ]
      );
    } catch (err: any) {
      Alert.alert("Capture failed", err?.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (!permission) {
    return (
      <View style={styles.centerPage}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <LinearGradient colors={["#0A1520", "#071019"]} style={styles.page}>
        <View style={styles.centerCard}>
          <Text style={styles.title}>Camera Permission</Text>
          <Text style={styles.sub}>
            We need camera access to scan and analyze receipts.
          </Text>
          <Pressable style={styles.primaryBtn} onPress={requestPermission}>
            <Text style={styles.primaryBtnText}>Grant Permission</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#0A1520", "#071019"]} style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </Pressable>
          <Text style={styles.title}>Scan Receipt</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.cameraWrap}>
          <CameraView ref={cameraRef as any} style={styles.camera} facing="back" />
          <View style={styles.frame} />
        </View>

        <Pressable
          style={[styles.primaryBtn, busy && { opacity: 0.6 }]}
          onPress={onTakeAndAnalyze}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#071019" />
          ) : (
            <Text style={styles.primaryBtnText}>Take Photo & Analyze</Text>
          )}
        </Pressable>

        <Pressable
          style={styles.secondaryBtn}
          onPress={() => router.push("/(main)/subscription")}
        >
          <Text style={styles.secondaryBtnText}>View Pro Plan</Text>
        </Pressable>

        {previewUri ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Last Photo</Text>
            <Image source={{ uri: previewUri }} style={styles.preview} />
          </View>
        ) : null}

        {result ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Parsed Receipt</Text>
            <Text style={styles.item}>Merchant: {result.merchant || "-"}</Text>
            <Text style={styles.item}>Date: {result.date || "-"}</Text>
            <Text style={styles.item}>
              Total: {result.total != null ? `$${result.total}` : "-"}
            </Text>
            <Text style={styles.item}>Category: {result.category || "-"}</Text>
            <Text style={styles.item}>Currency: {result.currency || "-"}</Text>

            <Text style={[styles.cardTitle, { marginTop: 14 }]}>Line Items</Text>
            {(result.line_items || []).length ? (
              result.line_items.map((line, index) => (
                <Text key={`${line.name}-${index}`} style={styles.item}>
                  • {line.name} {line.price != null ? `- $${line.price}` : ""}
                </Text>
              ))
            ) : (
              <Text style={styles.item}>No line items found</Text>
            )}
          </View>
        ) : null}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { padding: 18, paddingBottom: 28 },
  centerPage: { flex: 1, alignItems: "center", justifyContent: "center" },
  centerCard: {
    margin: 18,
    marginTop: 140,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 18,
  },
  header: {
    paddingTop: Platform.OS === "web" ? 8 : 36,
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
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  title: { color: "#fff", fontSize: 22, fontWeight: "800" },
  sub: {
    color: "rgba(255,255,255,0.7)",
    marginTop: 8,
    marginBottom: 16,
    lineHeight: 20,
  },
  cameraWrap: {
    height: 380,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#0b1320",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 16,
    position: "relative",
  },
  camera: { flex: 1 },
  frame: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 16,
    bottom: 16,
    borderWidth: 2,
    borderRadius: 16,
    borderColor: "rgba(0,230,118,0.55)",
  },
  primaryBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#00E676",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  primaryBtnText: {
    color: "#071019",
    fontSize: 15,
    fontWeight: "900",
  },
  secondaryBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#24344A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  secondaryBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: { color: "#fff", fontSize: 16, fontWeight: "800", marginBottom: 10 },
  preview: { width: "100%", height: 220, borderRadius: 12, backgroundColor: "#111" },
  item: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginBottom: 6 },
});