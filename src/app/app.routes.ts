import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guard';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
            import('./features/landing/landing.page').then((m) => m.LandingPage),
    },
    {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () =>
            import('./features/login/login.component').then((m) => m.LoginComponent),
    },

    {
        path: 'app',
        canActivate: [authGuard],
        canActivateChild: [authGuard],
        loadComponent: () =>
            import('./core/layouts/app-shell/app-shell.component').then((m) => m.AppShellComponent),
        children: [
            {
                path: '',
                loadComponent: () =>
                    import('./features/workspace/workspace-home.page').then(
                        (m) => m.WorkspaceHomePage,
                    ),
            },
            {
                path: 'settings',
                loadComponent: () =>
                    import('./features/settings/settings.component').then(
                        (m) => m.SettingsComponent,
                    ),
            },
        ],
    },
    {
        path: '**',
        redirectTo: 'login',
    },
];
