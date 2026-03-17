import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { AuthStore } from './auth.store';
import { AuthService } from '../api';
import { Router } from '@angular/router';

// Verhindert parallele Refresh-Calls (Token Rotation!)
let isRefreshing = false;
const refreshDone$ = new BehaviorSubject<string | null>(null);

// Endpunkte die KEIN Bearer-Token brauchen (security: [] in OpenAPI)
const PUBLIC_ENDPOINTS = ['/auth/login', '/auth/refresh', '/auth/invitations/'];

function isAuthEndpoint(url: string): boolean {
  return PUBLIC_ENDPOINTS.some((e) => url.includes(e));
}

function addBearer(req: HttpRequest<unknown>, token: string) {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(AuthStore);
  const authApi = inject(AuthService);
  const router = inject(Router);

  // Public Endpunkte (login, refresh, invitation) → kein Header
  if (isAuthEndpoint(req.url)) {
    return next(req);
  }

  const token = store.accessToken();
  const authedReq = token ? addBearer(req, token) : req;

  return next(authedReq).pipe(
    catchError((err) => {
      if (err.status !== 401) return throwError(() => err);

      const refreshToken = store.refreshToken();
      if (!refreshToken) {
        store.clear();
        router.navigate(['/login']);
        return throwError(() => err);
      }

      // Bereits ein Refresh läuft → warten bis der fertig ist
      if (isRefreshing) {
        return refreshDone$.pipe(
          filter((t) => t !== null),
          take(1),
          switchMap((newToken) => next(addBearer(req, newToken!))),
        );
      }

      // Refresh starten
      isRefreshing = true;
      refreshDone$.next(null);

      return authApi.refreshToken({ refreshToken }).pipe(
        switchMap((res) => {
          isRefreshing = false;
          // Token Rotation: beide Tokens aktualisieren
          store.setTokens(res.accessToken, res.refreshToken);
          refreshDone$.next(res.accessToken);
          // Original-Request mit neuem Token wiederholen
          return next(addBearer(req, res.accessToken));
        }),
        catchError((refreshErr) => {
          // Refresh Token auch abgelaufen → ausloggen
          isRefreshing = false;
          store.clear();
          router.navigate(['/login']);
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};
