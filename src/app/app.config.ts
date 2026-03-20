import {
    ApplicationConfig,
    importProvidersFrom,
    inject,
    provideAppInitializer,
    provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { MessageService, ConfirmationService } from 'primeng/api';
import { routes } from './app.routes';
import { ApiModule, AuthService as GoaldoneAuthApi, Configuration, UsersService } from './api';
import { environment } from '../environments/environment';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { authInterceptor } from './core/auth.interceptor';
import { AuthStore } from './core/auth.store';
import { catchError, of, switchMap, take, tap } from 'rxjs';
import { GoaldoneTheme } from './GoaldoneTheme';

export const appConfig: ApplicationConfig = {
    providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideBrowserGlobalErrorListeners(),
        provideAnimationsAsync(),
        MessageService,
        ConfirmationService,
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
            const usersApi = inject(UsersService);
            const store = inject(AuthStore);

            return authApi.refreshToken('').pipe(
                take(1),
                switchMap((res) => {
                    store.setTokens(res.accessToken);
                    // Wenn wir noch keinen User im Store haben (z.B. nach Reload im frischen Tab),
                    // müssen wir das Profil laden um die Rolle zu kennen.
                    if (!store.user()) {
                        return usersApi.getMyProfile().pipe(
                            tap((user) => store.setTokens(res.accessToken, user)),
                            catchError(() => of(null)),
                        );
                    }
                    return of(res);
                }),
                catchError(() => of(null)),
            );
        }),
    ],
};
