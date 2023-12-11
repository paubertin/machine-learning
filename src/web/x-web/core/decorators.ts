import { BaseComponent } from "./component";

export type Interface<T> = {
  [K in keyof T]: T[K];
};

export const desc = (obj: object, name: PropertyKey | ClassAccessorDecoratorContext, descriptor: PropertyDescriptor) => {
  descriptor.configurable = true;
  descriptor.enumerable = true;
  if (typeof name !== 'object') {
    Object.defineProperty(obj, name, descriptor);
  }
  return descriptor;
}

export type QueryDecorator = {
  <C extends Interface<BaseComponent>, V extends Element | null>(
    value: ClassAccessorDecoratorTarget<C, V>,
    context: ClassAccessorDecoratorContext<C, V>
  ): ClassAccessorDecoratorResult<C, V>;
};

export function query (selector: string) {
  return (<C extends Interface<BaseComponent>, V extends Element | null>(
    protoOrTarget: any,
    nameOrContext: PropertyKey | ClassAccessorDecoratorContext<C, V>,
    _descriptor?: PropertyDescriptor
  ) => {
    debugger;
    const doQuery = (el: BaseComponent) => {
      debugger;
      return el.shadowRoot?.querySelector(selector) ?? null;
    };
    return desc(
      protoOrTarget,
      nameOrContext,
      {
        get (this: BaseComponent) {
          debugger;
          return doQuery(this);
        },
      },
    );
  }) as any;
}

export function BindEvent (selector: string, eventType: string) {
  return (target: BaseComponent, propertyKey: string, _descriptor: PropertyDescriptor) => {
    (target.constructor as any)._eventHandlers.push({ selector, eventType, propertyKey });
  }
}