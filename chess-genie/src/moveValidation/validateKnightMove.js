import { setEnPassantInfo } from './validatePawnMove'

export const validateKnightMove = (fromRow, fromCol, toRow, toCol, board) => {
  const rowDiff = Math.abs(toRow - fromRow)
  const colDiff = Math.abs(toCol - fromCol)

  // Check for capturing (can't capture own pieces)
  if (board[toRow][toCol] && board[toRow][toCol][0] === board[fromRow][fromCol][0]) {
    return false
  }
  setEnPassantInfo(null)
  return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2) // L-shape move
}
