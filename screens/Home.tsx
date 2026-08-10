import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  FlatList,
  Animated,
  TextInput,
  Pressable,
  Modal,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRef, useState, useCallback, useEffect } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import Rook from "../assets/svg/rookProfile.svg";
import Rapid from "../assets/svg/rapid.svg";
import Card from "../components/GameCard";
import King from "../assets/svg/king.svg";
import Queen from "../assets/svg/queen.svg";
import Chessboard from "../assets/svg/chessboard.svg";
import { getServerUrl, setServerUrl } from "../config";
import ChessLANFooter from "../components/ChessLANFooter";

const CARD_WIDTH = 260;
const CARD_GAP = 16;

const gameModes = [
  { id: "rapid", icon: Rapid, title: "Rapid", time: "10 min" },
  { id: "blitz", icon: King, title: "Blitz", time: "5 min" },
  { id: "bullet", icon: Queen, title: "Bullet", time: "1 min" },
  { id: "custom", icon: Chessboard, title: "Custom", time: "custom time" },
];

export default function Home() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { width } = useWindowDimensions();
  const iconSize = width * 0.11;
  const snapInterval = CARD_WIDTH + CARD_GAP;
  const [activeIndex, setActiveIndex] = useState(0);
  const scaleAnims = useRef(
    gameModes.map((_, i) => new Animated.Value(i === 0 ? 1 : 0.88)),
  ).current;
  const opacityAnims = useRef(
    gameModes.map((_, i) => new Animated.Value(i === 0 ? 1 : 0.5)),
  ).current;
  const [username, setUsername] = useState("username");
  const [editing, setEditing] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [aboutVisible, setAboutVisible] = useState(false);
  const [serverUrl, setServerUrlState] = useState("");
  const [tempServerUrl, setTempServerUrl] = useState("");

  useEffect(() => {
    AsyncStorage.getItem("Player").then((val) => {
      if (val) setUsername(val);
    });
    getServerUrl().then((url) => {
      setServerUrlState(url);
      setTempServerUrl(url);
    });
  }, []);
  const inputRef = useRef<TextInput>(null);
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 });
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      setActiveIndex(newIndex);
      gameModes.forEach((_, i) => {
        Animated.spring(scaleAnims[i], {
          toValue: i === newIndex ? 1 : 0.88,
          useNativeDriver: true,
          damping: 12,
          stiffness: 180,
        }).start();
        Animated.spring(opacityAnims[i], {
          toValue: i === newIndex ? 1 : 0.5,
          useNativeDriver: true,
          damping: 12,
          stiffness: 180,
        }).start();
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setEditing(false);
    }, []),
  );

  const startEditing = () => {
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSaveServerUrl = async () => {
    if (!tempServerUrl.trim()) {
      Alert.alert("Invalid URL", "Server URL cannot be empty");
      return;
    }
    if (
      !tempServerUrl.startsWith("ws://") &&
      !tempServerUrl.startsWith("wss://")
    ) {
      Alert.alert("Invalid URL", "Server URL must start with ws:// or wss://");
      return;
    }
    await setServerUrl(tempServerUrl);
    setServerUrlState(tempServerUrl);
    setSettingsVisible(false);
    Alert.alert(
      "Success",
      "Server URL updated. New connections will use this address.",
    );
  };

  const handleCancelSettings = () => {
    setTempServerUrl(serverUrl);
    setSettingsVisible(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Rook width={iconSize} height={iconSize} />
          </View>
          <View style={styles.userInfo}>
            <View style={styles.usernameRow}>
              {editing ? (
                <TextInput
                  ref={inputRef}
                  style={styles.usernameInput}
                  value={username}
                  onChangeText={setUsername}
                  onSubmitEditing={() => {
                    AsyncStorage.setItem("username", username);
                    setEditing(false);
                  }}
                  returnKeyType="done"
                />
              ) : (
                <Text style={styles.username}>{username}</Text>
              )}
              <Pressable
                onPress={
                  editing
                    ? () => {
                        AsyncStorage.setItem("username", username);
                        setEditing(false);
                      }
                    : startEditing
                }
                hitSlop={8}
              >
                <MaterialIcons
                  name={editing ? "check" : "edit"}
                  size={16}
                  color={editing ? "#69923e" : "#777"}
                />
              </Pressable>
            </View>
          </View>
          <Pressable
            onPress={() => setAboutVisible(true)}
            style={styles.aboutBtn}
            hitSlop={8}
          >
            <MaterialIcons name="info-outline" size={22} color="#777" />
          </Pressable>
          <Pressable
            onPress={() => setSettingsVisible(true)}
            style={styles.settingsBtn}
            hitSlop={8}
          >
            <MaterialIcons name="settings" size={22} color="#777" />
          </Pressable>
        </View>

        {/* Middle area */}
        <View style={styles.heroArea}>
          <Text style={styles.heroTitle}>ChessLAN ♟</Text>
          <Text style={styles.heroSubtitle}>Ready for a match?</Text>
        </View>
      </View>

      {/* Play panel */}
      <View style={styles.startGameContainer}>
        <View style={styles.selectHeader}>
          <Text style={styles.selectHeaderText}>Select Game Mode</Text>
          <Text style={styles.selectHeaderSub}>
            {gameModes[activeIndex].time} per side
          </Text>
        </View>

        {/* Carousel and Host Button grouped together */}
        <View style={styles.carouselHostGroup}>
          <View style={{ overflow: "visible" }}>
            <FlatList
              data={gameModes}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={snapInterval}
              decelerationRate="fast"
              contentContainerStyle={{
                paddingHorizontal: (width - CARD_WIDTH) / 2 - CARD_GAP / 2,
                paddingVertical: 12,
                gap: CARD_GAP,
              }}
              renderItem={({ item, index }) => (
                <Animated.View
                  style={{
                    transform: [{ scale: scaleAnims[index] }],
                    opacity: opacityAnims[index],
                  }}
                >
                  <Card
                    icon={item.icon}
                    title={item.title}
                    time={item.time}
                    username={username}
                  />
                </Animated.View>
              )}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig.current}
            />
            {/* Dot indicators */}
            <View style={styles.dots}>
              {gameModes.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === activeIndex && styles.dotActive]}
                />
              ))}
            </View>
          </View>

          {/* Host Button inside the group */}
          <Pressable
            style={({ pressed }) => [
              styles.hostBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => {
              const selectedMode = gameModes[activeIndex];
              if (selectedMode.id === "custom") {
                // For custom, go to CustomTime screen for configuration
                navigation.navigate("CustomTime", { username });
              } else {
                // For standard modes, go directly to HostGame with standard variant
                navigation.navigate("HostGame", {
                  mode: selectedMode.title,
                  time: selectedMode.time,
                  username,
                  variant: "standard",
                });
              }
            }}
          >
            <View style={styles.actionBtnContent}>
              <MaterialIcons name="wifi-tethering" size={20} color="white" />
              <Text style={styles.hostBtnText}>
                Host {gameModes[activeIndex].title} Game
              </Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={20}
              color="rgba(255,255,255,0.8)"
            />
          </Pressable>
        </View>

        {/* Join Button - separate from carousel */}
        <Pressable
          style={({ pressed }) => [
            styles.joinBtn,
            { opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={() => navigation.navigate("JoinGame", { username })}
        >
          <View style={styles.actionBtnContent}>
            <MaterialIcons name="login" size={20} color="#69923e" />
            <Text style={styles.joinBtnText}>Join with Room Code</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color="#69923e" />
        </Pressable>
      </View>

      <ChessLANFooter />

      {/* Settings Modal */}
      <Modal visible={settingsVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Server Settings</Text>
              <Pressable onPress={handleCancelSettings} hitSlop={8}>
                <MaterialIcons name="close" size={24} color="#2c2b29" />
              </Pressable>
            </View>
            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.settingsLabel}>WebSocket Server URL</Text>
              <Text style={styles.settingsHint}>
                Enter your server's IP address and port
              </Text>
              <TextInput
                style={styles.serverInput}
                value={tempServerUrl}
                onChangeText={setTempServerUrl}
                placeholder="ws://192.168.x.x:3001"
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />

              <View style={styles.instructionsBox}>
                <View style={styles.instructionHeader}>
                  <MaterialIcons
                    name="info-outline"
                    size={18}
                    color="#69923e"
                  />
                  <Text style={styles.instructionTitle}>
                    Where to find the IP
                  </Text>
                </View>
                <View style={styles.instructionSteps}>
                  <Text style={styles.instructionStep}>
                    <Text style={styles.instructionStepBold}>Ask the host</Text>{" "}
                    for their server IP address
                  </Text>
                  <Text style={styles.instructionStep}>
                    <Text style={styles.instructionStepBold}>
                      Host can find it:
                    </Text>
                    {"\n"}
                    Settings → Wi-Fi → Tap your network{"\n"}
                    Look for "IP Address" (192.168.x.x)
                  </Text>
                  <Text style={styles.instructionStep}>
                    <Text style={styles.instructionStepBold}>Format:</Text>{" "}
                    ws://[IP]:3001{"\n"}
                    Example: ws://192.168.1.100:3001
                  </Text>
                </View>
                <View style={styles.instructionNote}>
                  <Text style={styles.instructionNoteText}>
                    Both players must be on the same WiFi
                  </Text>
                </View>
              </View>

              <View style={styles.settingsBtns}>
                <Pressable
                  style={styles.cancelBtn}
                  onPress={handleCancelSettings}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.saveBtn} onPress={handleSaveServerUrl}>
                  <Text style={styles.saveBtnText}>Save</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* About Modal */}
      <Modal visible={aboutVisible} transparent animationType="fade">
        <Pressable
          style={styles.aboutModalOverlay}
          onPress={() => setAboutVisible(false)}
        >
          <Pressable
            style={styles.aboutModalBox}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.aboutHeader}>
              <MaterialIcons name="info" size={48} color="#69923e" />
            </View>
            <Text style={styles.aboutTitle}>ChessLAN</Text>
            <Text style={styles.aboutVersion}>Version 1.0.0</Text>
            <View style={styles.aboutDivider} />
            <Text style={styles.aboutLabel}>Created by</Text>
            <Text style={styles.aboutCreator}>Lee Johnrich H. Ramirez</Text>
            <Text style={styles.aboutProgram}>
              BS in Information Technology{"\n"}
              Cavite State University - Main
            </Text>
            <Text style={styles.aboutDescription}>
              Play chess anytime, anywhere with friends over local WiFi.
            </Text>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#ddeacc",
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  username: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 16,
    color: "#2c2b29",
  },
  usernameInput: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 16,
    color: "#2c2b29",
    borderBottomWidth: 1.5,
    borderBottomColor: "#69923e",
    paddingVertical: 0,
    minWidth: 80,
  },
  heroArea: {
    flex: 1,
    justifyContent: "center",
  },
  heroTitle: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 28,
    color: "#2c2b29",
  },
  heroSubtitle: {
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 15,
    color: "#666",
    marginTop: 4,
  },
  startGameContainer: {
    backgroundColor: "#69923e",
    marginTop: "auto",
    paddingTop: 20,
    paddingBottom: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    minHeight: "62%",
  },
  selectHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    marginBottom: 8,
  },
  selectHeaderText: {
    color: "white",
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 20,
  },
  selectHeaderSub: {
    color: "rgba(255,255,255,0.6)",
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 13,
    marginTop: 2,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  dotActive: {
    width: 20,
    backgroundColor: "white",
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f0",
    alignItems: "center",
    justifyContent: "center",
  },
  aboutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f0",
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    height: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 20,
    color: "#2c2b29",
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },
  settingsLabel: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 14,
    color: "#2c2b29",
    marginBottom: 4,
  },
  settingsHint: {
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  serverInput: {
    fontFamily: "GoogleSansFlex_500Medium",
    fontSize: 15,
    color: "#2c2b29",
    backgroundColor: "#f5f5f0",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  settingsBtns: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#e0e0e0",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelBtnText: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 15,
    color: "#666",
  },
  saveBtn: {
    flex: 1,
    backgroundColor: "#69923e",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBtnText: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 15,
    color: "#ffffff",
  },
  instructionsBox: {
    backgroundColor: "#f5f5f0",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    gap: 12,
  },
  instructionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  instructionTitle: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 14,
    color: "#2c2b29",
  },
  instructionSteps: {
    gap: 10,
  },
  instructionStep: {
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 13,
    color: "#444",
    lineHeight: 18,
  },
  instructionStepBold: {
    fontFamily: "GoogleSansFlex_700Bold",
    color: "#2c2b29",
  },
  instructionNote: {
    backgroundColor: "#ddeacc",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  instructionNoteText: {
    fontFamily: "GoogleSansFlex_500Medium",
    fontSize: 12,
    color: "#69923e",
    lineHeight: 17,
  },
  aboutModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  aboutModalBox: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    marginHorizontal: 32,
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  aboutHeader: {
    marginBottom: 16,
  },
  aboutTitle: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 26,
    color: "#2c2b29",
    marginBottom: 4,
  },
  aboutVersion: {
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  aboutDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "#e0e0e0",
    marginBottom: 20,
  },
  aboutLabel: {
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  aboutCreator: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 20,
    color: "#69923e",
    marginBottom: 8,
  },
  aboutProgram: {
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 18,
  },
  aboutDescription: {
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 4,
  },
  carouselHostGroup: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    paddingTop: 8,
    paddingBottom: 16,
    marginHorizontal: 12,
    marginBottom: 12,
  },
  hostBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 8,
  },
  joinBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    marginHorizontal: 20,
  },
  actionBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  hostBtnText: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 15,
    color: "white",
  },
  joinBtnText: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 15,
    color: "#69923e",
  },
});
