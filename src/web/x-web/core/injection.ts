// injection.ts
import 'reflect-metadata';
import { BaseComponent } from './component';

export type InjectableClass<T> = new (...args: any[]) => T;
export type InjectionToken<T = any> = string | symbol | InjectableClass<T>;

export class Injector extends Map<InjectionToken<any>, any> {

  public resolve<T>(target: InjectionToken<T>): T {
    if (typeof target === 'function') {
      const tokens = Reflect.getMetadata('design:paramtypes', target) || [];
      const injections = tokens.map((token: InjectableClass<T>) => this.resolve(token));
  
      const classInstance = this.get(target);
      if (classInstance) {
        return classInstance;
      }
  
      const newClassInstance = new target(...injections);
      this.set(target, newClassInstance);
  
      console.log(`DI-Container created class ${(newClassInstance as any).constructor.name}`);

      return newClassInstance;
    }
    else {
      const classInstance = this.get(target);
      if (classInstance) {
        return classInstance;
      }
      throw new Error(`No provider found for ${String(target)}`);
    }
  }

  public release(): void {
    for (const value of this.values()) {
      if (typeof value['release'] === 'function') {
        value['release']();
      }
    }

    this.clear();
  }
}

export const injector = new Injector();

export function Injectable<T>() {
  return function (target: InjectableClass<T>) {
    injector.resolve(target);
  };
}

export interface RequestDependencyEventDetail<T = unknown, O = unknown> {
  key: string;
  options?: O;
  provider?: () => T | undefined;
}

export const DI_REQUEST_EVENT_NAME: string = 'WEBCOMPONENTS-DI: REQUEST';

/**
 * Allows an element to request a dependency
 */
export class DependencyRequester {
  protected element: HTMLElement;

  constructor(element: HTMLElement) {
    this.element = element;
  }

  /**
   * Request a dependency from a component up the tree
   * @param key the name of the dependency to request
   * @param options an optional object of options you want the providing component to know, for example if you want a reference to a singleton or a new instance
   * @return the instance of the requested instance or undefined if none was found
   */
  requestInstance<T = unknown, O = unknown>(key: string, options?: O): T | undefined {
    const event = new CustomEvent<RequestDependencyEventDetail<T, O>>(DI_REQUEST_EVENT_NAME, {
      detail: { key, options },
      bubbles: true,
      cancelable: true,
      composed: true,
    });
    this.element.dispatchEvent(event);
    if (event.defaultPrevented && event.detail.provider) {
      return event.detail.provider();
    }
    else {
      throw new Error(`no provider found for ${key}`);
    }
  }
}

interface DiRequest {
  type?: any;
  instance?: any;
}

function makeRequestEvent <T>(type: InjectionToken<T>): CustomEvent<DiRequest> {
  return new CustomEvent<DiRequest>('request', {
    detail: { type: type },
    bubbles: true,
    composed: true,
  });
}

export function Inject(key: string): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    (target.constructor as typeof BaseComponent).createDependency(Reflect.getMetadata('design:type', target, propertyKey), propertyKey);
  };
}

export function _Inject<T>(token?: InjectionToken<T>): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const paramType = token || Reflect.getMetadata('design:type', target, propertyKey);
  
    console.log('target', target);
    Object.defineProperty(target, propertyKey, {
      get: () => {
        const event = makeRequestEvent(paramType);
        (target as any).dispatchEvent(event);
        return event.detail.instance;
      },
      enumerable: true,
      configurable: true
    });
  }
}


/**
 * The type used to describe the callback used to resolve a dependency
 * This is the actual part where you should check if you have the requested dependency and return it
 * @param key the name of the requested dependency
 * @param options the optional options
 */
export type ResolveCallback = (key: string, options?: any) => unknown | undefined;

export class DependencyResolver {
  // @ts-ignore
  private callback: ResolveCallback = (key: string, options?: unknown) => {
    return undefined;
  };
  /**
   * Looks for the requested dependency
   * @param eventTarget
   */
  handleRequestEvent(eventTarget: Event): void {
    const event: CustomEvent<RequestDependencyEventDetail> = eventTarget as CustomEvent<
      RequestDependencyEventDetail
    >;
    // Get information about the requested dependency
    const detail: RequestDependencyEventDetail = event.detail;
    // Try to resolve it
    const dependency = this.callback(detail.key, detail.options);
    if (dependency) {
      // We did find the requested dependency let's pack it and send it back
      event.detail.provider = () => dependency;
      // Let the requester know we resolved the dependency
      event.preventDefault();
      // Stop this from bubbling up as we have resolved it
      event.stopPropagation();
    }
  }

    /**
     * Allows to set the callback called when a dependency event is caught
     * @param callback
     */
  setResolveCallback(callback: ResolveCallback): void {
      this.callback = callback;
  }

  /**
   * Connects the resolver to the given element
   * @param element
   */
  connect(element: HTMLElement): void {
    element.addEventListener(DI_REQUEST_EVENT_NAME, this.handleRequestEvent.bind(this));
  }

  /**
   * Disconnects the resolve from the given element
   * @param element
   */
  disconnect(element: HTMLElement): void {
    element.removeEventListener(DI_REQUEST_EVENT_NAME, this.handleRequestEvent.bind(this));
  }
}