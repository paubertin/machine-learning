import 'reflect-metadata';

import { Injectable, bootstrap } from "./injection";
import { BaseComponent, Component } from './base.component';

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

class App {
}

const app = new App();

console.log('app', app);

bootstrap(UserComponent);