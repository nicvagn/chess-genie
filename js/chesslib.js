// chesslib.js
const WHITE = 'w'
const BLACK = 'b'

const PIECE_TYPES = {
  KING: 'K',
  QUEEN: 'Q',
  ROOK: 'R',
  BISHOP: 'B',
  KNIGHT: 'N',
  PAWN: 'P',
}

class ChessGame {
  constructor(fenNotation) {
    const [board, playerTurn] = fenNotation.split(' ')
    this.currentPlayerTurn = playerTurn
    this.board = this.initializeBoard(board)
    this.enPassantTarget = null // Initialize en-passant target
    this.boardHistory = [] // To track board position history
    this.isDrawByRepetition = false // To track if a draw by repetition occurred
    this.repetitionCountTwoTracker = 0
    this.fiftyMoveCounter = 0 // Initialize fifty-move counter

    // Use an object to encapsulate the state of various pieces
    this.pieceMovedStatus = {
      whiteKing: false,
      whiteKingsideRook: false,
      whiteQueensideRook: false,
      blackKing: false,
      blackKingsideRook: false,
      blackQueensideRook: false,
    }
  }

  initializeBoard(fenNotation) {
    const chessBoard = Array.from({ length: 8 }, () => Array(8).fill(null))
    const rows = fenNotation.split('/')

    rows.forEach((row, rowIndex) => {
      let fileIndex = 0
      for (const char of row) {
        if (isNaN(char)) {
          chessBoard[rowIndex][fileIndex++] = char // Place the piece
        } else {
          fileIndex += parseInt(char, 10) // Skip squares
        }
      }
    })
    return chessBoard
  }

  getPiece(x, y) {
    return this.board[x][y] // Access a piece
  }

  setPiece(x, y, piece) {
    this.board[x][y] = piece // Set a piece
  }

  removePiece(x, y) {
    this.setPiece(x, y, null) // Remove a piece
  }

  getPieceColor(piece) {
    if (!piece) {
      return null // If the piece is null, return null
    }
    return piece === piece.toUpperCase() ? WHITE : BLACK // Return WHITE for white, BLACK for black
  }

  isPathClear(start, end) {
    const [startX, startY] = start
    const [endX, endY] = end

    // Check if the positions are on the board
    if (!this.isOnBoard(start) || !this.isOnBoard(end)) return false

    const [stepX, stepY] = this.getStepDirection(start, end)
    let currentX = startX + stepX
    let currentY = startY + stepY

    while (currentX !== endX || currentY !== endY) {
      if (
        !this.isOnBoard([currentX, currentY]) ||
        this.getPiece(currentX, currentY) !== null
      ) {
        return false // If there's any piece in the way or out of bounds
      }
      currentX += stepX
      currentY += stepY
    }
    return true // Path is clear
  }

  isOnBoard(position) {
    return (
      Array.isArray(position) &&
      position.length === 2 &&
      position[0] >= 0 &&
      position[0] < 8 &&
      position[1] >= 0 &&
      position[1] < 8
    )
  }

  getStepDirection([startX, startY], [endX, endY]) {
    return [Math.sign(endX - startX), Math.sign(endY - startY)]
  }

  isValidBishopMove(start, end) {
    return this.isDiagonalMove(start, end) && this.isPathClear(start, end)
  }

  isValidRookMove(start, end) {
    return this.isStraightMove(start, end) && this.isPathClear(start, end)
  }

  isValidQueenMove(start, end) {
    return (
      this.isValidBishopMove(start, end) || this.isValidRookMove(start, end)
    )
  }

  isValidKnightMove([startX, startY], [endX, endY]) {
    const deltaX = Math.abs(startX - endX)
    const deltaY = Math.abs(startY - endY)
    return (deltaX === 2 && deltaY === 1) || (deltaX === 1 && deltaY === 2)
  }

