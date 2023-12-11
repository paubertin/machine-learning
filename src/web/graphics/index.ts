import { Drawing, Point, Styles, StylesWithImages } from "../../common/interfaces";

function drawPoint(ctx: CanvasRenderingContext2D, loc: Point, color: string | CanvasGradient | CanvasPattern = 'black', size: number = 8) {
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.arc(...loc, size / 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawText(ctx: CanvasRenderingContext2D, options: { text: string; loc: Point; align?: CanvasTextAlign; vAlign?: CanvasTextBaseline; size?: number; color?: string }) {
  ctx.textAlign = options.align ?? 'center';
  ctx.textBaseline = options.vAlign ?? 'middle';
  ctx.font = "bold " + (options.size ?? 10) + "px Courier";
  ctx.fillStyle = options.color ?? 'black';
  ctx.fillText(options.text, ...options.loc);
}

function drawImage(ctx: CanvasRenderingContext2D, image: HTMLImageElement, loc: Point) {
  ctx.beginPath();
  ctx.drawImage(image,
    loc[0] - image.width / 2,
    loc[1] - image.height / 2,
    image.width,
    image.height
  );
  ctx.fill();
}

function generateImages(styles: Styles, size: number = 20) {
  for (let label in styles) {
    const style = styles[label as keyof typeof Drawing];
    const canvas = document.createElement("canvas");
    canvas.width = size + 10;
    canvas.height = size + 10;

    const ctx = canvas.getContext("2d")!;
    ctx.beginPath();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = size + "px Courier";

    const colorHueMap: Record<string, number> = {
      red: 0,
      yellow: 60,
      green: 120,
      cyan: 180,
      blue: 240,
      magenta: 300
    };
    const hue = -45 + colorHueMap[style.color];
    if (!isNaN(hue)) {
      ctx.filter = `
           brightness(2)
           contrast(0.3)
           sepia(1)
           brightness(0.7)
           hue-rotate(${hue}deg)
           saturate(3)
           contrast(3)
        `;
    } else {
      ctx.filter = "grayscale(1)";
    }

    ctx.fillText(style.text,
      canvas.width / 2, canvas.height / 2);

    style.image = new Image();
    style.image.src = canvas.toDataURL();
  }
  return styles as StylesWithImages;
}

export const Graphics = {
  drawPoint,
  drawText,
  drawImage,
  generateImages,
};