import { BaseComponent } from "./base.component";
import { Injectable } from "./injection";

class Route {
  constructor(public path: string, public component: BaseComponent) {}
}

export class Router {
  private routes: Route[] = [];

  public addRoute(path: string, component: BaseComponent) {
    this.routes.push(new Route(path, component));
  }

  public getComponentForPath(path: string): BaseComponent | undefined {
    const route = this.routes.find(route => route.path === path);
    return route ? route.component : undefined;
  }
}

@Injectable()
export class RouterService {
  public navigate(path: string) {
    window.location.hash = path;
  }
}