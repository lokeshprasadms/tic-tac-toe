// Game Configuration
const CONFIG = {
    PLAYER: 'X',
    AI: 'O',
    EMPTY: '',
    GRID_SIZE: 5,
    WIN_LENGTH: 4,
    DIFFICULTY: 'medium',
    GAME_ACTIVE: false
};

// DOM Elements
const gameBoard = document.getElementById('gameBoard');
const playerScoreEl = document.getElementById('playerScore');
const aiScoreEl = document.getElementById('aiScore');
const gameStatusEl = document.getElementById('gameStatus');
const newGameBtn = document.getElementById('newGameBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const gameOverModal = document.getElementById('gameOverModal');
const resultText = document.getElementById('resultText');
const resultMessage = document.getElementById('resultMessage');
const difficultyBtns = document.querySelectorAll('.difficulty-btn');

// Game State
let gameState = Array(CONFIG.GRID_SIZE * CONFIG.GRID_SIZE).fill(CONFIG.EMPTY);
let currentPlayer = CONFIG.PLAYER;
let scores = {
    player: 0,
    ai: 0,
    ties: 0
};

// Initialize the game
function initGame() {
    renderBoard();
    setupEventListeners();
    loadScores();
    updateStatus("Your turn (X)");
    CONFIG.GAME_ACTIVE = true;
}

// Set up event listeners
function setupEventListeners() {
    // New Game button
    newGameBtn.addEventListener('click', startNewGame);
    playAgainBtn.addEventListener('click', startNewGame);
    closeModalBtn.addEventListener('click', () => hideModal(gameOverModal));
    
    // Difficulty buttons
    difficultyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            difficultyBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            CONFIG.DIFFICULTY = btn.dataset.difficulty;
            if (CONFIG.GAME_ACTIVE) startNewGame();
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === gameOverModal) {
            hideModal(gameOverModal);
        }
    });
}

// Handle cell click
function handleCellClick(e) {
    if (!CONFIG.GAME_ACTIVE) return;
    
    const cell = e.target.closest('.cell');
    if (!cell) return;
    
    const index = parseInt(cell.dataset.index);
    
    // If cell is not empty, do nothing
    if (gameState[index] !== CONFIG.EMPTY) return;
    
    // Make player's move
    makeMove(index, CONFIG.PLAYER);
    
    // Check for win or draw
    if (checkWin(gameState, CONFIG.PLAYER)) {
        endGame('player');
        return;
    }
    
    if (isBoardFull()) {
        endGame('draw');
        return;
    }
    
    // AI's turn
    setTimeout(() => {
        const aiMove = getAIMove();
        makeMove(aiMove, CONFIG.AI);
        
        if (checkWin(gameState, CONFIG.AI)) {
            endGame('ai');
            return;
        }
        
        if (isBoardFull()) {
            endGame('draw');
        }
    }, 300); // Small delay for better UX
}

// Make a move on the board
function makeMove(index, player) {
    gameState[index] = player;
    const cell = document.querySelector(`.cell[data-index="${index}"]`);
    cell.textContent = player;
    cell.classList.add(player.toLowerCase());
    
    // Update status
    updateStatus(player === CONFIG.PLAYER ? "AI's turn (O)" : "Your turn (X)");
}

// Get AI's move based on difficulty
function getAIMove() {
    const emptyCells = [];
    gameState.forEach((cell, index) => {
        if (cell === CONFIG.EMPTY) emptyCells.push(index);
    });
    
    // If no empty cells, return -1 (shouldn't happen)
    if (emptyCells.length === 0) return -1;
    
    // Get move based on difficulty
    switch (CONFIG.DIFFICULTY) {
        case 'easy':
            return getRandomMove(emptyCells);
        case 'hard':
            return getBestMove();
        case 'medium':
        default:
            // 70% chance of best move, 30% random move
            return Math.random() < 0.7 ? getBestMove() : getRandomMove(emptyCells);
    }
}

// Get a random available move
function getRandomMove(emptyCells) {
    const index = Math.floor(Math.random() * emptyCells.length);
    return emptyCells[index];
}

