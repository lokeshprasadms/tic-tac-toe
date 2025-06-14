document.addEventListener('DOMContentLoaded', () => {
    // Game settings
    const BOARD_SIZE = 5;
    const WIN_LENGTH = 4; // Need 4 in a row to win
    
    // Game state
    let board = [];
    let gameOver = false;
    let playerSymbol = '';
    let aiSymbol = '';
    let difficulty = 'hard';
    let winningCells = [];
    
    // Score tracking
    let playerScore = 0;
    let aiScore = 0;
    
    // DOM Elements
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const boardElement = document.getElementById('board');
    const statusElement = document.getElementById('status');
    const playerScoreElement = document.getElementById('player-score');
    const aiScoreElement = document.getElementById('ai-score');
    const restartButton = document.getElementById('restart');
    const startButton = document.getElementById('start-game');
    const difficultySelect = document.getElementById('difficulty');
    const symbolButtons = document.querySelectorAll('.symbol-btn');
    
    // Initialize the game
    function initGame() {
        // Initialize board
        board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(''));
        gameOver = false;
        winningCells = [];
        
        // Clear the board
        boardElement.innerHTML = '';
        
        // Create board cells
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = i;
                cell.dataset.col = j;
                cell.addEventListener('click', handleCellClick);
                boardElement.appendChild(cell);
            }
        }
        
        // Set initial status
        updateStatus(`Your turn (${playerSymbol})`);
    }
    
    // Handle cell click
    function handleCellClick(e) {
        if (gameOver) return;
        
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        
        // Check if cell is empty
        if (board[row][col] !== '') return;
        
        // Make player's move
        makeMove(row, col, playerSymbol);
        
        // Check for win or tie
        if (checkWin(playerSymbol)) {
            finishGame('Player');
            return;
        }
        
        if (isBoardFull()) {
            finishGame('Tie');
            return;
        }
        
        // AI's turn
        updateStatus("AI is thinking...");
        setTimeout(makeAIMove, 500);
    }
    
    // Make a move on the board
    function makeMove(row, col, symbol) {
        board[row][col] = symbol;
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.textContent = symbol;
        cell.classList.add(symbol.toLowerCase());
    }
    
    // AI makes a move
    function makeAIMove() {
        if (gameOver) return;
        
        // Small delay for better UX
        setTimeout(() => {
            let move;
            
            switch (difficulty) {
                case 'easy':
                    move = getRandomMove();
                    break;
                case 'medium':
                    move = getMediumMove();
                    break;
                case 'hard':
                default:
                    move = getBestMove();
            }
            
            if (move) {
                const { row, col } = move;
                makeMove(row, col, aiSymbol);
                
                if (checkWin(aiSymbol)) {
                    finishGame('AI');
                    return;
                }
                
                if (isBoardFull()) {
                    finishGame('Tie');
                    return;
                }
                
                updateStatus(`Your turn (${playerSymbol})`);
            }
        }, 300); // Slight delay for better UX
    }
    
    // Check for a win
    function checkWin(symbol) {
        // Reset winning cells
        winningCells = [];
        
        // Check rows and columns
        for (let i = 0; i < BOARD_SIZE; i++) {
            // Check rows
            for (let j = 0; j <= BOARD_SIZE - WIN_LENGTH; j++) {
                let win = true;
                const cells = [];
                for (let k = 0; k < WIN_LENGTH; k++) {
                    if (board[i][j + k] !== symbol) {
                        win = false;
                        break;
                    }
                    cells.push({ row: i, col: j + k });
                }
                if (win) {
                    winningCells = cells;
                    return true;
                }
            }
            
            // Check columns
            for (let j = 0; j <= BOARD_SIZE - WIN_LENGTH; j++) {
                let win = true;
                const cells = [];
                for (let k = 0; k < WIN_LENGTH; k++) {
                    if (board[j + k][i] !== symbol) {
                        win = false;
                        break;
                    }
                    cells.push({ row: j + k, col: i });
                }
                if (win) {
                    winningCells = cells;
                    return true;
                }
            }
        }
        
        // Check diagonals (top-left to bottom-right)
        for (let i = 0; i <= BOARD_SIZE - WIN_LENGTH; i++) {
            for (let j = 0; j <= BOARD_SIZE - WIN_LENGTH; j++) {
                let win = true;
                const cells = [];
                for (let k = 0; k < WIN_LENGTH; k++) {
                    if (board[i + k][j + k] !== symbol) {
                        win = false;
                        break;
                    }
                    cells.push({ row: i + k, col: j + k });
                }
                if (win) {
                    winningCells = cells;
                    return true;
                }
            }
        }
        
        // Check diagonals (top-right to bottom-left)
        for (let i = 0; i <= BOARD_SIZE - WIN_LENGTH; i++) {
            for (let j = WIN_LENGTH - 1; j < BOARD_SIZE; j++) {
                let win = true;
                const cells = [];
                for (let k = 0; k < WIN_LENGTH; k++) {
                    if (board[i + k][j - k] !== symbol) {
                        win = false;
                        break;
                    }
                    cells.push({ row: i + k, col: j - k });
                }
                if (win) {
                    winningCells = cells;
                    return true;
                }
            }
        }
        
        return false;
    }
    
    // Check if the board is full
    function isBoardFull() {
        return board.every(row => row.every(cell => cell !== ''));
    }
    
    // Get a random valid move
    function getRandomMove() {
        const emptyCells = [];
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                if (board[i][j] === '') {
                    emptyCells.push({ row: i, col: j });
                }
            }
        }
        return emptyCells.length > 0 ? emptyCells[Math.floor(Math.random() * emptyCells.length)] : null;
    }
    
    // Get a medium difficulty move (blocks wins and takes wins)
    function getMediumMove() {
        // Check for immediate win
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                if (board[i][j] === '') {
                    board[i][j] = aiSymbol;
                    const win = checkWin(aiSymbol);
                    board[i][j] = '';
                    if (win) return { row: i, col: j };
                }
            }
        }
        
        // Block player's win
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                if (board[i][j] === '') {
                    board[i][j] = playerSymbol;
                    const blocksWin = checkWin(playerSymbol);
                    board[i][j] = '';
                    if (blocksWin) return { row: i, col: j };
                }
            }
        }
        
        // Take center or corners first
        const center = Math.floor(BOARD_SIZE / 2);
        if (board[center][center] === '') {
            return { row: center, col: center };
        }
        
        // Then check corners
        const corners = [
            {row: 0, col: 0},
            {row: 0, col: BOARD_SIZE - 1},
            {row: BOARD_SIZE - 1, col: 0},
            {row: BOARD_SIZE - 1, col: BOARD_SIZE - 1}
        ];
        
        const availableCorners = corners.filter(pos => board[pos.row][pos.col] === '');
        if (availableCorners.length > 0) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }
        
        // Then random move
        return getRandomMove();
    }
    
    // Get the best move using minimax algorithm
    function getBestMove() {
        let bestScore = -Infinity;
        let bestMove = null;
        
        // Try to find a winning move first
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                if (board[i][j] === '') {
                    board[i][j] = aiSymbol;
                    if (checkWin(aiSymbol)) {
                        board[i][j] = '';
                        return { row: i, col: j };
                    }
                    board[i][j] = '';
                }
            }
        }
        
        // Block opponent's winning move
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                if (board[i][j] === '') {
                    board[i][j] = playerSymbol;
                    if (checkWin(playerSymbol)) {
                        board[i][j] = '';
                        return { row: i, col: j };
                    }
                    board[i][j] = '';
                }
            }
        }
        
        // Use minimax for other moves
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                if (board[i][j] === '') {
                    board[i][j] = aiSymbol;
                    let score = minimax(board, 0, false);
                    board[i][j] = '';
                    
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = { row: i, col: j };
                    }
                }
            }
        }
        
        return bestMove || getRandomMove();
    }
    
    // Helper function to check for win on a specific board
    function checkWinOnBoard(board, symbol) {
        // Check rows and columns
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j <= BOARD_SIZE - WIN_LENGTH; j++) {
                // Check rows
                let rowWin = true;
                for (let k = 0; k < WIN_LENGTH; k++) {
                    if (board[i][j + k] !== symbol) {
                        rowWin = false;
                        break;
                    }
                }
                if (rowWin) return true;
                
                // Check columns
                let colWin = true;
                for (let k = 0; k < WIN_LENGTH; k++) {
                    if (board[j + k][i] !== symbol) {
                        colWin = false;
                        break;
                    }
                }
                if (colWin) return true;
            }
        }
        
        // Check diagonals
        for (let i = 0; i <= BOARD_SIZE - WIN_LENGTH; i++) {
            for (let j = 0; j <= BOARD_SIZE - WIN_LENGTH; j++) {
                // Top-left to bottom-right
                let diag1 = true;
                for (let k = 0; k < WIN_LENGTH; k++) {
                    if (board[i + k][j + k] !== symbol) {
                        diag1 = false;
                        break;
                    }
                }
                if (diag1) return true;
                
                // Top-right to bottom-left
                let diag2 = true;
                for (let k = 0; k < WIN_LENGTH; k++) {
                    if (board[i + k][j + WIN_LENGTH - 1 - k] !== symbol) {
                        diag2 = false;
                        break;
                    }
                }
                if (diag2) return true;
            }
        }
        
        return false;
    }
    
    // Minimax algorithm with alpha-beta pruning
    function minimax(board, depth, isMaximizing, alpha = -Infinity, beta = Infinity) {
        // Check terminal states
        if (checkWinOnBoard(board, aiSymbol)) return 10 - depth;
        if (checkWinOnBoard(board, playerSymbol)) return depth - 10;
        if (isBoardFull() || depth >= 3) return 0; // Limit depth for performance
        
        if (isMaximizing) {
            let maxEval = -Infinity;
            for (let i = 0; i < BOARD_SIZE; i++) {
                for (let j = 0; j < BOARD_SIZE; j++) {
                    if (board[i][j] === '') {
                        board[i][j] = aiSymbol;
                        const evalScore = minimax(board, depth + 1, false, alpha, beta);
                        board[i][j] = '';
                        maxEval = Math.max(maxEval, evalScore);
                        alpha = Math.max(alpha, evalScore);
                        if (beta <= alpha) break;
                    }
                }
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (let i = 0; i < BOARD_SIZE; i++) {
                for (let j = 0; j < BOARD_SIZE; j++) {
                    if (board[i][j] === '') {
                        board[i][j] = playerSymbol;
                        const evalScore = minimax(board, depth + 1, true, alpha, beta);
                        board[i][j] = '';
                        minEval = Math.min(minEval, evalScore);
                        beta = Math.min(beta, evalScore);
                        if (beta <= alpha) break;
                    }
                }
            }
            return minEval;
        }
    }
    
    // Finish the game
    function finishGame(winner) {
        gameOver = true;
        
        // Highlight winning cells
        if (winner !== 'Tie' && winningCells.length > 0) {
            winningCells.forEach(({ row, col }) => {
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                cell.classList.add('win');
            });
        }
        
        // Update scores and status
        if (winner === 'Player') {
            playerScore++;
            updateStatus('You win!');
        } else if (winner === 'AI') {
            aiScore++;
            updateStatus('AI wins!');
        } else {
            updateStatus("It's a tie!");
        }
        
        updateScores();
        restartButton.classList.remove('hidden');
    }
    
    // Update status text
    function updateStatus(text) {
        statusElement.textContent = text;
    }
    
    // Update score display
    function updateScores() {
        playerScoreElement.textContent = `Player: ${playerScore}`;
        aiScoreElement.textContent = `AI: ${aiScore}`;
    }
    
    // Start a new game
    function startNewGame() {
        playerScore = 0;
        aiScore = 0;
        updateScores();
        startScreen.classList.remove('hidden');
        gameScreen.classList.add('hidden');
    }
    
    // Event Listeners
    
    // Symbol selection
    symbolButtons.forEach(button => {
        button.addEventListener('click', () => {
            symbolButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            playerSymbol = button.dataset.symbol;
        });
    });
    
    // Start game button
    startButton.addEventListener('click', () => {
        if (!playerSymbol) {
            updateStatus('Please select a symbol (X or O)');
            return;
        }
        
        aiSymbol = playerSymbol === 'X' ? 'O' : 'X';
        difficulty = difficultySelect.value;
        
        startScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        
        initGame();
        
        // If AI goes first
        if (aiSymbol === 'X') {
            updateStatus("AI is thinking...");
            setTimeout(makeAIMove, 500);
        }
    });
    
    // Restart button
    restartButton.addEventListener('click', () => {
        startNewGame();
    });
    
    // Initialize with X selected by default
    if (symbolButtons.length > 0) {
        symbolButtons[0].click();
    }
});

