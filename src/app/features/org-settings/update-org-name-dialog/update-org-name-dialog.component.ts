import { Component, EventEmitter, Input, Output, signal, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { OrganizationsService } from '../../../api';
import { catchError, finalize, of } from 'rxjs';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-update-org-name-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, DialogModule, ButtonModule, MessageModule],
    templateUrl: './update-org-name-dialog.component.html',
    styleUrl: './update-org-name-dialog.component.scss',
})
export class UpdateOrgNameDialogComponent {
    @Input() visible = false;
    @Output() visibleChange = new EventEmitter<boolean>();

    oldName = input<string>('');
    newName = input<string>('');

    @Output() updated = new EventEmitter<void>();

    private organizationsService = inject(OrganizationsService);
    private messageService = inject(MessageService);

    loading = signal(false);
    errorMessage = signal<string | null>(null);

    close() {
        this.visibleChange.emit(false);
        this.reset();
    }

    reset() {
        this.errorMessage.set(null);
        this.loading.set(false);
    }

    updateName() {
        const newName = this.newName();
        if (!newName || newName === this.oldName()) {
            this.close();
            return;
        }

        this.loading.set(true);
        this.errorMessage.set(null);

        this.organizationsService
            .updateOrganizationSettings({ name: newName })
            .pipe(
                catchError((error) => {
                    const detail = error.error;
                    if (error.status === 403) {
                        this.errorMessage.set(
                            'Sie haben keine Berechtigung, diese Aktion auszuführen.',
                        );
                    } else {
                        this.errorMessage.set(
                            detail?.detail || 'Ein unbekannter Fehler ist aufgetreten.',
                        );
                    }
                    return of({ error: true });
                }),
                finalize(() => this.loading.set(false)),
            )
            .subscribe((res: any) => {
                if (res?.error) return;

                this.messageService.add({
                    key: 'settings-toast',
                    severity: 'success',
                    summary: 'Erfolg',
                    detail: `Organisationsname erfolgreich auf "${newName}" geändert.`,
                });

                this.updated.emit();
                this.close();
            });
    }
}
