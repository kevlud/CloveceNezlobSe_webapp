import {Figure, FigureColor} from "./Figure.js";
import {BoardPosition} from "./Board.js";
import {Game} from "./Game.js";


export class PlayerFigure implements Figure {

    private _sittingOn?: BoardPosition;
    public defaultPosition?: BoardPosition;
    public svgId: string;
    public color: FigureColor;

    constructor(svgId: string, color: FigureColor) {
        this.svgId = svgId;
        this.color = color
    }

    sittingOn(): BoardPosition {
        return this._sittingOn;
    }

    moveTo(boardPosition: BoardPosition) {
        if (this.defaultPosition == undefined)
            this.defaultPosition = boardPosition;

        if (this._sittingOn)
            this._sittingOn.sittingFigure = undefined;

        this._sittingOn = boardPosition;
        boardPosition.sittingFigure = this;

        Game.snapToBoardPosition(this.svgId, boardPosition.svgId)
    }

    moveToHome() {
        this.moveTo(this.defaultPosition)
    }

}
