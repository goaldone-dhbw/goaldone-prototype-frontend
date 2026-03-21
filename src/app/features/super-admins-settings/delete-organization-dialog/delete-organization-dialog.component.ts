import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { BaseDialogComponent } from '../../../shared/components/base-dialog/base-dialog.component';
import { AdminService, OrganizationResponse } from '../../../api';
import { catchError, finalize, of } from 'rxjs';

@Component({
    selector: 'app-delete-organization-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        InputTextModule,
        MessageModule,
        BaseDialogComponent,
    ],
    templateUrl: './delete-organization-dialog.component.html',
    styleUrl: './delete-organization-dialog.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteOrganizationDialogComponent {
    @Input() visible = false;
    @Output() visibleChange = new EventEmitter<boolean>();
    @Input() organization: OrganizationResponse | null = null;
    @Output() deleted = new EventEmitter<void>();

    private adminService = inject(AdminService);

    confirmationText = signal('');
    loading = signal(false);
    errorMessage = signal<string | null>(null);

    isConfirmDisabled = computed(() => {
        return this.confirmationText() !== this.organization?.name;
    });

    close() {
        this.visibleChange.emit(false);
        this.confirmationText.set('');
        this.errorMessage.set(null);
    }

    submit() {
        if (!this.organization || this.isConfirmDisabled() || this.loading()) {
            return;
        }

        this.loading.set(true);
        this.errorMessage.set(null);

        this.adminService
            .deleteOrganization(this.organization.id)
            .pipe(
                finalize(() => this.loading.set(false)),
                catchError((error) => {
                    if (error.status === 404) {
                        this.errorMessage.set('Organisation nicht gefunden. Liste wird neu geladen.');
                        this.deleted.emit(); // Reload list
                    } else {
                        this.errorMessage.set('Fehler beim Löschen. Bitte versuche es erneut.');
                    }
                    return of(null);
                }),
            )
            .subscribe((res) => {
                // For 204 No Content, res might be null but success
                this.deleted.emit();
                this.close();
            });
    }
}
