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
let winningLine = []; // Stores the coordinates of the winning cells for highlighting

// --- Event Listeners ---
startGameBtn.addEventListener('click', startGame);
restartGameBtn.addEventListener('click', resetGame);

// --- Functions ---

/**
 * Initializes the game board visually and logically.
 * Clears any previous game state and prepares for a new game.
 */
function initializeBoard() {
    gameBoard.innerHTML = ''; // Clear existing cells from the DOM
    board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill('')); // Reset logical board
    winningLine = []; // Clear winning line from previous game
    clearWinningHighlight(); // Ensure no highlights from previous game cells

    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = i; // Store row index
            cell.dataset.col = j; // Store column index
            cell.addEventListener('click', handleCellClick);
            gameBoard.appendChild(cell);
        }
    }
}

/**
 * Starts the game based on user selections from the setup screen.
 */
function startGame() {
    difficulty = difficultySelect.value;
    humanPlayer = playerChoiceSelect.value;
    aiPlayer = (humanPlayer === 'X') ? 'O' : 'X';
    currentPlayer = 'X'; // 'X' always starts the game

    initializeBoard(); // Setup the new board
    gameMessage.textContent = ''; // Clear any previous game messages
    updateTurnDisplay(); // Display whose turn it is

    gameSetup.classList.add('hidden'); // Hide the setup screen
    gameArea.classList.remove('hidden'); // Show the game board
    gameActive = true; // Set game state to active

    // If AI is the first player, make its move
    if (currentPlayer === aiPlayer) {
        setTimeout(makeAIMove, 500); // Small delay for better UX
    }
}

/**
 * Resets the game to its initial setup state, allowing new game options.
 */
function resetGame() {
    gameActive = false; // Stop current game
    gameSetup.classList.remove('hidden'); // Show setup screen
    gameArea.classList.add('hidden'); // Hide game board
    gameMessage.textContent = ''; // Clear game message
    winningLine = []; // Clear winning line
    clearWinningHighlight(); // Remove any highlights
    // initializeBoard will be called by startGame when a new game starts
}

/**
 * Handles a click event on a game board cell.
 * @param {Event} event - The click event object.
 */
function handleCellClick(event) {
    if (!gameActive) return; // Do nothing if game is not active

    const row = parseInt(event.target.dataset.row); // Get row from data attribute
    const col = parseInt(event.target.dataset.col); // Get column from data attribute

    // If cell is already taken or it's AI's turn, do nothing
    if (board[row][col] !== '' || currentPlayer === aiPlayer) {
        return;
    }

    makeMove(row, col, humanPlayer); // Execute the human player's move
}

/**
 * Executes a move on the game board for a given player.
 * Updates the board state, checks for win/draw, and switches turns.
 * @param {number} row - The row index of the move.
 * @param {number} col - The column index of the move.
 * @param {string} player - The player making the move ('X' or 'O').
 */
function makeMove(row, col, player) {
    if (board[row][col] === '') { // Ensure the cell is empty
        board[row][col] = player; // Update logical board
        const cell = gameBoard.children[row * BOARD_SIZE + col]; // Get visual cell element
        cell.textContent = player; // Display player's mark
        cell.classList.add(player); // Add class for styling (e.g., color)

        const winResult = checkWin(player); // Check if this move resulted in a win
        if (winResult) {
            winningLine = winResult; // Store the winning line coordinates
            endGame(player); // End game with player as winner
        } else if (checkDraw()) {
            endGame('draw'); // End game as a draw
        } else {
            currentPlayer = (currentPlayer === 'X') ? 'O' : 'X'; // Switch turn
            updateTurnDisplay(); // Update turn display
            // If it's AI's turn and game is still active, make AI move
            if (gameActive && currentPlayer === aiPlayer) {
                setTimeout(makeAIMove, 700); // AI's turn after a slight delay for better UX
            }
        }
    }
}

/**
 * Updates the display element to show the current player's turn.
 */
function updateTurnDisplay() {
    currentTurnDisplay.textContent = currentPlayer;
    currentTurnDisplay.style.color = (currentPlayer === 'X') ? '#007bff' : '#4CAF50';
}

