// Global Game Settings
const boardSize = 5;
const winLength = 4; // win condition: 4 in a row
let board = [];
let gameOver = false;
let playerSymbol;
let aiSymbol;
let difficulty;
const maxMinimaxDepth = 3; // depth limit for hard mode

// DOM Elements
const settingsSection = document.getElementById("settings");
const gameSection = document.getElementById("game");
const boardDiv = document.getElementById("board");
const statusHeader = document.getElementById("status");
const restartBtn = document.getElementById("restart");
const difficultySelect = document.getElementById("difficulty");
const chooseXBtn = document.getElementById("choose-x");
const chooseOBtn = document.getElementById("choose-o");
const playerSymbolSpan = document.getElementById("player-symbol");

// Initialize board array for every new game
function initBoard() {
  board = [];
  for (let i = 0; i < boardSize; i++) {
    board.push(new Array(boardSize).fill(''));
  }
}

// Render board UI grid cells based on board array
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

// Handle human player's move
function handleCellClick(e) {
  if (gameOver) return;
  const row = parseInt(e.target.dataset.row);
  const col = parseInt(e.target.dataset.col);
  
  if (board[row][col] !== '') return; // Ignore occupied cell
  board[row][col] = playerSymbol;
  renderBoard();
  
  if (checkWin(board, playerSymbol)) {
    finishGame(`You win!`);
    return;
  }
  if (isBoardFull(board)) {
    finishGame("It's a tie!");
    return;
  }

  statusHeader.textContent = `Computer's turn...`;
  // Delay AI move for smoother UI transition
  setTimeout(() => {
    aiMove();
    renderBoard();
    if (checkWin(board, aiSymbol)) {
      finishGame(`Computer wins!`);
      return;
    }
    if (isBoardFull(board)) {
      finishGame("It's a tie!");
      return;
    }
    statusHeader.textContent = `Your turn (${playerSymbol})`;
  }, 200);
}

// Finish game and display outcome message, show restart button
function finishGame(message) {
  gameOver = true;
  statusHeader.textContent = message;
  restartBtn.classList.remove("hidden");
}

// Check if board is completely filled
function isBoardFull(b) {
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (b[i][j] === '') return false;
    }
  }
  return true;
}

// Check board for a win condition for specific symbol
function checkWin(b, sym) {
  // Check rows for winLength in a row
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
  // Check columns for winLength in a row
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
  // Check diagonals (top-left to bottom-right)
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
  // Check diagonals (top-right to bottom-left)
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

// AI makes a move based on selected difficulty
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

// Easy mode: randomly choose an empty cell
function aiRandomMove() {
  const empties = [];
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === '') empties.push({ row: i, col: j });
    }
  }
  if (empties.length) {
    const choice = empties[Math.floor(Math.random() * empties.length)];
    board[choice.row][choice.col] = aiSymbol;
  }
}

// Medium mode: first try to win; then block player's win; else random move
function aiMediumMove() {
  // Attempt immediate win
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
  // Else perform a random move
  aiRandomMove();
}

// Hard mode using minimax decision with depth limit and alpha-beta pruning
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

// Start a new game using selected options
function startGame() {
  difficulty = difficultySelect.value;
  initBoard();
  gameOver = false;
  // Display player's symbol in header
  playerSymbolSpan.textContent = playerSymbol;
  
  // Hide settings and show game board
  settingsSection.classList.add("hidden");
  gameSection.classList.remove("hidden");
  restartBtn.classList.add("hidden");
  statusHeader.textContent = `Your turn (${playerSymbol})`;
  renderBoard();
  
  // If player chose "O", computer (playing as X) goes first
  if (playerSymbol !== "X") {
    statusHeader.textContent = "Computer's turn...";
    setTimeout(() => {
      aiMove();
      renderBoard();
      statusHeader.textContent = `Your turn (${playerSymbol})`;
    }, 200);
  }
}

// Event Listeners for symbol selection
chooseXBtn.addEventListener("click", () => {
  playerSymbol = "X";
  aiSymbol = "O";
  startGame();
});
chooseOBtn.addEventListener("click", () => {
  playerSymbol = "O";
  aiSymbol = "X";
  startGame();
});

// Restart functionality: resets view back to options
restartBtn.addEventListener("click", () => {
  settingsSection.classList.remove("hidden");
  gameSection.classList.add("hidden");
});

