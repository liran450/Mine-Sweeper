'strict mode'


const MINE_IMG = '<img src="img/mine.png" />'
const FLAG_IMG = '<img src="img/flag.png" />'

var gBoard
var gSavedBoardsArray = []

var gCurrSize = 4;
var gCurrMines = 3;

var gGame = GameStats()
var gLevel = levelStats();
var gExposeOffTimeout;

var gFlaggedMineCount = 0
var gIsHintOn = false

var gMs = 0;
var gS = 0;
var gM = 0;
var gTimerInterval;


function init() {
    var length = gLevel.size
    var mines = gLevel.mines
    gBoard = buildBoard(length, mines)
    renderBoard(gBoard)
}

var gFirstClickedCell;

function buildBoard(length, mines) {
    var board = []
    for (var i = 0; i < length; i++) {
        board[i] = []
        for (var j = 0; j < length; j++) {
            currBoardPos = { i: i, j: j }
            board[i][j] = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            }
        }
    }
    return board
}

function renderBoard() {
    var strHTML = '<table border="0" cellSpacing="0px"><tbody class="board">'
    for (var i = 0; i < gBoard.length; i++) {
        strHTML += `<tr>`
        for (var j = 0; j < gBoard.length; j++) {
            var currCell = gBoard[i][j];
            var tdId = `cell-${i}-${j}`;
            var clicked = (currCell.isShown && !currCell.isMine) ? 'clicked' : ''
            
            strHTML += `<td id="${tdId}" class="cell ${clicked}" onclick="cellClicked(this)" 
            oncontextmenu="flagCell(this)" >\n`

            if (currCell.isShown && currCell.isMine) {
                strHTML += MINE_IMG;
            } else if (currCell.isShown && currCell.minesAroundCount) {
                strHTML += currCell.minesAroundCount;
            } else if (currCell.isMarked) {
                strHTML += FLAG_IMG
            }
            strHTML += '\t</td>\n';
        }
        strHTML += `</tr>`
    }
    strHTML += '</tbody></table>'
    zeroShownStats()
    var elBoard = document.querySelector('.board')
    elBoard.innerHTML = strHTML
}

function placeMines(board, minesCount) {
    var noMineCoordsArray = calcNoMineZone(board, gFirstClickedCell)
    for (var i = 0; i < minesCount; i++) {
        var num1 = getRandomIntInclusive(0, board.length - 1)
        var num2 = getRandomIntInclusive(0, board.length - 1)
        var currCell = board[num1][num2]
        var firstCoordI = +gFirstClickedCell.i
        var firstCoordj = +gFirstClickedCell.j
        var isMineAround = false

        for (var j = 0; j < noMineCoordsArray.length; j++) {
            if (noMineCoordsArray[j].i === num1 && noMineCoordsArray[j].j === num2) {
                isMineAround = true
            }
        }
        if (num1 == firstCoordI && num2 == firstCoordj || isMineAround) {
            i--;
            isMineAround = false
            continue;
        }
        if (currCell.isMine) i--
        currCell.isMine = true
    }
}

function calcNoMineZone(board, pos) {
    var noMineCoordsArray = [];

    for (var i = pos.i - 1; i <= pos.i + 1; i++) {
        if (i < 0 || i > board.length - 1) continue;
        for (var j = pos.j - 1; j <= pos.j + 1; j++) {
            if (j < 0 || j > board.length - 1) continue;
            if (i === pos.i && j === pos.j) {
                continue;
            }
            noMineCoordsArray.push({ i: +i, j: +j })
        }
    }
    return noMineCoordsArray;
}

function setMineCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board.length; j++) {
            currBoardPos = { i: i, j: j }
            board[i][j].minesAroundCount = setMinesNegsCount(board, currBoardPos)
        }
    }
}

function showMines() {
    for (var i = 0; i < gBoard.length; i++) {
        for (let j = 0; j < gBoard[i].length; j++) {
            if (gBoard[i][j].isMine && !gBoard[i][j].isShown)
                gBoard[i][j].isShown = true
        }
    }
    renderBoard()
}

function setMinesNegsCount(board, pos) {

    var minesAroundCount = 0;
    for (var i = pos.i - 1; i <= pos.i + 1; i++) {
        if (i < 0 || i > board.length - 1) continue;
        for (var j = pos.j - 1; j <= pos.j + 1; j++) {
            if (j < 0 || j > board.length - 1) continue;
            if (i === pos.i && j === pos.j) continue;
            if (board[i][j].isMine) minesAroundCount++;
        }
    }
    return minesAroundCount;
}