// Get the best move using a simplified strategy (faster than minimax for 5x5)
function getBestMove() {
    const emptyCells = [];
    for (let i = 0; i < gameState.length; i++) {
        if (gameState[i] === CONFIG.EMPTY) {
            emptyCells.push(i);
        }
    }
    
    // 1. Check for immediate win
    for (const move of emptyCells) {
        gameState[move] = CONFIG.AI;
        if (checkWin(gameState, CONFIG.AI)) {
            gameState[move] = CONFIG.EMPTY;
            return move;
        }
        gameState[move] = CONFIG.EMPTY;
    }
    
    // 2. Block player's immediate win
    for (const move of emptyCells) {
        gameState[move] = CONFIG.PLAYER;
        if (checkWin(gameState, CONFIG.PLAYER)) {
            gameState[move] = CONFIG.EMPTY;
            return move;
        }
        gameState[move] = CONFIG.EMPTY;
    }
    
    // 3. Take center if available
    const center = Math.floor((CONFIG.GRID_SIZE * CONFIG.GRID_SIZE) / 2);
    if (gameState[center] === CONFIG.EMPTY) {
        return center;
    }
    
    // 4. Take a corner if available
    const corners = [0, CONFIG.GRID_SIZE - 1, 
                    (CONFIG.GRID_SIZE * (CONFIG.GRID_SIZE - 1)), 
                    (CONFIG.GRID_SIZE * CONFIG.GRID_SIZE) - 1];
    const availableCorners = corners.filter(i => gameState[i] === CONFIG.EMPTY);
    if (availableCorners.length > 0) {
        return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }
    
    // 5. Take a side if available
    const sides = [];
    for (let i = 0; i < CONFIG.GRID_SIZE; i++) {
        // Top and bottom sides
        if (i > 0 && i < CONFIG.GRID_SIZE - 1) {
            if (gameState[i] === CONFIG.EMPTY) sides.push(i); // Top
            if (gameState[i + (CONFIG.GRID_SIZE * (CONFIG.GRID_SIZE - 1))] === CONFIG.EMPTY) 
                sides.push(i + (CONFIG.GRID_SIZE * (CONFIG.GRID_SIZE - 1))); // Bottom
        }
        // Left and right sides (skip corners as they're already checked)
        if (i > 0 && i < CONFIG.GRID_SIZE - 1) {
            if (gameState[i * CONFIG.GRID_SIZE] === CONFIG.EMPTY) 
                sides.push(i * CONFIG.GRID_SIZE); // Left
            if (gameState[(i * CONFIG.GRID_SIZE) + (CONFIG.GRID_SIZE - 1)] === CONFIG.EMPTY) 
                sides.push((i * CONFIG.GRID_SIZE) + (CONFIG.GRID_SIZE - 1)); // Right
        }
    }
    
    if (sides.length > 0) {
        return sides[Math.floor(Math.random() * sides.length)];
    }
    
    // 6. If all else fails, return a random move
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

// Check if there's a winner
function checkWin(board, player) {
    // Check rows
    for (let row = 0; row < CONFIG.GRID_SIZE; row++) {
        for (let col = 0; col <= CONFIG.GRID_SIZE - CONFIG.WIN_LENGTH; col++) {
            let win = true;
            for (let i = 0; i < CONFIG.WIN_LENGTH; i++) {
                if (board[row * CONFIG.GRID_SIZE + col + i] !== player) {
                    win = false;
                    break;
                }
            }
            if (win) return true;
        }
    }
    
    // Check columns
    for (let col = 0; col < CONFIG.GRID_SIZE; col++) {
        for (let row = 0; row <= CONFIG.GRID_SIZE - CONFIG.WIN_LENGTH; row++) {
            let win = true;
            for (let i = 0; i < CONFIG.WIN_LENGTH; i++) {
                if (board[(row + i) * CONFIG.GRID_SIZE + col] !== player) {
                    win = false;
                    break;
                }
            }
            if (win) return true;
        }
    }
    
    // Check diagonals (top-left to bottom-right)
    for (let row = 0; row <= CONFIG.GRID_SIZE - CONFIG.WIN_LENGTH; row++) {
        for (let col = 0; col <= CONFIG.GRID_SIZE - CONFIG.WIN_LENGTH; col++) {
            let win = true;
            for (let i = 0; i < CONFIG.WIN_LENGTH; i++) {
                if (board[(row + i) * CONFIG.GRID_SIZE + col + i] !== player) {
                    win = false;
                    break;
                }
            }
            if (win) return true;
        }
    }
    
    // Check diagonals (top-right to bottom-left)
    for (let row = 0; row <= CONFIG.GRID_SIZE - CONFIG.WIN_LENGTH; row++) {
        for (let col = CONFIG.WIN_LENGTH - 1; col < CONFIG.GRID_SIZE; col++) {
            let win = true;
            for (let i = 0; i < CONFIG.WIN_LENGTH; i++) {
                if (board[(row + i) * CONFIG.GRID_SIZE + col - i] !== player) {
                    win = false;
                    break;
                }
            }
            if (win) return true;
        }
    }
    
    return false;
}

// Check if the board is full
function isBoardFull() {
    return !gameState.includes(CONFIG.EMPTY);
}

// Start a new game
function startNewGame() {
    gameState = Array(CONFIG.GRID_SIZE * CONFIG.GRID_SIZE).fill(CONFIG.EMPTY);
    currentPlayer = CONFIG.PLAYER;
    CONFIG.GAME_ACTIVE = true;
    
    // Clear the board
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.textContent = '';
        cell.className = 'cell';
    });
    
    updateStatus("Your turn (X)");
    hideModal(gameOverModal);
}

// Render the game board
function renderBoard() {
    gameBoard.innerHTML = '';
    
    for (let i = 0; i < CONFIG.GRID_SIZE * CONFIG.GRID_SIZE; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        cell.addEventListener('click', handleCellClick);
        gameBoard.appendChild(cell);
    }
}

// Update game status text
function updateStatus(message) {
    gameStatusEl.textContent = message;
}

// End the game
function endGame(winner) {
    CONFIG.GAME_ACTIVE = false;
    
    switch (winner) {
        case 'player':
            scores.player++;
            showGameOver('You Win!', 'Congratulations! You defeated the AI!');
            break;
        case 'ai':
            scores.ai++;
            showGameOver('AI Wins!', 'Better luck next time!');
            break;
        case 'draw':
            scores.ties++;
            showGameOver('Game Drawn!', 'The game ended in a draw!');
            break;
    }
    
    updateScores();
    saveScores();
}

// Show game over modal
function showGameOver(title, message) {
    resultText.textContent = title;
    resultMessage.textContent = message;
    showModal(gameOverModal);
}

// Show modal
function showModal(modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Hide modal
function hideModal(modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

// Save scores to localStorage
function saveScores() {
    localStorage.setItem('ticTacToeScores', JSON.stringify(scores));
}

// Load scores from localStorage
function loadScores() {
    const savedScores = localStorage.getItem('ticTacToeScores');
    if (savedScores) {
        scores = JSON.parse(savedScores);
        updateScores();
    }
}

// Update score display
function updateScores() {
    playerScoreEl.textContent = scores.player;
    aiScoreEl.textContent = scores.ai;
}

// Initialize the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initGame);
