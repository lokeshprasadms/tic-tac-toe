// Game Configuration
const CONFIG = {
    PLAYER: 'X',
    AI: 'O',
    EMPTY: '',
    GRID_SIZE: 5, // 5x5 grid
    WIN_LENGTH: 5, // Need 5 in a row to win
    DIFFICULTY: 'medium',
    GAME_ACTIVE: false,
    ANIMATION_DELAY: 300, // ms for AI move animation
    BOARD_SIZE: 25 // 5x5 grid cells
};

// AI difficulty settings
const DIFFICULTY_SETTINGS = {
    easy: {
        winWeight: 1,
        blockWeight: 1,
        randomMoveChance: 0.8,  // 80% chance of random moves
        depth: 1,
        searchDepth: 1,  // Shallow search for performance
        useHeuristics: false
    },
    medium: {
        winWeight: 3,
        blockWeight: 2,
        randomMoveChance: 0.3,
        depth: 2,
        searchDepth: 2,
        useHeuristics: true
    },
    hard: {
        winWeight: 5,
        blockWeight: 4,
        randomMoveChance: 0.1,
        depth: 3,
        searchDepth: 3,
        useHeuristics: true
    },
    expert: {
        winWeight: 10,
        blockWeight: 8,
        randomMoveChance: 0,    // No random moves
        depth: 4,              // Deeper search
        searchDepth: 4,        // Full lookahead
        useHeuristics: true,   // Advanced heuristics
        centerControl: true,   // Prefer center control
        cornerControl: true    // Prefer corner control
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
    gameState = Array(CONFIG.BOARD_SIZE).fill(CONFIG.EMPTY);
    CONFIG.GAME_ACTIVE = true;
    
    // Reset UI
    renderBoard();
    updateStatus("Your turn (X)");
    
    // Reset any win highlights
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.classList.remove('win');
    });
    
    // AI makes first move if it's O's turn
    if (CONFIG.PLAYER === 'O') {
        CONFIG.GAME_ACTIVE = false;
        setTimeout(() => {
            makeAIMove();
        }, CONFIG.ANIMATION_DELAY);
    }
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

// Handle cell click with better touch support
function handleCellClick(e) {
    // Prevent multiple rapid clicks
    if (!CONFIG.GAME_ACTIVE || Date.now() - lastClickTime < 300) {
        return;
    }
    lastClickTime = Date.now();
    
    const cell = e.target.closest('.cell');
    if (!cell) return;
    
    const index = parseInt(cell.dataset.index);
    if (gameState[index] !== CONFIG.EMPTY) {
        // Visual feedback for invalid move
        cell.classList.add('invalid');
        setTimeout(() => cell.classList.remove('invalid'), 300);
        return;
    }
    
    // Add visual feedback
    cell.classList.add('clicked');
    setTimeout(() => cell.classList.remove('clicked'), 200);
    
    // Make the move
    makeMove(index, CONFIG.PLAYER);
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
    const settings = DIFFICULTY_SETTINGS[CONFIG.DIFFICULTY];
    const { GRID_SIZE } = CONFIG;
    
    // On first move as O, prefer center or corners
    if (gameState.filter(cell => cell === CONFIG.EMPTY).length === CONFIG.BOARD_SIZE - 1) {
        const center = Math.floor(GRID_SIZE / 2) * GRID_SIZE + Math.floor(GRID_SIZE / 2);
        if (gameState[center] === CONFIG.EMPTY) return center;
        
        // If center taken, take a corner
        const corners = [0, GRID_SIZE-1, (GRID_SIZE-1)*GRID_SIZE, GRID_SIZE*GRID_SIZE-1];
        const availableCorners = corners.filter(corner => gameState[corner] === CONFIG.EMPTY);
        if (availableCorners.length > 0) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }
    }
    
    // Check for immediate win
    const winMove = findWinningMove(CONFIG.AI);
    if (winMove !== -1) return winMove;
    
    // Block player's immediate win
    const blockMove = findWinningMove(CONFIG.PLAYER);
    if (blockMove !== -1) return blockMove;
    
    // Use minimax for harder difficulties
    if (CONFIG.DIFFICULTY === 'hard' || CONFIG.DIFFICULTY === 'expert') {
        return findBestMove();
    }
    
    // For medium difficulty, use a mix of strategic and random moves
    if (CONFIG.DIFFICULTY === 'medium') {
        // 70% chance to make a strategic move, 30% random
        if (Math.random() > 0.3) {
            const strategicMove = getStrategicMove();
            if (strategicMove !== -1) return strategicMove;
        }
    }
    
    // For easy difficulty or fallback, use random move
    return getRandomMove();
}

