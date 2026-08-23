import {
  View,
  Text,
  StyleSheet,
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
import ChessLANFooter from "../components/ChessLANFooter";

export default function Home() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [username, setUsername] = useState("username");
  const [editing, setEditing] = useState(false);
  const [aboutVisible, setAboutVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    AsyncStorage.getItem("Player").then((val) => {
      if (val) setUsername(val);
    });
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

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Rook width={56} height={56} />
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
                    AsyncStorage.setItem("Player", username);
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
                        AsyncStorage.setItem("Player", username);
                        setEditing(false);
                      }
                    : startEditing
                }
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
          <Pressable
            onPress={() => setAboutVisible(true)}
            style={styles.aboutBtn}
            hitSlop={8}
          >
            <MaterialIcons name="info-outline" size={22} color="#777" />
          </Pressable>
        </View>

        {/* Middle area */}
        <View style={styles.heroArea}>
          <Text style={styles.heroTitle}>ChessLAN ♟</Text>
          <Text style={styles.heroSubtitle}>
            Play chess with friends over local WiFi or hotspot
          </Text>
        </View>
      </View>

      {/* Mode Selection Panel */}
      <View style={styles.modeSelectionContainer}>
        <View style={styles.selectHeader}>
          <Text style={styles.selectHeaderText}>Choose Connection Type</Text>
          <Text style={styles.selectHeaderSub}>
            Select how you want to connect with your opponent
          </Text>
        </View>

        <View style={styles.modesGroup}>
          <Pressable
            style={({ pressed }) => [
              styles.modeButton,
              { opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => navigation.navigate("HomeWiFi" as never)}
          >
            <View style={styles.modeButtonLeft}>
              <View style={styles.modeIconContainer}>
                <MaterialIcons name="wifi" size={24} color="#69923e" />
              </View>
              <View style={styles.modeTextContainer}>
                <Text style={styles.modeButtonTitle}>WiFi Network</Text>
                <Text style={styles.modeButtonSubtitle}>
                  Connect via same WiFi router
                </Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#69923e" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.modeButton,
              { opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => navigation.navigate("HomeHotspot" as never)}
          >
            <View style={styles.modeButtonLeft}>
              <View style={styles.modeIconContainer}>
                <MaterialIcons name="settings-input-antenna" size={24} color="#69923e" />
              </View>
              <View style={styles.modeTextContainer}>
                <Text style={styles.modeButtonTitle}>Phone Hotspot</Text>
                <Text style={styles.modeButtonSubtitle}>
                  Host creates hotspot connection
                </Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#69923e" />
          </Pressable>
        </View>
      </View>

      <ChessLANFooter version="1.0.2" />

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
            <Text style={styles.aboutVersion}>Version 1.0.2</Text>
            <View style={styles.aboutDivider} />
            <Text style={styles.aboutLabel}>Created by</Text>
            <Text style={styles.aboutCreator}>Lee Johnrich H. Ramirez</Text>
            <Text style={styles.aboutProgram}>
              BS in Information Technology{"\n"}
              Cavite State University - Main
            </Text>
            <Text style={styles.aboutDescription}>
              Play chess anytime, anywhere with friends over local WiFi or phone hotspot.
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
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
    fontSize: 18,
    color: "#2c2b29",
  },
  usernameInput: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 18,
    color: "#2c2b29",
    borderBottomWidth: 2,
    borderBottomColor: "#1e6b40",
    paddingVertical: 0,
    minWidth: 100,
  },
  heroArea: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 20,
  },
  heroTitle: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 48,
    color: "#2c2b29",
    marginBottom: 12,
  },
  heroSubtitle: {
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    maxWidth: "90%",
  },
  modeSelectionContainer: {
    backgroundColor: "#69923e",
    marginTop: "auto",
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    minHeight: "50%",
  },
  selectHeader: {
    marginBottom: 20,
  },
  selectHeaderText: {
    color: "white",
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 20,
  },
  selectHeaderSub: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 13,
    marginTop: 4,
  },
  modesGroup: {
    gap: 12,
  },
  modeButton: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modeButtonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  modeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ddeacc",
    alignItems: "center",
    justifyContent: "center",
  },
  modeTextContainer: {
    flex: 1,
  },
  modeButtonTitle: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 16,
    color: "#2c2b29",
    marginBottom: 2,
  },
  modeButtonSubtitle: {
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  aboutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f0",
    alignItems: "center",
    justifyContent: "center",
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
});
