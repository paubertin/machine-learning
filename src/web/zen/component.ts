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

  public static get metadata() {
    return Reflect.getMetadata(componentMetadataSymbol, this) as ComponentConfig;
  }

  public static createDependency<T>(key: InjectionToken<T>, value: PropertyKey, options?: InjectOptions) {
    this._ensureDependenciesExist();
    const mapValue: DependenciesMapValue = { property: value, options };
    this._dependenciesMap!.set(key, mapValue);
  }

  protected template: HTMLTemplateElement;
  protected dependencyRequester: DependencyRequester;

  private _childrenObserver: MutationObserver;
  private _afterInit: ((component: any) => Promise<void> | void)[] = [];

  public constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.template = document.createElement('template');
    this.dependencyRequester = new DependencyRequester(this);
    this._childrenObserver = new MutationObserver(this._childrenObserverCallback);
  }

  public afterInit (cb: (component: typeof this) => Promise<void> | void) {
    this._afterInit.push(cb);
  }

  public get shadow() {
    return this.shadowRoot!;
  }

  protected async connectedCallback() {
    this._childrenObserver.observe(this.shadow, { childList: true });

    await this._getTemplateContent();

    this._bindDependencies();
    
    const templateContent = this.template.content.cloneNode(true);

    this._bindContent(templateContent);

    runBinding(this, '*');

    this.render(templateContent);

    this._bindRefs();

    this._bindEvents();

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

  protected render(node: Node) {
    this.shadow.appendChild(node);
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

  protected requestInstance<T = unknown>(key: InjectionToken<T>, options?: InjectOptions) {
    const value = this.dependencyRequester.requestInstance(key, options);

    if (value !== null) {
      this.receiveDependency(value, key, options);
    }

    return value;
  }

  protected receiveDependency<T = unknown>(_value: unknown, _key: InjectionToken<T>, _options?: InjectOptions) {
    // This is a stub
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

  protected async onInit (_data?: Record<string, any>) {}

  private async _getTemplateContent () {
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
  }

  private _bindDependencies () {
    const ctor = this.constructor as typeof BaseComponent;
    ctor._ensureDependenciesExist();
    ctor._dependenciesMap?.forEach((value, key) => {
      (this as any)[value.property.toString()] = this.requestInstance(key, value.options);
    });
  }

  private _bindRefs () {
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
  }

  private _bindEvents () {
    const allElements = this.shadow.querySelectorAll<HTMLElement>('*');
    allElements.forEach((element) => {
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
  }

  private _bindContent (content: Node) {
    const walker = document.createTreeWalker(content, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let currentNode: Node | null = walker.currentNode;
    while (currentNode) {
      const expression = currentNode.textContent;
      if (!expression || !~expression.indexOf('{{') || currentNode.nodeType !== Node.TEXT_NODE) {
        currentNode = walker.nextNode();
        continue;
      }
      const parsed = parseExpression(expression);
      const expressions = parsed.expressions;
      const functions = expressions.map((exp) => {
        const raw = expressionToJS(exp);
        return createFunction('item', `return ${raw};`);
      });
      const node = currentNode!;
      const originalContent = node.nodeValue ?? '';
      const defaultContext = () => findCtx(node);
      parsed.paths.forEach((key) => {
        createBind(this, node, key, (ctx: any = defaultContext()) => {
          try {
            let content = originalContent;
            expressions.forEach((exp, idx) => {
              const value = functions[idx].call(this, ctx);
              content = content.replace(exp, String(value)) ?? null;
            });
            node.nodeValue = content;
          }
          catch (err) {
            console.error(`Expression error: ${expression}`, err);
          }
        });
      })
      currentNode = walker.nextNode();
    }
  }

}

const bindMap = new WeakMap();

const internals = Symbol('internals');
const repeatCtx = Symbol('repeatCtx');
const NOOP = () => void 0;

const findCtx = (t: any) => {
  while (t && !t[repeatCtx]) {
    t = t.parentElement;
  }
  return t?.[repeatCtx];
};

function type (o: any, t: 'string' | 'number' | 'bigint' | 'boolean' | 'symbol' | 'undefined' | 'object' | 'function') {
  return typeof o === t;
}
function createBind (source: BaseComponent, target: Node, property: string | symbol, execution?: any) {
  const propToTarget = bindMap.get(source) || bindMap.set(source, {}).get(source);
  if (!propToTarget[property]) {
    const oSet = (Object.getOwnPropertyDescriptor(source, property) || {}).set;
    let value = source[property as keyof BaseComponent];

    Object.defineProperty(source, property, {
      get: () => value,
      set: (v) => {
        if (v !== value || type(v, 'object')) {
          value = v;
          if (oSet) {
            oSet(v);
          }
          runBinding(source, property, value);
        }
      },
    });
  }
  (propToTarget[property] = propToTarget[property] || new Set()).add(target);
  let meta = ((target as any)[internals] = (target as any)[internals] || {});
  if (type(property, 'symbol')) return NOOP;

  (meta[property] = meta[property] || new Set()).add(execution);

  return () => meta[property].delete(execution);
}

const runOneBind = (meta: any, property: string | symbol, resolvedValue: any) => {
  (meta[property] || []).forEach((target: any) => {
    const value = target[repeatCtx] || resolvedValue;
    target[internals][property].forEach((fn: any) => fn(value));
  });
};

export const runBinding = (source: BaseComponent, property: string | symbol, value?: any) => {
  let propToTarget = bindMap.get(source) || bindMap.set(source, {}).get(source);
  if (property !== '*') {
    runOneBind(propToTarget, property, value);
  }
  else {
    Object.keys(propToTarget).forEach((key) =>
      runOneBind(propToTarget, key, source[key as keyof BaseComponent])
    );
  }
};

// const expressionToJS = (str: string) => '`' + str.replaceAll('{{', '${').replaceAll('}}', '}') + '`';
const expressionToJS = (str: string) => str.replaceAll('{{', '').replaceAll('}}', '');

export function registerComponent<T extends BaseComponent>(component: IComponent<T>) {
  customElements.define(component.metadata.selector, component);
}