/**
 * Checks if the given player has achieved the winning condition (4 in a row, column, or diagonal).
 * @param {string} player - The player ('X' or 'O') to check for a win.
 * @returns {Array<object>|null} - An array of winning cell coordinates ({row, col}) if a win is found, null otherwise.
 */
function checkWin(player) {
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
                    const currentLine = [{ row: r, col: c }]; // Start line with current cell

                    for (let i = 1; i < WIN_CONDITION; i++) {
                        const nr = r + dr * i; // Next row
                        const nc = c + dc * i; // Next column

                        // Check bounds and if the next cell belongs to the player
                        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) {
                            count++;
                            currentLine.push({ row: nr, col: nc }); // Add to current line
                        } else {
                            break; // Sequence broken
                        }
                    }
                    if (count >= WIN_CONDITION) {
                        return currentLine; // Return the exact winning line
                    }
                }
            }
        }
    }
    return null; // No win found
}

/**
 * Checks if the game board is full, indicating a potential draw.
 * @returns {boolean} - True if the board is full, false otherwise.
 */
function checkDraw() {
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === '') {
                return false; // Found an empty cell, not a draw yet
            }
        }
    }
    return true; // Board is full
}

/**
 * Ends the game, displaying the result message and highlighting winning cells if a win occurred.
 * @param {string} result - The result of the game ('X', 'O', or 'draw').
 */
function endGame(result) {
    gameActive = false; // Deactivate game to prevent further moves
    if (result === 'draw') {
        gameMessage.textContent = "It's a Draw!";
        gameMessage.style.color = '#FFA500'; // Orange for draw
    } else if (result === humanPlayer) {
        gameMessage.textContent = "You Win!";
        gameMessage.style.color = '#28a745'; // Green for win
        highlightWinningCells(); // Highlight the cells that formed the win
    } else { // AI Wins
        gameMessage.textContent = "AI Wins!";
        gameMessage.style.color = '#dc3545'; // Red for AI win
        highlightWinningCells(); // Highlight the cells that formed the AI win
    }
}

/**
 * Applies a visual highlight to the cells stored in `winningLine`.
 */
function highlightWinningCells() {
    winningLine.forEach(coord => {
        // Calculate the flat index for the cell element
        const cellIndex = coord.row * BOARD_SIZE + coord.col;
        const cell = gameBoard.children[cellIndex];
        if (cell) { // Ensure cell exists
            cell.classList.add('win'); // Add the 'win' class for CSS styling
        }
    });
}

/**
 * Removes the winning highlight from all cells on the board.
 */
function clearWinningHighlight() {
    // Select all elements that have both 'cell' and 'win' classes
    const cells = document.querySelectorAll('.cell.win');
    cells.forEach(cell => {
        cell.classList.remove('win'); // Remove the 'win' class
    });
}

// --- AI Logic ---

/**
 * Determines and executes the AI's move based on the selected difficulty level.
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
        // Fallback for unexpected scenarios (should ideally not happen if checkDraw works)
        console.warn("AI couldn't find a move. Game might be a draw or an error occurred.");
    }
}

/**
 * Finds a random empty cell for the 'Easy' AI difficulty.
 * @returns {object|null} - An object with row and col if an empty cell is found, null otherwise.
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
 * Implements the 'Medium' AI strategy:
 * 1. Win if possible.
 * 2. Block opponent's win.
 * 3. Take center cell.
 * 4. Take corner cells.
 * 5. Take random empty cell.
 * @returns {object|null} - The chosen move's coordinates or null.
 */
function getMediumAIMove() {
    // 1. Check for AI's immediate winning move
    let move = findWinningMove(aiPlayer);
    if (move) return move;

    // 2. Block human's immediate winning move
    move = findWinningMove(humanPlayer);
    if (move) return move;

    // 3. Take center cell (approximate for 5x5 - middle cell)
    const centerRow = Math.floor(BOARD_SIZE / 2);
    const centerCol = Math.floor(BOARD_SIZE / 2);
    if (board[centerRow][centerCol] === '') {
        return { row: centerRow, col: centerCol };
    }

    // 4. Take corner cells
    const corners = [
        { row: 0, col: 0 }, { row: 0, col: BOARD_SIZE - 1 },
        { row: BOARD_SIZE - 1, col: 0 }, { row: BOARD_SIZE - 1, col: BOARD_SIZE - 1 }
    ];
    for (const corner of corners) {
        if (board[corner.row][corner.col] === '') {
            return corner;
        }
    }

    // 5. Fallback: Take any available random empty cell
    return getRandomEmptyCell();
}

