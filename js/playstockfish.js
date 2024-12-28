// playstockfish.js

export class PlayStockfish {
  constructor(chessGame, chessUI, color) {
    this.chessGame = chessGame
    this.chessUI = chessUI
    this.color = color // This represents whether it's the Black or White Stockfish
    this.stockfish = new Worker('./stockfish/stockfish-16.1-lite-single.js')
    this.stockfishLevel = 0

    this.initializeStockfish()
  }

  initializeStockfish() {
    this.stockfish.onmessage = (event) => {
      const message = event.data
      if (message.includes('bestmove')) {
        const bestMove = this.extractBestMove(message)
        this.handleStockfishMove(bestMove)
      }
    }

    this.stockfish.postMessage(
      `setoption name Skill Level value ${this.stockfishLevel}`,
    ) // Set Stockfish strength skill level (1-20)
  }

  extractBestMove(message) {
    const parts = message.split(' ') // get the best move from the message from stockfish
    return parts[1] // returns the "e2e4" part
  }

  handleStockfishMove(move) {
    const coordinates = this.chessGame.getCoordinatesFromMove(move)

    const start = coordinates['start']
    const end = coordinates['end']

    // Check for castling move
    const castlingType = this.chessGame.isCastlingMove(start, end)
    if (castlingType) {
      try {
        this.chessGame.castle(start, end)
        this.chessUI.renderBoard()
        if (this.chessUI.isWhitePlaysAsBot && this.chessUI.isBlackPlaysAsBot)
          this.chessUI.stockfishMove() // Trigger Stockfish move again
      } catch (error) {
        console.error(error)
      }
      return // Exit after handling castling
    }

    // Check for pawn promotion
    const promotionPieces = ['q', 'b', 'r', 'n', 'Q', 'B', 'R', 'N']
    if (move.length === 5 && promotionPieces.includes(move[4])) {
      const promotionPiece = move[4]

      // Ensure pawn exists at starting position and is the correct color
      if (
        this.chessGame.getPiece(start[0], start[1]).toLowerCase() === 'p' ||
        this.chessGame.getPiece(start[0], start[1]).toUpperCase() === 'P'
      ) {
        this.chessGame.setPiece(end[0], end[1], promotionPiece)
        this.chessGame.removePiece(start[0], start[1])
        this.chessUI.renderBoard()
        this.chessGame.switchTurn()
        if (this.chessUI.isWhitePlaysAsBot && this.chessUI.isBlackPlaysAsBot)
          this.chessUI.stockfishMove() // Trigger Stockfish move again
        return // Exit after handling pawn promotion
      }
    }

    try {
      this.chessGame.makeMove(start, end)
      this.chessUI.renderBoard()
      if (this.chessUI.isWhitePlaysAsBot && this.chessUI.isBlackPlaysAsBot)
        this.chessUI.stockfishMove() // Trigger Stockfish move again
    } catch (error) {
      console.error(error)
    }
  }

  requestStockfishMove() {
    const fen = this.chessGame.getFEN() // Get FEN from current game state
    this.stockfish.postMessage(`position fen ${fen}`)
    this.stockfish.postMessage('go movetime 1000') // Specify the move time for Stockfish
  }

  onPlayerMove(gameOver) {
    if (!gameOver) {
      this.requestStockfishMove() // Ask Stockfish for a move
    }
  }
}
