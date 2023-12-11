// framework.ts

import { BaseComponent, getComponentConfig } from './base.component';
import { Router } from './route';

export interface Constructable<T> {
  new (...args: any[]): T;
}

interface RouteConfig {
  path: string;
  component: Function;
}

type ServiceInstance = {
  instance: any;
  dependencies: string[];
};

interface FrameworkConfig {
  rootId: string;
  components: any[]; // Tableau des composants
  services: any[]; // Tableau des services
  routes: RouteConfig[]; // Tableau de configurations de routes
}

export function Config(config: FrameworkConfig) {
  return function () {
    if (!frameworkInstance) {
      frameworkInstance = new Framework(config.rootId);
    }
    // Enregistrer les services
    config.services.forEach((service: any) => {
      frameworkInstance.registerService(service);
    });

    console.log('framework', frameworkInstance);
  }
}



export class Framework {
  private router: Router = new Router();
  private routes: RouteConfig[] = [];
  private services: Map<string, ServiceInstance> = new Map();
  private rootElement: HTMLElement;
  private components: Map<string, BaseComponent> = new Map(); // Map pour stocker les composants

  constructor(rootId: string) {
    const rootElement = document.getElementById(rootId);
    if (!rootElement) {
      throw new Error(`Root element with ID '${rootId}' not found.`);
    }
    this.rootElement = rootElement;
    window.addEventListener('hashchange', this.handleRouteChange.bind(this));
  }

  private handleRouteChange() {
    const path = window.location.hash;
    const component = this.router.getComponentForPath(path);

    if (component) {
      this.renderComponent(component);
    }
  }

  private renderComponent(component: BaseComponent) {
    this.rootElement.innerHTML = component.render();
  }
  
  async addComponent(component: BaseComponent, componentName: string) {
    const templatePath = component.templatePath;
    try {
      const response = await fetch(templatePath);
      if (!response.ok) {
        throw new Error(`Erreur lors du chargement du template pour ${componentName}`);
      }
      const templateContent = await response.text();
      (component as any).app = this;
      component.setTemplateContent(templateContent); // Définir le contenu du template dans le composant
      this.components.set(componentName, component); // Ajouter le composant à la map
    }
    catch (error) {
      console.error(error);
    }
  }

  public registerComponents(components: Function[]): void {
    components.forEach(component => {
      const config = getComponentConfig(component);
      if (config) {
        // Utiliser les informations de configuration pour chaque composant
        console.log('Template path:', config.template);
        console.log('Style path:', config.style);
      }
    });
  }

  public registerServices(services: Constructable<any>[]): void {
    services.forEach(service => this.registerService(service));
  }

  public registerService (service: Constructable<any>) {
    const dependencies: string[] = Reflect.getMetadata('design:paramtypes', service) || [];
    const instances = dependencies.map((depName: any) => this.services.get(depName.name)?.instance);

    const instance = new service(...instances);
    this.services.set(service.name, { instance, dependencies });
  }

  public registerRoutes(routes: RouteConfig[]): void {
    this.routes.push(...routes);
  }
}

let frameworkInstance: Framework;