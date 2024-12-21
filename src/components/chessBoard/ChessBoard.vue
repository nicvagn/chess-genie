<template>
  <div class="chess-container">
    <div class="chessboard-wrapper">
      <div
        class="chessboard border border-none rounded-lg"
        ref="board"
        @mousedown="startDrag"
        @mouseup="endDrag"
        @mousemove="handleMouseMove"
        @contextmenu.prevent
        :style="{ 'background-image': `url('../../public/chessboard/${selectedChessBoardImage}')` }"
      >
        <div class="chessboard-hidden" ref="hiddenBoard">
          <!-- Iterate over chessboardSquares to create each square on the chessboard -->
          <div
            v-for="(square, index) in currentBoardSquares"
            :key="square"
            class="square"
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
              :style="{ color: chess.squareColor(square) === 'light' ? 'black' : 'white' }"
              >{{ square }}</span
            >

            <!-- Highlighted Square -->
            <svg
              v-if="highlightedSquares[square] && highlightedSquares[square].type !== 'move'"
              class="highlight-square"
            >
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
              />
            </svg>

            <!-- Highlight legal moves (small circle) -->
            <div
              v-if="
                legalMovesHighlight[square] && legalMovesHighlight[square].type === 'legalMoves'
              "
              class="highlight-circle"
            ></div>

            <!-- highlight Attackers Square -->
            <svg
              v-if="
                showAttackerHighlights && attackersDefendersHighlights[square]?.type === 'attack'
              "
              class="highlight-square"
            >
              <rect
                width="90%"
                height="90%"
                x="3"
                y="3"
                rx="10"
                ry="10"
                fill="none"
                :stroke="attackersDefendersHighlights[square].color"
                stroke-width="2.5"
              />
            </svg>

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
          <g v-for="(arrow, index) in arrows" :key="index">
            <marker
              :id="`arrowhead-${index}`"
              refX="1.25"
              refY="1.25"
              markerWidth="2"
              markerHeight="2.5"
              orient="auto"
            >
              <polygon points="0.3 0, 2 1.25, 0.3 2.5" :fill="arrow.color" />
            </marker>
            <line
              :x1="arrow.start.x"
              :y1="arrow.start.y"
              :x2="arrow.end.x"
              :y2="arrow.end.y"
              :marker-end="`url(#arrowhead-${index})`"
              filter="url(#drop-shadow)"
              stroke-width="10"
              :stroke="arrow.color"
              fill="none"
              opacity="0.7"
            />
          </g>
        </svg>

        <!-- Promotion dialog -->
        <div v-if="showPromotionDialog" class="dialog-overlay" @mousedown.stop>
          <div class="dialog-modal" @mousedown.stop>
            <img
              v-for="(piece, symbol) in promotionPieces"
              :key="symbol"
              :src="`../../public/pieces/${selectedChessPieceSet}/${chess.turn()}${symbol.toUpperCase()}.svg`"
              :alt="symbol"
              class="promotion-image"
              @click="promotePawn(symbol)"
            />
            <button
              class="relative mb-12 text-gray-600 hover:text-red-600 bg-transparent rounded-full transition duration-150 ease-in-out"
              @click="
                () => {
                  showPromotionDialog = !showPromotionDialog
                  deselectSquare()
                }
              "
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <SettingsDialog
          v-if="showSettingsDialog"
          @close="showSettingsDialog = false"
          :selectedChessPieceSet="selectedChessPieceSet"
          :selectedChessBoardImage="selectedChessBoardImage"
          :chessPieceSet="chessPieceSet"
          :chessBoardImage="chessBoardImage"
          :showAttackers="showAttackerHighlights"
          @updatePieceSet="updatePieceSet"
          @updateBoardImage="updateBoardImage"
          @updateShowAttackers="updateShowAttackers"
        />

        <!-- Game result dialog -->
        <div v-if="showResultDialog" class="dialog-overlay" @mousedown.stop>
          <div class="dialog-modal" @mousedown.stop>
            <p class="font-extrabold text-gray-300">{{ resultDialogMessage }}</p>
            <button
              class="relative mb-12 text-gray-600 hover:text-red-600 bg-transparent rounded-full transition duration-150 ease-in-out"
              @click="showResultDialog = !showResultDialog"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
        <ChessboardEditor v-if="showEditor" @loadFEN="setPositionFromFEN" />
      </div>

      <div class="flex justify-end mt-1">
        <button @click="showEditor = !showEditor" class="mr-1 text-gray-600">
          <font-awesome-icon icon="fa-solid fa-chess-board" />
        </button>
        <button @click="resetLocalStorage" class="mr-1 text-gray-600">
          <font-awesome-icon icon="fa-solid fa-trash" />
        </button>
        <button @click="flipBoard" class="mr-1 text-gray-600">
          <font-awesome-icon icon="fa-solid fa-repeat" />
        </button>
        <button @click="showSettingsDialog = true" class="text-gray-600">
          <font-awesome-icon icon="fa-solid fa-gear" />
        </button>
      </div>
    </div>
    <div class="ml-3">
      <MoveHistory :moves="moveHistory" :onNavigate="navigateToMove" />
    </div>
  </div>
