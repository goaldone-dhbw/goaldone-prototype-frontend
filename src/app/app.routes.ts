import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/auth.guard';
import { Role } from './api';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/landing/landing.page').then((m) => m.LandingPage),
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
                path: 'schedule',
                loadComponent: () =>
                    import('./features/schedule/schedule.page').then((m) => m.SchedulePage),
            },
            {
                path: 'organization',
                canActivate: [roleGuard([Role.Admin])],
                loadComponent: () =>
                    import('./features/org-settings/org-settings.page').then(
                        (m) => m.OrgSettingsPage,
                    ),
            },
            {
                path: 'super-admin',
                canActivate: [roleGuard([Role.SuperAdmin])],
                loadComponent: () =>
                    import('./features/super-admins-settings/super-admin.page').then((m) => m.SuperAdminPage)
            },
            {
                path: 'settings',
                loadComponent: () =>
                    import('./features/settings/settings.page').then((m) => m.SettingsPage),
            },
        ],
    },
    {
        path: 'invitations/:token',
        loadComponent: () =>
            import('./features/invitation-accept/invitation-accept.page').then(
                (m) => m.InvitationAcceptPage,
            ),
    },
    {
        path: '**',
        redirectTo: 'app',
    },
];
