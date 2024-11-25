import { Chess } from 'chess.js'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useChessBoardStore = defineStore('chess', () => {
  // Define reactive state
  const game = ref(new Chess())

  // Computed properties (getters)
  const boardFEN = computed(() => game.value.fen()) // Return FEN for the current game state
  const gameOver = computed(() => game.value.isGameOver()) // Check if the game is over

  // Actions

  // Make a move based on the move object
  const makeMove = (from, to) => {
    if (game.value.move(from, to)) {
      return true
    } else {
      return false
    }
  }

  const getLegalMoves = () => {
    return game.value.moves()
  }

  // Undo the last move
  const undoMove = () => {
    game.value.undo()
  }

  // Reset the game to the initial state
  const resetGame = () => {
    game.value.reset()
  }

  // Return the store's state, getters, and actions
  return {
    game,
    boardFEN,
    gameOver,
    makeMove,
    undoMove,
    resetGame,
    getLegalMoves,
  }
})
