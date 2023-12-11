import { Bounds, Drawing, Point, Sample, StylesWithImages } from '../../../common/interfaces';
import { Graphics } from '../../graphics';
import { math } from '../../math';
import { BaseComponent, Component } from '../../zen/component';
import { Input, Ref } from '../../zen/decorators';

export interface ChartOptions {
  size: number;
  axesLabels: string[];
  styles: StylesWithImages;
  transparency?: number;
  icon: string;
}
@Component({
  selector: 'chart-component',
  templateUrl: 'components/chart/chart.component.html',
  styles: 'components/chart/chart.component.scss'
})
export class ChartComponent extends BaseComponent {
  @Ref('chart-container')
  public chartContainer!: HTMLDivElement;

  @Input()
  public samples: Required<Sample>[] = [];

  @Input()
  public options!: ChartOptions;

  @Input()
  public clickchart?: (chart: ChartComponent, sample?: Required<Sample>) => void;

  public canvas!: HTMLCanvasElement;

  public dynamicCanvas!: HTMLCanvasElement;

  public ctx!: CanvasRenderingContext2D;

  public dynamicCtx!: CanvasRenderingContext2D;

  private drawingDynamic: boolean = false;

  private get _transparency() {
    return this.options.transparency ?? 1;
  }

  private get _margin() {
    return this.options.size * 0.11;
  }

  private get _axesLabels() {
    return this.options.axesLabels;
  }

  private get _icon() {
    return this.options.icon;
  }

  private get _styles() {
    return this.options.styles;
  }

  private _dataTrans: {
    offset: Point;
    scale: number;
  } = {
      offset: [0, 0],
      scale: 1
    };

  private _dragInfo: {
    start: Point;
    end: Point;
    offset: Point;
    dragging: boolean;
  } = {
      start: [0, 0],
      end: [0, 0],
      offset: [0, 0],
      dragging: false
    };

  private _hoveredSample?: Required<Sample> = undefined;
  private _selectedSample?: Required<Sample> = undefined;
  private _nearestSamples?: Required<Sample>[] = undefined;
  private _pixelBounds!: Bounds;
  private _dataBounds!: Bounds;
  private _defaultDataBounds!: Bounds;
  private _dynamicPoint?: { point: Point; label: keyof typeof Drawing } = undefined;

  public override async onInit(_data?: Record<string, any> | undefined) {
    this._createCanvas();
    this._pixelBounds = this._getPixelBounds();
    this._dataBounds = this._getDataBounds();
    this._defaultDataBounds = this._getDataBounds();

    this._draw();

    this._addEventListeners();
  }

  public reset () {
    this._dataTrans = {
      offset: [0, 0],
      scale: 1
    };
    this._dragInfo = {
      start: [0, 0],
      end: [0, 0],
      offset: [0, 0],
      dragging: false
    };
    
    this._updateDataBounds(
      this._dataTrans.offset,
      this._dataTrans.scale
    );

    this._draw();
  }

