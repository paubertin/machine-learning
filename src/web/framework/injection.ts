import 'reflect-metadata';

class DIContainer {
  private services: Map<string, any> = new Map();

  public registerService (key: string, service: any) {
    this.services.set(key, service);
  }

  public resolveService (key: string) {
    return this.services.get(key);
  }
}

const dIContainer = new DIContainer();

export function Injectable (): ClassDecorator {
  return function (target: any) {
    dIContainer.registerService(target.name, new target());
  }
}


export function Inject(serviceName: string) {
  return function(target: any, propertyKey: string | symbol, parameterIndex: number) {
    const constructor = target.constructor;
    const existingInjectionMetadata = Reflect.getOwnMetadata('injections', constructor) || [];

    // Ajoute les informations sur l'injection de dépendances au constructeur du composant
    existingInjectionMetadata.push({ index: parameterIndex, serviceName });
    Reflect.defineMetadata('injections', existingInjectionMetadata, constructor);
  };
}