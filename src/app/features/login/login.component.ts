import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { finalize, catchError, of } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    MessageModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private authService = inject(AuthService);

  email = signal('');
  password = signal('');
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  onSubmit() {
    if (!this.email() || !this.password()) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService
      .login(this.email(), this.password())
      .pipe(
        finalize(() => this.loading.set(false)),
        catchError((error) => {
          if (error.status === 401) {
            this.errorMessage.set('E-Mail-Adresse oder Passwort ist falsch.');
          } else {
            this.errorMessage.set(
              'Ein unbekannter Fehler ist aufgetreten. Bitte versuche es erneut.'
            );
          }
          return of(null);
        })
      )
      .subscribe();
  }
}
