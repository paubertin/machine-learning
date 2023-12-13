import { ChartComponent } from './components/chart/chart.component';
import { Confusion } from './components/confusion/confusion.component';
import { SketchPad } from './components/sketchpad/sketchpad.component';
import { ViewerComponent } from './components/viewer/viewer.component';
import { Visualizer } from './components/visualizer/visualizer.component';
import createApplication from './zen';


async function main () {
  const app = createApplication('app');

  app
  .declareComponents([
    ViewerComponent,
    ChartComponent,
    SketchPad,
    Confusion,
    Visualizer,
  ])
  .declareRoutes([
    {
      path: '/home',
      component: ViewerComponent,
    }
  ]);

  app.bootstrap('/home');
}

void main();
