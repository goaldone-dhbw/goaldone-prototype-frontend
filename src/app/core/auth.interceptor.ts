import { HttpInterceptorFn, HttpRequest, HttpContextToken } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { AuthStore } from './auth.store';
import { AuthService } from '../api';
import { Router } from '@angular/router';

export const NEEDS_CREDENTIALS = new HttpContextToken<boolean>(() => false);

const PUBLIC_ENDPOINTS = ['/auth/login', '/auth/refresh', '/auth/invitations/'];

// Endpunkte die den Cookie brauchen → withCredentials: true
const COOKIE_ENDPOINTS = [
  '/auth/login',
  '/auth/refresh',
  '/auth/logout',
  '/auth/invitations',
];

let isRefreshing = false;
const refreshDone$ = new BehaviorSubject<string | null>(null);

function isPublic(url: string) {
  return PUBLIC_ENDPOINTS.some((e) => url.includes(e));
}
function needsCookie(req: HttpRequest<unknown>) {
  return (
    COOKIE_ENDPOINTS.some((e) => req.url.includes(e)) ||
    req.context.get(NEEDS_CREDENTIALS)
  );
}

function addBearer(req: HttpRequest<unknown>, token: string) {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(AuthStore);
  const authApi = inject(AuthService);
  const router = inject(Router);

  if (needsCookie(req)) {
    req = req.clone({ withCredentials: true });
  }

  // Öffentliche Endpunkte ohne Token
  if (isPublic(req.url)) {
    return next(req);
  }

  // Alle anderen: Bearer Token anhängen
  const token = store.accessToken();
  const authedReq = token ? addBearer(req, token) : req;

  return next(authedReq).pipe(
    catchError((err) => {
      if (err.status !== 401) return throwError(() => err);

      // Parallele Refresh-Calls abfangen
      if (isRefreshing) {
        return refreshDone$.pipe(
          filter((t) => t !== null),
          take(1),
          switchMap((newToken) => next(addBearer(req, newToken!))),
        );
      }

      isRefreshing = true;
      refreshDone$.next(null);

      // Dummy string für refreshToken Call (wird vom Browser durch den echten Cookie ersetzt)
      return authApi.refreshToken('').pipe(
        switchMap((res) => {
          isRefreshing = false;
          store.setTokens(res.accessToken);
          refreshDone$.next(res.accessToken);
          return next(addBearer(req, res.accessToken));
        }),
        catchError((refreshErr) => {
          isRefreshing = false;
          store.clear();
          router.navigate(['/login']);
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};
