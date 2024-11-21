// moveValidation.js
import { validateBishopMove } from './validateBishopMove'
import { validateKingMove } from './validateKingMove'
import { validateKnightMove } from './validateKnightMove'
import { validatePawnMove } from './validatePawnMove'
import { validateQueenMove } from './validateQueenMove'
import { validateRookMove } from './validateRookMove'

export const isValidMove = (piece, fromRow, fromCol, toRow, toCol, board, isFlipped) => {
  // Adjust for flipped board
  const adjustedFromRow = isFlipped ? 7 - fromRow : fromRow
  const adjustedToRow = isFlipped ? 7 - toRow : toRow

  switch (piece[1]) {
    case 'P':
      return validatePawnMove(piece, adjustedFromRow, fromCol, adjustedToRow, toCol, board)
    case 'R':
      return validateRookMove(adjustedFromRow, fromCol, adjustedToRow, toCol, board)
    case 'N':
      return validateKnightMove(adjustedFromRow, fromCol, adjustedToRow, toCol, board)
    case 'B':
      return validateBishopMove(adjustedFromRow, fromCol, adjustedToRow, toCol, board)
    case 'Q':
      return validateQueenMove(adjustedFromRow, fromCol, adjustedToRow, toCol, board)
    case 'K':
      return validateKingMove(adjustedFromRow, fromCol, adjustedToRow, toCol, board)
    default:
      return false // Invalid piece type
  }
}