function cellClicked(elCell) {
    if (!elCell) return
    var coords = getCellCoord(elCell.id)
    var currCell = gBoard[coords.i][coords.j]
    if (currCell.isMarked) return
    if (currCell.isShown) return
    if (!gGame.life) {
        return
    }

    if (!currCell.isShown) gGame.shownCount++;
    
    currCell.isShown = true;

    if (!gGame.isOn) {
        gFirstClickedCell = coords;
        startGame();
    }

    if (gIsHintOn) {
        hint(coords);
        return;
    }

    var mineCount = (currCell.minesAroundCount === 0) ? '' : currCell.minesAroundCount;
    if (currCell.isShown && !currCell.isMine) {
        if (!elCell.classList.contains('clicked')) elCell.classList.add('clicked');
        renderCell(elCell, mineCount);
    } else if (currCell.isShown && currCell.isMine) {
        renderCell(elCell, MINE_IMG);
        gGame.life--;
        renderSmiley();
        var elSpan = document.querySelector('.life');
        elSpan.innerText = `Life: ${gGame.life}`;

        mineClickedMessage()
        if (!gGame.life) {
            gameOver();
        }
    }

    if (gFlaggedMineCount + gGame.shownCount === gCurrSize ** 2) {
        pauseTimer()
        if (!gGame.life) {
            gameOver()
            return
        }
        gameWon()
    }

    if (!currCell.isMine && currCell.minesAroundCount === 0) {
        expand(coords)
    }
}

function expand(coords) {
    cellClicked(document.querySelector(`#cell-${(coords.i + 1)}-${(coords.j)}`))
    cellClicked(document.querySelector(`#cell-${(coords.i)}-${(coords.j + 1)}`))
    cellClicked(document.querySelector(`#cell-${(coords.i + 1)}-${(coords.j + 1)}`))
    cellClicked(document.querySelector(`#cell-${(coords.i - 1)}-${(coords.j)}`))
    cellClicked(document.querySelector(`#cell-${(coords.i)}-${(coords.j - 1)}`))
    cellClicked(document.querySelector(`#cell-${(coords.i - 1)}-${(coords.j - 1)}`))
    cellClicked(document.querySelector(`#cell-${(coords.i + 1)}-${(coords.j - 1)}`))
    cellClicked(document.querySelector(`#cell-${(coords.i - 1)}-${(coords.j + 1)}`))
}

function flagCell(elCell) {
    var coords = getCellCoord(elCell.id)
    var currCell = gBoard[coords.i][coords.j]
    if (currCell.isShown) return

    currCell.isMarked = !currCell.isMarked

    if (currCell.isMarked) {
        renderCell(elCell, FLAG_IMG)
        gGame.markedCount++;
        if (currCell.isMarked && currCell.isMine) {
            gFlaggedMineCount++
        }
    }
    else {
        renderCell(elCell, '')
        gGame.markedCount--
        if (!currCell.isMarked && currCell.isMine) {
            gFlaggedMineCount--
        }
    }

    if (gFlaggedMineCount + gGame.shownCount === gCurrSize ** 2) {
        pauseTimer()
        if (!gGame.life) {
            gameOver()
            return
        }
        gameWon()
    }
}


function mineClickedMessage() {
    clearTimeout(gTimeOut)
    elDiv = document.querySelector('.mine-clicked')
    elSpan = document.querySelector('.life-left-message')
    elSpan.innerText = `Attention!: ${gGame.life}`
    if (elDiv.classList.contains('hide')) {
        elDiv.classList.remove('hide')
    }
    var gTimeOut = setTimeout(function () {
        elDiv.classList.add('hide')
    }, 2000)
}

function renderCell(cell, value) {
    cell.innerHTML = value;
}

function renderSmiley() {
    var elSmileySpan = document.querySelector('.smiley')
    if (gGame.life === 3) elSmileySpan.innerText = '😁';
    if (gGame.life < 3) elSmileySpan.innerText = '😅';
    if (!gGame.life) elSmileySpan.innerText = '💀';
}

function expandShown(board, elCell, i, j) {

}

function GameStats() {
    return {
        isOn: false,
        shownCount: 0,
        markedCount: 0,
        flaggedMineCount: 0,
        secsPassed: 0,
        life: 3,
        hints: 3,
        safe: 3
    }
}

function startGame() {
    if (gGame.isOn) return
    startTimer()
    gGame.isOn = true;
    placeMines(gBoard, gLevel.mines)
    setMineCount(gBoard)
}

function gameOver() {
    var elButton = document.querySelector('.restart')
    if (elButton.classList.contains('hide')) {
    elButton.classList.remove('hide')
}
    pauseTimer()
    showMines()
}


function restartGame(elSpan) {
    zeroGame()
    var elButton = document.querySelector('.restart')

    if (elSpan) {
        if (!elButton.classList.contains('hide')) {
            elButton.classList.add('hide')
        }
        return
    }
    elButton.classList.toggle('hide')

}

function gameWon() {
    var elHead = document.querySelector('.win-message');
    elHead.classList.remove('hide')
    var elButton = document.querySelector('.restart')
    elButton.classList.toggle('hide')
    pauseTimer()
}

function zeroGame() {
    gGame.shownCount = 0
    gGame.markedCount = 0;
    gFlaggedMineCount = 0
    gGame = GameStats()
    gLevel = levelStats()
    renderSmiley()
    zeroTimer()
    init()

    var elHead = document.querySelector('.win-message');
    if (!elHead.classList.contains('hide')) {
        elHead.classList.add('hide')
    }
}

