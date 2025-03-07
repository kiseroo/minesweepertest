// Minesweeper Game Logic

// Game configuration
const GAME_CONFIG = {
    beginner: {
        rows: 9,
        cols: 9,
        mines: 10
    },
    intermediate: {
        rows: 16,
        cols: 16,
        mines: 40
    },
    expert: {
        rows: 16,
        cols: 30,
        mines: 99
    }
};

// Game state variables
let gameBoard = [];
let currentDifficulty = 'beginner';
let minesCount;
let revealedCount;
let gameStarted = false;
let gameOver = false;
let timer;
let seconds = 0;
let firstClick = true;

// DOM elements
const gameBoardElement = document.getElementById('game-board');
const difficultyButtons = document.querySelectorAll('.difficulty-btn');
const newGameButton = document.getElementById('new-game-btn');
const playAgainButton = document.getElementById('play-again-btn');
const minesCountElement = document.getElementById('mines-count');
const timerElement = document.getElementById('timer');
const gameMessageElement = document.getElementById('game-message');
const resultTextElement = document.getElementById('result-text');
const resultStatsElement = document.getElementById('result-stats');

// Initialize the game
function initGame() {
    // Reset game state
    gameBoard = [];
    gameStarted = false;
    gameOver = false;
    firstClick = true;
    seconds = 0;
    clearInterval(timer);
    timerElement.textContent = '000';
    
    // Get current difficulty settings
    const config = GAME_CONFIG[currentDifficulty];
    minesCount = config.mines;
    revealedCount = 0;
    
    // Update mines counter
    minesCountElement.textContent = minesCount;
    
    // Clear game board
    gameBoardElement.innerHTML = '';
    gameBoardElement.className = `game-board ${currentDifficulty}`;
    
    // Create empty board
    for (let row = 0; row < config.rows; row++) {
        gameBoard[row] = [];
        for (let col = 0; col < config.cols; col++) {
            gameBoard[row][col] = {
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                adjacentMines: 0
            };
            
            // Create cell element
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            // Add event listeners
            cell.addEventListener('click', handleCellClick);
            cell.addEventListener('contextmenu', handleCellRightClick);
            
            gameBoardElement.appendChild(cell);
        }
    }
    
    // Hide game message if visible
    gameMessageElement.classList.add('hidden');
}

// Place mines on the board (after first click)
function placeMines(firstRow, firstCol) {
    const config = GAME_CONFIG[currentDifficulty];
    let minesPlaced = 0;
    
    while (minesPlaced < config.mines) {
        const row = Math.floor(Math.random() * config.rows);
        const col = Math.floor(Math.random() * config.cols);
        
        // Don't place mine on first click or where a mine already exists
        if ((row !== firstRow || col !== firstCol) && !gameBoard[row][col].isMine) {
            gameBoard[row][col].isMine = true;
            minesPlaced++;
        }
    }
    
    // Calculate adjacent mines for each cell
    for (let row = 0; row < config.rows; row++) {
        for (let col = 0; col < config.cols; col++) {
            if (!gameBoard[row][col].isMine) {
                gameBoard[row][col].adjacentMines = countAdjacentMines(row, col);
            }
        }
    }
}

// Count adjacent mines for a cell
function countAdjacentMines(row, col) {
    let count = 0;
    const config = GAME_CONFIG[currentDifficulty];
    
    // Check all 8 adjacent cells
    for (let r = Math.max(0, row - 1); r <= Math.min(config.rows - 1, row + 1); r++) {
        for (let c = Math.max(0, col - 1); c <= Math.min(config.cols - 1, col + 1); c++) {
            if (r !== row || c !== col) { // Skip the cell itself
                if (gameBoard[r][c].isMine) {
                    count++;
                }
            }
        }
    }
    
    return count;
}

// Handle cell click
function handleCellClick(event) {
    if (gameOver) return;
    
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);
    
    // Ignore if cell is flagged
    if (gameBoard[row][col].isFlagged) return;
    
    // First click logic
    if (firstClick) {
        firstClick = false;
        placeMines(row, col);
        startTimer();
    }
    
    // Reveal the cell
    revealCell(row, col);
}

