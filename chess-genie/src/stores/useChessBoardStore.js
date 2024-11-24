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
  const lastMove = ref(null)

  const switchTurn = () => {
    currentPlayer.value = currentPlayer.value === 'w' ? 'b' : 'w'
  }

  // Function to find the position of the king
  const findKingPosition = (color) => {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board.value[row][col]
        if (piece === (color === 'w' ? 'K' : 'k')) {
          return { row, col }
        }
      }
    }
    return null
  }

  // Function to check if the king is in check
  const isKingInCheck = (color) => {
    const kingPosition = findKingPosition(color)
    if (!kingPosition) return null // Return null if no king found

    // Check if any opponent's piece can attack the king
    const opponentColor = color === 'w' ? 'b' : 'w'
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board.value[row][col]
        if (
          piece &&
          (piece.toLowerCase() !== piece ||
            (opponentColor === 'w' && piece === piece.toLowerCase()) ||
            (opponentColor === 'b' && piece === piece.toUpperCase()))
        ) {
          const validMovesForOpponent = getValidMoves(piece, row, col, board.value, lastMove.value)
          if (
            validMovesForOpponent.some(
              (move) => move.row === kingPosition.row && move.col === kingPosition.col,
            )
          ) {
            return kingPosition // Return king's position if it is in check
          }
        }
      }
    }
    return null // Return null if the king is not in check
  }

  const onDrag = (piece, row, col) => {
    draggedPiece.value = piece
    draggedFrom.value = { row, col }
    validMoves.value = getValidMoves(piece, row, col, board.value, lastMove.value)
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
        lastMove.value,
      )

      if (
        validMove &&
        ((currentPlayer.value === 'w' && draggedPiece.value === draggedPiece.value.toUpperCase()) ||
          (currentPlayer.value === 'b' && draggedPiece.value === draggedPiece.value.toLowerCase()))
      ) {
        lastMove.value = {
          piece: draggedPiece.value,
          fromRow: draggedFrom.value.row,
          fromCol: draggedFrom.value.col,
          toRow: rowIndex,
          toCol: colIndex,
        }
        // Handle en passant
        if (
          Math.abs(colIndex - draggedFrom.value.col) === 1 &&
          Math.abs(rowIndex - draggedFrom.value.row) === 1
        ) {
          const capturedRow = draggedPiece.value === 'P' ? rowIndex + 1 : rowIndex - 1
          const capturedCol = colIndex
          board.value[capturedRow][capturedCol] = null // Remove captured pawn
        }
        board.value[rowIndex][colIndex] = draggedPiece.value
        board.value[draggedFrom.value.row][draggedFrom.value.col] = null

        draggedPiece.value = null
        switchTurn()

        // // Check if the move puts the king in check
        // if (isKingInCheck(currentPlayer.value)) {
        //   alert(`${currentPlayer.value === 'w' ? 'White' : 'Black'}'s king is in check!`)
        // }
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
    isKingInCheck,
  }
})
