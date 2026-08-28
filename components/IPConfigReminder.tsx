import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface IPConfigReminderProps {
  variant: "host" | "guest";
  mode?: "wifi" | "hotspot";
}

export default function IPConfigReminder({ variant, mode = "wifi" }: IPConfigReminderProps) {
  return (
    <View style={styles.reminderBox}>
      <MaterialIcons name="info-outline" size={16} color="#69923e" />
      <View style={styles.reminderContent}>
        <Text style={styles.reminderTitle}>Network Configuration Required</Text>
        {variant === "host" ? (
          <Text style={styles.reminderText}>
            • Find your device IP in WiFi/Hotspot settings{'\n'}
            • Share your IP and room code with your opponent{'\n'}
            {mode === "hotspot"
              ? "• Guest must connect to your hotspot network"
              : "• Both devices must be on the same network"}
          </Text>
        ) : (
          <Text style={styles.reminderText}>
            • Ask the host for their IP address{'\n'}
            • Use "Configure Host IP" button to set it{'\n'}
            • Enter only IP (e.g., 192.168.1.100), not full URL
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  reminderBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#f0f4ec",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(105,146,62,0.15)",
  },
  reminderContent: {
    flex: 1,
    gap: 4,
  },
  reminderTitle: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 12,
    color: "#69923e",
  },
  reminderText: {
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 11,
    color: "#2c2b29",
    lineHeight: 16,
  },
});
