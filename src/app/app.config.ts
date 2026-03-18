import {
  ApplicationConfig,
  importProvidersFrom,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { routes } from './app.routes';
import { ApiModule, Configuration, AuthService as GoaldoneAuthApi } from './api';
import { environment } from '../environments/environment';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { authInterceptor } from './core/auth.interceptor';
import { AuthStore } from './core/auth.store';
import { catchError, of, tap } from 'rxjs';

export const appConfig: ApplicationConfig = {
    providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideBrowserGlobalErrorListeners(),
        provideAnimationsAsync(),
        providePrimeNG({
            theme: {
                preset: GoaldoneTheme,
                options: {
                    darkModeSelector: '[data-theme="dark"]',
                },
            },
        }),
        provideRouter(routes),
        importProvidersFrom(
            ApiModule.forRoot(
                () =>
                    new Configuration({
                        basePath: environment.apiBasePath,
                        withCredentials: true,
                    }),
            ),
        ),
        provideAppInitializer(() => {
            const authApi = inject(GoaldoneAuthApi);
            const store = inject(AuthStore);
            return authApi
                .refreshToken('')
                .pipe(
                    take(1),
                    tap((res) => store.setTokens(res.accessToken)),
                    catchError(() => of(null)),
                );
        }),
    ],
};
