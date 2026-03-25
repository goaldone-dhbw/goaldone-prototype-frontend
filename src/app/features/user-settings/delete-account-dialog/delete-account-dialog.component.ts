import { Component, EventEmitter, Input, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { UsersService } from '../../../api';
import { AuthStore } from '../../../core/auth/auth.store';
import { Router } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { BaseDialogComponent } from '../../../shared/components/base-dialog/base-dialog.component';

@Component({
  selector: 'app-delete-account-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    MessageModule,
    BaseDialogComponent
  ],
  templateUrl: './delete-account-dialog.component.html',
  styleUrl: './delete-account-dialog.component.scss'
})
export class DeleteAccountDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  private usersService = inject(UsersService);
  private authStore = inject(AuthStore);
  private router = inject(Router);
  private messageService = inject(MessageService);

  confirmationText = signal('');
  errorMessage = signal<string | null>(null);
  loading = signal(false);

  close() {
    this.visibleChange.emit(false);
    this.reset();
  }

  reset() {
    this.confirmationText.set('');
    this.errorMessage.set(null);
    this.loading.set(false);
  }

  deleteAccount() {
    if (this.confirmationText() !== 'LÖSCHEN') {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.usersService.deleteMyAccount().pipe(
      catchError((error) => {
        if (error.status === 403) {
          const detail = error.error;
          if (detail?.detail === 'super-admin-cannot-delete-self') {
            this.errorMessage.set('Super-Admins können ihren Account nicht selbst löschen.');
          } else {
            this.errorMessage.set('Diese Aktion ist nicht erlaubt.');
          }
        } else if (error.status === 409) {
          const detail = error.error;
          if (detail?.detail === 'last-admin-cannot-delete-self') {
            this.errorMessage.set('Du bist der einzige Admin deines Unternehmens. Bitte zunächst einen anderen Admin ernennen.');
          } else {
            this.errorMessage.set('Ein Konflikt ist aufgetreten.');
          }
        } else {
          this.errorMessage.set('Ein unbekannter Fehler ist aufgetreten. Bitte versuche es erneut.');
        }
        return of(null);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe((res) => {
      // In success case, res is undefined (204 No Content) but not null from catchError
      if (this.errorMessage()) return;

      this.messageService.add({
        key: 'settings-toast',
        severity: 'success',
        summary: 'Erfolg',
        detail: 'Account erfolgreich gelöscht.'
      });

      this.authStore.clear();
      this.router.navigate(['/login']);
      this.close();
    });
  }
}
