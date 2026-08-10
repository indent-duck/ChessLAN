import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Pressable,
  Modal,
  ScrollView,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { ComponentType, useState, useEffect, useRef, useCallback } from "react";
import { SvgProps } from "react-native-svg";
import { Chess, Square } from "chess.js";
import Trophy from "../assets/svg/trophy.svg";
import { addListener, sendMsg } from "../hooks/useSocket";

// Generate a valid Chess960 starting position
function generateChess960Position(): string {
  let position: (string | null)[] = new Array(8).fill(null);
  
  // Place bishops on opposite colors
  const lightSquares = [1, 3, 5, 7]; // b, d, f, h files (light)
  const darkSquares = [0, 2, 4, 6];  // a, c, e, g files (dark)
  
  const lightBishopPos = lightSquares[Math.floor(Math.random() * lightSquares.length)];
  const darkBishopPos = darkSquares[Math.floor(Math.random() * darkSquares.length)];
  
  position[lightBishopPos] = 'b';
  position[darkBishopPos] = 'b';
  
  // Get remaining empty positions
  let emptyPositions = position.map((p, i) => p === null ? i : null).filter(i => i !== null) as number[];
  
  // Place queen in one of the remaining positions
  const queenIndex = Math.floor(Math.random() * emptyPositions.length);
  position[emptyPositions[queenIndex]] = 'q';
  emptyPositions = emptyPositions.filter((_, idx) => idx !== queenIndex);
  
  // Place knights in two of the remaining positions
  const knight1Index = Math.floor(Math.random() * emptyPositions.length);
  position[emptyPositions[knight1Index]] = 'n';
  emptyPositions = emptyPositions.filter((_, idx) => idx !== knight1Index);
  
  const knight2Index = Math.floor(Math.random() * emptyPositions.length);
  position[emptyPositions[knight2Index]] = 'n';
  emptyPositions = emptyPositions.filter((_, idx) => idx !== knight2Index);
  
  // Place rooks and king in the remaining 3 positions (R-K-R pattern)
  // King must be between the two rooks
  emptyPositions.sort((a, b) => a - b);
  position[emptyPositions[0]] = 'r';
  position[emptyPositions[1]] = 'k';
  position[emptyPositions[2]] = 'r';
  
  // Build FEN string - convert null to empty string shouldn't happen but safety check
  const backRank = position.map(p => p || '?').join('');
  const fen = `${backRank}/pppppppp/8/8/8/8/PPPPPPPP/${backRank.toUpperCase()} w KQkq - 0 1`;
  
  return fen;
}

function parseTime(t: string): number {
  const parts = t.match(/(\d+)(?:\+(\d+))?/);
  if (!parts) return 600;
  const mins = parseInt(parts[1]);
  return isNaN(mins) ? 600 : mins * 60;
}

function parseIncrement(t: string): number {
  const parts = t.match(/\d+\+(\d+)/);
  return parts ? parseInt(parts[1]) : 0;
}

