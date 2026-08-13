import { View, Text, StyleSheet, Modal, Pressable, useWindowDimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Chess } from "chess.js";
import { ComponentType } from "react";
import { SvgProps } from "react-native-svg";

// Import piece SVGs
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

export default function BoardPreview() {
  const [previewVisible, setPreviewVisible] = useState(false);
  const { width } = useWindowDimensions();
  
  // Use the same calculation as GameRoom
  const rawBoardSize = width - 32;
  const squareSize = Math.floor(rawBoardSize / 8);
  const boardSize = squareSize * 8;

  // Initialize chess with standard starting position
  const chess = new Chess();
  const board = chess.board();

  return (
    <>
      <Pressable
        style={styles.previewBtn}
        onPress={() => setPreviewVisible(true)}
      >
        <MaterialIcons name="visibility" size={18} color="#69923e" />
        <Text style={styles.previewBtnText}>Preview Board</Text>
      </Pressable>

      <Modal visible={previewVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Board Preview</Text>
              <Pressable onPress={() => setPreviewVisible(false)} hitSlop={8}>
                <MaterialIcons name="close" size={24} color="#2c2b29" />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>
              Standard chess starting position
            </Text>

            <View style={{ alignSelf: "center", width: boardSize, height: boardSize, marginVertical: 20 }}>
              <View style={[styles.boardWrapper, { width: boardSize, height: boardSize }]}>
                {board.map((row, rowIdx) =>
                  row.map((piece, colIdx) => {
                    const isLight = (rowIdx + colIdx) % 2 === 0;
                    const pieceKey = piece ? `${piece.color}${piece.type}` : null;
                    const Piece = pieceKey ? PIECES[pieceKey] : null;
                    
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
                          <View style={[StyleSheet.absoluteFillObject, styles.pieceWrapper]} pointerEvents="none">
                            <Piece width={squareSize * 0.82} height={squareSize * 0.82} />
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            </View>

            <View style={styles.infoBox}>
              <MaterialIcons name="info-outline" size={16} color="#69923e" />
              <Text style={styles.infoText}>
                If the board displays correctly with no gaps or overlaps, the rendering is working properly.
              </Text>
            </View>

            <Pressable
              style={styles.closeBtn}
              onPress={() => setPreviewVisible(false)}
            >
              <Text style={styles.closeBtnText}>Close Preview</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  previewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#f5f5f0",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginTop: 16,
  },
  previewBtnText: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 14,
    color: "#69923e",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    width: "100%",
    maxWidth: 420,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalTitle: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 20,
    color: "#2c2b29",
  },
  modalSubtitle: {
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
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
  squareLight: { 
    backgroundColor: "#eeeed2" 
  },
  squareDark: { 
    backgroundColor: "#769656" 
  },
  pieceWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#f0f4ec",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(105,146,62,0.15)",
  },
  infoText: {
    flex: 1,
    fontFamily: "GoogleSansFlex_400Regular",
    fontSize: 12,
    color: "#2c2b29",
    lineHeight: 17,
  },
  closeBtn: {
    backgroundColor: "#69923e",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  closeBtnText: {
    fontFamily: "GoogleSansFlex_700Bold",
    fontSize: 15,
    color: "#ffffff",
  },
});
