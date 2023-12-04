import 'reflect-metadata';

import { Inject, Injectable, bootstrap } from "./injection";
import { BaseComponent, Component } from './base.component';
import { Config } from './framework';

@Injectable()
class HttpService {
  /*
  some methods...
  */

  public async get () {
    // implements get method
  }
}

@Injectable()
class UserService {
  public constructor (private http: HttpService) {}

  public async getUsers () {
    return this.http.get(/** to be implemented */);
  }
}

@Injectable()
class Router {
  public async navigateTo (_path: string) {
    // implements navigation
  }
}

@Component({
  template: 'path_to_home.component.html',
  style: 'path_to_home.component.css',
})
class HomeComponent extends BaseComponent {
  @Inject('Router')
  private router!: Router;
  public constructor () {
    super();
  }

  public async navigateToUserPage () {
    await this.router.navigateTo('users')
  }
}

@Component({
  template: 'path_to_user.component.html',
  style: 'path_to_user.component.css',
})
class UserComponent extends BaseComponent{
  public constructor (private userService: UserService) {
    super();
  }

  public async getUsers () {
    await this.userService.getUsers();
  }
}


@Config({
  rootId: 'app',
  components: [
    HomeComponent,
    UserComponent,
  ],
  services: [
    UserService,
    HttpService,
    Router,
  ],
  routes: [
    {
      path: 'home',
      component: HomeComponent,
    },
    {
      path: 'users',
      component: UserComponent,
    }
  ],
})
class App {
}

const app = new App();

console.log('app', app);

bootstrap(UserComponent);