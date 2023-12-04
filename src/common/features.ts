import { Path } from "./interfaces";

function getPathCount (paths: Path[]) {
  return paths.length;
}

function getPointsCount (paths: Path[]) {
  return paths.flat().length;
}

export const Features = {
  getPathCount,
  getPointsCount,
}