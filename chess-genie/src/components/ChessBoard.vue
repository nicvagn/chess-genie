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
          @drop="onDrop(isFlipped ? 7 - rowIndex : rowIndex, colIndex)"
        >
          <div
            v-if="
              validMoves.some(
                (move) =>
                  move.row === (isFlipped ? 7 - rowIndex : rowIndex) && move.col === colIndex,
              )
            "
            class="valid-move-indicator"
          ></div>
          <img
            v-if="(isFlipped ? board[7 - rowIndex][colIndex] : cell) !== null"
            :src="`../public/img/${isFlipped ? board[7 - rowIndex][colIndex] : cell}.svg`"
            :draggable="true"
            @drag="
              onDrag(
                isFlipped ? board[7 - rowIndex][colIndex] : cell,
                isFlipped ? 7 - rowIndex : rowIndex,
                colIndex,
              )
            "
            class="piece"
          />
        </div>
      </div>
      <button @click="flipBoard">Flip Chessboard</button>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { isValidMove } from '../moveValidation/moveValidation'

export default {
  setup() {
    const board = ref([
      ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
      ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
      ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR'],
    ])

    let draggedPiece = ref(null)
    let draggedFrom = ref(null)
    const validMoves = ref([])
    const isFlipped = ref(false)

    const onDrag = (item, rowIndex, colIndex) => {
      draggedPiece.value = item
      draggedFrom.value = rowIndex * 8 + colIndex // Calculate the index 0-63
      const adjustedRow = isFlipped.value ? 7 - rowIndex : rowIndex
      // Clear previous valid moves
      validMoves.value = []

      // Calculate and highlight valid moves
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const adjustedToRow = isFlipped.value ? 7 - r : r
          if (
            isValidMove(item, adjustedRow, colIndex, adjustedToRow, c, board.value, isFlipped.value)
          ) {
            validMoves.value.push({ row: r, col: c })
          }
        }
      }
    }

    const onDrop = (rowIndex, colIndex) => {
      if (draggedPiece.value) {
        const fromRow = Math.floor(draggedFrom.value / 8)
        const fromCol = draggedFrom.value % 8

        const adjustedFromRow = isFlipped.value ? 7 - fromRow : fromRow
        const adjustedToRow = isFlipped.value ? 7 - rowIndex : rowIndex

        if (
          isValidMove(
            draggedPiece.value,
            adjustedFromRow,
            fromCol,
            adjustedToRow,
            colIndex,
            board.value,
            isFlipped.value,
          )
        ) {
          board.value[adjustedToRow][colIndex] = draggedPiece.value // Move to new position
          board.value[adjustedFromRow][fromCol] = null // Clear old position

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

    const flipBoard = () => {
      isFlipped.value = !isFlipped.value // Toggle the flipped state

      // Optionally, you might want to reset the valid moves when flipping
      validMoves.value = []
    }

    return {
      board,
      onDrag,
      onDrop,
      validMoves,
      flipBoard,
      isFlipped,
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