// Handle right click (flag placement)
function handleCellRightClick(event) {
    event.preventDefault(); // Prevent context menu
    
    if (gameOver) return;
    
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);
    
    // Ignore if cell is already revealed
    if (gameBoard[row][col].isRevealed) return;
    
    // Toggle flag
    gameBoard[row][col].isFlagged = !gameBoard[row][col].isFlagged;
    
    // Update UI
    const cell = event.target;
    cell.classList.toggle('flagged');
    
    // Update mines counter
    const flaggedCount = countFlaggedCells();
    minesCountElement.textContent = minesCount - flaggedCount;
    
    // Start timer if first action
    if (!gameStarted) {
        startTimer();
    }
}

// Count flagged cells
function countFlaggedCells() {
    let count = 0;
    const config = GAME_CONFIG[currentDifficulty];
    
    for (let row = 0; row < config.rows; row++) {
        for (let col = 0; col < config.cols; col++) {
            if (gameBoard[row][col].isFlagged) {
                count++;
            }
        }
    }
    
    return count;
}

// Reveal a cell
function revealCell(row, col) {
    const cell = gameBoard[row][col];
    
    // Ignore if already revealed or flagged
    if (cell.isRevealed || cell.isFlagged) return;
    
    // Mark as revealed
    cell.isRevealed = true;
    revealedCount++;
    
    // Update UI
    const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    cellElement.classList.add('revealed');
    
    // Check if mine
    if (cell.isMine) {
        cellElement.classList.add('mine');
        cellElement.innerHTML = '<i class="fas fa-bomb"></i>';
        gameOver = true;
        endGame(false);
        return;
    }
    
    // Show adjacent mines count
    if (cell.adjacentMines > 0) {
        cellElement.textContent = cell.adjacentMines;
        cellElement.dataset.number = cell.adjacentMines;
    }
    
    // Auto-reveal adjacent cells if no adjacent mines
    if (cell.adjacentMines === 0) {
        const config = GAME_CONFIG[currentDifficulty];
        
        // Check all 8 adjacent cells
        for (let r = Math.max(0, row - 1); r <= Math.min(config.rows - 1, row + 1); r++) {
            for (let c = Math.max(0, col - 1); c <= Math.min(config.cols - 1, col + 1); c++) {
                if (r !== row || c !== col) { // Skip the cell itself
                    revealCell(r, c);
                }
            }
        }
    }
    
    // Check for win
    checkWin();
}

// Check if player has won
function checkWin() {
    const config = GAME_CONFIG[currentDifficulty];
    const totalCells = config.rows * config.cols;
    
    if (revealedCount === totalCells - config.mines) {
        gameOver = true;
        endGame(true);
    }
}

// Start the timer
function startTimer() {
    gameStarted = true;
    clearInterval(timer);
    seconds = 0;
    
    timer = setInterval(() => {
        seconds++;
        timerElement.textContent = seconds.toString().padStart(3, '0');
        
        // Cap at 999 seconds
        if (seconds >= 999) {
            clearInterval(timer);
        }
    }, 1000);
}

// End the game
function endGame(isWin) {
    clearInterval(timer);
    gameOver = true;
    
    // Reveal all mines if lost
    if (!isWin) {
        revealAllMines();
    }
    
    // Show game message
    resultTextElement.textContent = isWin ? 'You Win! 🎉' : 'Game Over! 💣';
    resultStatsElement.textContent = `Time: ${seconds}s | Difficulty: ${currentDifficulty}`;
    gameMessageElement.classList.remove('hidden');
}

// Reveal all mines
function revealAllMines() {
    const config = GAME_CONFIG[currentDifficulty];
    
    for (let row = 0; row < config.rows; row++) {
        for (let col = 0; col < config.cols; col++) {
            if (gameBoard[row][col].isMine && !gameBoard[row][col].isRevealed) {
                const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                cellElement.classList.add('revealed');
                cellElement.classList.add('mine');
                cellElement.innerHTML = '<i class="fas fa-bomb"></i>';
            }
        }
    }
}

// Event listeners
difficultyButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Update active button
        difficultyButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Set new difficulty
        currentDifficulty = button.dataset.difficulty;
        
        // Restart game
        initGame();
    });
});

newGameButton.addEventListener('click', initGame);
playAgainButton.addEventListener('click', initGame);

// Prevent context menu on right-click
gameBoardElement.addEventListener('contextmenu', e => e.preventDefault());

// Initialize game on load
window.addEventListener('load', initGame);