import { CONSTANTS } from "./constants";
import { Geometry } from "./geometry";
import { Path, Point } from "./interfaces";
import { createCanvas } from 'canvas';
import { Render } from "./render";
import { math } from "./math";

function getPathCount (paths: Path[]) {
  return paths.length;
}

function getPointsCount (paths: Path[]) {
  return paths.flat().length;
}

function getWidth (paths: Path[]) {
  const points = paths.flat();
  const x = points.map((p) => p[0]);
  const min = Math.min(...x);
  const max = Math.max(...x);
  return max - min;
}

function getHeight (paths: Path[]) {
  const points = paths.flat();
  const y = points.map((p) => p[1]);
  const min = Math.min(...y);
  const max = Math.max(...y);
  return max - min;
}

function getElongation (paths: Path[]) {
  const points = paths.flat();
  const {  width, height } = Geometry.minimumBoundingBox(points);
  const min = Math.min(width, height);
  const max = Math.max(width, height);
  return (max + 1) / (min + 1); 
}

function getRoundness (paths: Path[]) {
  const points = paths.flat();
  const { hull } = Geometry.minimumBoundingBox(points);
  return Geometry.roundness(hull);
}

function getPixels (paths: Path[], size = CONSTANTS.canvasWidth, expand = true) {
  let canvas = null;
  try {
    canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
  }
  catch (_err) {
    canvas = createCanvas(size, size);
  }

  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

  if (expand) {
    const points = paths.flat();
    const bounds = {
      left: Math.min(...points.map((p) => p[0])),
      right: Math.max(...points.map((p) => p[0])),
      top: Math.min(...points.map((p) => p[1])),
      bottom: Math.max(...points.map((p) => p[1])),
    };

    const newPaths: Path[] = [];
    for (const path of paths) {
      const newPoints: Point[] = path.map((p) => [
        math.invLerp(bounds.left, bounds.right, p[0]) * size,
        math.invLerp(bounds.top, bounds.bottom, p[1]) * size,
      ]);
      newPaths.push(newPoints);
    }
    Render.paths(ctx, newPaths);
  }
  else {
    Render.paths(ctx, paths);
  }

  const imgData = ctx.getImageData(0, 0, size, size);
  return imgData.data.filter((_v, i) => i % 4 === 3)
}

function getComplexity (paths: Path[]) {
  const pixels = getPixels(paths);
  return pixels.filter((a) => a !== 0).length;
}

const inUse: { name: string, function: (paths: Path[]) => any }[] = [
  { name: 'width', function: getWidth },
  { name: 'height', function: getHeight },
  { name: 'elongation', function: getElongation },
  { name: 'roundness', function: getRoundness },
  { name: 'complexity', function: getComplexity },
  // { name: 'path count', function: getPathCount },
  // { name: 'point count', function: getPointsCount },
];

export const Features = {
  getPathCount,
  getPointsCount,
  getWidth,
  getHeight,
  inUse,
  getElongation,
  getPixels,
}