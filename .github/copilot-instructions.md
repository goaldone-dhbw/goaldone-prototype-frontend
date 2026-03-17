# GitHub Copilot Instructions – Goaldone Frontend

## Project overview
Goaldone is a browser-based task planning system for organizations, built with Angular 21, PrimeNG 21, Lucide Angular, and an OpenAPI-generated HTTP client. It implements a multi-tenant architecture with strict tenant isolation enforced by the backend via JWT claims.

## Repository structure
- `src/app/api/` — fully generated HTTP client, never edit manually.
- `src/app/core/` — app-wide singletons including `auth.store.ts` for state, `auth.interceptor.ts` for HTTP logic, and `auth.service.ts` for flows.
- `src/app/features/` — feature-specific components and logic (currently empty).
- `src/app/shared/` — reusable pipes and utilities; no custom UI primitives (use PrimeNG).
- `src/environments/` — environment-specific configurations for dev and prod API base URLs.

## Key commands
- `ng serve` — start dev server using `environment.ts`.
- `ng serve --configuration=production` — start dev server with production environment.
- `ng build` — build the application.
- `npm run build:prod` — production build with optimizations and `environment.prod.ts`.
- `npm run generate:api` — regenerate the HTTP client from `openapi.yaml`. Run this immediately after any changes to the OpenAPI spec.
- `npm test` — run unit tests via Vitest.

## Authentication architecture
- **Access Token**: Stored exclusively in memory via an Angular Signal in `AuthStore`. Never write it to `localStorage` or `cookies`.
- **Refresh Token**: Managed as an `HttpOnly` cookie by the browser. JavaScript cannot read it. It is sent automatically to `/auth/refresh` and `/auth/logout`.
- **Token Rotation**: Every call to `/auth/refresh` invalidates the old cookie and sets a new one. The `authInterceptor` ensures only one refresh request is in-flight at a time.
- **Request Metadata**: Use `withCredentials: true` for any request that requires the refresh token cookie (login, refresh, logout, accept invitation).
- **Silent Refresh**: Triggered on app initialization via `provideAppInitializer` in `app.config.ts`.

## API client
- Generated code lives in `src/app/api/`. Do not modify these files.
- Inject services using `inject(TasksService)`, `inject(AuthService)`, etc.
- Configure the client via `ApiModule.forRoot()` in `app.config.ts`.
- Use `withCredentials` selectively via the interceptor or `HttpContext` tokens (e.g., `NEEDS_CREDENTIALS`).

## OpenAPI contract

| Tag | Generated service | Example methods |
|-----|------------------|-----------------|
| auth | AuthService | `login()`, `refreshToken()`, `logout()`, `acceptInvitation()` |
| users | UsersService | `getMyProfile()`, `updateMyProfile()`, `deleteMyAccount()` |
| organizations | OrganizationsService | `getMyOrganization()`, `updateOrganizationSettings()` |
| members | MembersService | `listMembers()`, `removeMember()`, `updateMemberRole()` |
| invitations | InvitationsService | `listInvitations()`, `createInvitation()`, `revokeInvitation()` |
| tasks | TasksService | `listTasks()`, `createTask()`, `getTask()`, `completeTask()` |
| breaks | BreaksService | `listBreaks()`, `createBreak()`, `updateBreak()`, `deleteBreak()` |
| schedule | ScheduleService | `getSchedule()`, `generateSchedule()` |
| admin | AdminService | `listOrganizations()`, `createOrganization()`, `addSuperAdmin()` |

## Coding rules

### General Angular rules
- Always use standalone components.
- Always use `inject()` for dependency injection.
- Always lazy-load routes via `loadComponent` in `app.routes.ts`.
- Use Angular Signals (`signal`, `computed`) for all local and shared state.
- Use RxJS only for HTTP streams and complex async coordination.
- Always set `changeDetection: ChangeDetectionStrategy.OnPush` in component decorators.
- Use native control flow (`@if`, `@for`, `@switch`) in templates.

### API and authentication rules
- Never edit files in `src/app/api/`.
- Never store the refresh token in JavaScript variables or storage.
- Never add `refreshToken` to any request body; it is handled via cookies.
- Always set `withCredentials: true` when calling endpoints that manage or require the `refresh_token` cookie.
- After modifying `openapi.yaml`, always run `npm run generate:api` before implementing UI features.

### UI components — PrimeNG only
- Only use PrimeNG components for UI primitives.
- Never use raw HTML elements when a PrimeNG equivalent exists:
  - `<button>` → `<p-button>`
  - `<input>` → `<p-inputtext>`, `<p-password>`, or `<p-inputnumber>`
  - `<select>` → `<p-select>`
  - `<table>` → `<p-table>`
  - `dialogs` → `<p-dialog>` or `<p-confirmdialog>`
- Always import the specific PrimeNG module in the component's `imports` array.

### Icons — Lucide Angular only
- Only use Lucide Angular for icons.
- Always use the `<lucide-icon>` component: `<lucide-icon name="check" [size]="20" [strokeWidth]="1.5" />`.
- Always import `LucideAngularModule` and pick required icons in `app.config.ts` or component imports.

### Styling — no TailwindCSS
- Never use TailwindCSS utility classes.
- Style exclusively with PrimeNG's theme system and component-scoped SCSS.
- Use PrimeNG design tokens for consistency: `var(--p-primary-color)`, `var(--p-surface-ground)`, etc.
- Global styles belong in `src/styles.scss` only.

## Environment switching
- **Dev**: `http://localhost:8080/api/v1` (default via `ng serve`).
- **Prod**: `https://api-prototyp.goaldone.de/api/v1` (via `--configuration=production`).
- Configuration is handled automatically by `angular.json` file replacements.
