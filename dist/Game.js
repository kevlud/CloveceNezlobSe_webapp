import { Board } from "./Board.js";
// @ts-ignore
export class Game {
    constructor() {
        this.boardPositions = [];
        this.choosingColor = false;
        this.myTurn = false;
        this.didMoveFigure = false;
        this.canMoveFigure = false;
        this.throwDiceNumber = 0;
        this.startedWithThreeTimesThrow = false;
        this.canThrowThreeTimes = false;
        this.canThrowTwoTimes = false;
        this.canThrowOneTime = false;
        this.onStartGameButton = (e) => {
            this.socket.emit('initialize game');
        };
        this.onMyName = (myNameString) => {
            document.getElementById('my_name').innerText = myNameString;
        };
        this.onPlayerList = (playerList) => {
            this.printUsers(JSON.parse(playerList));
            console.log(JSON.parse(playerList));
            if (JSON.parse(playerList).length >= 2)
                document.getElementById('start_game_btn').style.display = 'block';
            else
                document.getElementById('start_game_btn').style.display = 'none';
        };
        this.onChooseColor = (msg) => {
            this.choosingColor = true;
            console.log('U can choose color');
        };
        this.onStartGame = (playerColor) => {
            if (playerColor !== null)
                this.board = new Board(playerColor);
            document.getElementById('my_color').innerText = playerColor;
            document.getElementById('status').innerText = 'Starting game';
        };
        this.onOtherMoved = (msg) => {
            let figureMoved = JSON.parse(msg);
            if (figureMoved == null)
                return;
            document.getElementById('status').innerText = 'Other moved';
            console.log(figureMoved);
            this.board.updateMovedFigures(figureMoved);
        };
        this.onMyMove = () => {
            console.log('MY TURN');
            this.myTurn = true;
            this.canMoveFigure = false;
            this.didMoveFigure = false;
            this.board.myTurn();
            this.throwDiceNumber = this.board.numberOfDiceTries();
            if (this.throwDiceNumber == 3) {
                this.canThrowThreeTimes = true;
                this.startedWithThreeTimesThrow = true;
            }
            else
                this.canThrowOneTime = true;
            console.log('Can throw dice ' + this.throwDiceNumber + ' times.');
            document.getElementById('status').innerText = 'My turn';
            // Show dice
            this.svgBoard.querySelectorAll('#dice').forEach((e) => e.style.display = "initial");
        };
        // END SOCKET.IO
        // BEGIN Click Events
        this.clickEventHandler = (e) => {
            let target = e.target;
            if (target.parentElement.id == 'dice') {
                if (!this.canThrowThreeTimes && !this.canThrowTwoTimes && !this.canThrowOneTime)
                    return;
                let thrownNumber = this.board.throwDice();
                console.log("Clicked dice " + thrownNumber);
                if (this.canThrowThreeTimes && thrownNumber == 6) {
                    this.canThrowThreeTimes = false;
                    this.canThrowOneTime = true;
                }
                else if (this.canThrowTwoTimes && thrownNumber == 6) {
                    this.canThrowTwoTimes = false;
                    this.canThrowOneTime = true;
                }
                else if (this.canThrowOneTime && thrownNumber == 6) {
                    this.canThrowOneTime = true;
                }
                else if (this.canThrowThreeTimes) {
                    this.canThrowThreeTimes = false;
                    this.canThrowTwoTimes = true;
                }
                else if (this.canThrowTwoTimes) {
                    this.canThrowTwoTimes = false;
                    this.canThrowOneTime = true;
                }
                else if (this.canThrowOneTime) {
                    this.canThrowOneTime = false;
                }
                if (!this.canThrowOneTime && !this.canThrowTwoTimes && !this.canThrowOneTime && this.myTurn && !this.didMoveFigure && this.startedWithThreeTimesThrow)
                    this.emitMyTurnEnded();
                else
                    this.canMoveFigure = true;
                this.svgBoard.querySelectorAll('#dice > g').forEach((e) => e.style.display = "none");
                let targetDiceState = this.svgBoard.querySelector('#dice > #dice_' + thrownNumber);
                targetDiceState.style.display = 'block';
            }
        };
        this.startDragEventHandler = (e) => {
            if (!this.myTurn)
                return;
            if (!this.canMoveFigure)
                return;
            let target = e.target;
            if (!target.parentElement.classList.contains('draggable'))
                return;
            let canDragThisColor = this.board.startedDraggingFigure(target.parentElement.id);
            if (!canDragThisColor)
                return;
            this.currentlyDraggedTransformInitial = target.parentElement.style.transform;
            this.currentlyDragged = target.parentElement;
            // ANIMATION OF SCALING UP
            var coord = this.getMousePosition(e);
            this.currentlyDragged.style.transform = "translate(" + coord.x + "px," + coord.y + "px) scale(1.2)";
            this.currentlyDragged.parentElement.append(target.parentElement);
        };
        this.dragEventHandler = (e) => {
            let target = e.target;
            e.preventDefault();
            if (!this.currentlyDragged)
                return;
            var coord = this.getMousePosition(e);
            this.currentlyDragged.style.transform = "translate(" + coord.x + "px," + coord.y + "px) scale(1.2)";
            this.currentlyDragged.setAttribute('x', String(coord.x));
            this.currentlyDragged.setAttribute('y', String(coord.y));
        };
        this.releaseEventHandler = (e) => {
            let target = e.target;
            if (!this.currentlyDragged)
                return;
            let boardPositionId = null;
            for (let boardPostion of this.boardPositions) {
                if (Game.is_colliding(boardPostion, this.currentlyDragged))
                    boardPositionId = boardPostion.id;
            }
            let isValidMove = this.board.droppedFigureAt(boardPositionId);
            if (isValidMove)
                this.emitMyFigureMoved();
            else
                this.currentlyDragged.style.transform = this.currentlyDraggedTransformInitial;
            this.currentlyDragged = undefined;
            this.currentlyDraggedTransformInitial = undefined;
        };
        this.svgBoard = document.getElementById('board');
        //this.svgBoard.querySelectorAll("#figures > g.draggable.player").forEach(e => this.playerFigures.push(<HTMLElement>e));
        document.getElementById('board').querySelectorAll(".position").forEach(e => this.boardPositions.push(e));
        this.createUserEvents();
        this.initSocket();
        this.initSidebar();
    }
    // BEGIN SIDEBAR
    initSidebar() {
        document.getElementById('start_game_btn').addEventListener('click', this.onStartGameButton);
    }
    printUsers(users) {
        let list = document.getElementById('playerList');
        list.innerHTML = '';
        for (let user of users) {
            let newUserItem = document.createElement('li');
            newUserItem.innerText = user;
            list.append(newUserItem);
        }
    }
    // END SIDEBAR
    // BEGIN SOCKET.IO
    initSocket() {
        // @ts-ignore
        this.socket = io('https://clovece-nezlob-se-server.herokuapp.com/');
        //this.socket = io('localhost:3000');
        this.socket.on('your name', this.onMyName);
        this.socket.on('player list', this.onPlayerList);
        this.socket.on('choose color', this.onChooseColor);
        this.socket.on('start game', this.onStartGame);
        this.socket.on('other moved', this.onOtherMoved);
        this.socket.on('your move', this.onMyMove);
    }
    emitMyFigureMoved() {
        console.log('MyFigureMoved');
        this.didMoveFigure = true;
        this.canMoveFigure = false;
        this.socket.emit('figure moved', JSON.stringify(this.board.getMovedFigures()));
        document.getElementById('status').innerText = 'Figure moved';
        if (!this.canThrowThreeTimes && !this.canThrowTwoTimes && !this.canThrowOneTime) {
            this.canMoveFigure = false;
            this.emitMyTurnEnded();
        }
        // Hide dice numbers
        this.svgBoard.querySelectorAll('#dice > g').forEach((e) => e.style.display = "none");
    }
    emitMyTurnEnded() {
        console.log('MyTurnEnded');
        this.myTurn = false;
        this.didMoveFigure = false;
        this.canMoveFigure = false;
        this.startedWithThreeTimesThrow = false;
        this.socket.emit('move ended');
        document.getElementById('status').innerText = 'My turn ended';
        // Hide dice
        this.svgBoard.querySelectorAll('#dice').forEach((e) => e.style.display = "none");
    }
    // END Click Events
    // BEGIN Mouse movement
    createUserEvents() {
        this.svgBoard.addEventListener("mousedown", this.startDragEventHandler);
        this.svgBoard.addEventListener("touchstart", this.startDragEventHandler);
        this.svgBoard.addEventListener("mousemove", this.dragEventHandler);
        this.svgBoard.addEventListener("touchmove", this.dragEventHandler);
        this.svgBoard.addEventListener("mouseup", this.releaseEventHandler);
        this.svgBoard.addEventListener("touchend", this.releaseEventHandler);
        this.svgBoard.addEventListener("click", this.clickEventHandler);
    }
    getMousePosition(evt) {
        var CTM = this.svgBoard.getScreenCTM();
        return {
            x: (evt.clientX - CTM.e) / CTM.a,
            y: (evt.clientY - CTM.f) / CTM.d
        };
    }
    static snapToBoardPosition(figureId, boardPositionId) {
        if (!figureId || !boardPositionId)
            return;
        let boardPositionElement = document.getElementById(boardPositionId);
        let figure = document.getElementById(figureId);
        let boardX = parseInt(boardPositionElement.getAttribute('cx'));
        let boardY = parseInt(boardPositionElement.getAttribute('cy'));
        let targetX, targetY;
        if (boardPositionId.startsWith('win'))
            targetX = boardX + 115, targetY = boardY + 115;
        else
            targetX = boardX + 20, targetY = boardY + 20;
        Game.translateElement(figure, targetX, targetY - 15);
    }
    static translateElement(element, x, y) {
        element.style.transform = "translate(" + x + "px," + y + "px)";
        element.parentElement.append(element);
    }
    static is_colliding(element1, element2) {
        // Div 1 data
        var r1 = element1.getBoundingClientRect(); //BOUNDING BOX OF THE FIRST OBJECT
        var r2 = element2.getBoundingClientRect(); //BOUNDING BOX OF THE SECOND OBJECT
        //CHECK IF THE TWO BOUNDING BOXES OVERLAP
        return !(r2.left > r1.right ||
            r2.right < r1.left ||
            r2.top > r1.bottom ||
            r2.bottom < r1.top);
    }
    ;
}
//# sourceMappingURL=Game.js.map