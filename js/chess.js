//chess.js

import { BLACK, PIECE_TYPES, WHITE, chess } from './chesslib.js'
import { PlayStockfish } from './playstockfish.js'

class ChessUI {
  constructor(chessGame) {
    this.chessGame = chessGame
    this.selectedPiece = null
    this.chessboardElement = document.getElementById('chessboard')
    this.chessPieceMap = {
      K: 'wK',
      Q: 'wQ',
      R: 'wR',
      B: 'wB',
      N: 'wN',
      P: 'wP',
      k: 'bK',
      q: 'bQ',
      r: 'bR',
      b: 'bB',
      n: 'bN',
      p: 'bP',
    }
    this.gameOver = false
    this.isFlipped = false
    this.isBotGame = false
    this.isWhitePlaysAsHuman = false
    this.isBlackPlaysAsHuman = false
    this.isWhitePlaysAsBot = false
    this.isBlackPlaysAsBot = false
    this.stockfishAIWhite = null
    this.stockfishAIBlack = null
    this.lastMove = null
    this.highlightedSquares = [] // Highlight last move squares (moved from & moved to)

    this.hideOtherPieces = false // State for hiding pieces
    this.togglePawnsButton()
    this.initializeBoard()
    this.flipChessboard()

    this.setupGameModeSelection()
  }

  initializeBoard() {
    this.showRankFileLabels()
    this.renderBoard()
  }

  showRankFileLabels() {
    const fileLabels = document.getElementById('fileLabels')
    const rankLabels = document.getElementById('rankLabels')

    // Clear existing labels
    fileLabels.innerHTML = ''
    rankLabels.innerHTML = ''

    const files = this.isFlipped
      ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']
      : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    const ranks = this.isFlipped
      ? ['1', '2', '3', '4', '5', '6', '7', '8']
      : ['8', '7', '6', '5', '4', '3', '2', '1']

    files.forEach((file) => {
      const label = document.createElement('div')
      label.textContent = file
      fileLabels.appendChild(label)
    })
    ranks.forEach((rank) => {
      const label = document.createElement('div')
      label.textContent = rank
      rankLabels.appendChild(label)
    })
  }

  setupGameModeSelection() {
    const playButton = document.querySelector('button[type="submit"]')
    playButton.addEventListener('click', () => {
      const whitePlayer = document.querySelector(
        'input[name="whitePlayer"]:checked',
      )
      const blackPlayer = document.querySelector(
        'input[name="blackPlayer"]:checked',
      )

      const isWhiteHuman = whitePlayer.value === 'human'
      const isBlackHuman = blackPlayer.value === 'human'

      const isWhiteBot = whitePlayer.value === 'bot'
      const isBlackBot = blackPlayer.value === 'bot'

      if (isWhiteHuman && isBlackBot) {
        // Human vs Stockfish
        this.isBotGame = true
        this.isWhitePlaysAsHuman = true
        this.isBlackPlaysAsBot = true
        this.stockfishAIBlack = new PlayStockfish(this.chessGame, this, BLACK)
        this.stockfishAIBlack.stockfishLevel = Number(
          document.getElementById('stockfishStrength').value,
        )
      } else if (isWhiteBot && isBlackHuman) {
        // Stockfish vs Human
        this.isBotGame = true
        this.isWhitePlaysAsBot = true
        this.isBlackPlaysAsHuman = true
        this.stockfishAIWhite = new PlayStockfish(this.chessGame, this, WHITE)
        this.stockfishAIWhite.stockfishLevel = Number(
          document.getElementById('stockfishStrength').value,
        )
        this.stockfishMove()
      } else if (isWhiteBot && isBlackBot) {
        // Stockfish vs Stockfish
        this.isBotGame = true
        this.isWhitePlaysAsBot = true
        this.isBlackPlaysAsBot = true
        this.stockfishAIWhite = new PlayStockfish(this.chessGame, this, WHITE)
        this.stockfishAIBlack = new PlayStockfish(this.chessGame, this, BLACK)
        this.stockfishAIWhite.stockfishLevel = Number(
          document.getElementById('stockfishStrength').value,
        )
        this.stockfishMove()
      } else if (isWhiteHuman && isBlackHuman) {
        // Human vs Human
        this.isBotGame = false
        this.isWhitePlaysAsHuman = true
        this.isBlackPlaysAsHuman = true
      }

      // Close the modal
      const createNewGameModal = bootstrap.Modal.getInstance(
        document.getElementById('createNewGameModal'),
      )
      createNewGameModal.hide()
    })
  }

