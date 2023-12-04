// Framework.ts
import { BaseComponent } from './component.ts';

export class Framework {
  private rootElement: HTMLElement;
  private components: Map<string, BaseComponent> = new Map(); // Map pour stocker les composants

  constructor(rootId: string) {
    const rootElement = document.getElementById(rootId);
    if (!rootElement) {
      throw new Error(`Root element with ID '${rootId}' not found.`);
    }
    this.rootElement = rootElement;
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
    } catch (error) {
      console.error(error);
    }
  }

  async navigateTo(componentName: string, data?: Record<string, any>) {
    const component = this.components.get(componentName);
    if (component && this.rootElement) {
      this.rootElement.innerHTML = component.render(); // Affiche le composant ciblé
      await component.init(data);
    }
  }
}
