let enPassantTarget = null

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
  if (
    toRow === fromRow + direction &&
    Math.abs(toCol - fromCol) === 1 &&
    targetCell !== null &&
    targetCell.toLowerCase() !== piece
  )
    return true

  // en-passant move
  if (
    enPassantTarget &&
    enPassantTarget[0] === toRow &&
    enPassantTarget[1] === toCol &&
    targetCell === null &&
    toRow === fromRow + direction &&
    Math.abs(toCol - fromCol) === 1
  ) {
    return true
  }

  return false
}

export const setEnPassantTarget = (piece, fromRow, toRow, toCol) => {
  if (piece.toLowerCase() === piece.toLowerCase() && Math.abs(fromRow - toRow) === 2) {
    enPassantTarget = [(fromRow + toRow) / 2, toCol]
  } else {
    enPassantTarget = null
  }
}
