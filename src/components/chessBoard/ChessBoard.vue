<template>
  <div class="chessboard-container">
    <div class="board">
      <div class="board-row" v-for="(row, rowIndex) in board" :key="rowIndex">
        <div
          v-for="(square, colIndex) in row"
          :key="colIndex"
          class="board-square"
          :class="{
            white: (rowIndex + colIndex) % 2 === 0,
            black: (rowIndex + colIndex) % 2 !== 0,
            selected:
              selectedSquare && selectedSquare.row === rowIndex && selectedSquare.col === colIndex,
          }"
          @dragover.prevent
          @drop="handleDrop(rowIndex, colIndex)"
          :draggable="square.piece !== null"
          @drag="handleDrag(rowIndex, colIndex)"
        >
          <img
            v-if="square.piece"
            :src="getPieceImage(square.piece)"
            alt="chess piece"
            class="piece"
          />
        </div>
      </div>
    </div>
    <!-- Move History Section -->
    <div class="move-history">
      <h3>Move History</h3>
      <ul>
        <li v-for="(move, index) in chessStore.moveHistory" :key="index">
          {{ move.san }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { useChessBoardStore } from '@/stores/useChessBoardStore'
import { ref, watch } from 'vue'

// Store initialization
const chessStore = useChessBoardStore()

// Reactive board state (8x8 grid of squares)
const board = ref([])

// Track the selected square's row and column for the starting position
const selectedSquare = ref(null)

// Initialize the board based on the current FEN
const initializeBoard = () => {
  const fen = chessStore.boardFEN
  const pieces = fen.split(' ')[0].split('/') // Only consider the FEN for the board
  const boardArray = []

  pieces.forEach((row, rowIndex) => {
    const boardRow = []
    let colIndex = 0

    // Parse each row
    for (let char of row) {
      if (parseInt(char)) {
        // If a number, represent empty squares
        for (let i = 0; i < parseInt(char); i++) {
          const color = (rowIndex + colIndex) % 2 === 0 ? 'white' : 'black'
          boardRow.push({ color, piece: null })
          colIndex++
        }
      } else {
        // If it's a piece, parse the piece type and color
        const piece = {
          type: char.toLowerCase(),
          color: char === char.toUpperCase() ? 'white' : 'black',
        }
        const color = (rowIndex + colIndex) % 2 === 0 ? 'white' : 'black'
        boardRow.push({ color, piece })
        colIndex++
      }
    }
    boardArray.push(boardRow)
  })

  board.value = boardArray
}

// Get the image source for a piece
const getPieceImage = (piece) => {
  return `../../../public/img/${piece.color[0]}${piece.type}.svg`
}

// Handle dragging a piece
const handleDrag = (rowIndex, colIndex) => {
  if (board.value[rowIndex][colIndex].piece) {
    selectedSquare.value = { row: rowIndex, col: colIndex }
  } else {
    selectedSquare.value = null
  }
}

// Handle dropping a piece
const handleDrop = (toRow, toCol) => {
  if (!selectedSquare.value) return // No piece selected

  const fromRow = selectedSquare.value.row
  const fromCol = selectedSquare.value.col

  // Validate and make the move if there's a piece in the selected square
  if (board.value[fromRow][fromCol].piece) {
    const from = getSquareName(fromRow, fromCol)
    const to = getSquareName(toRow, toCol)
    const move = { from, to }

    try {
      chessStore.makeMove(move)
      selectedSquare.value = null // Clear the selected square after the move
    } catch {
      selectedSquare.value = null // Clear the selected square if it's illegal move
    }
  }
}

// Utility to convert row/column index to chess notation
const getSquareName = (row, col) => {
  return `${String.fromCharCode(97 + col)}${8 - row}`
}

// Initialize the board when the component is mounted or when the FEN changes
watch(() => chessStore.boardFEN, initializeBoard)
initializeBoard()
</script>

<style scoped>
.chessboard-container {
  display: grid;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
}

.board {
  display: flex;
  flex-direction: column;
  border: 1px solid black;
  width: fit-content;
  height: fit-content;
}

.board-row {
  display: flex;
}

.board-square {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
}

.white {
  background-color: #f0d9b5;
}

.black {
  background-color: #b58863;
}

.piece {
  width: 100%;
  height: auto;
}

.selected {
  background-color: rgb(255, 191, 53); /* Highlight the selected square */
}

.move-history {
  margin-top: 20px;
  padding: 10px;
  border: 1px solid #ccc;
  width: 300px;
  max-height: 300px;
  overflow-y: auto;
}

.move-history h3 {
  font-size: 18px;
  margin-bottom: 10px;
}

.move-history ul {
  list-style-type: none;
  padding: 0;
}

.move-history li {
  padding: 5px 0;
  font-size: 16px;
}
</style>
