// Game Configuration
const CONFIG = {
    PLAYER: 'X',
    AI: 'O',
    EMPTY: '',
    GRID_SIZE: 5,
    WIN_LENGTH: 5, // Changed to 5 for 5x5
    DIFFICULTY: 'medium',
    GAME_ACTIVE: false,
    ANIMATION_DELAY: 300 // ms for AI move animation
};

// AI difficulty settings
const DIFFICULTY_SETTINGS = {
    easy: {
        winWeight: 1,
        blockWeight: 1,
        randomMoveChance: 0.8,  // More random moves
        depth: 1,
        searchDepth: 2
    },
    medium: {
        winWeight: 3,
        blockWeight: 2,
        randomMoveChance: 0.4,
        depth: 2,
        searchDepth: 3
    },
    hard: {
        winWeight: 5,
        blockWeight: 4,
        randomMoveChance: 0.2,
        depth: 3,
        searchDepth: 4
    },
    expert: {
        winWeight: 10,
        blockWeight: 8,
        randomMoveChance: 0,    // No random moves
        depth: 4,
        searchDepth: 5,  // Deeper search for expert
        useHeuristics: true    // Additional heuristics for expert
    }
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
    // Reset game state
    gameState = Array(CONFIG.GRID_SIZE * CONFIG.GRID_SIZE).fill(CONFIG.EMPTY);
    currentPlayer = CONFIG.PLAYER;
    CONFIG.GAME_ACTIVE = true;
    
    // Clear any existing board
    gameBoard.innerHTML = '';
    
    // Set up the game
    renderBoard();
    setupEventListeners();
    loadScores();
    loadDifficulty();
    updateStatus("Your turn (X)");
    
    // Remove any existing game over state
    document.body.classList.remove('game-over');
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
            setDifficulty(btn.dataset.level);
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
    if (!CONFIG.GAME_ACTIVE || currentPlayer !== CONFIG.PLAYER) return;
    
    const cell = e.target.closest('.cell');
    if (!cell) return;
    
    const index = parseInt(cell.dataset.index);
    if (gameState[index] !== CONFIG.EMPTY) return;
    
    // Make player's move
    if (makeMove(index, CONFIG.PLAYER)) {
        // Switch to AI's turn
        currentPlayer = CONFIG.AI;
        updateStatus("AI is thinking...");
        
        // AI makes a move after a short delay
        if (CONFIG.GAME_ACTIVE) {
            setTimeout(() => {
                if (!CONFIG.GAME_ACTIVE || currentPlayer !== CONFIG.AI) return;
                
                const aiMove = getAIMove();
                if (aiMove !== -1 && gameState[aiMove] === CONFIG.EMPTY) {
                    makeMove(aiMove, CONFIG.AI);
                    currentPlayer = CONFIG.PLAYER;
                    updateStatus("Your turn (X)");
                }
            }, CONFIG.ANIMATION_DELAY);
        }
    }
}

// Make a move on the board
function makeMove(index, player) {
    if (gameState[index] !== CONFIG.EMPTY || !CONFIG.GAME_ACTIVE) return false;
    
    gameState[index] = player;
    const cell = document.querySelector(`[data-index="${index}"]`);
    if (cell) {
        cell.textContent = player;
        cell.classList.add(player === CONFIG.PLAYER ? 'player-move' : 'ai-move');
        
        // Add animation class
        cell.classList.add('move-animation');
        setTimeout(() => cell.classList.remove('move-animation'), 150);
    }
    
    // Check for win or draw
    if (checkWin(gameState, player)) {
        endGame(player === CONFIG.PLAYER ? 'player' : 'ai');
        return true;
    } else if (isBoardFull()) {
        endGame('draw');
        return true;
    }
    
    return true;
}

// Get AI's move based on difficulty
function getAIMove() {
    const difficulty = CONFIG.DIFFICULTY;
    const settings = DIFFICULTY_SETTINGS[difficulty];
    
    // Check for immediate win or block
    const winMove = findWinningMove(CONFIG.AI);
    if (winMove !== -1) return winMove;
    
    const blockMove = findWinningMove(CONFIG.PLAYER);
    if (blockMove !== -1) return blockMove;
    
    // Use minimax for harder difficulties
    if (difficulty === 'hard' || difficulty === 'expert') {
        return findBestMove();
    }
    
    // For easier difficulties, sometimes make random moves
    if (Math.random() < settings.randomMoveChance) {
        return getRandomMove();
    }
    
    // Use minimax for medium+
    if (difficulty === 'medium' || difficulty === 'hard') {
        return findBestMove();
    }
    
    // Default to random move
    return getRandomMove();
}

