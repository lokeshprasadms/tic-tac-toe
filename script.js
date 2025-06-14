// Game Configuration
const CONFIG = {
    PLAYER: 'X',
    AI: 'O',
    EMPTY: '',
    GRID_SIZE: 5,     // 5x5 grid
    WIN_LENGTH: 4,    // Need 4 in a row to win
    DIFFICULTY: 'medium', // easy, medium, hard
    GAME_ACTIVE: false,
    SOUNDS: {
        move: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-game-click-1114.mp3'),
        win: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3'),
        draw: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-complete-or-approved-mission-2059.mp3'),
        click: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3')
    }
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

// Preload sounds
Object.values(CONFIG.SOUNDS).forEach(sound => {
    sound.volume = 0.5;
    sound.load();
});

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

// Play sound effect
function playSound(sound) {
    if (!CONFIG.SOUNDS[sound]) return;
    
    // Clone the audio element to allow multiple rapid plays
    const audio = CONFIG.SOUNDS[sound].cloneNode();
    audio.volume = 0.5;
    audio.play().catch(e => console.warn('Audio play failed:', e));
}

// Add animation to an element
function animateElement(element, animation, duration = 300) {
    return new Promise((resolve) => {
        element.style.animation = `${animation} ${duration}ms ease-out`;
        setTimeout(() => {
            element.style.animation = '';
            resolve();
        }, duration);
    });
}

// Initialize the game
function initGame() {
    // Load saved scores
    loadScores();
    
    // Set up event listeners
    setupEventListeners();
    
    // Set medium as default difficulty
    document.querySelector('.difficulty-btn[data-difficulty="medium"]').classList.add('active');
    
    // Start a new game
    startNewGame();
}

// Set up event listeners
function setupEventListeners() {
    // Cell click event (using event delegation for better performance)
    gameBoard.addEventListener('click', (e) => {
        if (CONFIG.GAME_ACTIVE && currentPlayer === CONFIG.PLAYER) {
            handleCellClick(e);
        }
    });
    
    // New game button
    newGameBtn.addEventListener('click', () => {
        playSound('click');
        startNewGame();
    });
    
    // Play again button
    playAgainBtn.addEventListener('click', () => {
        playSound('click');
        hideModal(gameOverModal);
        startNewGame();
    });
    
    // Close modal button
    closeModalBtn.addEventListener('click', () => {
        playSound('click');
        hideModal(gameOverModal);
    });
    
    // Difficulty buttons
    difficultyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            playSound('click');
            // Remove active class from all buttons
            difficultyBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            // Update difficulty
            CONFIG.DIFFICULTY = btn.dataset.difficulty;
            // Show difficulty change feedback
            updateStatus(`Difficulty set to: ${CONFIG.DIFFICULTY}`, 1500);
            // Start a new game with new difficulty after a short delay
            setTimeout(startNewGame, 800);
        });
    });
}

// Handle cell click
async function handleCellClick(e) {
    const cell = e.target.closest('.cell');
    if (!cell || !CONFIG.GAME_ACTIVE || currentPlayer !== CONFIG.PLAYER) return;
    
    const index = parseInt(cell.dataset.index);
    
    // If cell is already filled, do nothing
    if (gameState[index] !== CONFIG.EMPTY) return;
    
    // Play move sound and add visual feedback
    playSound('move');
    await animateElement(cell, 'popIn', 200);
    
    // Make player's move
    makeMove(index, CONFIG.PLAYER);
    
    // Check for win or tie
    if (checkWin(gameState, CONFIG.PLAYER)) {
        playSound('win');
        endGame('player');
        return;
    } else if (isBoardFull()) {
        playSound('draw');
        endGame('tie');
        return;
    }
    
    // Switch to AI's turn
    currentPlayer = CONFIG.AI;
    updateStatus("AI is thinking...");
    
    // AI makes a move after a short delay for better UX
    setTimeout(async () => {
        const aiMove = getAIMove();
        const aiCell = document.querySelector(`.cell[data-index="${aiMove}"]`);
        
        // Visual feedback for AI move
        if (aiCell) {
            await animateElement(aiCell, 'popIn', 200);
        }
        
        // Make AI's move
        makeMove(aiMove, CONFIG.AI);
        
        // Check for win or tie
        if (checkWin(gameState, CONFIG.AI)) {
            playSound('win');
            endGame('ai');
        } else if (isBoardFull()) {
            playSound('draw');
            endGame('tie');
        } else {
            // Switch back to player's turn
            currentPlayer = CONFIG.PLAYER;
            updateStatus("Your turn (X)");
        }
    }, 600);
}

