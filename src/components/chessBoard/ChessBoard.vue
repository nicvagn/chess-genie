<template>
  <div
    class="chessboard"
    ref="board"
    @mousedown="startDrag"
    @mouseup="endDrag"
    @mousemove="handleMouseMove"
  >
    <div class="chessboard-hidden" ref="hiddenBoard">
      <div v-for="(row, rowIndex) in boardState" :key="rowIndex" class="chess-row">
        <div
          v-for="(cell, colIndex) in row"
          :key="colIndex"
          class="chess-cell"
          :class="{ 'king-check': getKingInCheck(rowIndex, colIndex) }"
          @dragover="handleDragOver"
          @drop="handleDrop(rowIndex, colIndex)"
          @click="handleCellClick(rowIndex, colIndex, $event)"
        >
          <span
            class="square-coordinates"
            :style="{ color: (rowIndex + colIndex) % 2 !== 0 ? 'darkgray' : 'black' }"
            >{{ getSquareCoordinates(rowIndex, colIndex) }}</span
          >

          <!-- Highlighted Square -->
          <svg v-if="highlightedSquares[rowIndex][colIndex]" class="highlight-square">
            <defs>
              <filter id="drop-shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                <feOffset dx="0" dy="0" result="offsetblur" />
                <feFlood flood-color="rgba(0, 0, 0, 0.2)" />
                <feComposite in2="offsetblur" operator="in" />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <rect
              width="90%"
              height="90%"
              x="3"
              y="3"
              rx="10"
              ry="10"
              fill="none"
              :stroke="highlightedSquares[rowIndex][colIndex].color"
              stroke-width="2.5"
              filter="url(#drop-shadow)"
            />
          </svg>

          <img
            v-if="cell"
            :src="`../../public/pieces/${selectedChessPieceSet}/${cell}.svg`"
            :alt="cell"
            class="chess-piece"
            :class="{
              selected:
                selectedCell && selectedCell.row === rowIndex && selectedCell.col === colIndex,
            }"
            @dragstart="handleDragStart(rowIndex, colIndex)"
            :draggable="cell !== null"
          />
        </div>
      </div>
    </div>
  </div>
  <div>
    <button @click="flipBoard">Flip Board</button>
    <select v-model="selectedChessPieceSet">
      <option v-for="[key, value] in Object.entries(chessPieceSet)" :key="key" :value="value">
        {{ value }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { Chess } from 'chess.js'
import { onMounted, ref, watch } from 'vue'

const chess = ref(new Chess())
const boardState = ref(
  Array(8)
    .fill(null)
    .map(() => Array(8).fill(null)),
)
const highlightedSquares = ref(
  Array(8)
    .fill(null)
    .map(() => Array(8).fill(null)),
)
const isFlipped = ref(false)
const selectedCell = ref(null)

const chessPieceSet = { cardinal: 'Cardinal', staunty: 'Staunty', merida: 'Merida' }
const selectedChessPieceSet = ref('Cardinal')

const colors = {
  ctrl: 'blue',
  shift: 'red',
  alt: 'green',
  altShift: 'yellow',
}

const handleDragStart = (rowIndex, colIndex) => {
  if (boardState.value[rowIndex][colIndex]) {
    selectedCell.value = { row: rowIndex, col: colIndex }
  }
}

const handleDragOver = (event) => {
  event.preventDefault() // Allow the drop
}

const handleDrop = (rowIndex, colIndex) => {
  if (selectedCell.value) {
    const fromSquare = getSquareCoordinates(selectedCell.value.row, selectedCell.value.col)
    const toSquare = getSquareCoordinates(rowIndex, colIndex)

    const legalMoves = chess.value.moves({ square: fromSquare, verbose: true })
    const validMove = legalMoves.find((move) => move.to === toSquare)

    if (validMove) {
      // Move piece
      chess.value.move({ from: fromSquare, to: toSquare })
      // Update boardState
      const piece = boardState.value[selectedCell.value.row][selectedCell.value.col]
      boardState.value[rowIndex][colIndex] = piece
      boardState.value[selectedCell.value.row][selectedCell.value.col] = null
    }
    // Clear highlights after move
    highlightedSquares.value = Array(8)
      .fill(null)
      .map(() => Array(8).fill(null))

    selectedCell.value = null
  }
}

const handleCellClick = (rowIndex, colIndex, event) => {
  const existingHighlight = highlightedSquares.value[rowIndex][colIndex]

  const toggleHighlight = (color) => {
    if (existingHighlight) {
      if (existingHighlight.color === color) {
        highlightedSquares.value[rowIndex][colIndex] = null
      } else {
        highlightedSquares.value[rowIndex][colIndex] = { color }
      }
    } else {
      highlightedSquares.value[rowIndex][colIndex] = { color }
    }
  }

  if (event.altKey && event.shiftKey) {
    toggleHighlight(colors.altShift)
  } else if (event.ctrlKey) {
    toggleHighlight(colors.ctrl)
  } else if (event.shiftKey) {
    toggleHighlight(colors.shift)
  } else if (event.altKey) {
    toggleHighlight(colors.alt)
  }
}

const getSquareCoordinates = (rowIndex, colIndex) => {
  let displayRowIndex = isFlipped.value ? 7 - rowIndex : rowIndex
  let displayColIndex = isFlipped.value ? 7 - colIndex : colIndex
  const file = String.fromCharCode(97 + displayColIndex) // 'a' is char code 97
  const rank = 8 - displayRowIndex // 8 is the highest rank in chess
  return `${file}${rank}`
}

const getOpponentPiecePosition = (pieceName) => {
  const currentColor = chess.value.turn()

  // Loop through each square on the board, searching for the opponent's king
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = chess.value.board()[row][col]
      if (piece && piece.color === currentColor && piece.type === pieceName) {
        return getSquareCoordinates(row, col)
      }
    }
  }
  return null
}