function zeroShownStats() {
    var elSpanHint = document.querySelector('.hint')
    elSpanHint.innerText = `Hints: ${gGame.hints}`
    var elSpanLife = document.querySelector('.life')
    elSpanLife.innerText = `Life: ${gGame.life}`
    var elSpanSafe = document.querySelector('.safe-click')
    elSpanSafe.innerText = `Safe Clicks: ${gGame.safe}`
}

function chooseLevel(elInput) {
    //Has to be on top since it zeroes the gLevel
    var isCurrentBoard = false

    if (elInput) {
        if (elInput.value === "easy(4x4)") {
            if (gCurrSize === 4) {
                isCurrentBoard = true
            } else {
                gCurrSize = gLevel.size = 4
                gCurrMines = gLevel.mines = 4
            }
        }



        if (elInput.value === "hard(8x8)") {
            if (gCurrSize === 8) {
                isCurrentBoard = true
            } else {
                gCurrSize = gLevel.size = 8
                gCurrMines = gLevel.mines = 8
            }
        }

        if (elInput.value === "super(12x12)") {
            if (gCurrSize === 12) {
                isCurrentBoard = true
            } else {
                gCurrSize = gLevel.size = 12
                gCurrMines = gLevel.mines = 30
            }
        }
    }

    if (!isCurrentBoard) {
        zeroGame()
        var elButton = document.querySelector('.restart')
        if (!elButton.classList.contains('hide')) {
            elButton.classList.add('hide')
        }
    }
}


function hintActivate() {
    if (!gGame.isOn) return
    if (!gGame.hints) return

    gIsHintOn = true
}

function hint(coords) {
    if (gExposeOffTimeout) return
    var cellsAround = calcNoMineZone(gBoard, coords)
    var cellsToExpose = []
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            for (let k = 0; k < cellsAround.length; k++) {
                if (i === cellsAround[k].i && j === cellsAround[k].j) {
                    if (!gBoard[i][j].isShown) {
                        cellsToExpose.push({ i: i, j: j })
                    }
                }
            }
        }
    }
    cellsToExpose.push(coords)
    exposeCellsHint(cellsToExpose)
}


function exposeCellsHint(cells) {
    gGame.hints--
    var elSpan = document.querySelector('.hint')
    elSpan.innerText = `hints left: ${gGame.hints}`


    for (var k = 0; k < cells.length; k++) {
        gBoard[cells[k].i][cells[k].j].isShown = true
    }
    renderBoard(gBoard)

    gExposeOffTimeout = setTimeout(function () {
        for (var k = 0; k < cells.length; k++) {
            gBoard[cells[k].i][cells[k].j].isShown = false
        }
        renderBoard(gBoard)
        gIsHintOn = false
        safeClick()
    }, 1000)
    setTimeout(function () {
        gExposeOffTimeout = null
    }, 1000)
}

function safeClick() {
    if (!gGame.isOn) return
    if (!gGame.safe) return
    gGame.safe--
    var safeClick = {}
    for (var i = 0; i < 1; i++) {
        var num1 = getRandomIntInclusive(0, gBoard.length - 1)
        var num2 = getRandomIntInclusive(0, gBoard.length - 1)
        if (gBoard[num1][num2].isMine && !gBoard[num1][num2].isShown) {
            gBoard[num1][num2].isShown = true
            safeClick = { i: num1, j: num2 }
            renderBoard(gBoard)
        } else {
            i--
        }
    }

    setTimeout(function () {
        gBoard[num1][num2].isShown = false
        renderBoard(gBoard)
    }, 1500)
}

function levelStats() {
    return {
        size: gCurrSize,
        mines: gCurrMines
    }
}

function getCellCoord(location) {
    var coords = location.split('-')
    var i = coords[1]
    var j = coords[2]
    return { i: +i, j: +j }
}

function getRandomIntInclusive(min, max) {
    var min = Math.ceil(min);
    var max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function startTimer() {
    gTimerInterval = setInterval(run, 10)
}

function run() {
    var elStopwatch = document.querySelector('.stop-watch');
    elStopwatch.innerText = (gM < 10 ? '0' + gM : gM) + ':' + (gS < 10 ? '0' + gS : gS) + ':' + (gMs < 10 ? '0' + gMs : gMs);
    gMs++
    if (gMs == 100) {
        gMs = 0
        gS++
    }
    if (gS == 60) {
        gS = 0
        gM++
    }
}

function zeroTimer() {
    var elStopwatch = document.querySelector('.stop-watch');
    gM = 0;
    gS = 0;
    gMs = 0;
    elStopwatch.innerHTML = '0' + gM + ':' + '0' + gS + ':' + '0' + gMs;
    clearInterval(gTimerInterval)
}

function pauseTimer() {
    clearInterval(gTimerInterval)
}