  // Method called after player's move to request Stockfish's move
  stockfishMove() {
    if (this.isBotGame) {
      if (
        this.isBlackPlaysAsBot &&
        this.chessGame.currentPlayerTurn === BLACK
      ) {
        this.stockfishAIBlack.onPlayerMove(this.gameOver)
      } else if (
        this.isWhitePlaysAsBot &&
        this.chessGame.currentPlayerTurn === WHITE
      ) {
        this.stockfishAIWhite.onPlayerMove(this.gameOver)
      }
    }
  }

  flipChessboard() {
    const flipButton = document.getElementById('flipBoard')
    flipButton.addEventListener('click', () => {
      this.isFlipped = !this.isFlipped
      this.showRankFileLabels()
      this.renderBoard()
    })
  }

  togglePawnsButton() {
    const toggleButton = document.getElementById('showPawnStructure')
    toggleButton.addEventListener('click', () => {
      this.hideOtherPieces = !this.hideOtherPieces
      this.renderBoard()
    })
  }

  renderBoard() {
    this.chessboardElement.innerHTML = '' // Clear previous board

    for (let row = 0; row < 8; row++) {
      for (let column = 0; column < 8; column++) {
        const renderedRow = this.isFlipped ? 7 - row : row
        const renderedColumn = this.isFlipped ? 7 - column : column
        this.createSquare(renderedRow, renderedColumn)
      }
    }

    // Highlight last move squares if available
    if (this.lastMove) {
      this.highlightMoveSquares()
    }
  }

  createSquare(row, column) {
    const squareElement = document.createElement('div')
    squareElement.classList.add(
      'square',
      (row + column) % 2 === 0 ? 'white' : 'black',
    )
    squareElement.dataset.row = row
    squareElement.dataset.col = column

    // Create a text node to display the row, column
    // const coordText = document.createElement('span')
    // coordText.classList.add('coords')
    // coordText.textContent = `(${row}, ${column})`
    // squareElement.appendChild(coordText)

    const chessPiece = this.chessGame.board[row][column]

    // Check if we should hide non-pawn pieces
    if (
      this.hideOtherPieces &&
      chessPiece &&
      chessPiece.toLowerCase() !== PIECE_TYPES.PAWN.toLowerCase()
    ) {
      const emptySquare = document.createElement('div')
      emptySquare.classList.add('empty')
      squareElement.appendChild(emptySquare)
    } else if (chessPiece) {
      this.createPieceElement(squareElement, chessPiece, row, column)
    }

    squareElement.addEventListener('click', () => this.movePiece(row, column))
    this.chessboardElement.appendChild(squareElement)
  }

  createPieceElement(squareElement, piece, row, column) {
    const pieceImageElement = document.createElement('img')
    pieceImageElement.src = `images/${this.chessPieceMap[piece]}.svg`
    pieceImageElement.alt = piece
    pieceImageElement.classList.add('piece')
    pieceImageElement.addEventListener('click', (event) => {
      event.stopPropagation()
      this.handlePieceClick(row, column)
    })
    squareElement.appendChild(pieceImageElement)
  }

  handlePieceClick(row, column) {
    const piece = this.chessGame.board[row][column]

    if (this.isSelectedPiece(row, column)) {
      this.deselectPiece()
      return
    }

    if (this.isValidPieceSelection(piece)) {
      this.selectPiece(row, column)
    }
  }

  isSelectedPiece(row, column) {
    return (
      this.selectedPiece &&
      this.selectedPiece[0] === row &&
      this.selectedPiece[1] === column
    )
  }

  isValidPieceSelection(piece) {
    if (!piece) return false // No piece in the square

    const pieceColor = piece === piece.toUpperCase() ? WHITE : BLACK // Determine the color of the piece
    return pieceColor === this.chessGame.currentPlayerTurn // Return true only if it's the correct player's turn
  }

  selectPiece(row, column) {
    if (this.selectedPiece) {
      this.deselectPiece() // Deselect if already selected
    }
    this.selectedPiece = [row, column]
    this.highlightSelectedPiece(row, column)
    this.highlightValidMoves(row, column)
  }

  deselectPiece() {
    if (this.selectedPiece) {
      const [row, column] = this.selectedPiece
      this.updateSquareHighlight(row, column, false)
    }
    this.selectedPiece = null
    this.clearHighlights()
  }

