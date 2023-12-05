import { Framework } from "../framework/framework.ts";
import { samples } from '../../common/js-objects/samples.js';
import '../styles.css';
import { Utils } from "../../common/utils.ts";
import { BaseComponent } from "../framework/component.ts";
import { createRow, handleClick } from "../utils/display.ts";
import { Chart } from "./chart/chart.ts";
import { Graphics } from "./chart/graphics.ts";
import { features } from "../../common/js-objects/features.js";
import { Sample } from "../../common/interfaces.ts";
import { SketchPad } from "../creator/sketchpad/sketchpad.component.ts";

class ViewerComponent extends BaseComponent {
  public templatePath = 'viewer.component.html';
  public container!: HTMLDivElement;
  public chartContainer!: HTMLDivElement;
  public inputContainer!: HTMLDivElement;

  protected override async onInit(data?: Record<string, any>) {
    this.container = document.getElementById('container') as HTMLDivElement;
    this.chartContainer = document.getElementById('chartContainer') as HTMLDivElement;
    this.inputContainer = document.getElementById('inputContainer') as HTMLDivElement;
    const stylesWithImages = Graphics.generateImages(Utils.styles);
    const chartSamples = features.samples as Required<Sample>[];
    const chart = new Chart(
      this.chartContainer,
      chartSamples,
      {
        size: 500,
        axesLabels: features.featureNames,
        styles: stylesWithImages,
        transparency: 0.7,
        icon: 'image',
      },
      handleClick,
    );
    const groups = Utils.groupBy(samples, 'studentId');
    for (let studentId in groups) {
      const studentSamples = groups[studentId];
      const studentName = studentSamples[0].studentName;
      await createRow(this.container, studentName, studentSamples, chart);
    }

    const sketchPad = new SketchPad();
  }

}

async function main () {
  const app = new Framework('app');
  const component = new ViewerComponent();
  await app.addComponent(component, 'viewer');
  await app.navigateTo('viewer');
}

void main();
