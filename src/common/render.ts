import { Path } from "./interfaces";

function renderPath (ctx: any, path: Path, color: string = 'black') {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(...path[0]);
  for (let i = 1; i < path.length; ++i) {
    ctx.lineTo(...path[i]);
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

function renderPaths (ctx: any, paths: Path[], color: string = 'black') {
  for (const path of paths) {
    renderPath(ctx, path, color);
  }
}

export const Render = {
  path: renderPath,
  paths: renderPaths,
};