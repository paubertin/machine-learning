import { Bounds, Point } from "../../../common/interfaces";

const equals = (p1: Point, p2: Point) => {
  return p1[0] === p2[0] && p1[1] === p2[1];
}

const lerp = (a: number, b: number, t: number) => {
  return a + (b - a) * t;
}

const invLerp = (a: number, b: number, v: number) => {
  return (v - a) / (b - a);
}

const remap = (oldA: number, oldB: number, newA: number, newB: number, v: number) => {
  return lerp(newA, newB, invLerp(oldA, oldB, v));
}

const remapPoint = (oldBounds: Bounds, newBounds: Bounds, point: Point): Point => {
  return [
    remap(oldBounds.left, oldBounds.right,
      newBounds.left, newBounds.right, point[0]),
    remap(oldBounds.top, oldBounds.bottom,
      newBounds.top, newBounds.bottom, point[1])
  ];
}

const add = (p1: Point, p2: Point): Point => {
  return [
    p1[0] + p2[0],
    p1[1] + p2[1]
  ];
}

const subtract = (p1: Point, p2: Point): Point => {
  return [
    p1[0] - p2[0],
    p1[1] - p2[1]
  ];
}

const scale = (p: Point, scaler: number): Point => {
  return [
    p[0] * scaler,
    p[1] * scaler
  ];
}

const distance = (p1: Point, p2: Point) => {
  return Math.sqrt(
    (p1[0] - p2[0]) ** 2 +
    (p1[1] - p2[1]) ** 2
  );
}

const formatNumber = (n: number, dec: number = 0) => {
  return n.toFixed(dec);
}

const getNearest = (loc: Point, points: Point[]) => {
  let minDist = Number.MAX_SAFE_INTEGER;
  let nearestIndex = 0;

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const d = distance(loc, point);

    if (d < minDist) {
      minDist = d;
      nearestIndex = i;
    }
  }
  return nearestIndex;
}

export const math = {
  equals,
  lerp,
  invLerp,
  remap,
  remapPoint,
  add,
  subtract,
  scale,
  distance,
  formatNumber,
  getNearest,
};