// moveValidation/moveValidation.js

export const isValidMove = (piece, fromRow, fromCol, toRow, toCol, board) => {
  const pieceType = piece[1] // Get the type of the piece (K, Q, R, B, N, P)
  const isWhite = piece[0] === 'w' // Check if the piece is white

  // Check if the destination is inside the board
  if (!isInBounds(toRow, toCol)) return false

  // Get the destination piece
  const destinationPiece = board[toRow][toCol]
  const isDestinationWhite = destinationPiece ? destinationPiece[0] === 'w' : false
  console.log(destinationPiece)

  // Ensure that a piece cannot capture its own color
  if (destinationPiece && isWhite === isDestinationWhite) {
    return false // Cannot capture own piece
  }

  switch (pieceType) {
    case 'K':
      return isValidKingMove(fromRow, fromCol, toRow, toCol)
    case 'Q':
      return isValidQueenMove(fromRow, fromCol, toRow, toCol, board)
    case 'R':
      return isValidRookMove(fromRow, fromCol, toRow, toCol, board)
    case 'B':
      return isValidBishopMove(fromRow, fromCol, toRow, toCol, board)
    case 'N':
      return isValidKnightMove(fromRow, fromCol, toRow, toCol)
    case 'P':
      return isValidPawnMove(fromRow, fromCol, toRow, toCol, isWhite, board)
    default:
      return false
  }
}

const isInBounds = (row, col) => {
  return row >= 0 && row < 8 && col >= 0 && col < 8
}

// Function implementations for isValidKingMove, isValidQueenMove, isValidRookMove,
// isValidBishopMove, isValidKnightMove, and isValidPawnMove remain unchanged
// (add the destination piece check where applicable)

const isValidKingMove = (fromRow, fromCol, toRow, toCol) => {
  const rowDiff = Math.abs(fromRow - toRow)
  const colDiff = Math.abs(fromCol - toCol)
  return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0)
}

const isValidQueenMove = (fromRow, fromCol, toRow, toCol, board) => {
  return (
    isValidRookMove(fromRow, fromCol, toRow, toCol, board) ||
    isValidBishopMove(fromRow, fromCol, toRow, toCol, board)
  )
}

const isValidRookMove = (fromRow, fromCol, toRow, toCol, board) => {
  if (fromRow === toRow) {
    const step = fromCol < toCol ? 1 : -1
    for (let col = fromCol + step; col !== toCol; col += step) {
      if (board[fromRow][col]) return false // Path must be clear for sliding pieces
    }
    return true
  } else if (fromCol === toCol) {
    const step = fromRow < toRow ? 1 : -1
    for (let row = fromRow + step; row !== toRow; row += step) {
      if (board[row][fromCol]) return false // Path must be clear for sliding pieces
    }
    return true
  }
  return false // Not a valid rook move
}

const isValidBishopMove = (fromRow, fromCol, toRow, toCol, board) => {
  if (Math.abs(fromRow - toRow) === Math.abs(fromCol - toCol)) {
    const rowStep = toRow > fromRow ? 1 : -1
    const colStep = toCol > fromCol ? 1 : -1
    let row = fromRow + rowStep
    let col = fromCol + colStep
    while (row !== toRow && col !== toCol) {
      if (board[row][col]) return false // Path must be clear for sliding pieces
      row += rowStep
      col += colStep
    }
    return true
  }
  return false // Not a valid bishop move
}

const isValidKnightMove = (fromRow, fromCol, toRow, toCol) => {
  const rowDiff = Math.abs(fromRow - toRow)
  const colDiff = Math.abs(fromCol - toCol)
  return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2)
}

const isValidPawnMove = (fromRow, fromCol, toRow, toCol, isWhite, board) => {
  const direction = isWhite ? -1 : 1 // White moves up the board (-1) and Black moves down (+1)
  const startRow = isWhite ? 6 : 1 // Pawns start on the second row for white and seventh row for black
  const canMoveForward = toCol === fromCol && !board[toRow][toCol]

  if (
    fromRow === startRow &&
    canMoveForward &&
    toRow === fromRow + direction * 2 &&
    !board[fromRow + direction][toCol]
  ) {
    return true // Pawn can move two squares forward from the initial position
  }

  if (canMoveForward && toRow === fromRow + direction) {
    return true // Pawn can move one square forward
  }

  const isCapturing = Math.abs(fromCol - toCol) === 1 && toRow === fromRow + direction

  if (isCapturing && board[toRow][toCol]) {
    return true // Pawn can capture diagonally
  }

  return false
}
