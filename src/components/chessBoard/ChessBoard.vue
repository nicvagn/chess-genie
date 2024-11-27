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
          @click="handleCellClick(rowIndex, colIndex, $event)"
        >
          <!-- Highlighted Square -->
          <svg v-if="highlights[rowIndex][colIndex]" class="highlight-square">
            <!-- Define the drop shadow filter -->
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

            <!-- Rectangle with drop shadow applied -->
            <rect
              width="90%"
              height="90%"
              x="3"
              y="3"
              rx="10"
              ry="10"
              fill="none"
              :stroke="highlights[rowIndex][colIndex].color"
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
          />
        </div>
      </div>
      <!-- Arrow indicating piece movement -->
      <svg class="movement-arrow">
        <g
          v-for="(arrow, index) in arrows"
          :key="index"
          stroke-width="5"
          stroke="rgba(67, 101, 224, 0.6)"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line
            :x1="arrow.start.x"
            :y1="arrow.start.y"
            :x2="arrow.end.x"
            :y2="arrow.end.y"
            marker-end="url(#arrowhead)"
            filter="url(#drop-shadow)"
          />
        </g>
        <defs>
          <marker
            id="arrowhead"
            viewBox="0 0 5 5"
            refX="2.5"
            refY="2.5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <polygon
              points="0,5 1.6666666666666667,2.5 0,0 5,2.5"
              fill="rgba(67, 101, 224, 0.5)"
            ></polygon>
          </marker>
        </defs>
      </svg>
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
const highlights = ref(
  Array(8)
    .fill(null)
    .map(() => Array(8).fill(null)),
)
const isFlipped = ref(false)
const selectedCell = ref(null)

const chessPieceSet = { cardinal: 'Cardinal', staunty: 'Staunty', merida: 'Merida' }
const selectedChessPieceSet = ref('Cardinal')

const arrows = ref([])
const currentArrow = ref(null)
const isDragging = ref(false)
const dragStartCell = ref(null)

const startDrag = (event) => {
  const targetCell = getCellUnderMouse(event)

  if (targetCell) {
    dragStartCell.value = targetCell
    isDragging.value = true

    currentArrow.value = {
      start: getSquareCenter(dragStartCell.value.row, dragStartCell.value.col),
      end: null,
    }
  }
}

const handleMouseMove = (event) => {
  if (isDragging.value && dragStartCell.value) {
    const targetCell = getCellUnderMouse(event)
    if (targetCell) {
      currentArrow.value.end = getSquareCenter(targetCell.row, targetCell.col)
    }
  }
}

const getCellUnderMouse = (event) => {
  const rect = board.value.getBoundingClientRect()
  const squareSize = rect.width / 8

  const colIndex = Math.floor((event.clientX - rect.left) / squareSize)
  const rowIndex = Math.floor((event.clientY - rect.top) / squareSize)

  return { row: rowIndex, col: colIndex }
}

const getSquareCenter = (row, col) => ({
  x: (col + 0.5) * (board.value.offsetWidth / 8),
  y: (row + 0.5) * (board.value.offsetHeight / 8),
})

const endDrag = () => {
  if (currentArrow.value && currentArrow.value.end) {
    arrows.value.push(currentArrow.value)
  }
  currentArrow.value = null
  isDragging.value = false
  dragStartCell.value = null
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

  highlights.value = Array(8)
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

const handleCellClick = (rowIndex, colIndex, event) => {
  const existingHighlight = highlights.value[rowIndex][colIndex]

  // Define colors based on the modifier keys
  const colors = {
    ctrl: 'blue',
    shift: 'red',
    alt: 'lightgreen',
    altShift: 'yellow',
  }

  if (event.altKey && event.shiftKey) {
    if (existingHighlight) {
      if (existingHighlight.color === colors.altShift) {
        highlights.value[rowIndex][colIndex] = null
      } else {
        highlights.value[rowIndex][colIndex] = { color: colors.altShift }
      }
    } else {
      highlights.value[rowIndex][colIndex] = { color: colors.altShift }
    }
  } else if (event.ctrlKey) {
    if (existingHighlight) {
      if (existingHighlight.color === colors.ctrl) {
        highlights.value[rowIndex][colIndex] = null
      } else {
        highlights.value[rowIndex][colIndex] = { color: colors.ctrl }
      }
    } else {
      highlights.value[rowIndex][colIndex] = { color: colors.ctrl }
    }
  } else if (event.shiftKey) {
    if (existingHighlight) {
      if (existingHighlight.color === colors.shift) {
        highlights.value[rowIndex][colIndex] = null
      } else {
        highlights.value[rowIndex][colIndex] = { color: colors.shift }
      }
    } else {
      highlights.value[rowIndex][colIndex] = { color: colors.shift }
    }
  } else if (event.altKey) {
    if (existingHighlight) {
      if (existingHighlight.color === colors.alt) {
        highlights.value[rowIndex][colIndex] = null
      } else {
        highlights.value[rowIndex][colIndex] = { color: colors.alt }
      }
    } else {
      highlights.value[rowIndex][colIndex] = { color: colors.alt }
    }
  } else {
    // Handle the normal piece moving logic
    if (selectedCell.value) {
      const targetCell = boardState.value[rowIndex][colIndex]
      const selectedPiece = boardState.value[selectedCell.value.row][selectedCell.value.col]

      if (targetCell === null || targetCell[0] !== selectedPiece[0]) {
        boardState.value[rowIndex][colIndex] = selectedPiece
        boardState.value[selectedCell.value.row][selectedCell.value.col] = null
      }

      selectedCell.value = null
      arrows.value = []
    } else {
      if (boardState.value[rowIndex][colIndex]) {
        selectedCell.value = { row: rowIndex, col: colIndex }
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

  highlights.value = highlights.value
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

.highlight-square {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.selected {
  background-color: rgba(0, 136, 255, 0.461);
}
.movement-arrow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
