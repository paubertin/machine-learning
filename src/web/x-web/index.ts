import 'reflect-metadata';

class DIContainer {
  public providers: Map<string, any> = new Map();

  public resolve(token: string) {
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

export function Inject(token: string) {
  return function (target: any, key: string) {
    Object.defineProperty(target, key, {
      get: () => container.resolve(token),
      enumerable: true,
      configurable: true,
    });
  }
}

@Injectable()
class Router {
  private routes: { [key: string]: typeof BaseComponent };

  public constructor() {
    this.routes = {};
  }

  public addRoute(path: string, component: typeof BaseComponent) {
    this.routes[path] = component;
  }

  public navigate(path: string) {
    const component = this.routes[path];
    if (component) {
      const outlet = document.getElementById('app');
      if (outlet) {
        outlet.innerHTML = '';
        const pageComponent = document.createElement(component.metadata.selector) as BaseComponent;
        outlet.appendChild(pageComponent);
      }
    }
    else {
      console.error('Route non trouvée');
    }
  }
}

const componentMetadataSymbol = Symbol('component-metadata');

interface ComponentConfig {
  selector: string;
  template: string;
  styles?: string;
}

function Component(config: ComponentConfig) {
  return <T extends typeof BaseComponent>(target: T) => {
    Reflect.defineMetadata(componentMetadataSymbol, config, target);
  };
}

function getAllMethods(obj: any): string[] {
  let methods: string[] = [];
  let currentObj = obj;

  while (currentObj && currentObj !== Object.prototype) {
    const keys = Object.getOwnPropertyNames(Object.getPrototypeOf(currentObj));
    const objMethods = keys.filter(key => typeof obj[key] === 'function' && key !== 'constructor');
    methods = methods.concat(objMethods);
    currentObj = Object.getPrototypeOf(currentObj);
  }

  return methods;
}

function getAllAttributes (obj: any): string[] {
  let attrs: string[] = [];
  let currentObj = obj;

  while (currentObj && currentObj !== Object.prototype) {
    const keys =  Object.getOwnPropertyNames(currentObj);
    const attrKeys = keys.filter(key => typeof obj[key] !== 'function' && key !== 'constructor');
    attrs = attrs.concat(attrKeys);
    currentObj = Object.getPrototypeOf(currentObj);
  }

  return attrs;

}

class BaseComponent extends HTMLElement {
  protected template: HTMLTemplateElement;

  public constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.template = document.createElement('template');
  }

  protected get shadow() {
    return this.shadowRoot!;
  }

  public templateContent: string = '';

  public static get metadata() {
    return Reflect.getMetadata(componentMetadataSymbol, this) as ComponentConfig;
  }

  protected bindModel<K extends keyof this>(element: HTMLElement, property: K) {
    // Gérer les événements pour les éléments liés
    if (element instanceof HTMLInputElement) {

      element.addEventListener('input', () => {
        let value: string | number = element.value;
        if (element.type === 'number') {
          value = parseFloat(value);
        }
        this[property] = value as any;
      });

      // Mettre en place la liaison de données dans les deux sens
      Object.defineProperty(this, property, {
        get: () => element.type === 'number' ? parseFloat(element.value) : element.value,
        set: (value: any) => {
          console.log('setter', value);
          if (element.type === 'number') {
            element.value = String(value);
          } else {
            element.value = value as string;
          }
        },
        enumerable: true,
        configurable: true,
      });
    }
  }

  public async connectedCallback() {
    const metadata = (this.constructor as typeof BaseComponent).metadata;
    try {
      const templateResponse = await fetch(metadata.template);
      if (!templateResponse.ok) {
        throw new Error(`Erreur lors du chargement du template pour ${this.constructor.name}`);
      }
      const templateContent = await templateResponse.text();
      this.template.innerHTML = templateContent;
      if (metadata.styles) {
        const style = document.createElement('style');
        style.setAttribute('type', 'text/css');
        style.textContent = `@import url('${metadata.styles}')`;
        this.shadow.appendChild(style);
      }
      this.shadow.appendChild(this.template.content.cloneNode(true));
    }
    catch (error) {
      console.error(error);
    }

    const modelElements = this.shadow.querySelectorAll<HTMLElement>('[model]');
    modelElements.forEach((element) => {
      const propertyName = element.getAttribute('model') as keyof this;
      if (propertyName) {
        const propertyValue = this[propertyName];
        if (propertyValue !== undefined && propertyValue !== null) {
          element.setAttribute('value', String(propertyValue));
        }
        this.bindModel(element, propertyName);
      }
    });

    const allElements = this.shadow.querySelectorAll<HTMLElement>('*');
    allElements.forEach((element) => {
      const eventAttributes = Array.from(element.attributes)
        .filter(attr => attr.name.startsWith('(') && attr.name.endsWith(')'));
      // console.log('eventAttributes', eventAttributes);
      eventAttributes.forEach((attr) => {
        const eventName = attr.name.slice(1, -1); // Récupérer le nom de l'événement sans les parenthèses
        const codeToExecute = attr.value; // Récupérer le code à exécuter

        const keys = getAllAttributes(this);
        const methodKeys = getAllMethods(this);
        const allKeys = keys.concat(methodKeys.filter(key => !keys.includes(key)));

        const strings = allKeys // .filter(key => typeof (this as any)[key] === 'function') // Filtrer les méthodes
          .map(key => `${key} = this.${key}`); // Créer des chaînes de texte pour attacher les méthodes

        const functionBody = `
${strings.join(';\n')}; // Attacher les méthodes au scope global
${codeToExecute} // Exécuter le code spécifié
`;
        const eventHandler = new Function(functionBody).bind(this); // Créer une nouvelle fonction avec le code et les méthodes attachées
        // console.log('event', eventHandler);
        element.addEventListener(eventName, eventHandler);
      });
    });
  }

  disconnectedCallback() { }

  adoptedCallback() { }

  attributeChangedCallback(name: string, oldValue: any, newValue: any) { }

  public async render() { }
}

@Component({
  selector: 'home-component',
  template: 'home.component.html',
  styles: 'home.component.css',
})
class HomeComponent extends BaseComponent {

  @Inject('Router')
  private router!: Router;

  public value: string = 'Bonjour';
  public num: number = 0;

  public navigate(...Args: any[]) {

    console.log('args', Args);
    console.log('Clicked!'); // Fonction de gestion de l'événement
    console.log('router', this.router);
  }
}

registerComponent(HomeComponent);

@Component({
  selector: 'about-component',
  template: 'about.component.html',
  styles: 'about.component.css',
})
class AboutComponent extends BaseComponent {
}

function registerComponent<T extends typeof BaseComponent>(component: T) {
  customElements.define(component.metadata.selector, component);
}

registerComponent(AboutComponent);

@Component({
  selector: 'input-component',
  template: 'input.component.html',
})
class InputComponent extends BaseComponent {

  public get type () {
    return this.getAttribute('type')!;
  }

  public override async connectedCallback() {
    await super.connectedCallback();
    const nativeInputElement = this.shadow.querySelector<HTMLInputElement>('input')!;
    console.log('input el', nativeInputElement);
    nativeInputElement.setAttribute('type', this.type);
    
  }
}


registerComponent(InputComponent);


async function main() {
  const router = new Router();

  router.addRoute('/home', HomeComponent);
  router.addRoute('/about', AboutComponent);

  window.addEventListener('DOMContentLoaded', async () => {
    router.navigate('/home');
  });
}

void main();
