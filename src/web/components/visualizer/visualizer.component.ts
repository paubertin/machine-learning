import { math } from "../../../common/math";
import { Layer, NeuralNetwork } from "../../../common/network";
import { BaseComponent, Component } from "../../zen/component";
import { Input, Ref } from "../../zen/decorators";

@Component({
  selector: 'visualizer-component',
  templateUrl: 'components/visualizer/visualizer.component.html',

})
export class Visualizer extends BaseComponent {
  @Ref('container')
  public container!: HTMLDivElement;

  public canvas!: HTMLCanvasElement;

  public ctx!: CanvasRenderingContext2D;

  @Input()
  public network!: NeuralNetwork;

  @Input()
  public outputLabels: any[] = [];


  public override async onInit() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 500;
    this.canvas.height = 500;
    this.ctx = this.canvas.getContext('2d')!;
    this.canvas.style.position = 'absolute';
    this.container.appendChild(this.canvas);

    const margin = 50;
    const left = margin;
    const top = margin;
    const width = this.ctx.canvas.width - margin * 2;
    const height = this.ctx.canvas.height - margin * 2;

    const levelHeight = height / this.network.layers.length;

    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    for (let i = this.network.layers.length - 1; i >= 0; i--) {
      const levelTop =
        top +
        math.lerp(
          height - levelHeight,
          0,
          this.network.layers.length == 1
            ? 0.5
            : i / (this.network.layers.length - 1)
        );

      this.drawLevel(
        this.network.layers[i],
        left,
        levelTop,
        width,
        levelHeight,
        i === this.network.layers.length - 1 ? this.outputLabels : []
      );
    }
  }

  public drawLevel(layer: Layer, left: number, top: number, width: number, height: number, outputLabels: any[]) {
    const right = left + width;
    const bottom = top + height;

    const { inputs, outputs, weights, biases } = layer;

    for (let i = 0; i < inputs.length; i++) {
      for (let j = 0; j < outputs.length; j++) {
        this.ctx.beginPath();
        this.ctx.moveTo(this._getNodeX(inputs, i, left, right), bottom);
        this.ctx.lineTo(this._getNodeX(outputs, j, left, right), top);
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = getRGBA(weights[i][j]);
        this.ctx.stroke();
      }
    }

    const threshold = 10;
    const nodeRadius = 22;
    const smallNodeRadius = 3;
    const outputNodeRadius =
      outputs.length > threshold ? smallNodeRadius : nodeRadius;
    const inputNodeRadius =
      inputs.length > threshold ? smallNodeRadius : nodeRadius;

    for (let i = 0; i < inputs.length; i++) {
      const x = this._getNodeX(inputs, i, left, right);
      this.ctx.beginPath();
      this.ctx.arc(
        x,
        bottom,
        inputs.length > 10 ? inputNodeRadius : nodeRadius,
        0,
        Math.PI * 2
      );
      this.ctx.fillStyle = "black";
      this.ctx.fill();
    }
    for (let i = 0; i < inputs.length; i++) {
      const x = this._getNodeX(inputs, i, left, right);
      this.ctx.beginPath();
      this.ctx.arc(x, bottom, inputNodeRadius * 0.6, 0, Math.PI * 2);
      this.ctx.fillStyle = getRGBA(inputs[i]);
      this.ctx.fill();
    }

    for (let i = 0; i < outputs.length; i++) {
      const x = this._getNodeX(outputs, i, left, right);
      this.ctx.beginPath();
      this.ctx.arc(x, top, outputNodeRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = "black";
      this.ctx.fill();
    }

    for (let i = 0; i < outputs.length; i++) {
      const x = this._getNodeX(outputs, i, left, right);
      this.ctx.beginPath();
      this.ctx.arc(x, top, outputNodeRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = "black";
      this.ctx.fill();

      if (outputLabels[i]) {
        const size = outputNodeRadius * 1.2;
        this.ctx.drawImage(
          outputLabels[i],
          x - size / 2,
          top - size / 2 + size * 0.04,
          size,
          size
        );
      }

      this.ctx.beginPath();
      this.ctx.arc(x, top, outputNodeRadius * 0.6, 0, Math.PI * 2);
      this.ctx.fillStyle = getRGBA(outputs[i]);
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.lineWidth = 2;
      this.ctx.arc(x, top, outputNodeRadius * 0.8, 0, Math.PI * 2);
      this.ctx.strokeStyle = getRGBA(biases[i]);
      this.ctx.stroke();
    }
  }

  private _getNodeX(nodes: Array<number>, index: number, left: number, right: number) {
    return math.lerp(
      left,
      right,
      nodes.length == 1 ? 0.5 : index / (nodes.length - 1)
    );
  }

}


function getRGBA(value: number, maxAlpha = 0.8) {
  const alpha = Math.min(maxAlpha, Math.abs(value));
  const R = value < 0 ? 0 : 255;
  const G = R;
  const B = value > 0 ? 0 : 255;
  return "rgba(" + R + "," + G + "," + B + "," + alpha + ")";
}