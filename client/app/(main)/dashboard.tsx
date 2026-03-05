import { View, Text, StyleSheet, Image } from "react-native";

export default function Dashboard() {
  return (
    <View style={styles.page}>
      <View style={styles.container}>
        <Text style={styles.title}>ReceiptAI Pro</Text>

        <View style={styles.scanCard}>
          <Text style={styles.scanTitle}>📷 Scan Receipt</Text>
          <Text style={styles.scanSubtitle}>
            Snap & Categorize Instantly
          </Text>
        </View>

        <Text style={styles.section}>Recent Scans</Text>

        <Image
          source={{ uri: "https://images.unsplash.com/photo-1556742031-c6961e8560b0" }}
          style={styles.image}
        />

        <View style={styles.row}>
          <Text>🍏 Groceries</Text>
          <Text>$142.30</Text>
        </View>

        <View style={styles.row}>
          <Text>🍔 Dining Out</Text>
          <Text>$68.75</Text>
        </View>

        <View style={styles.row}>
          <Text>🚗 Transport</Text>
          <Text>$34.10</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#0b2b36",
    alignItems: "center",
  },

  container: {
    width: "100%",
    maxWidth: 420,   // THIS fixes desktop stretching
    padding: 20,
  },

  title: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },

  scanCard: {
    backgroundColor: "#213a46",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },

  scanTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },

  scanSubtitle: {
    color: "#a0b4be",
  },

  section: {
    color: "white",
    marginBottom: 10,
    fontWeight: "600",
  },

  image: {
    width: "100%",
    height: 140,
    borderRadius: 12,
    marginBottom: 20,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#1c3944",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
});