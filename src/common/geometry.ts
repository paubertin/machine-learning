import { Point } from "./interfaces";
import { math } from "./math";

// for all the functions below, assume screen coordinates: the x-axis is rightward, the y-axis is downward

const epsilon = 1e-9;

function almostZero(v: number) {
  return v === 0;
}

/**
 * Finds a point with the lowest vertical position (leftmost wins in case of a tie)
 */
function lowestPoint(points: Point[]) {
  return points.reduce((lowest, point) => {
    if (point[1] > lowest[1]) {
      return point;
    }
    if (point[1] === lowest[1] && point[0] < lowest[0]) {
      return point;
    }
    return lowest;
  });
}

/**
 * Squared distance between two points
 */
function distanceSquared(p1: Point, p2: Point) {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  return dx * dx + dy * dy;
}

/**
 * Determines p2 relative position to p1-p3.
 * 
 * If it is:
 * - to the right then the result is 1,
 * - to the left then the result is -1,
 * - on the line then the result is 0
 */
function getOrientation(p1: Point, p2: Point, p3: Point) {
  const val = (p2[1] - p1[1]) * (p3[0] - p2[0]) - (p2[0] - p1[0]) * (p3[1] - p2[1]);
  if (almostZero(val)) {
    return 0;
  }
  return val > 0 ? 1 : -1;
}

/**
 * Orders points in a counter-clockwise relative to the given origin
 */
function sortPoints(origin: Point, points: Point[]) {
  return points.slice().sort((a, b) => {
    const orientation = getOrientation(origin, a, b);
    if (almostZero(orientation)) {
      return distanceSquared(origin, a) - distanceSquared(origin, b);
    }
    return -orientation;
  });
}

/**
 * Builds a convex hull (a polygon) using the Graham scan algorithm
 * 
 * https://en.wikipedia.org/wiki/Graham_scan
 */
function grahamScan(points: Point[]) {
  const lowest = lowestPoint(points);
  const sorted = sortPoints(lowest, points);

  // initialize the stack with the first three points
  const stack: Point[] = [sorted[0], sorted[1], sorted[2]];

  // iterate over the remaining points
  for (let i = 3; i < sorted.length; i++) {
    let top = stack.length - 1;
    // exclude points from the end
    // until adding a new point won't cause a concave
    // so that the resulting polygon will be convex
    while (top > 0 && getOrientation(stack[top - 1], stack[top], sorted[i]) <= 0) {
      stack.pop();
      top--;
    }
    // add the point
    stack.push(sorted[i]);
  }

  return stack;
}

/**
 * Builds a box with one of the edges being coincident with the edge
 * between hull's points i and j (expected to be neighbors)
 */
function coincidentBox(hull: Point[], i: number, j: number) {
  // a difference between two points (vector that connects them)
  const diff = (a: Point, b: Point): Point => [a[0] - b[0], a[1] - b[1]];
  // a dot product of two vectors
  const dot = (a: Point, b: Point): number => a[0] * b[0] + a[1] * b[1];
  // a length of a vector
  const len = (a: Point): number => Math.sqrt(a[0] * a[0] + a[1] * a[1]);
  // adds two vectors
  const add = (a: Point, b: Point): Point => [a[0] + b[0], a[1] + b[1]];
  // multiplies a vector by a given magnitude
  const mult = (a: Point, n: number): Point => [a[0] * n, a[1] * n];
  // divides a vector by a given magnitude
  const div = (a: Point, n: number): Point => [a[0] / n, a[1] / n];
  // builds a unit vector (one having a length of 1) with the same direction as a given one
  const unit = (a: Point): Point => div(a, len(a));

  const origin = hull[i];
  // build base vectors for a new system of coordinates
  // where the x-axis is coincident with the i-j edge
  const baseX = unit(diff(hull[j], origin));
  // and the y-axis is orthogonal (90 degrees rotation counter-clockwise)
  const baseY: Point = [baseX[1], -baseX[0]];

  let left = 0;
  let right = 0;
  let top = 0;
  let bottom = 0;
  // for every point of a hull
  for (const p of hull) {
    // calculate position relative to the origin
    const n: Point = [p[0] - origin[0], p[1] - origin[1]];
    // calculate position in new axis (rotate)
    const v = [dot(baseX, n), dot(baseY, n)];
    // apply trivial logic for calculating the bounding box
    // as rotation is out of consideration at this point
    left = Math.min(v[0], left);
    top = Math.min(v[1], top);
    right = Math.max(v[0], right);
    bottom = Math.max(v[1], bottom);
  }

  // calculate bounding box vertices back in original screen space
  const vertices = [
    add(add(mult(baseX, left), mult(baseY, top)), origin),
    add(add(mult(baseX, left), mult(baseY, bottom)), origin),
    add(add(mult(baseX, right), mult(baseY, bottom)), origin),
    add(add(mult(baseX, right), mult(baseY, top)), origin),
  ];

  return {
    vertices,
    width: right - left,
    height: bottom - top,
  };
}

/**
 * Determines the minimum (area) bounding box for a given hull (or set of points)
 */
function minimumBoundingBox(points: Point[], hull?: Point[]) {
  if (points.length < 3) {
    return {
      width: 0,
      height: 0,
      vertices: points,
      hull: points,
    };
  }

  hull = hull || grahamScan(points);

  let minArea = Number.MAX_VALUE;
  let result = null;
  for (let i = 0; i < hull.length; ++i) {
    const { vertices, width, height } = coincidentBox(hull, i, (i + 1) % hull.length);
    const area = width * height;
    if (area < minArea) {
      minArea = area;
      result = { vertices, width, height, hull };
    }
  }
  return result as { vertices: Point[]; width: number; height: number; hull: Point[] };
}

function length (polygon: Point[]) {
  let length = 0;
  for (let i = 0; i < polygon.length; ++i) {
    const j = (i + 1) % polygon.length;
    length += math.distance(polygon[i], polygon[j]);
  }
  return length;
}

function triangleArea (A: Point, B: Point, C: Point) {
  const a = math.distance(B, C);
  const b = math.distance(A, C);
  const c = math.distance(A, B);
  const p = (a + b + c) * 0.5;
  const area = Math.sqrt(p * (p -a) * (p - b) * (p - c));
  return area;
}

function area (polygon: Point[]) {
  let area = 0;
  const A = polygon[0];
  for (let i = 1; i < polygon.length - 1; ++i) {
    const B = polygon[i];
    const C = polygon[i + 1];
    area += triangleArea(A, B, C);
  }
  return area;
}

function roundness (polygon: Point[]) {
  const L = length(polygon);
  const A = area(polygon);
  const R = L / (Math.PI * 2);
  const circleArea = Math.PI * R**2;
  const roundness = A / circleArea;
  return isNaN(roundness) ? 0 : roundness;
}

export const Geometry = {
  getOrientation,
  distanceSquared,
  minimumBoundingBox,
  grahamScan,
  coincidentBox,
  sortPoints,
  lowestPoint,
  length,
  area,
  roundness,
};