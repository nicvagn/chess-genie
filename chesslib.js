// chesslib.js
export const WHITE = 'w'
export const BLACK = 'b'

export const PIECE_TYPES = {
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
    this.piecePositions = this.initializeBoard(board)
    this.enPassantTarget = null
    this.boardHistory = []
    this.isDrawByRepetition = false
    this.repetitionCountTwoTracker = 0
    this.fiftyMoveCounter = 0
    this.cachedValidMoves = {}
    this.lastMove = null

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
    const piecePositions = {}
    const rows = fenNotation.split('/')

    rows.forEach((row, rowIndex) => {
      let fileIndex = 0
      for (const char of row) {
        if (isNaN(char)) {
          const piece = char
          const position = `${rowIndex},${fileIndex}`
          piecePositions[position] = piece
          fileIndex++
        } else {
          fileIndex += parseInt(char, 10)
        }
      }
    })
    return piecePositions
  }

  getPiece(x, y) {
    return this.piecePositions[`${x},${y}`] || null
  }

  setPiece(x, y, piece) {
    if (piece) {
      this.piecePositions[`${x},${y}`] = piece
    } else {
      delete this.piecePositions[`${x},${y}`]
    }
  }

  removePiece(x, y) {
    this.setPiece(x, y, null)
  }

  getPieceColor(piece) {
    if (!piece) return null
    return piece === piece.toUpperCase() ? WHITE : BLACK
  }

  isPathClear(start, end) {
    const [startX, startY] = start
    const [endX, endY] = end

    if (!this.isOnBoard(start) || !this.isOnBoard(end)) return false

    const [stepX, stepY] = this.getStepDirection(start, end)
    let currentX = startX + stepX
    let currentY = startY + stepY

    while (currentX !== endX || currentY !== endY) {
      if (
        !this.isOnBoard([currentX, currentY]) ||
        this.getPiece(currentX, currentY) !== null
      ) {
        return false
      }
      currentX += stepX
      currentY += stepY
    }
    return true
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
      this.getPiece(startX + direction, startY) === null &&
      startX === (direction === -1 ? 6 : 1)
    )
  }

  getPiecePosition(pieceName, playerColor) {
    const piece =
      playerColor === WHITE ? pieceName.toUpperCase() : pieceName.toLowerCase()
    return Object.entries(this.piecePositions).reduce((positions, [pos, p]) => {
      if (p === piece) positions.push(pos.split(',').map(Number))
      return positions
    }, [])
  }

  getCachedValidMoves(position) {
    const key = `${position[0]},${position[1]}`
    if (this.cachedValidMoves[key]) {
      return this.cachedValidMoves[key]
    }

    const validMoves = this.getValidMoves(position)
    this.cachedValidMoves[key] = validMoves
    return validMoves
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
      deltaY <= 1 &&
      (targetPiece === null || targetPieceColor !== currentPieceColor)
    )
  }

  isSquareAttacked(square) {
    const opponentColor = this.currentPlayerTurn === WHITE ? BLACK : WHITE

    for (const [position, piece] of Object.entries(this.piecePositions)) {
      const [x, y] = position.split(',').map(Number)
      if (piece && this.getPieceColor(piece) === opponentColor) {
        if (this.validatePieceMove([x, y], square)) {
          return true
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

    const kingMoved =
      this.pieceMovedStatus[`${playerColor === WHITE ? 'white' : 'black'}King`]
    const rookMoved =
      this.pieceMovedStatus[
        `${playerColor}${
          side === 'kingside' ? 'KingsideRook' : 'QueensideRook'
        }`
      ]

    const pathClear =
      side === 'kingside'
        ? this.isPathClear([row, 4], [row, 6])
        : this.isPathClear([row, 0], [row, 4])

    return !kingMoved && !rookMoved && pathClear
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
          return 'kingside'
        }
        if (end[0] === row && end[1] === 2) {
          return 'queenside'
        }
      }
    }
    return null
  }

  castle(start, end) {
    const row = this.getRowForColor(this.currentPlayerTurn)
    const castlingType = this.isCastlingMove(start, end)
    if (!castlingType) return

    const kingPosition = [row, 4]
    const rookPosition = castlingType === 'kingside' ? [row, 7] : [row, 0]
    const finalKingSquare = castlingType === 'kingside' ? [row, 6] : [row, 2]
    const squareBesidesKing = castlingType === 'kingside' ? [row, 5] : [row, 3]
    const finalRookSquare = castlingType === 'kingside' ? [row, 5] : [row, 3]

    const king = this.getPiece(...kingPosition)
    const rook = this.getPiece(...rookPosition)

    if (this.isSquareAttacked(kingPosition)) return

    const isFinalKingSquareAttacked = this.isPieceSafeAfterMove(
      kingPosition,
      finalKingSquare,
    )
    const isSquareBesideKingAttacked = this.isPieceSafeAfterMove(
      kingPosition,
      squareBesidesKing,
    )

    if (!isFinalKingSquareAttacked || !isSquareBesideKingAttacked) return

    if (
      (castlingType === 'kingside' && this.canCastleKingside()) ||
      (castlingType === 'queenside' && this.canCastleQueenside())
    ) {
      this.finalizeCastling(
        castlingType,
        king,
        rook,
        kingPosition,
        rookPosition,
        finalKingSquare,
        finalRookSquare,
      )
      this.switchTurn()
      return
    }
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
    this.setPiece(...kingNewPosition, king)
    this.setPiece(...rookNewPosition, rook)
    this.removePiece(...kingInitialPosition)
    this.removePiece(...rookInitialPosition)

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
    this.cachedValidMoves = {}
  }

  validatePieceMove(start, end) {
    if (!this.isOnBoard(start) || !this.isOnBoard(end)) {
      return false
    }

    const originalPiece = this.getPiece(start[0], start[1])
    const targetPiece = this.getPiece(end[0], end[1])

    if (originalPiece === null) {
      return false
    }

    if (this.isValidPieceMoveLogic(originalPiece, start, end)) {
      this.setPiece(end[0], end[1], originalPiece)
      this.removePiece(start[0], start[1])

      const kingPosition = this.getPiecePosition(
        PIECE_TYPES.KING,
        this.currentPlayerTurn,
      )[0]
      const isKingAttacked = !this.isSquareAttacked(kingPosition)

      this.setPiece(start[0], start[1], originalPiece)
      this.setPiece(end[0], end[1], targetPiece)

      return isKingAttacked
    }

    return false
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
        return false
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

    return this.validatePieceMove(start, end)
  }

  calculateMoveDistance(start, end, piece) {
    if (!this.isOnBoard(start) || !this.isOnBoard(end)) {
      throw new Error('Start or end position is out of bounds.')
    }

    const deltaX = Math.abs(end[0] - start[0])
    const deltaY = Math.abs(end[1] - start[1])

    return { dist: Math.max(deltaX, deltaY), piece }
  }

  makeMove(start, end) {
    const piece = this.getPiece(start[0], start[1])
    const pieceColor = this.getPieceColor(piece)
    const playerColor = this.currentPlayerTurn === WHITE ? 'white' : 'black'

    if (pieceColor !== this.currentPlayerTurn) {
      throw new Error("It's not your turn!")
    }

    if (!this.validatePieceMove(start, end)) {
      throw new Error('Invalid move!')
    }

    if (
      piece.toLowerCase() === PIECE_TYPES.PAWN.toLowerCase() ||
      this.getPiece(end[0], end[1]) !== null
    ) {
      this.fiftyMoveCounter = 0
    } else {
      this.fiftyMoveCounter++
    }

    const boardState = this.getBoardState()
    this.boardHistory.push(boardState)

    if (this.isCastlingMove(start, end)) {
      return
    }

    this.setPiece(end[0], end[1], piece)
    this.removePiece(start[0], start[1])

    this.lastMove = { start, end }

    this.isCheck()
    this.trackPieceMovement(piece, playerColor, start)
    this.handleEnPassantOnMove(piece, start, end)
    this.checkThreeFoldRepetition(boardState)

    this.switchTurn()
  }

  isDrawByFiftyMoveRule() {
    return this.fiftyMoveCounter >= 100
  }

  trackPieceMovement(piece, playerColor, start) {
    if (piece.toLowerCase() === PIECE_TYPES.KING.toLowerCase()) {
      this.pieceMovedStatus[`${playerColor}King`] = true
    } else if (piece.toLowerCase() === PIECE_TYPES.ROOK.toLowerCase()) {
      const row = this.getRowForColor(playerColor === 'white' ? WHITE : BLACK)
      if (start[0] === row && start[1] === 0) {
        this.pieceMovedStatus[`${playerColor}QueensideRook`] = true
      } else if (start[0] === row && start[1] === 7) {
        this.pieceMovedStatus[`${playerColor}KingsideRook`] = true
      }
    }
  }

  handleEnPassantOnMove(piece, start, end) {
    if (
      piece.toLowerCase() === PIECE_TYPES.PAWN.toLowerCase() &&
      Math.abs(start[0] - end[0]) === 2
    ) {
      this.enPassantTarget = [(start[0] + end[0]) / 2, end[1]]
    } else {
      this.enPassantTarget = null
    }
  }

  checkThreeFoldRepetition(boardState) {
    const repetitionCount = this.boardHistory.filter(
      (state) => state === boardState,
    ).length

    if (repetitionCount === 2) {
      this.repetitionCountTwoTracker++
    }
    if (this.repetitionCountTwoTracker === 4) {
      this.isDrawByRepetition = true
      this.repetitionCountTwoTracker = 0
    }
  }

  getBoardState() {
    return JSON.stringify(this.piecePositions)
  }

  getFEN() {
    let fen = ''

    for (let rank = 0; rank < 8; rank++) {
      let emptyCount = 0
      for (let file = 0; file < 8; file++) {
        const piece = this.getPiece(rank, file)
        if (piece) {
          if (emptyCount > 0) {
            fen += emptyCount
            emptyCount = 0
          }
          fen += piece
        } else {
          emptyCount++
        }
      }
      if (emptyCount > 0) {
        fen += emptyCount
      }
      if (rank < 7) {
        fen += '/'
      }
    }

    fen += ` ${this.currentPlayerTurn === WHITE ? 'w' : 'b'}`

    const castlingRights = []
    if (
      !this.pieceMovedStatus.whiteKing &&
      !this.pieceMovedStatus.whiteKingsideRook
    ) {
      castlingRights.push('K')
    }
    if (
      !this.pieceMovedStatus.whiteKing &&
      !this.pieceMovedStatus.whiteQueensideRook
    ) {
      castlingRights.push('Q')
    }
    if (
      !this.pieceMovedStatus.blackKing &&
      !this.pieceMovedStatus.blackKingsideRook
    ) {
      castlingRights.push('k')
    }
    if (
      !this.pieceMovedStatus.blackKing &&
      !this.pieceMovedStatus.blackQueensideRook
    ) {
      castlingRights.push('q')
    }
    fen += ` ${castlingRights.join('') || '-'}`

    fen += ` ${
      this.enPassantTarget
        ? `${this.enPassantTarget[1]}${8 - this.enPassantTarget[0]}`
        : '-'
    }`

    fen += ` ${this.fiftyMoveCounter}`
    fen += ` ${Math.floor(this.boardHistory.length / 2) + 1}`

    return fen
  }

  handlePawnPromotion(row, column, selectedPiece) {
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
      this.setPiece(row, column, selectedPiece)
      this.switchTurn()
    } else {
      throw new Error(
        `Invalid promotion piece! Choose from ${
          this.currentPlayerTurn === WHITE ? 'Q, R, B, N' : 'q, r, b, n'
        }`,
      )
    }
  }

  isSquareAttackedByLastMove(targetSquare) {
    const lastMoveEnd = this.lastMove.end
    const movingPiece = this.getPiece(...lastMoveEnd)

    // Check if the moving piece is valid and if the move was actually made
    if (!movingPiece || !lastMoveEnd) {
      return false
    }

    // Validate the movement of the piece to check if it can attack the target square
    const movingPiecePosition = lastMoveEnd // The piece's start position is the end of its last move
    return this.isValidPieceMoveLogic(
      movingPiece,
      movingPiecePosition,
      targetSquare,
    )
  }

  isCheck() {
    const kingPosition = this.getPiecePosition(
      PIECE_TYPES.KING,
      this.currentPlayerTurn === WHITE ? BLACK : WHITE,
    )[0]
    return this.isSquareAttackedByLastMove(kingPosition)
  }

  isCheckmate() {
    const kingPosition = this.getPiecePosition(
      PIECE_TYPES.KING,
      this.currentPlayerTurn,
    )[0]

    if (!this.isSquareAttacked(kingPosition)) return false

    if (this.kingHasEscapeMoves(kingPosition)) return false

    if (this.isPieceCanBlockCheck(kingPosition)) return false

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
            if (this.isPieceSafeAfterMove(kingPosition, [x, y])) {
              return true
            }
          }
        }
      }
    }

    return false
  }

  isPieceSafeAfterMove(start, end) {
    const originalPiece = this.getPiece(start[0], start[1])
    const targetPiece = this.getPiece(end[0], end[1])

    this.setPiece(end[0], end[1], originalPiece)
    this.removePiece(start[0], start[1])

    const isStillSafe = !this.isSquareAttacked(end)

    this.removePiece(end[0], end[1])
    this.setPiece(start[0], start[1], originalPiece)

    if (targetPiece) {
      this.setPiece(end[0], end[1], targetPiece)
    }

    return isStillSafe
  }

  isPieceCanBlockCheck(kingPosition) {
    for (const [position, piece] of Object.entries(this.piecePositions)) {
      const [x, y] = position.split(',').map(Number)
      if (piece && this.getPieceColor(piece) === this.currentPlayerTurn) {
        const validMoves = this.getCachedValidMoves([x, y])
        for (const move of validMoves) {
          const originalTargetPiece = this.getPiece(move[0], move[1])
          this.setPiece(move[0], move[1], piece)
          this.removePiece(x, y)

          if (!this.isSquareAttacked(kingPosition)) {
            this.setPiece(x, y, piece)
            this.setPiece(move[0], move[1], originalTargetPiece)
            return true
          }

          this.setPiece(x, y, piece)
          this.setPiece(move[0], move[1], originalTargetPiece)
        }
      }
    }
    return false
  }

  isStalemate() {
    const kingPosition = this.getPiecePosition(
      PIECE_TYPES.KING,
      this.currentPlayerTurn,
    )[0]
    if (this.isSquareAttacked(kingPosition)) {
      return false
    }

    for (const [position, piece] of Object.entries(this.piecePositions)) {
      const [x, y] = position.split(',').map(Number)
      if (piece && this.getPieceColor(piece) === this.currentPlayerTurn) {
        const validMoves = this.getCachedValidMoves([x, y])
        if (validMoves.length > 0) {
          return false
        }
      }
    }

    return true
  }

  getCoordinatesFromMove(move) {
    const startFile = move[0]
    const startRank = move[1]
    const endFile = move[2]
    const endRank = move[3]

    const startX = 8 - parseInt(startRank, 10)
    const startY = startFile.charCodeAt(0) - 'a'.charCodeAt(0)
    const endX = 8 - parseInt(endRank, 10)
    const endY = endFile.charCodeAt(0) - 'a'.charCodeAt(0)

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

    return validMoves
  }

  isDrawByInsufficientMaterial() {
    const pieceCounts = this.countPieces()
    return this.checkInsufficientMaterial(pieceCounts)
  }

  countPieces() {
    const counts = {
      w: { total: 0, bishops: 0, knights: 0, rooks: 0, pawns: 0, king: 1 },
      b: { total: 0, bishops: 0, knights: 0, rooks: 0, pawns: 0, king: 1 },
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

    for (const [position, piece] of Object.entries(this.piecePositions)) {
      const color = this.getPieceColor(piece)
      counts[color].total++

      const capitalizedPiece =
        piece === piece.toUpperCase() ? piece : piece.toLowerCase()
      const pieceType = pieceTypeMap[capitalizedPiece]
      if (pieceType) {
        counts[color][pieceType]++
      }
    }

    return counts // Return the piece counts for both colors
  }

  checkInsufficientMaterial(pieceCounts) {
    const { w, b } = pieceCounts

    // king vs king
    const isKingVsKing =
      w.king === 1 && b.king === 1 && w.total === 1 && b.total === 1

    // king vs king + bishop
    // king vs king + knight
    const isKingVsMinorPiece = (piece) =>
      (w.king === 1 &&
        b.king === 1 &&
        w.total === 1 &&
        b[piece] === 1 &&
        b.total === 2) ||
      (b.king === 1 &&
        w.king === 1 &&
        b.total === 1 &&
        w[piece] === 1 &&
        w.total === 2)

    // king + bishop vs king + bishop
    // king + knight vs king + knight
    // king + bishop vs king + knight
    const isKingMinorPieceVsKingMinorPiece = (piece) =>
      (w.king === 1 &&
        b.king === 1 &&
        w[piece] === 1 &&
        b[piece] === 1 &&
        w.total === 2 &&
        b.total === 2) ||
      // king + bishop vs king + knight
      (w.king === 1 &&
        b.king === 1 &&
        w.bishops === 1 &&
        b.knights === 1 &&
        w.total === 2 &&
        b.total === 2) ||
      (b.king === 1 &&
        w.king === 1 &&
        b.bishops === 1 &&
        w.knights === 1 &&
        b.total === 2 &&
        w.total === 2)

    return (
      isKingVsKing ||
      isKingVsMinorPiece('bishops') ||
      isKingVsMinorPiece('knights') ||
      isKingMinorPieceVsKingMinorPiece('bishops') ||
      isKingMinorPieceVsKingMinorPiece('knights') ||
      false
    )
  }

  displayBoard() {
    const boardRepresentation = Array.from({ length: 8 }, () =>
      Array(8).fill('.'),
    )

    for (const [pos, piece] of Object.entries(this.piecePositions)) {
      const [x, y] = pos.split(',').map(Number)
      boardRepresentation[x][y] = piece
    }

    console.log(boardRepresentation.map((row) => row.join(' ')).join('\n'))
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
