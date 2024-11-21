// validatePawnMove.js
let enPassantInfo = null

export const setEnPassantInfo = (info) => {
  enPassantInfo = info
}

export const getEnPassantInfo = () => {
  return enPassantInfo
}

export const validatePawnMove = (piece, fromRow, fromCol, toRow, toCol, board) => {
  const direction = piece[0] === 'w' ? -1 : 1 // White moves up, Black moves down
  const startRow = piece[0] === 'w' ? 6 : 1

  // Moving forward one square
  if (toCol === fromCol && toRow === fromRow + direction && !board[toRow][toCol]) {
    setEnPassantInfo(null)
    return true
  }

  // Moving forward two squares from the starting position
  if (
    fromRow === startRow &&
    toCol === fromCol &&
    toRow === fromRow + 2 * direction &&
    !board[toRow][toCol] &&
    !board[fromRow + direction][fromCol]
  ) {
    setEnPassantInfo({ row: toRow, col: toCol, piece })
    return true
  }

  // Capturing a piece
  if (
    Math.abs(toCol - fromCol) === 1 &&
    toRow === fromRow + direction &&
    board[toRow][toCol] &&
    board[toRow][toCol][0] !== piece[0]
  ) {
    setEnPassantInfo(null)
    return true
  }

  // En-passant Capture
  if (
    getEnPassantInfo() !== null &&
    fromRow === getEnPassantInfo().row &&
    toCol === getEnPassantInfo().col &&
    getEnPassantInfo().piece
  ) {
    board[getEnPassantInfo().row][toCol] = null // remove the pawn from the square
    setEnPassantInfo(null)
    return true
  }

  return false
}
