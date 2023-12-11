
type AttributeTest = (attr: Attr, nodeName: string, nodeValue: string) => any;

export interface NodeProcessInfo {
  scopeNode: Element;
  targetNode: Element;
  targetNodeName: string;
  attribute: Attr;
  attributeName: string;
  attributeValue: string | null;
  expression: string;
  context: any;
  props: (string | Symbol)[];
}

export interface NodeProcessResult {
  update: (value: any, forceUpdate: boolean) => any;
  removeAttribute?: boolean;
  removeNode?: boolean;
  noInvocation?: boolean;
}

type NodeProcessor = (info: NodeProcessInfo) => NodeProcessResult;

export abstract class AbstractDirective {
  public abstract attribute (attr: Attr, nodeName: string, nodeValue: string): boolean;

  public abstract process(info: NodeProcessInfo): NodeProcessResult;

  public noExecution: boolean = false;
}

const d2c = /-[a-z]/g;

export function dashToCamel (dash: string) {
  return dash.indexOf('-') < 0 ? dash : dash.replace(d2c, (m) => m[1].toUpperCase());
}

export const block = Symbol('block');
export const ABORT = 'abort';

class DirectiveRegistry extends Array<AbstractDirective> {
  public add <D extends typeof AbstractDirective>(directiveClass: D, unshift: boolean = false) {
    if (directiveClass.name === AbstractDirective.name) {
      throw new Error('Cannot instanciate abstract directive');
    }
    const directive = new (directiveClass as any)();
    unshift ? this.unshift(directive) : this.push(directive);
    return this;
  }
}

export const directivesRegistry = new DirectiveRegistry();