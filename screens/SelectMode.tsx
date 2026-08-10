import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useRef } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

export default function SelectMode() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<any>();
  const { mode, time, username } = route.params ?? { mode: "Rapid", time: "10 min", username: "" };

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
        <Text style={styles.panelTitle}>How do you want to play?</Text>

        <Pressable
          style={({ pressed }) => [styles.optionBtn, styles.hostBtn, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => navigation.navigate(mode === "Custom" ? "CustomTime" : "HostGame", { mode, time, username })}
        >
          <MaterialIcons name="wifi-tethering" size={28} color="white" />
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Host Game</Text>
            <Text style={styles.optionSub}>Create a room and invite a friend</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color="rgba(255,255,255,0.6)" />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.optionBtn, styles.joinBtn, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => navigation.navigate("JoinGame", { mode, time, username })}
        >
          <MaterialIcons name="login" size={28} color="#69923e" />
          <View style={styles.optionText}>
            <Text style={[styles.optionTitle, { color: "#69923e" }]}>Join Game</Text>
            <Text style={[styles.optionSub, { color: "#555" }]}>Enter a room code to join</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color="#aaa" />
        </Pressable>
      </Animated.View>
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
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    padding: 18,
    gap: 14,
  },
  hostBtn: { backgroundColor: "rgba(255,255,255,0.15)" },
  joinBtn: { backgroundColor: "white" },
  optionText: { flex: 1 },
  optionTitle: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 16,
    color: "white",
  },
  optionSub: {
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },
});
