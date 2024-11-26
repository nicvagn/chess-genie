<template>
  <div class="chessboard" ref="board">
    <div class="chessboard-hidden" ref="hiddenBoard">
      <div v-for="(row, rowIndex) in boardState" :key="rowIndex" class="chess-row">
        <div
          v-for="(cell, colIndex) in row"
          :key="colIndex"
          class="chess-cell"
          @click="handleCellClick(rowIndex, colIndex)"
        >
          <img
            v-if="cell"
            :src="`../../public/pieces/${selectedChessPieceSet}/${cell}.svg`"
            :alt="cell"
            class="chess-piece"
            :class="{
              selected:
                selectedCell && selectedCell.row === rowIndex && selectedCell.col === colIndex,
            }"
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
import { onMounted, ref, watch } from 'vue'

const board = ref(null)
const hiddenBoard = ref(null)
const boardState = ref(
  Array(8)
    .fill(null)
    .map(() => Array(8).fill(null)),
)
const isFlipped = ref(false)
const selectedCell = ref(null)

const chessPieceSet = { cardinal: 'Cardinal', staunty: 'Staunty', merida: 'Merida' }
const selectedChessPieceSet = ref('Cardinal')

// On component mounted, check local storage
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
  const pieceMap = {
    p: 'bP', // black pawn
    r: 'bR', // black rook
    n: 'bN', // black knight
    b: 'bB', // black bishop
    q: 'bQ', // black queen
    k: 'bK', // black king
    P: 'wP', // white pawn
    R: 'wR', // white rook
    N: 'wN', // white knight
    B: 'wB', // white bishop
    Q: 'wQ', // white queen
    K: 'wK', // white king
  }

  boardState.value = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null))

  const [position] = fen.split(' ')

  let row = 0
  let col = 0
  for (let char of position) {
    if (parseInt(char)) {
      col += parseInt(char)
    } else if (char === '/') {
      row += 1
      col = 0
    } else {
      boardState.value[row][col] = pieceMap[char]
      col += 1
    }
  }
}

const handleCellClick = (rowIndex, colIndex) => {
  if (selectedCell.value) {
    const targetCell = boardState.value[rowIndex][colIndex]
    const selectedPiece = boardState.value[selectedCell.value.row][selectedCell.value.col]

    if (targetCell === null || targetCell[0] !== selectedPiece[0]) {
      boardState.value[rowIndex][colIndex] = selectedPiece
      boardState.value[selectedCell.value.row][selectedCell.value.col] = null
    }

    selectedCell.value = null
  } else {
    if (boardState.value[rowIndex][colIndex]) {
      selectedCell.value = { row: rowIndex, col: colIndex }
    }
  }
}

const flipBoard = () => {
  isFlipped.value = !isFlipped.value

  boardState.value = boardState.value
    .slice()
    .reverse()
    .map((row) => row.reverse())
}

// Example usage
setPositionFromFEN('r1bqkbnr/pp2pppp/2n5/1B1pP3/3N4/8/PPP2PPP/RNBQK2R b KQkq - 2 6')
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
}

.chess-piece {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.selected {
  background-color: rgba(0, 136, 255, 0.461);
}
</style>
