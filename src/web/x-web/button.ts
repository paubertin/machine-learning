// HomeComponent.ts
class HomeComponent extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = `<h1>Accueil</h1><p>Bienvenue sur la page d'accueil !</p>`;
  }
}

customElements.define('home-component', HomeComponent);

// AboutComponent.ts
class AboutComponent extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = `<h1>À propos</h1><p>Informations sur nous...</p>`;
  }
}

customElements.define('about-component', AboutComponent);

// Router.ts

class Router {
  private routes: { [key: string]: any };

  constructor() {
    this.routes = {};
  }

  addRoute(path: string, component: any) {
    this.routes[path] = component;
  }

  navigate(path: string) {
    debugger;
    const component = this.routes[path];
    if (component) {
      const outlet = document.getElementById('app'); // L'élément où les pages seront affichées
      if (outlet) {
        outlet.innerHTML = ''; // Nettoyer le contenu précédent
        const pageComponent = document.createElement(component);
        outlet.appendChild(pageComponent);
      }
    } else {
      console.error('Route non trouvée');
    }
  }
}

// main.ts

// Import des composants de page

// Instanciation du Router
const router = new Router();

// Ajout des routes
router.addRoute('/home', HomeComponent);
router.addRoute('/about', AboutComponent);

console.log(customElements);

// Lorsque l'URL change, le router doit afficher le composant correspondant
window.addEventListener('DOMContentLoaded', () => {
  router.navigate('/home'); // Route initiale
});