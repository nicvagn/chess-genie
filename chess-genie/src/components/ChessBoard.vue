<template>
  <div id="app">
    <div class="board">
      <div v-for="(row, rowIndex) in board" :key="rowIndex" class="board-row">
        <div
          v-for="(cell, colIndex) in row"
          :key="colIndex"
          class="board-cell"
          :class="{
            light: (rowIndex + colIndex) % 2 === 0,
            dark: (rowIndex + colIndex) % 2 !== 0,
          }"
          @dragover.prevent
          @drop="onDrop(rowIndex, colIndex)"
        >
          <div
            v-if="validMoves.some((move) => move.row === rowIndex && move.col === colIndex)"
            class="valid-move-indicator"
          ></div>
          <img
            v-if="cell"
            :src="`../public/img/${chessPieceMap[cell]}.svg`"
            :draggable="true"
            @drag="onDrag(cell, rowIndex, colIndex)"
            class="piece"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { isValidMove } from '../moveValidation/moveValidation'

const parseFEN = (fen) => {
  const rows = fen.split(' ')[0].split('/')
  const board = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null))

  rows.forEach((row, rowIndex) => {
    let colIndex = 0
    for (const char of row) {
      if (isNaN(char)) {
        // It's a piece
        board[rowIndex][colIndex] = char
        colIndex++
      } else {
        // It's a number, meaning empty squares
        const emptySquares = parseInt(char, 10)
        colIndex += emptySquares
      }
    }
  })

  return board
}

export default {
  setup() {
    const fenString = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'
    const board = ref(parseFEN(fenString))
    const chessPieceMap = {
      K: 'wK',
      Q: 'wQ',
      R: 'wR',
      B: 'wB',
      N: 'wN',
      P: 'wP',
      k: 'bK',
      q: 'bQ',
      r: 'bR',
      b: 'bB',
      n: 'bN',
      p: 'bP',
    }

    let draggedPiece = ref(null)
    let draggedFrom = ref(null)
    const validMoves = ref([])

    const onDrag = (item, rowIndex, colIndex) => {
      draggedPiece.value = chessPieceMap[item]
      draggedFrom.value = rowIndex * 8 + colIndex // Calculate the index 0-63
      // Clear previous valid moves
      validMoves.value = []

      // Calculate and highlight valid moves
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (isValidMove(draggedPiece.value, rowIndex, colIndex, r, c, board.value)) {
            validMoves.value.push({ row: r, col: c })
          }
        }
      }
    }

    const onDrop = (rowIndex, colIndex) => {
      if (draggedPiece.value) {
        const fromRow = Math.floor(draggedFrom.value / 8)
        const fromCol = draggedFrom.value % 8
        const piece =
          draggedPiece.value[0] === 'w'
            ? draggedPiece.value[1].toUpperCase()
            : draggedPiece.value[1].toLowerCase()

        if (isValidMove(draggedPiece.value, fromRow, fromCol, rowIndex, colIndex, board.value)) {
          board.value[rowIndex][colIndex] = piece // Move to new position
          board.value[fromRow][fromCol] = null // Clear old position

          // Clear the dragged piece
          draggedPiece.value = null
          draggedFrom.value = null
        } else {
          console.warn('Invalid move for', draggedPiece.value)
        }
      }

      // Clear valid moves on drop
      validMoves.value = []
    }

    return {
      board,
      onDrag,
      onDrop,
      validMoves,
      chessPieceMap,
    }
  },
}
</script>

<style scoped>
.board {
  display: grid;
  grid-template-columns: repeat(8, 60px);
  grid-template-rows: repeat(8, 60px);
}

.board-row {
  display: contents;
}

.board-cell {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.light {
  background-color: rgb(240, 217, 181);
}

.dark {
  background-color: rgb(181, 136, 99);
}

.valid-move-indicator {
  position: absolute;
  width: 25px;
  height: 25px;
  border-radius: 50%;
  background-color: rgba(54, 54, 54, 0.365);
  z-index: 1;
}

.piece {
  width: 100%;
  height: auto;
  cursor: grab;
}

.piece:active {
  cursor: grabbing;
}
</style>
