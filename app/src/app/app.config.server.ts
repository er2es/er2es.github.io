import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { LocationStrategy, TrailingSlashPathLocationStrategy } from '@angular/common';
import { provideRouter } from '@angular/router';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { routes } from './app.routes';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    // server only: the router just tells the prerenderer which pages exist (it renders no outlet)
    provideRouter(routes),
    { provide: LocationStrategy, useClass: TrailingSlashPathLocationStrategy },
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
