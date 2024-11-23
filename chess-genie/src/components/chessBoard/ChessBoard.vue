<!-- ChessBoard.vue -->
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
import { getValidMoves, isValidMove } from '@/moveValidation/moveValidation'
import { ref } from 'vue'
import { parseFEN } from './parseFEN'

export default {
  setup() {
    const fenString = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    const activeColor = parseFEN(fenString).activeColor
    const board = ref(parseFEN(fenString).board)
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

    const currentPlayer = ref(activeColor)
    const draggedPiece = ref(null)
    const draggedFrom = ref({ row: null, col: null })
    const validMoves = ref([])

    const switchTurn = () => {
      currentPlayer.value = currentPlayer.value === 'w' ? 'b' : 'w'
    }

    const onDrag = (piece, row, col) => {
      draggedPiece.value = piece
      draggedFrom.value = { row, col }
      validMoves.value = getValidMoves(piece, row, col, board.value)
    }

    const onDrop = (rowIndex, colIndex) => {
      if (draggedPiece.value) {
        const validMove = isValidMove(
          draggedPiece.value,
          draggedFrom.value.row,
          draggedFrom.value.col,
          rowIndex,
          colIndex,
          board.value,
        )
        if (
          validMove &&
          ((currentPlayer.value === 'w' &&
            draggedPiece.value === draggedPiece.value.toUpperCase()) ||
            (currentPlayer.value === 'b' &&
              draggedPiece.value === draggedPiece.value.toLowerCase()))
        ) {
          // Move the piece to the new square
          board.value[rowIndex][colIndex] = draggedPiece.value
          // Remove the piece from the original square
          board.value[draggedFrom.value.row][draggedFrom.value.col] = null
          // Clear the dragged piece
          draggedPiece.value = null
          // Switch player turn
          switchTurn()
        } else {
          validMoves.value = []
        }
      }
      validMoves.value = []
    }

    return {
      board,
      onDrag,
      onDrop,
      chessPieceMap,
      currentPlayer,
      validMoves,
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

.valid-move-indicator {
  position: absolute;
  width: 25px;
  height: 25px;
  border-radius: 50%;
  background-color: rgba(54, 54, 54, 0.365);
  z-index: 1;
}
</style>
