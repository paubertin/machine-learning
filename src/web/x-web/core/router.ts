// router.ts
import { BaseComponent, IComponent } from "./component";
import { Injectable } from "./injection";

export interface Route {
  path: string,
  component: IComponent;
}

@Injectable()
export class Service {
}

@Injectable()
export class Router {
  private routes: { [key: string]: typeof BaseComponent } = {};

  private rootContainer?: BaseComponent;

  public constructor(private service: Service) {}

  public addRoute(path: string, component: typeof BaseComponent) {
    this.routes[path] = component;
  }

  public navigate(path: string) {
    const component = this.routes[path];
    if (component && this.rootContainer) {
      this.rootContainer.shadow.innerHTML = '';
      const pageComponent = document.createElement(component.metadata.selector) as BaseComponent;
      this.rootContainer.shadow.appendChild(pageComponent);
    }
    else {
      console.error('Route non trouvée');
    }
  }
}