  isValidPawnMove([startX, startY], [endX, endY]) {
    const direction =
      this.getPiece(startX, startY) === PIECE_TYPES.PAWN ? -1 : 1 // White up (-1), Black down (+1)
    const targetPiece = this.getPiece(endX, endY)

    return (
      this.handlePawnSingleMove(
        startX,
        startY,
        endX,
        endY,
        targetPiece,
        direction,
      ) ||
      this.handlePawnDoubleMove(
        startX,
        startY,
        endX,
        endY,
        targetPiece,
        direction,
      ) ||
      this.handleEnPassant(
        startX,
        startY,
        endX,
        endY,
        targetPiece,
        direction,
      ) ||
      this.handlePawnCaptureMove(
        startX,
        startY,
        endX,
        endY,
        targetPiece,
        direction,
      )
    )
  }

  handleEnPassant(startX, startY, endX, endY, targetPiece, direction) {
    return (
      this.enPassantTarget &&
      this.enPassantTarget[0] === endX &&
      this.enPassantTarget[1] === endY &&
      targetPiece === null &&
      endX === startX + direction &&
      Math.abs(endY - startY) === 1
    )
  }

  handlePawnSingleMove(startX, startY, endX, endY, targetPiece, direction) {
    return (
      endX === startX + direction && endY === startY && targetPiece === null
    )
  }

  handlePawnCaptureMove(startX, startY, endX, endY, targetPiece, direction) {
    return (
      endX === startX + direction &&
      Math.abs(endY - startY) === 1 &&
      targetPiece !== null &&
      this.getPieceColor(targetPiece) !==
        this.getPieceColor(this.getPiece(startX, startY))
    )
  }

  handlePawnDoubleMove(startX, startY, endX, endY, targetPiece, direction) {
    return (
      endX === startX + 2 * direction &&
      endY === startY &&
      targetPiece === null &&
      this.board[startX + direction][startY] === null &&
      startX === (direction === -1 ? 6 : 1)
    )
  }

  promotePawn(position) {
    const piece = this.getPiece(position[0], position[1])
    return (
      piece.toLowerCase() === PIECE_TYPES.PAWN.toLowerCase() &&
      (position[0] === 0 || position[0] === 7)
    )
  }

