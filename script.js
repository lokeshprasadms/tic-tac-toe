"use strict";

// Game configuration
const CONFIG = {
  playerX: 'x',
  playerO: 'o',
  empty: '',
  gridSize: 5,  // 5x5 grid
  winLength: 4,  // Need 4 in a row to win
  scores: {
    player: 0,
    computer: 0,
    tie: 0
  },
  difficulty: 1, // 0 = easy, 1 = hard
  currentPlayer: 'x',
  gameActive: false
};

// Generate winning combinations for 5x5 grid
function generateWinningCombinations() {
  const size = CONFIG.gridSize;
  const winLength = CONFIG.winLength;
  const combinations = [];
  
  // Rows
  for (let i = 0; i < size; i++) {
    for (let j = 0; j <= size - winLength; j++) {
      const row = [];
      for (let k = 0; k < winLength; k++) {
        row.push(i * size + j + k);
      }
      combinations.push(row);
    }
  }
  
  // Columns
  for (let i = 0; i < size; i++) {
    for (let j = 0; j <= size - winLength; j++) {
      const col = [];
      for (let k = 0; k < winLength; k++) {
        col.push((j + k) * size + i);
      }
      combinations.push(col);
    }
  }
  
  // Diagonals (top-left to bottom-right)
  for (let i = 0; i <= size - winLength; i++) {
    for (let j = 0; j <= size - winLength; j++) {
      const diag1 = [];
      const diag2 = [];
      for (let k = 0; k < winLength; k++) {
        diag1.push((i + k) * size + (j + k));
        diag2.push((i + k) * size + (j + winLength - 1 - k));
      }
      combinations.push(diag1);
      combinations.push(diag2);
    }
  }
  
  return combinations;
}

// Initialize winning combinations
CONFIG.winningCombinations = generateWinningCombinations();

// DOM Elements
const cells = document.querySelectorAll('.fixed');
const playerScoreEl = document.getElementById('player_score');
const computerScoreEl = document.getElementById('computer_score');
const tieScoreEl = document.getElementById('tie_score');
const restartBtn = document.getElementById('restart');
const winModal = document.getElementById('winAnnounce');
const winText = document.getElementById('winText');
const optionsModal = document.getElementById('optionsDlg');
const okBtn = document.getElementById('okBtn');

// Game state
let gameState = Array(25).fill('');
let isComputerTurn = false;

