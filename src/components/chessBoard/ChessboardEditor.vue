<template>
  <div class="editor-container">
    <div class="piece-set">
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
        />
      </div>
    </div>

    <div class="chessboard" @dragover.prevent @drop="drop">
      <div
        v-for="(square, index) in currentBoardSquares"
        :key="square"
        :data-square="square"
        class="square"
        :class="{ occupied: boardState[square] }"
        @click="removePiece(square)"
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
      <p>{{ generateFEN }}</p>
    </div>

    <div class="option-selector">
      <label>
        <input type="radio" value="white" v-model="turn" />
        White's turn
      </label>
      <label>
        <input type="radio" value="black" v-model="turn" />
        Black's turn
      </label>
    </div>
    <div>
      <label
        >White :
        <input type="checkbox" v-model="castlingRights.wQC" />
        0-0-0
      </label>
      <label>
        <input type="checkbox" v-model="castlingRights.wKC" />
        0-0
      </label>

      <label
        >Black :
        <input type="checkbox" v-model="castlingRights.bQC" />
        0-0-0
      </label>
      <label>
        <input type="checkbox" v-model="castlingRights.bKC" />
        0-0
      </label>
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

const turn = ref('white')

const castlingRights = ref({
  wKC: false, // White King-side
  wQC: false, // White Queen-side
  bKC: false, // Black King-side
  bQC: false, // Black Queen-side
})

const dragStart = (piece) => {
  event.dataTransfer.setData('piece', piece)
}

const drop = (event) => {
  const piece = event.dataTransfer.getData('piece')
  const targetSquare = event.target.getAttribute('data-square')

  if (targetSquare && !boardState.value[targetSquare]) {
    // Ensure square is not occupied
    boardState.value[targetSquare] = piece
  }
}

// New method to remove the piece from the chessboard
const removePiece = (square) => {
  if (boardState.value[square]) {
    delete boardState.value[square] // Delete the piece at the clicked square
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

    if (emptySquares > 0) {
      row += emptySquares
    }

    rows.push(row)
  }

  const board = rows.join('/')
  const castling =
    `${castlingRights.value.wKC ? 'K' : ''}${castlingRights.value.wQC ? 'Q' : ''}${castlingRights.value.bKC ? 'k' : ''}${castlingRights.value.bQC ? 'q' : ''}` ||
    '-'

  // Update the active turn in the FEN
  return `${board} ${turn.value === 'white' ? 'w' : 'b'} ${castling} - 0 1`
})
</script>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
}

.piece-set {
  display: flex;
  flex-direction: row;
}

.piece {
  cursor: move;
  margin: 5px 0;
  width: 33px;
  max-width: 100px;
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

.option-selector {
  margin-left: 20px;
}
</style>