</template>

<script setup>
import { Chess, SQUARES } from 'chess.js'
import { computed, onMounted, ref, watch } from 'vue'
import ChessboardEditor from './ChessboardEditor.vue'
import MoveHistory from './MoveHistory.vue'
import SettingsDialog from './SettingsDialog.vue'

const showEditor = ref(false)

const chess = ref(new Chess())
const boardState = ref({}) // Use an object to map square to pieces.
const highlightedSquares = ref({})
const isFlipped = ref(false)
const selectedCell = ref(null)
const legalMovesForDraggingPiece = ref([])
const legalMovesHighlight = ref({})

const moveHistory = ref([])
const lastMoveInfo = ref({ from: null, to: null, piece: null })
const activeMoveIndex = ref(null)

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

const initialFEN = ref('6k1/5pp1/2R4p/1PR5/8/6P1/1PPr1r1P/6K1 b - - 0 28')

const arrows = ref([])
const currentArrow = ref(null)
const isDragging = ref(false)
const dragStartCell = ref(null)

const showSettingsDialog = ref(false)

const updatePieceSet = (newValue) => {
  selectedChessPieceSet.value = newValue
}

const updateBoardImage = (newValue) => {
  selectedChessBoardImage.value = newValue
}

const updateShowAttackers = (newValue) => {
  showAttackerHighlights.value = newValue
}

const showPromotionDialog = ref(false)
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

const showResultDialog = ref(false)
const resultDialogMessage = ref('')
const showAttackerHighlights = ref(true)
const attackersDefendersHighlights = ref({})

const checkGameResult = () => {
  if (chess.value.isGameOver()) {
    const result = chess.value.isCheckmate()
      ? `${chess.value.turn() === 'w' ? 'Black' : 'White'} wins by Checkmate!`
      : chess.value.isStalemate()
        ? 'Stalemate!'
        : chess.value.isInsufficientMaterial()
          ? 'Draw by Insufficient Material!'
          : chess.value.isThreefoldRepetition()
            ? 'Draw by 3-fold Repetition!'
            : ''
    showGameResultDialog(result)
  }
}

const showGameResultDialog = (resultMessage) => {
  resultDialogMessage.value = resultMessage
  showResultDialog.value = !showResultDialog.value
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
      if (event.altKey && event.shiftKey) {
        currentArrow.value = {
          start: getSquareCenter(dragStartCell.value.row, dragStartCell.value.column),
          end: null,
          color: colors.altShift,
        }
      } else if (event.ctrlKey) {
        currentArrow.value = {
          start: getSquareCenter(dragStartCell.value.row, dragStartCell.value.column),
          end: null,
          color: colors.ctrl,
        }
      } else if (event.shiftKey) {
        currentArrow.value = {
          start: getSquareCenter(dragStartCell.value.row, dragStartCell.value.column),
          end: null,
          color: colors.shift,
        }
      } else if (event.altKey) {
        currentArrow.value = {
          start: getSquareCenter(dragStartCell.value.row, dragStartCell.value.column),
          end: null,
          color: colors.alt,
        }
      }
    }
  }
}

