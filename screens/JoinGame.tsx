import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { sendMsg, addListener } from "../hooks/useSocket";

export default function JoinGame() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<any>();
  const { username } = route.params ?? { username: "" };
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [hostUsername, setHostUsername] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [mode, setMode] = useState<string>("Rapid");
  const [time, setTime] = useState<string>("10 min");
  const [variant, setVariant] = useState<string>("standard");
  const [chess960Fen, setChess960Fen] = useState<string | null>(null);

  // Use refs to track the latest mode and time values for use in the listener
  const modeRef = useRef<string>("Rapid");
  const timeRef = useRef<string>("10 min");
  const hostUsernameRef = useRef<string | null>(null);
  const variantRef = useRef<string>("standard");
  const chess960FenRef = useRef<string | null>(null);

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
    // Only close socket if we haven't joined yet or send a leave message
    if (joined) {
      sendMsg({ type: "leave" });
    }
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

  const handleJoin = () => {
    setError(null);
    sendMsg({ type: "join", code, username });
    const remove = addListener((msg) => {
      console.log("[JoinGame] Received message:", msg);
      if (msg.type === "joined") {
        const receivedMode = msg.mode || "Rapid";
        const receivedTime = msg.time || "10 min";
        const receivedHostUsername = msg.hostUsername;
        const receivedVariant = msg.variant || "standard";
        const receivedChess960Fen = msg.chess960Fen || null;
        
        // Update state for display
        setHostUsername(receivedHostUsername);
        setMode(receivedMode);
        setTime(receivedTime);
        setVariant(receivedVariant);
        setChess960Fen(receivedChess960Fen);
        
        // Update refs for use in game_start
        modeRef.current = receivedMode;
        timeRef.current = receivedTime;
        hostUsernameRef.current = receivedHostUsername;
        variantRef.current = receivedVariant;
        chess960FenRef.current = receivedChess960Fen;
        
        setJoined(true);
      } else if (msg.type === "color_update") {
        console.log("[JoinGame] Setting flipped to:", msg.flipped);
        setFlipped(msg.flipped);
      } else if (msg.type === "game_start") {
        remove();
        const guestColor = msg.flipped ? "w" : "b";
        navigation.navigate("GameRoom", {
          mode: modeRef.current,
          time: timeRef.current,
          username,
          flipped: !msg.flipped,
          opponentUsername: hostUsernameRef.current,
          myColor: guestColor,
          variant: variantRef.current,
          chess960Fen: msg.chess960Fen || chess960FenRef.current,
        });
      } else if (msg.type === "error") {
        remove();
        setError(msg.message);
      } else if (msg.type === "room_cancelled") {
        remove();
        setJoined(false);
        setError("The host cancelled the room.");
      }
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={12}>
        <MaterialIcons name="arrow-back" size={24} color="#1a1a1a" />
      </Pressable>

      <View style={styles.top}>
        <Text style={styles.label}>Joining · {mode}</Text>
        <Text style={styles.title}>{joined && hostUsername ? `${hostUsername}'s Room` : "Join Room"}</Text>
        <View style={styles.badgeRow}>
          {variant === 'chess960' && (
            <View style={styles.variantBadge}>
              <MaterialIcons name="shuffle" size={14} color="#7b5a3a" />
              <Text style={styles.variantText}>Chess960</Text>
            </View>
          )}
          <View style={styles.timeBadge}>
            <MaterialIcons name="timer" size={14} color="#69923e" />
            <Text style={styles.timeText}>{time} per side</Text>
          </View>
        </View>
      </View>

      <Animated.View
        style={[
          styles.panel,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {joined ? (
          <>
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
                {hostUsername}
              </Text>
            </View>
            <View style={styles.vsRow}>
              <Text style={styles.vsText}>vs.</Text>
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
                {username}
              </Text>
            </View>
            <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>Room Code</Text>
              <Text style={styles.codeText}>{code}</Text>
              <View style={styles.waitingRow}>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.waitingText}>
                  Waiting for host to start…
                </Text>
              </View>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.panelTitle}>Enter room code</Text>
            <Text style={styles.panelSub}>
              Ask your opponent for their 4-character code
            </Text>
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={(v) => setCode(v.toUpperCase().slice(0, 4))}
              placeholder="A1B2"
              placeholderTextColor="rgba(255,255,255,0.3)"
              autoCapitalize="characters"
              maxLength={4}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
            <Pressable
              style={({ pressed }) => [
                styles.joinBtn,
                { opacity: pressed || code.length < 4 ? 0.6 : 1 },
              ]}
              disabled={code.length < 4}
              onPress={handleJoin}
            >
              <Text style={styles.joinBtnText}>Join Game</Text>
            </Pressable>
          </>
        )}
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
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  variantBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f5e6d3",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  variantText: {
    fontFamily: "GoogleSansFlex_500Medium",
    fontSize: 13,
    color: "#7b5a3a",
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
    color: "#69923e",
  },
  errorText: {
    fontFamily: "GoogleSansFlex_500Medium",
    fontSize: 13,
    color: "#ffcccc",
    textAlign: "center",
  },
  playerBox: {
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 28,
    alignItems: "center",
  },
  playerBoxLight: { backgroundColor: "white" },
  playerBoxDark: { backgroundColor: "#4b4847" },
  playerRole: {
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 12,
    marginBottom: 4,
  },
  playerRoleLight: { color: "rgba(26,26,26,0.5)" },
  playerRoleDark: { color: "rgba(255,255,255,0.5)" },
  playerName: { fontFamily: "GoogleSansFlex_700Bold", fontSize: 20 },
  playerNameLight: { color: "#1a1a1a" },
  playerNameDark: { color: "white" },
  vsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  vsText: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 18,
    color: "rgba(255,255,255,0.7)",
  },
  codeBox: {
    marginTop: "auto",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  codeLabel: {
    fontFamily: "GoogleSansFlex_500Medium",
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  codeText: {
    fontFamily: "ArchivoBlack_400Regular",
    fontSize: 38,
    color: "white",
    letterSpacing: 8,
  },
  waitingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  waitingText: {
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
});
