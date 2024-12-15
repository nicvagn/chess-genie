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
import { Chess, SQUARES } from 'chess.js'
import { Chessground } from 'chessground'
import { onMounted, ref, watch } from 'vue'
import '../../../public/assets/chessground.base.css'
import '../../../public/assets/chessground.brown.css'
import '../../../public/assets/chessground.cburnett.css'

const chessBoardContainer = ref(null)
const isFlipped = ref(false)
let board = ref(null)
let chess = new Chess()
let selectedSquare = ref(null)

// const initialFen = DEFAULT_POSITION
const initialFen = 'rnb1k2r/ppppqpPp/5n2/2b1b3/2B1P3/5N2/PPPP1PpP/RNBQK2R w KQkq - 6 5'
chess.load(initialFen)

// Initialize the Chessground board and set the initial FEN string
const initBoard = () => {
  const orientation = isFlipped.value ? 'black' : 'white'

  board.value = Chessground(chessBoardContainer.value, {
    fen: chess.fen(),
    draggable: {
      enabled: true,
    },
    dropOffBoard: 'trash',
    coordinates: true,
    coordinatesOnSquares: true,
    orientation: orientation,
    turnColor: chess.turn() === 'w' ? 'white' : 'black',
    movable: {
      free: false,
      showDests: true,
      dests: getDests(),
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
      move: (from, to) => handleMove(from, to),
      select: (square) => handleSelect(square),
    },
  })
}

// Handle move event
const handleMove = (from, to) => {
  const legalMoves = chess.moves({ verbose: true })
  const move = legalMoves.find((move) => move.from === from && move.to === to)

  if (move === null || move === undefined) return false

  chess.move(move)

  if (chess.isCheck()) {
    // key is a square name. ex: e4, d4...
    // piece role = piece name. ex. king, rook, etc. & color = black or white
    for (const [key, piece] of board.value.state.pieces) {
      if (piece.role === 'king' && piece.color === board.value.state.turnColor) {
        board.value.state.check = key
      }
    }
  }

  // Update board config after the move
  board.value.set({
    fen: chess.fen(),
    movable: {
      dests: getDests(),
      color: chess.turn() === 'w' ? 'white' : 'black',
    },
    turnColor: chess.turn() === 'w' ? 'white' : 'black',
  })
  return true
}

const getDests = () => {
  const dests = new Map()
  SQUARES.forEach((square) => {
    const legalMoves = chess.moves({ square: square, verbose: true })
    if (legalMoves.length)
      dests.set(
        square,
        legalMoves.map((move) => move.to),
      )
  })
  return dests
}

// Handle piece selection
const handleSelect = (square) => {
  selectedSquare.value = square

  const piece = chess.get(square)

  if (piece) {
    const pieceName = piece.type
    const pieceColor = piece.color

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
