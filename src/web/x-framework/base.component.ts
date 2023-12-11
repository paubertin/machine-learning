// base.component.ts

import { Framework } from "./framework.ts";

interface ComponentConfig {
  template: string;
  style?: string;
}

const componentMetadataKey = 'component';

export function Component(config: ComponentConfig): ClassDecorator {
  return function (target: Function) {
    Reflect.defineMetadata(componentMetadataKey, config, target);
  };
}

export function getComponentConfig(target: Function): ComponentConfig | undefined {
  return Reflect.getMetadata(componentMetadataKey, target);
}

export abstract class BaseComponent {
  protected app!: Framework;
  public readonly templatePath: string = '';
  protected templateContent: string = '';
  protected children: BaseComponent[] = [];

  protected async onInit (_data: Record<string, any> = {}) {}; // à surchager pour définir l'initialisation du composant

  setTemplateContent(content: string): void {
    this.templateContent = content;
  }

  addChild(child: BaseComponent): void {
    this.children.push(child);
  }

  renderChildren(): string {
    return this.children.map(child => child.render()).join('');
  }

  render(): string {
    return this.templateContent + this.renderChildren(); // Utilisation du templateContent dans le rendu du composant
  }

  public async init(data?: Record<string, any>) {
    await this.onInit(data);
  } 
}