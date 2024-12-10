<template>
  <div class="chess-container">
    <div class="chessboard-wrapper">
      <div
        class="chessboard"
        ref="board"
        @mousedown="startDrag"
        @mouseup="endDrag"
        @mousemove="handleMouseMove"
        :style="{ 'background-image': `url('../../public/chessboard/${selectedChessBoardImage}')` }"
      >
        <div class="chessboard-hidden" ref="hiddenBoard">
          <!-- Iterate over chessboardSquares to create each cell on the chessboard -->
          <div
            v-for="(square, index) in currentBoardSquares"
            :key="square"
            class="chess-cell"
            :class="{
              'king-check': getKingInCheck(square),
              'last-move': lastMoveInfo.from === square || lastMoveInfo.to === square,
            }"
            @dragover="handleDragOver"
            @drop="handleDrop(square)"
            @click="handleCellClick(square, $event)"
          >
            <span
              class="square-coordinates"
              :style="{ color: Math.floor(index / 8) % 2 !== index % 2 ? 'white' : 'black' }"
              >{{ square }}</span
            >

            <!-- Highlighted Square -->
            <svg
              v-if="highlightedSquares[square] && highlightedSquares[square].type !== 'move'"
              class="highlight-square"
            >
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
              <rect
                width="90%"
                height="90%"
                x="3"
                y="3"
                rx="10"
                ry="10"
                fill="none"
                :stroke="highlightedSquares[square].color"
                stroke-width="2.5"
                filter="url(#drop-shadow)"
              />
            </svg>

            <!-- Highlighted move (small circle) -->
            <div
              v-if="
                legalMovesHighlight[square] && legalMovesHighlight[square].type === 'legalMoves'
              "
              class="highlight-circle"
            ></div>

            <!-- Chess piece image -->
            <img
              v-if="boardState[square]"
              :src="`../../public/pieces/${selectedChessPieceSet}/${boardState[square]}.svg`"
              :alt="boardState[square]"
              class="chess-piece"
              :class="{
                selected: selectedCell === square,
              }"
              @dragstart="startDrag"
              :draggable="boardState[square] !== null"
              @drag="highlightAttackerSquares"
            />
          </div>
        </div>

        <!-- Arrow -->
        <svg class="draw-arrows">
          <g
            v-for="(arrow, index) in arrows"
            :key="index"
            stroke-width="5"
            :stroke="arrow.color"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            opacity="0.7"
          >
            <line
              :x1="arrow.start.x"
              :y1="arrow.start.y"
              :x2="arrow.end.x"
              :y2="arrow.end.y"
              :marker-end="`url(#arrowhead-${index})`"
              filter="url(#drop-shadow)"
            />
            <defs>
              <marker
                :id="`arrowhead-${index}`"
                viewBox="0 0 6 6"
                refX="3"
                refY="3"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
                overflow="visible"
              >
                <polyline
                  points="0,3 3,1.5 0,0"
                  fill="none"
                  stroke-width="1"
                  :stroke="arrow.color"
                  stroke-linecap="round"
                  transform="matrix(1,0,0,1,1,1.5)"
                  stroke-linejoin="round"
                ></polyline>
              </marker>
            </defs>
          </g>
        </svg>

        <!-- Promotion Modal -->
        <div v-if="showPromotionModal" class="promotion-modal" @mousedown.stop>
          <div class="promotion-options">
            <div
              v-for="(piece, symbol) in promotionPieces"
              :key="symbol"
              class="promotion-option"
              @click="promotePawn(symbol)"
            >
              <img
                :src="`../../public/pieces/${selectedChessPieceSet}/${chess.turn()}${symbol.toUpperCase()}.svg`"
                :alt="symbol"
                class="promotion-image"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="ml-3 mt-3">
      <button
        class="inline-block rounded border border-indigo-600 px-2 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-600 hover:text-white focus:outline-none focus:ring"
        @click="flipBoard"
      >
        Flip Board
      </button>
      <select
        class="text-indigo-600 border border-indigo-600 hover:bg-indigo-600 hover:text-white focus:outline-none focus:ring font-medium rounded text-sm px-2 py-2 text-center inline-flex items-center"
        v-model="selectedChessPieceSet"
      >
        <option v-for="[key, value] in Object.entries(chessPieceSet)" :key="key" :value="value">
          {{ value }}
        </option>
      </select>
      <select
        class="text-indigo-600 border border-indigo-600 hover:bg-indigo-600 hover:text-white focus:outline-none focus:ring font-medium rounded text-sm px-2 py-2 text-center inline-flex items-center"
        v-model="selectedChessBoardImage"
      >
        <option v-for="[key, value] in Object.entries(chessBoardImage)" :key="key" :value="value">
          {{ key }}
        </option>
      </select>
    </div>
    <div class="ml-3">
      <MoveHistory :moves="moveHistory" :onNavigate="navigateToMove" />
    </div>
  </div>
