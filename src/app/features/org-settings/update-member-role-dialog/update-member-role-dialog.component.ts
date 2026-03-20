import { Component, EventEmitter, Input, Output, signal, inject, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { MembersService, MemberResponse } from '../../../api';
import { catchError, finalize, of } from 'rxjs';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-update-member-role-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    MessageModule
  ],
  templateUrl: './update-member-role-dialog.component.html',
  styleUrl: './update-member-role-dialog.component.scss'
})
export class UpdateMemberRoleDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  member = input<MemberResponse | null>(null);
  @Output() updated = new EventEmitter<void>();

  private membersService = inject(MembersService);
  private messageService = inject(MessageService);

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  targetRole = computed(() => {
    const m = this.member();
    if (!m) return null;
    return m.role === 'ADMIN' ? 'USER' : 'ADMIN';
  });

  targetRoleLabel = computed(() => {
    return this.targetRole() === 'ADMIN' ? 'Admin-Nutzer' : 'Standard-Nutzer';
  });

  close() {
    this.visibleChange.emit(false);
    this.reset();
  }

  reset() {
    this.errorMessage.set(null);
    this.loading.set(false);
  }

  updateRole() {
    const role = this.targetRole();
    const m = this.member();
    if (!m || !role) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.membersService.updateMemberRole(m.id, { role: role as any }).pipe(
      catchError((error) => {
        const detail = error.error;
        if (error.status === 409 && detail?.detail === 'last-admin-cannot-demote-self') {
          this.errorMessage.set('Dieses Mitglied ist der letzte Admin. Bitte zunächst einen anderen Admin ernennen.');
        } else if (error.status === 403) {
            this.errorMessage.set('Sie haben keine Berechtigung, diese Aktion auszuführen.');
        } else {
          this.errorMessage.set(detail?.detail || 'Ein unbekannter Fehler ist aufgetreten.');
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
        detail: `Rolle für ${m.email} erfolgreich auf ${this.targetRoleLabel()} geändert.`
      });

      this.updated.emit();
      this.close();
    });
  }
}
