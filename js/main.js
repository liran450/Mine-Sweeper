'strict mode'



const MINE = 'MINE'

const MINE_IMG = '<img src="img/mine.png" />'
// – A Matrix
// containing cell objects:
// Each cell: {
//     minesAroundCount: 4,
//     isShown: true,
//     isMine: false,
//     isMarked: true
var gBoard

// SIZE: 4,
//  MINES: 2
var gLevel = setLevel()

// isOn: false,
//  shownCount: 0,
//  markedCount: 0,
//  secsPassed: 0
var gGame = GameState()

var gBoardLength = 4

function init() {
    var length = gLevel.size
    var mines = gLevel.ines
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

//RENDERS THE BOARD
function renderBoard() {
    var strHTML = '<table onclick="startGame()" border="0" cellSpacing="0px"><tbody class="board">'
    for (var i = 0; i < gBoard.length; i++) {
        strHTML += `<tr>`
        for (var j = 0; j < gBoard.length; j++) {
            var currCell = gBoard[i][j];
            var tdId = `cell-${i}-${j}`;

            strHTML += `<td id="${tdId}" class="cell" data-i="${i}" data-j="${j}"
             onclick="cellClicked(this)" >\n`

            strHTML += (currCell.isShown && currCell.isMine) ? MINE_IMG : ''
            // if (!currCell.isMine) strHTML += currCell.minesAroundCount
            strHTML += '\t</td>\n';
        }
        strHTML += `</tr>`
    }
    strHTML += '</tbody></table>'

    var elBoard = document.querySelector('.board')
    elBoard.innerHTML = strHTML
}




//connect placeMines to level
//change second param inside randomInt to board length-1
// later connect mines amount to game level
//PLACES MINES RANDOMELY
function placeMines(board, minesCount) {
    var noMineCoordsArray = noMineZone(board, gFirstClickedCell)
    // console.log('noMine',noMineCoordsArray);
    for (var i = 0; i < minesCount; i++) {
        var num1 = getRandomIntInclusive(0, 3)
        var num2 = getRandomIntInclusive(0, 3)
        var currCell = board[num1][num2]
        var firstCoordI = +gFirstClickedCell.i
        var firstCoordj = +gFirstClickedCell.j
        var isMineAound = false
        
        //gets an array of coords around cell and makes sure there aren't mines around
        for (var j = 0; j < noMineCoordsArray.length; j++) {
            if (noMineCoordsArray[j].i === num1 && noMineCoordsArray[j].j === num2){
                isMineAound = true
            }
        }
        // gets coords of cell and makes sure there isnt a mine in it
        if (num1 == firstCoordI && num2 == firstCoordj || isMineAound) {
            console.log('skipped')
            i--;
            isMineAound = false
            continue;
        }
        if (currCell.isMine) i--
        currCell.isMine = true
    }
}


function noMineZone(board, pos) {
    var noMineCoordsArray = [];
    
    for (var i = pos.i - 1; i <= pos.i + 1; i++) {
        if (i < 0 || i > board.length - 1) continue;
        for (var j = pos.j - 1; j <= pos.j + 1; j++) {
            if (j < 0 || j > board.length - 1) continue;
            if (i === pos.i && j === pos.j){ 
                continue;
            }
            noMineCoordsArray.push({ i: +i, j: +j })
        }
    }
    return noMineCoordsArray;
}

// iterates the created board adds a mine count for each cell
function setMineCount(board) {
    // if (!gGame.isOn) return
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board.length; j++) {
            currBoardPos = { i: i, j: j }
            board[i][j].minesAroundCount = setMinesNegsCount(board, currBoardPos)
        }
    }
}

//counts mines around specific cell
function setMinesNegsCount(board, pos) {
    // if (!gGame.isOn) return
    var minesAroundCount = 0;
    for (var i = pos.i - 1; i <= pos.i + 1; i++) {
        if (i < 0 || i > board.length - 1) continue;
        for (var j = pos.j - 1; j <= pos.j + 1; j++) {
            if (j < 0 || j > board.length - 1) continue;
            if (i === pos.i && j === pos.j) continue;
            if (board[i][j].isMine) minesAroundCount++;
        }
    }
    // console.log('i:',i,'j:', j)
    
    // noMineZone(gBoard, gFirstClickedCell)
    return minesAroundCount;
}

//gets clicked cell and compares it with board cell
function cellClicked(elCell) {
    var coords = getCellCoord(elCell.id)
    var currCell = gBoard[coords.i][coords.j]
    currCell.isShown = true

    // saves first click on global variable
    if (!gGame.isOn) {
        gFirstClickedCell = coords
    }
    
    //if minecount is 0 show nothing
    var mineCount = (currCell.minesAroundCount === 0) ? '' : currCell.minesAroundCount

    //note: maybe add a boolean at beginning isMine
    if (currCell.isShown && !currCell.isMine) {
        //makes non mine cell that is clicked gray
        if (!elCell.classList.contains('clicked')) elCell.classList.add('clicked');
        renderCell(elCell, mineCount)
        // renderBoard(gBoard)
    } else if (currCell.isShown && currCell.isMine) {
        renderCell(elCell, MINE_IMG)
        gGame.life--
        if (!gGame.life) console.log('hi')
    }
    console.log(gBoard)
}


//RENDERS A SPECIFIC CELL
function renderCell(cell, value) {
    cell.innerHTML = value;
}


function expandShown(board, elCell, i, j) {

}


//CREATES GAME STATE
function GameState() {
    return {
        isOn: false,
        shownCount: 0,
        markedCount: 0,
        secsPassed: 0,
        life: 3
    }
}

//STARTS GAME
function startGame() {
    if (gGame.isOn) return

    gGame.isOn = true;
    placeMines(gBoard, 4)
    setMineCount(gBoard)
}



// make into a working function that returns a level
function setLevel() {
    return {
        size: 4,
        mines: 2
    }
}


function getCellCoord(location) {
    var coords = location.split('-')
    var i = coords[1]
    var j = coords[2]
    return { i: +i, j: +j }
}

//RANDOMIZE
function getRandomIntInclusive(min, max) {
    var min = Math.ceil(min);
    var max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
}
