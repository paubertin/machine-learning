import { Framework } from "../framework/framework.ts";
import { samples } from '../../common/js-objects/samples.js';
import '../styles.css';
import { Utils } from "../../common/utils.ts";
import { Component } from "../framework/component.ts";
import { createRow } from "../utils/display.ts";

class ViewerComponent extends Component {
  public templatePath = 'viewer.component.html';
  public container!: HTMLDivElement;

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
