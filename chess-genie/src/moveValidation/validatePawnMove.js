// validatePawnMove.js
let enPassantInfo = null

export const setEnPassantInfo = (info) => {
  enPassantInfo = info
}

export const getEnPassantInfo = () => {
  return enPassantInfo
}

const isSameColor = (fromPiece, toPiece) => {
  return toPiece && (fromPiece.toLowerCase() === toPiece.toLowerCase()) === (fromPiece === toPiece)
}

const canMoveForwardOne = (fromRow, fromCol, toRow, toCol, direction, board) => {
  return toCol === fromCol && toRow === fromRow + direction && !board[toRow][toCol]
}

const canMoveForwardTwo = (fromRow, fromCol, toRow, toCol, direction, startRow, board) => {
  return (
    fromRow === startRow &&
    toCol === fromCol &&
    toRow === fromRow + 2 * direction &&
    !board[toRow][toCol] &&
    !board[fromRow + direction][fromCol]
  )
}

const isCaptureMove = (fromRow, fromCol, toRow, toCol, piece, board) => {
  return (
    Math.abs(toCol - fromCol) === 1 &&
    toRow === fromRow + (piece[0] === 'w' ? -1 : 1) &&
    board[toRow][toCol] &&
    board[toRow][toCol][0] !== piece[0]
  )
}

export const validatePawnMove = (piece, fromRow, fromCol, toRow, toCol, board) => {
  const direction = piece[0] === 'w' ? -1 : 1 // White moves up, Black moves down
  const startRow = piece[0] === 'w' ? 6 : 1

  const fromPiece = board[fromRow][fromCol]
  const toPiece = board[toRow][toCol]

  // Check for capturing (can't capture own pieces)
  if (isSameColor(fromPiece, toPiece)) return false

  // Moving forward one square
  if (canMoveForwardOne(fromRow, fromCol, toRow, toCol, direction, board)) {
    setEnPassantInfo(null)
    return true
  }

  // Moving forward two squares from the starting position
  if (canMoveForwardTwo(fromRow, fromCol, toRow, toCol, direction, startRow, board)) {
    setEnPassantInfo({ row: toRow, col: toCol, piece })
    return true
  }

  // Capturing a piece
  if (isCaptureMove(fromRow, fromCol, toRow, toCol, piece, board)) {
    setEnPassantInfo(null)
    return true
  }

  return false
}
