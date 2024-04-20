<p align="center">
  <a href="https://angular.io/" target="blank"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Angular_full_color_logo.svg/2048px-Angular_full_color_logo.svg.png" style="width: 200px; margin: 40px 0 20px" alt="Teras Teknologi Logo" /></a>
</p>

# Merchant Portal X

This project was generated with [Angular CLI](https://github.com/angular/angular-cli)

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Run on Localhost 

To run this project correctly on local:

1. Add a url for a store on your hosts file that redirects to "127.0.0.1". For example:

```
127.0.0.1   merchant.symplified.localhost
127.0.0.1   merchant.easydukan.localhost
```

2. Start the server with the command:

```
ng s --host 0.0.0.0 --disable-host-check --port [portnumber]
```

3. Open the url which you added to the hosts file, in your browser with the port number. Like so:

```
http://merchant.symplified.localhost:[portnumber]/

OR

http://merchant.easydukan.localhost:[portnumber]/
```


## Environment Serve
```bash
# Development
$ ng serve

# Staging
$ ng serve --configuration staging

# Production (not recomended to use in production, use SPA instead)
$ ng serve --configuration production
```

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory.

```bash
npm run build
```

## Build Docker Image
After commmand `npm run build` have been executed, there should be a zip file named `fuse.zip` created at `dist/fuse.zip`.

To build the docker image, simply run `docker compose build --push`, to build and push the docker image to docker registry.

```bash
docker compose build --push
```

> Note: If you having problem pushing docker image to docker registry. See [add docker registry](http://localhost)

## Container Architecture
This docker image is based on [httpd:latest](https://hub.docker.com/_/httpd) image (see Dockerfile). Since the application only generate Single Page Application (SPA). It only require a web server (httpd:latest) to run the application. For more configuration, see https://hub.docker.com/_/httpd

## Deployment
This project encourange developer to use docker to run the application for production.

Simply run :

```bash
docker compose up -d
```

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice.  To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.