// --- DOM Elements ---
const gameSetup = document.getElementById('game-setup');
const gameArea = document.getElementById('game-area');
const difficultySelect = document.getElementById('difficulty');
const playerChoiceSelect = document.getElementById('player-choice');
const startGameBtn = document.getElementById('start-game-btn');
const gameBoard = document.getElementById('game-board');
const currentTurnDisplay = document.getElementById('current-turn');
const gameMessage = document.getElementById('game-message');
const restartGameBtn = document.getElementById('restart-game-btn');

// --- Game State Variables ---
let board = [];
const BOARD_SIZE = 5;
const WIN_CONDITION = 4; // 4 in a row for a 5x5 grid
let currentPlayer = 'X';
let humanPlayer = 'X'; // 'X' or 'O'
let aiPlayer = 'O'; // 'X' or 'O'
let gameActive = false;
let difficulty = 'easy'; // easy, medium, hard

// --- Event Listeners ---
startGameBtn.addEventListener('click', startGame);
restartGameBtn.addEventListener('click', resetGame);

// --- Functions ---

/**
 * Initializes the game board visually and logically.
 */
function initializeBoard() {
    gameBoard.innerHTML = ''; // Clear existing cells
    board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(''));

    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.addEventListener('click', handleCellClick);
            gameBoard.appendChild(cell);
        }
    }
}

/**
 * Starts the game based on user selections.
 */
function startGame() {
    difficulty = difficultySelect.value;
    humanPlayer = playerChoiceSelect.value;
    aiPlayer = (humanPlayer === 'X') ? 'O' : 'X';
    currentPlayer = 'X'; // X always starts

    initializeBoard();
    gameMessage.textContent = ''; // Clear any previous messages
    updateTurnDisplay();

    gameSetup.classList.add('hidden');
    gameArea.classList.remove('hidden');
    gameActive = true;

    if (currentPlayer === aiPlayer) {
        setTimeout(makeAIMove, 500); // AI makes the first move if it's 'X'
    }
}

/**
 * Resets the game to its initial setup state.
 */
function resetGame() {
    gameActive = false;
    gameSetup.classList.remove('hidden');
    gameArea.classList.add('hidden');
    gameMessage.textContent = '';
    // No need to re-initialize board here, startGame will do it
}

/**
 * Handles a click on a game board cell.
 * @param {Event} event - The click event object.
 */
function handleCellClick(event) {
    if (!gameActive) return;

    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);

    // If cell is already taken or it's AI's turn, do nothing
    if (board[row][col] !== '' || currentPlayer === aiPlayer) {
        return;
    }

    makeMove(row, col, humanPlayer);
}

/**
 * Makes a move on the board and updates the game state.
 * @param {number} row - The row index.
 * @param {number} col - The column index.
 * @param {string} player - The player making the move ('X' or 'O').
 */
function makeMove(row, col, player) {
    if (board[row][col] === '') {
        board[row][col] = player;
        const cell = gameBoard.children[row * BOARD_SIZE + col];
        cell.textContent = player;
        cell.classList.add(player); // Add class for styling (e.g., color)

        if (checkWin(player)) {
            endGame(player);
        } else if (checkDraw()) {
            endGame('draw');
        } else {
            currentPlayer = (currentPlayer === 'X') ? 'O' : 'X';
            updateTurnDisplay();
            if (gameActive && currentPlayer === aiPlayer) {
                setTimeout(makeAIMove, 700); // AI's turn after a slight delay
            }
        }
    }
}

/**
 * Updates the display to show the current player's turn.
 */
function updateTurnDisplay() {
    currentTurnDisplay.textContent = currentPlayer;
    currentTurnDisplay.style.color = (currentPlayer === 'X') ? '#007bff' : '#4CAF50';
}

/**
 * Checks if the given player has won.
 * @param {string} player - The player to check ('X' or 'O').
 * @returns {boolean} - True if the player has won, false otherwise.
 */