  getPiecePosition(pieceName, playerColor) {
    const piece =
      playerColor === WHITE ? pieceName.toUpperCase() : pieceName.toLowerCase()
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        if (this.getPiece(x, y) === piece) {
          return [x, y] // Return the position of the piece
        }
      }
    }
    return null // Piece not found
  }

  isValidKingMove(start, end) {
    const deltaX = Math.abs(start[0] - end[0])
    const deltaY = Math.abs(start[1] - end[1])
    const targetPiece = this.getPiece(end[0], end[1])
    const currentPieceColor = this.getPieceColor(
      this.getPiece(start[0], start[1]),
    )
    const targetPieceColor = targetPiece
      ? this.getPieceColor(targetPiece)
      : null

    return (
      deltaX <= 1 &&
      deltaY <= 1 && // Move one square in any direction
      (targetPiece === null || targetPieceColor !== currentPieceColor) // Target square empty or occupied by an enemy piece
    )
  }

  isSquareAttacked(position) {
    const opponentColor = this.currentPlayerTurn === WHITE ? BLACK : WHITE

    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const piece = this.getPiece(x, y)
        if (piece && this.getPieceColor(piece) === opponentColor) {
          if (this.validatePieceMove(piece, [x, y], position)) {
            return true
          }
        }
      }
    }
    return false
  }

  canCastleKingside() {
    return this.canCastle('kingside', this.currentPlayerTurn)
  }

  canCastleQueenside() {
    return this.canCastle('queenside', this.currentPlayerTurn)
  }

  canCastle(side, playerColor) {
    const row = this.getRowForColor(playerColor)

    // Check if the king and rook have moved
    const kingMoved =
      this.pieceMovedStatus[`${playerColor === WHITE ? 'white' : 'black'}King`]
    const rookMoved =
      this.pieceMovedStatus[
        `${playerColor}${
          side === 'kingside' ? 'KingsideRook' : 'QueensideRook'
        }`
      ]

    // Check if the path for castling is clear
    const pathClear =
      side === 'kingside'
        ? this.isPathClear([row, 4], [row, 6]) // Check path for kingside castling
        : this.isPathClear([row, 0], [row, 4]) // Check path for queenside castling

    return !kingMoved && !rookMoved && pathClear // Return true if neither piece has moved and the path is clear
  }

  getRowForColor(color) {
    return color === WHITE ? 7 : 0
  }

  isCastlingMove(start, end) {
    const piece = this.getPiece(start[0], start[1])
    if (piece && [PIECE_TYPES.KING].includes(piece.toUpperCase())) {
      const row = this.getRowForColor(this.currentPlayerTurn)
      if (start[0] === row && start[1] === 4) {
        if (end[0] === row && end[1] === 6) {
          return 'kingside' // Kingside castling
        }
        if (end[0] === row && end[1] === 2) {
          return 'queenside' // Queenside castling
        }
      }
    }
    return null // Not a castling move
  }

  castle(start, end) {
    // Check if King is in check before allowing castling
    const kingPosition = this.getPiecePosition(
      PIECE_TYPES.KING,
      this.currentPlayerTurn,
    )
    if (this.isSquareAttacked(kingPosition)) return // If King is in check, abort castling

    const castlingType = this.isCastlingMove(start, end)
    if (!castlingType) return // Exit if not a castling move

    const row = this.getRowForColor(this.currentPlayerTurn)
    const kingInitialPosition = [row, 4]
    const rookInitialPosition =
      castlingType === 'kingside' ? [row, 7] : [row, 0]
    const kingNewPosition1 = castlingType === 'kingside' ? [row, 6] : [row, 2] // final square
    const kingNewPosition2 = castlingType === 'kingside' ? [row, 5] : [row, 3] // square beside the king
    const rookNewPosition = castlingType === 'kingside' ? [row, 5] : [row, 3]

    const king = this.getPiece(...kingInitialPosition)
    const rook = this.getPiece(...rookInitialPosition)

    const isKingSafe1 = this.performTemporaryMovesAndCheckSafety(
      king,
      rook,
      kingInitialPosition,
      rookInitialPosition,
      kingNewPosition1,
      rookNewPosition,
    )

    const isKingSafe2 = this.performTemporaryMovesAndCheckSafety(
      king,
      rook,
      kingInitialPosition,
      rookInitialPosition,
      kingNewPosition2,
      rookNewPosition,
    )

    // If the King's new position is not safe, abort castling
    if (!isKingSafe1 && !isKingSafe2) return

    // Check specific path clearance for Kingside castling
    if (castlingType === 'kingside' && this.canCastleKingside()) {
      this.finalizeCastling(
        castlingType,
        king,
        rook,
        kingInitialPosition,
        rookInitialPosition,
        kingNewPosition1,
        rookNewPosition,
      )
      this.switchTurn()
      return
    }

    // Check specific path clearance for Queenside castling
    if (castlingType === 'queenside' && this.canCastleQueenside()) {
      this.finalizeCastling(
        castlingType,
        king,
        rook,
        kingInitialPosition,
        rookInitialPosition,
        kingNewPosition1,
        rookNewPosition,
      )
      this.switchTurn()
      return
    }
  }

  performTemporaryMovesAndCheckSafety(
    king,
    rook,
    kingInitialPosition,
    rookInitialPosition,
    kingNewPosition,
    rookNewPosition,
  ) {
    // Temporarily move pieces to validate the castling path
    this.setPiece(...kingNewPosition, king) // Move King to new position
    this.setPiece(...rookNewPosition, rook) // Move Rook to new position
    this.removePiece(...kingInitialPosition) // Remove King from its initial position
    this.removePiece(...rookInitialPosition) // Remove Rook from its initial position

    const kingSafe = !this.isSquareAttacked(kingNewPosition)

    // Undo the temporary moves
    this.removePiece(...kingNewPosition) // Remove King from new position
    this.removePiece(...rookNewPosition) // Remove Rook from new position
    this.setPiece(...kingInitialPosition, king) // Restore King to its initial position
    this.setPiece(...rookInitialPosition, rook) // Restore Rook to its initial position

    return kingSafe
  }

  finalizeCastling(
    castlingType,
    king,
    rook,
    kingInitialPosition,
    rookInitialPosition,
    kingNewPosition,
    rookNewPosition,
  ) {
    this.setPiece(...kingNewPosition, king) // Place King in the new position
    this.setPiece(...rookNewPosition, rook) // Place Rook in the new position
    this.removePiece(...kingInitialPosition) // Remove King from its initial position
    this.removePiece(...rookInitialPosition) // Remove Rook from its initial position

    // Update the movability status for castling
    this.updateCastlingMoveStatus(castlingType)
  }

  updateCastlingMoveStatus(castlingDirection) {
    if (this.currentPlayerTurn === WHITE) {
      this.pieceMovedStatus.whiteKing = true
      this.pieceMovedStatus[
        `white${
          castlingDirection.charAt(0).toUpperCase() + castlingDirection.slice(1)
        }Rook`
      ] = true
    } else {
      this.pieceMovedStatus.blackKing = true
      this.pieceMovedStatus[
        `black${
          castlingDirection.charAt(0).toUpperCase() + castlingDirection.slice(1)
        }Rook`
      ] = true
    }
  }

  isDiagonalMove(start, end) {
    const [startX, startY] = start
    const [endX, endY] = end
    return Math.abs(startX - endX) === Math.abs(startY - endY)
  }

  isStraightMove(start, end) {
    const [startX, startY] = start
    const [endX, endY] = end
    return startX === endX || startY === endY
  }

  switchTurn() {
    this.currentPlayerTurn = this.currentPlayerTurn === WHITE ? BLACK : WHITE
  }

  validatePieceMove(piece, start, end) {
    if (!this.isOnBoard(start) || !this.isOnBoard(end)) {
      return false // Invalid move if start or end is off the board
    }

    const originalPiece = this.getPiece(start[0], start[1])
    const targetPiece = this.getPiece(end[0], end[1])

    if (originalPiece === null) {
      return false // No piece to move
    }

    this.setPiece(end[0], end[1], originalPiece)
    this.removePiece(start[0], start[1])

    const kingPosition = this.getPiecePosition(
      PIECE_TYPES.KING,
      this.currentPlayerTurn,
    )
    const isKingSafe = !this.isSquareAttacked(kingPosition)

    // Undo the temporary move
    this.setPiece(start[0], start[1], originalPiece)
    this.setPiece(end[0], end[1], targetPiece)

    if (!isKingSafe) {
      return false // King is in check after the move, return false
    }

    return this.isValidPieceMoveLogic(piece, start, end)
  }

  isValidPieceMoveLogic(piece, start, end) {
    switch (piece.toLowerCase()) {
      case PIECE_TYPES.PAWN.toLowerCase():
        return this.isValidPawnMove(start, end)
      case PIECE_TYPES.ROOK.toLowerCase():
        return this.isValidRookMove(start, end)
      case PIECE_TYPES.KNIGHT.toLowerCase():
        return this.isValidKnightMove(start, end)
      case PIECE_TYPES.BISHOP.toLowerCase():
        return this.isValidBishopMove(start, end)
      case PIECE_TYPES.QUEEN.toLowerCase():
        return this.isValidQueenMove(start, end)
      case PIECE_TYPES.KING.toLowerCase():
        return this.isValidKingMove(start, end)
      default:
        return false // Invalid piece type
    }
  }

  isValidMove(start, end) {
    const piece = this.getPiece(start[0], start[1])

    if (piece === null) {
      return false // No piece at start
    }

    const pieceColor = this.getPieceColor(piece)

    if (pieceColor !== this.currentPlayerTurn) {
      return false // Not the piece's turn
    }

    const targetPiece = this.getPiece(end[0], end[1])
    if (
      targetPiece !== null &&
      this.getPieceColor(targetPiece) === pieceColor
    ) {
      return false // Can't capture your own piece
    }

    return this.validatePieceMove(piece, start, end)
  }

  calculateMoveDistance(start, end, piece) {
    if (!this.isOnBoard(start) || !this.isOnBoard(end)) {
      throw new Error('Start or end position is out of bounds.')
    }

    const deltaX = Math.abs(end[0] - start[0]) // Difference in rows
    const deltaY = Math.abs(end[1] - start[1]) // Difference in columns

    const dist = Math.max(deltaX, deltaY)

    return { dist, piece }
  }

  makeMove(start, end) {
    const piece = this.getPiece(start[0], start[1])
    const pieceColor = this.getPieceColor(piece)
    const playerColor = this.currentPlayerTurn === WHITE ? 'white' : 'black'

    if (pieceColor !== this.currentPlayerTurn) {
      throw new Error("It's not your turn!")
    }

    if (!this.validatePieceMove(piece, start, end)) {
      throw new Error('Invalid move!')
    }

    // Track if the move involved a pawn or capture
    if (
      piece.toLowerCase() === PIECE_TYPES.PAWN.toLowerCase() ||
      piece.toUpperCase() === PIECE_TYPES.PAWN.toUpperCase() ||
      this.getPiece(end[0], end[1]) !== null
    ) {
      this.fiftyMoveCounter = 0 // Reset counter on pawn move or capture
    } else {
      this.fiftyMoveCounter++ // Increment counter otherwise
    }

    const boardState = this.getBoardState()
    this.boardHistory.push(boardState) // Store the current board state in history

    // return if it's castling move
    if (this.isCastlingMove(start, end)) {
      return
    }

    // Move the piece
    this.setPiece(end[0], end[1], piece)
    this.removePiece(start[0], start[1])

    this.trackPieceMovement(piece, playerColor, start)

    // Handle en-passant
    this.handleEnPassantOnMove(piece, start, end)

    // Check for pawn promotion
    if (this.promotePawn(end)) {
      this.showPawnPromotionPrompt(end)
    }

    // Check for 3-fold repetition
    this.checkThreeFoldRepetition(boardState)

    // Switch turn
    this.switchTurn()
  }

  // check if fifty-move rule applies
  isDrawByFiftyMoveRule() {
    if (this.fiftyMoveCounter >= 100) {
      return true // Draw by the fifty-move rule
    }
    return false // Not yet eligible for fifty-move draw
  }

  trackPieceMovement(piece, playerColor, start) {
    if (piece.toLowerCase() === PIECE_TYPES.KING.toLowerCase()) {
      // King moved
      this.pieceMovedStatus[`${playerColor}King`] = true
    } else if (piece.toLowerCase() === PIECE_TYPES.ROOK.toLowerCase()) {
      // Rook moved
      const row = this.getRowForColor(playerColor === 'white' ? WHITE : BLACK)
      if (start[0] === row && start[1] === 0) {
        // Queenside rook
        this.pieceMovedStatus[`${playerColor}QueensideRook`] = true
      } else if (start[0] === row && start[1] === 7) {
        // Kingside rook
        this.pieceMovedStatus[`${playerColor}KingsideRook`] = true
      }
    }
  }

  handleEnPassantOnMove(piece, start, end) {
    if (
      piece.toLowerCase() === PIECE_TYPES.PAWN.toLowerCase() &&
      Math.abs(start[0] - end[0]) === 2
    ) {
      // Save potential en-passant target
      this.enPassantTarget = [(start[0] + end[0]) / 2, end[1]]
    } else {
      this.enPassantTarget = null // Clear en-passant target if not relevant
    }
  }

  checkThreeFoldRepetition(boardState) {
    const repetitionCount = this.boardHistory.filter(
      (state) => state === boardState,
    ).length

    if (repetitionCount === 2) {
      this.repetitionCountTwoTracker++ // Increment the counter
    }
    if (this.repetitionCountTwoTracker === 4) {
      this.isDrawByRepetition = true // Mark draw by repetition
      this.repetitionCountTwoTracker = 0 // Reset the tracker
    }
  }

  getBoardState() {
    return this.board.map((row) => row.join(',')).join('|') // Create a unique state string for the board
  }

  getFEN() {
    let fen = ''

    // 1. Convert the board to FEN format
    for (let row of this.board) {
      let emptyCount = 0
      for (let square of row) {
        if (square) {
          if (emptyCount > 0) {
            fen += emptyCount // Add empty squares if any
            emptyCount = 0
          }
          fen += square // Add the piece
        } else {
          emptyCount++
        }
      }
      if (emptyCount > 0) {
        fen += emptyCount // Add remaining empty squares if at the end of the row
      }
      fen += '/' // Move to the next rank
    }

    // Remove the last slash
    fen = fen.slice(0, -1)

    // 2. Active color
    fen += ` ${this.currentPlayerTurn === WHITE ? 'w' : 'b'}`

    // 3. Castling rights
    const castlingRights = []
    if (
      !this.pieceMovedStatus.whiteKing &&
      !this.pieceMovedStatus.whiteKingsideRook
    ) {
      castlingRights.push('K') // White can castle kingside
    }
    if (
      !this.pieceMovedStatus.whiteKing &&
      !this.pieceMovedStatus.whiteQueensideRook
    ) {
      castlingRights.push('Q') // White can castle queenside
    }
    if (
      !this.pieceMovedStatus.blackKing &&
      !this.pieceMovedStatus.blackKingsideRook
    ) {
      castlingRights.push('k') // Black can castle kingside
    }
    if (
      !this.pieceMovedStatus.blackKing &&
      !this.pieceMovedStatus.blackQueensideRook
    ) {
      castlingRights.push('q') // Black can castle queenside
    }
    fen += ` ${castlingRights.join('') || '-'}` // Defaults to '-' if no castling rights

    // 4. En passant target square
    fen += ` ${
      this.enPassantTarget
        ? `${this.enPassantTarget[1]}${8 - this.enPassantTarget[0]}`
        : '-'
    }`

    // 5. Halfmove clock (for fifty-move rule)
    fen += ` ${this.fiftyMoveCounter}`

    // 6. Fullmove number
    fen += ` ${Math.floor(this.boardHistory.length / 2) + 1}` // Adjust full move number

    return fen // Return the FEN string
  }

  showPawnPromotionPrompt(position) {
    while (true) {
      try {
        const selectedPiece = prompt(
          `Choose piece to promote to ${
            this.currentPlayerTurn === WHITE ? 'Q, R, B, N' : 'q, r, b, n'
          } `,
        )
        this.setPiece(
          position[0],
          position[1],
          this.handlePawnPromotion(selectedPiece),
        )
        break // Exit the loop if successful
      } catch (error) {
        alert(error) // Show error if the selected piece is invalid
      }
    }
  }

  handlePawnPromotion(selectedPiece) {
    const validPiecesWhite = [
      PIECE_TYPES.QUEEN,
      PIECE_TYPES.ROOK,
      PIECE_TYPES.BISHOP,
      PIECE_TYPES.KNIGHT,
    ]
    const validPiecesBlack = validPiecesWhite.map((piece) =>
      piece.toLowerCase(),
    )

    if (
      (validPiecesWhite.includes(selectedPiece) &&
        this.currentPlayerTurn === WHITE) ||
      (validPiecesBlack.includes(selectedPiece) &&
        this.currentPlayerTurn === BLACK)
    ) {
      return selectedPiece // Return selected piece
    } else {
      throw new Error(
        `Invalid promotion piece! Choose from ${
          this.currentPlayerTurn === WHITE ? 'Q, R, B, N' : 'q, r, b, n'
        }`,
      )
    }
  }

  isCheckmate() {
    const kingPosition = this.getPiecePosition(
      PIECE_TYPES.KING,
      this.currentPlayerTurn,
    )

    // If the king isn't in check, it can't be checkmate
    if (!this.isSquareAttacked(kingPosition)) return false

    // Check if the king has any escape moves
    if (this.kingHasEscapeMoves(kingPosition)) return false

    // Check if any piece can block the check
    if (this.isPieceCanBlockCheck(kingPosition)) return false

    // If no valid moves can protect the king and the king can't move, it's checkmate
    return true
  }

  kingHasEscapeMoves(kingPosition) {
    const [kingX, kingY] = kingPosition

    for (let x = kingX - 1; x <= kingX + 1; x++) {
      for (let y = kingY - 1; y <= kingY + 1; y++) {
        if (
          this.isOnBoard([x, y]) &&
          this.isValidKingMove(kingPosition, [x, y])
        ) {
          const targetPiece = this.getPiece(x, y)
          if (
            targetPiece === null ||
            this.getPieceColor(targetPiece) !== this.currentPlayerTurn
          ) {
            // Check if the king moving to this square does not lead to check
            if (this.canMoveSafely(kingPosition, [x, y])) {
              return true // Escape move found
            }
          }
        }
      }
    }

    return false // No escape moves available
  }

  canMoveSafely(start, end) {
    const originalPiece = this.getPiece(start[0], start[1])
    const targetPiece = this.getPiece(end[0], end[1])

    // Temporarily make the move
    this.setPiece(end[0], end[1], originalPiece)
    this.removePiece(start[0], start[1])

    const isStillSafe = !this.isSquareAttacked(end)

    // Undo the temporary move
    this.removePiece(end[0], end[1])
    this.setPiece(start[0], start[1], originalPiece)

    if (targetPiece) {
      this.setPiece(end[0], end[1], targetPiece) // Restore target piece
    }

    return isStillSafe
  }

  isPieceCanBlockCheck(kingPosition) {
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const piece = this.getPiece(x, y)
        if (piece && this.getPieceColor(piece) === this.currentPlayerTurn) {
          const validMoves = this.getValidMoves([x, y])

          for (const move of validMoves) {
            // Temporarily make this move
            const originalTargetPiece = this.getPiece(move[0], move[1])
            this.setPiece(move[0], move[1], piece)
            this.removePiece(x, y)

            if (!this.isSquareAttacked(kingPosition)) {
              // Move was deemed valid for blocking the check
              // Restore the board
              this.setPiece(x, y, piece) // Move the piece back
              this.setPiece(move[0], move[1], originalTargetPiece) // Restore target piece
              return true // Block found
            }

            // Restore the board
            this.setPiece(x, y, piece) // Move the piece back
            this.setPiece(move[0], move[1], originalTargetPiece) // Restore target piece
          }
        }
      }
    }
    return false // No blocking moves available
  }

  isStalemate() {
    const kingPosition = this.getPiecePosition(
      PIECE_TYPES.KING,
      this.currentPlayerTurn,
    )
    if (this.isSquareAttacked(kingPosition)) {
      return false // Not stalemate as the king is in check
    }

    // Check for any legal moves available
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const piece = this.getPiece(x, y)
        if (piece && this.getPieceColor(piece) === this.currentPlayerTurn) {
          const validMoves = this.getValidMoves([x, y])
          if (validMoves.length > 0) {
            return false // Found a valid move, so it's not stalemate
          }
        }
      }
    }

    return true // No valid moves available, thus stalemate
  }

  // Method to convert move string like 'c5d5' into coordinates
  getCoordinatesFromMove(move) {
    if (move.length !== 4) {
      throw new Error('Invalid move format! Move must be 4 characters long.')
    }

    const startFile = move[0] // The first letter representing the starting file
    const startRank = move[1] // The first number representing the starting rank
    const endFile = move[2] // The second letter representing the ending file
    const endRank = move[3] // The second number representing the ending rank

    const startX = 8 - parseInt(startRank, 10) // Convert rank to array index (0-7)
    const startY = startFile.charCodeAt(0) - 'a'.charCodeAt(0) // Convert file from letter to index
    const endX = 8 - parseInt(endRank, 10) // Convert rank to array index (0-7)
    const endY = endFile.charCodeAt(0) - 'a'.charCodeAt(0) // Convert file from letter to index

    return {
      start: [startX, startY],
      end: [endX, endY],
    }
  }

  getValidMoves(position) {
    const validMoves = []
    const piece = this.getPiece(position[0], position[1])
    if (!piece) {
      throw new Error('No piece at given position!')
    }

    for (let targetX = 0; targetX < 8; targetX++) {
      for (let targetY = 0; targetY < 8; targetY++) {
        if (this.isValidMove(position, [targetX, targetY])) {
          validMoves.push([targetX, targetY])
        }
      }
    }

    return validMoves // Return an array of valid move positions
  }

  isDrawByInsufficientMaterial() {
    const pieceCounts = this.countPieces()
    return this.checkInsufficientMaterial(pieceCounts)
  }

  countPieces() {
    // Initialize counts for both colors
    const counts = {
      white: { total: 0, bishops: 0, knights: 0, rooks: 0, pawns: 0, king: 1 },
      black: { total: 0, bishops: 0, knights: 0, rooks: 0, pawns: 0, king: 1 },
    }

    const pieceTypeMap = {
      [PIECE_TYPES.BISHOP.toUpperCase()]: 'bishops',
      [PIECE_TYPES.KNIGHT.toUpperCase()]: 'knights',
      [PIECE_TYPES.ROOK.toUpperCase()]: 'rooks',
      [PIECE_TYPES.PAWN.toUpperCase()]: 'pawns',
      [PIECE_TYPES.BISHOP.toLowerCase()]: 'bishops',
      [PIECE_TYPES.KNIGHT.toLowerCase()]: 'knights',
      [PIECE_TYPES.ROOK.toLowerCase()]: 'rooks',
      [PIECE_TYPES.PAWN.toLowerCase()]: 'pawns',
    }

    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const piece = this.getPiece(x, y)
        if (!piece) continue // Skip empty squares

        const color = piece === piece.toUpperCase() ? 'white' : 'black'
        counts[color].total++

        // Determine the piece type
        const capitalizedPiece =
          piece === piece.toUpperCase() ? piece : piece.toLowerCase()
        const pieceType = pieceTypeMap[capitalizedPiece]
        if (pieceType) {
          counts[color][pieceType]++
        }
      }
    }

    return counts // Return the piece counts for both colors
  }

  checkInsufficientMaterial(pieceCounts) {
    const { white, black } = pieceCounts

    // king vs king
    const isKingVsKing =
      white.king === 1 &&
      black.king === 1 &&
      white.total === 1 &&
      black.total === 1

    // king vs king + bishop
    // king vs king + knight
    const isKingVsMinorPiece = (piece) =>
      (white.king === 1 &&
        black.king === 1 &&
        white.total === 1 &&
        black[piece] === 1 &&
        black.total === 2) ||
      (black.king === 1 &&
        white.king === 1 &&
        black.total === 1 &&
        white[piece] === 1 &&
        white.total === 2)

    // king + bishop vs king + bishop
    // king + knight vs king + knight
    // king + bishop vs king + knight
    const isKingMinorPieceVsKingMinorPiece = (piece) =>
      (white.king === 1 &&
        black.king === 1 &&
        white[piece] === 1 &&
        black[piece] === 1 &&
        white.total === 2 &&
        black.total === 2) ||
      // king + bishop vs king + knight
      (white.king === 1 &&
        black.king === 1 &&
        white.bishops === 1 &&
        black.knights === 1 &&
        white.total === 2 &&
        black.total === 2) ||
      (black.king === 1 &&
        white.king === 1 &&
        black.bishops === 1 &&
        white.knights === 1 &&
        black.total === 2 &&
        white.total === 2)

    return (
      isKingVsKing ||
      isKingVsMinorPiece('bishops') ||
      isKingVsMinorPiece('knights') ||
      isKingMinorPieceVsKingMinorPiece('bishops') ||
      isKingMinorPieceVsKingMinorPiece('knights') ||
      false
    )
  }

  // Simple representation of the board
  displayBoard() {
    console.log(
      this.board
        .map((row) => row.map((piece) => piece || '.').join(' '))
        .join('\n'),
    )
    console.log(
      `Current turn: ${this.currentPlayerTurn === WHITE ? 'White' : 'Black'}`,
    )
  }
}

// Example of initial FEN notation for a standard chess game
// rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 - standard position
// 2Q2bnr/4pkpq/5p1r/7p/7P/4P3/PPPP1PP1/RNB1KBNR b KQ - 0 9 - stalemate position
// 2k4r/1pp3pp/p1pr1pb1/3Pp3/Nq4P1/1P1PKN1P/2P1QP2/3R3R b - - 0 1 - checkmate position
// 5Bnk/8/6K1/8/8/8/8/8 w - - 0 1 - insufficient material position
// 2n/1P/4k3/1p3p2/7p/P1P2P1K/4p/3N w - - 0 41 - pawn promotion position
// r3kbnr/pppppppp/8/2q/8/8/PPPP2PP/RNBQK2R w KQkq - 0 1 - castling position

// https://lichess.org/3KkqKLdO#66 3-fold rep testing
// https://lichess.org/games/search?perf=6&mode=1&durationMin=600&durationMax=600&status=34&dateMin=2024-10-28&dateMax=2024-10-29&sort.field=d&sort.order=desc#results

const initialFEN = 'r3kbnr/pppppppp/8/2q/8/8/PPPP2PP/RNBQK2R w KQkq - 0 1'
export const chess = new ChessGame(initialFEN)
