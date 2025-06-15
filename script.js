"use strict";

/*

A SIMPLE TIC-TAC-TOE GAME IN JAVASCRIPT

(1) Grid layout

The game grid is represented in the array Grid.cells as follows:

[0] [1] [2]
[3] [4] [5]
[6] [7] [8]

The cells (array elements) hold the following numeric values:
0 if not occupied, 1 for player, 3 for computer.
This allows us to quickly get an overview of the game state:
if the sum of all the cells in a row is 9, the computer wins,
if it is 3 and all the cells are occupied, the human player wins,
etc.

(2) Strategy of makeComputerMove()

The computer first  looks for almost completed rows, columns, and
diagonals, where there are two fields occupied either by the human
player or by the computer itself. If the computer can win by
completing a sequence, it does so; if it can block the player from
winning with the next move, it does that. If none of that applies,
it plays the center field if that's free, otherwise it selects a
random free field. This is not a 100 % certain strategy, but the
gameplay experience is fairly decent.

*/

//==================================
// EVENT BINDINGS
//==================================

// Bind Esc key to closing the modal dialog
document.onkeypress = function (evt) {
    evt = evt || window.event;
    var modal = document.getElementsByClassName("modal")[0];
    if (evt.keyCode === 27) {
        modal.style.display = "none";
    }
};

// When the user clicks anywhere outside of the modal dialog, close it
window.onclick = function (evt) {
    var modal = document.getElementsByClassName("modal")[0];
    if (evt.target === modal) {
        modal.style.display = "none";
    }
};

//==================================
// HELPER FUNCTIONS
//==================================
function sumArray(array) {
    var sum = 0,
        i = 0;
    for (i = 0; i < array.length; i++) {
        sum += array[i];
    }
    return sum;
}

function isInArray(element, array) {
    if (array.indexOf(element) > -1) {
        return true;
    }
    return false;
}

function shuffleArray(array) {
    var counter = array.length,
        temp,
        index;
    while (counter > 0) {
        index = Math.floor(Math.random() * counter);
        counter--;
        temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }
    return array;
}

function intRandom(min, max) {
    var rand = min + Math.random() * (max + 1 - min);
    return Math.floor(rand);
}

// GAME CONSTANTS
const GRID_SIZE = 5; // 5x5 grid
const WIN_LENGTH = 5; // Need 5 in a row to win

// GLOBAL VARIABLES
var moves = 0,
    winner = 0,
    x = 1,
    o = 3,
    player = x,
    computer = o,
    whoseTurn = x,
    gameOver = false,
    score = {
        ties: 0,
        player: 0,
        computer: 0
    },
    xText = "<span class=\"x\">&times;</class>",
    oText = "<span class=\"o\">o</class>",
    playerText = xText,
    computerText = oText,
    difficulty = 1,
    myGrid = null;

//==================================
// GRID OBJECT
//==================================

// Grid constructor
//=================
function Grid() {
    this.cells = new Array(GRID_SIZE * GRID_SIZE).fill(0);
}

// Grid methods
//=============

// Get free cells in an array.
// Returns an array of indices in the original Grid.cells array, not the values
// of the array elements.
// Their values can be accessed as Grid.cells[index].
Grid.prototype.getFreeCellIndices = function () {
    var i = 0,
        resultArray = [];
    for (i = 0; i < this.cells.length; i++) {
        if (this.cells[i] === 0) {
            resultArray.push(i);
        }
    }
    // console.log("resultArray: " + resultArray.toString());
    // debugger;
    return resultArray;
};

// Get a row (accepts 0 to GRID_SIZE-1 as argument).
// Returns the values of the elements.
Grid.prototype.getRowValues = function (index) {
    const start = index * GRID_SIZE;
    return this.cells.slice(start, start + GRID_SIZE);
};

// Get a row (accepts 0 to GRID_SIZE-1 as argument).
// Returns an array with the indices, not their values.
Grid.prototype.getRowIndices = function (index) {
    const start = index * GRID_SIZE;
    return Array.from({length: GRID_SIZE}, (_, i) => start + i);
};

// get a column (values)
Grid.prototype.getColumnValues = function (index) {
    return Array.from({length: GRID_SIZE}, (_, i) => this.cells[index + i * GRID_SIZE]);
};

// get a column (indices)
Grid.prototype.getColumnIndices = function (index) {
    return Array.from({length: GRID_SIZE}, (_, i) => index + i * GRID_SIZE);
};

