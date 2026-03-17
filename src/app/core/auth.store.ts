import { Injectable, signal, computed } from '@angular/core';
import { UserResponse } from '../api';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private _accessToken = signal<string | null>(localStorage.getItem('access_token'));
  private _refreshToken = signal<string | null>(localStorage.getItem('refresh_token'));
  private _user = signal<UserResponse | null>(JSON.parse(localStorage.getItem('user') ?? 'null'));

  readonly accessToken = this._accessToken.asReadonly();
  readonly refreshToken = this._refreshToken.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._accessToken());

  setTokens(accessToken: string, refreshToken: string, user?: UserResponse) {
    this._accessToken.set(accessToken);
    this._refreshToken.set(refreshToken);
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    if (user) {
      this._user.set(user);
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  clear() {
    this._accessToken.set(null);
    this._refreshToken.set(null);
    this._user.set(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }
}
