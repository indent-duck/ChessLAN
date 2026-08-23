import { View, Text, StyleSheet } from "react-native";

interface ChessLANFooterProps {
  version?: string;
}

export default function ChessLANFooter({ version = "1.0.2" }: ChessLANFooterProps) {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>ChessLAN v{version}</Text>
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