/**
 * Implements the 'Hard' AI strategy (heuristic-based for performance on 5x5):
 * 1. Win if possible.
 * 2. Block opponent's win.
 * 3. Create lines of 3 for AI.
 * 4. Block opponent's lines of 3.
 * 5. Create lines of 2 for AI.
 * 6. Block opponent's lines of 2.
 * 7. Fallback to medium strategy.
 * @returns {object|null} - The chosen move's coordinates or null.
 */
function getHardAIMove() {
    // 1. Check for AI's immediate winning move
    let move = findWinningMove(aiPlayer);
    if (move) return move;

    // 2. Block human's immediate winning move
    move = findWinningMove(humanPlayer);
    if (move) return move;

    // 3. Try to create a line of 3 for AI (targetLength 3)
    move = findLineCreationMove(aiPlayer, 3);
    if (move) return move;

    // 4. Try to block a line of 3 for human (targetLength 3)
    move = findLineCreationMove(humanPlayer, 3);
    if (move) return move;

    // 5. Try to create a line of 2 for AI (targetLength 2)
    move = findLineCreationMove(aiPlayer, 2);
    if (move) return move;

    // 6. Try to block a line of 2 for human (targetLength 2)
    move = findLineCreationMove(humanPlayer, 2);
    if (move) return move;

    // If no immediate threats or opportunities, fall back to medium strategy
    return getMediumAIMove();
}

/**
 * Finds a hypothetical move that would lead to a win for the given player.
 * Temporarily makes a move to check for a win, then undoes it.
 * @param {string} player - The player ('X' or 'O') to check for a winning move.
 * @returns {object|null} - An object with row and col if a winning move is found, otherwise null.
 */
function findWinningMove(player) {
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === '') { // Only consider empty cells
                board[r][c] = player; // Temporarily make the move
                if (checkWin(player)) { // Check if this temporary move leads to a win
                    board[r][c] = ''; // Undo the move
                    return { row: r, col: c }; // Return the winning move
                }
                board[r][c] = ''; // Undo the move
            }
        }
    }
    return null; // No winning move found
}

/**
 * Finds a move that contributes to creating or blocking a line of a certain `targetLength`.
 * This is a heuristic to help the 'Hard' AI build or defend lines.
 * @param {string} player - The player ('X' or 'O') to check for.
 * @param {number} targetLength - The desired length of the line (e.g., 3 means finding a cell to make a line of 3).
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
            if (board[r][c] === '') { // Only consider empty cells
                board[r][c] = player; // Temporarily place the player's mark

                for (const [dr, dc] of directions) {
                    let consecutiveCount = 0;
                    // Check in the forward direction from the current cell
                    for (let i = 0; i < WIN_CONDITION; i++) {
                        const nr = r + dr * i;
                        const nc = c + dc * i;
                        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) {
                            consecutiveCount++;
                        } else {
                            break; // Stop if boundary or different player
                        }
                    }

                    // Check in the backward direction from the current cell (excluding itself)
                    for (let i = 1; i < WIN_CONDITION; i++) {
                        const nr = r - dr * i;
                        const nc = c - dc * i;
                        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) {
                            consecutiveCount++;
                        } else {
                            break; // Stop if boundary or different player
                        }
                    }

                    // If placing here helps create a line of at least targetLength
                    // (e.g., if targetLength is 3, means 3 consecutive marks are formed or extended)
                    if (consecutiveCount >= targetLength) {
                        board[r][c] = ''; // Undo the temporary move
                        return { row: r, col: c }; // Return this promising move
                    }
                }
                board[r][c] = ''; // Undo the temporary move after checking all directions
            }
        }
    }
    return null; // No suitable move found
}

// Initial board setup on page load
initializeBoard();
