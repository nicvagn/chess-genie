<template>
  <div class="dialog-overlay border border-none rounded-lg">
    <div class="dialog-modal border border-none rounded-lg" @mousedown.stop>
      <div class="flex flex-row">
        <div
          v-for="piece in pieces"
          :key="piece"
          class="piece"
          :draggable="true"
          @dragstart="dragStart"
        >
          <img
            :src="`../../public/pieces/${selectedChessPieceSet}/${piece}.svg`"
            :alt="piece"
            :title="piece"
            :data-piece="piece"
          />
        </div>
      </div>

      <div
        class="chessboard border border-none rounded-md"
        :style="{ 'background-image': `url('../../public/chessboard/${selectedChessBoardImage}')` }"
      >
        <div class="chessboard-hidden" @dragover.prevent @drop="drop">
          <div
            v-for="(square, index) in currentBoardSquares"
            :key="square"
            :data-square="square"
            class="square"
            @click="removePiece(square)"
          >
            <span
              class="square-coordinates"
              :style="{ color: Math.floor(index / 8) % 2 !== index % 2 ? 'white' : 'black' }"
              >{{ square }}</span
            >
            <img
              v-if="boardState[square]"
              :src="`../../public/pieces/cardinal/${boardState[square]}.svg`"
              :alt="boardState[square]"
              :title="boardState[square]"
              draggable="false"
            />
          </div>
        </div>
      </div>

      <div class="flex flex-row justify-center">
        <input
          type="text"
          :value="generateFEN"
          readonly
          class="w-[350px] border my-1 focus:bg-none border-black focus:outline-none rounded-sm"
        />
        <button
          class="text-gray-600 border my-1 ml-3 border-gray-600 focus:outline-none font-medium rounded-sm text-sm w-10"
          @click="loadFEN"
        >
          load
        </button>
      </div>
      <div class="flex flex-row mb-1 justify-center">
        <div class="flex flex-col pr-2 bg-gray-500 rounded-sm mr-2 w-[130px] text-center">
          <label>
            <input type="radio" value="white" v-model="turn" />
            white's turn
          </label>
          <div class="flex flex-row justify-evenly">
            <label>
              <input type="checkbox" v-model="castlingRights.wQC" title="Queen Side castling" />
              0-0-0
            </label>
            <label>
              <input type="checkbox" v-model="castlingRights.wKC" title="King Side castling" />
              0-0
            </label>
          </div>
        </div>

        <div class="flex flex-col pr-2 bg-gray-500 rounded-sm mr-2 w-[130px] text-center">
          <label>
            <input type="radio" value="black" v-model="turn" />
            black's turn
          </label>

          <div class="flex flex-row justify-evenly">
            <label>
              <input type="checkbox" v-model="castlingRights.bQC" title="Queen Side castling" />
              0-0-0
            </label>
            <label>
              <input type="checkbox" v-model="castlingRights.bKC" title="King Side castling" />
              0-0
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { SQUARES } from 'chess.js'
import { computed, defineEmits, ref } from 'vue'

const pieces = ref(['bP', 'bR', 'bN', 'bB', 'bQ', 'bK', 'wK', 'wQ', 'wB', 'wN', 'wR', 'wP'])

const emits = defineEmits(['loadFEN'])

const loadFEN = () => {
  // Emit the generated FEN value to the parent
  emits('loadFEN', generateFEN.value)
}

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

const selectedChessPieceSet = ref('Cardinal')
const storedPieceSet = localStorage.getItem('selectedChessPieceSet')
if (storedPieceSet) selectedChessPieceSet.value = storedPieceSet

const selectedChessBoardImage = ref('blue2.jpg')
const storedChessBoardImage = localStorage.getItem('selectedChessBoardImage')
if (storedChessBoardImage) selectedChessBoardImage.value = storedChessBoardImage

const dragStart = (event) => {
  const piece = event.target.getAttribute('data-piece')
  event.dataTransfer.setData('piece', piece)
}

const drop = (event) => {
  const piece = event.dataTransfer.getData('piece')
  const targetSquare = event.target.getAttribute('data-square')

  // Ensure square is not occupied
  if (targetSquare && !boardState.value[targetSquare]) {
    boardState.value[targetSquare] = piece
  }
}

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
        row +=
          piece.charAt(0) === 'b' ? piece.charAt(1).toLowerCase() : piece.charAt(1).toUpperCase()
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
.dialog-overlay {
  top: 0;
  left: 0;
  z-index: 9;
  width: 100%;
  height: 100%;
  position: absolute;
  background-color: rgba(0, 0, 0, 0.5);
}

.dialog-modal {
  display: flex;
  flex-direction: column;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  width: 500px;
  height: 500px;
  max-width: 500px;
  max-height: 500px;
  position: relative;
}

.piece-container {
  display: flex;
  flex-direction: row;
  justify-content: center;
  padding: 10px;
}

.piece {
  cursor: grab;
  width: 40px;
  max-width: 100px;
}

.chessboard {
  width: 380px;
  height: 380px;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  position: relative;
  user-select: none;
  margin: 0 auto;
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

.square {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.square img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.square-coordinates {
  position: absolute;
  top: 0.5px;
  right: 0.5px;
  font-size: 11px;
  font-weight: lighter;
  pointer-events: none;
  user-select: none;
}

.options-container {
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #f9f9f9;
  border-top: 1px solid #ccc;
}
</style>
