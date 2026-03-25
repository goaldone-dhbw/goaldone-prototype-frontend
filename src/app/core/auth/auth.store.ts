// auth.store.ts
import { Injectable, signal, computed } from '@angular/core';
import { Role, UserResponse } from '../../api';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private _accessToken = signal<string | null>(null);
  private _user = signal<UserResponse | null>(JSON.parse(sessionStorage.getItem('user') ?? 'null'));

  readonly accessToken = this._accessToken.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._accessToken());
  readonly role = computed<Role | null>(() => this._user()?.role ?? null);

  setTokens(accessToken: string, user?: UserResponse) {
    this._accessToken.set(accessToken);
    if (user) {
      this._user.set(user);
      sessionStorage.setItem('user', JSON.stringify(user));
    }
  }

  hasRole(role: Role): boolean {
    return this.role() === role;
  }

  hasAnyRole(roles: readonly Role[]): boolean {
    return roles.some((role) => this.hasRole(role));
  }

  clear() {
    this._accessToken.set(null);
    this._user.set(null);
    sessionStorage.removeItem('user');
  }
}
