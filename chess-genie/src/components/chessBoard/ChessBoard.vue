<!-- ChessBoard.vue -->
<template>
  <div id="app">
    <div class="board">
      <div v-for="(row, rowIndex) in chessBoardStore.board" :key="rowIndex" class="board-row">
        <div
          v-for="(cell, colIndex) in row"
          :key="colIndex"
          class="board-cell"
          :class="{
            light: (rowIndex + colIndex) % 2 === 0,
            dark: (rowIndex + colIndex) % 2 !== 0,
            check:
              chessBoardStore.isKingInCheck(chessBoardStore.currentPlayer)?.row === rowIndex &&
              chessBoardStore.isKingInCheck(chessBoardStore.currentPlayer)?.col === colIndex,
          }"
          @dragover.prevent
          @drop="chessBoardStore.onDrop(rowIndex, colIndex)"
        >
          <div
            v-if="
              chessBoardStore.validMoves.some(
                (move) => move.row === rowIndex && move.col === colIndex,
              )
            "
            class="valid-move-indicator"
          ></div>
          <img
            v-if="cell"
            :src="`../public/img/${chessPieceMap[cell]}.svg`"
            :draggable="true"
            @drag="chessBoardStore.onDrag(cell, rowIndex, colIndex)"
            class="piece"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useChessBoardStore } from '@/stores/useChessBoardStore'

export default {
  setup() {
    const chessBoardStore = useChessBoardStore()

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

    return {
      chessBoardStore,
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

.check {
  background-color: #413f3fa5;
  background-image: linear-gradient(135deg, #fd5353 25%, transparent 25%),
    linear-gradient(225deg, #fd5353 25%, transparent 25%),
    linear-gradient(45deg, #fd5353 25%, transparent 25%),
    linear-gradient(315deg, #fd5353 25%, #a02020be 25%);
  background-position:
    20px 0,
    20px 0,
    0 0,
    0 0;
  background-size: 20px 20px;
  background-repeat: repeat;
}
</style>