// get diagonal cells
// arg 0: from top-left to bottom-right
// arg 1: from top-right to bottom-left
Grid.prototype.getDiagValues = function (arg) {
    const diag = [];
    if (arg === 0) {
        // Top-left to bottom-right diagonal
        for (let i = 0; i < GRID_SIZE; i++) {
            diag.push(this.cells[i * GRID_SIZE + i]);
        }
    } else if (arg === 1) {
        // Top-right to bottom-left diagonal
        for (let i = 0; i < GRID_SIZE; i++) {
            diag.push(this.cells[i * GRID_SIZE + (GRID_SIZE - 1 - i)]);
        }
    }
    return diag;
};

// get diagonal cells
// arg 0: from top-left
// arg 1: from top-right
Grid.prototype.getDiagIndices = function (arg) {
    if (arg === 0) {
        // Top-left to bottom-right diagonal indices
        return Array.from({length: GRID_SIZE}, (_, i) => i * GRID_SIZE + i);
    } else if (arg === 1) {
        // Top-right to bottom-left diagonal indices
        return Array.from({length: GRID_SIZE}, (_, i) => i * GRID_SIZE + (GRID_SIZE - 1 - i));
    }
    return [];
};

// Get first index with two in a row (accepts computer or player as argument)
Grid.prototype.getFirstWithTwoInARow = function (agent) {
    if (agent !== computer && agent !== player) {
        console.error("Function getFirstWithTwoInARow accepts only player or computer as argument.");
        return undefined;
    }
    var sum = agent * 2,
        freeCells = shuffleArray(this.getFreeCellIndices());
    for (var i = 0; i < freeCells.length; i++) {
        for (var j = 0; j < 3; j++) {
            var rowV = this.getRowValues(j);
            var rowI = this.getRowIndices(j);
            var colV = this.getColumnValues(j);
            var colI = this.getColumnIndices(j);
            if (sumArray(rowV) == sum && isInArray(freeCells[i], rowI)) {
                return freeCells[i];
            } else if (sumArray(colV) == sum && isInArray(freeCells[i], colI)) {
                return freeCells[i];
            }
        }
        for (j = 0; j < 2; j++) {
            var diagV = this.getDiagValues(j);
            var diagI = this.getDiagIndices(j);
            if (sumArray(diagV) == sum && isInArray(freeCells[i], diagI)) {
                return freeCells[i];
            }
        }
    }
    return false;
};

Grid.prototype.reset = function () {
    for (var i = 0; i < this.cells.length; i++) {
        this.cells[i] = 0;
    }
    return true;
};

//==================================
// MAIN FUNCTIONS
//==================================

// executed when the page loads
function initialize() {
    myGrid = new Grid();
    moves = 0;
    winner = 0;
    gameOver = false;
    whoseTurn = player; // default, this may change
    for (var i = 0; i <= myGrid.cells.length - 1; i++) {
        myGrid.cells[i] = 0;
    }
    // setTimeout(assignRoles, 500);
    setTimeout(showOptions, 500);
    // debugger;
}

// Ask player if they want to play as X or O. X goes first.
function assignRoles() {
    askUser("Do you want to go first?");
    document.getElementById("yesBtn").addEventListener("click", makePlayerX);
    document.getElementById("noBtn").addEventListener("click", makePlayerO);
}

function makePlayerX() {
    player = x;
    computer = o;
    whoseTurn = player;
    playerText = xText;
    computerText = oText;
    document.getElementById("userFeedback").style.display = "none";
    document.getElementById("yesBtn").removeEventListener("click", makePlayerX);
    document.getElementById("noBtn").removeEventListener("click", makePlayerO);
}

function makePlayerO() {
    player = o;
    computer = x;
    whoseTurn = computer;
    playerText = oText;
    computerText = xText;
    setTimeout(makeComputerMove, 400);
    document.getElementById("userFeedback").style.display = "none";
    document.getElementById("yesBtn").removeEventListener("click", makePlayerX);
    document.getElementById("noBtn").removeEventListener("click", makePlayerO);
}

// executed when player clicks one of the table cells
function cellClicked(id) {
    // The last character of the id corresponds to the numeric index in Grid.cells:
    var idName = id.toString();
    var cell = parseInt(idName[idName.length - 1]);
    if (myGrid.cells[cell] > 0 || whoseTurn !== player || gameOver) {
        // cell is already occupied or something else is wrong
        return false;
    }
    moves += 1;
    document.getElementById(id).innerHTML = playerText;
    // randomize orientation (for looks only)
    var rand = Math.random();
    if (rand < 0.3) {
        document.getElementById(id).style.transform = "rotate(180deg)";
    } else if (rand > 0.6) {
        document.getElementById(id).style.transform = "rotate(90deg)";
    }
    document.getElementById(id).style.cursor = "default";
    myGrid.cells[cell] = player;
    // Test if we have a winner:
    if (moves >= 5) {
        winner = checkWin();
    }
    if (winner === 0) {
        whoseTurn = computer;
        makeComputerMove();
    }
    return true;
}

