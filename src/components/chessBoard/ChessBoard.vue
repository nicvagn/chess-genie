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
          <span
            class="square-coordinates"
            :style="{ color: (rowIndex + colIndex) % 2 !== 0 ? 'darkgray' : 'black' }"
            >{{ getSquareCoordinates(rowIndex, colIndex) }}</span
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
      <!-- Arrows -->
      <svg class="draw-arrows">
        <g
          v-for="(arrow, index) in arrows"
          :key="index"
          stroke-width="3.5"
          :stroke="arrow.color"
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
          />
          <defs>
            <marker
              id="arrowhead"
              viewBox="0 0 6 6"
              refX="3"
              refY="3"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <polyline
                marker-end="url(#arrowhead)"
                points="0,3 3,1.5 0,0"
                fill="none"
                stroke-width="1"
                stroke="{{ arrow.color }}"
                stroke-linecap="round"
                transform="matrix(1,0,0,1,1,1.5)"
                stroke-linejoin="round"
              ></polyline>
            </marker>
          </defs>
        </g>
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
import { Chess } from 'chess.js'
import { onMounted, ref, watch } from 'vue'

const chess = ref(new Chess())
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
const currentArrowColor = ref(null)
const isDragging = ref(false)
const dragStartCell = ref(null)

const colors = {
  ctrl: 'blue',
  shift: 'red',
  alt: 'green',
  altShift: 'yellow',
}
const startDrag = (event) => {
  const targetCell = getCellUnderMouse(event)

  if (targetCell) {
    dragStartCell.value = targetCell
    isDragging.value = true

    if (event.ctrlKey) {
      currentArrowColor.value = colors.ctrl
    } else if (event.shiftKey) {
      currentArrowColor.value = colors.shift
    } else if (event.altKey) {
      currentArrowColor.value = colors.alt
    } else {
      currentArrowColor.value
    }

    currentArrow.value = {
      start: getSquareCenter(dragStartCell.value.row, dragStartCell.value.col),
      end: null,
      color: currentArrowColor.value,
    }
  }
}

const endDrag = () => {
  if (currentArrow.value && currentArrow.value.end) {
    arrows.value.push(currentArrow.value)
  }
  currentArrow.value = null
  isDragging.value = false
  dragStartCell.value = null
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

const getSquareCoordinates = (rowIndex, colIndex) => {
  let displayRowIndex = isFlipped.value ? 7 - rowIndex : rowIndex
  let displayColIndex = isFlipped.value ? 7 - colIndex : colIndex
  const file = String.fromCharCode(97 + displayColIndex) // 'a' is char code 97
  const rank = 8 - displayRowIndex // 8 is the highest rank in chess
  return `${file}${rank}`
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
  chess.value.load(fen) // Load FEN into chess.js

  // update boardState based on the FEN-loaded position
  boardState.value = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null))

  // Map chess.js pieces to boardState
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = chess.value.board()[row][col]
      if (piece) {
        boardState.value[row][col] = piece.color + piece.type.toUpperCase() // e.g., 'wR', 'bN'
      }
    }
  }
}

const handleCellClick = (rowIndex, colIndex, event) => {
  const existingHighlight = highlights.value[rowIndex][colIndex]

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
      // Deselect the selected piece if the same square is clicked
      if (selectedCell.value.row === rowIndex && selectedCell.value.col === colIndex) {
        selectedCell.value = null
      } else {
        const selectedPiece = boardState.value[selectedCell.value.row][selectedCell.value.col]
        try {
          // try to move piece
          chess.value.move({
            from: getSquareCoordinates(selectedCell.value.row, selectedCell.value.col),
            to: getSquareCoordinates(rowIndex, colIndex),
          })
          boardState.value[rowIndex][colIndex] = selectedPiece
          boardState.value[selectedCell.value.row][selectedCell.value.col] = null
          selectedCell.value = null
          arrows.value = []
        } catch {
          // deselect piece if it's invalid move
          selectedCell.value = null
          arrows.value = []
        }
      }
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

// https://lichess.org/rv5nxLJz/white#8
setPositionFromFEN('rnb1k2r/ppppqppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQKR2 w Qkq - 6 5')
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
  /* background-color: rgba(255, 255, 255, 0.3); */
}

/* black squares */
/* .chess-row:nth-child(odd) .chess-cell:nth-child(even),
.chess-row:nth-child(even) .chess-cell:nth-child(odd) {
  background-color: rgba(0, 0, 0, 0.3);
} */

.chess-piece {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
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

.draw-arrows {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.square-coordinates {
  position: absolute;
  top: 0.5px;
  right: 0.5px;
  font-size: 14px;
  font-weight: bold;
  pointer-events: none;
  user-select: none;
}
</style>