// ==================================
// HELPER FUNCTIONS
// ==================================
function showModal(modal) {
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function hideModal(modal) {
  modal.classList.remove('show');
  document.body.style.overflow = '';
}

function updateScores() {
  playerScoreEl.textContent = CONFIG.scores.player;
  computerScoreEl.textContent = CONFIG.scores.computer;
  tieScoreEl.textContent = CONFIG.scores.tie;
  
  // Save scores to localStorage
  localStorage.setItem('ticTacToeScores', JSON.stringify({
    player: CONFIG.scores.player,
    computer: CONFIG.scores.computer,
    tie: CONFIG.scores.tie
  }));
}

function animateCell(cell, callback) {
  cell.style.transform = 'scale(0.8)';
  setTimeout(() => {
    cell.style.transform = 'scale(1)';
    if (callback) callback();
  }, 150);
}

function highlightWinningCells(cellIndices) {
  cellIndices.forEach(index => {
    const cell = document.getElementById(`cell${index}`);
    cell.classList.add('win-color');
  });
}

function disableClicks() {
  cells.forEach(cell => {
    cell.style.pointerEvents = 'none';
  });
}

function enableClicks() {
  if (!isComputerTurn) {
    cells.forEach(cell => {
      cell.style.pointerEvents = 'auto';
    });
  }
}

// ==================================
// GAME LOGIC
// ==================================
function checkWinner() {
  // Check all possible winning combinations
  for (let i = 0; i < CONFIG.winningCombinations.length; i++) {
    const combo = CONFIG.winningCombinations[i];
    const firstCell = gameState[combo[0]];
    
    if (!firstCell) continue; // Skip if first cell is empty
    
    // Check if all cells in the combination are the same
    const isWinning = combo.every(index => gameState[index] === firstCell);
    
    if (isWinning) {
      return {
        winner: firstCell,
        winningCombo: combo
      };
    }
  }
  
  // Check for draw
  if (!gameState.includes('')) {
    return { winner: 'tie' };
  }
  
  return null;
}

function makeMove(index, player) {
  if (gameState[index] !== '') return false;
  
  gameState[index] = player;
  const cell = document.getElementById(`cell${index}`);
  cell.textContent = player.toUpperCase();
  cell.classList.add(player === 'x' ? 'x' : 'o');
  
  animateCell(cell);
  
  const result = checkWinner();
  if (result) {
    handleGameEnd(result);
    return true;
  }
  
  return true;
}

function computerMove() {
  if (!CONFIG.gameActive) return;
  
  let index;
  
  if (CONFIG.difficulty === 0) {
    // Easy mode: random move
    const emptyCells = [];
    gameState.forEach((cell, idx) => {
      if (cell === '') emptyCells.push(idx);
    });
    index = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  } else {
    // Hard mode: use minimax algorithm with depth limit for performance
    index = findBestMove();
  }
  
  // Make the move after a short delay for better UX
  setTimeout(() => {
    if (index !== undefined) {  // Ensure we have a valid move
      makeMove(index, CONFIG.playerO);
      CONFIG.currentPlayer = CONFIG.playerX;
      enableClicks();
    }
  }, 500);
}

function findBestMove() {
  let bestScore = -Infinity;
  let bestMove;
  
  // Get all empty cells
  const emptyCells = [];
  gameState.forEach((cell, index) => {
    if (cell === '') emptyCells.push(index);
  });
  
  // If only one move left, take it
  if (emptyCells.length === 1) return emptyCells[0];
  
  // Try to find a winning move or block opponent's winning move
  for (const index of emptyCells) {
    // Try to win
    gameState[index] = CONFIG.playerO;
    if (checkWinner()?.winner === CONFIG.playerO) {
      gameState[index] = '';
      return index;
    }
    gameState[index] = '';
    
    // Block opponent
    gameState[index] = CONFIG.playerX;
    if (checkWinner()?.winner === CONFIG.playerX) {
      gameState[index] = '';
      return index;
    }
    gameState[index] = '';
  }
  
  // Use minimax for other moves with limited depth for performance
  const maxDepth = 3; // Limit depth for performance
  for (const index of emptyCells) {
    gameState[index] = CONFIG.playerO;
    let score = minimax(gameState, 0, false, -Infinity, Infinity, maxDepth);
    gameState[index] = '';
    
    if (score > bestScore) {
      bestScore = score;
      bestMove = index;
    }
  }
  
  return bestMove;
}

function minimax(board, depth, isMaximizing, alpha, beta, maxDepth) {
  const result = checkWinner();
  
  // Terminal states
  if (result?.winner === CONFIG.playerO) return 100 - depth;
  if (result?.winner === CONFIG.playerX) return depth - 100;
  if (result?.winner === 'tie' || depth >= maxDepth) return 0;
  
  // Get all empty cells
  const emptyCells = [];
  board.forEach((cell, index) => {
    if (cell === '') emptyCells.push(index);
  });
  
  if (isMaximizing) {
    let bestScore = -Infinity;
    for (const index of emptyCells) {
      board[index] = CONFIG.playerO;
      const score = minimax(board, depth + 1, false, alpha, beta, maxDepth);
      board[index] = '';
      bestScore = Math.max(score, bestScore);
      alpha = Math.max(alpha, bestScore);
      if (beta <= alpha) break; // Alpha-beta pruning
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (const index of emptyCells) {
      board[index] = CONFIG.playerX;
      const score = minimax(board, depth + 1, true, alpha, beta, maxDepth);
      board[index] = '';
      bestScore = Math.min(score, bestScore);
      beta = Math.min(beta, bestScore);
      if (beta <= alpha) break; // Alpha-beta pruning
    }
    return bestScore;
  }
}

function handleGameEnd(result) {
  CONFIG.gameActive = false;
  
  if (result.winner === 'tie') {
    CONFIG.scores.tie++;
    winText.textContent = "It's a tie!";
  } else {
    if (result.winner === CONFIG.playerX) {
      CONFIG.scores.player++;
      winText.textContent = 'You win!';
    } else {
      CONFIG.scores.computer++;
      winText.textContent = 'Computer wins!';
    }
    highlightWinningCells(result.winningCombo);
  }
  
  updateScores();
  showModal(winModal);
  
  // Auto start new game after delay
  setTimeout(() => {
    hideModal(winModal);
    startNewGame();
  }, 2000);
}
// GAME FLOW
// ==================================
function handleCellClick(index) {
  // Only proceed if game is active, cell is empty, and it's player's turn
  if (!CONFIG.gameActive || gameState[index] !== '' || CONFIG.currentPlayer !== CONFIG.playerX) {
    return;
  }
  
  // Make the player's move
  if (makeMove(index, CONFIG.playerX)) {
    // Switch to computer's turn if game is still active
    if (CONFIG.gameActive) {
      CONFIG.currentPlayer = CONFIG.playerO;
      disableClicks();
      setTimeout(computerMove, 500);
    }
  }
}

function startNewGame() {
  // Reset game state
  gameState = Array(25).fill('');
  CONFIG.currentPlayer = CONFIG.playerX;
  CONFIG.gameActive = true;
  
  // Clear the board
  cells.forEach(cell => {
    cell.textContent = '';
    cell.classList.remove('win');
    cell.style.pointerEvents = 'auto';
    cell.style.backgroundColor = ''; // Reset any background color
  });
  
  // Hide win modal if open
  hideModal(winModal);
  
  // If computer starts first (not used in current config, but kept for completeness)
  if (CONFIG.currentPlayer === CONFIG.playerO) {
    disableClicks();
    setTimeout(computerMove, 500);
  }
}

function initialize() {
  // Load saved scores
  const savedScores = JSON.parse(localStorage.getItem('ticTacToeScores')) || CONFIG.scores;
  CONFIG.scores = { ...CONFIG.scores, ...savedScores };
  updateScoreboard();
  
  // Set up event listeners for all cells
  cells.forEach((cell, index) => {
    cell.addEventListener('click', () => handleCellClick(index));
    // Add touch support for mobile devices
    cell.addEventListener('touchend', (e) => {
      e.preventDefault();
      handleCellClick(index);
    }, { passive: false });
  });
  
  // Set up button event listeners
  restartBtn.addEventListener('click', startNewGame);
}

// Initialize the game when the page loads
window.onload = initialize;
