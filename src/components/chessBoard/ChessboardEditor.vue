<template>
  <div class="editor-container">
    <div class="piece-set">
      <div class="pieces">
        <div
          v-for="piece in pieces"
          :key="piece"
          class="piece"
          :draggable="true"
          @dragstart="dragStart(piece)"
        >
          <img
            :src="`../../public/pieces/${selectedChessPieceSet}/${piece}.svg`"
            :alt="piece"
            :title="piece"
            width="40px"
          />
        </div>
      </div>
    </div>

    <div class="chessboard" @dragover.prevent @drop="drop">
      <div
        v-for="(square, index) in currentBoardSquares"
        :key="square"
        :data-square="square"
        class="square"
        :class="{ occupied: boardState[square] }"
      >
        <img
          v-if="boardState[square]"
          :src="`../../public/pieces/${selectedChessPieceSet}/${boardState[square]}.svg`"
          :alt="boardState[square]"
          :title="boardState[square]"
          draggable="false"
        />
      </div>
    </div>

    <div class="fen-container">
      <h3>Current FEN:</h3>
      <p>{{ generateFEN }}</p>
    </div>
  </div>
</template>

<script setup>
import { SQUARES } from 'chess.js'
import { computed, ref } from 'vue'

const pieces = ref(['bp', 'br', 'bn', 'bb', 'bq', 'bk', 'wp', 'wr', 'wn', 'wb', 'wq', 'wk'])
const selectedChessPieceSet = ref('Cardinal')

const boardState = ref({})
const chessBoardSquares = SQUARES

const currentBoardSquares = computed(() => chessBoardSquares)

const dragStart = (piece) => {
  // Store the piece being dragged
  event.dataTransfer.setData('piece', piece)
}

const drop = (event) => {
  // Get data from the drag and drop operation
  const piece = event.dataTransfer.getData('piece')
  const targetSquare = event.target.getAttribute('data-square')

  // Update board state
  if (targetSquare) {
    boardState.value[targetSquare] = piece // Place the piece on the square
  }
}

// Generate FEN from board state
const generateFEN = computed(() => {
  const rows = []
  for (let rank = 8; rank >= 1; rank--) {
    let row = ''
    let emptySquares = 0

    for (let file = 0; file < 8; file++) {
      const square = `${String.fromCharCode(97 + file)}${rank}`
      const piece = boardState.value[square]

      if (piece) {
        // Append the piece if present
        if (emptySquares > 0) {
          row += emptySquares // Add the number of empty squares
          emptySquares = 0
        }
        // Convert black pieces to lowercase and white pieces to uppercase
        row += piece.charAt(0) === 'b' ? piece.charAt(1) : piece.charAt(1).toUpperCase()
      } else {
        emptySquares++
      }
    }

    // If there are empty squares at the end of the row, append their count
    if (emptySquares > 0) {
      row += emptySquares
    }

    rows.push(row)
  }

  const board = rows.join('/')
  return `${board} w KQkq - 0 1` // Assuming white to move, full castling rights, no en passant, 0 halfmove clock, 1 fullmove number
})
</script>

<style scoped>
.editor-container {
  display: flex;
}

.piece-set {
  width: 150px;
  margin-right: 20px;
}

.pieces {
  display: flex;
  flex-direction: column;
}

.piece {
  cursor: move;
  margin: 5px 0;
}

.chessboard {
  width: 400px;
  height: 400px;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
  border: 1px solid black;
}

.square {
  border: 1px solid #ccc;
  position: relative;
}

.square.occupied {
  background-color: #f0e68c;
}

.square img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  position: absolute;
  top: 0;
  left: 0;
}

.square:hover {
  background-color: rgba(255, 255, 0, 0.2);
}

.fen-container {
  margin-left: 20px;
}

.fen-container p {
  word-wrap: break-word;
}
</style>
