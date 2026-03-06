// client/app/(main)/_layout.tsx
import React from "react";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function MainTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: "#0b0f14",
          borderTopColor: "rgba(255,255,255,0.08)",
          height: Platform.select({ ios: 86, default: 70 }),
          paddingBottom: Platform.select({ ios: 26, default: 10 }),
          paddingTop: 10,
        },
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "#8a94a6",
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="capture"
        options={{
          title: "Scan",
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? "qr-code" : "qr-code-outline"}
              size={size + 4}
              color={focused ? "#00E676" : "#8a94a6"}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pie-chart-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="export"
        options={{
          title: "Budget",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}