import { StartComponent } from "./start/start.component.ts";
import { Framework } from "../framework/framework.ts";
import { SketchPad } from "./sketchpad/sketchpad.component.ts";
import '../styles.css';

async function main () {
  const app = new Framework('app');
  const startComponent = new StartComponent();
  const sketchpadComponent = new SketchPad();
  await app.addComponent(startComponent, 'start');
  await app.addComponent(sketchpadComponent, 'sketchpad');
  
  await app.navigateTo('start');

}

void main();
