import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/landing/landing.page').then((m) => m.LandingPage),
    },
    {
        path: 'app',
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
                    import('./features/settings/settings-dev-shell.component').then(
                        (m) => m.SettingsDevShellComponent,
                    ),
            },
            {
                path: 'login',
                loadComponent: () =>
                    import('./features/login/login.component').then((m) => m.LoginComponent),
            },
        ],
    },
    {
        path: '**',
        redirectTo: 'login',
    },
];
