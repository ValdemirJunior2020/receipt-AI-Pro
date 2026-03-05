import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, ScrollView } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5050"; // your server
const RECEIPT_ENDPOINT = `${API_URL}/api/receipt/analyze`;

export default function CaptureScreen() {
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isReady, setReady] = useState(false);
  const [isBusy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    setError("");
  }, []);

  const ensurePermission = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) throw new Error("Camera permission not granted.");
    }
  };

  const takePhoto = async () => {
    try {
      setError("");
      setLastResult(null);

      // Web camera via expo-camera is limited; use iOS/Android for real camera capture.
      if (Platform.OS === "web") {
        setError("Camera capture on Web is limited. Test camera on your physical iPhone (Expo Go / Dev Build).");
        return;
      }

      await ensurePermission();

      if (!cameraRef.current) throw new Error("Camera not ready.");
      setBusy(true);

      const photo = await (cameraRef.current as any).takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: false,
        skipProcessing: true,
      });

      if (!photo?.uri) throw new Error("No photo URI returned.");

      // Send the image to your backend for OCR + categorization
      const form = new FormData();
      form.append("image", {
        uri: photo.uri,
        name: "receipt.jpg",
        type: "image/jpeg",
      } as any);

      const res = await fetch(RECEIPT_ENDPOINT, {
        method: "POST",
        body: form,
        headers: {
          // IMPORTANT: don't set Content-Type manually; fetch will set boundary for multipart
        } as any,
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error || `Server error (${res.status})`);
      }

      setLastResult(json);
    } catch (e: any) {
      setError(e?.message || "Something failed.");
    } finally {
      setBusy(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.page}>
        <Text style={styles.title}>Camera</Text>
        <Text style={styles.sub}>Loading permissions…</Text>
        <ActivityIndicator />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.page}>
        <Text style={styles.title}>Camera Permission</Text>
        <Text style={styles.sub}>We need camera access to scan receipts.</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => router.back()}>
          <Text style={[styles.btnText, styles.btnGhostText]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan Receipt</Text>
        <Text style={styles.sub}>Take a photo → AI reads & categorizes</Text>
      </View>

      <View style={styles.cameraWrap}>
        <CameraView
          ref={cameraRef as any}
          style={StyleSheet.absoluteFill}
          facing="back"
          onCameraReady={() => setReady(true)}
        />
        {!isReady && (
          <View style={styles.overlay}>
            <ActivityIndicator />
            <Text style={styles.overlayText}>Starting camera…</Text>
          </View>
        )}
        <View style={styles.frame} />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, isBusy && { opacity: 0.6 }]} disabled={isBusy} onPress={takePhoto}>
          {isBusy ? <ActivityIndicator /> : <Text style={styles.btnText}>Take Photo & Analyze</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => router.back()}>
          <Text style={[styles.btnText, styles.btnGhostText]}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.resultBox} contentContainerStyle={{ paddingBottom: 20 }}>
        {!!error && <Text style={styles.err}>❌ {error}</Text>}

        {lastResult && (
          <>
            <Text style={styles.resultTitle}>Result</Text>
            <Text style={styles.resultJson}>{JSON.stringify(lastResult, null, 2)}</Text>
          </>
        )}

        {!error && !lastResult && (
          <Text style={styles.hint}>
            Tip: Start your backend, then take a clear photo with good lighting.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0b2b36" },
  header: { paddingTop: 18, paddingHorizontal: 18, paddingBottom: 10 },
  title: { color: "white", fontSize: 22, fontWeight: "800" },
  sub: { color: "#a8c0c8", marginTop: 4 },
  cameraWrap: {
    marginHorizontal: 18,
    height: 360,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#132f3b",
    position: "relative",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  overlayText: { color: "white", marginTop: 8 },
  frame: {
    position: "absolute",
    left: 14,
    right: 14,
    top: 18,
    bottom: 18,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
    borderRadius: 16,
  },
  actions: { padding: 18, gap: 10 },
  btn: {
    backgroundColor: "#1d3f4c",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  btnText: { color: "white", fontWeight: "700" },
  btnGhost: { backgroundColor: "transparent", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  btnGhostText: { color: "#cfe3ea" },
  resultBox: { flex: 1, paddingHorizontal: 18, marginTop: 6 },
  err: { color: "#ffb3b3", marginBottom: 10 },
  resultTitle: { color: "white", fontSize: 16, fontWeight: "800", marginBottom: 8 },
  resultJson: {
    color: "#d4e8ef",
    fontFamily: Platform.select({ web: "monospace", default: "monospace" }) as any,
    fontSize: 12,
    lineHeight: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 12,
    borderRadius: 12,
  },
  hint: { color: "#a8c0c8", marginTop: 10 },
});