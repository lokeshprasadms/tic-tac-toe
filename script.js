// ========= ELEMENTS & CONSTANTS =========
const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status-message');
const restartBtn = document.getElementById('restart-btn');
const diffSelect = document.getElementById('difficulty');

const PLAYER = 'X';
const AI = 'O';
const SIZE = 5;

// ========= GAME STATE =========
let board = [];
let gameOver = false;

// ========= INITIALIZATION =========
function initBoard() {
  board = Array(SIZE * SIZE).fill('');
  gameOver = false;
  renderBoard();
  statusEl.textContent = 'Your turn!';
}
restartBtn.addEventListener('click', initBoard);
diffSelect.addEventListener('change', initBoard);

// ========= RENDERING =========
function renderBoard() {
  boardEl.innerHTML = '';
  board.forEach((cell, idx) => {
    const div = document.createElement('div');
    div.className = 'cell';
    div.textContent = cell;
    div.onclick = () => playerMove(idx);
    boardEl.appendChild(div);
  });
}

// ========= PLAYER & AI MOVES =========
function playerMove(idx) {
  if (gameOver || board[idx]) return;
  board[idx] = PLAYER;
  updateAfterMove(PLAYER);
  if (!gameOver) setTimeout(aiMove, 100);
}

function aiMove() {
  const level = diffSelect.value;
  let idx = level === 'easy'
    ? randomMove()
    : bestMove(level === 'medium' ? 1 : 2);
  if (idx !== null) board[idx] = AI;
  updateAfterMove(AI);
}

// ========= MOVE HANDLER =========
function updateAfterMove(mark) {
  renderBoard();
  if (checkWin(mark)) {
    endGame(mark === PLAYER ? 'You win!' : 'AI wins!');
  } else if (board.every(cell => cell)) {
    endGame("It's a draw!");
  } else {
    statusEl.textContent = mark === PLAYER ? 'AI is thinking…' : 'Your turn!';
  }
}

// ========= END GAME =========
function endGame(msg) {
  gameOver = true;
  statusEl.textContent = msg;
}

// ========= WIN CHECK =========
function checkWin(player) {
  const lines = [];
  for (let i = 0; i < SIZE; i++) {
    lines.push([...Array(SIZE)].map((_, j) => i * SIZE + j)); // row
    lines.push([...Array(SIZE)].map((_, j) => j * SIZE + i)); // col
  }
  lines.push([...Array(SIZE)].map((_, i) => i * SIZE + i));             // diag
  lines.push([...Array(SIZE)].map((_, i) => i * SIZE + (SIZE-1-i)));   // anti-diag
  return lines.some(line => line.every(i => board[i] === player));
}

// ========= AI HELPERS =========
function randomMove() {
  const empties = board.map((c,i) => c === '' ? i : null).filter(v => v !== null);
  return empties.length ? empties[Math.floor(Math.random() * empties.length)] : null;
}

function bestMove(depth) {
  let bestScore = -Infinity, move = null;
  for (let i = 0; i < board.length; i++) {
    if (!board[i]) {
      board[i] = AI;
      let score = minimax(depth-1, false, -Infinity, Infinity);
      board[i] = '';
      if (score > bestScore) { bestScore = score; move = i; }
    }
  }
  return move;
}

function minimax(depth, isMax, alpha, beta) {
  if (checkWin(AI)) return 10;
  if (checkWin(PLAYER)) return -10;
  if (depth === 0 || board.every(c => c)) return 0;

  if (isMax) {
    let maxEval = -Infinity;
    for (let i = 0; i < board.length; i++) {
      if (!board[i]) {
        board[i] = AI;
        let eval = minimax(depth-1, false, alpha, beta);
        board[i] = '';
        maxEval = Math.max(maxEval, eval);
        alpha = Math.max(alpha, eval);
        if (beta <= alpha) break;
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (let i = 0; i < board.length; i++) {
      if (!board[i]) {
        board[i] = PLAYER;
        let eval = minimax(depth-1, true, alpha, beta);
        board[i] = '';
        minEval = Math.min(minEval, eval);
        beta = Math.min(beta, eval);
        if (beta <= alpha) break;
      }
    }
    return minEval;
  }
}

// ========= START THE GAME =========
initBoard();
