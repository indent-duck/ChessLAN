import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  FlatList,
  Animated,
  TextInput,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRef, useState, useCallback } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import Rook from "../assets/svg/rookProfile.svg";
import Rapid from "../assets/svg/rapid.svg";
import Card from "../components/GameCard";
import King from "../assets/svg/king.svg";
import Queen from "../assets/svg/queen.svg";
import Chessboard from "../assets/svg/chessboard.svg";

const CARD_WIDTH = 260;
const CARD_GAP = 16;

const gameModes = [
  { id: "rapid", icon: Rapid, title: "Rapid", time: "10 min" },
  { id: "blitz", icon: King, title: "Blitz", time: "5 min" },
  { id: "bullet", icon: Queen, title: "Bullet", time: "1 min" },
  { id: "custom", icon: Chessboard, title: "Custom", time: "custom time" },
];

export default function Home() {
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

  const startEditing = () => {
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
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
                  onSubmitEditing={() => setEditing(false)}
                  returnKeyType="done"
                />
              ) : (
                <Text style={styles.username}>{username}</Text>
              )}
              <Pressable
                onPress={editing ? () => setEditing(false) : startEditing}
                hitSlop={8}
              >
                <MaterialIcons
                  name={editing ? "check" : "edit"}
                  size={16}
                  color={editing ? "#1e6b40" : "#777"}
                />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Middle area */}
        <View style={styles.heroArea}>
          <Text style={styles.heroTitle}>Checkmate ♟</Text>
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
        <View style={{ overflow: "visible" }}>
          <FlatList
            data={gameModes}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={snapInterval}
            decelerationRate="fast"
            contentContainerStyle={{
              paddingHorizontal: (width - CARD_WIDTH) / 2,
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
                <Card icon={item.icon} title={item.title} time={item.time} username={username} />
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
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Chess Dwight v1.0.0</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f5f5f0",
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
    backgroundColor: "#e0f0e8",
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
    color: "#1a1a1a",
  },
  usernameInput: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 16,
    color: "#1a1a1a",
    borderBottomWidth: 1.5,
    borderBottomColor: "#1e6b40",
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
    color: "#1a1a1a",
  },
  heroSubtitle: {
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 15,
    color: "#666",
    marginTop: 4,
  },
  startGameContainer: {
    backgroundColor: "#1e6b40",
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
  footer: {
    alignItems: "center",
    paddingVertical: 10,
    paddingBottom: 28,
    backgroundColor: "#1e6b40",
  },
  footerText: {
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
  },
});
