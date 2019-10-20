import { Game } from "./Game.js";
export class OtherFigure {
    constructor(svgId, color) {
        this.svgId = svgId;
        this.color = color;
    }
    sittingOn() {
        return this._sittingOn;
    }
    moveTo(boardPosition) {
        if (this.defaultPosition == undefined)
            this.defaultPosition = boardPosition;
        if (this._sittingOn)
            this._sittingOn.sittingFigure = undefined;
        this._sittingOn = boardPosition;
        boardPosition.sittingFigure = this;
        Game.snapToBoardPosition(this.svgId, boardPosition.svgId);
    }
    moveToHome() {
        this.moveTo(this.defaultPosition);
    }
}
//# sourceMappingURL=OtherFigure.js.map