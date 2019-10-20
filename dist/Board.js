import { FigureColor } from "./Figure.js";
import { PlayerFigure } from "./PlayerFigure.js";
export class Board {
    constructor(playerColor) {
        //this.svgBoard.querySelectorAll("#figures > g.draggable.player").forEach(e => this.playerFigures.push(<PlayerFigure>e));
        //this.svgBoard.querySelectorAll("#figures > g.draggable.other").forEach(e => this.playerFigures.push(<PlayerFigure>e));
        //this.svgBoard.querySelectorAll(".position").forEach(e => this.boardPositions.push(<BoardPosition>e));
        this.thrownDiceNumber = 6;
        this.turnMovement = [];
        this.myTurn = () => {
            this.thrownDiceNumber = null;
        };
        this.numberOfDiceTries = () => {
            let numberOfFiguresInHolder = 0;
            let numberOfFiguresInFinish = 0;
            for (let figure of this.boardMap.figures) {
                if (figure.color == this.playerColor)
                    if (figure.sittingOn() == figure.defaultPosition)
                        numberOfFiguresInHolder++;
            }
            for (let figure of this.boardMap.figures) {
                if (figure.color == this.playerColor)
                    if (figure.sittingOn().svgId.includes('win'))
                        numberOfFiguresInFinish++;
            }
            if (numberOfFiguresInHolder == 4)
                return 3;
            else if (numberOfFiguresInHolder + numberOfFiguresInFinish == 4)
                return 3;
            else
                return 1;
        };
        this.startedDraggingFigure = (figureId) => {
            if (!figureId.includes(this.playerColor))
                return false;
            for (let figure of this.boardMap.figures)
                if (figure.svgId == figureId)
                    this.currentlyDragged = figure;
            console.log(this.currentlyDragged.sittingOn());
            return true;
        };
        this.droppedFigureAt = (boardPositionId) => {
            if (boardPositionId == null)
                return false;
            let targetBoardPosition = this.boardMap.findBoardPositionByIdInMyPath(boardPositionId);
            //console.log(this.boardMap.myPathToWin)
            if (targetBoardPosition == null)
                return false;
            let isValidMove = this.isValidMove(this.currentlyDragged, targetBoardPosition);
            if (isValidMove) {
                this.turnMovement.push(new FigureMovement(this.currentlyDragged.svgId, targetBoardPosition.svgId));
                this.currentlyDragged.moveTo(targetBoardPosition);
                console.log(targetBoardPosition);
            }
            else {
                console.log('Invalid Move');
            }
            this.currentlyDragged = undefined;
            return isValidMove;
        };
        this.playerColor = playerColor;
        this.initBoardMap();
    }
    initBoardMap() {
        this.boardMap = new BoardMap();
        this.boardMap.generateBoard();
        this.boardMap.generateMyPath(this.playerColor);
        console.log(this.boardMap);
    }
    throwDice() {
        let min = Math.ceil(1);
        let max = Math.floor(6);
        this.thrownDiceNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        return this.thrownDiceNumber;
    }
    updateMovedFigures(moves) {
        console.log("GOT BOARD STATE");
        this.turnMovement = moves;
        for (let singleMove of moves) {
            this.boardMap.findFigureById(singleMove.figureId).moveTo(this.boardMap.findBoardPositionById(singleMove.movedToId));
        }
    }
    getMovedFigures() {
        return this.turnMovement;
    }
    isValidMove(currentlyDragged, targetBoardPosition) {
        let currentBoardPosition = currentlyDragged.sittingOn();
        if (currentBoardPosition.type == PositionType.PlayerHolder && this.thrownDiceNumber == 6) {
            // Is player dropping figure on start position?
            if (targetBoardPosition.type != PositionType.PlayerStart)
                return false;
            // Is target position occupied ? If so, is it my figure or other player ?
            if (targetBoardPosition.sittingFigure)
                if (targetBoardPosition.sittingFigure.color == this.playerColor)
                    return false;
                else
                    this.moveOtherFigureToHolder(targetBoardPosition.sittingFigure);
            return true;
        }
        else if (currentBoardPosition.type == PositionType.Normal || currentBoardPosition.type == PositionType.PlayerStart) {
            let nextBoardPosition = currentBoardPosition;
            for (let i = 0; i < this.thrownDiceNumber; i++)
                nextBoardPosition = nextBoardPosition.next;
            // Is player dropping figure on next position defined by dice number ?
            if (targetBoardPosition.svgId != nextBoardPosition.svgId)
                return false;
            // Is target position occupied ? If so, is it my figure or other player ?
            if (targetBoardPosition.sittingFigure)
                if (targetBoardPosition.sittingFigure.color == this.playerColor)
                    return false;
                else
                    this.moveOtherFigureToHolder(targetBoardPosition.sittingFigure);
            return true;
        }
        else if (currentBoardPosition.type == PositionType.PlayerFinish) {
            let nextBoardPosition = currentBoardPosition;
            for (let i = 0; i < this.thrownDiceNumber; i++)
                if (nextBoardPosition.next)
                    nextBoardPosition = nextBoardPosition.next;
            // Is player dropping figure on next position defined by dice number ?
            if (targetBoardPosition.svgId != nextBoardPosition.svgId)
                return false;
            // Is target position occupied ?
            if (targetBoardPosition.sittingFigure)
                if (targetBoardPosition.sittingFigure.color == this.playerColor)
                    return false;
            return true;
        }
        return false;
    }
    moveOtherFigureToHolder(sittingFigure) {
        this.turnMovement.push(new FigureMovement(sittingFigure.svgId, sittingFigure.defaultPosition.svgId));
        sittingFigure.moveToHome();
    }
}
export var PositionType;
(function (PositionType) {
    PositionType[PositionType["PlayerHolder"] = 0] = "PlayerHolder";
    PositionType[PositionType["PlayerStart"] = 1] = "PlayerStart";
    PositionType[PositionType["Normal"] = 2] = "Normal";
    PositionType[PositionType["PlayerFinish"] = 3] = "PlayerFinish";
    PositionType[PositionType["OtherHolder"] = 4] = "OtherHolder";
    PositionType[PositionType["OtherStart"] = 5] = "OtherStart";
    PositionType[PositionType["OtherFinish"] = 6] = "OtherFinish";
})(PositionType || (PositionType = {}));
export class BoardPosition {
    constructor(id, type, sittingFigure) {
        this.svgId = id;
        this.type = type;
        this.sittingFigure = sittingFigure;
    }
}
export class FigureMovement {
    constructor(figureId, movedToId) {
        this.figureId = figureId;
        this.movedToId = movedToId;
    }
}
export class BoardMap {
    constructor() {
        this.yellowHolders = [];
        this.yellowFinishes = [];
        this.redHolders = [];
        this.redFinishes = [];
        this.greenHolders = [];
        this.greenFinishes = [];
        this.blueHolders = [];
        this.blueFinishes = [];
        this.boardPositions = [];
        this.figures = [];
        this.myPathToWin = [];
    }
    generateBoard() {
        for (let i = 0; i < 16; i++) {
            if (i < 4) {
                let yellowFigure = new PlayerFigure('figure_yellow_' + i, FigureColor.Yellow);
                let yellowHolder = new BoardPosition('start_position_' + i, PositionType.PlayerHolder);
                this.figures.push(yellowFigure);
                this.yellowHolders.push(yellowHolder);
                this.yellowFinishes.push(new BoardPosition('win_position_' + i, PositionType.PlayerFinish));
                yellowFigure.moveTo(yellowHolder);
            }
            else if (i < 8) {
                let redFigure = new PlayerFigure('figure_red_' + i, FigureColor.Red);
                let redHolder = new BoardPosition('start_position_' + i, PositionType.PlayerHolder);
                this.figures.push(redFigure);
                this.redHolders.push(redHolder);
                this.redFinishes.push(new BoardPosition('win_position_' + i, PositionType.PlayerFinish));
                redFigure.moveTo(redHolder);
            }
            else if (i < 12) {
                let greenFigure = new PlayerFigure('figure_green_' + i, FigureColor.Green);
                let greenHolder = new BoardPosition('start_position_' + i, PositionType.PlayerHolder);
                this.figures.push(greenFigure);
                this.greenHolders.push(greenHolder);
                this.greenFinishes.push(new BoardPosition('win_position_' + i, PositionType.PlayerFinish));
                greenFigure.moveTo(greenHolder);
            }
            else if (i < 16) {
                let blueFigure = new PlayerFigure('figure_blue_' + i, FigureColor.Blue);
                let blueHolder = new BoardPosition('start_position_' + i, PositionType.PlayerHolder);
                this.figures.push(blueFigure);
                this.blueHolders.push(blueHolder);
                this.blueFinishes.push(new BoardPosition('win_position_' + i, PositionType.PlayerFinish));
                blueFigure.moveTo(blueHolder);
            }
        }
        for (let i = 0; i < 40; i++) {
            if (i % 10 == 0)
                this.boardPositions.push(new BoardPosition('pos_' + i, PositionType.PlayerStart));
            else
                this.boardPositions.push(new BoardPosition('pos_' + i, PositionType.Normal));
        }
    }
    generateMyPath(color) {
        if (color == FigureColor.Yellow) {
            for (let i = 0; i < 40; i++) {
                this.myPathToWin.push(this.boardPositions[i]);
                if (i != 0)
                    this.myPathToWin[i - 1].next = this.myPathToWin[i];
            }
        }
        else if (color == FigureColor.Red) {
            for (let i = 10; i < 40; i++) {
                this.myPathToWin.push(this.boardPositions[i]);
                if (i != 10)
                    this.myPathToWin[i - 1 - 10].next = this.myPathToWin[i - 10];
            }
            for (let i = 0; i < 10; i++) {
                this.myPathToWin.push(this.boardPositions[i]);
                this.myPathToWin[i - 1 + 30].next = this.myPathToWin[i + 30];
            }
        }
        else if (color == FigureColor.Blue) {
            for (let i = 20; i < 40; i++) {
                this.myPathToWin.push(this.boardPositions[i]);
                if (i != 20)
                    this.myPathToWin[i - 1 - 20].next = this.myPathToWin[i - 20];
            }
            for (let i = 0; i < 20; i++) {
                this.myPathToWin.push(this.boardPositions[i]);
                this.myPathToWin[i - 1 + 20].next = this.myPathToWin[i + 20];
            }
        }
        else if (color == FigureColor.Green) {
            for (let i = 30; i < 40; i++) {
                this.myPathToWin.push(this.boardPositions[i]);
                if (i != 30)
                    this.myPathToWin[i - 1 - 30].next = this.myPathToWin[i - 30];
            }
            for (let i = 0; i < 30; i++) {
                this.myPathToWin.push(this.boardPositions[i]);
                this.myPathToWin[i - 1 + 10].next = this.myPathToWin[i + 10];
            }
        }
        if (color == FigureColor.Yellow) {
            for (let i = 0; i < 4; i++) {
                this.myPathToWin.push(this.yellowFinishes[i]);
                this.myPathToWin[39 + i].next = this.myPathToWin[40 + i];
            }
        }
        else if (color == FigureColor.Red) {
            for (let i = 0; i < 4; i++) {
                this.myPathToWin.push(this.redFinishes[i]);
                this.myPathToWin[39 + i].next = this.myPathToWin[40 + i];
            }
        }
        else if (color == FigureColor.Green) {
            for (let i = 0; i < 4; i++) {
                this.myPathToWin.push(this.greenFinishes[i]);
                this.myPathToWin[39 + i].next = this.myPathToWin[40 + i];
            }
        }
        else if (color == FigureColor.Blue) {
            for (let i = 0; i < 4; i++) {
                this.myPathToWin.push(this.blueFinishes[i]);
                this.myPathToWin[39 + i].next = this.myPathToWin[40 + i];
            }
        }
    }
    findBoardPositionById(boardPositionId) {
        for (let boardPosition of this.boardPositions)
            if (boardPosition.svgId == boardPositionId)
                return boardPosition;
        for (let winPosition of this.yellowFinishes)
            if (winPosition.svgId == boardPositionId)
                return winPosition;
        for (let winPosition of this.redFinishes)
            if (winPosition.svgId == boardPositionId)
                return winPosition;
        for (let winPosition of this.greenFinishes)
            if (winPosition.svgId == boardPositionId)
                return winPosition;
        for (let winPosition of this.blueFinishes)
            if (winPosition.svgId == boardPositionId)
                return winPosition;
        for (let holderPosition of this.yellowHolders)
            if (holderPosition.svgId == boardPositionId)
                return holderPosition;
        for (let holderPosition of this.redHolders)
            if (holderPosition.svgId == boardPositionId)
                return holderPosition;
        for (let holderPosition of this.greenHolders)
            if (holderPosition.svgId == boardPositionId)
                return holderPosition;
        for (let holderPosition of this.blueHolders)
            if (holderPosition.svgId == boardPositionId)
                return holderPosition;
    }
    findBoardPositionByIdInMyPath(boardPositionId) {
        for (let boardPosition of this.myPathToWin)
            if (boardPosition.svgId == boardPositionId)
                return boardPosition;
    }
    findFigureById(figureId) {
        for (let figure of this.figures)
            if (figure.svgId == figureId)
                return figure;
    }
    toArray() {
        return {
            yellowHolders: this.yellowHolders,
            yellowFinishes: this.yellowFinishes,
            redHolders: this.redHolders,
            redFinishes: this.redFinishes,
            greenHolders: this.greenHolders,
            greenFinishes: this.greenFinishes,
            blueHolders: this.blueHolders,
            blueFinishes: this.blueFinishes,
            boardPositions: this.boardPositions,
            figures: this.figures
        };
    }
    fromArray(state) {
        this.yellowHolders = state.yellowHolders;
        this.yellowFinishes = state.yellowFinishes;
        this.redHolders = state.redHolders;
        this.redFinishes = state.redFinishes;
        this.greenHolders = state.greenHolders;
        this.greenFinishes = state.greenFinishes;
        this.blueHolders = state.blueHolders;
        this.blueFinishes = state.blueFinishes;
        this.boardPositions = state.boardPositions;
        this.figures = state.figures;
    }
}
//# sourceMappingURL=Board.js.map