</template>

<script setup>
import { Chess, SQUARES } from 'chess.js'
import { computed, onMounted, ref, watch } from 'vue'
import MoveHistory from './MoveHistory.vue'

const chess = ref(new Chess())
const boardState = ref({}) // Use an object to map square to pieces.
const highlightedSquares = ref({})
const isFlipped = ref(false)
const selectedCell = ref(null)
const legalMovesForDraggingPiece = ref([])
const legalMovesHighlight = ref({})

const moveHistory = ref([])
const lastMoveInfo = ref({ from: null, to: null, piece: null })

const chessBoardSquares = SQUARES
const currentBoardSquares = computed(() =>
  isFlipped.value ? chessBoardSquares.slice().reverse() : chessBoardSquares,
)

const chessPieceSet = { cardinal: 'Cardinal', staunty: 'Staunty', merida: 'Merida' }
const selectedChessPieceSet = ref('Cardinal')

const chessBoardImage = {
  blue: 'blue.png',
  blue2: 'blue2.jpg',
  brown: 'brown.png',
  greenPlastic: 'green-plastic.png',
  green: 'green.png',
  grey: 'grey.jpg',
  ic: 'ic.png',
  marble: 'marble.jpg',
  olive: 'olive.jpg',
  wood: 'wood.jpg',
  wood2: 'wood2.jpg',
  wood4: 'wood4.jpg',
}
const selectedChessBoardImage = ref('blue2.jpg')

const arrows = ref([])
const currentArrow = ref(null)
const currentArrowColor = ref(null)
const isDragging = ref(false)
const dragStartCell = ref(null)

const showPromotionModal = ref(false)
const promotionPieces = ref({
  q: 'Queen',
  r: 'Rook',
  b: 'Bishop',
  n: 'Knight',
})
const promotionSquare = ref(null) // To keep track of where the promotion happens

const colors = {
  ctrl: 'blue',
  shift: 'red',
  alt: 'green',
  altShift: 'yellow',
}

