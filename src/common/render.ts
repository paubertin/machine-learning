import { Path } from "./interfaces";

function renderPath (ctx: any, path: Path, color: string = 'black', width: number = 3) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(...path[0]);
  for (let i = 1; i < path.length; ++i) {
    ctx.lineTo(...path[i]);
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

function renderPaths (ctx: any, paths: Path[], color: string = 'black', width: number = 3) {
  for (const path of paths) {
    renderPath(ctx, path, color, width);
  }
}

function text (ctx: any, text: string, color: string = 'black', loc = [0, 0], size = 100) {
  ctx.font = `bold ${size}px Courier`;
  ctx.textBaseLine = 'top';
  ctx.fillStyle = color;
  ctx.fillText(text, ...loc);
}

export const Render = {
  path: renderPath,
  paths: renderPaths,
  text,
};