  private _createCanvas() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.dynamicCanvas = document.createElement('canvas');
    this.dynamicCtx = this.dynamicCanvas.getContext('2d')!;
    this.dynamicCanvas.style.position = 'absolute';
    this.canvas.style.position = 'absolute';
    this.chartContainer.appendChild(this.canvas);
    this.chartContainer.appendChild(this.dynamicCanvas);
    this.chartContainer.style.width = `${this.options?.size ?? 200}px`;
    this.chartContainer.style.height = `${this.options?.size ?? 200}px`;
    this.canvas.width = this.options?.size ?? 200;
    this.canvas.height = this.options?.size ?? 200;
    this.dynamicCanvas.width = this.options?.size ?? 200;
    this.dynamicCanvas.height = this.options?.size ?? 200;
    this.canvas.style.backgroundColor = '#ffffff';
    this.dynamicCanvas.style.backgroundColor = '#ffffff00';
  }

  public showDynamicPoint(point: Point, label: keyof typeof Drawing, nearestSamples: Required<Sample>[]) {
    if (!this.drawingDynamic) {
      this.drawingDynamic = true;
      this.options.transparency = 0.1;
      this._draw();
    }
    const isSameAsBefore = math.equals(point, this._dynamicPoint?.point);
    this._dynamicPoint = { point, label };
    this._nearestSamples = nearestSamples;
    if (!isSameAsBefore) {
      this._drawDynamicPoint();
    }
  }

  public hideDynamicPoint() {
    this._dynamicPoint = undefined;
    this.drawingDynamic = false;
    this._nearestSamples = undefined;
    this.options.transparency = 0.7;
    this._draw();
    this._drawDynamicPoint();
  }

  _addEventListeners() {
    const { dynamicCanvas: canvas } = this;
    canvas.onmousedown = (evt) => {
      const dataLoc = this._getMouse(evt, true);
      this._dragInfo.start = dataLoc;
      this._dragInfo.dragging = true;
      this._dragInfo.end = [0, 0];
      this._dragInfo.offset = [0, 0];
    };

    canvas.onmousemove = (evt) => {
      if (this._dragInfo.dragging) {
        const dataLoc = this._getMouse(evt, true);
        this._dragInfo.end = dataLoc;
        this._dragInfo.offset = math.scale(
          math.subtract(
            this._dragInfo.start, this._dragInfo.end
          ),
          this._dataTrans.scale ** 2
        );
        const newOffset = math.add(
          this._dataTrans.offset,
          this._dragInfo.offset
        );
        this._updateDataBounds(
          newOffset,
          this._dataTrans.scale
        );
      }
      const pLoc = this._getMouse(evt);
      const pPoints = this.samples.map(s =>
        math.remapPoint(
          this._dataBounds,
          this._pixelBounds,
          s.point as Point,
        )
      );
      const indices = math.getNearest(pLoc, pPoints);
      const nearest = this.samples[indices[0]];
      const dist = math.distance(pPoints[indices[0]], pLoc);
      if (dist < this._margin / 2) {
        this._hoveredSample = nearest;
      }
      else {
        this._hoveredSample = undefined;
      }

      this._draw();
      this._drawDynamicPoint();
    };

    canvas.onmouseup = () => {
      this._dataTrans.offset = math.add(
        this._dataTrans.offset,
        this._dragInfo.offset
      );
      this._dragInfo.dragging = false;
    };

    canvas.onwheel = (evt) => {
      const dir = Math.sign(evt.deltaY);
      const step = 0.02;
      this._dataTrans.scale += dir * step;
      this._dataTrans.scale = Math.max(step,
        Math.min(2, this._dataTrans.scale)
      );

      this._updateDataBounds(
        this._dataTrans.offset,
        this._dataTrans.scale
      );

      this._draw();
      this._drawDynamicPoint();
      evt.preventDefault();
    };

    canvas.onclick = () => {
      if (!math.equals(this._dragInfo.offset, [0, 0])) {
        return;
      }
      if (this._hoveredSample) {
        if (this._selectedSample === this._hoveredSample) {
          this._selectedSample = undefined;
        }
        else {
          this._selectedSample = this._hoveredSample;
        }
      }
      else {
        this._selectedSample = undefined;
      }
      this.clickchart?.(this, this._selectedSample);
      this._draw();
      this._drawDynamicPoint();
    };
  }

  _updateDataBounds(offset: Point, scale: number) {
    const { _dataBounds, _defaultDataBounds: def } = this;
    _dataBounds.left = def.left + offset[0];
    _dataBounds.right = def.right + offset[0];
    _dataBounds.top = def.top + offset[1];
    _dataBounds.bottom = def.bottom + offset[1];

    const center = [
      (_dataBounds.left + _dataBounds.right) / 2,
      (_dataBounds.top + _dataBounds.bottom) / 2
    ];

    _dataBounds.left = math.lerp(
      center[0],
      _dataBounds.left,
      scale ** 2
    );

    _dataBounds.right = math.lerp(
      center[0],
      _dataBounds.right,
      scale ** 2
    );

    _dataBounds.top = math.lerp(
      center[1],
      _dataBounds.top,
      scale ** 2
    );

    _dataBounds.bottom = math.lerp(
      center[1],
      _dataBounds.bottom,
      scale ** 2
    );
  }

  _getMouse = (evt: MouseEvent, dataSpace = false) => {
    const rect = this.canvas.getBoundingClientRect();
    const pixelLoc: Point = [
      evt.clientX - rect.left,
      evt.clientY - rect.top
    ];
    if (dataSpace) {
      const dataLoc = math.remapPoint(
        this._pixelBounds,
        this._defaultDataBounds,
        pixelLoc
      );
      return dataLoc;
    }
    return pixelLoc;
  }

  _getPixelBounds() {
    const { canvas, _margin } = this;
    const bounds = {
      left: _margin,
      right: canvas.width - _margin,
      top: _margin,
      bottom: canvas.height - _margin
    };
    return bounds;
  }

  _getDataBounds() {
    const { samples } = this;
    const x = samples.map(s => s.point[0]);
    const y = samples.map(s => s.point[1]);
    const minX = Math.min(...x);
    const maxX = Math.max(...x);
    const minY = Math.min(...y);
    const maxY = Math.max(...y);
    const deltaX = maxX - minX;
    const deltaY = maxY - minY;
    const bounds = {
      left: minX,
      right: maxX,
      top: maxY,
      bottom: minY
    };
    return bounds;
  }

  _draw() {
    const { ctx: ctx, canvas: canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.globalAlpha = this._transparency;
    this._drawSamples(ctx, this.samples);
    ctx.globalAlpha = 1;

    if (this._hoveredSample) {
      this._emphasizeSample(
        ctx,
        this._hoveredSample
      );
    }

    if (this._selectedSample) {
      this._emphasizeSample(
        ctx,
        this._selectedSample, 'yellow'
      );
    }

    this._drawAxes(ctx, canvas);
  }

  private _drawDynamicPoint() {
    const { dynamicCtx: ctx, dynamicCanvas: canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (this._dynamicPoint) {
      const pixelLoc = math.remapPoint(
        this._dataBounds,
        this._pixelBounds,
        this._dynamicPoint.point,
      );
      this._nearestSamples?.forEach((sample) => {
        ctx.beginPath();
        ctx.moveTo(...pixelLoc);
        ctx.lineTo(...math.remapPoint(this._dataBounds, this._pixelBounds, sample.point as Point));
        ctx.stroke();
      });
      Graphics.drawImage(ctx, this._styles[this._dynamicPoint.label].image, pixelLoc);
    }

  }

  selectSample(sample?: Required<Sample>) {
    this._selectedSample = undefined;
    if (sample !== undefined) {
      this._selectedSample = sample;
    }
    this._draw();
  }

  _emphasizeSample(ctx: CanvasRenderingContext2D, sample: Required<Sample>, color = 'white') {
    const pLoc = math.remapPoint(
      this._dataBounds,
      this._pixelBounds,
      sample.point as Point,
    );
    const grd = ctx.createRadialGradient(
      ...pLoc, 0, ...pLoc, this._margin
    );
    grd.addColorStop(0, color);
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    Graphics.drawPoint(ctx, pLoc, grd, this._margin * 2);
    this._drawSamples(
      ctx,
      [sample]
    );
  }

  _drawAxes(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    const { _axesLabels, _margin } = this;
    const { left, right, top, bottom } = this._pixelBounds;

    ctx.clearRect(0, 0, this.canvas.width, _margin);
    ctx.clearRect(0, 0, _margin, this.canvas.height);
    ctx.clearRect(this.canvas.width - _margin, 0,
      _margin, this.canvas.height
    );
    ctx.clearRect(0, this.canvas.height - _margin,
      this.canvas.width, _margin
    );

    Graphics.drawText(ctx, {
      text: _axesLabels[0],
      loc: [canvas.width / 2, bottom + _margin / 2],
      size: _margin * 0.6
    });

    ctx.save();
    ctx.translate(left - _margin / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    Graphics.drawText(ctx, {
      text: _axesLabels[1],
      loc: [0, 0],
      size: _margin * 0.6
    });
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(left, bottom);
    ctx.lineTo(right, bottom);
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'lightgray';
    ctx.stroke();
    ctx.setLineDash([]);

    const dataMin = math.remapPoint(
      this._pixelBounds,
      this._dataBounds,
      [left, bottom]
    );
    Graphics.drawText(ctx, {
      text: math.formatNumber(dataMin[0], 2),
      loc: [left, bottom],
      size: _margin * 0.3,
      align: 'left',
      vAlign: 'top'
    });
    ctx.save();
    ctx.translate(left, bottom);
    ctx.rotate(-Math.PI / 2);
    Graphics.drawText(ctx, {
      text: math.formatNumber(dataMin[1], 2),
      loc: [0, 0],
      size: _margin * 0.3,
      align: 'left',
      vAlign: 'bottom'
    });
    ctx.restore();

    const dataMax = math.remapPoint(
      this._pixelBounds,
      this._dataBounds,
      [right, top]
    );
    Graphics.drawText(ctx, {
      text: math.formatNumber(dataMax[0], 2),
      loc: [right, bottom],
      size: _margin * 0.3,
      align: 'right',
      vAlign: 'top'
    });
    ctx.save();
    ctx.translate(left, top);
    ctx.rotate(-Math.PI / 2);
    Graphics.drawText(ctx, {
      text: math.formatNumber(dataMax[1], 2),
      loc: [0, 0],
      size: _margin * 0.3,
      align: 'right',
      vAlign: 'bottom'
    });
    ctx.restore();
  }

  _drawSamples(ctx: CanvasRenderingContext2D, samples: Required<Sample>[]) {
    const { _dataBounds, _pixelBounds } = this;
    for (const sample of samples) {
      const { point, label } = sample;
      const pixelLoc = math.remapPoint(_dataBounds, _pixelBounds, point as Point);
      switch (this._icon) {
        case 'image':
          Graphics.drawImage(ctx,
            this._styles[label as keyof typeof Drawing].image,
            pixelLoc
          );
          break;
        case 'text':
          Graphics.drawText(ctx, {
            text: this._styles[label as keyof typeof Drawing].text,
            loc: pixelLoc,
            size: 20
          });
          break;
        default:
          Graphics.drawPoint(ctx, pixelLoc,
            this._styles[label as keyof typeof Drawing].color);
          break;
      }
    }
  }
}
