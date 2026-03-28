import { Routes } from '@angular/router';
import { authGuard, excludeRolesGuard, guestGuard, roleGuard } from './core/auth/auth.guard';
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
                canActivate: [excludeRolesGuard([Role.SuperAdmin], '/app/super-admin')],
                loadComponent: () =>
                    import('./features/mainpage/mainpage').then((m) => m.MainpageComponent),
            },
            {
                path: 'schedule',
                canActivate: [excludeRolesGuard([Role.SuperAdmin], '/app/super-admin')],
                loadComponent: () =>
                    import('./features/schedule/schedule.page').then((m) => m.SchedulePage),
            },
            {
              path: 'working-hours',
              canActivate: [excludeRolesGuard([Role.SuperAdmin], '/app/super-admin')],
              loadComponent: () =>
                import('./features/working-hours/working-hours.page').then((m) => m.WorkingHoursPage),
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
                    import('./features/super-admins-settings/super-admin.page').then(
                        (m) => m.SuperAdminPage,
                    ),
            },
            {
                path: 'settings',
                loadComponent: () =>
                    import('./features/user-settings/user-settings.page').then(
                        (m) => m.UserSettingsPage,
                    ),
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