const endDrag = () => {
  if (arrows.value && currentArrow.value && currentArrow.value.end) {
    const existingArrowIndex = arrows.value.findIndex(
      (arrow) =>
        arrow.color === currentArrow.value.color &&
        arrow.start.x === currentArrow.value.start.x &&
        arrow.start.y === currentArrow.value.start.y &&
        arrow.end.x === currentArrow.value.end.x &&
        arrow.end.y === currentArrow.value.end.y,
    )
    if (existingArrowIndex !== -1) {
      // Remove the existing arrow of the same color and position
      arrows.value.splice(existingArrowIndex, 1)
    } else {
      // If no existing arrow, add the new one
      arrows.value.push(currentArrow.value)
    }
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

  if (event.button === 0) {
    if (event.altKey && event.shiftKey) toggleHighlight(colors.altShift)
    else if (event.ctrlKey) toggleHighlight(colors.ctrl)
    else if (event.shiftKey) toggleHighlight(colors.shift)
    else if (event.altKey) toggleHighlight(colors.alt)
  }
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

const deselectSquare = () => {
  highlightedSquares.value = {}
  legalMovesHighlight.value = {}
  selectedCell.value = null
  attackersDefendersHighlights.value = {}
}

const movePiece = (fromSquare, toSquare) => {
  const validMove = chess.value
    .moves({ square: fromSquare, verbose: true })
    .find((move) => move.to === toSquare)

  if (validMove) {
    handleCastling(validMove)
    handleEnPassant(validMove, toSquare)

    // Handle pawn promotion
    if (validMove.piece === 'p' && (toSquare.charAt(1) === '8' || toSquare.charAt(1) === '1')) {
      showPromotionDialog.value = true
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

    const moveEntry = {
      san: validMove.san,
      before: validMove.before,
      after: validMove.after,
      color: validMove.color,
      from: validMove.from,
      to: validMove.to,
      variations: [],
    }

    // Add move to history
    if (activeMoveIndex.value !== null) {
      // If there is an active move, append the new move as a variation
      moveHistory.value[activeMoveIndex.value].variations.push(moveEntry)
      activeMoveIndex.value = null
    } else {
      // If no active move, just push the move as a new entry
      moveHistory.value.push(moveEntry)
    }

    // Save current state of the game to localStorage
    saveGameState()

    checkGameResult()

    // Deselect after move
    deselectSquare()
    arrows.value = null
  } else {
    // Deselect if it's wrong move
    deselectSquare()
  }
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

  checkGameResult()
  showPromotionDialog.value = false
  promotionSquare.value = null
  arrows.value = null
  deselectSquare()
}

const getAttackersAndDefenders = (square) => {
  const currentColor = chess.value.turn() // Get the current player's turn color
  const opponentColor = currentColor === 'w' ? 'b' : 'w' // Get the opponent's color
  const attackers = chess.value.attackers(square, opponentColor)
  const defenders = chess.value.attackers(square)

  return { attackers, defenders }
}

const highlightAttackerSquares = (event) => {
  if (!showAttackerHighlights.value) return
  const squareInfo = getSquareInfoFromMouseEvent(event)

  if (legalMovesForDraggingPiece.value.includes(squareInfo.name)) {
    const { attackers } = getAttackersAndDefenders(squareInfo.name)

    Object.keys(attackersDefendersHighlights.value)
      .filter((square) => attackersDefendersHighlights.value[square]?.type === 'attack')
      .forEach((square) => delete attackersDefendersHighlights.value[square])

    attackers.forEach((attacker) => {
      attackersDefendersHighlights.value[attacker] = { color: 'red', type: 'attack' }
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
    activeMoveIndex.value = index
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

const resetLocalStorage = () => {
  localStorage.removeItem('chessGamePosition')
  localStorage.removeItem('moveHistory')
  localStorage.removeItem('selectedChessPieceSet')
  localStorage.removeItem('selectedChessBoardImage')

  chess.value.reset()
  moveHistory.value = []
  setPositionFromFEN(initialFEN.value)

  selectedCell.value = null
  highlightedSquares.value = {}
  legalMovesHighlight.value = {}
  lastMoveInfo.value = {}
  arrows.value = []
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
setPositionFromFEN(initialFEN.value)
</script>

<style scoped>
.chess-container {
  display: flex;
}

.chessboard-wrapper {
  display: flex;
  flex-direction: column;
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

.square {
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
  z-index: 0;
}

.draw-arrows {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.selected {
  background-color: rgba(20, 85, 30, 0.5);
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
  top: 50%;
  left: 50%;
  z-index: 10;
  display: flex;
  position: inherit;
  flex-wrap: nowrap;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.5);
}

.promotion-image {
  width: 80px;
  height: auto;
  max-width: 100px;
  position: relative;
}

.promotion-image:hover {
  background-color: rgba(20, 85, 30, 0.5);
}

.highlight-attack {
  position: absolute;
  width: 100%;
  height: 100%;
}
</style>
