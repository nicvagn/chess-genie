// Basic Chess Functions

// Initialization of the board (FEN parsing) - DONE
// Move generation (for all pieces)
// Basic move validation
// Game state handling (turn switching, check detection, etc.)
// Bitboard operations for chess moves.

// Pawns:

// Normal Move: Pawns move one square forward.
// Double Move: On their first move, pawns can move two squares forward.
// Capture Move: Pawns capture diagonally.
// En Passant: Special capture move for pawns.
// Promotion: If a pawn reaches the 8th rank, it can be promoted.
// Knights:

// Already implemented in your code. Knights move in an "L" shape.
// Rooks:

// Rooks move horizontally or vertically any number of squares.
// We must check for obstacles between the rook and the target square.
// Bishops:

// Bishops move diagonally any number of squares.
// Again, obstacles must be checked.
// Queens:

// Queens combine the movement of both rooks and bishops (vertical, horizontal, diagonal).
// Kings:

// Kings move one square in any direction (horizontal, vertical, diagonal).
// Move Validation:

// Ensure moves don't put the current player's king in check.
// Implement castling rules for the king and rooks.
// Chess.js
const BoardSize = 64
const RankSize = 8

// Piece values (as single characters)
const Piece = {
  WHITE_PAWN: 0x01,
  WHITE_KNIGHT: 0x02,
  WHITE_BISHOP: 0x04,
  WHITE_ROOK: 0x08,
  WHITE_QUEEN: 0x10,
  WHITE_KING: 0x20,
  BLACK_PAWN: 0x40,
  BLACK_KNIGHT: 0x80,
  BLACK_BISHOP: 0x100,
  BLACK_ROOK: 0x200,
  BLACK_QUEEN: 0x400,
  BLACK_KING: 0x800,
}

// Directions for sliding pieces (rook, bishop, queen)
const Directions = {
  HORIZONTAL: [-1, 1], // left, right
  VERTICAL: [-8, 8], // up, down
  DIAGONAL: [-9, 9], // top-left, bottom-right
}

// Helper functions for bitboard manipulation
const setBit = (board, index) => board | (1n << BigInt(index))
const clearBit = (board, index) => board & ~(1n << BigInt(index))
const isBitSet = (board, index) => (board & (1n << BigInt(index))) !== 0n

// Parse FEN notation and return board state
const parseFEN = (fen) => {
  let board = 0n
  let turn = 'w'
  const pieces = fen.split(' ')[0].split('/')

  pieces.forEach((row, rowIndex) => {
    let bitIndex = 56 - rowIndex * 8
    row.split('').forEach((char) => {
      if (char >= '1' && char <= '8') {
        bitIndex += parseInt(char) // Skip the number of empty squares
      } else {
        const pieceType = pieceCharToBit(char)
        if (pieceType) board = setBit(board, bitIndex)
        bitIndex++
      }
    })
  })

  return {
    board,
    turn,
  }
}

// Convert piece character to bitboard representation
const pieceCharToBit = (char) => {
  switch (char) {
    case 'P':
      return Piece.WHITE_PAWN
    case 'N':
      return Piece.WHITE_KNIGHT
    case 'B':
      return Piece.WHITE_BISHOP
    case 'R':
      return Piece.WHITE_ROOK
    case 'Q':
      return Piece.WHITE_QUEEN
    case 'K':
      return Piece.WHITE_KING
    case 'p':
      return Piece.BLACK_PAWN
    case 'n':
      return Piece.BLACK_KNIGHT
    case 'b':
      return Piece.BLACK_BISHOP
    case 'r':
      return Piece.BLACK_ROOK
    case 'q':
      return Piece.BLACK_QUEEN
    case 'k':
      return Piece.BLACK_KING
    default:
      return 0
  }
}

// Move generation for pawns
const generatePawnMoves = (board, color) => {
  const pawnMoves = []
  for (let i = 0; i < BoardSize; i++) {
    if (isBitSet(board, i)) {
      let forward = color === 'w' ? -8 : 8 // white moves up (negative), black moves down (positive)
      let doubleForward = color === 'w' ? -16 : 16
      let captures = [forward - 1, forward + 1]

      // Normal move
      if (isLegalMove(board, i + forward, color)) {
        pawnMoves.push(i + forward)
        // Double move on first rank
        if ((color === 'w' && i >= 48 && i < 56) || (color === 'b' && i >= 8 && i < 16)) {
          if (isLegalMove(board, i + doubleForward, color)) {
            pawnMoves.push(i + doubleForward)
          }
        }
      }

      // Captures
      captures.forEach((capture) => {
        if (isLegalMove(board, i + capture, color)) {
          pawnMoves.push(i + capture)
        }
      })
    }
  }
  return pawnMoves
}

