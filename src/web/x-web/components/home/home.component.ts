import { BaseComponent, Component } from "../../core/component";
import { Inject } from "../../core/injection";
import { Router } from "../../core/router";

@Component({
  selector: 'home-component',
  templateUrl: 'components/home/home.component.html',
  styles: 'components/home/home.component.css',
})
export class HomeComponent extends BaseComponent {

  @Inject()
  private router!: Router;

  public value: string = 'Bonjour';
  public num: number = 0;

  public navigate(event: any) {
    console.log('event', event);
    this.router.navigate('/about');
  }

  public override async connectedCallback() {
      super.connectedCallback();
  }

  public handleClick (event: any) {
    console.log('click', event);
  }

  public onMouseEnter (event: any) {
    console.log('mouseenter', event);
  }
}
