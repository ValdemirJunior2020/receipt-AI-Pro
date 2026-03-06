import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "client",
  slug: "client",
  version: "1.0.0",
  scheme: "receiptai-pro",
  platforms: ["ios", "android", "web"],
  plugins: ["expo-router"],
  web: { bundler: "metro", favicon: "./assets/favicon.png" },
  icon: "./assets/icon.png",
  extra: {
    router: { root: "app" },
  },
};

export default config;