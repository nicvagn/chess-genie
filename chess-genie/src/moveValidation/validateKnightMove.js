import { setEnPassantInfo } from './validatePawnMove'

export const validateKnightMove = (fromRow, fromCol, toRow, toCol) => {
  const rowDiff = Math.abs(toRow - fromRow)
  const colDiff = Math.abs(toCol - fromCol)
  setEnPassantInfo(null)
  return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2) // L-shape move
}
