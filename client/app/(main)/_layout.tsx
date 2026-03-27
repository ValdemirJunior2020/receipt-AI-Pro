// File: client/app/(main)/_layout.tsx
import React from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import { Tabs } from "expo-router";

const dashboardIcon = require("../../assets/icons/dashboard.png");
const scanIcon = require("../../assets/icons/scan.png");
const insightsIcon = require("../../assets/icons/insights.png");
const budgetIcon = require("../../assets/icons/budget.png");
const settingsIcon = require("../../assets/icons/settings.png");
const receiptsIcon = require("../../assets/icons/receipts.png");
const subscriptionsIcon = require("../../assets/icons/subscriptions.png");

type TabIconProps = {
  source: any;
  focused: boolean;
  label: string;
};

function TabIcon({ source, focused, label }: TabIconProps) {
  return (
    <View style={styles.iconWrap}>
      <View
        style={[
          styles.iconShadowWrap,
          focused ? styles.iconShadowWrapFocused : styles.iconShadowWrapIdle,
        ]}
      >
        <Image source={source} style={styles.iconImage} resizeMode="contain" />
      </View>

      <Text style={[styles.label, focused ? styles.labelFocused : styles.labelIdle]}>
        {label}
      </Text>
    </View>
  );
}

export default function MainTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        tabBarActiveTintColor: "#00E676",
        tabBarInactiveTintColor: "rgba(255,255,255,0.7)",
        sceneStyle: { backgroundColor: "#071019" },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ focused }) => (
            <TabIcon source={dashboardIcon} focused={focused} label="Dashboard" />
          ),
        }}
      />

      <Tabs.Screen
        name="capture"
        options={{
          title: "Scan",
          tabBarIcon: ({ focused }) => (
            <TabIcon source={scanIcon} focused={focused} label="Scan" />
          ),
        }}
      />

      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarIcon: ({ focused }) => (
            <TabIcon source={insightsIcon} focused={focused} label="Insights" />
          ),
        }}
      />

      <Tabs.Screen
        name="budget"
        options={{
          title: "Budget",
          tabBarIcon: ({ focused }) => (
            <TabIcon source={budgetIcon} focused={focused} label="Budget" />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ focused }) => (
            <TabIcon source={settingsIcon} focused={focused} label="Settings" />
          ),
        }}
      />

      <Tabs.Screen
        name="receipt"
        options={{
          title: "Receipts",
          tabBarIcon: ({ focused }) => (
            <TabIcon source={receiptsIcon} focused={focused} label="Receipt" />
          ),
        }}
      />

      <Tabs.Screen
        name="subscription"
        options={{
          title: "Subscriptions",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              source={subscriptionsIcon}
              focused={focused}
              label="Subscription"
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#050C14",
    borderTopColor: "rgba(255,255,255,0.08)",
    borderTopWidth: 1,
    height: Platform.OS === "ios" ? 86 : 72,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 18 : 10,
  },
  tabBarItem: {
    paddingVertical: 2,
  },
  iconWrap: {
    width: 72,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  iconShadowWrap: {
    borderRadius: 16,
    padding: 2,
  },
  iconShadowWrapFocused: {
    shadowColor: "#000000",
    shadowOpacity: 0.34,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  iconShadowWrapIdle: {
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  iconImage: {
    width: 32,
    height: 32,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  labelFocused: {
    color: "#FFFFFF",
  },
  labelIdle: {
    color: "rgba(255,255,255,0.72)",
  },
});