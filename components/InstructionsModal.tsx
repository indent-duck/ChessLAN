import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

type RoleType = "host" | "guest";

interface InstructionsModalProps {
  visible: boolean;
  onClose: () => void;
  mode: "hotspot" | "wifi";
}

export default function InstructionsModal({
  visible,
  onClose,
  mode,
}: InstructionsModalProps) {
  const [selectedRole, setSelectedRole] = useState<RoleType>("host");

  const hostSteps =
    mode === "hotspot"
      ? [
          "Turn on your phone's mobile hotspot",
          "Share network name and password with your opponent",
          "Select a game mode and tap \"Host Game\"",
          "On the host screen, share the room code shown with your opponent and wait for them to join",
        ]
      : [
          "Make sure both devices are connected to the same WiFi network",
          "Select a game mode and tap \"Host Game\"",
          "Share the room code with your opponent",
          "Wait for your opponent to join",
        ];

  const guestSteps =
    mode === "hotspot"
      ? [
          "Connect to the host's mobile hotspot",
          "Tap \"Configure Host IP\" and enter the host's IP address",
          "Tap \"Join with Room Code\"",
          "Enter the room code provided by the host",
        ]
      : [
          "Connect to the same WiFi network as the host",
          "Tap \"Configure Host IP\" and enter the host's IP address",
          "Tap \"Join with Room Code\"",
          "Enter the room code provided by the host",
        ];

  const steps = selectedRole === "host" ? hostSteps : guestSteps;
  const icon = selectedRole === "host" ? "wifi-tethering" : "login";

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={styles.instructionsModal}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.instructionsHeader}>
            <Text style={styles.instructionsTitle}>How to use</Text>
          </View>
          <View style={styles.instructionsDivider} />

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <Pressable
              style={[
                styles.tab,
                selectedRole === "host" && styles.tabActive,
              ]}
              onPress={() => setSelectedRole("host")}
            >
              <MaterialIcons
                name="wifi-tethering"
                size={20}
                color={selectedRole === "host" ? "white" : "#69923e"}
              />
              <Text
                style={[
                  styles.tabText,
                  selectedRole === "host" && styles.tabTextActive,
                ]}
              >
                Host
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.tab,
                selectedRole === "guest" && styles.tabActive,
              ]}
              onPress={() => setSelectedRole("guest")}
            >
              <MaterialIcons
                name="login"
                size={20}
                color={selectedRole === "guest" ? "white" : "#69923e"}
              />
              <Text
                style={[
                  styles.tabText,
                  selectedRole === "guest" && styles.tabTextActive,
                ]}
              >
                Guest
              </Text>
            </Pressable>
          </View>

          {/* Instructions Content */}
          <View style={styles.instructionsContent}>
            <View style={styles.roleContainer}>
              <View style={styles.roleTitleRow}>
                <View style={styles.instructionIconWrapper}>
                  <MaterialIcons name={icon} size={22} color="#69923e" />
                </View>
                <Text style={styles.instructionRole}>
                  {selectedRole === "host" ? "Host" : "Guest"} Instructions
                </Text>
              </View>
              <View style={styles.roleSteps}>
                {steps.map((step, index) => (
                  <View key={index} style={styles.stepItem}>
                    <View style={styles.stepNumberCircle}>
                      <Text style={styles.stepNumber}>{index + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Close Button */}
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Got it</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  instructionsModal: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    marginHorizontal: 32,
    paddingVertical: 28,
    paddingHorizontal: 24,
    width: "85%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  instructionsHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  instructionsTitle: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 22,
    color: "#2c2b29",
  },
  instructionsDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "#e0e0e0",
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#f0f9ff",
    borderWidth: 2,
    borderColor: "transparent",
  },
  tabActive: {
    backgroundColor: "#69923e",
    borderColor: "#69923e",
  },
  tabText: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 15,
    color: "#69923e",
  },
  tabTextActive: {
    color: "white",
  },
  instructionsContent: {
    marginBottom: 24,
  },
  roleContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  roleTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  instructionIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f9ff",
    alignItems: "center",
    justifyContent: "center",
  },
  instructionRole: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 17,
    color: "#2c2b29",
  },
  roleSteps: {
    gap: 14,
  },
  stepItem: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  stepNumberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#69923e",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepNumber: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 12,
    color: "white",
  },
  stepText: {
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 21,
    flex: 1,
  },
  closeButton: {
    backgroundColor: "#69923e",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  closeButtonText: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 15,
    color: "white",
  },
});
