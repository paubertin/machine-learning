import { Framework } from "./framework.ts";

type BindingRecord = Record<string, Set<string>>;

export abstract class BaseComponent {
  protected app!: Framework;
  public readonly templatePath: string = '';
  protected templateContent: string = '';
  protected children: BaseComponent[] = [];
  private bindings: BindingRecord = {}; // Enregistre les liens entre attributs et éléments

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

  protected bindAttribute(attribute: keyof this, elementId: string) {
    const element = document.getElementById(elementId);
    if (element) {
      const attributeName = attribute as string;
      if (!this.bindings[attributeName]) {
        this.bindings[attributeName] = new Set<string>();
      }

      this.bindings[attributeName].add(elementId); // Enregistre l'élément lié à cet attribut
      this._updateElement(attributeName); // Met à jour initialement l'élément avec la valeur de l'attribut
    }
  }

  private _updateElement(attribute: string) {
    const elements = Array.from(this.bindings[attribute]).map(id => document.getElementById(id));
    elements.forEach(element => {
      if (!element) return;
      if (element instanceof HTMLInputElement) {
        const attr = this[attribute as keyof this];
        if (typeof attr === 'string') {
          element.value = attr; // Met à jour la valeur d'un champ de saisie lié
          element.addEventListener('input', () => {
            (this as any)[attribute] = element.value; // Met à jour l'attribut de la classe à partir de l'interface utilisateur
          });
        }
        else if (typeof attr === 'number') {
          element.value = String(attr); // Met à jour un champ de saisie avec une valeur numérique
          element.addEventListener('input', () => {
            (this as any)[attribute] = Number(element.value); // Met à jour l'attribut de la classe avec une valeur numérique
          });
        }
      }
      else {
        // TODO !
        // element.textContent = this[attribute]; // Met à jour le contenu d'autres éléments liés
        // Ajoute ici d'autres logiques de mise à jour pour différents types d'éléments si nécessaire
      }
    });
  }

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
    this.bindEvents();
    this.bindInputs();
  } 
}