  highlightSelectedPiece(row, column) {
    this.updateSquareHighlight(row, column, true)
  }

  updateSquareHighlight(row, column, isHighlighted) {
    const selectedSquare = this.chessboardElement.querySelector(
      `.square[data-row='${row}'][data-col='${column}']`,
    )
    selectedSquare.classList.toggle('selected-square', isHighlighted)
  }

  highlightValidMoves(startX, startY) {
    const validMoves = this.chessGame.getValidMoves([startX, startY])

    validMoves.forEach(([endX, endY]) => {
      const square = this.chessboardElement.querySelector(
        `.square[data-row='${endX}'][data-col='${endY}']`,
      )
      this.createHighlightCircle(square)
    })
  }

  createHighlightCircle(square) {
    const highlightCircle = document.createElement('div')
    highlightCircle.classList.add('highlight-circle')
    square.appendChild(highlightCircle)
  }

  clearHighlights() {
    const highlightedCircles =
      this.chessboardElement.querySelectorAll('.highlight-circle')
    highlightedCircles.forEach((circle) => circle.remove())
  }

  showPawnPromotionDialog(row, column) {
    const [startX, startY] = this.selectedPiece

    // Show the pawn promotion modal
    const pawnPromotionModal = new bootstrap.Modal(
      document.getElementById('pawnPromotionModal'),
    )
    pawnPromotionModal.show()

    // Array of promotion options with their corresponding piece types
    const promotionOptions = [
      { id: 'promoteToQueen', piecetype: PIECE_TYPES.QUEEN },
      { id: 'promoteToRook', piecetype: PIECE_TYPES.ROOK },
      { id: 'promoteToBishop', piecetype: PIECE_TYPES.BISHOP },
      { id: 'promoteToKnight', piecetype: PIECE_TYPES.KNIGHT },
    ]

    // Loop through each promotion option and set event listeners
    promotionOptions.forEach((option) => {
      document.getElementById(option.id).onclick = () => {
        this.chessGame.handlePawnPromotion(
          row,
          column,
          this.chessGame.currentPlayerTurn === WHITE
            ? option.piecetype
            : option.piecetype.toLowerCase(), // Adjust for black promotion
        ) // Promote to the specified piece
        this.chessGame.removePiece(startX, startY)
        pawnPromotionModal.hide() // Close the modal
        this.renderBoard() // Refresh the board
        if (this.isBotGame) this.stockfishMove() // Request Stockfish move if it's a bot game
      }
    })

    // Add an event listener to deselect the piece when the modal is hidden
    pawnPromotionModal._element.addEventListener('hidden.bs.modal', () => {
      this.deselectPiece() // Deselect the piece on modal close
    })
  }

  movePiece(row, column) {
    if (!this.selectedPiece || this.gameOver) return // No piece selected or game is over

    const [startX, startY] = this.selectedPiece

    // Check for castling
    if (this.chessGame.isCastlingMove([startX, startY], [row, column])) {
      try {
        this.chessGame.castle([startX, startY], [row, column])
        this.renderBoard() // Refresh the board
        this.deselectPiece()
        if (this.isBotGame) this.stockfishMove() // Request Stockfish move if it's a bot game
        return
      } catch (error) {
        alert(error.message) // Notify user about the invalid castling
        console.log(error)
        this.deselectPiece() // Deselect the piece
        return
      }
    }

    const isValidMove = this.chessGame.isValidMove(
      [startX, startY],
      [row, column],
    )

    if (isValidMove) {
      try {
        // Check for draw by threefold repetition before executing the move
        if (this.chessGame.isDrawByRepetition === true) {
          setTimeout(() => {
            alert('Draw by 3-fold repetition!')
          }, 350) // 1000 milliseconds = 1 seconds
          this.gameOver = true
          return
        }

        // Check if move leads to a draw by the fifty-move rule
        if (this.chessGame.isDrawByFiftyMoveRule()) {
          setTimeout(() => {
            alert('Draw by the fifty-move rule!')
          }, 350)
          this.gameOver = true
          return
        }
        // Check for en-passant
        if (
          this.chessGame.enPassantTarget &&
          this.chessGame.enPassantTarget[0] === row &&
          this.chessGame.enPassantTarget[1] === column
        ) {
          const capturedRow = startX
          const capturedCol = column
          // Remove the pawn from the board at en-passant target
          this.chessGame.board[capturedRow][capturedCol] = null
        }

        // Check for pawn promotion
        if (
          (row === 0 || row === 7) &&
          (this.chessGame.getPiece(...this.selectedPiece) ===
            PIECE_TYPES.PAWN ||
            this.chessGame.getPiece(...this.selectedPiece) ===
              PIECE_TYPES.PAWN.toLowerCase())
        ) {
          this.showPawnPromotionDialog(row, column)
          return
        }

        this.executeMove(startX, startY, row, column)
        this.lastMove = [
          [startX, startY],
          [row, column],
        ]
        if (this.isBotGame) this.stockfishMove() // Request Stockfish move if it's a bot game

        // Check for checkmate after the move
        if (this.chessGame.isCheckmate()) {
          setTimeout(() => {
            alert(
              `${
                this.chessGame.currentPlayerTurn === 'w' ? 'Black' : 'White'
              } wins by checkmate!`,
            )
          }, 350)
          this.gameOver = true
          return
        }

        // Check for stalemate after the move
        if (this.chessGame.isStalemate()) {
          setTimeout(() => {
            alert('Draw by Stalemate!')
          }, 350)
          this.gameOver = true
          return
        }

        // Check for insufficient material after the move
        if (this.chessGame.isDrawByInsufficientMaterial()) {
          setTimeout(() => {
            alert('Draw by insufficient material!')
          }, 350)
          this.gameOver = true
          return
        }
      } catch (error) {
        alert(error.message) // Notify user about the invalid move
        console.log(error)
        this.deselectPiece()
      }
    } else {
      this.deselectPiece()
    }
  }

