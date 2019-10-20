import {BoardPosition} from "./Board.js";

export interface Figure {

    svgId: string;
    color: FigureColor
    defaultPosition?: BoardPosition;

    sittingOn(): BoardPosition;

    moveTo(boardPosition: BoardPosition): void;

    moveToHome(): void;

}

export enum FigureColor {
    Yellow = 'yellow',
    Red = 'red',
    Blue = 'blue',
    Green = 'green'
}


