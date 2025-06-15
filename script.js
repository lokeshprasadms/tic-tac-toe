// Wait for the DOM to be fully loaded before running the game
document.addEventListener('DOMContentLoaded', function() {
    // Global Settings
    const boardSize = 5;
    const winLength = 4; // need 4 in a row to win
    let board = [];
    let gameOver = false;
    let playerSymbol;
    let aiSymbol;
    let difficulty;
    const maxMinimaxDepth = 3; // Depth limit for minimax (hard mode)

    // Score Tracking
    let playerScore = 0;
    let aiScore = 0;

    // DOM Elements
    const settingsSection = document.getElementById("settings");
    const gameSection = document.getElementById("game");
    const boardDiv = document.getElementById("board");
    const statusHeader = document.getElementById("status");
    const restartBtn = document.getElementById("restart");
    const difficultySelect = document.getElementById("difficulty");
    const startGameBtn = document.getElementById("startGame");
    const symbolBtns = document.querySelectorAll(".symbol-btn");
    const playerSymbolSpan = document.getElementById("player-symbol");
    const playerScoreSpan = document.getElementById("player-score");
    const aiScoreSpan = document.getElementById("ai-score");

    // Variable to hold symbol selection before game starts
    let selectedSymbol = null;

// Initialize board array
function initBoard() {
  board = [];
  for (let i = 0; i < boardSize; i++) {
    board.push(new Array(boardSize).fill(''));
  }
}

// Render board UI
function renderBoard() {
  boardDiv.innerHTML = "";
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.row = i;
      cell.dataset.col = j;
      cell.textContent = board[i][j];
      cell.addEventListener("click", handleCellClick);
      boardDiv.appendChild(cell);
    }
  }
}

// Handle player's move
function handleCellClick(e) {
  if (gameOver) return;
  const row = parseInt(e.target.dataset.row);
  const col = parseInt(e.target.dataset.col);
  if (board[row][col] !== '') return;
  
  board[row][col] = playerSymbol;
  renderBoard();
  
  if (checkWin(board, playerSymbol)) {
    finishGame("Player");
    return;
  }
  if (isBoardFull(board)) {
    finishGame("Tie");
    return;
  }
  
  statusHeader.textContent = `Computer's turn...`;
  setTimeout(() => {
    aiMove();
    renderBoard();
    if (checkWin(board, aiSymbol)) {
      finishGame("AI");
      return;
    }
    if (isBoardFull(board)) {
      finishGame("Tie");
      return;
    }
    statusHeader.textContent = `Your turn (${playerSymbol})`;
  }, 200);
}

// Check if board is full
function isBoardFull(b) {
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (b[i][j] === '') return false;
    }
  }
  return true;
}

// Check winning condition for a symbol
function checkWin(b, sym) {
  // Check rows
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j <= boardSize - winLength; j++) {
      let win = true;
      for (let k = 0; k < winLength; k++) {
        if (b[i][j + k] !== sym) {
          win = false;
          break;
        }
      }
      if (win) return true;
    }
  }
  // Check columns
  for (let j = 0; j < boardSize; j++) {
    for (let i = 0; i <= boardSize - winLength; i++) {
      let win = true;
      for (let k = 0; k < winLength; k++) {
        if (b[i + k][j] !== sym) {
          win = false;
          break;
        }
      }
      if (win) return true;
    }
  }
  // Check diagonal (top-left to bottom-right)
  for (let i = 0; i <= boardSize - winLength; i++) {
    for (let j = 0; j <= boardSize - winLength; j++) {
      let win = true;
      for (let k = 0; k < winLength; k++) {
        if (b[i + k][j + k] !== sym) {
          win = false;
          break;
        }
      }
      if (win) return true;
    }
  }
  // Check diagonal (top-right to bottom-left)
  for (let i = 0; i <= boardSize - winLength; i++) {
    for (let j = winLength - 1; j < boardSize; j++) {
      let win = true;
      for (let k = 0; k < winLength; k++) {
        if (b[i + k][j - k] !== sym) {
          win = false;
          break;
        }
      }
      if (win) return true;
    }
  }
  return false;
}

// AI Move: chooses strategy based on difficulty selection
function aiMove() {
  if (difficulty === "easy") {
    aiRandomMove();
  } else if (difficulty === "medium") {
    aiMediumMove();
  } else if (difficulty === "hard") {
    const bestMove = minimaxDecision();
    if (bestMove) {
      board[bestMove.row][bestMove.col] = aiSymbol;
    } else {
      aiRandomMove();
    }
  }
}

