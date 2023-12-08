import { BaseComponent, Component } from "../../core/component";

@Component({
  selector: 'input-component',
  templateUrl: 'components/input/input.component.html',
})
export class InputComponent extends BaseComponent {

  public get type () {
    return this.getAttribute('type')!;
  }

  public override async connectedCallback() {
    await super.connectedCallback();
    const nativeInputElement = this.shadow.querySelector<HTMLInputElement>('input')!;
    nativeInputElement.setAttribute('type', this.type);
    
  }
}