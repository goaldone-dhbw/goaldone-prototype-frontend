import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { BaseDialogComponent } from '../../../shared/components/base-dialog/base-dialog.component';
import { AdminService, UserResponse } from '../../../api';
import { AuthStore } from '../../../core/auth/auth.store';
import { catchError, finalize, of } from 'rxjs';

@Component({
    selector: 'app-remove-super-admin-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        InputTextModule,
        MessageModule,
        BaseDialogComponent,
    ],
    templateUrl: './remove-super-admin-dialog.component.html',
    styleUrl: './remove-super-admin-dialog.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemoveSuperAdminDialogComponent {
    @Input() visible = false;
    @Output() visibleChange = new EventEmitter<boolean>();
    @Input() superAdmin: UserResponse | null = null;
    @Output() removed = new EventEmitter<void>();

    private adminService = inject(AdminService);
    private authStore = inject(AuthStore);

    confirmationEmail = signal('');
    loading = signal(false);
    errorMessage = signal<string | null>(null);

    isConfirmDisabled = computed(() => {
        return this.confirmationEmail() !== this.superAdmin?.email;
    });

    close() {
        this.visibleChange.emit(false);
        this.confirmationEmail.set('');
        this.errorMessage.set(null);
    }

    submit() {
        if (!this.superAdmin || this.isConfirmDisabled() || this.loading()) {
            return;
        }

        this.loading.set(true);
        this.errorMessage.set(null);

        this.adminService
            .deleteSuperAdmin(this.superAdmin.id)
            .pipe(
                finalize(() => this.loading.set(false)),
                catchError((error) => {
                    const detail = error.error;
                    if (error.status === 403 && detail?.detail === 'super-admin-cannot-delete-self') {
                        this.errorMessage.set('Du kannst deinen eigenen Account hier nicht entfernen.');
                    } else if (error.status === 404) {
                        this.errorMessage.set('Super-Admin nicht gefunden. Liste wird neu geladen.');
                        this.removed.emit();
                    } else {
                        this.errorMessage.set('Fehler beim Entfernen. Bitte versuche es erneut.');
                    }
                    return of(null);
                }),
            )
            .subscribe((res) => {
                this.removed.emit();
                this.close();
            });
    }
}
