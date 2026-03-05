// app.config.ts
import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "client",
  slug: "client",
  version: "1.0.0",
  scheme: "receiptai-pro",
  platforms: ["ios", "android", "web"],
  plugins: ["expo-router"],

  // ✅ FIX: do NOT use webpack with your current dependency set
  web: { bundler: "metro", favicon: "./assets/favicon.png" },

  extra: {
    router: { root: "app" },
  },
};

export default config;