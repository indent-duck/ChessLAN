import { View, Text, StyleSheet } from "react-native";

export default function ChessLANFooter() {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>ChessLAN v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    alignItems: "center",
    paddingVertical: 10,
    paddingBottom: 28,
    backgroundColor: "#69923e",
  },
  footerText: {
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
  },
});