// Move generation for knights
const generateKnightMoves = (board, color) => {
  const knightMovesList = []
  for (let i = 0; i < BoardSize; i++) {
    if (isBitSet(board, i)) {
      const knightMoves = getKnightMoves(i)
      knightMoves.forEach((move) => {
        if (isLegalMove(board, move, color)) knightMovesList.push(move)
      })
    }
  }
  return knightMovesList
}

// Get all knight moves based on a specific position (bit index)
const getKnightMoves = (position) => {
  const knightOffsets = [-17, -15, -10, -6, 6, 10, 15, 17]
  const knightMoves = []
  knightOffsets.forEach((offset) => {
    const newPosition = position + offset
    if (newPosition >= 0 && newPosition < BoardSize) {
      knightMoves.push(newPosition)
    }
  })
  return knightMoves
}

// Move generation for rooks
const generateRookMoves = (board, color) => {
  const rookMoves = []
  for (let i = 0; i < BoardSize; i++) {
    if (isBitSet(board, i)) {
      Directions.HORIZONTAL.concat(Directions.VERTICAL).forEach((dir) => {
        for (let j = i + dir; j >= 0 && j < BoardSize; j += dir) {
          if (isBitSet(board, j)) {
            if (isLegalMove(board, j, color)) rookMoves.push(j)
            break
          }
          rookMoves.push(j)
        }
      })
    }
  }
  return rookMoves
}

// Move generation for bishops
const generateBishopMoves = (board, color) => {
  const bishopMoves = []
  for (let i = 0; i < BoardSize; i++) {
    if (isBitSet(board, i)) {
      Directions.DIAGONAL.forEach((dir) => {
        for (let j = i + dir; j >= 0 && j < BoardSize; j += dir) {
          if (isBitSet(board, j)) {
            if (isLegalMove(board, j, color)) bishopMoves.push(j)
            break
          }
          bishopMoves.push(j)
        }
      })
    }
  }
  return bishopMoves
}

// Move generation for queens
const generateQueenMoves = (board, color) => {
  const rookMoves = generateRookMoves(board, color)
  const bishopMoves = generateBishopMoves(board, color)
  return rookMoves.concat(bishopMoves)
}

// Move generation for kings
const generateKingMoves = (board, color) => {
  const kingMoves = []
  for (let i = 0; i < BoardSize; i++) {
    if (isBitSet(board, i)) {
      const kingOffsets = [-1, 1, -8, 8, -9, -7, 7, 9]
      kingOffsets.forEach((offset) => {
        const newPos = i + offset
        if (newPos >= 0 && newPos < BoardSize) {
          if (isLegalMove(board, newPos, color)) kingMoves.push(newPos)
        }
      })
    }
  }
  return kingMoves
}

// Check if a move is legal for a given piece
const isLegalMove = (board, target, color) => {
  if (isBitSet(board, target)) {
    const targetPiece = pieceAtPosition(board, target)
    return (color === 'w' && targetPiece < 0) || (color === 'b' && targetPiece > 0)
  }
  return true
}

// Return the piece at a given position (0 for empty, positive for white, negative for black)
const pieceAtPosition = (board, position) => {
  return (board >> BigInt(position)) & 1n
}

// Switch turn after a move
const switchTurn = (turn) => {
  return turn === 'w' ? 'b' : 'w'
}

// Example of move validation and applying a move to the bitboard
const applyMove = (board, start, end) => {
  if (isLegalMove(board, end, 'w')) {
    board = clearBit(board, start)
    board = setBit(board, end)
  }
  return board
}

// Print the bitboard (for visualization)
const printBoard = (board) => {
  let output = ''
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const index = row * 8 + col
      output += isBitSet(board, index) ? '1' : '0'
    }
    output += '\n'
  }
  console.log(output)
}

// Sample FEN input
const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
const chessBoardState = parseFEN(fen)

// Example usage:
printBoard(chessBoardState.board) // Print the initial board