// Helper function to get the king's position when in check
const getKingInCheck = (rowIndex, colIndex) => {
  if (chess.value.isCheck()) {
    const kingPosition = getOpponentPiecePosition('k') // Get the opponent's king position
    const [file, rank] = kingPosition.split('') // e.g., "e5" => ["e", "5"]
    const kingColIndex = file.charCodeAt(0) - 97 // Convert letter to index (0-7)
    const kingRowIndex = 8 - parseInt(rank) // Convert rank back to index
    return kingRowIndex === rowIndex && kingColIndex === colIndex
  }
  return false
}

// On component mounted, check local storage for piece set
onMounted(() => {
  const storedPieceSet = localStorage.getItem('selectedChessPieceSet')
  if (storedPieceSet) {
    selectedChessPieceSet.value = storedPieceSet
  }
})

// Watch for changes to selectedChessPieceSet and save to local storage
watch(selectedChessPieceSet, (newPieceSet) => {
  localStorage.setItem('selectedChessPieceSet', newPieceSet)
})

const setPositionFromFEN = (fen) => {
  chess.value.load(fen) // Load FEN into chess.js

  // update boardState based on the FEN-loaded position
  boardState.value = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null))

  // Map chess.js pieces to boardState
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = chess.value.board()[row][col]
      if (piece) {
        boardState.value[row][col] = piece.color + piece.type.toUpperCase() // e.g., 'wR', 'bN'
      }
    }
  }
}

const flipBoard = () => {
  isFlipped.value = !isFlipped.value

  boardState.value = boardState.value
    .slice()
    .reverse()
    .map((row) => row.reverse())

  highlightedSquares.value = highlightedSquares.value
    .slice()
    .reverse()
    .map((row) => row.reverse())
}

// Example FEN position
setPositionFromFEN('rnb1k2r/ppppqppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQKR2 w Qkq - 6 5')
</script>

<style scoped>
.chessboard {
  width: 500px;
  height: 500px;
  background-image: url('../../public/chessboard/wood4.jpg');
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  position: relative;
}

.chessboard-hidden {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0);
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
}

.chess-row {
  display: contents;
}

.chess-cell {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  width: 100%;
  height: 100%;
  cursor: pointer;
  /* background-color: rgba(255, 255, 255, 0.3); */
}

/* black squares */
/* .chess-row:nth-child(odd) .chess-cell:nth-child(even),
.chess-row:nth-child(even) .chess-cell:nth-child(odd) {
  background-color: rgba(0, 0, 0, 0.3);
} */

.chess-piece {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.highlight-square {
  position: absolute;
  width: 100%;
  height: 100%;
}

.selected {
  background-color: rgba(0, 136, 255, 0.461);
}

.draw-arrows {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.square-coordinates {
  position: absolute;
  top: 0.5px;
  right: 0.5px;
  font-size: 14px;
  font-weight: bold;
  pointer-events: none;
  user-select: none;
}

.king-check {
  background-color: rgba(255, 0, 0, 0.5);
}
</style>
