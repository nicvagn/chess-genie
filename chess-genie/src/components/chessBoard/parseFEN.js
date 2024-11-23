export const parseFEN = (fen) => {
  const fenParts = fen.split(' ')

  const rows = fenParts[0].split('/')
  if (rows.length !== 8) {
    throw new Error('Invalid FEN string: Must have exactly 8 rows.')
  }
  const board = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null))

  rows.forEach((row, rowIndex) => {
    let colIndex = 0
    for (const char of row) {
      if (isNaN(char)) {
        // It's a piece
        board[rowIndex][colIndex] = char
        colIndex++
      } else {
        // It's a number, meaning empty squares
        const emptySquares = parseInt(char, 10)
        colIndex += emptySquares
      }
    }
  })

  const activeColor = fenParts[1]
  if (activeColor !== 'w' && activeColor !== 'b') {
    throw new Error('Invalid FEN string: Active color must be "w" or "b".')
  }

  return {
    board,
    activeColor,
  }
}
