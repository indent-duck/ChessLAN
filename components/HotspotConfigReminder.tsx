import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface HotspotConfigReminderProps {
  variant: "host" | "guest";
}

export default function HotspotConfigReminder({
  variant,
}: HotspotConfigReminderProps) {
  return (
    <View style={styles.reminderBox}>
      <MaterialIcons name="info-outline" size={16} color="#69923e" />
      <View style={styles.reminderContent}>
        <Text style={styles.reminderTitle}>Important Reminder</Text>
        {variant === "host" ? (
          <Text style={styles.reminderText}>
            • You should be connected to your opponent's Hotspot befoe hosting a
            game
            {"\n"}• Share your IP address and room code with your opponent
          </Text>
        ) : (
          <Text style={styles.reminderText}>
            • Make sure that your hotspot is turned on and that your opponent is
            connected to it{"\n"}• Ask the host for their IP address{"\n"}• Use
            "Configure Host IP" button to set it
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
