import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

const MINUTE_OPTIONS = [1, 2, 3, 5, 10, 15, 20, 30];
const INCREMENT_OPTIONS = [0, 1, 2, 3, 5, 10, 15, 30];

export default function CustomTime() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<any>();
  const { username } = route.params ?? { username: "" };
  const [minutes, setMinutes] = useState(5);
  const [increment, setIncrement] = useState(0);

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

  const handlePlay = () => {
    const time = increment > 0 ? `${minutes}+${increment}` : `${minutes} min`;
    navigation.navigate("HostGame", { mode: "Custom", time, username });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={12}>
        <MaterialIcons name="arrow-back" size={24} color="#1a1a1a" />
      </Pressable>

      <View style={styles.top}>
        <Text style={styles.label}>Game Mode</Text>
        <Text style={styles.title}>Custom</Text>
        <View style={styles.previewBadge}>
          <MaterialIcons name="timer" size={14} color="#69923e" />
          <Text style={styles.previewText}>
            {minutes} min{increment > 0 ? ` + ${increment}s` : ""}
          </Text>
        </View>
      </View>

      <Animated.View style={[styles.panel, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Minutes per side</Text>
          <View style={styles.chips}>
            {MINUTE_OPTIONS.map((m) => (
              <Pressable
                key={m}
                onPress={() => setMinutes(m)}
                style={[styles.chip, minutes === m && styles.chipActive]}
              >
                <Text style={[styles.chipText, minutes === m && styles.chipTextActive]}>{m}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Increment (seconds)</Text>
          <View style={styles.chips}>
            {INCREMENT_OPTIONS.map((s) => (
              <Pressable
                key={s}
                onPress={() => setIncrement(s)}
                style={[styles.chip, increment === s && styles.chipActive]}
              >
                <Text style={[styles.chipText, increment === s && styles.chipTextActive]}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.playBtn, { opacity: pressed ? 0.85 : 1 }]}
          onPress={handlePlay}
        >
          <Text style={styles.playBtnText}>Play Now</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#1e6b40" />
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
  title: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 40,
    color: "#2c2b29",
  },
  previewBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ddeacc",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  previewText: {
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
    gap: 24,
  },
  section: { gap: 12 },
  sectionLabel: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 15,
    color: "white",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  chipActive: {
    backgroundColor: "white",
  },
  chipText: {
    fontFamily: "GoogleSansFlex_500Medium",
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  chipTextActive: {
    color: "#69923e",
  },
  playBtn: {
    backgroundColor: "white",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: "auto",
  },
  playBtnText: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 16,
    color: "#69923e",
  },
});
