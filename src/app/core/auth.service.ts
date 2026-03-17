import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { AuthService as GoaldoneAuthApi, LoginRequest } from '../api';
import { AuthStore } from './auth.store';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(GoaldoneAuthApi);
  private store = inject(AuthStore);
  private router = inject(Router);

  login(email: string, password: string) {
    const body: LoginRequest = { email, password };
    return this.api.login(body).pipe(
      tap((res) => {
        // LoginResponse enthält accessToken + refreshToken + user
        this.store.setTokens(res.accessToken, res.refreshToken, res.user);
        this.router.navigate(['/tasks']);
      }),
    );
  }

  logout() {
    const refreshToken = this.store.refreshToken();
    if (!refreshToken) {
      this.store.clear();
      return;
    }
    // Logout schickt den Refresh Token im Body (nicht den Access Token!)
    this.api.logout({ refreshToken }).subscribe({
      complete: () => {
        this.store.clear();
        this.router.navigate(['/login']);
      },
    });
  }
}
