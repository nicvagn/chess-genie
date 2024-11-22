import { setEnPassantInfo } from './validatePawnMove'

// validateRookMove.js
export const validateRookMove = (fromRow, fromCol, toRow, toCol, board) => {
  // Must move straight (same row or same column)
  if (fromRow !== toRow && fromCol !== toCol) return false

  // Check if the path is clear
  const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0
  const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0

  let currentRow = fromRow + rowStep
  let currentCol = fromCol + colStep

  while (currentRow !== toRow || currentCol !== toCol) {
    if (board[currentRow][currentCol]) return false // Path is blocked
    currentRow += rowStep
    currentCol += colStep
  }

  // Check for capturing (can't capture own pieces)
  const fromPiece = board[fromRow][fromCol]
  const toPiece = board[toRow][toCol]

  const isSameColor =
    toPiece && (fromPiece.toLowerCase() === toPiece.toLowerCase()) === (fromPiece === toPiece)

  if (isSameColor) return false
  setEnPassantInfo(null)
  return true
}
