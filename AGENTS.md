# AGENTS.md – Goaldone Frontend

## 1. Project overview
Goaldone is a browser-based task planning system for organizations (TINF2024 project). It allows users to manage tasks and breaks while an algorithm generates an optimized weekly schedule. The tech stack is based on Angular 21, PrimeNG 21, PrimeIcons, and an HTTP client generated via OpenAPI Generator.

## 2. Repository structure
```text
src/app/
├── api/            — Generated HTTP client and models; never edit manually.
├── core/           — App-wide singletons including AuthStore, AuthInterceptor, and AuthService.
├── features/       — Feature-specific components and logic (lazy-loaded).
├── shared/         — Reusable UI components, pipes, and directives.
└── environments/   — Configuration for dev vs prod API base URLs.
```

## 3. Key commands
- `ng serve` — Starts the development server (uses `environment.ts`).
- `ng serve --configuration=production` — Starts the server with the production environment.
- `ng build --configuration=production` — Generates a production build in the `dist/` folder.
- `npm run generate:api` — Regenerates the HTTP client in `src/app/api/` from `openapi.yaml`. Run this whenever the API contract changes.
- `npm test` — Runs unit tests using Vitest.

## 4. Authentication architecture
Goaldone uses a secure hybrid JWT/Cookie authentication flow:
- **Access Token**: A short-lived (15 min) JWT stored in memory only (Angular signal in `AuthStore`). It is never written to `localStorage` or `sessionStorage`. It is lost on page reload and must be restored via a silent refresh.
- **Refresh Token**: A long-lived (7 days) HttpOnly Cookie set by the server. It is invisible to JavaScript (XSS-safe). The browser sends it automatically to `/auth/refresh` and `/auth/logout` when `withCredentials: true` is set.
- **Token Rotation**: Every call to `/auth/refresh` invalidates the old cookie and issues a new one. Parallel refresh calls are queued behind a single in-flight request in the `AuthInterceptor`.
- **Silent Refresh**: The `provideAppInitializer` in `app.config.ts` calls `refreshToken()` on application boot to restore the session across page reloads.

## 5. API client (generated)
- The client lives in `src/app/api/` and is fully generated from `openapi.yaml` — **never edit these files manually**.
- To update the client, modify `openapi.yaml` in the root and run `npm run generate:api`.
- API services (e.g., `TasksService`, `AuthService`) should be injected directly using `inject()`.
- The `ApiModule.forRoot()` in `app.config.ts` configures the base URL from `environment.apiBasePath`.
- `withCredentials` is applied selectively in the `AuthInterceptor` for endpoints that require the refresh token cookie.

## 6. Coding rules for agents
Follow this checklist for every change:

- [ ] **Never edit files inside `src/app/api/`** — modify `openapi.yaml` and run the generator instead.
- [ ] **Never store the refresh token in JavaScript** (no signals, no variables, no storage).
- [ ] **Never add `{ refreshToken }` to the body** of `/auth/refresh` or `/auth/logout` — the API expects no body for these calls.
- [ ] **Always use standalone components** — Angular 20+ defaults to standalone.
- [ ] **Import PrimeNG modules per-component**, not globally.
- [ ] **Use `inject()`** instead of constructor injection for all dependencies.
- [ ] **Use Angular Signals** (`signal()`, `computed()`) for state management — avoid RxJS subjects for state.
- [ ] **Use RxJS only for async streams** (HTTP, interceptors, coordination).
- [ ] **Lazy-load all feature routes** via `loadComponent`.
- [ ] **Regenerate the API** after any change to `openapi.yaml` before writing feature code.

**UI components**
- [ ] **Only use PrimeNG components** for UI elements — no custom-written UI primitives (buttons, inputs, tables, etc.).
- [ ] **Check https://primeng.org/components** first; if a component exists, you MUST use it.
- [ ] **Never use raw HTML tags** like `<button>` or `<input>` if a PrimeNG equivalent (`p-button`, `p-inputtext`) exists.
- [ ] **Explicitly import each PrimeNG module** in the component's `imports` array.

### UI components — PrimeNG only
- Only use PrimeNG components for UI primitives.
- Never use raw HTML elements when a PrimeNG equivalent exists:
    - `<button>` → `<p-button>`
    - `<input>` → `<p-inputtext>`, `<p-password>`, or `<p-inputnumber>`
    - `<select>` → `<p-select>`
    - `<table>` → `<p-table>`
    - `dialogs` → `<p-dialog>` or `<p-confirmdialog>`
- Always import the specific PrimeNG module in the component's `imports` array.

### Icons — PrimeIcons only
- Only use PrimeIcons (`pi pi-*`) for icons.
- Use PrimeNG-compatible icon usage, for example: `icon="pi pi-check"` on PrimeNG components or `<i class="pi pi-check"></i>` where needed.
- Ensure PrimeIcons stylesheet is available globally via `src/styles.scss`.


**Styling**
- [ ] **No TailwindCSS** — do not use utility classes (e.g., `flex`, `p-4`).
- [ ] **Style exclusively with PrimeNG's theme** and component-specific SCSS files.
- [ ] **Use Design Tokens** (e.g., `var(--p-primary-color)`) for colors and spacing — no hardcoded hex or pixel values.
- [ ] **Global styles** belong in `src/styles.scss` only.

## 7. Environment switching
- **Dev**: `ng serve` → `http://localhost:8080/api/v1`
- **Prod**: `ng serve --configuration=production` → `https://api-prototyp.goaldone.de/api/v1`
- The switch is handled automatically via `fileReplacements` in `angular.json`.

## 8. OpenAPI contract summary

| Tag | Generated Service | Example methods |
|-----|------------------|-----------------|
| auth | AuthService | login(), refreshToken(), logout(), changePassword() |
| users | UsersService | getMyProfile(), updateMyProfile(), deleteMyAccount() |
| organizations | OrganizationsService | getMyOrganization(), updateOrganizationSettings() |
| members | MembersService | listMembers(), removeMember(), updateMemberRole() |
| invitations | InvitationsService | listInvitations(), createInvitation(), revokeInvitation() |
| tasks | TasksService | listTasks(), createTask(), completeTask(), reopenTask() |
| breaks | BreaksService | listBreaks(), createBreak(), updateBreak(), deleteBreak() |
| schedule | ScheduleService | getSchedule(), generateSchedule() |
| admin | AdminService | listOrganizations(), createOrganization(), addSuperAdmin() |
