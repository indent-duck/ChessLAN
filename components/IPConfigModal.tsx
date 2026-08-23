import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import {
  validateIPFormat,
  getConnectionStatusText,
  getDefaultHotspotIP,
} from "../utils/networkUtils";

interface IPConfigModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (ip: string) => void;
  currentIP: string | null;
  mode: "wifi" | "hotspot";
}

export default function IPConfigModal({
  visible,
  onClose,
  onSave,
  currentIP,
  mode,
}: IPConfigModalProps) {
  const [ipInput, setIpInput] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const slideAnim = useState(new Animated.Value(0))[0];
  const successAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (visible) {
      setIpInput(currentIP || "");

      // Slide up animation
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleSave = () => {
    if (!validateIPFormat(ipInput)) {
      return;
    }

    onSave(ipInput);

    // Show success animation
    setShowSuccess(true);
    Animated.sequence([
      Animated.timing(successAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(300),
      Animated.timing(successAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSuccess(false);
      setTimeout(onClose, 100);
    });
  };

  const isValid = validateIPFormat(ipInput);
  const hasLastSaved = currentIP && currentIP !== ipInput;

  const slideTranslate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Animated.View
              style={[
                styles.modal,
                {
                  transform: [{ translateY: slideTranslate }],
                },
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Configure Host IP</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Content */}
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.description}>
                  {mode === "hotspot"
                    ? "Enter the host's hotspot IP address\n(Host should turn ON their hotspot first)"
                    : "Enter the host's IP address\n(Get this from the host device)"}
                </Text>

                <Text style={styles.label}>Host's IP Address</Text>
                <TextInput
                  style={[
                    styles.input,
                    !isValid && ipInput.length > 0 && styles.inputError,
                  ]}
                  value={ipInput}
                  onChangeText={setIpInput}
                  placeholder="192.168.1.100"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                {!isValid && ipInput.length > 0 && (
                  <Text style={styles.errorText}>Invalid IP format</Text>
                )}

                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>Format: xxx.xxx.xxx.xxx</Text>
                  <Text style={styles.infoExample}>Example: 192.168.1.100</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    !isValid && styles.saveButtonDisabled,
                  ]}
                  onPress={handleSave}
                  disabled={!isValid}
                >
                  <Text
                    style={[
                      styles.saveButtonText,
                      !isValid && styles.saveButtonTextDisabled,
                    ]}
                  >
                    Save IP
                  </Text>
                </TouchableOpacity>

                {hasLastSaved && (
                  <View style={styles.lastSavedBox}>
                    <Text style={styles.lastSavedLabel}>
                      Last saved: {currentIP}
                    </Text>
                    <TouchableOpacity onPress={() => setIpInput(currentIP)}>
                      <Text style={styles.restoreText}>Tap to restore</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>

              {/* Success Overlay */}
              {showSuccess && (
                <Animated.View
                  style={[
                    styles.successOverlay,
                    {
                      opacity: successAnim,
                    },
                  ]}
                >
                  <View style={styles.successBox}>
                    <Text style={styles.successIcon}>✓</Text>
                    <Text style={styles.successText}>IP Saved!</Text>
                  </View>
                </Animated.View>
              )}
            </Animated.View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  keyboardView: {
    minHeight: "75%",
  },
  modal: {
    backgroundColor: "#69923e",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    minHeight: "75%",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: "GoogleSansFlex_700Bold",
    color: "white",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 20,
    color: "white",
    fontWeight: "600",
  },
  scrollView: {
    flexGrow: 1,
  },
  content: {
    padding: 24,
    paddingTop: 20,
    paddingBottom: 60,
    minHeight: 600,
  },
  description: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 32,
    textAlign: "center",
    fontFamily: "GoogleSansFlex_400Regular",
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: "GoogleSansFlex_700Bold",
    color: "white",
    marginBottom: 12,
    marginTop: 8,
  },
  input: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 18,
    fontSize: 16,
    fontFamily: "GoogleSansFlex_500Medium",
    borderWidth: 0,
    color: "#2c2b29",
  },
  inputError: {
    borderWidth: 2,
    borderColor: "#ef4444",
  },
  errorText: {
    color: "#fee",
    fontSize: 12,
    marginTop: 8,
    fontFamily: "GoogleSansFlex_500Medium",
    marginLeft: 4,
  },
  infoBox: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  infoText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    fontFamily: "GoogleSansFlex_400Regular",
  },
  infoExample: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    fontFamily: "GoogleSansFlex_500Medium",
    marginTop: 6,
  },
  hotspotHintBox: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  hotspotHintTitle: {
    fontSize: 14,
    color: "white",
    fontFamily: "GoogleSansFlex_700Bold",
    marginBottom: 8,
  },
  hotspotHintText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    fontFamily: "GoogleSansFlex_400Regular",
    lineHeight: 20,
    marginBottom: 12,
  },
  quickSetButton: {
    backgroundColor: "white",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  quickSetText: {
    fontSize: 13,
    color: "#69923e",
    fontFamily: "GoogleSansFlex_700Bold",
  },
  saveButton: {
    backgroundColor: "white",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.3)",
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: "#69923e",
    fontSize: 16,
    fontFamily: "GoogleSansFlex_700Bold",
  },
  saveButtonTextDisabled: {
    color: "rgba(255,255,255,0.5)",
  },
  lastSavedBox: {
    marginTop: 20,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  lastSavedLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    fontFamily: "GoogleSansFlex_400Regular",
  },
  restoreText: {
    fontSize: 13,
    color: "white",
    fontFamily: "GoogleSansFlex_700Bold",
    marginTop: 6,
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(105, 146, 62, 0.98)",
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  successBox: {
    alignItems: "center",
  },
  successIcon: {
    fontSize: 72,
    color: "white",
    marginBottom: 12,
  },
  successText: {
    fontSize: 20,
    color: "white",
    fontFamily: "GoogleSansFlex_700Bold",
  },
});
