import { setEnPassantInfo } from './validatePawnMove'

export const validateBishopMove = (fromRow, fromCol, toRow, toCol, board) => {
  // Must move diagonally
  if (Math.abs(fromRow - toRow) !== Math.abs(fromCol - toCol)) return false

  // Check if the path is clear
  const rowStep = toRow > fromRow ? 1 : -1
  const colStep = toCol > fromCol ? 1 : -1

  let currentRow = fromRow + rowStep
  let currentCol = fromCol + colStep

  while (currentRow !== toRow && currentCol !== toCol) {
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
