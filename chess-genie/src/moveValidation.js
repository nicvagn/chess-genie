// moveValidation.js

let enPassantInfo = null

export const isValidMove = (piece, fromRow, fromCol, toRow, toCol, board) => {
  switch (piece[1]) {
    case 'P':
      return validatePawnMove(piece, fromRow, fromCol, toRow, toCol, board)
    case 'R':
      return validateRookMove(fromRow, fromCol, toRow, toCol, board)
    case 'N':
      return validateKnightMove(fromRow, fromCol, toRow, toCol)
    case 'B':
      return validateBishopMove(fromRow, fromCol, toRow, toCol, board)
    case 'Q':
      return validateQueenMove(fromRow, fromCol, toRow, toCol, board)
    case 'K':
      return validateKingMove(fromRow, fromCol, toRow, toCol, board)
    default:
      return false // Invalid piece type
  }
}

// Example Pawn move validation
const validatePawnMove = (piece, fromRow, fromCol, toRow, toCol, board) => {
  const direction = piece[0] === 'w' ? -1 : 1 // White moves up, Black moves down
  const startRow = piece[0] === 'w' ? 6 : 1

  // Moving forward one square
  if (toCol === fromCol && toRow === fromRow + direction && !board[toRow][toCol]) {
    enPassantInfo = null
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
    enPassantInfo = { row: toRow, col: toCol, piece }
    return true
  }

  // Capturing a piece
  if (
    Math.abs(toCol - fromCol) === 1 &&
    toRow === fromRow + direction &&
    board[toRow][toCol] &&
    board[toRow][toCol][0] !== piece[0]
  ) {
    enPassantInfo = null
    return true
  }

  // En-passant Capture
  if (
    enPassantInfo !== null &&
    fromRow === enPassantInfo.row &&
    toCol === enPassantInfo.col &&
    enPassantInfo.piece
  ) {
    board[enPassantInfo.row][toCol] = null // remove the pawn from the square
    enPassantInfo = null
    return true
  }
  return false
}

// You would implement similar functions for other pieces
const validateRookMove = (fromRow, fromCol, toRow, toCol, board) => {
  // Must move straight (same row or same column)
  if (fromRow !== toRow && fromCol !== toCol) return false

  // Check if the path is clear
  const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0
  const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0

  let currentRow = fromRow + rowStep
  let currentCol = fromCol + colStep

  while (currentRow !== toRow || currentCol !== toCol) {
    if (board[currentRow][currentCol]) return false // Path is blocked
    currentRow += rowStep
    currentCol += colStep
  }

  // Check for capturing (can't capture own pieces)
  if (board[toRow][toCol] && board[toRow][toCol][0] === board[fromRow][fromCol][0]) {
    return false
  }
  enPassantInfo = null
  return true
}

const validateKnightMove = (fromRow, fromCol, toRow, toCol) => {
  const rowDiff = Math.abs(toRow - fromRow)
  const colDiff = Math.abs(toCol - fromCol)
  enPassantInfo = null
  return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2) // L-shape move
}

const validateBishopMove = (fromRow, fromCol, toRow, toCol, board) => {
  // Must move diagonally
  if (Math.abs(fromRow - toRow) !== Math.abs(fromCol - toCol)) return false

  // Check if the path is clear
  const rowStep = toRow > fromRow ? 1 : -1
  const colStep = toCol > fromCol ? 1 : -1

  let currentRow = fromRow + rowStep
  let currentCol = fromCol + colStep

  while (currentRow !== toRow && currentCol !== toCol) {
    if (board[currentRow][currentCol]) return false // Path is blocked
    currentRow += rowStep
    currentCol += colStep
  }

  // Check for capturing (can't capture own pieces)
  if (board[toRow][toCol] && board[toRow][toCol][0] === board[fromRow][fromCol][0]) {
    return false
  }
  enPassantInfo = null
  return true
}

const validateQueenMove = (fromRow, fromCol, toRow, toCol, board) => {
  return (
    validateRookMove(fromRow, fromCol, toRow, toCol, board) ||
    validateBishopMove(fromRow, fromCol, toRow, toCol, board)
  )
}

const validateKingMove = (fromRow, fromCol, toRow, toCol, board) => {
  const rowDiff = Math.abs(toRow - fromRow)
  const colDiff = Math.abs(toCol - fromCol)

  // King can move one square in any direction
  if (rowDiff > 1 || colDiff > 1) return false

  // Check for capturing (can't capture own pieces)
  if (board[toRow][toCol] && board[toRow][toCol][0] === board[fromRow][fromCol][0]) {
    return false
  }
  enPassantInfo = null
  return true
}
