import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { ComponentType, useState } from "react";
import { SvgProps } from "react-native-svg";

function parseTime(t: string): number {
  const n = parseInt(t);
  return isNaN(n) ? 600 : n * 60;
}

function fmt(s: number) {
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

import WK from "../assets/pieces/wk.svg";
import WQ from "../assets/pieces/wq.svg";
import WR from "../assets/pieces/wr.svg";
import WB from "../assets/pieces/wb.svg";
import WN from "../assets/pieces/wn.svg";
import WP from "../assets/pieces/wp.svg";
import BK from "../assets/pieces/bk.svg";
import BQ from "../assets/pieces/bq.svg";
import BR from "../assets/pieces/br.svg";
import BB from "../assets/pieces/bb.svg";
import BN from "../assets/pieces/bn.svg";
import BP from "../assets/pieces/bp.svg";

type PieceComponent = ComponentType<SvgProps>;

const PIECES: Record<string, PieceComponent> = {
  wk: WK,
  wq: WQ,
  wr: WR,
  wb: WB,
  wn: WN,
  wp: WP,
  bk: BK,
  bq: BQ,
  br: BR,
  bb: BB,
  bn: BN,
  bp: BP,
};

const INITIAL_BOARD: (string | null)[][] = [
  ["br", "bn", "bb", "bq", "bk", "bb", "bn", "br"],
  ["bp", "bp", "bp", "bp", "bp", "bp", "bp", "bp"],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ["wp", "wp", "wp", "wp", "wp", "wp", "wp", "wp"],
  ["wr", "wn", "wb", "wq", "wk", "wb", "wn", "wr"],
];

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

export default function GameRoom() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { mode, time, username, flipped } = route.params ?? {};
  const [whiteTime, setWhiteTime] = useState(parseTime(time));
  const [blackTime, setBlackTime] = useState(parseTime(time));
  const { width } = useWindowDimensions();
  const boardSize = width - 32;
  const squareSize = boardSize / 8;

  const board = flipped
    ? [...INITIAL_BOARD].reverse().map((row) => [...row].reverse())
    : INITIAL_BOARD;

  const files = flipped ? [...FILES].reverse() : FILES;
  const ranks = flipped ? [...RANKS].reverse() : RANKS;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={12}
        >
          <MaterialIcons name="arrow-back" size={24} color="#1a1a1a" />
        </Pressable>
      </View>

      <View style={styles.playerRow}>
        <Text style={styles.playerLabel}>Opponent</Text>
        <Text style={styles.timerText}>
          {fmt(flipped ? whiteTime : blackTime)}
        </Text>
      </View>

      {/* Board */}
      <View
        style={[styles.boardWrapper, { width: boardSize, height: boardSize }]}
      >
        {board.map((row, rowIdx) =>
          row.map((piece, colIdx) => {
            const isLight = (rowIdx + colIdx) % 2 === 0;
            const Piece = piece ? PIECES[piece] : null;
            return (
              <View
                key={`${rowIdx}-${colIdx}`}
                style={[
                  styles.square,
                  { width: squareSize, height: squareSize },
                  isLight ? styles.squareLight : styles.squareDark,
                ]}
              >
                {Piece && (
                  <Piece width={squareSize * 0.82} height={squareSize * 0.82} />
                )}
                {colIdx === 0 && (
                  <Text
                    style={[
                      styles.coordRank,
                      isLight ? styles.coordDark : styles.coordLight,
                    ]}
                  >
                    {ranks[rowIdx]}
                  </Text>
                )}
                {rowIdx === 7 && (
                  <Text
                    style={[
                      styles.coordFile,
                      isLight ? styles.coordDark : styles.coordLight,
                    ]}
                  >
                    {files[colIdx]}
                  </Text>
                )}
              </View>
            );
          }),
        )}
      </View>

      <View style={styles.playerRow}>
        <Text style={styles.playerLabel}>{username}</Text>
        <Text style={styles.timerText}>
          {fmt(flipped ? blackTime : whiteTime)}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#333638" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#b8b8b8",
    alignItems: "center",
    justifyContent: "center",
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  playerLabel: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 16,
    color: "#1a1a1a",
  },
  timerText: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 16,
    color: "#1a1a1a",
  },
  boardWrapper: {
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    borderRadius: 4,
    overflow: "hidden",
  },
  square: {
    alignItems: "center",
    justifyContent: "center",
  },
  squareLight: { backgroundColor: "#f0d9b5" },
  squareDark: { backgroundColor: "#b58863" },
  coordRank: {
    position: "absolute",
    top: 2,
    left: 3,
    fontSize: 9,
    fontFamily: "GoogleSansFlex_700Bold",
  },
  coordFile: {
    position: "absolute",
    bottom: 2,
    right: 3,
    fontSize: 9,
    fontFamily: "GoogleSansFlex_700Bold",
  },
  coordLight: { color: "#b58863" },
  coordDark: { color: "#f0d9b5" },
});
