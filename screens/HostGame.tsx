import { View, Text, StyleSheet, Pressable, Animated, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalServer } from "../hooks/useLocalServer";
import ChessLANFooter from "../components/ChessLANFooter";
import IPConfigReminder from "../components/IPConfigReminder";
import { getDeviceIPv4, isHotspotActive, getDefaultHotspotIP } from "../utils/networkUtils";
import { getServerIP, getConnectionMode } from "../config";

export default function HostGame() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<any>();
  const { mode, time, username, variant = 'standard' } = route.params ?? {
    mode: "Rapid",
    time: "10 min",
    username: "",
    variant: "standard",
  };
  const [flipped, setFlipped] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [deviceIP, setDeviceIP] = useState<string | null>(null);
  const [configuredIP, setConfiguredIP] = useState<string | null>(null);
  const [ipLoading, setIpLoading] = useState(true);
  const [hotspotActive, setHotspotActive] = useState<boolean | null>(null);
  const [connectionMode, setConnectionModeState] = useState<'wifi' | 'hotspot'>('wifi');

  const localServer = useLocalServer();
  const { roomCode, guestUsername: opponentName, needsRestart, chess960Fen, startServer, stopServer, forceCleanup, updateColor, startGame: startLocalGame } = localServer;

  const slideAnim = useRef(new Animated.Value(80)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const initConnection = async () => {
      try {
        // Get connection mode
        const mode = await getConnectionMode();
        setConnectionModeState(mode);
        
        // Get device IP first
        setIpLoading(true);
        const ip = await getDeviceIPv4();
        setDeviceIP(ip);
        
        // Check if hotspot is active (for hotspot mode)
        if (mode === 'hotspot') {
          const isActive = await isHotspotActive();
          setHotspotActive(isActive);
        }
        
        setIpLoading(false);
        
        // Force cleanup any existing server before starting
        console.log('[HostGame] Initializing - cleaning up any existing server');
        forceCleanup();
        
        // Wait a bit, then start the server
        await new Promise(resolve => setTimeout(resolve, 500));
        
        startServer({ username, mode, time, variant });
        setConnectionError(null);
      } catch (error) {
        setConnectionError("Failed to start local server. Please try again.");
        console.error("Server start error:", error);
        setIpLoading(false);
      }
    };
    
    initConnection();
    
    return () => {
      console.log('[HostGame] Unmounting - stopping server');
      stopServer();
    };
  }, []);

  const handleRetry = () => {
    setConnectionError(null);
    try {
      startServer({ username, mode, time, variant });
    } catch (error) {
      setConnectionError("Failed to start local server. Please try again.");
      console.error("Server start error:", error);
    }
  };

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
    // If guest is present, notify them the room is closed
    if (opponentName) {
      localServer.sendMessage({ type: "room_closed" });
    }
    stopServer();
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 80, duration: 260, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => navigation.goBack());
  };

  const handleStart = () => {
    startLocalGame(flipped);
    console.log("[HostGame] Navigating to GameRoom with Chess960 FEN:", chess960Fen);
    navigation.navigate("GameRoom", {
      mode,
      time,
      username,
      flipped,
      variant,
      chess960Fen: chess960Fen,
      opponentUsername: opponentName,
      myColor: flipped ? "b" : "w",
      isHost: true,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color="#1a1a1a" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.label}>Hosting · {mode}</Text>
          <Text style={styles.title}>{username}'s Room</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Badges Row */}
      <View style={styles.badgesContainer}>
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

      <Animated.View
        style={[
          styles.panel,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
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
            {opponentName ?? "Waiting for opponent…"}
          </Text>
        </View>

        <View style={styles.vsRow}>
          <Text style={styles.vsText}>vs.</Text>
          <Pressable
            onPress={() => {
              const next = !flipped;
              setFlipped(next);
              if (opponentName) updateColor(next);
            }}
            style={styles.switchBtn}
            hitSlop={8}
          >
            <MaterialIcons name="swap-vert" size={22} color="white" />
          </Pressable>
        </View>

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

        {roomCode && (
          <View style={styles.codeBox}>
            <Text style={styles.shareHeader}>Share with your opponent:</Text>
            
            {/* Room Code */}
            <View style={styles.infoRow}>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Room Code</Text>
                <Text style={styles.infoValue}>{roomCode}</Text>
              </View>
            </View>

            {/* IP Address */}
            <View style={styles.infoRow}>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Your IP</Text>
                {ipLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : deviceIP ? (
                  <Text style={styles.infoValue}>{deviceIP}</Text>
                ) : (
                  <Text style={styles.ipError}>Unable to detect IP</Text>
                )}
              </View>
            </View>

            {/* Hotspot Warning for hotspot mode */}
            {!ipLoading && connectionMode === 'hotspot' && hotspotActive === false && (
              <View style={styles.hotspotWarningBox}>
                <MaterialIcons name="wifi-tethering-off" size={18} color="#fbbf24" />
                <Text style={styles.hotspotWarningText}>
                  Hotspot may be OFF. Current IP: {deviceIP || 'unknown'}.
                  {'\n'}Expected: {getDefaultHotspotIP()}
                </Text>
              </View>
            )}

            {/* Hotspot Active Confirmation */}
            {!ipLoading && connectionMode === 'hotspot' && hotspotActive === true && (
              <View style={styles.hotspotActiveBox}>
                <MaterialIcons name="check-circle" size={16} color="#10b981" />
                <Text style={styles.hotspotActiveText}>
                  Hotspot detected and active
                </Text>
              </View>
            )}

            {!opponentName && (
              <>
                <View style={styles.waitingRow}>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={styles.waitingText}>Waiting for opponent…</Text>
                </View>
                {/* IP Configuration Reminder */}
                <View style={styles.ipReminderWrapper}>
                  <IPConfigReminder variant="host" mode={connectionMode} />
                </View>
              </>
            )}
          </View>
        )}
        {connectionError && (
          <View style={styles.errorBox}>
            <MaterialIcons name="error-outline" size={24} color="#ff6b6b" />
            <Text style={styles.errorText}>{connectionError}</Text>
            <Pressable style={styles.retryBtn} onPress={handleRetry}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        )}
        {needsRestart && (
          <View style={styles.restartBox}>
            <MaterialIcons name="refresh" size={32} color="#ffa500" />
            <Text style={styles.restartTitle}>App Restart Required</Text>
            <Text style={styles.restartText}>
              The network port is stuck at the system level. Please close and reopen the app completely.
            </Text>
            <Text style={styles.restartHint}>
              (This happens after hot reloads in development)
            </Text>
          </View>
        )}
        {!roomCode && !connectionError && (
          <View style={styles.connectingBox}>
            <ActivityIndicator color="white" size="large" />
            <Text style={styles.connectingText}>Connecting to server…</Text>
          </View>
        )}
        {opponentName && (
          <Pressable style={styles.startBtn} onPress={handleStart}>
            <Text style={styles.startBtnText}>Start Game</Text>
          </Pressable>
        )}
      </Animated.View>
      
      <ChessLANFooter />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#ffffff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ebebeb",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    alignItems: "center",
    gap: 2,
  },
  headerSpacer: {
    width: 40,
  },
  label: {
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 12,
    color: "#888",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 18,
    color: "#2c2b29",
  },
  badgesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 16,
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
  panel: {
    flex: 1,
    backgroundColor: "#69923e",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 24,
    gap: 4,
  },
  playerBox: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  playerBoxLight: { backgroundColor: "white", borderRadius: 16 },
  playerBoxDark: { backgroundColor: "#4b4847", borderRadius: 16 },
  playerRole: {
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 11,
    marginBottom: 2,
  },
  playerRoleLight: { color: "rgba(26,26,26,0.5)" },
  playerRoleDark: { color: "rgba(255,255,255,0.5)" },
  playerName: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 16,
  },
  playerNameLight: { color: "#1a1a1a" },
  playerNameDark: { color: "white" },
  vsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 4,
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
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  startBtnText: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 16,
    color: "#69923e",
  },
  codeBox: {
    marginTop: "auto",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  shareHeader: {
    fontFamily: "GoogleSansFlex_500Medium",
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 4,
    alignSelf: "flex-start",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 12,
    width: "100%",
  },
  infoContent: {
    alignItems: "center",
  },
  infoLabel: {
    fontFamily: "GoogleSansFlex_500Medium",
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  infoValue: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 20,
    color: "white",
    letterSpacing: 2,
  },
  ipError: {
    fontFamily: "GoogleSansFlex_500Medium",
    fontSize: 13,
    color: "rgba(255,107,107,0.9)",
  },
  ipMismatchWarning: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(251, 191, 36, 0.15)",
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
  },
  ipMismatchText: {
    flex: 1,
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 15,
  },
  hotspotWarningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(251, 191, 36, 0.15)",
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.3)",
  },
  hotspotWarningText: {
    flex: 1,
    fontFamily: "GoogleSansFlex_500Medium",
    fontSize: 11,
    color: "rgba(255,255,255,0.95)",
    lineHeight: 15,
  },
  hotspotActiveBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderRadius: 10,
    padding: 8,
    justifyContent: "center",
  },
  hotspotActiveText: {
    fontFamily: "GoogleSansFlex_500Medium",
    fontSize: 11,
    color: "#10b981",
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
  errorBox: {
    marginTop: "auto",
    backgroundColor: "rgba(255,107,107,0.15)",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,107,107,0.3)",
  },
  errorText: {
    fontFamily: "GoogleSansFlex_500Medium",
    fontSize: 14,
    color: "#ff6b6b",
    textAlign: "center",
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: "#ff6b6b",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  retryBtnText: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 14,
    color: "white",
  },
  connectingBox: {
    marginTop: "auto",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 18,
    padding: 32,
    alignItems: "center",
    gap: 16,
  },
  connectingText: {
    fontFamily: "GoogleSansFlex_500Medium",
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  restartBox: {
    marginTop: "auto",
    backgroundColor: "rgba(255,165,0,0.15)",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    borderColor: "rgba(255,165,0,0.4)",
  },
  restartTitle: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 16,
    color: "#ffa500",
    textAlign: "center",
  },
  restartText: {
    fontFamily: "GoogleSansFlex_500Medium",
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 20,
  },
  restartHint: {
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    fontStyle: "italic",
  },
  ipReminderWrapper: {
    marginTop: 12,
    width: "100%",
    alignItems: "stretch",
  },
});
