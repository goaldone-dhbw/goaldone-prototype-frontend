import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { AuthService as GoaldoneAuthApi, AcceptInvitationRequest } from '../api';
import { AuthStore } from './auth.store';
import { HttpClient, HttpContext } from '@angular/common/http';
import { NEEDS_CREDENTIALS } from './auth.interceptor';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(GoaldoneAuthApi);
  private store = inject(AuthStore);
  private router = inject(Router);
  private http = inject(HttpClient);

  login(email: string, password: string) {
    return this.api
      .login({ email, password }, undefined, undefined, {
        context: new HttpContext().set(NEEDS_CREDENTIALS, true),
      })
      .pipe(
        tap((res) => {
          this.store.setTokens(res.accessToken, res.user);
          this.router.navigate(['/app']);
        }),
      );
  }

  getInvitationInfo(token: string) {
    return this.api.getInvitationInfo(token);
  }

  acceptInvitation(token: string, data: AcceptInvitationRequest) {
    return this.api
      .acceptInvitation(token, data, undefined, undefined, {
        context: new HttpContext().set(NEEDS_CREDENTIALS, true),
      })
      .pipe(
        tap((res) => {
          this.store.setTokens(res.accessToken, res.user);
          this.router.navigate(['/app']);
        }),
      );
  }

  logout() {
    this.api
      .logout('', undefined, undefined, {
        context: new HttpContext().set(NEEDS_CREDENTIALS, true),
      })
      .subscribe({
        complete: () => {
          this.store.clear();
          this.router.navigate(['/login']);
        },
        error: () => {
          // Auch bei Fehler lokal ausloggen
          this.store.clear();
          this.router.navigate(['/login']);
        },
      });
  }
}
