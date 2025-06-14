// Game Configuration
const CONFIG = {
    PLAYER: 'X',
    AI: 'O',
    EMPTY: '',
    GRID_SIZE: 5,     // 5x5 grid
    WIN_LENGTH: 4,    // Need 4 in a row to win
    DIFFICULTY: 'medium', // easy, medium, hard
    GAME_ACTIVE: false
};

// DOM Elements
const gameBoard = document.getElementById('gameBoard');
const playerScoreEl = document.getElementById('player_score');
const aiScoreEl = document.getElementById('ai_score');
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

// Generate all possible winning combinations for the grid
function generateWinningCombinations() {
    const combinations = [];
    const { GRID_SIZE, WIN_LENGTH } = CONFIG;
    
    // Generate row combinations
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col <= GRID_SIZE - WIN_LENGTH; col++) {
            const combo = [];
            for (let i = 0; i < WIN_LENGTH; i++) {
                combo.push(row * GRID_SIZE + col + i);
            }
            combinations.push(combo);
        }
    }
    
    // Generate column combinations
    for (let col = 0; col < GRID_SIZE; col++) {
        for (let row = 0; row <= GRID_SIZE - WIN_LENGTH; row++) {
            const combo = [];
            for (let i = 0; i < WIN_LENGTH; i++) {
                combo.push((row + i) * GRID_SIZE + col);
            }
            combinations.push(combo);
        }
    }
    
    // Generate diagonal (top-left to bottom-right) combinations
    for (let row = 0; row <= GRID_SIZE - WIN_LENGTH; row++) {
        for (let col = 0; col <= GRID_SIZE - WIN_LENGTH; col++) {
            const combo = [];
            for (let i = 0; i < WIN_LENGTH; i++) {
                combo.push((row + i) * GRID_SIZE + (col + i));
            }
            combinations.push(combo);
        }
    }
    
    // Generate diagonal (top-right to bottom-left) combinations
    for (let row = 0; row <= GRID_SIZE - WIN_LENGTH; row++) {
        for (let col = WIN_LENGTH - 1; col < GRID_SIZE; col++) {
            const combo = [];
            for (let i = 0; i < WIN_LENGTH; i++) {
                combo.push((row + i) * GRID_SIZE + (col - i));
            }
            combinations.push(combo);
        }
    }
    
    return combinations;
}

// Pre-calculate all winning combinations
const WINNING_COMBINATIONS = generateWinningCombinations();

// Initialize the game
function initGame() {
    // Load saved scores
    loadScores();
    
    // Set up event listeners
    setupEventListeners();
    
    // Start a new game
    startNewGame();
}

// Set up event listeners
function setupEventListeners() {
    // Cell click event
    gameBoard.addEventListener('click', handleCellClick);
    
    // New game button
    newGameBtn.addEventListener('click', startNewGame);
    
    // Play again button
    playAgainBtn.addEventListener('click', () => {
        hideModal(gameOverModal);
        startNewGame();
    });
    
    // Close modal button
    closeModalBtn.addEventListener('click', () => {
        hideModal(gameOverModal);
    });
    
    // Difficulty buttons
    difficultyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            difficultyBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            // Update difficulty
            CONFIG.DIFFICULTY = btn.dataset.difficulty;
            // Start a new game with new difficulty
            startNewGame();
        });
    });
}

// Handle cell click
function handleCellClick(e) {
    const cell = e.target.closest('.cell');
    if (!cell || !CONFIG.GAME_ACTIVE || currentPlayer !== CONFIG.PLAYER) return;
    
    const index = parseInt(cell.dataset.index);
    
    // If cell is already filled, do nothing
    if (gameState[index] !== CONFIG.EMPTY) return;
    
    // Make player's move
    makeMove(index, CONFIG.PLAYER);
    
    // Check for win or tie
    if (checkWin(gameState, CONFIG.PLAYER)) {
        endGame('player');
        return;
    } else if (isBoardFull()) {
        endGame('tie');
        return;
    }
    
    // Switch to AI's turn
    currentPlayer = CONFIG.AI;
    updateStatus("AI is thinking...");
    
    // AI makes a move after a short delay for better UX
    setTimeout(() => {
        const aiMove = getAIMove();
        makeMove(aiMove, CONFIG.AI);
        
        // Check for win or tie
        if (checkWin(gameState, CONFIG.AI)) {
            endGame('ai');
        } else if (isBoardFull()) {
            endGame('tie');
        } else {
            // Switch back to player's turn
            currentPlayer = CONFIG.PLAYER;
            updateStatus("Your turn (X)");
        }
    }, 600);
}

// Make a move on the board
function makeMove(index, player) {
    gameState[index] = player;
    renderBoard();
}