const startDrag = (event) => {
  const targetCell = getSquareInfoFromMouseEvent(event)
  if (targetCell) {
    isDragging.value = true
    dragStartCell.value = targetCell
    selectedCell.value = targetCell.name
    if (event.button === 0) {
      // Left button for selecting pieces
      legalMovesForDraggingPiece.value = chess.value
        .moves({ square: targetCell.name, verbose: true })
        .map((move) => move.to)

      legalMovesForDraggingPiece.value.forEach((move) => {
        legalMovesHighlight.value[move] = { color: 'green', type: 'legalMoves' }
      })
    } else if (event.button === 2) {
      if (event.altKey && event.shiftKey) currentArrowColor.value = colors.altShift
      else if (event.ctrlKey) currentArrowColor.value = colors.ctrl
      else if (event.shiftKey) currentArrowColor.value = colors.shift
      else if (event.altKey) currentArrowColor.value = colors.alt
      else currentArrowColor.value = null

      currentArrow.value = {
        start: getSquareCenter(dragStartCell.value.row, dragStartCell.value.column),
        end: null,
        color: currentArrowColor.value,
      }
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
    const targetCell = getSquareInfoFromMouseEvent(event)
    if (targetCell && currentArrow.value) {
      currentArrow.value.end = getSquareCenter(targetCell.row, targetCell.column)
    }
  }
}

const handleDragOver = (event) => {
  event.preventDefault() // Allow the drop
}

const handleDrop = (toSquare) => {
  if (selectedCell.value) {
    movePiece(selectedCell.value, toSquare)
  }
}

const handleCellClick = (square, event) => {
  if (selectedCell.value === square) {
    legalMovesHighlight.value = {}
  }
  const existingHighlight = highlightedSquares.value[square]

  const toggleHighlight = (color) => {
    highlightedSquares.value[square] = existingHighlight?.color === color ? null : { color }
  }

  if (event.altKey && event.shiftKey) toggleHighlight(colors.altShift)
  else if (event.ctrlKey) toggleHighlight(colors.ctrl)
  else if (event.shiftKey) toggleHighlight(colors.shift)
  else if (event.altKey) toggleHighlight(colors.alt)
}

// Function to get the center coordinates of a square on the chessboard
const getSquareCenter = (row, column) => {
  const boardElement = document.querySelector('.chessboard-hidden')
  const rect = boardElement.getBoundingClientRect()
  const squareSize = rect.width / 8
  const x = rect.left + column * squareSize + squareSize / 2
  const y = rect.top + row * squareSize + squareSize / 2
  return { x, y }
}

const movePiece = (fromSquare, toSquare) => {
  const validMove = chess.value
    .moves({ square: fromSquare, verbose: true })
    .find((move) => move.to === toSquare)

  console.log(validMove)

  if (validMove) {
    handleCastling(validMove)
    handleEnPassant(validMove, toSquare)

    // Handle pawn promotion
    if (validMove.piece === 'p' && (toSquare.charAt(1) === '8' || toSquare.charAt(1) === '1')) {
      showPromotionModal.value = true
      promotionSquare.value = toSquare
      return
    }

    // Regular move
    chess.value.move({ from: fromSquare, to: toSquare })
    boardState.value[toSquare] = boardState.value[fromSquare]
    boardState.value[fromSquare] = null

    lastMoveInfo.value = {
      from: fromSquare,
      to: toSquare,
      piece: boardState.value[toSquare],
    }

    // Add move to history
    moveHistory.value.push({
      san: validMove.san,
      before: validMove.before,
      after: validMove.after,
      color: validMove.color,
      from: validMove.from,
      to: validMove.to,
    })

    // Save current state of the game to localStorage
    saveGameState()
  }
  // Deselect after move
  highlightedSquares.value = {}
  legalMovesHighlight.value = {}
  selectedCell.value = null
}

const promotePawn = (symbol) => {
  const color = chess.value.turn()

  const legalMoves = chess.value.moves({ square: selectedCell.value, verbose: true })

  if (legalMoves) {
    const promotionMove = chess.value.move({
      from: selectedCell.value,
      to: promotionSquare.value,
      promotion: symbol,
    })
    boardState.value[promotionSquare.value] = `${color}${symbol.toUpperCase()}`
    boardState.value[selectedCell.value] = null

    lastMoveInfo.value = {
      from: selectedCell.value,
      to: promotionSquare.value,
      piece: boardState.value[promotionMove.to],
    }

    // Add move to history
    moveHistory.value.push({
      san: promotionMove.san,
      before: promotionMove.before,
      after: promotionMove.after,
      color: promotionMove.color,
      from: promotionMove.from,
      to: promotionMove.to,
    })

    // Save current state of the game to localStorage
    saveGameState()
  }

  showPromotionModal.value = false
  promotionSquare.value = null
  highlightedSquares.value = {}
  legalMovesHighlight.value = {}
  selectedCell.value = null
}

const getAttackersAndDefenders = (square) => {
  const currentColor = chess.value.turn() // Get the current player's turn color
  const opponentColor = currentColor === 'w' ? 'b' : 'w' // Get the opponent's color
  const attackers = chess.value.attackers(square, opponentColor)
  const defenders = chess.value.attackers(square)

  return { attackers, defenders }
}

const highlightAttackerSquares = (event) => {
  const squareInfo = getSquareInfoFromMouseEvent(event)

  if (legalMovesForDraggingPiece.value.includes(squareInfo.name)) {
    const { attackers } = getAttackersAndDefenders(squareInfo.name)

    Object.keys(highlightedSquares.value)
      .filter((square) => highlightedSquares.value[square]?.type === 'attack')
      .forEach((square) => delete highlightedSquares.value[square])

    attackers.forEach((attacker) => {
      highlightedSquares.value[attacker] = { color: 'red', type: 'attack' }
    })
  }
}

const getSquareInfoFromMouseEvent = (event) => {
  const boardElement = document.querySelector('.chessboard-hidden')
  const rect = boardElement.getBoundingClientRect()
  const squareSize = rect.width / 8
  const column = isFlipped.value
    ? 7 - Math.floor((event.clientX - rect.left) / squareSize)
    : Math.floor((event.clientX - rect.left) / squareSize)
  const row = isFlipped.value
    ? 7 - Math.floor((event.clientY - rect.top) / squareSize)
    : Math.floor((event.clientY - rect.top) / squareSize)
  return { row, column, name: chessBoardSquares[row * 8 + column] }
}

// Function to get locations of given piece by name and color
const getPieceLocations = (pieceName, pieceColor) => {
  return chessBoardSquares.filter((square) => {
    const piece = chess.value.get(square)
    return piece && piece.color === pieceColor && piece.type === pieceName
  })
}

// Helper function to get the king's position when in check
const getKingInCheck = (square) => {
  if (chess.value.isCheck()) {
    const kingPosition = getPieceLocations('k', chess.value.turn())[0] // Get the opponent's king position
    return kingPosition === square
  }
  return false
}

// Function to get the king's left and right squares
const getKingAdjacentSquares = (kingPosition) => {
  const file = kingPosition.charAt(0) // Extract the file (letter)
  const rank = parseInt(kingPosition.charAt(1)) // Extract the rank (number)
  const files = 'abcdefgh'.split('') // List of valid files (columns)
  const fileIndex = files.indexOf(file) // Get the index of the king's current file

  return { left: files[fileIndex - 1] + rank, right: files[fileIndex + 1] + rank }
}

// Handle both-side castling - update the rook position
const handleCastling = (validMove) => {
  if (validMove.flags.includes('k') || validMove.flags.includes('q')) {
    const color = validMove.color
    const rookFromSquare = getPieceLocations('r', color)[validMove.flags.includes('k') ? 1 : 0]
    const kingPosition = getPieceLocations('k', color)[0]
    const kingAdjacentSquares = getKingAdjacentSquares(kingPosition)
    const rookToSquare = validMove.flags.includes('k')
      ? kingAdjacentSquares.right
      : kingAdjacentSquares.left

    boardState.value[rookToSquare] = boardState.value[rookFromSquare]
    boardState.value[rookFromSquare] = null
  }
}

// Handle en passant - remove the captured pawn
const handleEnPassant = (validMove, actualToSquare) => {
  if (validMove.flags.includes('e')) {
    const capturedPawnSquare =
      actualToSquare.charAt(0) +
      (parseInt(actualToSquare.charAt(1)) + (chess.value.turn() === 'w' ? -1 : 1))
    boardState.value[capturedPawnSquare] = null
  }
}

const navigateToMove = (index) => {
  // Get the FEN from moveHistory at the specified index
  const selectedMove = moveHistory.value[index]
  if (selectedMove) {
    lastMoveInfo.value = {
      from: selectedMove.from,
      to: selectedMove.to,
      piece: boardState.value[selectedMove.to],
    }
    setPositionFromFEN(selectedMove.after)
  }
}

const setPositionFromFEN = (fen) => {
  chess.value.load(fen) // Load FEN into chess.js

  // Map chess.js pieces to boardState
  for (const square of chessBoardSquares) {
    const piece = chess.value.get(square)
    if (piece) {
      boardState.value[square] = piece.color + piece.type.toUpperCase() // e.g., 'wR', 'bN'
    } else {
      boardState.value[square] = null
    }
  }
}

const flipBoard = () => {
  isFlipped.value = !isFlipped.value
}

const saveGameState = () => {
  // Save the current position (FEN string)
  localStorage.setItem('chessGamePosition', chess.value.fen())

  // Save the move history
  localStorage.setItem('moveHistory', JSON.stringify(moveHistory.value))
}

// On component mounted, check local storage
onMounted(() => {
  const storedPieceSet = localStorage.getItem('selectedChessPieceSet')
  if (storedPieceSet) selectedChessPieceSet.value = storedPieceSet

  const storedChessBoardImage = localStorage.getItem('selectedChessBoardImage')
  if (storedChessBoardImage) selectedChessBoardImage.value = storedChessBoardImage

  const savedPosition = localStorage.getItem('chessGamePosition')
  if (savedPosition) {
    chess.value.load(savedPosition)
    setPositionFromFEN(savedPosition)
  }

  const savedMoveHistory = localStorage.getItem('moveHistory')
  if (savedMoveHistory) {
    moveHistory.value = JSON.parse(savedMoveHistory) // Restore the move history
  }
})

// Watch for changes and save to local storage
watch(selectedChessPieceSet, (newPieceSet) => {
  localStorage.setItem('selectedChessPieceSet', newPieceSet)
})

watch(selectedChessBoardImage, (newChessBoardImage) => {
  localStorage.setItem('selectedChessBoardImage', newChessBoardImage)
})

// Initial Board Position
setPositionFromFEN('rnb1k2r/ppppqpPp/5n2/2b1b3/2B1P3/5N2/PPPP1PpP/RNBQK2R w KQkq - 6 5')
</script>

<style scoped>
.chess-container {
  display: flex;
}

.chessboard-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.chessboard {
  width: 500px;
  height: 500px;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  position: relative;
  user-select: none;
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
}

.selected {
  background-color: rgba(20, 85, 30, 0.5);
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
  font-weight: lighter;
  pointer-events: none;
  user-select: none;
}

.king-check {
  background: radial-gradient(
    ellipse at center,
    rgba(255, 0, 0, 1) 0%,
    rgba(231, 0, 0, 1) 25%,
    rgba(221, 0, 0, 1) 45%,
    rgba(169, 0, 0, 0) 80%,
    rgba(158, 0, 0, 0) 100%
  );
}

.last-move {
  background-color: rgba(155, 199, 0, 0.41);
}

.highlight-circle {
  position: absolute;
  width: 20px;
  height: 20px;
  background-color: rgba(0, 128, 0, 0.8);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.promotion-modal {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  border: 2px solid #000;
  padding: 1em;
  z-index: 1000;
}

.promotion-options {
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin: 10px 0;
  cursor: pointer;
}

.promotion-image {
  width: 50px;
  height: auto;
  margin: 0 5px;
  border: 2px solid transparent;
  transition: border 0.3s;
}

.promotion-image:hover {
  border-color: blue;
}
</style>
