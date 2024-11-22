import { setEnPassantInfo } from './validatePawnMove'

export const validateKnightMove = (fromRow, fromCol, toRow, toCol, board) => {
  const rowDiff = Math.abs(toRow - fromRow)
  const colDiff = Math.abs(toCol - fromCol)

  // Check for capturing (can't capture own pieces)
  const fromPiece = board[fromRow][fromCol]
  const toPiece = board[toRow][toCol]

  const isSameColor =
    toPiece && (fromPiece.toLowerCase() === toPiece.toLowerCase()) === (fromPiece === toPiece)

  setEnPassantInfo(null)
  return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2 && !isSameColor) // L-shape move
}
