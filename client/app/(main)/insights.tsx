// File: client/app/(main)/insights.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, G, Path, Polyline, Line } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useSessionStore } from "../../src/store/session";
import {
  getRecentReceipts,
  ReceiptCategory,
} from "../../src/lib/firebase/receipts";

const COLORS = {
  bgTop: "#0A1520",
  bgBottom: "#071019",
  card: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.10)",
  text: "#FFFFFF",
  sub: "rgba(255,255,255,0.68)",
  green: "#00E676",
};

const CATEGORY_COLORS: Record<ReceiptCategory, string> = {
  Groceries: "#00E676",
  "Dining Out": "#FF8A3D",
  Transport: "#4DA3FF",
  Utilities: "#9B6BFF",
  Shopping: "#FFC857",
  Other: "#8E9AAF",
};

function toNumber(v: any) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function InsightsScreen() {
  const user = useSessionStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [receipts, setReceipts] = useState<any[]>([]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        if (!user?.uid) {
          setReceipts([]);
          setLoading(false);
          return;
        }

        setLoading(true);
        const rows = await getRecentReceipts(user.uid, 30);
        if (!alive) return;
        setReceipts(rows);
      } catch (err) {
        if (!alive) return;
        setReceipts([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [user?.uid]);

  const totalsByCategory = useMemo(() => {
    const map: Record<ReceiptCategory, number> = {
      Groceries: 0,
      "Dining Out": 0,
      Transport: 0,
      Utilities: 0,
      Shopping: 0,
      Other: 0,
    };

    for (const r of receipts) {
      const category = (r.category || "Other") as ReceiptCategory;
      map[category] += toNumber(r.total);
    }

    return map;
  }, [receipts]);

  const totalSpend = useMemo(() => {
    return Object.values(totalsByCategory).reduce((a, b) => a + b, 0);
  }, [totalsByCategory]);

  const biggestCategory = useMemo(() => {
    const entries = Object.entries(totalsByCategory) as [ReceiptCategory, number][];
    return entries.sort((a, b) => b[1] - a[1])[0] || ["Other", 0];
  }, [totalsByCategory]);

  const donutData = useMemo(() => {
    const entries = (Object.entries(totalsByCategory) as [ReceiptCategory, number][])
      .filter(([, value]) => value > 0)
      .map(([label, value]) => ({
        label,
        value,
        color: CATEGORY_COLORS[label],
      }));

    return entries.length
      ? entries
      : [{ label: "No data", value: 1, color: "rgba(255,255,255,0.18)" }];
  }, [totalsByCategory]);

  const lineData = useMemo(() => {
    const rows = receipts.slice(0, 10).reverse();
    const values = rows.map((r) => toNumber(r.total));
    return values.length ? values : [0];
  }, [receipts]);

  return (
    <LinearGradient colors={[COLORS.bgTop, COLORS.bgBottom]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <Text style={styles.title}>Insights</Text>
          <Text style={styles.subtitle}>Live totals from your saved receipts</Text>

          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Total Spend</Text>
              <Ionicons name="analytics-outline" size={18} color={COLORS.green} />
            </View>

            {loading ? (
              <View style={styles.loaderWrap}>
                <ActivityIndicator />
              </View>
            ) : (
              <>
                <Text style={styles.bigMoney}>${totalSpend.toFixed(2)}</Text>
                <Text style={styles.miniNote}>
                  Biggest category: {biggestCategory[0]} (${biggestCategory[1].toFixed(2)})
                </Text>
              </>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Spending by Category</Text>

            <View style={styles.chartWrap}>
              <DonutChart
                data={donutData}
                size={220}
                strokeWidth={38}
                centerTop="Total"
                centerBottom={`$${totalSpend.toFixed(0)}`}
              />
            </View>

            <View style={styles.legendWrap}>
              {donutData.map((item) => {
                const pct = totalSpend > 0 ? ((item.value / totalSpend) * 100).toFixed(0) : "0";

                return (
                  <View key={item.label} style={styles.legendRow}>
                    <View style={styles.legendLeft}>
                      <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                      <Text style={styles.legendLabel}>{item.label}</Text>
                    </View>

                    <View style={styles.legendRight}>
                      <Text style={styles.legendAmount}>${item.value.toFixed(2)}</Text>
                      <Text style={styles.legendPercent}>{pct}%</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Totals Trend</Text>

            <View style={styles.chartWrap}>
              <MiniLineChart data={lineData} width={330} height={180} />
            </View>

            <Text style={styles.miniNote}>
              This updates from your saved receipts instead of placeholder values.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>AI Summary</Text>

            <View style={styles.aiBox}>
              <Ionicons name="sparkles" size={18} color={COLORS.green} />
              <Text style={styles.aiText}>
                You spent <Text style={styles.bold}>${totalSpend.toFixed(2)}</Text> this month.
                Your top category is <Text style={styles.bold}>{biggestCategory[0]}</Text>. As
                more receipts are scanned and saved, this summary becomes more accurate
                automatically.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function DonutChart({
  data,
  size,
  strokeWidth,
  centerTop,
  centerBottom,
}: {
  data: { label: string; value: number; color: string }[];
  size: number;
  strokeWidth: number;
  centerTop: string;
  centerBottom: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const total = data.reduce((sum, item) => sum + item.value, 0);

  let startAngle = -90;

  const arcs = data.map((slice) => {
    const angle = total > 0 ? (slice.value / total) * 360 : 0.0001;
    const path = describeArc(center, center, radius, startAngle, startAngle + angle);
    const out = { ...slice, path };
    startAngle += angle;
    return out;
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G>
          {arcs.map((arc) => (
            <Path
              key={arc.label}
              d={arc.path}
              stroke={arc.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
            />
          ))}
          <Circle
            cx={center}
            cy={center}
            r={radius - strokeWidth / 2 + 2}
            fill="#0B1723"
          />
        </G>
      </Svg>

      <View style={styles.chartCenter}>
        <Text style={styles.chartCenterTop}>{centerTop}</Text>
        <Text style={styles.chartCenterBottom}>{centerBottom}</Text>
      </View>
    </View>
  );
}

function MiniLineChart({
  data,
  width,
  height,
}: {
  data: number[];
  width: number;
  height: number;
}) {
  const padding = 18;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const maxValue = Math.max(...data, 1);
  const minValue = Math.min(...data, 0);
  const range = Math.max(maxValue - minValue, 1);

  const points = data
    .map((value, index) => {
      const x = padding + (index / Math.max(data.length - 1, 1)) * innerWidth;
      const y = padding + innerHeight - ((value - minValue) / range) * innerHeight;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <Svg width={width} height={height}>
      <Line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      <Line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      <Polyline
        points={points}
        fill="none"
        stroke="#00E676"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {data.map((value, index) => {
        const x = padding + (index / Math.max(data.length - 1, 1)) * innerWidth;
        const y = padding + innerHeight - ((value - minValue) / range) * innerHeight;
        return <Circle key={`${index}-${value}`} cx={x} cy={y} r="4" fill="#00E676" />;
      })}
    </Svg>
  );
}

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(" ");
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  container: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "web" ? 18 : 54,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    color: COLORS.sub,
    marginTop: 4,
    marginBottom: 16,
  },
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  loaderWrap: {
    paddingVertical: 18,
  },
  bigMoney: {
    color: COLORS.text,
    fontSize: 34,
    fontWeight: "900",
    marginTop: 10,
  },
  miniNote: {
    color: COLORS.sub,
    marginTop: 8,
    fontSize: 12,
  },
  chartWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  chartCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "50%",
    marginTop: -18,
    alignItems: "center",
    justifyContent: "center",
  },
  chartCenterTop: {
    color: COLORS.sub,
    fontSize: 12,
    fontWeight: "700",
  },
  chartCenterBottom: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 2,
  },
  legendWrap: {
    gap: 10,
    marginTop: 16,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  legendLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  legendRight: {
    alignItems: "flex-end",
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 13,
  },
  legendAmount: {
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 13,
  },
  legendPercent: {
    color: COLORS.sub,
    fontSize: 11,
    marginTop: 2,
  },
  aiBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(0,230,118,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,230,118,0.15)",
    borderRadius: 14,
    padding: 12,
  },
  aiText: {
    color: COLORS.sub,
    lineHeight: 21,
    flex: 1,
  },
  bold: {
    color: COLORS.text,
    fontWeight: "800",
  },
});