// Executed when player hits restart button.
// ask should be true if we should ask users if they want to play as X or O
function restartGame(ask) {
    if (moves > 0) {
        var response = confirm("Are you sure you want to start over?");
        if (response === false) {
            return;
        }
    }
    gameOver = false;
    moves = 0;
    winner = 0;
    whoseTurn = x;
    myGrid.reset();
    for (var i = 0; i <= 8; i++) {
        var id = "cell" + i.toString();
        document.getElementById(id).innerHTML = "";
        document.getElementById(id).style.cursor = "pointer";
        document.getElementById(id).classList.remove("win-color");
    }
    if (ask === true) {
        // setTimeout(assignRoles, 200);
        setTimeout(showOptions, 200);
    } else if (whoseTurn == computer) {
        setTimeout(makeComputerMove, 800);
    }
}

// Check if there's a winning move for a player in any direction
function findWinningMove(player) {
    const freeCells = myGrid.getFreeCellIndices();
    
    // Check all free cells to see if any would complete a win
    for (const index of freeCells) {
        // Temporarily make the move
        myGrid.cells[index] = player;
        
        // Check all possible directions for a win
        // Rows
        for (let i = 0; i < GRID_SIZE; i++) {
            const row = myGrid.getRowValues(i);
            if (checkWinInSequence(row, player)) {
                myGrid.cells[index] = 0; // Undo the move
                return index;
            }
        }
        
        // Columns
        for (let i = 0; i < GRID_SIZE; i++) {
            const col = myGrid.getColumnValues(i);
            if (checkWinInSequence(col, player)) {
                myGrid.cells[index] = 0; // Undo the move
                return index;
            }
        }
        
        // Diagonals
        for (let i = 0; i <= GRID_SIZE - WIN_LENGTH; i++) {
            for (let j = 0; j <= GRID_SIZE - WIN_LENGTH; j++) {
                // Top-left to bottom-right diagonal
                let diag1 = [];
                for (let k = 0; k < WIN_LENGTH; k++) {
                    diag1.push(myGrid.cells[(i + k) * GRID_SIZE + (j + k)]);
                }
                if (checkWinInSequence(diag1, player)) {
                    myGrid.cells[index] = 0; // Undo the move
                    return index;
                }
                
                // Top-right to bottom-left diagonal
                let diag2 = [];
                for (let k = 0; k < WIN_LENGTH; k++) {
                    diag2.push(myGrid.cells[(i + k) * GRID_SIZE + (j + WIN_LENGTH - 1 - k)]);
                }
                if (checkWinInSequence(diag2, player)) {
                    myGrid.cells[index] = 0; // Undo the move
                    return index;
                }
            }
        }
        
        // Undo the move
        myGrid.cells[index] = 0;
    }
    return -1;
}

// The core logic of the game AI:
function makeComputerMove() {
    const freeCells = myGrid.getFreeCellIndices();
    let index = -1;
    
    // 1. Check if computer can win in the next move
    index = findWinningMove(computer);
    
    // 2. If not, check if player can win in the next move and block them
    if (index === -1) {
        index = findWinningMove(player);
    }
    
    // 3. If no immediate win/loss, take the center if available
    if (index === -1 && myGrid.cells[12] === 0) {
        index = 12; // Center of 5x5 grid
    }
    
    // 4. Take a corner if available
    const corners = [0, 4, 20, 24];
    if (index === -1) {
        const availableCorners = corners.filter(corner => myGrid.cells[corner] === 0);
        if (availableCorners.length > 0) {
            index = availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }
    }
    
    // 5. Take a side if available
    const sides = [2, 7, 10, 11, 13, 14, 17, 22];
    if (index === -1) {
        const availableSides = sides.filter(side => myGrid.cells[side] === 0);
        if (availableSides.length > 0) {
            index = availableSides[Math.floor(Math.random() * availableSides.length)];
        }
    }
    
    // 6. Take any available cell (shouldn't happen in a 5x5 grid, but just in case)
    if (index === -1 && freeCells.length > 0) {
        index = freeCells[Math.floor(Math.random() * freeCells.length)];
    }
    
    // Make the move
    if (index !== -1) {
        myGrid.cells[index] = computer;
        const cell = document.getElementById("cell" + index);
        if (cell) {
            cell.innerHTML = computerText;
            cell.classList.add("o");
        }
        moves++;
        checkWin();
    }
}

// Check if there's a win for the given player in the given sequence
function checkWinInSequence(sequence, player) {
    let count = 0;
    for (let i = 0; i < sequence.length; i++) {
        if (sequence[i] === player) {
            count++;
            if (count >= WIN_LENGTH) return true;
        } else {
            count = 0;
        }
    }
    return false;
}

