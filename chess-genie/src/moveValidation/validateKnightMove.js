export const validateKnightMove = (fromRow, fromCol, toRow, toCol) => {
  return (
    (Math.abs(toRow - fromRow) === 2 && Math.abs(toCol - fromCol) === 1) ||
    (Math.abs(toRow - fromRow) === 1 && Math.abs(toCol - fromCol) === 2)
  ) // L-Shape move
}
