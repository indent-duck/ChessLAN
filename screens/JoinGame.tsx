import { View, Text, StyleSheet, Pressable, Animated, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";

export default function JoinGame() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { mode, time } = route.params ?? { mode: "Rapid", time: "10 min" };
  const [code, setCode] = useState("");

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
      <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={12}>
        <MaterialIcons name="arrow-back" size={24} color="#1a1a1a" />
      </Pressable>

      <View style={styles.top}>
        <Text style={styles.label}>Joining · {mode}</Text>
        <Text style={styles.title}>Join Room</Text>
        <View style={styles.timeBadge}>
          <MaterialIcons name="timer" size={14} color="#1e6b40" />
          <Text style={styles.timeText}>{time} per side</Text>
        </View>
      </View>

      <Animated.View style={[styles.panel, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.panelTitle}>Enter room code</Text>
        <Text style={styles.panelSub}>Ask your opponent for their 6-character code</Text>

        <TextInput
          style={styles.input}
          value={code}
          onChangeText={(v) => setCode(v.toUpperCase().slice(0, 6))}
          placeholder="A1B2C3"
          placeholderTextColor="rgba(255,255,255,0.3)"
          autoCapitalize="characters"
          maxLength={6}
        />

        <Pressable
          style={({ pressed }) => [styles.joinBtn, { opacity: pressed || code.length < 6 ? 0.6 : 1 }]}
          disabled={code.length < 6}
          onPress={() => console.log("join", code)}
        >
          <Text style={styles.joinBtnText}>Join Game</Text>
          <MaterialIcons name="arrow-forward" size={20} color="white" />
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f5f0" },
  backBtn: {
    marginLeft: 20,
    marginTop: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e8e8e3",
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
    color: "#1a1a1a",
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#e0f0e8",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  timeText: {
    fontFamily: "GoogleSansFlex_500Medium",
    fontSize: 13,
    color: "#1e6b40",
  },
  panel: {
    flex: 1,
    backgroundColor: "#1e6b40",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 48,
    gap: 6,
  },
  panelTitle: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 20,
    color: "white",
  },
  panelSub: {
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 24,
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 32,
    color: "white",
    letterSpacing: 10,
    textAlign: "center",
  },
  joinBtn: {
    backgroundColor: "white",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  joinBtnText: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 16,
    color: "#1e6b40",
  },
});
