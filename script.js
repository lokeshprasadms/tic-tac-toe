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
let winningLine = []; // Stores the coordinates of the winning cells

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
    winningLine = []; // Clear winning line from previous game
    clearWinningHighlight(); // Ensure no highlights from previous game

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

    initializeBoard(); // This also clears previous highlights
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
    winningLine = []; // Clear winning line on reset
    clearWinningHighlight(); // Ensure highlights are removed
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

        const winResult = checkWin(player); // checkWin now returns winning line or null
        if (winResult) {
            winningLine = winResult; // Store the winning line
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
 * @returns {Array<object>|null} - An array of winning cell coordinates ({row, col}) if the player has won, null otherwise.
 */
function checkWin(player) {
    const directions = [
        [0, 1],   // Horizontal
        [1, 0],   // Vertical
        [1, 1],   // Diagonal (top-left to bottom-right)
        [1, -1]   // Diagonal (top-right to bottom-left)
    ];

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c; c < BOARD_SIZE; c++) {
            if (board[r][c] === player) {
                for (const [dr, dc] of directions) {
                    let count = 1;
                    const currentLine = [{ row: r, col: c }]; // Start with the current cell

                    for (let i = 1; i < WIN_CONDITION; i++) {
                        const nr = r + dr * i;
                        const nc = c + dc * i;

                        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) {
                            count++;
                            currentLine.push({ row: nr, col: nc });
                        } else {
                            break; // Sequence broken
                        }
                    }
                    if (count >= WIN_CONDITION) {
                        return currentLine; // Return the winning line
                    }
                }
            }
        }
    }
    return null; // No win found
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
    return true; // Board is full, and no win was detected by checkWin
}

/**
 * Ends the game, displaying the result and highlighting winning cells if applicable.
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
        highlightWinningCells();
    } else {
        gameMessage.textContent = "AI Wins!";
        gameMessage.style.color = '#dc3545'; // Red for loss
        highlightWinningCells();
    }
}

/**
 * Highlights the cells that form the winning line.
 */
function highlightWinningCells() {
    winningLine.forEach(coord => {
        const cell = gameBoard.children[coord.row * BOARD_SIZE + coord.col];
        cell.classList.add('win');
    });
}

/**
 * Removes the winning highlight from all cells.
 */
function clearWinningHighlight() {
    const cells = document.querySelectorAll('.cell.win');
    cells.forEach(cell => {
        cell.classList.remove('win');
    });
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
        const randomIndex = Math.random() * emptyCells.length; // No floor needed before returning, as it's an index for a random element
        return emptyCells[Math.floor(randomIndex)];
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
                if (checkWin(player)) { // checkWin now returns winning line or null
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
 * This is a simplified heuristic, not a full minimax evaluation.
 * @param {string} player - The player ('X' or 'O') to check for.
 * @param {number} targetLength - The desired length of the line (e.g., 2 to create a 3-in-a-row).
 * @returns {object|null} - An object with row and col if such a move is found, otherwise null.
 */
function findLineCreationMove(player, targetLength) {
    const directions = [
        [0, 1],   // Horizontal
        [1, 0],   // Vertical
        [1, 1],   // Diagonal (top-left to bottom-right)
        [1, -1]   // Diagonal (top-right to bottom-left)
    ];

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === '') {
                board[r][c] = player; // Temporarily make the move

                for (const [dr, dc] of directions) {
                    let consecutiveCount = 0;
                    // Check in one direction
                    for (let i = 0; i < WIN_CONDITION; i++) { // Check up to WIN_CONDITION cells
                        const nr = r + dr * i;
                        const nc = c + dc * i;
                        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) {
                            consecutiveCount++;
                        } else {
                            break;
                        }
                    }

                    // Also check in the opposite direction
                    for (let i = 1; i < WIN_CONDITION; i++) {
                        const nr = r - dr * i;
                        const nc = c - dc * i;
                        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) {
                            consecutiveCount++;
                        } else {
                            break;
                        }
                    }

                    if (consecutiveCount >= targetLength) {
                        board[r][c] = ''; // Undo the temporary move
                        return { row: r, col: c }; // Found a good spot
                    }
                }
                board[r][c] = ''; // Undo the temporary move
            }
        }
    }
    return null; // No move found to create target length line
}


// Initial board setup on page load
initializeBoard();