// Check if the game is over and determine winner
function checkWin() {
    // Check rows
    for (let i = 0; i < GRID_SIZE; i++) {
        const row = myGrid.getRowValues(i);
        if (checkWinInSequence(row, x)) {
            winner = x;
            endGame(currentPlayerText + " wins!");
            return true;
        }
        if (checkWinInSequence(row, o)) {
            winner = o;
            endGame(currentPlayerText + " wins!");
            return true;
        }
    }
    
    // Check columns
    for (let i = 0; i < GRID_SIZE; i++) {
        const col = myGrid.getColumnValues(i);
        if (checkWinInSequence(col, x) || checkWinInSequence(col, o)) {
            winner = checkWinInSequence(col, x) ? x : o;
            endGame(currentPlayerText + " wins!");
            return true;
        }
    }
    
    // Check diagonals (only check main diagonals that can have WIN_LENGTH in a row)
    for (let i = 0; i <= GRID_SIZE - WIN_LENGTH; i++) {
        for (let j = 0; j <= GRID_SIZE - WIN_LENGTH; j++) {
            // Check top-left to bottom-right diagonal
            let diag1 = [];
            for (let k = 0; k < WIN_LENGTH; k++) {
                diag1.push(myGrid.cells[(i + k) * GRID_SIZE + (j + k)]);
            }
            if (checkWinInSequence(diag1, x) || checkWinInSequence(diag1, o)) {
                winner = checkWinInSequence(diag1, x) ? x : o;
                endGame(currentPlayerText + " wins!");
                return true;
            }
            
            // Check top-right to bottom-left diagonal
            let diag2 = [];
            for (let k = 0; k < WIN_LENGTH; k++) {
                diag2.push(myGrid.cells[(i + k) * GRID_SIZE + (j + WIN_LENGTH - 1 - k)]);
            }
            if (checkWinInSequence(diag2, x) || checkWinInSequence(diag2, o)) {
                winner = checkWinInSequence(diag2, x) ? x : o;
                endGame(currentPlayerText + " wins!");
                return true;
            }
        }
    }
    
    // Check for draw
    if (moves === GRID_SIZE * GRID_SIZE) {
        winner = 0;
        endGame("It's a draw!");
        return true;
    }
    
    return false;
}


function announceWinner(text) {
    document.getElementById("winText").innerHTML = text;
    document.getElementById("winAnnounce").style.display = "block";
    setTimeout(closeModal, 1400, "winAnnounce");
}

function askUser(text) {
    document.getElementById("questionText").innerHTML = text;
    document.getElementById("userFeedback").style.display = "block";
}

function showOptions() {
    if (player == o) {
        document.getElementById("rx").checked = false;
        document.getElementById("ro").checked = true;
    }
    else if (player == x) {
        document.getElementById("rx").checked = true;
        document.getElementById("ro").checked = false;
    }
    if (difficulty === 0) {
        document.getElementById("r0").checked = true;
        document.getElementById("r1").checked = false;
    }
    else {
        document.getElementById("r0").checked = false;
        document.getElementById("r1").checked = true;
    }
    document.getElementById("optionsDlg").style.display = "block";
}

function getOptions() {
    var diffs = document.getElementsByName('difficulty');
    for (var i = 0; i < diffs.length; i++) {
        if (diffs[i].checked) {
            difficulty = parseInt(diffs[i].value);
            break;
            // debugger;
        }
    }
    if (document.getElementById('rx').checked === true) {
        player = x;
        computer = o;
        whoseTurn = player;
        playerText = xText;
        computerText = oText;
    }
    else {
        player = o;
        computer = x;
        whoseTurn = computer;
        playerText = oText;
        computerText = xText;
        setTimeout(makeComputerMove, 400);
    }
    document.getElementById("optionsDlg").style.display = "none";
}

function closeModal(id) {
    document.getElementById(id).style.display = "none";
}

function endGame(who) {
    if (who === player) {
        announceWinner("Congratulations, you won!");
        score.player++;
    } else if (who === computer) {
        announceWinner("Computer wins!");
        score.computer++;
    } else {
        announceWinner("It's a tie!");
        score.ties++;
    }
    
    gameOver = true;
    whoseTurn = 0;
    moves = 0;
    winner = 0;
    
    // Update score display
    document.getElementById("computer_score").textContent = score.computer;
    document.getElementById("tie_score").textContent = score.ties;
    document.getElementById("player_score").textContent = score.player;
    
    // Update cursor for all cells
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        const cell = document.getElementById("cell" + i);
        if (cell) {
            cell.style.cursor = "default";
        }
    }
    
    setTimeout(restartGame, 1500);
}