// Find a winning move for the given player
function findWinningMove(player) {
    for (let i = 0; i < gameState.length; i++) {
        if (gameState[i] !== CONFIG.EMPTY) continue;
        
        // Test move
        gameState[i] = player;
        const isWin = checkWin(gameState, player);
        gameState[i] = CONFIG.EMPTY; // Undo
        
        if (isWin) return i;
    }
    return -1;
}

// Evaluate board for minimax
function evaluateBoard(board, player) {
    const opponent = player === CONFIG.PLAYER ? CONFIG.AI : CONFIG.PLAYER;
    let score = 0;
    
    // Check all possible lines
    const lines = [];
    
    // Rows
    for (let row = 0; row < CONFIG.GRID_SIZE; row++) {
        for (let col = 0; col <= CONFIG.GRID_SIZE - CONFIG.WIN_LENGTH; col++) {
            const line = [];
            for (let i = 0; i < CONFIG.WIN_LENGTH; i++) {
                line.push(row * CONFIG.GRID_SIZE + col + i);
            }
            lines.push(line);
        }
    }
    
    // Columns
    for (let col = 0; col < CONFIG.GRID_SIZE; col++) {
        for (let row = 0; row <= CONFIG.GRID_SIZE - CONFIG.WIN_LENGTH; row++) {
            const line = [];
            for (let i = 0; i < CONFIG.WIN_LENGTH; i++) {
                line.push((row + i) * CONFIG.GRID_SIZE + col);
            }
            lines.push(line);
        }
    }
    
    // Diagonals
    for (let row = 0; row <= CONFIG.GRID_SIZE - CONFIG.WIN_LENGTH; row++) {
        for (let col = 0; col <= CONFIG.GRID_SIZE - CONFIG.WIN_LENGTH; col++) {
            // Top-left to bottom-right
            const diag1 = [];
            // Top-right to bottom-left
            const diag2 = [];
            for (let i = 0; i < CONFIG.WIN_LENGTH; i++) {
                diag1.push((row + i) * CONFIG.GRID_SIZE + (col + i));
                diag2.push((row + i) * CONFIG.GRID_SIZE + (col + CONFIG.WIN_LENGTH - 1 - i));
            }
            lines.push(diag1);
            lines.push(diag2);
        }
    }
    
    // Evaluate each line
    for (const line of lines) {
        let playerCount = 0, opponentCount = 0, emptyCount = 0;
        
        for (const idx of line) {
            if (board[idx] === player) playerCount++;
            else if (board[idx] === opponent) opponentCount++;
            else emptyCount++;
        }
        
        // Score based on line potential
        if (playerCount > 0 && opponentCount === 0) {
            score += Math.pow(10, playerCount);
        } else if (opponentCount > 0 && playerCount === 0) {
            score -= Math.pow(10, opponentCount);
        }
    }
    
    return score;
}