// Find a winning move for the given player
function findWinningMove(player) {
    const board = gameState;
    // Check all possible lines (rows, columns, diagonals) for potential wins
    for (let i = 0; i < CONFIG.BOARD_SIZE; i++) {
        if (board[i] !== CONFIG.EMPTY) continue;
        
        // Check if placing here would complete a line
        board[i] = player;
        const hasWon = checkWin(board, player);
        board[i] = CONFIG.EMPTY;
        
        if (hasWon) return i;
    }
    return -1;
}

// Evaluate board for minimax
function evaluateBoard(board, player) {
    const opponent = player === CONFIG.PLAYER ? CONFIG.AI : CONFIG.PLAYER;
    const settings = DIFFICULTY_SETTINGS[CONFIG.DIFFICULTY];
    const { GRID_SIZE, WIN_LENGTH } = CONFIG;
    let score = 0;

    // Check for wins/losses first (terminal states)
    if (checkWin(board, player)) return 10000;  // Higher score for faster wins
    if (checkWin(board, opponent)) return -10000;

    // Evaluate all possible lines of WIN_LENGTH
    const evaluateLine = (line) => {
        let playerCount = 0;
        let opponentCount = 0;
        let emptyCount = 0;
        let lineScore = 0;

        // Count tokens in this line
        for (const cell of line) {
            if (board[cell] === player) playerCount++;
            else if (board[cell] === opponent) opponentCount++;
            else emptyCount++;
        }

        // Score based on line potential
        if (playerCount > 0 && opponentCount === 0) {
            // Favor lines where player can win
            lineScore = Math.pow(10, playerCount);
            // Extra points for potential to win
            if (playerCount >= WIN_LENGTH - 1 && emptyCount > 0) lineScore *= 5;
        } else if (opponentCount > 0 && playerCount === 0) {
            // Block opponent's potential wins
            lineScore = -Math.pow(10, opponentCount + 1); // More aggressive blocking
            // Extra penalty for opponent's potential win
            if (opponentCount >= WIN_LENGTH - 1 && emptyCount > 0) lineScore *= 5;
        }

        // Center control bonus (more important in 5x5)
        if (settings.centerControl) {
            const center = Math.floor(GRID_SIZE / 2) * GRID_SIZE + Math.floor(GRID_SIZE / 2);
            if (line.includes(center) && board[center] === player) {
                lineScore += 5;
            }
        }

        // Corner control bonus
        if (settings.cornerControl) {
            const corners = [
                0, // Top-left
                WIN_LENGTH - 1, // Top-right
                (GRID_SIZE - 1) * GRID_SIZE, // Bottom-left
                GRID_SIZE * GRID_SIZE - 1 // Bottom-right
            ];
            corners.forEach(corner => {
                if (line.includes(corner) && board[corner] === player) {
                    lineScore += 3;
                }
            });
        }

        return lineScore;
    };

    // Generate all possible winning lines
    const lines = [];
    
    // Rows
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col <= GRID_SIZE - WIN_LENGTH; col++) {
            const line = [];
            for (let i = 0; i < WIN_LENGTH; i++) {
                line.push(row * GRID_SIZE + col + i);
            }
            lines.push(line);
        }
    }

    // Columns
    for (let col = 0; col < GRID_SIZE; col++) {
        for (let row = 0; row <= GRID_SIZE - WIN_LENGTH; row++) {
            const line = [];
            for (let i = 0; i < WIN_LENGTH; i++) {
                line.push((row + i) * GRID_SIZE + col);
            }
            lines.push(line);
        }
    }

    // Diagonals (top-left to bottom-right)
    for (let row = 0; row <= GRID_SIZE - WIN_LENGTH; row++) {
        for (let col = 0; col <= GRID_SIZE - WIN_LENGTH; col++) {
            const line = [];
            for (let i = 0; i < WIN_LENGTH; i++) {
                line.push((row + i) * GRID_SIZE + (col + i));
            }
            lines.push(line);
        }
    }

    // Diagonals (top-right to bottom-left)
    for (let row = 0; row <= GRID_SIZE - WIN_LENGTH; row++) {
        for (let col = WIN_LENGTH - 1; col < GRID_SIZE; col++) {
            const line = [];
            for (let i = 0; i < WIN_LENGTH; i++) {
                line.push((row + i) * GRID_SIZE + (col - i));
            }
            lines.push(line);
        }
    }

    // Evaluate all lines
    for (const line of lines) {
        score += evaluateLine(line);
    }

    // Add some randomness to make AI less predictable (except on expert)
    if (settings.randomMoveChance > 0 && Math.random() < settings.randomMoveChance) {
        score += (Math.random() * 2 - 1) * 10; // Slightly larger random factor
    }

    return score;
}