// AI Easy: Random move
function aiRandomMove() {
  const empties = [];
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === '') empties.push({ row: i, col: j });
    }
  }
  if (empties.length > 0) {
    const choice = empties[Math.floor(Math.random() * empties.length)];
    board[choice.row][choice.col] = aiSymbol;
  }
}

// AI Medium: Attempt win, then block player, then random
function aiMediumMove() {
  // Check for immediate win
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === '') {
        board[i][j] = aiSymbol;
        if (checkWin(board, aiSymbol)) {
          return;
        }
        board[i][j] = '';
      }
    }
  }
  // Block player's immediate win
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === '') {
        board[i][j] = playerSymbol;
        if (checkWin(board, playerSymbol)) {
          board[i][j] = aiSymbol;
          return;
        }
        board[i][j] = '';
      }
    }
  }
  // Fall back to a random move
  aiRandomMove();
}

// AI Hard: Minimax with Alpha-Beta pruning
function minimaxDecision() {
  let bestVal = -Infinity;
  let bestMove = null;
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === '') {
        board[i][j] = aiSymbol;
        const moveVal = minimax(board, 0, false, -Infinity, Infinity);
        board[i][j] = '';
        if (moveVal > bestVal) {
          bestVal = moveVal;
          bestMove = { row: i, col: j };
        }
      }
    }
  }
  return bestMove;
}

function minimax(b, depth, isMaximizing, alpha, beta) {
  if (checkWin(b, aiSymbol)) return 10 - depth;
  if (checkWin(b, playerSymbol)) return depth - 10;
  if (isBoardFull(b) || depth === maxMinimaxDepth) return 0;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        if (b[i][j] === '') {
          b[i][j] = aiSymbol;
          const evalValue = minimax(b, depth + 1, false, alpha, beta);
          b[i][j] = '';
          maxEval = Math.max(maxEval, evalValue);
          alpha = Math.max(alpha, evalValue);
          if (beta <= alpha) break;
        }
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        if (b[i][j] === '') {
          b[i][j] = playerSymbol;
          const evalValue = minimax(b, depth + 1, true, alpha, beta);
          b[i][j] = '';
          minEval = Math.min(minEval, evalValue);
          beta = Math.min(beta, evalValue);
          if (beta <= alpha) break;
        }
      }
    }
    return minEval;
  }
}

// Called when game ends; outcome can be "Player", "AI", or "Tie"
function finishGame(winner) {
  gameOver = true;
  if (winner === "Player") {
    statusHeader.textContent = "You win!";
    playerScore++;
  } else if (winner === "AI") {
    statusHeader.textContent = "Computer wins!";
    aiScore++;
  } else {
    statusHeader.textContent = "It's a tie!";
  }
  updateScoreboard();
  restartBtn.classList.remove("hidden");
}

// Update scoreboard display
function updateScoreboard() {
  playerScoreSpan.textContent = `Player: ${playerScore}`;
  aiScoreSpan.textContent = `AI: ${aiScore}`;
}

// Start game using selected options
function startGame() {
  difficulty = difficultySelect.value;
  initBoard();
  gameOver = false;
  // Display chosen symbol in header
  playerSymbolSpan.textContent = playerSymbol;
  statusHeader.textContent = `Your turn (${playerSymbol})`;
  
  // Hide settings, show game section & hide restart button
  settingsSection.classList.add("hidden");
  gameSection.classList.remove("hidden");
  restartBtn.classList.add("hidden");
  
  renderBoard();
  
  // If player is O, computer starts
  if (playerSymbol !== "X") {
    statusHeader.textContent = "Computer's turn...";
    setTimeout(() => {
      aiMove();
      renderBoard();
      statusHeader.textContent = `Your turn (${playerSymbol})`;
    }, 200);
  }
}

    // Symbol selection: update active state visually and track the selection
    symbolBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            selectedSymbol = e.target.dataset.symbol;
            symbolBtns.forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
        });
    });

    // Start Game button listener; ensures a symbol was chosen
    startGameBtn.addEventListener("click", () => {
        if (!selectedSymbol) {
            alert("Please select your symbol (X or O) before starting.");
            return;
        }
        playerSymbol = selectedSymbol;
        aiSymbol = playerSymbol === "X" ? "O" : "X";
        startGame();
    });

    // Restart Game button listener: show options again but keep scoreboard
    restartBtn.addEventListener("click", () => {
        // Reset board state but keep scores
        initBoard();
        settingsSection.classList.remove("hidden");
        gameSection.classList.add("hidden");
        selectedSymbol = null;
        symbolBtns.forEach(b => b.classList.remove("active"));
    });
}); // End of DOMContentLoaded
