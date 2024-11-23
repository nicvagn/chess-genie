export const validateKingMove = (fromRow, fromCol, toRow, toCol) => {
  return Math.abs(toRow - fromRow) <= 1 && Math.abs(toCol - fromCol) <= 1
}
