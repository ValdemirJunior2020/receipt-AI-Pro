// File: client/app/(auth)/login.tsx
import React, { useMemo, useState } from "react";
import { Link, router } from "expo-router";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../src/lib/firebase/client";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const canSubmit = useMemo(() => {
    return email.trim().length > 3 && password.length >= 6 && !busy;
  }, [email, password, busy]);

  async function onLogin() {
    try {
      setBusy(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/dashboard");
    } catch (err: any) {
      Alert.alert("Login failed", err?.message ?? "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>ReceiptAI Pro</Text>
        <Text style={styles.subtitle}>Sign in</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@email.com"
          placeholderTextColor="#9aa4b2"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          style={styles.input}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor="#9aa4b2"
          secureTextEntry
          style={styles.input}
        />

        <Pressable
          onPress={onLogin}
          disabled={!canSubmit}
          style={({ pressed }) => [
            styles.button,
            !canSubmit && styles.buttonDisabled,
            pressed && canSubmit && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>{busy ? "Logging in..." : "Login"}</Text>
        </Pressable>

        <Text style={styles.footerText}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" style={styles.link}>
            Create one
          </Link>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#071221",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#0d1a34",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1f2a44",
  },
  title: {
    color: "white",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 2,
  },
  subtitle: {
    color: "#c7d2fe",
    marginBottom: 16,
  },
  label: {
    color: "#cbd5e1",
    marginTop: 10,
    marginBottom: 6,
    fontSize: 12,
    fontWeight: "600",
  },
  input: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#263556",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#071221",
    backgroundColor: "#e9eef7",
  },
  button: {
    marginTop: 14,
    backgroundColor: "#4037b7",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: "white",
    fontWeight: "800",
    fontSize: 15,
  },
  footerText: {
    color: "#94a3b8",
    marginTop: 14,
    textAlign: "center",
  },
  link: {
    color: "#a5b4fc",
    fontWeight: "800",
  },
});