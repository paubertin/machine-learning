import { math } from "./math";
import { Point, Styles } from "./interfaces";

function printProgress(count: number, max: number) {
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  const percent = formatPercent(count / max);
  process.stdout.write(`${count}/${max} (${percent})`);
}

function formatPercent(val: number) {
  return `${(val * 100).toFixed(2)}%`;
}

function groupBy<T extends Record<string, any>>(arr: T[], key: keyof T) {
  const groups: Record<string, T[]> = {};

  for (let obj of arr) {
    const val = obj[key];
    if (!groups[val]) {
      groups[val] = [];
    }
    groups[val].push(obj);
  }
  return groups;
}

const styles: Styles = {
  car: { color: 'gray', text: '🚗' },
  fish: { color: 'red', text: '🐠' },
  house: { color: 'yellow', text: '🏠' },
  tree: { color: 'green', text: '🌳' },
  bicycle: { color: 'cyan', text: '🚲' },
  guitar: { color: 'blue', text: '🎸' },
  pencil: { color: 'magenta', text: '✏️' },
  clock: { color: 'lightgray', text: '🕒' },
  '?': { color: 'red', text: '❓' },
};

interface MinMax {
  min: number[];
  max: number[];
}

function normalizePoints (points: Point[]): MinMax
function normalizePoints (points: Point[], minMax: MinMax): MinMax
function normalizePoints (points: Point[], minMax?: MinMax) {
  const dimensions = points[0].length;
  let min: MinMax['min'];
  let max: MinMax['max'];

  if (minMax) {
    min = minMax.min;
    max = minMax.max;
  }
  else {
    min = [...points[0]];
    max = [...points[0]];
    for (let i = 1; i < points.length; ++i) {
      for (let j = 0; j < dimensions; ++j) {
        min[j] = Math.min(min[j], points[i][j]);
        max[j] = Math.max(max[j], points[i][j]);
      }
    }
  }

  for (let i = 0; i < points.length; ++i) {
    for (let j = 0; j < dimensions; ++j) {
      points[i][j] = math.invLerp(min[j], max[j], points[i][j]);
    }
  }
  return {
    min,
    max,
  };
}

export const Utils = {
  printProgress,
  formatPercent,
  groupBy,
  styles,
  normalizePoints,
  classes: [ 'car', 'fish', 'house', 'tree', 'bicycle', 'guitar', 'pencil', 'clock' ],
};