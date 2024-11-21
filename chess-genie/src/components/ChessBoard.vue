<template>
  <div id="app">
    <div class="board">
      <div v-for="(row, rowIndex) in board" :key="rowIndex" class="board-row">
        <div
          v-for="(cell, colIndex) in row"
          :key="colIndex"
          class="board-cell"
          :class="{ light: (rowIndex + colIndex) % 2 === 0, dark: (rowIndex + colIndex) % 2 !== 0 }"
          @dragover.prevent
          @drop="onDrop(rowIndex, colIndex)"
        >
          <img
            v-if="cell"
            :src="`../public/img/${cell}.svg`"
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
import { isValidMove } from '../moveValidation'

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

    const onDrag = (item, rowIndex, colIndex) => {
      draggedPiece.value = item
      draggedFrom.value = rowIndex * 8 + colIndex // Calculate the index 0-63
    }

    const onDrop = (rowIndex, colIndex) => {
      if (draggedPiece.value) {
        const fromRow = Math.floor(draggedFrom.value / 8)
        const fromCol = draggedFrom.value % 8

        if (isValidMove(draggedPiece.value, fromRow, fromCol, rowIndex, colIndex, board.value)) {
          board.value[rowIndex][colIndex] = draggedPiece.value

          // Clear the original position of the piece
          board.value[fromRow][fromCol] = null

          // Clear the dragged piece
          draggedPiece.value = null
          draggedFrom.value = null
        } else {
          console.warn('Invalid move for', draggedPiece.value)
          // Optionally, you can give feedback to the user about the invalid move
        }
      }
    }

    return {
      board,
      onDrag,
      onDrop,
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

.piece {
  width: 100%;
  height: auto;
  cursor: grab;
}

.piece:active {
  cursor: grabbing;
}
</style>
