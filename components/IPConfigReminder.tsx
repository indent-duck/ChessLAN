import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface IPConfigReminderProps {
  variant: "host" | "guest";
}

export default function IPConfigReminder({ variant }: IPConfigReminderProps) {
  return (
    <View style={styles.reminderBox}>
      <MaterialIcons name="info-outline" size={16} color="#69923e" />
      <View style={styles.reminderContent}>
        <Text style={styles.reminderTitle}>Network Configuration Required</Text>
        {variant === "host" ? (
          <Text style={styles.reminderText}>
            • Configure your IP in Settings (Home screen){'\n'}
            • Find your IP in WiFi settings (192.168.x.x){'\n'}
            • Share your IP with your opponent
          </Text>
        ) : (
          <Text style={styles.reminderText}>
            • Ask the host for their IP address{'\n'}
            • Configure it in Settings (Home screen){'\n'}
            • Format: ws://[IP]:3001 (e.g., ws://192.168.1.100:3001)
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
