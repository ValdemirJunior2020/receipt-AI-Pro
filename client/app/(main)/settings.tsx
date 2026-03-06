// File: client/app/(main)/settings.tsx
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { auth } from "../../src/lib/firebase/client";
import { logout, deleteAccountWithPassword } from "../../src/lib/firebase/auth";

export default function SettingsScreen() {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const email = auth.currentUser?.email || "No email";

  async function onLogout() {
    try {
      setBusy(true);
      await logout();
      router.replace("/login");
    } catch (err: any) {
      Alert.alert("Logout failed", err?.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteAccount() {
    if (!password.trim()) {
      Alert.alert("Password required", "Please enter your password.");
      return;
    }

    try {
      setBusy(true);
      await deleteAccountWithPassword(password);
      setShowDeleteModal(false);
      setPassword("");
      router.replace("/login");
    } catch (err: any) {
      Alert.alert(
        "Delete account failed",
        err?.message || "Could not delete account."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.container}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.sub}>Manage your account</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Signed in as</Text>
          <Text style={styles.value}>{email}</Text>
        </View>

        <Pressable style={styles.button} onPress={onLogout} disabled={busy}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Logout</Text>
          )}
        </Pressable>

        <Pressable
          style={[styles.button, styles.deleteButton]}
          onPress={() => setShowDeleteModal(true)}
          disabled={busy}
        >
          <Text style={styles.buttonText}>Delete My Account</Text>
        </Pressable>

        <Text style={styles.note}>
          Apple requires an in-app option to delete the account. This button
          permanently deletes the signed-in user.
        </Text>
      </View>

      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <Text style={styles.modalText}>
              Enter your password to confirm permanent account deletion.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Current password"
              placeholderTextColor="#8fa0b8"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  setShowDeleteModal(false);
                  setPassword("");
                }}
                disabled={busy}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.modalBtn, styles.confirmDeleteBtn]}
                onPress={onDeleteAccount}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmDeleteText}>Delete</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#071019",
  },
  container: {
    flex: 1,
    padding: 18,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 12,
  },
  sub: {
    color: "rgba(255,255,255,0.65)",
    marginTop: 4,
    marginBottom: 20,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 16,
    marginBottom: 16,
  },
  label: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    fontWeight: "700",
  },
  value: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 6,
  },
  button: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#24344A",
    marginBottom: 12,
  },
  deleteButton: {
    backgroundColor: "#B91C1C",
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  note: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#0D1A34",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  modalText: {
    color: "rgba(255,255,255,0.70)",
    marginTop: 8,
    marginBottom: 14,
    lineHeight: 20,
  },
  input: {
    backgroundColor: "#E9EEF7",
    color: "#071019",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {
    backgroundColor: "#22314A",
  },
  confirmDeleteBtn: {
    backgroundColor: "#DC2626",
  },
  cancelText: {
    color: "#fff",
    fontWeight: "800",
  },
  confirmDeleteText: {
    color: "#fff",
    fontWeight: "800",
  },
});