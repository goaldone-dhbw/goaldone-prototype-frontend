# @

**Goaldone** – Browserbasiertes Aufgaben-Planungssystem für Organisationen (TINF2024 Projektarbeit).  ## Authentifizierung Die API verwendet JWT Bearer Tokens. - **Access Token**: kurzlebig (15 Min.), für jeden API-Aufruf mitzusenden - **Refresh Token**: langlebig (7 Tage), nur für `POST /auth/refresh` und `POST /auth/logout` - Token Rotation: Bei jedem Refresh wird ein neues Refresh Token ausgestellt  Der JWT enthält folgende Claims: - `sub` – UUID des Nutzers - `organizationId` – UUID der Organisation (null bei SUPER_ADMIN ohne Org) - `role` – Rolle des Nutzers (`SUPER_ADMIN`, `ADMIN`, `USER`)  ## Rollen (RBAC) | Rolle | Beschreibung | |---|---| | `SUPER_ADMIN` | Plattformweite Verwaltung (Organisationen, Super-Admins) | | `ADMIN` | Verwaltung der **eigenen** Organisation (Mitglieder, Einladungen, Einstellungen) | | `USER` | Standard-Nutzer mit Zugriff auf eigene Aufgaben und Planung |  ## Mandantenfähigkeit & Tenant-Isolation Goaldone ist eine **mandantenfähige Plattform** (Multi-Tenant). Jede Ressource (Tasks, Mitglieder, Einladungen, Einstellungen) ist genau einer Organisation zugeordnet.  **Die Isolation wird ausschließlich serverseitig durchgesetzt** – niemals durch clientseitige Parameter. Konkret bedeutet das:  - Der Server liest die `organizationId` **immer aus dem JWT**, nicht aus der URL oder dem Request Body. - Ein `ADMIN` kann ausschließlich Ressourcen seiner eigenen Organisation lesen und schreiben.   Ein Zugriff auf eine fremde Organisation ist technisch unmöglich – der Server filtert   alle DB-Queries automatisch auf `WHERE organization_id = :jwtOrganizationId`. - Auch wenn ein ADMIN die UUID einer fremden Organisation kennt, erhält er bei jedem   Versuch eine `403 Forbidden` Antwort. - Nur `SUPER_ADMIN` darf organisationsübergreifend agieren (ausschließlich über `/admin/_**`).  **Endpunkt-Konvention:** Aus diesem Grund verwenden Admin-Endpunkte `/organizations/me/...` statt `/organizations/{orgId}/...`. Das `/me` signalisiert explizit, dass die Organisation aus dem JWT-Kontext stammt und kein externer Parameter übergeben werden kann.  ## Team-Vorbereitung Tasks sind aktuell benutzerspezifisch (`ownerId` = eingeloggter Nutzer). Das `ownerId`-Feld ist bewusst entkoppelt von `userId`, sodass in einer späteren Version Teams als Owner eingetragen werden können, ohne das Datenmodell zu brechen.  ## Fehlerformat Alle Fehler folgen **RFC 9457 Problem Details** mit Content-Type `application/problem+json`.  ## Paginierung Listenendpunkte unterstützen `?page=0&size=20`. Die Antwort enthält immer ein `PageMetadata`-Objekt mit `totalElements` und `totalPages`.  ## Wiederholungsaufgaben Einfaches Modell: `type` (DAILY / WEEKLY / MONTHLY) + `interval` (alle N Einheiten). Das Modell ist bewusst so strukturiert, dass es später zu RRULE (iCal-Standard) erweitert werden kann, ohne Breaking Changes zu verursachen.  ## API Versionierung Die API-Version ist einmalig im Server-Basispfad definiert (`/api/v1`). Alle Endpunkte erben diese Version automatisch. Bei einem Breaking-Change wird eine neue Server-URL `/api/v2` hinzugefügt, während `/api/v1` für eine Übergangszeit parallel betrieben wird. 

The version of the OpenAPI document: 1.0.0

## Building

To install the required dependencies and to build the typescript sources run:

```console
npm install
npm run build
```

## Publishing

First build the package then run `npm publish dist` (don't forget to specify the `dist` folder!)

## Consuming

Navigate to the folder of your consuming project and run one of next commands.

_published:_

```console
npm install @ --save
```

_without publishing (not recommended):_

```console
npm install PATH_TO_GENERATED_PACKAGE/dist.tgz --save
```

_It's important to take the tgz file, otherwise you'll get trouble with links on windows_

_using `npm link`:_

In PATH_TO_GENERATED_PACKAGE/dist:

```console
npm link
```

In your project:

```console
npm link 
```

__Note for Windows users:__ The Angular CLI has troubles to use linked npm packages.
Please refer to this issue <https://github.com/angular/angular-cli/issues/8284> for a solution / workaround.
Published packages are not effected by this issue.

### General usage

In your Angular project:

```typescript

import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideApi } from '';

export const appConfig: ApplicationConfig = {
    providers: [
        // ...
        provideHttpClient(),
        provideApi()
    ],
};
```

**NOTE**
If you're still using `AppModule` and haven't [migrated](https://angular.dev/reference/migrations/standalone) yet, you can still import an Angular module:
```typescript
import { ApiModule } from '';
```

If different from the generated base path, during app bootstrap, you can provide the base path to your service.

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideApi } from '';

export const appConfig: ApplicationConfig = {
    providers: [
        // ...
        provideHttpClient(),
        provideApi('http://localhost:9999')
    ],
};
```

```typescript
// with a custom configuration
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideApi } from '';

export const appConfig: ApplicationConfig = {
    providers: [
        // ...
        provideHttpClient(),
        provideApi({
            withCredentials: true,
            username: 'user',
            password: 'password'
        })
    ],
};
```

```typescript
// with factory building a custom configuration
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideApi, Configuration } from '';

export const appConfig: ApplicationConfig = {
    providers: [
        // ...
        provideHttpClient(),
        {
            provide: Configuration,
            useFactory: (authService: AuthService) => new Configuration({
                    basePath: 'http://localhost:9999',
                    withCredentials: true,
                    username: authService.getUsername(),
                    password: authService.getPassword(),
            }),
            deps: [AuthService],
            multi: false
        }
    ],
};
```

### Using multiple OpenAPI files / APIs

In order to use multiple APIs generated from different OpenAPI files,
you can create an alias name when importing the modules
in order to avoid naming conflicts:

```typescript
import { provideApi as provideUserApi } from 'my-user-api-path';
import { provideApi as provideAdminApi } from 'my-admin-api-path';
import { HttpClientModule } from '@angular/common/http';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
    providers: [
        // ...
        provideHttpClient(),
        provideUserApi(environment.basePath),
        provideAdminApi(environment.basePath),
    ],
};
```

### Customizing path parameter encoding

Without further customization, only [path-parameters][parameter-locations-url] of [style][style-values-url] 'simple'
and Dates for format 'date-time' are encoded correctly.

Other styles (e.g. "matrix") are not that easy to encode
and thus are best delegated to other libraries (e.g.: [@honoluluhenk/http-param-expander]).

To implement your own parameter encoding (or call another library),
pass an arrow-function or method-reference to the `encodeParam` property of the Configuration-object
(see [General Usage](#general-usage) above).

Example value for use in your Configuration-Provider:

```typescript
new Configuration({
    encodeParam: (param: Param) => myFancyParamEncoder(param),
})
```

[parameter-locations-url]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#parameter-locations
[style-values-url]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#style-values
[@honoluluhenk/http-param-expander]: https://www.npmjs.com/package/@honoluluhenk/http-param-expander
