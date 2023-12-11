import { Path } from "./interfaces";

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

const inUse: { name: string, function: (paths: Path[]) => any }[] = [
  { name: 'width', function: getWidth },
  { name: 'height', function: getHeight },
  // { name: 'path count', function: getPathCount },
  // { name: 'point count', function: getPointsCount },
];

export const Features = {
  getPathCount,
  getPointsCount,
  getWidth,
  getHeight,
  inUse,
}