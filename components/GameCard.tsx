import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Pressable,
} from "react-native";
import { ComponentType } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

interface GameCardProps {
  icon: ComponentType<{ width: number; height: number }>;
  title: string;
  time: string;
  username: string;
}

export default function GameMode({ icon: Icon, title, time, username }: GameCardProps) {
  const { width } = useWindowDimensions();
  const iconSize = width * 0.25;
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  return (
    <View style={styles.container}>
      <View style={styles.cardHeader}>
        <Text style={styles.headerText}>{title}</Text>
        <View style={styles.timeBadge}>
          <Text style={styles.timeBadgeText}>{time}</Text>
        </View>
      </View>
      <View style={styles.iconContainer}>
        <Icon width={iconSize} height={iconSize} />
      </View>
      <Pressable
        onPress={() => navigation.navigate("SelectMode", { mode: title, time, username })}
        style={({ pressed }) => [
          styles.playButton,
          { opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Text style={styles.playButtonText}>Play Now</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 20,
    width: 260,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerText: {
    fontSize: 22,
    fontFamily: "GoogleSansFlex_700Bold",
    color: "#1a1a1a",
  },
  timeBadge: {
    backgroundColor: "#ddeacc",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeBadgeText: {
    fontFamily: "GoogleSansFlex_500Medium",
    fontSize: 12,
    color: "#69923e",
  },
  iconContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  playButton: {
    backgroundColor: "#69923e",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },
  playButtonText: {
    color: "white",
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 16,
    letterSpacing: 0.3,
  },
});