// Find best move using minimax with alpha-beta pruning
function findBestMove() {
    let bestScore = -Infinity;
    let bestMove = -1;
    const settings = DIFFICULTY_SETTINGS[CONFIG.DIFFICULTY];
    
    // Check center first (best first move)
    const center = Math.floor(CONFIG.GRID_SIZE / 2) * CONFIG.GRID_SIZE + Math.floor(CONFIG.GRID_SIZE / 2);
    if (gameState[center] === CONFIG.EMPTY) {
        return center;
    }
    
    // Check corners
    const corners = [0, CONFIG.GRID_SIZE-1, (CONFIG.GRID_SIZE-1)*CONFIG.GRID_SIZE, CONFIG.GRID_SIZE*CONFIG.GRID_SIZE-1];
    const emptyCorners = corners.filter(corner => gameState[corner] === CONFIG.EMPTY);
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
    const emptyCells = [];
    for (let i = 0; i < CONFIG.BOARD_SIZE; i++) {
        if (gameState[i] === CONFIG.EMPTY) {
            emptyCells.push(i);
        }
    }
    return emptyCells.length > 0 ? emptyCells[Math.floor(Math.random() * emptyCells.length)] : -1;
}

// Get a strategic move based on board position
function getStrategicMove() {
    const { GRID_SIZE } = CONFIG;
    const center = Math.floor(GRID_SIZE / 2) * GRID_SIZE + Math.floor(GRID_SIZE / 2);
    
    // Prefer center if available
    if (gameState[center] === CONFIG.EMPTY) {
        return center;
    }
    
    // Then prefer corners
    const corners = [
        0, // Top-left
        GRID_SIZE - 1, // Top-right
        (GRID_SIZE - 1) * GRID_SIZE, // Bottom-left
        GRID_SIZE * GRID_SIZE - 1  // Bottom-right
    ];
    
    const availableCorners = corners.filter(corner => gameState[corner] === CONFIG.EMPTY);
    if (availableCorners.length > 0) {
        return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }
    
    // Then prefer edges
    const edges = [];
    for (let i = 1; i < GRID_SIZE - 1; i++) {
        // Top and bottom edges
        edges.push(i); // Top
        edges.push((GRID_SIZE - 1) * GRID_SIZE + i); // Bottom
        // Left and right edges (skip corners already checked)
        if (i > 0 && i < GRID_SIZE - 1) {
            edges.push(i * GRID_SIZE); // Left
            edges.push(i * GRID_SIZE + (GRID_SIZE - 1)); // Right
        }
    }
    
    const availableEdges = edges.filter(edge => gameState[edge] === CONFIG.EMPTY);
    if (availableEdges.length > 0) {
        return availableEdges[Math.floor(Math.random() * availableEdges.length)];
    }
    
    // Fallback to random if no strategic moves found
    return getRandomMove();
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
    const { GRID_SIZE, WIN_LENGTH } = CONFIG;
    
    // Check rows
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col <= GRID_SIZE - WIN_LENGTH; col++) {
            let win = true;
            for (let i = 0; i < WIN_LENGTH; i++) {
                if (board[row * GRID_SIZE + col + i] !== player) {
                    win = false;
                    break;
                }
            }
            if (win) return true;
        }
    }

    // Check columns
    for (let col = 0; col < GRID_SIZE; col++) {
        for (let row = 0; row <= GRID_SIZE - WIN_LENGTH; row++) {
            let win = true;
            for (let i = 0; i < WIN_LENGTH; i++) {
                if (board[(row + i) * GRID_SIZE + col] !== player) {
                    win = false;
                    break;
                }
            }
            if (win) return true;
        }
    }


    // Check diagonals (top-left to bottom-right)
    for (let row = 0; row <= GRID_SIZE - WIN_LENGTH; row++) {
        for (let col = 0; col <= GRID_SIZE - WIN_LENGTH; col++) {
            let win = true;
            for (let i = 0; i < WIN_LENGTH; i++) {
                if (board[(row + i) * GRID_SIZE + (col + i)] !== player) {
                    win = false;
                    break;
                }
            }
            if (win) return true;
        }
    }

    // Check diagonals (top-right to bottom-left)
    for (let row = 0; row <= GRID_SIZE - WIN_LENGTH; row++) {
        for (let col = WIN_LENGTH - 1; col < GRID_SIZE; col++) {
            let win = true;
            for (let i = 0; i < WIN_LENGTH; i++) {
                if (board[(row + i) * GRID_SIZE + (col - i)] !== player) {
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
    const { GRID_SIZE } = CONFIG;
    
    // Adjust grid size for mobile
    const isMobile = window.innerWidth <= 768;
    const cellSize = isMobile ? 'min(18vw, 60px)' : '60px';
    
    gameBoard.style.gridTemplateColumns = `repeat(${GRID_SIZE}, ${cellSize})`;
    gameBoard.style.gridTemplateRows = `repeat(${GRID_SIZE}, ${cellSize})`;
    gameBoard.style.gap = isMobile ? '4px' : '6px';
    
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        const cell = document.createElement('button');
        cell.classList.add('cell');
        cell.dataset.index = i;
        cell.setAttribute('aria-label', `Cell ${Math.floor(i/GRID_SIZE) + 1},${(i%GRID_SIZE) + 1}`);
        
        // Add cell content with animation
        if (gameState[i] !== CONFIG.EMPTY) {
            const symbol = document.createElement('span');
            symbol.textContent = gameState[i];
            symbol.classList.add('symbol');
            cell.appendChild(symbol);
            cell.classList.add(gameState[i].toLowerCase());
            cell.setAttribute('aria-label', `${gameState[i]} at position ${Math.floor(i/GRID_SIZE) + 1},${(i%GRID_SIZE) + 1}`);
        } else {
            cell.innerHTML = '<span class="sr-only">Empty cell</span>';
        }
        
        // Add visual feedback on hover/focus for empty cells
        if (gameState[i] === CONFIG.EMPTY && CONFIG.GAME_ACTIVE) {
            cell.classList.add('clickable');
        }
        
        gameBoard.appendChild(cell);
    }
}

// Update game status message
function updateStatus(message, isGameOver = false) {
    // Update the status display with animation
    statusDisplay.textContent = '';
    // Add typing effect for better UX
    let i = 0;
    const speed = 30; // milliseconds per character
    
    const typeWriter = () => {
        if (i < message.length) {
            statusDisplay.textContent += message.charAt(i);
            i++;
            setTimeout(typeWriter, speed);
        }
    };
    
    typeWriter();
    
    // Update game state and UI
    if (isGameOver) {
        CONFIG.GAME_ACTIVE = false;
        document.body.classList.add('game-over');
        
        // Announce game over to screen readers
        const announcement = document.getElementById('announcement') || document.createElement('div');
        announcement.id = 'announcement';
        announcement.setAttribute('role', 'alert');
        announcement.setAttribute('aria-live', 'assertive');
        announcement.textContent = message;
        
        if (!document.getElementById('announcement')) {
            announcement.style.position = 'absolute';
            announcement.style.left = '-9999px';
            document.body.appendChild(announcement);
        }
    } else {
        document.body.classList.remove('game-over');
    }
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