function checkWin(player) {
    // Check rows, columns, and diagonals
    const directions = [
        [0, 1],   // Horizontal
        [1, 0],   // Vertical
        [1, 1],   // Diagonal (top-left to bottom-right)
        [1, -1]   // Diagonal (top-right to bottom-left)
    ];

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === player) {
                for (const [dr, dc] of directions) {
                    let count = 1;
                    for (let i = 1; i < WIN_CONDITION; i++) {
                        const nr = r + dr * i;
                        const nc = c + dc * i;

                        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) {
                            count++;
                        } else {
                            break; // Sequence broken
                        }
                    }
                    if (count >= WIN_CONDITION) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

/**
 * Checks if the game is a draw.
 * @returns {boolean} - True if the board is full and no one has won, false otherwise.
 */
function checkDraw() {
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === '') {
                return false; // Found an empty cell, not a draw yet
            }
        }
    }
    return true; // Board is full, and no win was detected
}

/**
 * Ends the game, displaying the result.
 * @param {string} result - The result of the game ('X', 'O', or 'draw').
 */
function endGame(result) {
    gameActive = false;
    if (result === 'draw') {
        gameMessage.textContent = "It's a Draw!";
        gameMessage.style.color = '#FFA500'; // Orange for draw
    } else if (result === humanPlayer) {
        gameMessage.textContent = "You Win!";
        gameMessage.style.color = '#28a745'; // Green for win
    } else {
        gameMessage.textContent = "AI Wins!";
        gameMessage.style.color = '#dc3545'; // Red for loss
    }
}

// --- AI Logic (Simplified for a 5x5 grid) ---

/**
 * Determines and executes the AI's move based on the selected difficulty.
 */
function makeAIMove() {
    if (!gameActive) return;

    let bestMove = null;

    if (difficulty === 'easy') {
        bestMove = getRandomEmptyCell();
    } else if (difficulty === 'medium') {
        bestMove = getMediumAIMove();
    } else if (difficulty === 'hard') {
        // For 5x5, a full Minimax is too slow.
        // Hard AI will prioritize winning, blocking, then medium strategy.
        bestMove = getHardAIMove();
    }

    if (bestMove) {
        makeMove(bestMove.row, bestMove.col, aiPlayer);
    } else {
        // Fallback for unexpected scenarios (shouldn't happen if checkDraw works)
        console.warn("AI couldn't find a move. Game might be a draw or error.");
    }
}

/**
 * Finds a random empty cell for Easy difficulty.
 * @returns {object|null} - An object with row and col, or null if no empty cells.
 */
function getRandomEmptyCell() {
    const emptyCells = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === '') {
                emptyCells.push({ row: r, col: c });
            }
        }
    }
    if (emptyCells.length > 0) {
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        return emptyCells[randomIndex];
    }
    return null;
}

/**
 * Medium AI strategy:
 * 1. Check for an immediate win.
 * 2. Block the opponent's immediate win.
 * 3. Take center cell (if 5x5 has a clear center).
 * 4. Take corner cells.
 * 5. Take any random empty cell.
 * @returns {object|null} - An object with row and col, or null.
 */
function getMediumAIMove() {
    // 1. Check for AI's winning move
    let move = findWinningMove(aiPlayer);
    if (move) return move;

    // 2. Block human's winning move
    move = findWinningMove(humanPlayer);
    if (move) return move;

    // 3. Take center cell (approximate for 5x5)
    const centerRow = Math.floor(BOARD_SIZE / 2);
    const centerCol = Math.floor(BOARD_SIZE / 2);
    if (board[centerRow][centerCol] === '') {
        return { row: centerRow, col: centerCol };
    }

    // 4. Take corners (approximate for 5x5)
    const corners = [
        { row: 0, col: 0 }, { row: 0, col: BOARD_SIZE - 1 },
        { row: BOARD_SIZE - 1, col: 0 }, { row: BOARD_SIZE - 1, col: BOARD_SIZE - 1 }
    ];
    for (const corner of corners) {
        if (board[corner.row][corner.col] === '') {
            return corner;
        }
    }

    // 5. Take any available random empty cell
    return getRandomEmptyCell();
}

/**
 * Hard AI strategy:
 * 1. Check for AI's immediate win.
 * 2. Block human's immediate win.
 * 3. Implement a simplified Minimax-like strategy for 1-2 moves ahead, or prioritize lines.
 * For a 5x5, full Minimax is too slow. This version will focus on:
 * - Winning in the current turn.
 * - Blocking opponent's win in the current turn.
 * - Creating lines of 3 or 2.
 * - Blocking opponent's lines of 3 or 2.
 * - Otherwise, resort to medium strategy.
 * @returns {object|null} - An object with row and col, or null.
 */
