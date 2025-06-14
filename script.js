"use strict";

// Game configuration
const CONFIG = {
  playerX: 'x',
  playerO: 'o',
  empty: '',
  winningCombinations: [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ],
  scores: {
    player: 0,
    computer: 0,
    tie: 0
  },
  difficulty: 1, // 0 = easy, 1 = hard
  currentPlayer: 'x',
  gameActive: false
};

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
let gameState = Array(9).fill('');
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
  for (const combo of CONFIG.winningCombinations) {
    const [a, b, c] = combo;
    if (gameState[a] && 
        gameState[a] === gameState[b] && 
        gameState[a] === gameState[c]) {
      return {
        winner: gameState[a],
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
  if (!CONFIG.gameActive || !isComputerTurn) return;
  
  let index;
  
  if (CONFIG.difficulty === 1) {
    // Hard mode - use minimax algorithm
    index = findBestMove();
  } else {
    // Easy mode - random move
    const emptyCells = [];
    gameState.forEach((cell, i) => {
      if (cell === '') emptyCells.push(i);
    });
    index = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }
  
  // Make the move after a short delay to simulate thinking
  setTimeout(() => {
    if (makeMove(index, CONFIG.currentPlayer)) {
      isComputerTurn = false;
      CONFIG.currentPlayer = CONFIG.playerX;
      enableClicks();
    }
  }, 500);
}

function findBestMove() {
  let bestScore = -Infinity;
  let bestMove = -1;
  
  for (let i = 0; i < 9; i++) {
    if (gameState[i] === '') {
      gameState[i] = CONFIG.currentPlayer;
      const score = minimax(gameState, 0, false);
      gameState[i] = '';
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }
  
  return bestMove;
}

function minimax(board, depth, isMaximizing) {
  const result = checkWinner();
  
  if (result) {
    if (result.winner === CONFIG.playerO) return 10 - depth;
    if (result.winner === CONFIG.playerX) return depth - 10;
    return 0; // Draw
  }
  
  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        board[i] = CONFIG.playerO;
        const score = minimax(board, depth + 1, false);
        board[i] = '';
        bestScore = Math.max(score, bestScore);
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        board[i] = CONFIG.playerX;
        const score = minimax(board, depth + 1, true);
        board[i] = '';
        bestScore = Math.min(score, bestScore);
      }
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

// ==================================
// GAME FLOW
// ==================================
function handleCellClick(index) {
  if (!CONFIG.gameActive || isComputerTurn || gameState[index] !== '') return;
  
  if (makeMove(index, CONFIG.currentPlayer)) {
    if (CONFIG.gameActive) {
      isComputerTurn = true;
      disableClicks();
      CONFIG.currentPlayer = CONFIG.playerO;
      setTimeout(computerMove, 500);
    }
  }
}

function startNewGame() {
  // Reset game state
  gameState = Array(9).fill('');
  CONFIG.gameActive = true;
  
  // Clear the board
  cells.forEach((cell, index) => {
    cell.textContent = '';
    cell.className = 'fixed';
    cell.style.pointerEvents = 'auto';
    cell.style.transform = '';
  });
  
  // Set starting player
  const startWithX = document.getElementById('rx').checked;
  CONFIG.currentPlayer = startWithX ? CONFIG.playerX : CONFIG.playerO;
  
  // Set difficulty
  CONFIG.difficulty = document.getElementById('r1').checked ? 1 : 0;
  
  // If computer goes first
  if (CONFIG.currentPlayer === CONFIG.playerO) {
    isComputerTurn = true;
    disableClicks();
    setTimeout(computerMove, 800);
  } else {
    isComputerTurn = false;
    enableClicks();
  }
}

function showOptions() {
  // Set default options
  document.getElementById('r1').checked = CONFIG.difficulty === 1;
  document.getElementById('r0').checked = CONFIG.difficulty === 0;
  document.getElementById('rx').checked = true; // Default to X first
  document.getElementById('ro').checked = false;
  
  showModal(optionsModal);
}

function initialize() {
  // Load saved scores
  const savedScores = localStorage.getItem('ticTacToeScores');
  if (savedScores) {
    const scores = JSON.parse(savedScores);
    CONFIG.scores.player = scores.player || 0;
    CONFIG.scores.computer = scores.computer || 0;
    CONFIG.scores.tie = scores.tie || 0;
    updateScores();
  }
  
  // Set up event listeners
  cells.forEach((cell, index) => {
    cell.addEventListener('click', () => handleCellClick(index));
  });
  
  restartBtn.addEventListener('click', () => showOptions());
  okBtn.addEventListener('click', () => {
    hideModal(optionsModal);
    startNewGame();
  });
  
  // Close modals when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      hideModal(e.target);
    }
  });
  
  // Start the game
  showOptions();
}

// Initialize the game when the page loads
window.onload = initialize;
