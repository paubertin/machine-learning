import { BaseComponent } from "../../framework/component.ts";

export class StartComponent extends BaseComponent {
  public override templatePath = 'start/start.component.html';

  public startButton!: HTMLButtonElement;

  public student: string = '';

  protected override async onInit () {
    this.startButton = document.getElementById('start') as HTMLButtonElement;
    this.startButton.disabled = true;
  }

  public override bindEvents(): void {
    this.startButton.onclick = () => {
      this.start();
    };
  }

  public override bindInputs() {
    this.bindInput('student', 'student', (value) => this.startButton!.disabled = value === '');
  }

  public start () {
    this.app.navigateTo('sketchpad', { student: this.student });
  }
}