import { Bounds, Point } from "./interfaces";

const equals = (p1?: Point | null, p2?: Point | null) => {
  if (!p1 || !p2) {
    return false;
  }
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

const distance = (p1: Array<number>, p2: Array<number>) => {
  if (p1.length !== p2.length) {
    console.error(p1, p2);
    throw new Error('Incompatible dimensions');
  }
  let sqDist = 0;
  for (let i = 0; i < p1.length; ++i) {
    sqDist += (p2[i] - p1[i])**2;
  }
  return sqDist**0.5;
}

const formatNumber = (n: number, dec: number = 0) => {
  return n.toFixed(dec);
}

const getNearest = (loc: Array<number>, points: Array<number>[], k: number = 1) => {
  const sorted = points
    .map((val, idx) => {
      return {
        val,
        idx,
      };
    })
    .sort((a, b) => {
      return distance(loc, a.val) - distance(loc, b.val);
    });
  
  const indices = sorted.map((o) => o.idx);

  return indices.slice(0, k);
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