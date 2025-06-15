document.addEventListener('DOMContentLoaded', () => {
    // Game state
    const state = {
        board: Array(25).fill(''),
        currentPlayer: 'x',
        gameOver: false,
        scores: { player: 0, ai: 0 },
        difficulty: 'easy',
        gameType: 'normal',
        timeLeft: 30,
        timer: null
    };

    // DOM elements
    const optionsScreen = document.getElementById('options-screen');
    const gameScreen = document.getElementById('game-screen');
    const boardElement = document.getElementById('board');
    const playerScoreElement = document.getElementById('player-score');
    const aiScoreElement = document.getElementById('ai-score');
    const restartBtn = document.getElementById('restart-btn');
    const startBtn = document.getElementById('start-btn');
    const optionButtons = document.querySelectorAll('.option-btn');

    // Initialize the game
    function initGame() {
        createBoard();
        setupEventListeners();
    }

    // Create the game board
    function createBoard() {
        boardElement.innerHTML = '';
        for (let i = 0; i < 25; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.index = i;
            boardElement.appendChild(cell);
        }
    }

    // Set up event listeners
    function setupEventListeners() {
        // Option selection
        optionButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                optionButtons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                
                if (btn.dataset.difficulty) {
                    state.difficulty = btn.dataset.difficulty;
                } else if (btn.dataset.type) {
                    state.gameType = btn.dataset.type;
                }
            });
        });

        // Start game
        startBtn.addEventListener('click', startGame);
        
        // Restart game
        restartBtn.addEventListener('click', showOptions);
        
        // Cell click
        boardElement.addEventListener('click', handleCellClick);
    }


    // Start a new game
    function startGame() {
        // Reset game state
        state.board = Array(25).fill('');
        state.currentPlayer = 'x';
        state.gameOver = false;
        state.timeLeft = 30;
        
        // Update UI
        updateBoard();
        optionsScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        
        // Start timer if blitz mode
        if (state.gameType === 'blitz') {
            startTimer();
        }
        
        // AI makes first move if playing as 'o' and it's their turn
        if (state.currentPlayer === 'o') {
            setTimeout(makeAIMove, 500);
        }
    }

    // Show options screen
    function showOptions() {
        // Stop timer if running
        if (state.timer) {
            clearInterval(state.timer);
            state.timer = null;
        }
        
        optionsScreen.classList.remove('hidden');
        gameScreen.classList.add('hidden');
    }

    // Handle cell click
    function handleCellClick(e) {
        if (state.gameOver || state.currentPlayer === 'o') return;
        
        const cell = e.target.closest('.cell');
        if (!cell) return;
        
        const index = parseInt(cell.dataset.index);
        if (state.board[index] !== '') return;
        
        makeMove(index);
        
        if (!state.gameOver && state.currentPlayer === 'o') {
            setTimeout(makeAIMove, 500);
        }
    }

    // Make a move
    function makeMove(index) {
        if (state.gameOver || state.board[index] !== '') return false;
        
        state.board[index] = state.currentPlayer;
        updateBoard();
        
        if (checkWin(state.currentPlayer)) {
            endGame(state.currentPlayer);
            return true;
        }
        
        if (checkDraw()) {
            endGame('draw');
            return true;
        }
        
        state.currentPlayer = state.currentPlayer === 'x' ? 'o' : 'x';
        return true;
    }

    // AI makes a move
    function makeAIMove() {
        if (state.gameOver) return;
        
        let index;
        
        if (state.difficulty === 'hard') {
            // Try to win
            index = findWinningMove('o');
            
            // Block player from winning
            if (index === -1) {
                index = findWinningMove('x');
            }
            
            // Take center
            if (index === -1 && state.board[12] === '') {
                index = 12;
            }
            
            // Take a corner
            if (index === -1) {
                const corners = [0, 4, 20, 24];
                const availableCorners = corners.filter(i => state.board[i] === '');
                if (availableCorners.length > 0) {
                    index = availableCorners[Math.floor(Math.random() * availableCorners.length)];
                }
            }
        }
        
        // If no strategic move found or in easy mode, pick random
        if (index === -1 || state.difficulty === 'easy') {
            const availableMoves = state.board.map((cell, i) => cell === '' ? i : -1).filter(i => i !== -1);
            if (availableMoves.length === 0) return;
            index = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        }
        
        makeMove(index);
    }

    // Find a winning move for a player
    function findWinningMove(player) {
        for (let i = 0; i < 25; i++) {
            if (state.board[i] === '') {
                state.board[i] = player;
                const isWin = checkWin(player);
                state.board[i] = '';
                
                if (isWin) {
                    return i;
                }
            }
        }
        return -1;
    }

    // Check for a win
    function checkWin(player) {
        const b = state.board;
        
        // Check rows
        for (let i = 0; i < 25; i += 5) {
            for (let j = 0; j <= 1; j++) {
                if (b[i+j] === player && b[i+j+1] === player && 
                    b[i+j+2] === player && b[i+j+3] === player) {
                    if (j === 0 || (j === 1 && b[i] !== player)) {
                        return true;
                    }
                }
            }
        }
        
        // Check columns
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j <= 1; j++) {
                if (b[i+j*5] === player && b[i+(j+1)*5] === player && 
                    b[i+(j+2)*5] === player && b[i+(j+3)*5] === player) {
                    if (j === 0 || (j === 1 && b[i] !== player)) {
                        return true;
                    }
                }
            }
        }
        
        // Check diagonals (top-left to bottom-right)
        for (let i = 0; i <= 1; i++) {
            for (let j = 0; j <= 1; j++) {
                const idx = i * 5 + j;
                if (b[idx] === player && b[idx+6] === player && 
                    b[idx+12] === player && b[idx+18] === player) {
                    if ((i === 0 && j === 0) || (b[idx-6] !== player)) {
                        return true;
                    }
                }
            }
        }
        
        // Check diagonals (top-right to bottom-left)
        for (let i = 0; i <= 1; i++) {
            for (let j = 3; j <= 4; j++) {
                const idx = i * 5 + j;
                if (b[idx] === player && b[idx+4] === player && 
                    b[idx+8] === player && b[idx+12] === player) {
                    if ((i === 0 && j === 3) || (b[idx-4] !== player)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    // Check for a draw
    function checkDraw() {
        return !state.board.includes('');
    }

    // End the game
    function endGame(winner) {
        state.gameOver = true;
        
        if (winner === 'x') {
            state.scores.player++;
            playerScoreElement.textContent = state.scores.player;
        } else if (winner === 'o') {
            state.scores.ai++;
            aiScoreElement.textContent = state.scores.ai;
        }
        
        // Stop timer
        if (state.timer) {
            clearInterval(state.timer);
            state.timer = null;
        }
    }

    // Update the board UI
    function updateBoard() {
        state.board.forEach((cell, index) => {
            const cellElement = document.querySelector(`[data-index="${index}"]`);
            if (cellElement) {
                cellElement.textContent = cell;
                cellElement.className = 'cell' + (cell ? ` ${cell}` : '');
            }
        });
    }

    // Start the timer for blitz mode
    function startTimer() {
        state.timeLeft = 30;
        if (state.timer) clearInterval(state.timer);
        
        state.timer = setInterval(() => {
            state.timeLeft--;
            
            if (state.timeLeft <= 0) {
                clearInterval(state.timer);
                state.timer = null;
                endGame(state.currentPlayer === 'x' ? 'o' : 'x');
            }
        }, 1000);
    }

    // Initialize the game
    initGame();
});
