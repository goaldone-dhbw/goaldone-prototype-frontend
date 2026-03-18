import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/landing/landing.page').then((m) => m.LandingPage),
    },
  {
    path: 'app',
    loadComponent: () =>
      import('./core/layouts/app-shell/app-shell.component').then(
      (m) => m.AppShellComponent,
      ),
    children: [
      {
      path: '',
      loadComponent: () =>
        import('./features/workspace/workspace-home.page').then(
        (m) => m.WorkspaceHomePage,
        ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'app',
  },
];