// Get AI's move based on difficulty
function getAIMove() {
    let move;
    
    switch (CONFIG.DIFFICULTY) {
        case 'easy':
            move = getRandomMove();
            break;
        case 'medium':
            // 50% chance to make a smart move, 50% random
            move = Math.random() < 0.5 ? getBestMove() : getRandomMove();
            break;
        case 'hard':
        default:
            move = getBestMove();
            break;
    }
    
    return move;
}

// Get a random available move
function getRandomMove() {
    const availableMoves = [];
    for (let i = 0; i < gameState.length; i++) {
        if (gameState[i] === CONFIG.EMPTY) {
            availableMoves.push(i);
        }
    }
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
}

// Get the best move using minimax algorithm
function getBestMove() {
    let bestScore = -Infinity;
    let bestMove = -1;
    
    for (let i = 0; i < gameState.length; i++) {
        if (gameState[i] === CONFIG.EMPTY) {
            gameState[i] = CONFIG.AI;
            let score = minimax(gameState, 0, false, -Infinity, Infinity);
            gameState[i] = CONFIG.EMPTY;
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }
    
    return bestMove;
}

// Minimax algorithm with alpha-beta pruning
function minimax(board, depth, isMaximizing, alpha, beta) {
    // Check for terminal states
    if (checkWin(board, CONFIG.AI)) return 10 - depth;
    if (checkWin(board, CONFIG.PLAYER)) return depth - 10;
    if (isBoardFull(board)) return 0;
    
    if (isMaximizing) {
        let maxEval = -Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === CONFIG.EMPTY) {
                board[i] = CONFIG.AI;
                const evaluation = minimax(board, depth + 1, false, alpha, beta);
                board[i] = CONFIG.EMPTY;
                maxEval = Math.max(maxEval, evaluation);
                alpha = Math.max(alpha, evaluation);
                if (beta <= alpha) break; // Beta cut-off
            }
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === CONFIG.EMPTY) {
                board[i] = CONFIG.PLAYER;
                const evaluation = minimax(board, depth + 1, true, alpha, beta);
                board[i] = CONFIG.EMPTY;
                minEval = Math.min(minEval, evaluation);
                beta = Math.min(beta, evaluation);
                if (beta <= alpha) break; // Alpha cut-off
            }
        }
        return minEval;
    }
}

// Check if the current board has a winner
function checkWin(board = gameState, player) {
    // If no board is provided, use the current game state
    board = board || gameState;
    
    // Check all possible winning combinations
    for (const combination of WINNING_COMBINATIONS) {
        // Check if all cells in the combination are occupied by the player
        const isWinning = combination.every(index => board[index] === player);
        if (isWinning) {
            // Highlight winning cells
            highlightWinningCells(combination);
            return true;
        }
    }
    return false;
}

// Highlight the winning cells
function highlightWinningCells(cells) {
    cells.forEach(index => {
        const cell = document.querySelector(`.cell[data-index="${index}"]`);
        if (cell) {
            cell.classList.add('win');
        }
    });
}

// Check if the board is full
function isBoardFull(board = gameState) {
    return board.every(cell => cell !== CONFIG.EMPTY);
}

// Start a new game
function startNewGame() {
    // Reset game state
    gameState = Array(CONFIG.GRID_SIZE * CONFIG.GRID_SIZE).fill(CONFIG.EMPTY);
    currentPlayer = CONFIG.PLAYER;
    CONFIG.GAME_ACTIVE = true;
    
    // Render the board
    renderBoard();
    
    // Update status
    updateStatus("Your turn (X)");
    
    // Hide modal if open
    hideModal(gameOverModal);
    
    // If AI goes first (for future feature)
    if (currentPlayer === CONFIG.AI) {
        setTimeout(() => {
            const aiMove = getAIMove();
            makeMove(aiMove, CONFIG.AI);
            currentPlayer = CONFIG.PLAYER;
            updateStatus("Your turn (X)");
        }, 600);
    }
}

// Render the game board
function renderBoard() {
    // Clear the board
    gameBoard.innerHTML = '';
    
    // Create cells
    for (let i = 0; i < CONFIG.GRID_SIZE * CONFIG.GRID_SIZE; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
        
        // Add content if cell is not empty
        if (gameState[i] !== CONFIG.EMPTY) {
            cell.textContent = gameState[i];
            cell.classList.add(gameState[i].toLowerCase());
        }
        
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
    
    // Update scores
    if (winner === 'player') {
        scores.player++;
        showGameOver('You Win!', 'Congratulations! You defeated the AI.');
    } else if (winner === 'ai') {
        scores.ai++;
        showGameOver('AI Wins!', 'Better luck next time!');
    } else {
        scores.ties++;
        showGameOver('Game Tied!', 'The game ended in a draw.');
    }
    
    // Save scores
    saveScores();
    updateScores();
}

// Show game over modal
function showGameOver(title, message) {
    resultText.textContent = title;
    resultMessage.textContent = message;
    showModal(gameOverModal);
}

// Show modal
function showModal(modal) {
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

// Hide modal
function hideModal(modal) {
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
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
