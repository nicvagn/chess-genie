import { validateBishopMove } from './validateBishopMove'
import { validateRookMove } from './validateRookMove'

export const validateQueenMove = (fromRow, fromCol, toRow, toCol, board) => {
  return (
    validateRookMove(fromRow, fromCol, toRow, toCol, board) ||
    validateBishopMove(fromRow, fromCol, toRow, toCol, board)
  )
}
