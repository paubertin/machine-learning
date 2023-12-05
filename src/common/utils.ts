import { Styles } from "./interfaces";

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
};

export const Utils = {
  printProgress,
  formatPercent,
  groupBy,
  styles,
};