import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import ChessLANFooter from "../components/ChessLANFooter";

export default function SelectMode() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<any>();
  const { mode, time, username } = route.params ?? { mode: "Rapid", time: "10 min", username: "" };
  const [variant, setVariant] = useState<"standard" | "chess960">("standard");

  const slideAnim = useRef(new Animated.Value(80)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 200 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleBack = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 80, duration: 260, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => navigation.goBack());
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Back button */}
      <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={12}>
        <MaterialIcons name="arrow-back" size={24} color="#1a1a1a" />
      </Pressable>

      {/* Top section */}
      <View style={styles.top}>
        <Text style={styles.label}>Game Mode</Text>
        <Text style={styles.modeName}>{mode}</Text>
        <View style={styles.timeBadge}>
          <MaterialIcons name="timer" size={14} color="#69923e" />
          <Text style={styles.timeText}>{time} per side</Text>
        </View>
      </View>

      {/* Buttons */}
      <Animated.View
        style={[styles.panel, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <Text style={styles.panelTitle}>Configure your game</Text>
        <Text style={styles.panelSubtitle}>
          Choose variant and start hosting
        </Text>

        {/* Variant Selection */}
        <View style={styles.variantSection}>
          <Text style={styles.variantLabel}>Game Variant</Text>
          <View style={styles.variantButtons}>
            <Pressable
              style={[
                styles.variantBtn,
                variant === "standard" && styles.variantBtnActive,
              ]}
              onPress={() => setVariant("standard")}
            >
              <MaterialIcons 
                name="extension" 
                size={20} 
                color={variant === "standard" ? "#69923e" : "rgba(255,255,255,0.7)"} 
              />
              <Text
                style={[
                  styles.variantBtnText,
                  variant === "standard" && styles.variantBtnTextActive,
                ]}
              >
                Standard
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.variantBtn,
                variant === "chess960" && styles.variantBtnActive,
              ]}
              onPress={() => setVariant("chess960")}
            >
              <MaterialIcons 
                name="shuffle" 
                size={20} 
                color={variant === "chess960" ? "#69923e" : "rgba(255,255,255,0.7)"} 
              />
              <Text
                style={[
                  styles.variantBtnText,
                  variant === "chess960" && styles.variantBtnTextActive,
                ]}
              >
                Chess960
              </Text>
            </Pressable>
          </View>
          {variant === "chess960" && (
            <Text style={styles.variantDescription}>
              Fischer Random Chess: pieces on the back rank are randomized
            </Text>
          )}
        </View>

        <Pressable
          style={({ pressed }) => [styles.hostGameBtn, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => navigation.navigate(mode === "Custom" ? "CustomTime" : "HostGame", { mode, time, username, variant })}
        >
          <MaterialIcons name="wifi-tethering" size={24} color="#69923e" />
          <Text style={styles.hostGameBtnText}>Start Hosting</Text>
          <MaterialIcons name="chevron-right" size={22} color="#69923e" />
        </Pressable>

        <View style={styles.infoBox}>
          <MaterialIcons name="info-outline" size={18} color="#ddeacc" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Before you start:</Text>
            <Text style={styles.infoText}>
              • Configure server IP in Home → Settings{'\n'}
              • Share the room code with your opponent{'\n'}
              • Your opponent will match these settings
            </Text>
          </View>
        </View>
      </Animated.View>
      
      <ChessLANFooter />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#ffffff" },
  backBtn: {
    marginLeft: 20,
    marginTop: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ebebeb",
    alignItems: "center",
    justifyContent: "center",
  },
  top: {
    flex: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 8,
  },
  label: {
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 13,
    color: "#888",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  modeName: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 40,
    color: "#2c2b29",
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ddeacc",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  timeText: {
    fontFamily: "GoogleSansFlex_500Medium",
    fontSize: 13,
    color: "#69923e",
  },
  panel: {
    flex: 1,
    backgroundColor: "#69923e",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 48,
    gap: 14,
  },
  panelTitle: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 18,
    color: "white",
    marginBottom: 6,
  },
  panelSubtitle: {
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 20,
    lineHeight: 20,
  },
  variantSection: {
    marginBottom: 20,
  },
  variantLabel: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 10,
  },
  variantButtons: {
    flexDirection: "row",
    gap: 10,
  },
  variantBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "transparent",
  },
  variantBtnActive: {
    backgroundColor: "white",
    borderColor: "white",
  },
  variantBtnText: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  variantBtnTextActive: {
    color: "#69923e",
  },
  variantDescription: {
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginTop: 8,
    lineHeight: 16,
  },
  hostGameBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "white",
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  hostGameBtnText: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 16,
    color: "#69923e",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    padding: 14,
    marginTop: "auto",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  infoTextContainer: {
    flex: 1,
    gap: 4,
  },
  infoTitle: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 13,
    color: "#ddeacc",
  },
  infoText: {
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 17,
  },
});
