// src/stores/useChessBoardStore.js
import { parseFEN } from '@/components/chessBoard/parseFEN'
import { getValidMoves, isValidMove } from '@/moveValidation/moveValidation'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useChessBoardStore = defineStore('chess', () => {
  const fenString = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  const activeColor = parseFEN(fenString).activeColor
  const board = ref(parseFEN(fenString).board)
  const currentPlayer = ref(activeColor)
  const validMoves = ref([])
  const draggedPiece = ref(null)
  const draggedFrom = ref({ row: null, col: null })

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
        ((currentPlayer.value === 'w' && draggedPiece.value === draggedPiece.value.toUpperCase()) ||
          (currentPlayer.value === 'b' && draggedPiece.value === draggedPiece.value.toLowerCase()))
      ) {
        board.value[rowIndex][colIndex] = draggedPiece.value
        board.value[draggedFrom.value.row][draggedFrom.value.col] = null

        draggedPiece.value = null
        switchTurn()
      }
    }

    validMoves.value = []
  }

  return {
    board,
    onDrag,
    onDrop,
    currentPlayer,
    validMoves,
    draggedPiece,
    draggedFrom,
  }
})
