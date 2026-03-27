// File: client/app/(auth)/login.tsx
import React, { useMemo, useState } from "react";
import { Link, router } from "expo-router";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { login } from "../../src/lib/firebase/auth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const canSubmit = useMemo(() => {
    return email.trim().length > 3 && password.length >= 6 && !busy;
  }, [email, password, busy]);

  async function onLogin() {
    try {
      setBusy(true);
      await login(email.trim(), password);
      router.replace("/dashboard");
    } catch (err: any) {
      Alert.alert("Login failed", err?.message || "Something went wrong.");
      console.error("LOGIN ERROR:", err);
    } finally {
      setBusy(false);
    }
  }

  function onForgotPassword() {
    Alert.alert(
      "Forgot Password",
      "Add your reset password flow here when you're ready."
    );
  }

  return (
    <LinearGradient colors={["#051126", "#07182E", "#08111D"]} style={styles.page}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.bgGlowOne} />
          <View style={styles.bgGlowTwo} />

          <View style={styles.coinTopRight}>
            <Text style={styles.coinText}>🪙</Text>
          </View>

          <View style={styles.coinBottomLeft}>
            <Text style={styles.coinText}>🪙</Text>
          </View>

          <View style={styles.receiptLeft}>
            <Ionicons name="receipt-outline" size={26} color="#EAF2FF" />
          </View>

          <View style={styles.receiptRight}>
            <Ionicons name="receipt-outline" size={26} color="#EAF2FF" />
          </View>

          <View style={styles.card}>
            <View style={styles.logoWrap}>
              <LinearGradient
                colors={["#4B5DFF", "#63F7B5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoBg}
              >
                <Image
                  source={require("../../assets/icon.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </LinearGradient>

              <View style={styles.sparkle}>
                <Ionicons name="sparkles" size={12} color="#FF8A4C" />
              </View>
            </View>

            <Text style={styles.title}>ReceiptAI Pro</Text>
            <Text style={styles.subtitle}>Your Intelligent Receipt Organizer</Text>

            <View style={styles.form}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your.name@receipt.ai"
                  placeholderTextColor="#9FB0CF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  style={styles.input}
                />
              </View>

              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="********"
                  placeholderTextColor="#9FB0CF"
                  secureTextEntry={!showPassword}
                  style={[styles.input, styles.passwordInput]}
                />

                <Pressable
                  onPress={() => setShowPassword((prev) => !prev)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#8EA1C6"
                  />
                </Pressable>
              </View>

              <Pressable onPress={onForgotPassword} style={styles.forgotWrap}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </Pressable>

              <Pressable
                onPress={onLogin}
                disabled={!canSubmit}
                style={({ pressed }) => [
                  styles.loginButton,
                  !canSubmit && styles.loginButtonDisabled,
                  pressed && canSubmit && styles.loginButtonPressed,
                ]}
              >
                <Text style={styles.loginButtonText}>
                  {busy ? "LOGGING IN..." : "LOGIN"}
                </Text>
              </Pressable>

              <Text style={styles.footerText}>
                Don&apos;t have an account?{" "}
                <Link href="/signup" style={styles.link}>
                  Create one
                </Link>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  bgGlowOne: {
    position: "absolute",
    top: 80,
    left: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(49, 100, 255, 0.14)",
  },
  bgGlowTwo: {
    position: "absolute",
    right: -40,
    bottom: 120,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "rgba(0, 230, 118, 0.10)",
  },
  coinTopRight: {
    position: "absolute",
    right: 12,
    bottom: 110,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 215, 90, 0.12)",
  },
  coinBottomLeft: {
    position: "absolute",
    left: 10,
    top: 170,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 215, 90, 0.12)",
  },
  coinText: {
    fontSize: 18,
  },
  receiptLeft: {
    position: "absolute",
    left: 18,
    bottom: 170,
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    transform: [{ rotate: "-18deg" }],
  },
  receiptRight: {
    position: "absolute",
    right: 18,
    top: 210,
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    transform: [{ rotate: "14deg" }],
  },
  card: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 26,
    backgroundColor: "rgba(10, 22, 48, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(116, 157, 255, 0.18)",
    shadowColor: "#000000",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  logoBg: {
    width: 94,
    height: 94,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#60B5FF",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  logo: {
    width: 60,
    height: 60,
  },
  sparkle: {
    position: "absolute",
    left: 98,
    top: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#173866",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    color: "#C9D5F0",
    fontSize: 15,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 18,
  },
  form: {
    width: "100%",
  },
  label: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 8,
  },
  inputWrap: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(166, 190, 255, 0.18)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    paddingVertical: 14,
  },
  passwordInput: {
    paddingRight: 8,
  },
  eyeButton: {
    paddingLeft: 8,
    paddingVertical: 8,
  },
  forgotWrap: {
    alignSelf: "flex-end",
    marginTop: 8,
    marginBottom: 14,
  },
  forgotText: {
    color: "#C9D5F0",
    fontSize: 14,
    fontWeight: "500",
  },
  loginButton: {
    minHeight: 58,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#66FF33",
    shadowColor: "#66FF33",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  loginButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  loginButtonDisabled: {
    opacity: 0.45,
  },
  loginButtonText: {
    color: "#08111D",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  footerText: {
    color: "#D7E2FB",
    marginTop: 18,
    textAlign: "center",
    fontSize: 16,
  },
  link: {
    color: "#AFC4FF",
    fontWeight: "800",
  },
});