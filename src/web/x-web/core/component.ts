// component.ts
import 'reflect-metadata';
import { DependencyRequester, InjectionToken } from './injection';

const componentMetadataSymbol = Symbol('component-metadata');
export type DependenciesMap = Map<InjectionToken, DependenciesMapValue>;
export interface DependenciesMapValue {
  property: PropertyKey;
  options?: unknown;
}

type BaseComponentConfig = {
  selector: string;
  styles?: string;
};

type ComponentConfigWithTemplateURL = BaseComponentConfig & { templateUrl: string; };
type ComponentConfigWithTemplate = BaseComponentConfig & { template: string; };

type ComponentConfig = ComponentConfigWithTemplate | ComponentConfigWithTemplateURL;

export function Component(config: ComponentConfig) {
  return <T extends BaseComponent>(target: { new(...args: any[]): T }) => {
    Reflect.defineMetadata(componentMetadataSymbol, config, target);
  };
}

export interface IComponent<T extends BaseComponent = BaseComponent> {
  new(...args: any[]): T;
  readonly metadata: ComponentConfig;
}

export class BaseComponent extends HTMLElement {
  private static _dependenciesMap?: DependenciesMap;
  protected template: HTMLTemplateElement;

  protected dependencyRequester: DependencyRequester;

  public constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.template = document.createElement('template');
    this.dependencyRequester = new DependencyRequester(this);
  }

  public get shadow() {
    return this.shadowRoot!;
  }

  public templateContent: string = '';

  /**
   * Request a dependency from a component up the tree
   * @param key the name of the dependency to request
   * @param options an optional object of options you want the providing component to know, for example if you want a reference to a singleton or a new instance
   * @return the instance of the requested instance or null if none was found
   */
  protected requestInstance<O = unknown>(key: string, options?: O) {
    const value = this.dependencyRequester.requestInstance(key, options);

    if (value !== null) {
      this.receiveDependency(value, key, options);
    }

    return value;
  }

  /**
     * This is called once a dependency was successfully requested
     * You can do further stuff with the dependency here
     * @param value the dependency
     * @param key the key
     * @param options the optional options
     */
  // @ts-ignore
  protected receiveDependency(value: unknown, key: string, options?: optionsType) {
    // This is a stub
  }

  public static get metadata() {
    return Reflect.getMetadata(componentMetadataSymbol, this) as ComponentConfig;
  }

  private static _ensureDependenciesExist(): void {
    if (this._dependenciesMap === undefined) {
      this._dependenciesMap = new Map();
      const superDependencies: DependenciesMap = Object.getPrototypeOf(this)._dependenciesMap;
      if (superDependencies !== undefined) {
        superDependencies.forEach((v, k) =>
          this._dependenciesMap!.set(k, v)
        );
      }
    }
  }

  /**
     * Creates a new dependency
     * @param key the name of the dependency
     * @param value the value that will be injected
     */
  public static createDependency<T>(key: InjectionToken<T>, value: PropertyKey, options?: unknown) {
    this._ensureDependenciesExist();
    const mapValue: DependenciesMapValue = { property: value, options };
    this._dependenciesMap!.set(key, mapValue);
  }

  public async connectedCallback() {
    const metadata = (this.constructor as typeof BaseComponent).metadata;
    try {
      let templateContent: string;
      if ('template' in metadata) {
        templateContent = metadata.template;
      }
      else {
        const templateResponse = await fetch(metadata.templateUrl);
        if (!templateResponse.ok) {
          throw new Error(`Erreur lors du chargement du template pour ${this.constructor.name}`);
        }
        templateContent = await templateResponse.text();
      }
      this.template.innerHTML = templateContent;
      if (metadata.styles) {
        const style = document.createElement('style');
        style.setAttribute('type', 'text/css');
        style.textContent = `@import url('${metadata.styles}')`;
        this.shadow.appendChild(style);
      }
      this.shadow.appendChild(this.template.content.cloneNode(true));
    }
    catch (error) {
      console.error(error);
    }
    console.log('this', this);

    const ctor = this.constructor as typeof BaseComponent;
    ctor._ensureDependenciesExist();
    ctor._dependenciesMap?.forEach((value, key) => {
      // @ts-ignore
      this[value.property.toString()] = this.requestInstance(key, value.options);
    })

  }

  disconnectedCallback() { }

  adoptedCallback() { }

  attributeChangedCallback(name: string, oldValue: any, newValue: any) { }

  public async render() { }
}


export function registerComponent<T extends BaseComponent>(component: IComponent<T>) {
  customElements.define(component.metadata.selector, component);
}

