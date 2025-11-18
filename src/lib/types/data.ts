export interface Face {
    expressions: Partial<Record<ExpressionType, FaceExpression>>;
}

export enum ExpressionType {
    IDLE = 0,
    TALKING = 1,
    TOUCHED = 2,
}

export const EXPRESSION_TYPE_NAME = {
    [ExpressionType.IDLE]: "Idle",
    [ExpressionType.TALKING]: "Talking",
    [ExpressionType.TOUCHED]: "Touched",
};

export interface FaceExpression {
    frames: FaceFrame[];
}

export interface FaceFrame {
    pixels: [number, number, number][];
    duration: number;
}