// Make a move on the board with animation
async function makeMove(index, player) {
    if (gameState[index] !== CONFIG.EMPTY) return false;
    
    gameState[index] = player;
    
    // Update the board with animation
    const cell = document.querySelector(`.cell[data-index="${index}"]`);
    if (cell) {
        cell.textContent = player;
        cell.classList.add(player.toLowerCase());
        await animateElement(cell, 'popIn', 200);
    }
    
    return true;
}

// Get AI's move based on difficulty
function getAIMove() {
    let move;
    
    switch (CONFIG.DIFFICULTY) {
        case 'easy':
            // Easy: Random moves with occasional blocking
            move = getEasyAIMove();
            break;
        case 'medium':
            // Medium: Mix of random and strategic moves
            move = Math.random() < 0.6 ? getBestMove() : getRandomMove();
            break;
        case 'hard':
        default:
            // Hard: Strong AI with minimax and optimizations
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
    return availableMoves.length > 0 ? 
           availableMoves[Math.floor(Math.random() * availableMoves.length)] : -1;
}

// Easy AI: Random but will block immediate wins
function getEasyAIMove() {
    // Check if AI can win in the next move
    for (let i = 0; i < gameState.length; i++) {
        if (gameState[i] === CONFIG.EMPTY) {
            gameState[i] = CONFIG.AI;
            if (checkWin(gameState, CONFIG.AI)) {
                gameState[i] = CONFIG.EMPTY;
                return i;
            }
            gameState[i] = CONFIG.EMPTY;
        }
    }
    
    // Block player from winning
    for (let i = 0; i < gameState.length; i++) {
        if (gameState[i] === CONFIG.EMPTY) {
            gameState[i] = CONFIG.PLAYER;
            if (checkWin(gameState, CONFIG.PLAYER)) {
                gameState[i] = CONFIG.EMPTY;
                return i;
            }
            gameState[i] = CONFIG.EMPTY;
        }
    }
    
    // Otherwise, random move
    return getRandomMove();
}

// Get the best move using minimax algorithm with optimizations
function getBestMove() {
    // If center is available, take it (strong opening move)
    const center = Math.floor((CONFIG.GRID_SIZE * CONFIG.GRID_SIZE) / 2);
    if (gameState[center] === CONFIG.EMPTY) {
        return center;
    }
    
    // If it's the first move, take a corner
    const emptyCells = gameState.filter(cell => cell === CONFIG.EMPTY).length;
    if (emptyCells === CONFIG.GRID_SIZE * CONFIG.GRID_SIZE - 1) {
        const corners = [0, CONFIG.GRID_SIZE - 1, 
                        (CONFIG.GRID_SIZE * (CONFIG.GRID_SIZE - 1)), 
                        (CONFIG.GRID_SIZE * CONFIG.GRID_SIZE) - 1];
        const availableCorners = corners.filter(i => gameState[i] === CONFIG.EMPTY);
        if (availableCorners.length > 0) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }
    }
    
    // Use minimax for the best move
    let bestScore = -Infinity;
    let bestMove = -1;
    let alpha = -Infinity;
    let beta = Infinity;
    
    // Get all available moves
    const availableMoves = [];
    for (let i = 0; i < gameState.length; i++) {
        if (gameState[i] === CONFIG.EMPTY) {
            availableMoves.push(i);
        }
    }
    
    // Sort moves to improve alpha-beta pruning efficiency
    availableMoves.sort((a, b) => {
        // Prioritize center and corners first
        const isCornerOrCenter = (i) => {
            const row = Math.floor(i / CONFIG.GRID_SIZE);
            const col = i % CONFIG.GRID_SIZE;
            const isCorner = (row === 0 || row === CONFIG.GRID_SIZE - 1) && 
                           (col === 0 || col === CONFIG.GRID_SIZE - 1);
            const isCenter = row === Math.floor(CONFIG.GRID_SIZE / 2) && 
                           col === Math.floor(CONFIG.GRID_SIZE / 2);
            return isCorner || isCenter ? 1 : 0;
        };
        
        return isCornerOrCenter(b) - isCornerOrCenter(a);
    });
    
    // Evaluate each move
    for (const move of availableMoves) {
        gameState[move] = CONFIG.AI;
        let score = minimax(gameState, 0, false, alpha, beta);
        gameState[move] = CONFIG.EMPTY;
        
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
        
        alpha = Math.max(alpha, bestScore);
        if (beta <= alpha) {
            break; // Beta cut-off
        }
    }
    
    // If no best move found (shouldn't happen), fall back to random
    return bestMove !== -1 ? bestMove : getRandomMove();
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
