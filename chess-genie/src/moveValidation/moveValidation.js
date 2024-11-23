// moveValidation.js
import { validateBishopMove } from './validateBishopMove'
import { validateKingMove } from './validateKingMove'
import { validateKnightMove } from './validateKnightMove'
import { validatePawnMove } from './validatePawnMove'
import { validateQueenMove } from './validateQueenMove'
import { validateRookMove } from './validateRookMove'

export const isValidMove = (piece, fromRow, fromCol, toRow, toCol, board) => {
  const pieceType = piece.toLowerCase()
  const targetCell = board[toRow][toCol]

  // Check if the target cell has a piece of the same color
  if (
    targetCell &&
    ((piece === piece.toUpperCase() && targetCell === targetCell.toUpperCase()) ||
      (piece === piece.toLowerCase() && targetCell === targetCell.toLowerCase()))
  ) {
    return false // Can't capture your own piece
  }

  switch (pieceType) {
    case 'p': // Pawn
      return validatePawnMove(piece, fromRow, fromCol, toRow, toCol, targetCell, board)
    case 'r': // Rook
      return validateRookMove(fromRow, fromCol, toRow, toCol, board)
    case 'b': // Bishop
      return validateBishopMove(fromRow, fromCol, toRow, toCol, board)
    case 'q': // Queen
      return validateQueenMove(fromRow, fromCol, toRow, toCol, board)
    case 'n': // Knight
      return validateKnightMove(fromRow, fromCol, toRow, toCol)
    case 'k': // King
      return validateKingMove(fromRow, fromCol, toRow, toCol)
  }
  return false
}

export const getValidMoves = (piece, row, col, board) => {
  const validMoves = []

  // Loop through all possible moves of selected piece on the board
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (isValidMove(piece, row, col, r, c, board)) {
        validMoves.push({ row: r, col: c })
      }
    }
  }
  return validMoves
}
