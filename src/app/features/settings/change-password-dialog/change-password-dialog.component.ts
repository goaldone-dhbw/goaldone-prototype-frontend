import { Component, EventEmitter, Input, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { AuthService as GoaldoneAuthApi } from '../../../api';
import { catchError, finalize, of } from 'rxjs';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    MessageModule
  ],
  templateUrl: './change-password-dialog.component.html',
  styleUrl: './change-password-dialog.component.scss'
})
export class ChangePasswordDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  private authApi = inject(GoaldoneAuthApi);
  private messageService = inject(MessageService);

  currentPassword = signal('');
  newPassword = signal('');
  errorMessage = signal<string | null>(null);
  loading = signal(false);

  close() {
    this.visibleChange.emit(false);
    this.reset();
  }

  reset() {
    this.currentPassword.set('');
    this.newPassword.set('');
    this.errorMessage.set(null);
    this.loading.set(false);
  }

  save() {
    if (!this.currentPassword() || !this.newPassword()) {
      this.errorMessage.set('Bitte füllen Sie alle Felder aus.');
      return;
    }

    if (this.newPassword().length < 8) {
      this.errorMessage.set('Das neue Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authApi.changePassword({
      currentPassword: this.currentPassword(),
      newPassword: this.newPassword()
    }).pipe(
      catchError((error) => {
        if (error.status === 401) {
          this.errorMessage.set('Das aktuelle Passwort ist falsch.');
        } else if (error.status === 400) {
          const detail = error.error;
          if (detail?.errors && detail.errors.length > 0) {
            this.errorMessage.set(detail.errors[0].message);
          } else {
            this.errorMessage.set(detail?.detail || 'Ungültige Anfrage.');
          }
        } else {
          this.errorMessage.set('Ein unerwarteter Fehler ist aufgetreten.');
        }
        return of(null);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe((res) => {
      if (res === null && this.errorMessage()) return;
      
      this.messageService.add({
        key: 'settings-toast',
        severity: 'success',
        summary: 'Erfolg',
        detail: 'Passwort erfolgreich geändert.'
      });
      this.close();
    });
  }
}
