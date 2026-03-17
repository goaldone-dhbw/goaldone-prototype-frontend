import {
  ApplicationConfig,
  Component,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { routes } from './app.routes';
import { ApiModule, Configuration } from './api';
import { environment } from '../environments/environment';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideBrowserGlobalErrorListeners(),
    providePrimeNG({
      theme: {
        preset: Aura, // or Material, Lara, Nora
      },
    }),
    provideRouter(routes),
    importProvidersFrom(
      ApiModule.forRoot(
        () =>
          new Configuration({
            basePath: environment.apiBasePath,
            credentials: {
              bearerAuth: () => localStorage.getItem('accessToken') ?? '',
            },
          }),
      ),
    ),
  ],
};
