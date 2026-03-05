import dotenv from "dotenv";

export function loadEnv() {
  dotenv.config();
}

export function getInt(name: string, fallback: number) {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
