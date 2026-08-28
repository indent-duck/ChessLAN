import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import ChessLANFooter from "../components/ChessLANFooter";
import IPConfigModal from "../components/IPConfigModal";
import {
  isConnectedToWireless,
  getDeviceIPv4,
  getDefaultHotspotIP,
} from "../utils/networkUtils";
import { getServerIP, setServerIP } from "../config";

type Action = "host" | "join";

interface HotspotPrepParams {
  username: string;
  action: Action;
  mode?: string;
  time?: string;
  variant?: string;
  isCustom?: boolean;
}

export default function HotspotPrep() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<any>();
  const {
    username,
    action,
    mode,
    time,
    variant = "standard",
    isCustom = false,
  } = (route.params ?? {}) as HotspotPrepParams;

  const [isChecking, setIsChecking] = useState(true);
  const [connectedToWireless, setConnectedToWireless] = useState<boolean | null>(null);
  const [deviceIP, setDeviceIP] = useState<string | null>(null);
  const [hostIP, setHostIP] = useState<string | null>(null);
  const [configModalVisible, setConfigModalVisible] = useState(false);

  const slideAnim = useRef(new Animated.Value(80)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showMode = action === "host" && isCustom;

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

  const runCheck = async () => {
    setIsChecking(true);
    try {
      const ip = await getDeviceIPv4();
      setDeviceIP(ip);

      if (action === "host") {
        // Host flow does not gate on hotspot status; just show the device IP.
      } else {
        const connected = await isConnectedToWireless();
        setConnectedToWireless(connected);
        const storedIP = await getServerIP("hotspot");
        setHostIP(storedIP);
      }
    } catch (error) {
      console.error("[HotspotPrep] Error checking network:", error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    runCheck();
    // Refresh checks whenever the screen regains focus
    const unsubscribe = navigation.addListener("focus", () => {
      runCheck();
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);

  const handleSaveIP = async (ip: string) => {
    await setServerIP(ip, "hotspot");
    setHostIP(ip);
  };

  const handleQuickSet = () => {
    const defaultIP = getDefaultHotspotIP();
    setHostIP(defaultIP);
    setServerIP(defaultIP, "hotspot");
  };

  const gatedJoin =
    action === "join" && (connectedToWireless !== true || !hostIP);

  const handleContinue = () => {
    if (action === "host") {
      if (isCustom) {
        navigation.navigate("CustomTime", { username });
      } else {
        navigation.navigate("HostGame", { mode, time, username, variant });
      }
    } else {
      navigation.navigate("JoinGame", { username });
    }
  };

  const label = showMode
    ? "Host Game"
    : action === "host"
    ? `Host ${mode ?? ""} Game`
    : "Continue to Join";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color="#1a1a1a" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.label}>
            {action === "host" ? "Hotspot Host Setup" : "Hotspot Join Setup"}
          </Text>
          <Text style={styles.title}>
            {action === "host" ? "Prepare your hotspot" : "Connect before joining"}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <Animated.View
        style={[
          styles.panel,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {isChecking && action !== "host" ? (
          <View style={styles.centeredBox}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.centeredText}>Checking hotspot setup…</Text>
          </View>
        ) : action === "host" ? (
          <View style={styles.content}>
            {/* Device IP info */}
            <View style={styles.infoRow}>
              <MaterialIcons name="info-outline" size={18} color="#69923e" />
              <Text style={styles.infoText}>
                Your device IP: {deviceIP || "unknown"}
                {"\n"}Expected gateway: {getDefaultHotspotIP()}
              </Text>
            </View>

            <View style={styles.hintBox}>
              <MaterialIcons name="lightbulb-outline" size={18} color="#f59e0b" />
              <Text style={styles.hintText}>
                Make sure your hotspot is turned on so guests can connect to your
                network when you start hosting.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.content}>
            {/* Connection status */}
            {connectedToWireless === true ? (
              <View style={styles.statusOk}>
                <MaterialIcons name="check-circle" size={24} color="#0f9d58" />
                <Text style={styles.statusOkText}>Connected to the host's network ✓</Text>
                <Text style={styles.statusOkSub}>
                  You're connected to a wireless network. Enter the host's hotspot IP
                  below to continue.
                </Text>
              </View>
            ) : (
              <View style={styles.statusWarn}>
                <MaterialIcons name="wifi-off" size={24} color="#dc2626" />
                <Text style={styles.statusWarnText}>
                  Connect to the host's hotspot first
                </Text>
                <Text style={styles.statusWarnSub}>
                  Connect this phone to the host's hotspot network, then return here.
                  This screen re-checks automatically.
                </Text>
              </View>
            )}

            {/* Host IP status + config */}
            {hostIP ? (
              <View style={styles.ipStatusConfigured}>
                <MaterialIcons name="check-circle" size={16} color="#0f9d58" />
                <Text style={styles.ipStatusText}>Host's IP: {hostIP}</Text>
              </View>
            ) : (
              <View style={styles.ipStatusWarning}>
                <MaterialIcons name="warning" size={16} color="#f59e0b" />
                <Text style={styles.ipStatusWarningText}>
                  No host IP configured yet
                </Text>
              </View>
            )}

            {/* Quick-set default host IP */}
            {!hostIP && (
              <Pressable style={styles.quickSetBtn} onPress={handleQuickSet}>
                <View style={styles.actionBtnContent}>
                  <MaterialIcons name="bolt" size={18} color="#69923e" />
                  <Text style={styles.quickSetText}>
                    Quick-set expected IP: {getDefaultHotspotIP()}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={18} color="#69923e" />
              </Pressable>
            )}

            {/* Configure IP Button */}
            <Pressable
              style={({ pressed }) => [
                styles.configBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => setConfigModalVisible(true)}
            >
              <View style={styles.actionBtnContent}>
                <MaterialIcons name="settings" size={20} color="#1e6b40" />
                <Text style={styles.configBtnText}>Configure Host IP</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#1e6b40" />
            </Pressable>

            <View style={styles.hintBox}>
              <MaterialIcons name="lightbulb-outline" size={18} color="#f59e0b" />
              <Text style={styles.hintText}>
                Ask the host for their hotspot gateway IP (usually {getDefaultHotspotIP()}).
              </Text>
            </View>
          </View>
        )}

        {/* Continue button */}
        {action !== "host" && isChecking ? null : (
          <Pressable
            style={({ pressed }) => [
              styles.continueBtn,
              gatedJoin && styles.continueBtnDisabled,
              { opacity: pressed ? 0.9 : 1 },
            ]}
            onPress={handleContinue}
            disabled={gatedJoin}
          >
            <Text
              style={[
                styles.continueBtnText,
                gatedJoin && styles.continueBtnTextDisabled,
              ]}
            >
              {label}
            </Text>
            <MaterialIcons
              name="chevron-right"
              size={20}
              color={gatedJoin ? "#999" : "#69923e"}
            />
          </Pressable>
        )}
      </Animated.View>

      <ChessLANFooter version="1.0.2" />

      {/* IP Config Modal */}
      <IPConfigModal
        visible={configModalVisible}
        onClose={() => setConfigModalVisible(false)}
        onSave={handleSaveIP}
        currentIP={hostIP}
        mode="hotspot"
      />
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
    fontSize: 16,
    color: "#2c2b29",
  },
  panel: {
    flex: 1,
    backgroundColor: "#69923e",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 24,
  },
  centeredBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  centeredText: {
    fontFamily: "GoogleSansFlex_500Medium",
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
  },
  content: {
    gap: 16,
  },
  statusOk: {
    backgroundColor: "rgba(15, 157, 88, 0.2)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(15, 157, 88, 0.4)",
  },
  statusOkText: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 16,
    color: "#ffffff",
    textAlign: "center",
  },
  statusOkSub: {
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    lineHeight: 17,
  },
  statusWarn: {
    backgroundColor: "rgba(220, 38, 38, 0.2)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.4)",
  },
  statusWarnText: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 16,
    color: "#ffffff",
    textAlign: "center",
  },
  statusWarnSub: {
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    lineHeight: 17,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    padding: 14,
  },
  infoText: {
    flex: 1,
    fontFamily: "GoogleSansFlex_500Medium",
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 17,
  },
  hintBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(245, 158, 11, 0.18)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  hintText: {
    flex: 1,
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 17,
  },
  ipStatusConfigured: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    backgroundColor: "rgba(15, 157, 88, 0.18)",
    borderRadius: 12,
    paddingVertical: 10,
  },
  ipStatusText: {
    fontFamily: "GoogleSansFlex_600SemiBold",
    fontSize: 13,
    color: "#ffffff",
  },
  ipStatusWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    backgroundColor: "rgba(245, 158, 11, 0.18)",
    borderRadius: 12,
    paddingVertical: 10,
  },
  ipStatusWarningText: {
    fontFamily: "GoogleSansFlex_600SemiBold",
    fontSize: 13,
    color: "#fbbf24",
  },
  quickSetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
  },
  quickSetText: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 12,
    color: "#69923e",
  },
  configBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
  },
  configBtnText: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 15,
    color: "#1e6b40",
  },
  actionBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  continueBtn: {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "white",
    borderRadius: 18,
    paddingVertical: 16,
  },
  continueBtnDisabled: {
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  continueBtnText: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 16,
    color: "#69923e",
  },
  continueBtnTextDisabled: {
    color: "#999",
  },
});
