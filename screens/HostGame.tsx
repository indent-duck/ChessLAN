import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";

export default function HostGame() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<any>();
  const { mode, time, username } = route.params ?? {
    mode: "Rapid",
    time: "10 min",
    username: "",
  };
  const [flipped, setFlipped] = useState(false);

  const slideAnim = useRef(new Animated.Value(80)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 200,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleBack = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 80,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => navigation.goBack());
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={12}>
        <MaterialIcons name="arrow-back" size={24} color="#1a1a1a" />
      </Pressable>

      <View style={styles.top}>
        <Text style={styles.label}>Hosting · {mode}</Text>
        <Text style={styles.title}>{username}'s Room</Text>
        <View style={styles.timeBadge}>
          <MaterialIcons name="timer" size={14} color="#1e6b40" />
          <Text style={styles.timeText}>{time} per side</Text>
        </View>
      </View>

      <Animated.View
        style={[
          styles.panel,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View
          style={[
            styles.playerBox,
            flipped ? styles.playerBoxDark : styles.playerBoxLight,
          ]}
        >
          <Text
            style={[
              styles.playerRole,
              flipped ? styles.playerRoleDark : styles.playerRoleLight,
            ]}
          >
            Playing as {flipped ? "Black" : "White"}
          </Text>
          <Text
            style={[
              styles.playerName,
              flipped ? styles.playerNameDark : styles.playerNameLight,
            ]}
          >
            {username}
          </Text>
        </View>

        <View style={styles.vsRow}>
          <Text style={styles.vsText}>vs.</Text>
          <Pressable
            onPress={() => setFlipped((f) => !f)}
            style={styles.switchBtn}
            hitSlop={8}
          >
            <MaterialIcons name="swap-vert" size={22} color="white" />
          </Pressable>
        </View>

        <View
          style={[
            styles.playerBox,
            flipped ? styles.playerBoxLight : styles.playerBoxDark,
          ]}
        >
          <Text
            style={[
              styles.playerRole,
              flipped ? styles.playerRoleLight : styles.playerRoleDark,
            ]}
          >
            Playing as {flipped ? "White" : "Black"}
          </Text>
          <Text
            style={[
              styles.playerName,
              flipped ? styles.playerNameLight : styles.playerNameDark,
            ]}
          >
            Opponent
          </Text>
        </View>

        <Pressable style={styles.startBtn} onPress={() => navigation.navigate("GameRoom", { mode, time, username, flipped })}>
          <Text style={styles.startBtnText}>Start Game</Text>
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
    fontSize: 30,
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
  playerBox: {
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 28,
    alignItems: "center",
  },
  playerBoxLight: { backgroundColor: "white" },
  playerBoxDark: { backgroundColor: "#1a1a1a" },
  playerRole: {
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 12,
    marginBottom: 4,
  },
  playerRoleLight: { color: "rgba(26,26,26,0.5)" },
  playerRoleDark: { color: "rgba(255,255,255,0.5)" },
  playerName: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 20,
  },
  playerNameLight: { color: "#1a1a1a" },
  playerNameDark: { color: "white" },
  vsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 8,
  },
  vsText: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 18,
    color: "rgba(255,255,255,0.7)",
  },
  switchBtn: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
  },
  startBtn: {
    marginTop: "auto",
    backgroundColor: "white",
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
  },
  startBtnText: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 16,
    color: "#1e6b40",
  },
});
