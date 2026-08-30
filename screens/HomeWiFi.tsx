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
import { getServerIP, setServerIP, setConnectionMode } from "../config";
import ChessLANFooter from "../components/ChessLANFooter";
import IPConfigModal from "../components/IPConfigModal";
import InstructionsModal from "../components/InstructionsModal";

const CARD_WIDTH = 260;
const CARD_GAP = 16;

const gameModes = [
  { id: "rapid", icon: Rapid, title: "Rapid", time: "10 min" },
  { id: "blitz", icon: King, title: "Blitz", time: "5 min" },
  { id: "bullet", icon: Queen, title: "Bullet", time: "1 min" },
  { id: "custom", icon: Chessboard, title: "Custom", time: "custom time" },
];

export default function HomeWiFi() {
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
  const [aboutVisible, setAboutVisible] = useState(false);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [instructionsVisible, setInstructionsVisible] = useState(false);
  const [hostIP, setHostIP] = useState<string | null>(null);

  useEffect(() => {
    // Set connection mode to WiFi when this screen loads
    setConnectionMode('wifi');
    
    AsyncStorage.getItem("Player").then((val) => {
      if (val) setUsername(val);
    });
    loadHostIP();
  }, []);

  const loadHostIP = async () => {
    const ip = await getServerIP('wifi');
    setHostIP(ip);
  };

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
      loadHostIP();
    }, []),
  );

  const startEditing = () => {
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSaveIP = async (ip: string) => {
    await setServerIP(ip, 'wifi');
    setHostIP(ip);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable onPress={handleBack} style={styles.backButton} hitSlop={8}>
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </Pressable>
          
          {/* Centered Mode Banner */}
          <View style={styles.modeBanner}>
            <MaterialIcons name="wifi" size={20} color="#69923e" />
            <Text style={styles.modeBannerText}>WiFi Network Mode</Text>
          </View>
          
          {/* Info Button */}
          <Pressable onPress={() => setInstructionsVisible(true)} style={styles.infoButton} hitSlop={8}>
            <MaterialIcons name="info-outline" size={24} color="#69923e" />
          </Pressable>
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
                navigation.navigate("CustomTime", { username });
              } else {
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

        {/* Guest Section */}
        <View style={styles.guestSection}>
          {/* IP Status */}
          {hostIP ? (
            <View style={styles.ipStatusConfigured}>
              <MaterialIcons name="check-circle" size={16} color="#10b981" />
              <Text style={styles.ipStatusText}>Current: {hostIP}</Text>
            </View>
          ) : (
            <View style={styles.ipStatusWarning}>
              <MaterialIcons name="warning" size={16} color="#f59e0b" />
              <Text style={styles.ipStatusWarningText}>Configure IP before joining</Text>
            </View>
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

          {/* Join Button */}
          <Pressable
            style={({ pressed }) => [
              styles.joinBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => navigation.navigate("JoinGame", { username })}
          >
            <View style={styles.actionBtnContent}>
              <MaterialIcons name="login" size={20} color="#1e6b40" />
              <Text style={styles.joinBtnText}>Join with Room Code</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="#1e6b40" />
          </Pressable>
        </View>
      </View>

      <ChessLANFooter version="2.0.2" />

      {/* Instructions Modal */}
      <InstructionsModal
        visible={instructionsVisible}
        onClose={() => setInstructionsVisible(false)}
        mode="wifi"
      />

      {/* IP Config Modal */}
      <IPConfigModal
        visible={configModalVisible}
        onClose={() => setConfigModalVisible(false)}
        onSave={handleSaveIP}
        currentIP={hostIP}
        mode="wifi"
      />

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
              <MaterialIcons name="info" size={48} color="#1e6b40" />
            </View>
            <Text style={styles.aboutTitle}>ChessLAN</Text>
            <Text style={styles.aboutVersion}>Version 2.0.2</Text>
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f0",
    alignItems: "center",
    justifyContent: "center",
  },
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f9ff",
    alignItems: "center",
    justifyContent: "center",
  },
  headerSpacer: {
    width: 40,
  },
  modeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f0f9ff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  modeBannerText: {
    fontFamily: "GoogleSansFlex_500Medium",
    fontSize: 14,
    color: "#69923e",
  },
  startGameContainer: {
    backgroundColor: "#69923e",
    flex: 1,
    paddingTop: 24,
    paddingBottom: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
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
    color: "#1e6b40",
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
  hostBtnText: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 15,
    color: "white",
  },
  guestSection: {
    paddingHorizontal: 20,
    gap: 12,
  },
  ipStatusConfigured: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
  },
  ipStatusText: {
    fontFamily: "GoogleSansFlex_500Medium",
    fontSize: 13,
    color: "#10b981",
  },
  ipStatusWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  ipStatusWarningText: {
    fontFamily: "GoogleSansFlex_500Medium",
    fontSize: 13,
    color: "#f59e0b",
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
  joinBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
  },
  actionBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  joinBtnText: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 15,
    color: "#1e6b40",
  },
});
