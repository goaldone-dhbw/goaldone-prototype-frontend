// auth.store.ts
import { Injectable, signal, computed } from '@angular/core';
import { UserResponse } from '../api';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private _accessToken = signal<string | null>(null);
  private _user = signal<UserResponse | null>(JSON.parse(sessionStorage.getItem('user') ?? 'null'));

  readonly accessToken = this._accessToken.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._accessToken());
  setTokens(accessToken: string, user?: UserResponse) {
    this._accessToken.set(accessToken);
    if (user) sessionStorage.setItem('user', JSON.stringify(user));
  }

  clear() {
    this._accessToken.set(null);
    sessionStorage.removeItem('user');
  }
}
