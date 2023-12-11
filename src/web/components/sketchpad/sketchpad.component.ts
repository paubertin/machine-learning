import { Render } from "../../../common/render.ts";
import { CONSTANTS } from "../../../common/constants.ts";
import { Path, Point, StudentData } from "../../../common/interfaces.ts";
import { BaseComponent, Component } from "../../zen/component.ts";
import { Input, Ref } from "../../zen/decorators.ts";

@Component({
  selector: 'sketchpad-component',
  templateUrl: 'components/sketchpad/sketchpad.component.html',
  styles: 'components/sketchpad/sketchpad.component.scss'
})
export class SketchPad extends BaseComponent {
  public instructions: string = 'Initial value for instructions';

  /*
  @Ref('next')
  public nextButton!: HTMLButtonElement;

  @Ref('instructions')
  public instructionsElement!: HTMLSpanElement;
  */

  @Ref('sketchPadContainer')
  public container!: HTMLDivElement;

  @Ref('canvas')
  public canvas!: HTMLCanvasElement;
  public ctx!: CanvasRenderingContext2D;

  @Ref('undo')
  public undoBtn!: HTMLButtonElement;

  @Ref('clear')
  public clearBtn!: HTMLButtonElement;

  @Input()
  public onUpdate?: (paths: Path[]) => void;

  public isDrawing: boolean = false;
  public paths: Path[] = [];

  public data!: StudentData;

  private _mousePosition: Point | null = null;

  public labels = [
    'car',
    'fish',
    'house',
    'tree',
    'bicycle',
    'guitar',
    'pencil',
    'clock',
  ];

  public index: number = 0;

  public override async onInit(data?: Record<string, any>) {
    this.data = {
      student: data?.student,
      session: new Date().getTime(),
      drawings: {},
    };
    this.canvas.width = CONSTANTS.canvasWidth;
    this.canvas.height = CONSTANTS.canvasHeight;
    this.canvas.style.backgroundColor = 'white';
    this.canvas.style.boxShadow = '0px 0px 10px 2px black';

    this.undoBtn.disabled = true;
    this.clearBtn.disabled = true;

    // this.nextButton.disabled = true;

    this.ctx = this.canvas.getContext('2d')!;

    this._updateInstructions();

    this.bindEvents();
  }

  private _updateInstructions() {
    // this.instructionsElement.innerHTML = `Please draw a ${this.labels[this.index]}`;
  }

  public next() {
    const label = this.labels[this.index];
    this.data.drawings[label] = this.paths;
    this.index++;
    if (this.index < this.labels.length) {
      this._reset();
      this._updateInstructions();
    }
    else {
      // this.instructionsElement.innerHTML = `Thank you !`;
      // this.nextButton.innerHTML = 'SAVE';
      this.container.style.visibility = 'hidden';
      // this.nextButton.onclick = () => this.save();
    }
  }

  public save() {
    // this.nextButton.style.display = 'none';
    // this.instructionsElement.innerHTML = 'Take your downloaded file and place it alongside the others in the dataset!';
    const element = document.createElement('a');
    element.setAttribute('href',
      'data:text/plain;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(this.data))
    );
    const filename = this.data.session + '.json';
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  public bindEvents(): void {
    this.canvas.onmousedown = () => {
      if (!this._mousePosition) return;
      this.paths.push([this._mousePosition]);
      this.isDrawing = true;
    };

    this.canvas.onmousemove = (evt) => {
      this._getMousePosition(evt);
      if (this.isDrawing) {
        const lastPath = this.paths[this.paths.length - 1];
        lastPath.push(this._mousePosition!);
        this._redraw();
      }
    };

    document.onmouseup = () => {
      this.isDrawing = false;
    };

    // this.nextButton.onclick = () => this.next();
  }
  private _reset() {
    this.paths = [];
    this.isDrawing = false;
    this._redraw();
  }

  private _getMousePosition(evt: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    this._mousePosition = [
      evt.clientX - rect.left,
      evt.clientY - rect.top,
    ];
  }

  public undo () {
    this.paths.pop();
    this._redraw();
  }

  public clear () {
    this.paths.length = 0;
    this._redraw();
  }

  private _redraw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    Render.paths(this.ctx, this.paths);
    if (this.paths.length > 0) {
      this.undoBtn.disabled = false;
      // this.nextButton.disabled = false;
      this.clearBtn.disabled = false;
    }
    else {
      this.undoBtn.disabled = true;
      // this.nextButton.disabled = true;
      this.clearBtn.disabled = true;
    }
    this.triggerUpdate();
  }

  public triggerUpdate () {
    this.onUpdate?.(this.paths);
  }
}