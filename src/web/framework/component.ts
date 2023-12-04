import { Framework } from "./framework.ts";

export abstract class Component {
  protected app!: Framework;
  public readonly abstract templatePath: string;
  protected templateContent: string = '';
  protected children: Component[] = [];

  protected async onInit (data: Record<string, any> = {}) {};

  bindEvents(): void {
    // Méthode vide pour le binding d'événements, à implémenter dans les sous-classes si nécessaire
  }

  bindInputs(): void {
    // Méthode vide pour le binding d'événements, à implémenter dans les sous-classes si nécessaire
  }

  bindInput <K extends keyof this>(elementId: string, attribute: K, cb?: (val: string) => void) {
    const inputElement = document.getElementById(elementId) as HTMLInputElement | null;
    if (inputElement) {
      inputElement.addEventListener('input', () => {
        this[attribute] = inputElement.value as any;
        cb?.(inputElement.value);
      });
    }
  }

  setTemplateContent(content: string): void {
    this.templateContent = content;
  }

  addChild(child: Component): void {
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
    this.bindEvents();
    this.bindInputs();
  } 
}