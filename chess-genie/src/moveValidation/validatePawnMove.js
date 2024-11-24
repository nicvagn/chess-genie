// validatePawnMove.js

export const validatePawnMove = (
  piece,
  fromRow,
  fromCol,
  toRow,
  toCol,
  targetCell,
  board,
  lastMove,
) => {
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

  // En passant
  if (toRow === fromRow + direction && Math.abs(toCol - fromCol) === 1 && targetCell === null) {
    // Ensure lastMove is defined
    if (lastMove) {
      const lastMovePiece = lastMove.piece // Last move piece
      const lastMoveFromCol = lastMove.fromCol // Last move from column

      // Check if the last move was a pawn moving two squares
      if (
        lastMovePiece.toLowerCase() === 'p' &&
        lastMoveFromCol === toCol &&
        lastMove.toRow === fromRow
      ) {
        return true // En passant capture is valid
      }
    }
  }

  return false
}
