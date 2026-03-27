// File: client/app.config.ts
import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "ReceiptAI Pro",
  slug: "client",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "receiptai-pro",
  icon: "./assets/icon.png",
  userInterfaceStyle: "dark",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#071019",
  },
  assetBundlePatterns: ["**/*"],
  platforms: ["ios", "android", "web"],

  plugins: [
    "expo-router",
    "expo-localization",
    "expo-secure-store",
    "expo-web-browser",
  ],

  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.infojr.83.receiptaipro",
    buildNumber: "3",
    infoPlist: {
      NSCameraUsageDescription:
        "ReceiptAI Pro uses your camera to scan receipts and analyze your expenses.",
      ITSAppUsesNonExemptEncryption: false,
    },
  },

  android: {
    package: "com.infojr.83.receiptaipro",
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#071019",
    },
  },

  web: {
    bundler: "metro",
    favicon: "./assets/icon.png",
  },

  extra: {
    router: {
      root: "app",
    },
    eas: {
      projectId: "20c3535a-98e6-4b4d-b578-7c329635e8c6",
    },
  },
};

export default config;