function fmt(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function squareToRowCol(sq: Square, flipped: boolean): [number, number] {
  const file = sq.charCodeAt(0) - 97;
  const rank = 8 - parseInt(sq[1]);
  return flipped ? [7 - rank, 7 - file] : [rank, file];
}

function rowColToSquare(row: number, col: number, flipped: boolean): Square {
  const file = flipped ? 7 - col : col;
  const rank = flipped ? row : 7 - row;
  return (String.fromCharCode(97 + file) + (rank + 1)) as Square;
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
  wk: WK, wq: WQ, wr: WR, wb: WB, wn: WN, wp: WP,
  bk: BK, bq: BQ, br: BR, bb: BB, bn: BN, bp: BP,
};

export default function GameRoom() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { mode, time, username, flipped, myColor, opponentUsername, variant = 'standard', chess960Fen } = route.params ?? {};
  // myColor is "w" or "b" for multiplayer; undefined means local 2-player
  const increment = parseIncrement(time ?? "");

  // Initialize chess instance with appropriate starting position
  const initializeChess = () => {
    if (variant === 'chess960') {
      // Use the FEN from server if available (multiplayer), otherwise generate one (local game)
      const fen = chess960Fen || generateChess960Position();
      return new Chess(fen);
    } else {
      return new Chess();
    }
  };

  const chessRef = useRef<Chess>(initializeChess());
  const [board, setBoard] = useState(() => chessRef.current.board());
  const [turn, setTurn] = useState<"w" | "b">("w");
  const [selected, setSelected] = useState<Square | null>(null);
  const [legalSquares, setLegalSquares] = useState<Square[]>([]);
  const [moves, setMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const moveListRef = useRef<ScrollView>(null);
  const [whiteTime, setWhiteTime] = useState(parseTime(time));
  const [blackTime, setBlackTime] = useState(parseTime(time));
  const [gameOver, setGameOver] = useState<{ winner: string; reason: string } | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [resignConfirm, setResignConfirm] = useState(false);
  // drawOffer: "sent" = I offered, "received" = opponent offered
  const [drawOffer, setDrawOffer] = useState<"sent" | "received" | null>(null);
  const drawTimerAnim = useRef(new Animated.Value(1)).current;
  const drawTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [abandonConfirm, setAbandonConfirm] = useState(false);
  const [opponentAbandoned, setOpponentAbandoned] = useState(false);

  const { width } = useWindowDimensions();
  const boardSize = width - 32;
  const squareSize = boardSize / 8;

  const opponentName = opponentUsername ?? "Opponent";
  const playerColor: "w" | "b" = myColor ?? (flipped ? "b" : "w");

  useEffect(() => {
    if (gameOver) return;
    intervalRef.current = setInterval(() => {
      if (turn === "w") {
        setWhiteTime((t) => {
          if (t <= 1) {
            const winner = playerColor === "b" ? username ?? "You" : opponentName;
            setGameOver({ winner, reason: "on time" });
            clearInterval(intervalRef.current!);
            return 0;
          }
          return t - 1;
        });
      } else {
        setBlackTime((t) => {
          if (t <= 1) {
            const winner = playerColor === "w" ? username ?? "You" : opponentName;
            setGameOver({ winner, reason: "on time" });
            clearInterval(intervalRef.current!);
            return 0;
          }
          return t - 1;
        });
      }
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [turn, gameOver]);


  const clearDrawOffer = useCallback(() => {
    setDrawOffer(null);
    drawTimerAnim.setValue(1);
    if (drawTimerRef.current) clearTimeout(drawTimerRef.current);
  }, []);

  const startDrawTimer = useCallback(() => {
    drawTimerAnim.setValue(1);
    Animated.timing(drawTimerAnim, { toValue: 0, duration: 10000, useNativeDriver: false }).start();
    drawTimerRef.current = setTimeout(() => setDrawOffer(null), 10000);
  }, []);

  // Incoming moves from opponent
  useEffect(() => {
    if (!myColor) return;
    const remove = addListener((msg: any) => {
      if (msg.type === "move") {
        commitMove(msg.move.from, msg.move.to, msg.move.promotion ?? "q", false);
      } else if (msg.type === "opponent_disconnected") {
        setGameOver({ winner: username ?? "You", reason: "opponent disconnected" });
      } else if (msg.type === "resign") {
        setGameOver({ winner: username ?? "You", reason: "opponent resigned" });
      } else if (msg.type === "draw_offer") {
        setDrawOffer("received");
        startDrawTimer();
      } else if (msg.type === "draw_accept") {
        clearDrawOffer();
        setGameOver({ winner: "Draw", reason: "by agreement" });
      } else if (msg.type === "draw_decline") {
        clearDrawOffer();
      } else if (msg.type === "abandon") {
        setOpponentAbandoned(true);
      }
    });
    return remove;
  }, [myColor, startDrawTimer, clearDrawOffer]);

  const commitMove = useCallback((from: Square, to: Square, promotion: "q" | "r" | "b" | "n", local = true) => {
    const chess = chessRef.current;
    chess.move({ from, to, promotion });
    setBoard(chess.board());
    setMoves(chess.history());
    setLastMove({ from, to });
    setTimeout(() => moveListRef.current?.scrollToEnd({ animated: true }), 50);
    const nextTurn = chess.turn();
    setTurn(nextTurn);
    if (increment > 0) {
      if (turn === "w") setWhiteTime((t) => t + increment);
      else setBlackTime((t) => t + increment);
    }
    if (chess.isGameOver()) {
      if (chess.isCheckmate()) {
        const winnerIsPlayer = flipped ? turn === "b" : turn === "w";
        const winner = winnerIsPlayer ? username ?? "You" : opponentName;
        setGameOver({ winner, reason: "by checkmate" });
        if (myColor) sendMsg({ type: "game_over", winner, reason: "by checkmate" });
      } else if (chess.isDraw()) {
        setGameOver({ winner: "Draw", reason: "stalemate" });
        if (myColor) sendMsg({ type: "game_over", winner: "Draw", reason: "stalemate" });
      }
    }
    if (local && myColor) sendMsg({ type: "move", move: { from, to, promotion } });
    setSelected(null);
    setLegalSquares([]);
  }, [turn, increment, flipped, username, myColor, opponentName]);

  const handleSquarePress = useCallback((row: number, col: number) => {
    if (gameOver || pendingPromotion) return;
    // In multiplayer, only allow moves on your turn
    if (myColor && turn !== myColor) return;
    const chess = chessRef.current;
    const sq = rowColToSquare(row, col, flipped);
    const piece = chess.get(sq);

    if (selected) {
      if (legalSquares.includes(sq)) {
        const movingPiece = chess.get(selected);
        const isPromotion = movingPiece?.type === "p" && (sq[1] === "8" || sq[1] === "1");
        if (isPromotion) {
          setPendingPromotion({ from: selected, to: sq });
          setSelected(null);
          setLegalSquares([]);
        } else {
          commitMove(selected, sq, "q");
        }
      } else if (piece && piece.color === turn) {
        setSelected(sq);
        setLegalSquares(chess.moves({ square: sq, verbose: true }).map((m) => m.to as Square));
      } else {
        setSelected(null);
        setLegalSquares([]);
      }
    } else {
      if (piece && piece.color === turn) {
        setSelected(sq);
        setLegalSquares(chess.moves({ square: sq, verbose: true }).map((m) => m.to as Square));
      }
    }
  }, [selected, legalSquares, turn, gameOver, pendingPromotion, flipped, commitMove]);

  const rawBoard = chessRef.current.board();
  const displayBoard = flipped
    ? [...rawBoard].reverse().map((row) => [...row].reverse())
    : rawBoard;

  const opponentColor = playerColor === "w" ? "b" : "w";
  const opponentTime = opponentColor === "w" ? whiteTime : blackTime;
  const playerTime = playerColor === "w" ? whiteTime : blackTime;
  const opponentActive = turn === opponentColor && !gameOver;
  const playerActive = turn === playerColor && !gameOver;

  const handleResignConfirm = () => {
    setResignConfirm(false);
    setGameOver({ winner: opponentName, reason: "by resignation" });
    if (myColor) sendMsg({ type: "resign" });
  };

  const handleDrawOffer = () => {
    if (drawOffer === "sent" || !myColor) return;
    sendMsg({ type: "draw_offer" });
    setDrawOffer("sent");
    startDrawTimer();
  };

  const handleDrawAccept = () => {
    sendMsg({ type: "draw_accept" });
    clearDrawOffer();
    setGameOver({ winner: "Draw", reason: "by agreement" });
  };

  const handleDrawDecline = () => {
    sendMsg({ type: "draw_decline" });
    clearDrawOffer();
  };

  const handleBackPress = () => {
    if (gameOver) {
      navigation.goBack();
    } else {
      setAbandonConfirm(true);
    }
  };

  const handleAbandonConfirm = () => {
    setAbandonConfirm(false);
    if (myColor) {
      sendMsg({ type: "abandon" });
    }
    navigation.navigate("Home" as never);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={handleBackPress} style={styles.backBtn} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={22} color="#b0b0b0" />
        </Pressable>
        <Text style={styles.modeLabel}>{mode}</Text>
        {myColor && !gameOver && (
          <View style={styles.actionBtns}>
            <Pressable
              style={[styles.actionBtn, drawOffer === "sent" && styles.actionBtnDisabled]}
              onPress={handleDrawOffer}
              disabled={!!drawOffer}
              hitSlop={8}
            >
              <MaterialIcons name="handshake" size={18} color={drawOffer === "sent" ? "#555" : "#b0b0b0"} />
              <Text style={[styles.actionBtnText, drawOffer === "sent" && { color: "#555" }]}>Draw</Text>
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={() => setResignConfirm(true)} hitSlop={8}>
              <MaterialIcons name="flag" size={18} color="#c0392b" />
              <Text style={[styles.actionBtnText, { color: "#c0392b" }]}>Resign</Text>
            </Pressable>
          </View>
        )}
      </View>

      {drawOffer === "received" && (
        <View style={styles.drawBanner}>
          <Animated.View style={[styles.drawTimerBar, {
            transform: [{ scaleX: drawTimerAnim }]
          }]} />
          <View style={styles.drawBannerContent}>
            <Text style={styles.drawBannerText}>{opponentName} is offering a draw</Text>
            <View style={styles.drawBannerBtns}>
              <Pressable style={styles.drawAcceptBtn} onPress={handleDrawAccept}>
                <Text style={styles.drawAcceptBtnText}>Accept</Text>
              </Pressable>
              <Pressable style={styles.drawDeclineBtn} onPress={handleDrawDecline}>
                <Text style={styles.drawDeclineBtnText}>Decline</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      <PlayerCard name={opponentName} time={opponentTime} active={opponentActive} />

      <View style={{ alignSelf: "center", width: boardSize, height: boardSize }}>
        <View style={[styles.boardWrapper, { width: boardSize, height: boardSize }]}>
          {displayBoard.map((row, rowIdx) =>
            row.map((piece, colIdx) => {
              const isLight = (rowIdx + colIdx) % 2 === 0;
              const sq = rowColToSquare(rowIdx, colIdx, flipped);
              const isSelected = selected === sq;
              const isLegal = legalSquares.includes(sq);
              const isLastMoveSquare = lastMove && (lastMove.from === sq || lastMove.to === sq);
              const hasPiece = !!piece;
              const pieceKey = piece ? `${piece.color}${piece.type}` : null;
              const Piece = pieceKey ? PIECES[pieceKey] : null;
              return (
                <Pressable
                  key={`${rowIdx}-${colIdx}`}
                  onPress={() => handleSquarePress(rowIdx, colIdx)}
                  style={[
                    styles.square,
                    { width: squareSize, height: squareSize },
                    isLight ? styles.squareLight : styles.squareDark,
                    isSelected && styles.squareSelected,
                    isLastMoveSquare && (isLight ? styles.squareLastMoveLight : styles.squareLastMoveDark),
                  ]}
                >
                  {Piece && (
                    <View style={[StyleSheet.absoluteFillObject, styles.pieceWrapper]} pointerEvents="none">
                      <Piece width={squareSize * 0.82} height={squareSize * 0.82} />
                    </View>
                  )}
                  {isLegal && (
                    <View style={[
                      hasPiece ? styles.legalCapture : styles.legalDot,
                      { width: hasPiece ? squareSize : squareSize * 0.32, height: hasPiece ? squareSize : squareSize * 0.32, borderRadius: hasPiece ? 0 : squareSize },
                    ]} />
                  )}
                </Pressable>
              );
            })
          )}
        </View>
      </View>

      <PlayerCard name={username ?? "You"} time={playerTime} active={playerActive} />

      <View style={styles.moveListContainer}>
        <View style={styles.moveListHeader}>
          <Text style={styles.moveListHeaderCell}>#</Text>
          <Text style={styles.moveListHeaderCell}>White</Text>
          <Text style={styles.moveListHeaderCell}>Black</Text>
        </View>
        <ScrollView ref={moveListRef} style={styles.moveListScroll} showsVerticalScrollIndicator={false}>
          {Array.from({ length: Math.ceil(moves.length / 2) }, (_, i) => (
            <View key={i} style={[styles.moveRow, i % 2 === 0 && styles.moveRowAlt]}>
              <Text style={styles.moveNum}>{i + 1}</Text>
              <Text style={styles.moveCell}>{moves[i * 2]}</Text>
              <Text style={styles.moveCell}>{moves[i * 2 + 1] ?? ""}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <Modal visible={resignConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={[styles.modalHeaderRow, { backgroundColor: "#c0392b" }]}>
              <Text style={styles.modalHeader}>Resign?</Text>
            </View>
            <View style={{ padding: 24, gap: 12 }}>
              <Text style={styles.resignModalText}>Are you sure you want to resign? This will count as a loss.</Text>
              <View style={styles.resignModalBtns}>
                <Pressable style={styles.resignConfirmBtn} onPress={handleResignConfirm}>
                  <Text style={styles.resignConfirmBtnText}>Resign</Text>
                </Pressable>
                <Pressable style={styles.resignCancelBtn} onPress={() => setResignConfirm(false)}>
                  <Text style={styles.resignCancelBtnText}>Continue Playing</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!pendingPromotion} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.promotionBox}>
            <Text style={styles.promotionTitle}>Promote to</Text>
            <View style={styles.promotionRow}>
              {(["q", "r", "b", "n"] as const).map((p) => {
                const key = `${turn}${p}`;
                const Piece = PIECES[key];
                return (
                  <Pressable
                    key={p}
                    style={styles.promotionOption}
                    onPress={() => {
                      if (!pendingPromotion) return;
                      commitMove(pendingPromotion.from, pendingPromotion.to, p);
                      setPendingPromotion(null);
                    }}
                  >
                    <Piece width={52} height={52} />
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!gameOver} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Pressable style={styles.modalClose} onPress={() => navigation.navigate("Home" as never)} hitSlop={8}>
              <MaterialIcons name="close" size={20} color="#888" />
            </Pressable>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeader}>Game Over</Text>
            </View>
            <View style={styles.modalTrophyRow}>
              {gameOver?.winner !== "Draw" && (
                <View style={styles.trophyCircle}>
                  <Trophy width={44} height={44} />
                </View>
              )}
              <View style={[styles.modalWinnerBlock, gameOver?.winner === "Draw" && { alignItems: "center" }]}>
                <Text style={styles.modalWinnerLabel}>{gameOver?.winner === "Draw" ? "Game ended in a draw" : "Winner"}</Text>
                {gameOver?.winner !== "Draw" && <Text style={styles.modalWinnerName}>{gameOver?.winner}</Text>}
                {!!gameOver?.reason && <Text style={styles.modalReason}>{gameOver.reason}</Text>}
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={abandonConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={[styles.modalHeaderRow, { backgroundColor: "#d35400" }]}>
              <Text style={styles.modalHeader}>Abandon game?</Text>
            </View>
            <View style={{ padding: 24, gap: 12 }}>
              <Text style={styles.resignModalText}>Are you sure you want to leave? The game will be abandoned.</Text>
              <View style={styles.resignModalBtns}>
                <Pressable style={[styles.resignConfirmBtn, { backgroundColor: "#d35400" }]} onPress={handleAbandonConfirm}>
                  <Text style={styles.resignConfirmBtnText}>Leave Game</Text>
                </Pressable>
                <Pressable style={styles.resignCancelBtn} onPress={() => setAbandonConfirm(false)}>
                  <Text style={styles.resignCancelBtnText}>Continue Playing</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={opponentAbandoned} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={[styles.modalHeaderRow, { backgroundColor: "#888" }]}>
              <Text style={styles.modalHeader}>Opponent Left</Text>
            </View>
            <View style={{ padding: 24, gap: 12 }}>
              <Text style={styles.resignModalText}>{opponentName} has abandoned the game.</Text>
              <Pressable style={[styles.resignConfirmBtn, { backgroundColor: "#69923e" }]} onPress={() => navigation.navigate("Home" as never)}>
                <Text style={styles.resignConfirmBtnText}>Return to Home</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function PlayerCard({ name, time, active }: { name: string; time: number; active: boolean }) {
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <View style={[styles.playerCard, active && styles.playerCardActive]}>
      <View style={styles.playerLeft}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.playerName}>{name}</Text>
      </View>
      <View style={[styles.timerBox, active && styles.timerBoxActive]}>
        <Text style={[styles.timerText, active && styles.timerTextActive]}>{fmt(time)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#2c2b29", justifyContent: "flex-start", paddingTop: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#4b4847",
    alignItems: "center",
    justifyContent: "center",
  },
  modeLabel: {
    fontFamily: "GoogleSansFlex_500Medium",
    fontSize: 14,
    color: "#888",
    letterSpacing: 0.5,
  },
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#4b4847",
  },
  playerCardActive: {
    backgroundColor: "#5a5856",
  },
  playerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#2c2b29",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 13,
    color: "#ccc",
  },
  playerName: {
    fontFamily: "GoogleSansFlex_500Medium",
    fontSize: 15,
    color: "#c8c8c8",
  },
  timerBox: {
    backgroundColor: "#2c2b29",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 90,
    alignItems: "center",
  },
  timerBoxActive: {
    backgroundColor: "#eeeed2",
  },
  timerText: {
    fontFamily: "ArchivoBlack_400Regular",
    fontSize: 22,
    color: "#888",
    letterSpacing: 1,
  },
  timerTextActive: {
    color: "#262421",
  },
  boardWrapper: {
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    borderRadius: 4,
  },
  square: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  squareLight: { backgroundColor: "#eeeed2" },
  squareDark: { backgroundColor: "#769656" },
  squareSelected: { backgroundColor: "#f6f669" },
  squareLastMoveLight: { backgroundColor: "#cdd26a" },
  squareLastMoveDark: { backgroundColor: "#aaa23a" },
  legalDot: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  legalCapture: {
    position: "absolute",
    borderWidth: 4,
    borderColor: "rgba(0,0,0,0.2)",
    backgroundColor: "transparent",
  },
  pieceWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  moveListContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: "#4b4847",
    borderRadius: 14,
    overflow: "hidden",
  },
  moveListHeader: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#2c2b29",
    borderBottomWidth: 1,
    borderBottomColor: "#4b4847",
  },
  moveListHeaderCell: {
    flex: 1,
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 11,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  moveListScroll: {
    flex: 1,
  },
  moveRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  moveRowAlt: {
    backgroundColor: "#3a3837",
  },
  moveNum: {
    flex: 1,
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 13,
    color: "#666",
  },
  moveCell: {
    flex: 1,
    fontFamily: "GoogleSansFlex_500Medium",
    fontSize: 13,
    color: "#c8c8c8",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBox: {
    backgroundColor: "#4b4847",
    borderRadius: 24,
    overflow: "hidden",
    width: 300,
  },
  modalHeaderRow: {
    backgroundColor: "#69923e",
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: "center",
    borderBottomLeftRadius: 120,
    borderBottomRightRadius: 120,
  },
  modalHeader: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 26,
    color: "#eeeed2",
    letterSpacing: 0.5,
  },
  modalTrophyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 24,
  },
  trophyCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#69923e",
    alignItems: "center",
    justifyContent: "center",
  },
  modalWinnerBlock: {
    flex: 1,
    gap: 2,
  },
  modalWinnerLabel: {
    fontFamily: "GoogleSansFlex_500Medium",
    fontSize: 16,
    color: "#c8c8c8",
    textTransform: "uppercase",
    letterSpacing: 1,
    flexShrink: 1,
  },
  modalWinnerName: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 22,
    color: "#eeeed2",
  },
  modalReason: {
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  modalClose: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2c2b29",
    alignItems: "center",
    justifyContent: "center",
  },
  promotionBox: {
    backgroundColor: "#4b4847",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    gap: 16,
    width: 300,
  },
  promotionTitle: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 16,
    color: "#eeeed2",
    letterSpacing: 0.5,
  },
  promotionRow: {
    flexDirection: "row",
    gap: 12,
  },
  promotionOption: {
    width: 68,
    height: 68,
    borderRadius: 14,
    backgroundColor: "#2c2b29",
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtns: {
    flexDirection: "row",
    gap: 8,
    marginLeft: "auto",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#4b4847",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionBtnDisabled: {
    backgroundColor: "#3a3837",
  },
  actionBtnText: {
    fontFamily: "GoogleSansFlex_500Medium",
    fontSize: 13,
    color: "#b0b0b0",
  },
  drawBanner: {
    marginHorizontal: 16,
    marginBottom: 4,
    backgroundColor: "#3a3837",
    borderRadius: 12,
    overflow: "hidden",
  },
  drawTimerBar: {
    height: 3,
    backgroundColor: "#69923e",
    width: "100%",
    transformOrigin: "left",
  },
  drawBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  drawBannerText: {
    fontFamily: "GoogleSansFlex_500Medium",
    fontSize: 13,
    color: "#c8c8c8",
    flex: 1,
  },
  drawBannerBtns: {
    flexDirection: "row",
    gap: 8,
  },
  drawAcceptBtn: {
    backgroundColor: "#69923e",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  drawAcceptBtnText: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 13,
    color: "white",
  },
  drawDeclineBtn: {
    backgroundColor: "#4b4847",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  drawDeclineBtnText: {
    fontFamily: "GoogleSansFlex_500Medium",
    fontSize: 13,
    color: "#b0b0b0",
  },
  resignModalText: {
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 14,
    color: "#c8c8c8",
    textAlign: "center",
  },
  resignModalBtns: {
    gap: 8,
    marginTop: 4,
  },
  resignConfirmBtn: {
    backgroundColor: "#c0392b",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  resignConfirmBtnText: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 15,
    color: "white",
  },
  resignCancelBtn: {
    backgroundColor: "#3a3837",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  resignCancelBtnText: {
    fontFamily: "GoogleSansFlex_500Medium",
    fontSize: 15,
    color: "#c8c8c8",
  },
});
