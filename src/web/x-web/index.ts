import { AboutComponent } from "./components/about/about.component";
import { HomeComponent } from "./components/home/home.component";
import { InputComponent } from "./components/input/input.component";
import { createApplication } from "./core/app";
import { Router, Service } from "./core/router";

async function main() {
  const app = createApplication();

  app
    .declareComponents([
      HomeComponent,
      AboutComponent,
      InputComponent,
    ])
    .declareProviders([
      Service,
      Router,
    ])
    .declareRoutes([
      {
        path: '/home',
        component: HomeComponent,
      },
      {
        path: '/about',
        component: AboutComponent,
      }
    ])
  ;

  app.bootstrap('/home');
}

void main();
