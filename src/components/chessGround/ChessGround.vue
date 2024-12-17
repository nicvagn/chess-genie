<template>
  <div class="flex justify-center pt-5">
    <div class="flex flex-col justify-start p-1 mr-2 border border-cyan-800 size-[500px]">
      <div class="flex flex-row">
        <button
          class="rounded border border-indigo-600 text-sm font-medium text-indigo-600 hover:bg-indigo-600 hover:text-white focus:outline-none focus:ring active:bg-indigo-500 mb-2 mr-2 w-32 h-10"
          @click="flipBoard"
        >
          Flip
        </button>
        <button
          class="rounded border border-red-600 text-sm font-medium text-indigo-600 hover:bg-red-600 hover:text-white focus:outline-none focus:ring active:bg-red-500 mb-2 mr-2 w-32 h-10"
          @click="resetGame"
        >
          Reset
        </button>
        <button
          class="rounded border border-green-600 text-sm font-medium text-indigo-600 hover:bg-green-600 hover:text-white focus:outline-none focus:ring active:bg-green-500 mb-2 w-32 h-10"
          @click="newGame"
        >
          New Game
        </button>
      </div>
      <input
        type="text"
        :value="boardFen"
        class="w-[490px] h-[25px] border border-indigo-600"
        readonly
      />
    </div>
    <div ref="chessBoardContainer" class="size-[500px]"></div>
  </div>
  <!-- Pawn Promotion Dialog -->
  <div v-if="isPawnPromotion" class="dialog-overlay" @mousedown.stop>
    <div class="dialog-modal" @mousedown.stop>
      <img
        v-for="(piece, symbol) in promotionPieces"
        :key="symbol"
        class="promotion-image"
        :src="`/pieces/cardinal/${chess.turn()}${symbol.toUpperCase()}.svg`"
        @click="promotePawn(symbol)"
      />
      <button
        class="relative mb-12 text-gray-600 hover:text-red-600 bg-transparent rounded-full transition duration-150 ease-in-out"
        @click="
          () => {
            cancelPromotion
            isPawnPromotion = !isPawnPromotion
          }
        "
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
</template>

<script setup>
import { Chess, DEFAULT_POSITION, SQUARES } from 'chess.js'
import { Chessground } from 'chessground'
import { onMounted, ref, watch } from 'vue'
import '../../../public/assets/chessground.base.css'
import '../../../public/assets/chessground.brown.css'
import '../../../public/assets/chessground.cburnett.css'

let stockfish = null
const chessBoardContainer = ref(null)
const isFlipped = ref(false)
const board = ref(null)
const chess = new Chess()
let selectedSquare = ref(null)
const previousMove = ref(null)
const isPawnPromotion = ref(false)
const promotionPieces = ref({
  q: 'Queen',
  r: 'Rook',
  b: 'Bishop',
  n: 'Knight',
})

// Initial FEN
const initialFen = DEFAULT_POSITION
// const initialFen = '6k1/8/8/8/8/8/3K2P1/8 w - - 0 1'
chess.load(initialFen)
const boardFen = ref(chess.fen())

const handleStockfishMove = (move) => {
  chess.move(move)
  boardFen.value = chess.fen()
  updateBoard()
}

// Initialize Stockfish
const initStockfish = () => {
  stockfish = new Worker('/stockfish-16.1-lite-single.js')

  stockfish.onmessage = (event) => {
    const message = event.data
    if (typeof message === 'string') {
      if (message.startsWith('bestmove')) {
        const move = message.split(' ')[1]
        handleStockfishMove(move)
      }
    }
  }
}

// Start the engine
const startEngine = () => {
  stockfish.postMessage('uci')
  stockfish.postMessage('setoption name UCI_Variant value normal')
  stockfish.postMessage('ucinewgame')
  stockfish.postMessage(`position fen ${chess.fen()}`)
  stockfish.postMessage('go depth 10') // Adjust the search depth as needed
}

const initBoard = () => {
  const orientation = isFlipped.value ? 'black' : 'white'
  const playerTurn = chess.turn() === 'w' ? 'white' : 'black'

  board.value = Chessground(chessBoardContainer.value, {
    fen: chess.fen(),
    draggable: {
      enabled: true,
    },
    dropOffBoard: 'trash',
    coordinates: true,
    coordinatesOnSquares: true,
    orientation: orientation,
    turnColor: playerTurn,
    movable: {
      free: false,
      showDests: true,
      dests: getDests(),
      color: playerTurn,
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

const handleMove = (from, to) => {
  const legalMoves = chess.moves({ verbose: true })
  const move = legalMoves.find((move) => move.from === from && move.to === to)

  if (move === null || move === undefined) return false

  previousMove.value = { from, to, piece: move.piece }

  // Check for promotion
  if (move.piece === 'p' && (to.charAt(1) === '8' || to.charAt(1) === '1')) {
    isPawnPromotion.value = true
    selectedSquare.value = { from, to } // Store the promotion square
    return // Prevent the move until the user selects a promotion piece
  }

  chess.move(move)
  boardFen.value = chess.fen()
  updateBoard()

  startEngine()
  return true
}

const cancelPromotion = () => {
  isPawnPromotion.value = false
  if (previousMove.value) {
    // Revert the last move
    chess.undo()
    selectedSquare.value = null
    boardFen.value = chess.fen()
    updateBoard()
  }
}

const promotePawn = (promoteTo) => {
  // Replace the pawn with the selected piece
  chess.move({
    from: selectedSquare.value.from,
    to: selectedSquare.value.to,
    promotion: promoteTo,
  })

  isPawnPromotion.value = false
  boardFen.value = chess.fen()
  updateBoard()

  return true
}

const updateBoard = () => {
  if (chess.isCheck()) {
    // key is a square name. ex: e4, d4...
    // piece role = piece name. ex. king, rook, etc. & color = black or white
    for (const [key, piece] of board.value.state.pieces) {
      if (piece.role === 'king' && piece.color === board.value.state.turnColor) {
        board.value.state.check = key
      }
    }
  }
  board.value.set({
    fen: chess.fen(),
    movable: {
      dests: getDests(),
      color: chess.turn() === 'w' ? 'white' : 'black',
    },
    turnColor: chess.turn() === 'w' ? 'white' : 'black',
  })
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

// Reset the game
const resetGame = () => {
  chess.reset()
  boardFen.value = chess.fen()
  updateBoard()
}

// Start a new game
const newGame = () => {
  chess.load(initialFen)
  boardFen.value = chess.fen()
  updateBoard()
}

onMounted(() => {
  initBoard()
  initStockfish()
})

// Reinitialize the board when the orientation is flipped
watch(isFlipped, initBoard)
</script>

<style>
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
  flex-direction: row;
}

.promotion-image:hover {
  background-color: rgba(20, 85, 30, 0.5);
}
</style>
