export interface Face {
    expressions: Partial<Record<ExpressionType, FaceExpression>>;
}

export enum ExpressionType {
    IDLE = 0,
    TALKING = 1,
    TOUCHED = 2,
}

export const ALL_EXPRESSIONS = [
    ExpressionType.IDLE,
    ExpressionType.TALKING,
    ExpressionType.TOUCHED,
];

export const EXPRESSION_TYPE_NAME = {
    [ExpressionType.IDLE]: "Idle",
    [ExpressionType.TALKING]: "Talking",
    [ExpressionType.TOUCHED]: "Touched",
};

export interface FaceExpression {
    frames: FaceFrame[];
}

export interface FaceFrame {
    pixels: Pixel[];
    duration: number;
}

/**
 * RGB pixel values (0-255), the pixel itself should be
 * considered always immutable instead the outer pixels
 * array should be changed to replace a pixel
 */
export type Pixel = readonly [number, number, number];
