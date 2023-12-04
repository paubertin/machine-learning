import { Constructable } from "./framework";

const injectableMetadataKey = 'injectable';

class DIContainer {
  public providers: Map<string, any> = new Map();

  public resolve (token: string) {
    const provider = this.providers.get(token);
    if (provider) {
      return provider;
    }
    else {
      throw new Error(`No provider found for ${token}`);
    }
  }
}

const container = new DIContainer();

export function Injectable(): ClassDecorator {
  return function (target: any) {
    container.providers.set(target.name, new target());
  };
}

export function isInjectable(target: Function): boolean {
  return Reflect.getMetadata(injectableMetadataKey, target) === true;
}

export function Inject(token: string) {
  return function (target: any, key: string) {
    Object.defineProperty(target, key, {
      get: () => container.resolve(token),
      enumerable: true,
      configurable: true,
    });
  }
}

interface Type<T> {
  new(...args: any[]): T;
}

export class Injector extends Map {

  public resolve<T>(target: Type<any>): T {
    console.log('reflect', Reflect.getMetadataKeys(target), target);
      const tokens = Reflect.getMetadata('design:paramtypes', target) || [];
      const injections = tokens.map((token: Type<any>) => this.resolve<any>(token));

      const classInstance = this.get(target);
      if (classInstance) {
          return classInstance;
      }

      const newClassInstance = new target(...injections);
      this.set(target, newClassInstance);

      console.log(`DI-Container created class ${newClassInstance.constructor.name}`);

      return newClassInstance;
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

export const bootstrap = <T>(target: Type<any>): [T, () => void] => {
  // there is exactly one Injector pro entry point class instance
  const injector = new Injector();
  // bootstrap all dependencies
  const entryClass = injector.resolve<T>(target);

  return [entryClass, () => injector.release()];
};