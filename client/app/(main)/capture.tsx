// File: C:\Users\Junior\Downloads\receipt-AI-Pro-fixed\receipt-AI-Pro\client\app\(main)\capture.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  Modal,
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

const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim() ||
  "https://receipt-ai-pro-server.onrender.com";

const loadingGif = require("../../assets/loading-receipt.gif");

type ReceiptCategory =
  | "Groceries"
  | "Dining Out"
  | "Transport"
  | "Utilities"
  | "Shopping"
  | "Other";

type ReceiptLineItem = {
  name: string;
  qty: number | null;
  price: number | null;
};

type ReceiptResponse = {
  merchant: string | null;
  date: string | null;
  total: number | null;
  currency: string | null;
  category: ReceiptCategory;
  line_items: ReceiptLineItem[];
  raw_text: string | null;
};

const VALID_CATEGORIES: ReceiptCategory[] = [
  "Groceries",
  "Dining Out",
  "Transport",
  "Utilities",
  "Shopping",
  "Other",
];

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.,-]/g, "").replace(/,/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function normalizeCategory(value: unknown): ReceiptCategory {
  if (typeof value !== "string") return "Other";
  return VALID_CATEGORIES.includes(value as ReceiptCategory)
    ? (value as ReceiptCategory)
    : "Other";
}

function normalizeLineItems(value: unknown): ReceiptLineItem[] {
  if (!Array.isArray(value)) return [];

  return value.map((item) => {
    const row = typeof item === "object" && item !== null ? item : {};
    return {
      name:
        typeof (row as any).name === "string" && (row as any).name.trim()
          ? (row as any).name.trim()
          : "Item",
      qty: normalizeNumber((row as any).qty),
      price: normalizeNumber((row as any).price),
    };
  });
}

function normalizeReceiptResponse(payload: any): ReceiptResponse {
  return {
    merchant: normalizeString(payload?.merchant),
    date: normalizeString(payload?.date),
    total: normalizeNumber(payload?.total),
    currency: normalizeString(payload?.currency),
    category: normalizeCategory(payload?.category),
    line_items: normalizeLineItems(payload?.line_items),
    raw_text: normalizeString(payload?.raw_text),
  };
}

function ScanOverlay() {
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.9)).current;
  const glowAnim = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.98,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.9,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.35,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [glowAnim, pulseAnim, scanLineAnim]);

  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 235],
  });

  return (
    <View pointerEvents="none" style={styles.overlayRoot}>
      <View style={styles.overlayTop} />
      <View style={styles.overlayMiddle}>
        <View style={styles.overlaySide} />

        <Animated.View
          style={[
            styles.scanWindowWrap,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.scanWindowGlow,
              {
                opacity: glowAnim,
              },
            ]}
          />

          <View style={styles.scanWindow}>
            <Corner position="topLeft" />
            <Corner position="topRight" />
            <Corner position="bottomLeft" />
            <Corner position="bottomRight" />

            <Animated.View
              style={[
                styles.scanLine,
                {
                  transform: [{ translateY }],
                },
              ]}
            />
          </View>
        </Animated.View>

        <View style={styles.overlaySide} />
      </View>
      <View style={styles.overlayBottom}>
        <View style={styles.hintPill}>
          <Ionicons name="scan-outline" size={16} color="#00E676" />
          <Text style={styles.hintText}>Center the receipt inside the frame</Text>
        </View>
      </View>
    </View>
  );
}