// Find best move using minimax with alpha-beta pruning
function findBestMove() {
    let bestScore = -Infinity;
    let bestMove = -1;
    const settings = DIFFICULTY_SETTINGS[CONFIG.DIFFICULTY];
    
    // Check center first (best first move)
    const center = Math.floor(CONFIG.GRID_SIZE * CONFIG.GRID_SIZE / 2);
    if (gameState[center] === CONFIG.EMPTY) {
        return center;
    }
    
    // Check corners
    const corners = [0, CONFIG.GRID_SIZE - 1, 
                    (CONFIG.GRID_SIZE * CONFIG.GRID_SIZE) - CONFIG.GRID_SIZE, 
                    (CONFIG.GRID_SIZE * CONFIG.GRID_SIZE) - 1];
    const emptyCorners = corners.filter(idx => gameState[idx] === CONFIG.EMPTY);
    if (emptyCorners.length > 0) {
        return emptyCorners[Math.floor(Math.random() * emptyCorners.length)];
    }
    
    // Use minimax for remaining moves
    for (let i = 0; i < gameState.length; i++) {
        if (gameState[i] === CONFIG.EMPTY) {
            gameState[i] = CONFIG.AI;
            const score = minimax(gameState, 0, false, -Infinity, Infinity, settings.depth);
            gameState[i] = CONFIG.EMPTY;
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }
    
    return bestMove !== -1 ? bestMove : getRandomMove();
}

// Get a random valid move
function getRandomMove() {
    const availableMoves = [];
    gameState.forEach((cell, index) => {
        if (cell === CONFIG.EMPTY) availableMoves.push(index);
    });
    return availableMoves.length > 0 
        ? availableMoves[Math.floor(Math.random() * availableMoves.length)]
        : -1;
}

// Minimax algorithm with alpha-beta pruning
function minimax(board, depth, isMaximizing, alpha, beta, maxDepth) {
    const currentPlayer = isMaximizing ? CONFIG.AI : CONFIG.PLAYER;
    const opponent = isMaximizing ? CONFIG.PLAYER : CONFIG.AI;
    
    // Check terminal states or max depth
    if (checkWin(board, CONFIG.AI)) return 1000 - depth;
    if (checkWin(board, CONFIG.PLAYER)) return -1000 + depth;
    if (isBoardFull() || depth >= maxDepth) {
        return evaluateBoard(board, CONFIG.AI);
    }
    
    if (isMaximizing) {
        let maxEval = -Infinity;
        
        // Get all possible moves
        const moves = [];
        for (let i = 0; i < board.length; i++) {
            if (board[i] === CONFIG.EMPTY) {
                // Try the move
                board[i] = CONFIG.AI;
                const eval = minimax(board, depth + 1, false, alpha, beta, maxDepth);
                board[i] = CONFIG.EMPTY; // Undo
                
                // Alpha-beta pruning
                maxEval = Math.max(maxEval, eval);
                alpha = Math.max(alpha, eval);
                if (beta <= alpha) {
                    break; // Beta cut-off
                }
            }
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        
        // Get all possible moves
        for (let i = 0; i < board.length; i++) {
            if (board[i] === CONFIG.EMPTY) {
                // Try the move
                board[i] = CONFIG.PLAYER;
                const eval = minimax(board, depth + 1, true, alpha, beta, maxDepth);
                board[i] = CONFIG.EMPTY; // Undo
                
                // Alpha-beta pruning
                minEval = Math.min(minEval, eval);
                beta = Math.min(beta, eval);
                if (beta <= alpha) {
                    break; // Alpha cut-off
                }
            }
        }
        return minEval;
    }
}

// Check if a player has won
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
                if (board[(row + i) * CONFIG.GRID_SIZE + (col + i)] !== player) {
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
                if (board[(row + i) * CONFIG.GRID_SIZE + (col - i)] !== player) {
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
    // Reset game state
    gameState = Array(CONFIG.GRID_SIZE * CONFIG.GRID_SIZE).fill(CONFIG.EMPTY);
    currentPlayer = CONFIG.PLAYER;
    CONFIG.GAME_ACTIVE = true;
    
    // Clear the board
    gameBoard.innerHTML = '';
    
    // Re-render the board
    renderBoard();
    
    // Update UI
    updateStatus("Your turn (X)");
    hideModal(gameOverModal);
    
    // Ensure all cells are clickable
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });
}

// Render the game board
function renderBoard() {
    gameBoard.innerHTML = '';
    
    // Create a document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    for (let i = 0; i < CONFIG.GRID_SIZE * CONFIG.GRID_SIZE; i++) {
        const cell = document.createElement('button');
        cell.className = 'cell';
        cell.dataset.index = i;
        cell.setAttribute('aria-label', `Cell ${Math.floor(i / CONFIG.GRID_SIZE) + 1},${(i % CONFIG.GRID_SIZE) + 1}`);
        cell.addEventListener('click', handleCellClick);
        
        // Add touch events for mobile
        cell.addEventListener('touchstart', handleCellClick, { passive: true });
        
        fragment.appendChild(cell);
    }
    
    gameBoard.appendChild(fragment);
}

// Update game status text
function updateStatus(message) {
    gameStatusEl.textContent = message;
}

// End the game
function endGame(winner) {
    if (!CONFIG.GAME_ACTIVE) return; // Prevent multiple end game calls
    
    CONFIG.GAME_ACTIVE = false;
    document.body.classList.add('game-over');
    
    // Update scores
    if (winner === 'player') {
        scores.player++;
        showGameOver('You Win!', 'Congratulations! You defeated the AI!');
    } else if (winner === 'ai') {
        scores.ai++;
        showGameOver('Game Over', 'The AI won this round. Try again!');
    } else {
        scores.ties++;
        showGameOver('Draw!', 'The game ended in a draw!');
    }
    
    // Update UI
    updateScores();
    saveScores();
    
    // Small delay before showing game over for better UX
    setTimeout(() => {
        showGameOver(title, message);
    }, 300);
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
