<template>
  <div class="flex justify-center pt-5">
    <div ref="chessBoardContainer" class="size-96"></div>
  </div>
  <div class="flex justify-center pt-3">
    <button
      class="inline-block rounded border border-indigo-600 px-12 py-3 text-sm font-medium text-indigo-600 hover:bg-indigo-600 hover:text-white focus:outline-none focus:ring active:bg-indigo-500"
      @click="flipBoard"
    >
      Flip
    </button>
  </div>
</template>

<script setup>
import { Chess, DEFAULT_POSITION } from 'chess.js'
import { Chessground } from 'chessground'
import { onMounted, ref, watch } from 'vue'
import '../../../node_modules/chessground/assets/chessground.base.css'
import '../../../node_modules/chessground/assets/chessground.brown.css'
import '../../../node_modules/chessground/assets/chessground.cburnett.css'

const chessBoardContainer = ref(null)
const isFlipped = ref(false)
let board = ref(null)
let chess = new Chess()
let selectedSquare = ref(null)
let legalMoves = ref([])

// Initialize the Chessground board and set the initial FEN string
const initBoard = () => {
  const orientation = isFlipped.value ? 'black' : 'white'

  // If the board is already created, just update the orientation
  if (board.value) {
    board.value.set({
      orientation: orientation, // Only change the orientation
    })
    return
  }

  board.value = Chessground(chessBoardContainer.value, {
    draggable: {
      enabled: true,
    },
    dropOffBoard: 'trash',
    coordinates: true,
    coordinatesOnSquares: true,
    orientation: orientation,
    movable: {
      free: true,
      showDests: true,
      color: chess.turn() === 'w' ? 'white' : 'black',
    },
    animation: {
      enabled: false,
    },
    highlight: {
      lastMove: true,
      check: true,
    },
    events: {
      move: (from, to) => handleMove(from, to), // Listen for move events
      select: (square) => handleSelect(square),
    },
  })

  const initialFen = DEFAULT_POSITION
  chess.load(initialFen)
  board.value.set({
    fen: chess.fen(),
  })
}

// Handle move event
const handleMove = (from, to) => {
  const move = chess.move({ from, to })
  if (move === null) {
    return false
  }
  board.value.set({
    fen: chess.fen(), // Update the FEN string
  })
  console.log(`${from} to ${to}`)
  return true
}

// Handle piece selection
const handleSelect = (square) => {
  selectedSquare.value = square

  // const legalMoves = chess.moves({ square, verbose: true }).map((move) => move.to)

  legalMoves.value.push(chess.moves({ square, verbose: true }).map((move) => move.to))

  const piece = chess.get(square)

  if (piece) {
    const pieceName = piece.type
    const pieceColor = piece.color

    console.log(`${pieceColor}${pieceName.toUpperCase()} on ${square}`)

    return { pieceName, pieceColor, pieceSquare: square }
  } else {
    return null
  }
}

// Flip the board orientation
const flipBoard = () => {
  isFlipped.value = !isFlipped.value
}

onMounted(() => {
  initBoard()
})

// Reinitialize the board when the orientation is flipped
watch(isFlipped, initBoard)
</script>
