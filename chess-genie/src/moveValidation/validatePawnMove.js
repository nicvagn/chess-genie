// validatePawnMove.js

export const validatePawnMove = (piece, fromRow, fromCol, toRow, toCol, targetCell, board) => {
  const direction = piece === 'P' ? -1 : 1 // White up (-1), Black down (+1)
  const squareInBetween = board[fromRow + direction][fromCol]

  // single move
  if (toRow === fromRow + direction && toCol === fromCol && targetCell === null) return true

  // double move
  if (
    toRow === fromRow + 2 * direction &&
    toCol === fromCol &&
    targetCell === null &&
    squareInBetween === null &&
    fromRow === (direction === -1 ? 6 : 1)
  )
    return true

  // capture move
  if (toRow === fromRow + direction && Math.abs(toCol - fromCol) === 1 && targetCell !== null)
    return true

  return false
}
