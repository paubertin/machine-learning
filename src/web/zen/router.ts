// router.ts
import { BaseComponent, IComponent } from "./component";
import { Injectable } from "./injection";

export interface Route {
  path: string,
  component: IComponent;
}

@Injectable()
export class Router {
  private routes: { [key: string]: typeof BaseComponent } = {};
  private lastRoute: string | null = null;

  private rootContainer?: BaseComponent;

  public constructor() {
    window.addEventListener('popstate', () => {
      if (window.location.pathname !== this.lastRoute) {
        this.navigate(window.location.pathname);
      }
    });
  }

  public addRoute(path: string, component: typeof BaseComponent) {
    this.routes[path] = component;
  }

  public navigate(path: string) {
    const component = this.routes[path];
    if (component && this.rootContainer) {
      this.rootContainer.shadow.innerHTML = '';
      const pageComponent = document.createElement(component.metadata.selector) as BaseComponent;
      this.rootContainer.shadow.appendChild(pageComponent);
      history.pushState(null, '', path);
      this.lastRoute = path;
    }
    else {
      console.error('Route non trouvée');
    }
  }
}
