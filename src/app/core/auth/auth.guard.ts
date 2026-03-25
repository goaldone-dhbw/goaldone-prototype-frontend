import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from '../../api';
import { AuthStore } from './auth.store';

/**
 * Erlaubt Zugriff nur für eingeloggte Nutzer.
 */
export const authGuard: CanActivateFn = () => {
    const store = inject(AuthStore);
    const router = inject(Router);

    if (store.isLoggedIn()) {
        return true;
    }

    return router.parseUrl('/login');
};

/**
 * Erlaubt Zugriff nur für nicht-eingeloggte Nutzer (z.B. Login-Seite).
 */
export const guestGuard: CanActivateFn = () => {
    const store = inject(AuthStore);
    const router = inject(Router);

    if (!store.isLoggedIn()) {
        return true;
    }

    return router.parseUrl('/app');
};

/**
 * Only allow access for users with one of the allowed roles.
 * @param allowedRoles
 */
export const roleGuard =
    (allowedRoles: readonly Role[]): CanActivateFn =>
    () => {
        const store = inject(AuthStore);

        if (!store.isLoggedIn()) {
            return inject(Router).parseUrl('/login');
        }

        const currentRole = store.role();
        if (currentRole && allowedRoles.includes(currentRole)) {
            return true;
        }

        return inject(Router).parseUrl('/app');
    };

/**
 * Only allow access for users without one of the excluded roles.
 *
 * @param excludedRoles
 * @param redirectUrl
 */
export const excludeRolesGuard =
    (excludedRoles: readonly Role[], redirectUrl: string): CanActivateFn =>
    () => {
        const store = inject(AuthStore);

        if (!store.isLoggedIn()) {
            return inject(Router).parseUrl('/login');
        }

        const currentRole = store.role();
        if (currentRole && excludedRoles.includes(currentRole)) {
            return inject(Router).parseUrl(redirectUrl);
        }

        return true;
    };
