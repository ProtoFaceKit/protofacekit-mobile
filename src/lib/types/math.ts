export type Point = { x: number; y: number };

export function distance(a: Point, b: Point) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

export function midpoint(a: Point, b: Point) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
