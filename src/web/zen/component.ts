// component.ts
import 'reflect-metadata';
import { DependencyRequester, InjectOptions, InjectionToken } from './injection';
import { createFunction, normalizeHtml, parseExpression } from './utils';
import { InputMetadataKey, InputsMetadata, ReferenceMetadata, RefsMetadataKey } from './decorators';

const componentMetadataSymbol = Symbol('component-metadata');
export type DependenciesMap = Map<InjectionToken, DependenciesMapValue>;
export interface DependenciesMapValue {
  property: PropertyKey;
  options?: InjectOptions;
}

type BaseComponentConfig = {
  selector: string;
  styles?: string;
  inputs?: string[];
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

  private static _eventHandlers: any[] = [];

  private _childrenObserver: MutationObserver;


  protected dependencyRequester: DependencyRequester;

  protected static _observedAttributes: string[] = [];

  public static get observedAttributes () {
    return this.metadata.inputs ?? [];
  }

  private _afterInit: ((component: any) => Promise<void> | void)[] = [];

  public afterInit (cb: (component: typeof this) => Promise<void> | void) {
    this._afterInit.push(cb);
  }

  public constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.template = document.createElement('template');
    this.dependencyRequester = new DependencyRequester(this);
    this._childrenObserver = new MutationObserver(this._childrenObserverCallback);
  }

  private _childrenObserverCallback: MutationCallback = (mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        Array.from(mutation.addedNodes).filter((node) => node instanceof Element).forEach((node) => {
          const child = node as Element;
          const childCtor = child.constructor;
          const inputAttributes = Array.from(child.attributes)
            .filter((attr) => attr.name.startsWith('[') && attr.name.endsWith(']'));
          const inputs = Reflect.getMetadata(InputMetadataKey, childCtor) as InputsMetadata;
          
          inputAttributes.forEach((boundAttr) => {
            const attr = boundAttr.name.slice(1, -1);
            const input = inputs.find((i) => i.propertyKey === attr);
            if (!input) {
              console.warn(`${attr} is not a valid attribute for ${childCtor.name}`, boundAttr);
              return;
            }
            const boundValue = boundAttr.value;
            const expression = boundValue.trim();
            const userCode =
              expression.slice(0, 2) === '{{' && expression.slice(-2) === '}}'
                ? expression.slice(2, -2)
                : expression;
            const fn = createFunction(`return ${userCode};`);
            const res = fn.bind(this)(this);
            const paths = ~expression.indexOf('{{') ? parseExpression(userCode).paths : [];
            paths.forEach((key) => {
              let original = this[key as keyof this];
              Object.defineProperty(this, key, {
                get: () => {
                  return original;
                },
                set: (v: any) => {
                  original = v;
                  (child as any)[input.propertyKey] = v;
                },
              });
            });
            (child as any)[input.propertyKey] = res;
            if (input.originalKey) {
              Object.defineProperty(child, input.originalKey, {
                get: () => {
                  return (child as any)[input.propertyKey];
                },
                set: (v: any) => {
                  (child as any)[input.propertyKey] = v;
                },
              });
            }
          });
        })
      }
    }
  };

  public get shadow() {
    return this.shadowRoot!;
  }

  /**
   * Request a dependency from a component up the tree
   * @param key the name of the dependency to request
   * @param options an optional object of options you want the providing component to know, for example if you want a reference to a singleton or a new instance
   * @return the instance of the requested instance or null if none was found
   */
  protected requestInstance<T = unknown>(key: InjectionToken<T>, options?: InjectOptions) {
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
  protected receiveDependency<T = unknown>(value: unknown, key: InjectionToken<T>, options?: optionsType) {
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
  public static createDependency<T>(key: InjectionToken<T>, value: PropertyKey, options?: InjectOptions) {
    this._ensureDependenciesExist();
    const mapValue: DependenciesMapValue = { property: value, options };
    this._dependenciesMap!.set(key, mapValue);
  }

  protected async onInit (_data?: Record<string, any>) {}

  public async connectedCallback() {
    this._childrenObserver.observe(this.shadow, { childList: true });
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
      this.template.innerHTML = normalizeHtml(templateContent);
      if (metadata.styles) {
        const style = document.createElement('style');
        style.setAttribute('type', 'text/css');
        style.textContent = `@import url('${metadata.styles}')`;
        this.shadow.appendChild(style);
      }
    }
    catch (error) {
      console.error(error);
    }

    const ctor = this.constructor as typeof BaseComponent;
    ctor._ensureDependenciesExist();
    ctor._dependenciesMap?.forEach((value, key) => {
      (this as any)[value.property.toString()] = this.requestInstance(key, value.options);
    });

    ctor._eventHandlers.forEach(({ selector, eventType, propertyKey }) => {
      const element = this.shadow.querySelector(selector) as HTMLElement | null;
      element?.addEventListener(eventType, (this[propertyKey as keyof this] as any).bind(this));
    });

    const elements = this.shadow.querySelectorAll('[events]');
    elements.forEach((element) => {
      const eventMappings = element.getAttribute('events');
      if (eventMappings) {
        eventMappings.split(',').forEach(mapping => {
          const [eventType, methodName] = mapping.split(':');
          const method = (this as any)[methodName.trim()];
          if (method && typeof method === 'function') {
            element.addEventListener(eventType.trim(), (event) => method.call(this, event));
          }
        });
      }
    });

    const inputProperties = Object.getOwnPropertyNames(this)
      .filter((key) => Reflect.getMetadata('input-property', this, key));

    inputProperties.forEach((prop) => ctor._observedAttributes.push(prop));
    
    this.bindContent();
    await this.render();

    const childComponents = Array.from(this.shadow.querySelectorAll('*'));
    const thisCtor = this.constructor;
    const refs: Map<string, ReferenceMetadata> | undefined = Reflect.getMetadata(RefsMetadataKey, thisCtor);
    childComponents.forEach((child) => {
      if (refs && child.id) {
        for (const entry of refs) {
          if (entry[0] === child.id) {
            Object.defineProperty(this, entry[1].propertyKey, {
              get() {
                return entry[1].getter(this);
              },
              configurable: true,
              enumerable: true,
            });

          }
        }
      }
    });

    const allElements = this.shadow.querySelectorAll<HTMLElement>('*');
    allElements.forEach((element) => {
      const bindContentAttr = element.getAttribute('bind-content');
      if (bindContentAttr) {
        console.log('bindContentAttr', bindContentAttr);
        console.log('element', element);
        const expression = parseExpression(bindContentAttr);
        console.log('expression', expression);
        const key = expression.paths[0];
        if (expression.paths.length === 1 && (key in this)) {
          element.nodeValue = this[key as keyof this] as any;
          let originalValue = (this[key as keyof this])
          Object.defineProperty(this, expression.paths[0], {
            get: () => originalValue,
            set: (v: any) => {
              originalValue = v;
              element.innerHTML = v;
            },
          });
        }
      }
      const eventAttributes = Array.from(element.attributes)
        .filter(attr => attr.name.startsWith('(') && attr.name.endsWith(')'));
      eventAttributes.forEach((attr) => {
        const eventName = attr.name.slice(1, -1); // Récupérer le nom de l'événement sans les parenthèses
        const codeToExecute = attr.value; // Récupérer le code à exécuter
        
        const parsed = parseExpression(codeToExecute);
        if (parsed.methods.length === 0) return;
        let functionBody = '$event = event;\n';
        parsed.methods.forEach((method) => {
          if (typeof (this as any)[method.method] === 'function') {
            functionBody += `this.${method.method}(${method.arguments.join(',')});\n`;
          }
        });
        const fn = createFunction('event', functionBody);
        element.addEventListener(eventName, (evt) => {
          return fn.bind(this)(evt);
        });
      });
    });

    await this.onInit();
    for (const cb of this._afterInit) {
      await cb(this);
    }
  }

  protected disconnectedCallback() {
    this._childrenObserver.disconnect();
  }

  protected adoptedCallback() { }

  protected attributeChangedCallback(_name: string, _oldValue: any, _newValue: any) { }

  protected bindContent () {
    const walker = document.createTreeWalker(this.template.content, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let currentNode: Node | null = walker.currentNode;
    while (currentNode) {
      const expression = currentNode.textContent;
      if (!expression || !~expression.indexOf('{{') || currentNode.nodeType !== Node.TEXT_NODE) {
        currentNode = walker.nextNode();
        continue;
      }
      console.log('currentNode', currentNode);
      const parsed = parseExpression(expression)
      console.log('expression', expression, parsed);
      const raw = expressionToJS(expression);
      console.log('raw', raw);
      const fn = createFunction(`return ${raw};`);
      const res = fn.apply(this);
      currentNode.nodeValue = typeof res === 'object' ? JSON.stringify(res) : res;

      currentNode = walker.nextNode();
    }
  }

  public async render() {
    this.shadow.appendChild(this.template.content.cloneNode(true));
  }

}

// const expressionToJS = (str: string) => '`' + str.replaceAll('{{', '${').replaceAll('}}', '}') + '`';
const expressionToJS = (str: string) => str.replaceAll('{{', '').replaceAll('}}', '');

export function registerComponent<T extends BaseComponent>(component: IComponent<T>) {
  customElements.define(component.metadata.selector, component);
}
