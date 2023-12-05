import { Bounds, Drawing, Point, Sample, StylesWithImages } from '../../../common/interfaces';
import { Graphics } from './graphics';
import { math } from './math';

export interface ChartOptions {
  size: number;
  axesLabels: string[];
  styles: StylesWithImages;
  transparency?: number;
  icon: string;
}

export class Chart {
  public samples: Required<Sample>[];
  public options: ChartOptions;
  public onClick?: (chart: Chart, sample?: Required<Sample>) => void;
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;

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

  private _hoveredSample: Required<Sample> | undefined = undefined;
  private _selectedSample: Required<Sample> | undefined = undefined;
  private _pixelBounds: Bounds;
  private _dataBounds: Bounds;
  private _defaultDataBounds: Bounds;

  public constructor(container: HTMLElement, samples: Required<Sample>[], options: ChartOptions, onClick?: (chart: Chart, sample?: Required<Sample>) => void) {
    this.samples = samples;
    this.options = options;
    this.onClick = onClick;

    this.canvas = document.createElement('canvas');
    this.canvas.width = options.size;
    this.canvas.height = options.size;
    this.canvas.style.backgroundColor = 'white';
    container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d')!;

    this._pixelBounds = this._getPixelBounds();
    this._dataBounds = this._getDataBounds();
    this._defaultDataBounds = this._getDataBounds();

    this._draw();

    this._addEventListeners();
  }

  _addEventListeners() {
    const { canvas, _dataTrans, _dragInfo } = this;
    canvas.onmousedown = (evt) => {
      const dataLoc = this._getMouse(evt, true);
      _dragInfo.start = dataLoc;
      _dragInfo.dragging = true;
      _dragInfo.end = [0, 0];
      _dragInfo.offset = [0, 0];
    }
    canvas.onmousemove = (evt) => {
      if (_dragInfo.dragging) {
        const dataLoc = this._getMouse(evt, true);
        _dragInfo.end = dataLoc;
        _dragInfo.offset = math.scale(
          math.subtract(
            _dragInfo.start, _dragInfo.end
          ),
          _dataTrans.scale ** 2
        );
        const newOffset = math.add(
          _dataTrans.offset,
          _dragInfo.offset
        );
        this._updateDataBounds(
          newOffset,
          _dataTrans.scale
        );
      }
      const pLoc = this._getMouse(evt);
      const pPoints = this.samples.map(s =>
        math.remapPoint(
          this._dataBounds,
          this._pixelBounds,
          s.point
        )
      );
      const index = math.getNearest(pLoc, pPoints);
      const nearest = this.samples[index];
      const dist = math.distance(pPoints[index], pLoc);
      if (dist < this._margin / 2) {
        this._hoveredSample = nearest;
      } else {
        this._hoveredSample = undefined;
      }

      this._draw();
    }
    canvas.onmouseup = () => {
      _dataTrans.offset = math.add(
        _dataTrans.offset,
        _dragInfo.offset
      );
      _dragInfo.dragging = false;
    }
    canvas.onwheel = (evt) => {
      const dir = Math.sign(evt.deltaY);
      const step = 0.02;
      _dataTrans.scale += dir * step;
      _dataTrans.scale = Math.max(step,
        Math.min(2, _dataTrans.scale)
      );

      this._updateDataBounds(
        _dataTrans.offset,
        _dataTrans.scale
      );

      this._draw();
      evt.preventDefault();
    }
    canvas.onclick = () => {
      if (!math.equals(_dragInfo.offset, [0, 0])) {
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
      this.onClick?.(this, this._selectedSample);
      this._draw();
    }
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
    const bounds = {
      left: minX,
      right: maxX,
      top: maxY,
      bottom: minY
    };
    return bounds;
  }

  _draw() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.globalAlpha = this._transparency;
    this._drawSamples(this.samples);
    ctx.globalAlpha = 1;

    if (this._hoveredSample) {
      this._emphasizeSample(
        this._hoveredSample
      );
    }

    if (this._selectedSample) {
      this._emphasizeSample(
        this._selectedSample, 'yellow'
      );
    }

    this._drawAxes();
  }

  selectSample(id?: number) {
    this._selectedSample = undefined;
    if (id !== undefined) {
      this._selectedSample = this.samples.find((s) => s.id === id);
    }
    this._draw();
  }

  _emphasizeSample(sample: Required<Sample>, color = 'white') {
    const pLoc = math.remapPoint(
      this._dataBounds,
      this._pixelBounds,
      sample.point
    );
    const grd = this.ctx.createRadialGradient(
      ...pLoc, 0, ...pLoc, this._margin
    );
    grd.addColorStop(0, color);
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    Graphics.drawPoint(this.ctx, pLoc, grd, this._margin * 2);
    this._drawSamples(
      [sample]
    );
  }

  _drawAxes() {
    const { ctx, canvas, _axesLabels, _margin } = this;
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

  _drawSamples(samples: Required<Sample>[]) {
    const { ctx, _dataBounds, _pixelBounds } = this;
    for (const sample of samples) {
      const { point, label } = sample;
      const pixelLoc = math.remapPoint(
        _dataBounds, _pixelBounds, point
      );
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
