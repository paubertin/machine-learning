import { Framework } from "../framework/framework.ts";
import { samples } from '../../common/js-objects/samples.js';
import '../styles.css';
import { Utils } from "../../common/utils.ts";
import { BaseComponent } from "../framework/component.ts";
import { createRow } from "../utils/display.ts";
import { Inject } from "../framework/injection.ts";
import { DataService } from "./service.ts";

class ViewerComponent extends BaseComponent {
  public override templatePath = 'viewer.component.html';
  public container!: HTMLDivElement;

  public constructor(
  ) {
    super();
  }

  protected override async onInit(data?: Record<string, any>) {
    this.container = document.getElementById('container') as HTMLDivElement;
    const groups = Utils.groupBy(samples, 'studentId');
    for (let studentId in groups) {
      const studentSamples = groups[studentId];
      const studentName = studentSamples[0].studentName;
      await createRow(this.container, studentName, studentSamples);
    }
  }

}

async function main () {
  const app = new Framework('app');
  const component = new ViewerComponent();  
  await app.addComponent(component, 'viewer');
  await app.navigateTo('viewer');
}

void main();
