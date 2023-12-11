import 'reflect-metadata';
import { BaseComponent } from './component';

export const InputMetadataKey = Symbol('InputMetadataKey');

export type InputsMetadata = { propertyKey: string; originalKey?: string }[];

export function Input () {
  return function (target: any, propertyKey: string) {
    let accessor: ((component: BaseComponent) => any) | undefined = undefined;
    let prop = propertyKey;
    let originalKey: string | undefined = undefined
    if (prop !== prop.toLowerCase()) {
      console.warn('Input attributes should be lowercase...');
      prop = propertyKey.toLowerCase();
      accessor = (component: BaseComponent) => {
        component[propertyKey as keyof BaseComponent];
      };
      originalKey = propertyKey;
    }
    const inputs: InputsMetadata = Reflect.getMetadata(InputMetadataKey, target.constructor) || [];
    inputs.push({
      propertyKey: prop,
      originalKey,
    });
    Reflect.defineMetadata(InputMetadataKey, inputs, target.constructor);
  }
}

export const RefsMetadataKey = Symbol('RefsMetadataKey');

export interface ReferenceMetadata {
  propertyKey: string | symbol;
  getter: (scope: BaseComponent) => any;
}

export function Ref (selector: string): PropertyDecorator {
  return function (target, propertyKey) {
    const refs: Map<string, ReferenceMetadata> = Reflect.getMetadata(RefsMetadataKey, target.constructor) || new Map();
    refs.set(selector, {
      propertyKey,
      getter: (scope: BaseComponent) => scope.shadow.querySelector('#' + selector),
    });
    Reflect.defineMetadata(RefsMetadataKey, refs, target.constructor);
  }
}