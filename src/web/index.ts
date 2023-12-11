import { ChartComponent } from './components/chart/chart.component';
import { SketchPad } from './components/sketchpad/sketchpad.component';
import { ViewerComponent } from './components/viewer/viewer.component';
import createApplication from './zen';


async function main () {
  const app = createApplication('app');

  app
  .declareComponents([
    ViewerComponent,
    ChartComponent,
    SketchPad,
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