  // New method to highlight the moved squares
  highlightMoveSquares() {
    const [[startX, startY], [endX, endY]] = this.lastMove
    const startSquare = this.chessboardElement.querySelector(
      `.square[data-row='${startX}'][data-col='${startY}']`,
    )
    const endSquare = this.chessboardElement.querySelector(
      `.square[data-row='${endX}'][data-col='${endY}']`,
    )

    // Set highlight class on both squares
    startSquare.classList.add('move-highlight')
    endSquare.classList.add('move-highlight')

    // Store the highlighted squares
    this.highlightedSquares = [startSquare, endSquare]
  }

  animateMove(pieceSquare, targetSquare) {
    // Get the bounding rectangles for the start and target positions
    const targetRect = targetSquare.getBoundingClientRect()
    const startRect = pieceSquare.getBoundingClientRect()

    // Temporarily remove the piece from the DOM
    pieceSquare.parentElement.removeChild(pieceSquare)

    // Append the piece to the target square to set initial position
    targetSquare.appendChild(pieceSquare)

    // Set the initial position using transforms
    pieceSquare.style.position = 'absolute' // Position the piece to allow transforms

    // Position the piece at the starting square for animation
    pieceSquare.style.left = `${startRect.left - targetRect.left}px`
    pieceSquare.style.top = `${startRect.top - targetRect.top}px`
    pieceSquare.style.zIndex = 10 // Bring piece on top of everything

    // Apply the translation to move the piece to the target square
    requestAnimationFrame(() => {
      pieceSquare.style.transition = 'transform 0.3s ease-in-out'
      pieceSquare.style.transform = `translate(${
        targetRect.left - startRect.left
      }px, ${targetRect.top - startRect.top}px)`
    })

    // Reset the piece properties after the animation completes
    setTimeout(() => {
      // Reset the piece properties after the animation
      pieceSquare.style.position = '' // Restore position
      pieceSquare.style.zIndex = '' // Reset z-index
      pieceSquare.style.transition = '' // Reset transition
      pieceSquare.style.transform = '' // Reset transform
      this.deselectPiece()
      this.renderBoard()
    }, 300) // Wait for the animation duration before executing the move
  }

  executeMove(startX, startY, row, column) {
    const pieceSquare = this.chessboardElement.querySelector(
      `.square[data-row='${startX}'][data-col='${startY}'] .piece`,
    )

    // Calculate the target square's position
    const targetSquare = this.chessboardElement.querySelector(
      `.square[data-row='${row}'][data-col='${column}']`,
    )

    // Ensure that we already have the piece to move, and not create duplicates
    if (!pieceSquare) {
      console.error('No piece found at the starting square.')
      return
    }

    // Call the animateMove method to handle the animation
    this.animateMove(pieceSquare, targetSquare)

    // Move the piece in the chessGame model
    this.chessGame.makeMove([startX, startY], [row, column])
  }
}

// Initialize the Chess UI
const chessUI = new ChessUI(chess)