function getHardAIMove() {
    // 1. Check for AI's winning move
    let move = findWinningMove(aiPlayer);
    if (move) return move;

    // 2. Block human's winning move
    move = findWinningMove(humanPlayer);
    if (move) return move;

    // 3. Try to create a line of 3 for AI (prioritize offensive)
    move = findLineCreationMove(aiPlayer, WIN_CONDITION - 2); // Find 2 in a row that can become 3
    if (move) return move;

    // 4. Try to block a line of 3 for human (prioritize defensive)
    move = findLineCreationMove(humanPlayer, WIN_CONDITION - 2); // Find 2 in a row for opponent that can become 3
    if (move) return move;

    // 5. Try to create a line of 2 for AI (prioritize offensive)
    move = findLineCreationMove(aiPlayer, WIN_CONDITION - 3); // Find 1 in a row that can become 2
    if (move) return move;

    // 6. Try to block a line of 2 for human (prioritize defensive)
    move = findLineCreationMove(humanPlayer, WIN_CONDITION - 3); // Find 1 in a row for opponent that can become 2
    if (move) return move;

    // If no immediate threats or opportunities, fall back to medium strategy
    return getMediumAIMove();
}

/**
 * Finds a move that would lead to a win for the given player.
 * @param {string} player - The player ('X' or 'O') to check for a winning move.
 * @returns {object|null} - An object with row and col if a winning move is found, otherwise null.
 */
function findWinningMove(player) {
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === '') { // Only consider empty cells
                board[r][c] = player; // Temporarily make the move
                if (checkWin(player)) {
                    board[r][c] = ''; // Undo the move
                    return { row: r, col: c };
                }
                board[r][c] = ''; // Undo the move
            }
        }
    }
    return null;
}

/**
 * Finds a move that creates or blocks a line of a certain length for a given player.
 * @param {string} player - The player ('X' or 'O') to check for.
 * @param {number} requiredLength - The number of consecutive marks needed to extend.
 * @returns {object|null} - An object with row and col if such a move is found, otherwise null.
 */
function findLineCreationMove(player, requiredLength) {
    const directions = [
        [0, 1],   // Horizontal
        [1, 0],   // Vertical
        [1, 1],   // Diagonal (top-left to bottom-right)
        [1, -1]   // Diagonal (top-right to bottom-left)
    ];

    // Iterate through all empty cells
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === '') {
                // Temporarily place the player's mark
                board[r][c] = player;

                // Check if this move creates a line of 'requiredLength + 1'
                // Or if it contributes to a potential line that the AI can extend
                // This is a simplified check, not a full minimax evaluation
                for (const [dr, dc] of directions) {
                    // Check around the current cell for existing player marks
                    // and if placing here would extend a line or create a new one.

                    // Check forward
                    let count = 1; // Current cell counts as 1
                    for (let i = 1; i <= requiredLength; i++) {
                        const nr = r + dr * i;
                        const nc = c + dc * i;
                        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) {
                            count++;
                        } else if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === '') {
                            // Can extend further if this spot is empty
                            // Don't break immediately, might be an empty spot then player mark
                        } else {
                            break;
                        }
                    }
                    if (count >= requiredLength + 1) { // We made a move and got requiredLength + 1 marks
                         board[r][c] = ''; // Undo the temporary move
                         return { row: r, col: c };
                    }

                    // Check backward
                    count = 1;
                    for (let i = 1; i <= requiredLength; i++) {
                        const nr = r - dr * i;
                        const nc = c - dc * i;
                        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) {
                            count++;
                        } else if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === '') {
                            // Can extend further
                        } else {
                            break;
                        }
                    }
                     if (count >= requiredLength + 1) {
                         board[r][c] = '';
                         return { row: r, col: c };
                    }
                }
                board[r][c] = ''; // Undo the temporary move
            }
        }
    }
    return null;
}

// Initial board setup on page load
initializeBoard();