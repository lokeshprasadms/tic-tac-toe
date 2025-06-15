// Game Configuration
const CONFIG = {
    PLAYER_X: 'X',
    PLAYER_O: 'O',
    EMPTY: '',
    BOARD_SIZE: 5,
    WIN_LENGTH: 5,
    DIFFICULTY: 'medium',
    GAME_ACTIVE: true,
    CURRENT_PLAYER: 'X',
    SCORES: { X: 0, O: 0, ties: 0 },
    WINNING_SEQUENCES: []
};

// DOM Elements
const board = document.getElementById('board');
const statusDisplay = document.getElementById('status');
const scoreX = document.getElementById('scoreX');
const scoreO = document.getElementById('scoreO');
const scoreTies = document.getElementById('scoreTies');
const restartBtn = document.getElementById('restartBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const gameOverModal = document.querySelector('.modal');
const modalText = document.getElementById('modalText');
const difficultyBtns = document.querySelectorAll('[data-difficulty]');

// Game State
let gameState = [];
let isComputerTurn = false;

// Initialize the game
function initGame() {
    // Reset game state
    gameState = Array(CONFIG.BOARD_SIZE * CONFIG.BOARD_SIZE).fill(CONFIG.EMPTY);
    CONFIG.GAME_ACTIVE = true;
    CONFIG.CURRENT_PLAYER = 'X';
    isComputerTurn = false;
    
    // Reset UI
    renderBoard();
    updateStatus(`Your turn (${CONFIG.CURRENT_PLAYER})`);
    updateScores();
    
    // Close modal if open
    gameOverModal.classList.remove('show');
}

// Render the game board
function renderBoard() {
    board.innerHTML = '';
    
    gameState.forEach((cell, index) => {
        const cellElement = document.createElement('button');
        cellElement.className = 'cell';
        cellElement.dataset.index = index;
        
        if (cell !== CONFIG.EMPTY) {
            cellElement.textContent = cell;
            cellElement.classList.add(cell.toLowerCase());
        }
        
        cellElement.addEventListener('click', () => handleCellClick(index));
        board.appendChild(cellElement);
    });
}

// Handle cell click
function handleCellClick(index) {
    // Prevent move if game is over or not player's turn
    if (!CONFIG.GAME_ACTIVE || isComputerTurn || gameState[index] !== CONFIG.EMPTY) {
        return;
    }
    
    // Make move
    makeMove(index, CONFIG.CURRENT_PLAYER);
    
    // Check for win or draw
    if (checkWin(gameState, CONFIG.CURRENT_PLAYER)) {
        gameOver(CONFIG.CURRENT_PLAYER);
        return;
    } else if (isBoardFull()) {
        gameOver('tie');
        return;
    }
    
    // Switch to computer's turn
    CONFIG.CURRENT_PLAYER = CONFIG.PLAYER_O;
    updateStatus(`Computer's turn`);
    isComputerTurn = true;
    
    // Computer's turn with delay for better UX
    setTimeout(makeComputerMove, 500);
}

// Make a move
function makeMove(index, player) {
    gameState[index] = player;
    renderBoard();
}

// Computer makes a move
function makeComputerMove() {
    if (!CONFIG.GAME_ACTIVE || !isComputerTurn) return;
    
    let move;
    const availableMoves = [];
    gameState.forEach((cell, index) => {
        if (cell === CONFIG.EMPTY) availableMoves.push(index);
    });
    
    // If no moves available, return
    if (availableMoves.length === 0) return;
    
    // Check for winning move
    for (const move of availableMoves) {
        const newBoard = [...gameState];
        newBoard[move] = CONFIG.PLAYER_O;
        if (checkWin(newBoard, CONFIG.PLAYER_O)) {
            makeComputerMoveFinal(move);
            return;
        }
    }
    
    // Block player's winning move
    for (const move of availableMoves) {
        const newBoard = [...gameState];
        newBoard[move] = CONFIG.PLAYER_X;
        if (checkWin(newBoard, CONFIG.PLAYER_X)) {
            makeComputerMoveFinal(move);
            return;
        }
    }
    
    // Choose move based on difficulty
    if (CONFIG.DIFFICULTY === 'easy') {
        // Random move
        move = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    } else if (CONFIG.DIFFICULTY === 'medium') {
        // 70% chance of good move, 30% random
        if (Math.random() < 0.7) {
            move = getStrategicMove(availableMoves);
        } else {
            move = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        }
    } else {
        // Hard: Use minimax
        move = getBestMove();
    }
    
    makeComputerMoveFinal(move);
}

function makeComputerMoveFinal(move) {
    makeMove(move, CONFIG.PLAYER_O);
    
    // Check for win or draw
    if (checkWin(gameState, CONFIG.PLAYER_O)) {
        gameOver(CONFIG.PLAYER_O);
    } else if (isBoardFull()) {
        gameOver('tie');
    } else {
        CONFIG.CURRENT_PLAYER = CONFIG.PLAYER_X;
        updateStatus(`Your turn (${CONFIG.CURRENT_PLAYER})`);
    }
    
    isComputerTurn = false;
}

// Get strategic move (center, corners, then edges)
function getStrategicMove(availableMoves) {
    const center = Math.floor(CONFIG.BOARD_SIZE * CONFIG.BOARD_SIZE / 2);
    const corners = [0, CONFIG.BOARD_SIZE - 1, 
                    CONFIG.BOARD_SIZE * (CONFIG.BOARD_SIZE - 1), 
                    CONFIG.BOARD_SIZE * CONFIG.BOARD_SIZE - 1];
    
    // Try center
    if (availableMoves.includes(center)) return center;
    
    // Try corners
    const availableCorners = corners.filter(corner => availableMoves.includes(corner));
    if (availableCorners.length > 0) {
        return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }
    
    // Return random move if no strategic moves found
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
}

// Minimax algorithm for hard difficulty
function getBestMove() {
    let bestScore = -Infinity;
    let bestMove;
    
    for (let i = 0; i < gameState.length; i++) {
        if (gameState[i] === CONFIG.EMPTY) {
            gameState[i] = CONFIG.PLAYER_O;
            let score = minimax(gameState, 0, false);
            gameState[i] = CONFIG.EMPTY;
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }
    
    return bestMove;
}

function minimax(board, depth, isMaximizing) {
    // Check terminal states
    if (checkWin(board, CONFIG.PLAYER_O)) return 10 - depth;
    if (checkWin(board, CONFIG.PLAYER_X)) return depth - 10;
    if (isBoardFull(board)) return 0;
    
    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === CONFIG.EMPTY) {
                board[i] = CONFIG.PLAYER_O;
                let score = minimax(board, depth + 1, false);
                board[i] = CONFIG.EMPTY;
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === CONFIG.EMPTY) {
                board[i] = CONFIG.PLAYER_X;
                let score = minimax(board, depth + 1, true);
                board[i] = CONFIG.EMPTY;
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

// Check for win
function checkWin(board, player) {
    const size = CONFIG.BOARD_SIZE;
    const winLength = CONFIG.WIN_LENGTH;
    
    // Check rows
    for (let row = 0; row < size; row++) {
        for (let col = 0; col <= size - winLength; col++) {
            let win = true;
            for (let i = 0; i < winLength; i++) {
                if (board[row * size + col + i] !== player) {
                    win = false;
                    break;
                }
            }
            if (win) return true;
        }
    }
    
    // Check columns
    for (let col = 0; col < size; col++) {
        for (let row = 0; row <= size - winLength; row++) {
            let win = true;
            for (let i = 0; i < winLength; i++) {
                if (board[(row + i) * size + col] !== player) {
                    win = false;
                    break;
                }
            }
            if (win) return true;
        }
    }
    
    // Check diagonals (top-left to bottom-right)
    for (let row = 0; row <= size - winLength; row++) {
        for (let col = 0; col <= size - winLength; col++) {
            let win = true;
            for (let i = 0; i < winLength; i++) {
                if (board[(row + i) * size + (col + i)] !== player) {
                    win = false;
                    break;
                }
            }
            if (win) return true;
        }
    }
    
    // Check diagonals (top-right to bottom-left)
    for (let row = 0; row <= size - winLength; row++) {
        for (let col = winLength - 1; col < size; col++) {
            let win = true;
            for (let i = 0; i < winLength; i++) {
                if (board[(row + i) * size + (col - i)] !== player) {
                    win = false;
                    break;
                }
            }
            if (win) return true;
        }
    }
    
    return false;
}

// Check if board is full
function isBoardFull(board = gameState) {
    return board.every(cell => cell !== CONFIG.EMPTY);
}

// Game over handler
function gameOver(winner) {
    CONFIG.GAME_ACTIVE = false;
    
    // Update scores
    if (winner === 'tie') {
        CONFIG.SCORES.ties++;
        updateStatus("Game Over - It's a tie!");
        modalText.textContent = "It's a Tie!";
    } else {
        CONFIG.SCORES[winner]++;
        updateStatus(`Player ${winner} wins!`);
        modalText.textContent = `Player ${winner} Wins!`;
        
        // Highlight winning cells
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => cell.classList.add('win'));
    }
    
    updateScores();
    
    // Show game over modal
    gameOverModal.classList.add('show');
}

// Update scores display
function updateScores() {
    scoreX.textContent = `X: ${CONFIG.SCORES.X}`;
    scoreO.textContent = `O: ${CONFIG.SCORES.O}`;
    scoreTies.textContent = `Ties: ${CONFIG.SCORES.ties}`;
}

// Update status message
function updateStatus(message) {
    statusDisplay.textContent = message;
}

// Event Listeners
function setupEventListeners() {
    // Restart game
    restartBtn.addEventListener('click', initGame);
    playAgainBtn.addEventListener('click', () => {
        gameOverModal.classList.remove('show');
        initGame();
    });
    
    // Difficulty buttons
    difficultyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            difficultyBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Set difficulty
            CONFIG.DIFFICULTY = btn.dataset.difficulty;
            
            // Restart game with new difficulty
            initGame();
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === gameOverModal) {
            gameOverModal.classList.remove('show');
        }
    });
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    initGame();
});
