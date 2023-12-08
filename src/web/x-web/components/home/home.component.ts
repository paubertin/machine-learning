import { BaseComponent, Component } from "../../core/component";
import { Inject } from "../../core/injection";
import { Router } from "../../core/router";

@Component({
  selector: 'home-component',
  templateUrl: 'components/home/home.component.html',
  styles: 'components/home/home.component.css',
})
export class HomeComponent extends BaseComponent {
  @Inject('router')
  private router!: Router;

  public constructor () {
    super();
    console.log('HOME CTOR', this);
  }

  public value: string = 'Bonjour';
  public num: number = 0;

  public navigate(...Args: any[]) {

    console.log('args', Args);
    console.log('Clicked!'); // Fonction de gestion de l'événement
    console.log('router', this.router);
  }

  public override async connectedCallback() {
      super.connectedCallback();
      setTimeout(() => {
        const btn = this.shadow.getElementById('navigate');
        console.log('btn', btn);
        btn?.addEventListener('click', () => {
          this.router.navigate('/about');
        })
      }, 1000);

  }
}
