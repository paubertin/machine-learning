/// app.ts
import { BaseComponent, Component, IComponent, registerComponent } from "./component";
import { DependencyResolver, InjectionToken, injector } from "./injection";
import { Route, Router } from "./router";


@Component({
  selector: 'app-root',
  template: '',
})
class AppRoot extends BaseComponent {
  private _dependencyResolver: DependencyResolver = new DependencyResolver();

  public router!: Router;

  /**
     * This is the actual part where you should check if you have the requested dependency and return it
     * @param key the name of the requested dependency
     * @param options the optional options
     */
  // @ts-ignore
  protected resolveDependency(key: string, options?: unknown): unknown | undefined {
    return injector.resolve(key);
  }

  public declareComponents(components: IComponent[]) {
    components.forEach((component) => registerComponent(component));
    return this;
  }

  public declareProviders(providers: InjectionToken[]) {
    providers.forEach((provider) => {
      injector.resolve(provider);
    });
    return this;
  }

  public declareRoutes(routes: Route[]) {
    routes.forEach((route) => {
      this.router.addRoute(route.path, route.component as any);
    });
    return this;
  }

  public bootstrap(path: string) {
    window.addEventListener('DOMContentLoaded', async () => {
      this.router.navigate(path);
    });
  }

  public override async connectedCallback() {
    await super.connectedCallback();
    this._dependencyResolver.connect(this);
    this._dependencyResolver.setResolveCallback(this.resolveDependency.bind(this));
  }

  public override async disconnectedCallback() {
    super.disconnectedCallback();
    this._dependencyResolver.disconnect(this);
  }
}


export function _createApplication(containerId: string = 'app') {
  customElements.define(AppRoot.metadata.selector, AppRoot);
  const app = document.querySelector(AppRoot.metadata.selector) as AppRoot;
  app.router = injector.resolve(Router);
  (app.router as any).rootContainer = app;
  return app;
}

export function createApplication(containerId: string = 'app') {
  customElements.define(AppRoot.metadata.selector, AppRoot);
  const app = document.createElement(AppRoot.metadata.selector) as AppRoot;
  app.router = injector.resolve(Router);
  const outlet = document.getElementById(containerId);
  if (outlet) {
    outlet.innerHTML = '';
    outlet.appendChild(app);
    (app.router as any).rootContainer = document.querySelector(AppRoot.metadata.selector);
  }
  return app;
}