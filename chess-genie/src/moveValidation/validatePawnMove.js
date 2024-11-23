export const validatePawnMove = (piece, fromRow, fromCol, toRow, toCol, targetCell, board) => {
  // White pawn move
  if (piece === 'P') {
    if (fromRow - toRow === 1 && fromCol === toCol && targetCell === null) {
      return true // Move forward one square
    }
    if (
      fromRow === 6 && // Initial position for white pawn
      fromRow - toRow === 2 &&
      fromCol === toCol &&
      targetCell === null &&
      board[5][fromCol] === null // Ensuring the square in between is empty
    ) {
      return true // Move forward two squares
    }
    if (
      fromRow - toRow === 1 &&
      Math.abs(fromCol - toCol) === 1 &&
      targetCell &&
      targetCell.toLowerCase() !== piece
    ) {
      return true // Capture
    }
  }
  // Black pawn move
  if (piece === 'p') {
    if (toRow - fromRow === 1 && fromCol === toCol && targetCell === null) {
      return true // Move forward one square
    }
    if (
      fromRow === 1 && // Initial position for black pawn
      toRow - fromRow === 2 &&
      fromCol === toCol &&
      targetCell === null &&
      board[2][fromCol] === null // Ensuring the square in between is empty
    ) {
      return true // Move forward two squares
    }
    if (
      toRow - fromRow === 1 &&
      Math.abs(fromCol - toCol) === 1 &&
      targetCell &&
      targetCell.toUpperCase() !== piece
    ) {
      return true // Capture
    }
  }

  return false
}
