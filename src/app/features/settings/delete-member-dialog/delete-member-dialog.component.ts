import { Component, EventEmitter, Input, Output, signal, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { MembersService, MemberResponse } from '../../../api';
import { catchError, finalize, of } from 'rxjs';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-delete-member-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    MessageModule
  ],
  templateUrl: './delete-member-dialog.component.html',
  styleUrl: './delete-member-dialog.component.scss'
})
export class DeleteMemberDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  member = input<MemberResponse | null>(null);
  @Output() deleted = new EventEmitter<void>();

  private membersService = inject(MembersService);
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

  deleteMember() {
    const m = this.member();
    if (!m || this.confirmationText() !== 'LÖSCHEN') {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.membersService.removeMember(m.id).pipe(
      catchError((error) => {
        const detail = error.error;
        if (error.status === 409 && detail?.detail === 'last-admin-cannot-be-removed') {
          this.errorMessage.set('Dieses Mitglied ist der letzte Admin. Bitte zunächst einen anderen Admin ernennen.');
        } else if (error.status === 404) {
          this.errorMessage.set('Mitglied nicht gefunden. Die Seite wird neu geladen.');
          this.deleted.emit(); // Refresh list anyway
        } else {
          this.errorMessage.set('Ein unbekannter Fehler ist aufgetreten. Bitte versuche es erneut.');
        }
        return of({ error: true });
      }),
      finalize(() => this.loading.set(false))
    ).subscribe((res: any) => {
      if (res?.error) return;
      
      this.messageService.add({
        key: 'settings-toast',
        severity: 'success',
        summary: 'Erfolg',
        detail: 'Mitglied erfolgreich entfernt.'
      });
      
      this.deleted.emit();
      this.close();
    });
  }
}
