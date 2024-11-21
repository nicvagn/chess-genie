// moveValidation.js
import { validateBishopMove } from './validateBishopMove'
import { validateKingMove } from './validateKingMove'
import { validateKnightMove } from './validateKnightMove'
import { validatePawnMove } from './validatePawnMove'
import { validateQueenMove } from './validateQueenMove'
import { validateRookMove } from './validateRookMove'

export const isValidMove = (piece, fromRow, fromCol, toRow, toCol, board) => {
  switch (piece[1]) {
    case 'P':
      return validatePawnMove(piece, fromRow, fromCol, toRow, toCol, board)
    case 'R':
      return validateRookMove(fromRow, fromCol, toRow, toCol, board)
    case 'N':
      return validateKnightMove(fromRow, fromCol, toRow, toCol)
    case 'B':
      return validateBishopMove(fromRow, fromCol, toRow, toCol, board)
    case 'Q':
      return validateQueenMove(fromRow, fromCol, toRow, toCol, board)
    case 'K':
      return validateKingMove(fromRow, fromCol, toRow, toCol, board)
    default:
      return false // Invalid piece type
  }
}
