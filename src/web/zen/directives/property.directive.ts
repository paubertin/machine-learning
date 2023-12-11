import { ABORT, AbstractDirective, NodeProcessInfo, NodeProcessResult, block, dashToCamel } from "./directive";

export class PropertyDirective extends AbstractDirective {

  public override attribute (_attr: Attr, nodeName: string, _nodeValue: string): boolean {
    return nodeName.startsWith('.');
  }

  public override process (info: NodeProcessInfo): NodeProcessResult {
    const propertyName = dashToCamel(info.attributeName.slice(1));
    return {
      update: (value) => {
        if ((info.targetNode as any)[block] === ABORT) return;
        (info.targetNode as any)[propertyName] = value;
      },
      removeAttribute: true,
    };
  }
  
}