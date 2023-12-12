import { Drawing, Sample, StylesWithImages, TestingSample } from "../../../common/interfaces";
import { math } from "../../../common/math";
import { BaseComponent, Component } from "../../zen/component";
import { Input, Ref } from "../../zen/decorators";

export interface ConfusionOptions {
  size: number;
  axesLabels: string[];
  styles: StylesWithImages;
  transparency?: number;
  icon: string;
  background?: HTMLImageElement;
}

@Component({
  selector: 'confusion-component',
  templateUrl: 'components/confusion/confusion.component.html',
  styles: 'components/confusion/confusion.component.scss'
})
export class Confusion extends BaseComponent {
  @Ref('table-container')
  public table!: HTMLTableElement;

  @Ref('top-text')
  public topText!: HTMLDivElement;

  @Ref('left-text')
  public leftText!: HTMLDivElement;

  @Input()
  public samples: TestingSample[] = [];

  @Input()
  public options!: ConfusionOptions;

  @Input()
  public classes!: string[];

  public matrix: any[][]= [];

  public get N () {
    return this.classes.length + 1;
  }

  public get cellSize () {
    return this.options.size / (this.N + 1);
  }

  public override async onInit() {
    this.table.style.marginLeft = `${this.cellSize}px`;
    this.table.style.marginTop = `${this.cellSize}px`;

    this.topText.style.height = `${this.cellSize}px`;
    this.topText.style.display = 'flex';
    this.topText.style.alignItems = 'center';
    this.topText.style.marginLeft = (this.cellSize / 2) + 'px';

    this.leftText.style.height = `${this.cellSize}px`;
    this.leftText.style.display = 'flex';
    this.leftText.style.alignItems = 'center';
    this.leftText.style.marginLeft = (this.cellSize / 2) + 'px';


    this.matrix = this._prepareMatrix();
    this._fillTable();
  }

  private _prepareMatrix () {
    const mat: any[][] = [];
    for (let i = 0; i < this.N; ++i) {
      mat[i] = [];
      for (let j = 0; j < this.N; ++j) {
        mat[i][j] = 0;
      }
    }

    for (const sample of this.samples) {
      mat[this.classes.indexOf(sample.truth) + 1][this.classes.indexOf(sample.label) + 1]++;
    }

    for (let i = 1; i < this.N; ++i) {
      for (let j = 1;j < this.N; ++j) {
        mat[0][j] += mat[i][j];
        mat[i][0] += mat[i][j];
      }
    }

    for (let i = 1; i < this.N; ++i) {
      mat[0][i] -= mat[i][0];
      if (mat[0][i] > 0) {
        mat[0][i] = '+' + mat[0][i];
      }
    }

    mat[0][0] = '';

    return mat;
  }

  private _fillTable () {

    const values = this.matrix.slice(1).map((t) => t.slice(1)).flat();

    const min = Math.min(...values);
    const max = Math.max(...values);

    for (let i = 0; i < this.N; ++i) {
      const row = document.createElement('tr');
      this.table.appendChild(row);
      for (let j = 0; j < this.N; ++j) {
        const cell = document.createElement('td');
        cell.style.width = this.cellSize + 'px';
        cell.style.height = this.cellSize + 'px';
        cell.style.padding = '0';
        cell.textContent = `${this.matrix[i][j]}`;

        if (i === 0 && j > 0) {
          cell.style.backgroundImage = `url(${this.options.styles[this.classes[j - 1] as keyof typeof Drawing].image.src})`;
          cell.style.backgroundRepeat = 'no-repeat';
          cell.style.backgroundPosition = '50% 20%';
          cell.style.verticalAlign = 'bottom';
          cell.style.fontWeight = 'bold';
          const p = 2 * this.matrix[i][j] / this.matrix[j][i];
          const red = p >= 0 ? p * 255 : 0;
          const blue = p <= 0 ? -p * 255 : 0;
          cell.style.color = `rgb(${red},0,${blue})`;
        }
        if (j === 0 && i > 0) {
          cell.style.backgroundImage = `url(${this.options.styles[this.classes[i - 1] as keyof typeof Drawing].image.src})`;
          cell.style.backgroundRepeat = 'no-repeat';
          cell.style.backgroundPosition = '50% 20%';
          cell.style.verticalAlign = 'bottom';
          cell.style.fontWeight = 'bold';
        }

        if (i > 0 && j > 0) {
          const p = math.invLerp(min, max, this.matrix[i][j]);
          if (i === j) {
            cell.style.backgroundColor = `rgba(0, 0, 255, ${p})`;
          }
          else {
            cell.style.backgroundColor = `rgba(255, 0, 0, ${p})`;
          }
        }

        row.appendChild(cell);
      }
    }
  }

}