function Corner({
  position,
}: {
  position: "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
}) {
  const isTop = position.includes("top");
  const isLeft = position.includes("Left");

  return (
    <View
      style={[
        styles.corner,
        isTop ? { top: 10 } : { bottom: 10 },
        isLeft ? { left: 10 } : { right: 10 },
        !isLeft && { transform: [{ scaleX: -1 }] },
        !isTop && { transform: [{ scaleY: -1 }, ...(isLeft ? [] : [{ scaleX: -1 }]) ] },
      ]}
    />
  );
}

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
            { text: "Maybe later", style: "cancel" },
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
          "Use your phone or a development build for real camera capture."
        );
        return;
      }

      if (!permission?.granted) {
        const permissionResult = await requestPermission();
        if (!permissionResult.granted) {
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
        quality: 1,
        skipProcessing: false,
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

      const response = await fetch(`${API_URL}/api/receipt/analyze`, {
        method: "POST",
        body: form,
      });

      const rawText = await response.text();

      let payload: any;
      try {
        payload = rawText ? JSON.parse(rawText) : {};
      } catch {
        throw new Error(
          `Server returned invalid JSON: ${rawText?.slice(0, 200) || "empty response"}`
        );
      }

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to analyze receipt.");
      }

      const normalized = normalizeReceiptResponse(payload);

      if (
        !normalized.merchant &&
        normalized.total == null &&
        normalized.line_items.length === 0 &&
        !normalized.raw_text
      ) {
        throw new Error(
          "Receipt was uploaded, but no readable data came back from the server."
        );
      }

      setResult(normalized);

      await saveReceipt(uid, {
        merchant: normalized.merchant,
        date: normalized.date,
        total: normalized.total,
        currency: normalized.currency,
        category: normalized.category,
        line_items: normalized.line_items,
        raw_text: normalized.raw_text,
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
      console.log("Capture analyze error:", err);
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
          <Text style={styles.title}>Camera Access</Text>
          <Text style={styles.sub}>
            Continue to allow camera access so you can scan and analyze your receipts.
          </Text>
          <Pressable style={styles.primaryBtn} onPress={requestPermission}>
            <Text style={styles.primaryBtnText}>Continue</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#0A1520", "#071019"]} style={styles.page}>
      <Modal visible={busy} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <Image source={loadingGif} style={styles.loadingGif} resizeMode="contain" />
            <Text style={styles.loadingTitle}>Analyzing receipt...</Text>
            <Text style={styles.loadingSub}>
              Please hold on while we read and organize your purchase.
            </Text>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </Pressable>
          <Text style={styles.title}>Scan Receipt</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.cameraShell}>
          <CameraView ref={cameraRef as any} style={styles.camera} facing="back" />
          <ScanOverlay />
        </View>

        <Pressable
          style={[styles.primaryBtn, busy && { opacity: 0.6 }]}
          onPress={onTakeAndAnalyze}
          disabled={busy}
        >
          <Ionicons name="camera-outline" size={18} color="#071019" />
          <Text style={styles.primaryBtnText}>Take Photo & Analyze</Text>
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
              Total: {result.total != null ? `$${result.total.toFixed(2)}` : "-"}
            </Text>
            <Text style={styles.item}>Category: {result.category || "-"}</Text>
            <Text style={styles.item}>Currency: {result.currency || "-"}</Text>

            <Text style={[styles.cardTitle, { marginTop: 14 }]}>Line Items</Text>
            {result.line_items.length ? (
              result.line_items.map((line, index) => (
                <Text key={`${line.name}-${index}`} style={styles.item}>
                  • {line.name}
                  {line.qty != null ? ` x${line.qty}` : ""}
                  {line.price != null ? ` - $${line.price}` : ""}
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
  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(2, 10, 18, 0.78)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  loadingCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#0B1622",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  loadingGif: {
    width: 120,
    height: 120,
    marginBottom: 12,
  },
  loadingTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  loadingSub: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
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
  cameraShell: {
    height: 470,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#0b1320",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 16,
    position: "relative",
  },
  camera: { flex: 1 },
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayTop: {
    height: 56,
    backgroundColor: "rgba(2,10,18,0.46)",
  },
  overlayMiddle: {
    flex: 1,
    flexDirection: "row",
  },
  overlaySide: {
    width: 18,
    backgroundColor: "rgba(2,10,18,0.42)",
  },
  overlayBottom: {
    height: 96,
    backgroundColor: "rgba(2,10,18,0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  scanWindowWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scanWindowGlow: {
    position: "absolute",
    width: "88%",
    height: 270,
    borderRadius: 22,
    backgroundColor: "rgba(0,230,118,0.08)",
  },
  scanWindow: {
    width: "88%",
    height: 270,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  scanLine: {
    position: "absolute",
    left: 14,
    right: 14,
    top: 12,
    height: 3,
    borderRadius: 6,
    backgroundColor: "#00E676",
    shadowColor: "#00E676",
    shadowOpacity: 0.8,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  corner: {
    position: "absolute",
    width: 38,
    height: 38,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#00E676",
    borderTopLeftRadius: 12,
    shadowColor: "#00E676",
    shadowOpacity: 0.55,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  hintPill: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "rgba(8,20,30,0.88)",
    borderWidth: 1,
    borderColor: "rgba(0,230,118,0.18)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hintText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  primaryBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#00E676",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    flexDirection: "row",
    gap: 8,
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