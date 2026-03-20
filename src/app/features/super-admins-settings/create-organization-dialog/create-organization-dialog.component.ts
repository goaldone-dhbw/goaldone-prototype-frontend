import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { BaseDialogComponent } from '../../../shared/components/base-dialog/base-dialog.component';
import { AdminService } from '../../../api';
import { catchError, finalize, of } from 'rxjs';

@Component({
    selector: 'app-create-organization-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        InputTextModule,
        MessageModule,
        BaseDialogComponent,
    ],
    templateUrl: './create-organization-dialog.component.html',
    styleUrl: './create-organization-dialog.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateOrganizationDialogComponent {
    @Input() visible = false;
    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() created = new EventEmitter<void>();

    private fb = inject(FormBuilder);
    private adminService = inject(AdminService);

    form = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(1)]],
        adminEmail: ['', [Validators.required, Validators.email]],
    });

    loading = signal(false);
    errorMessage = signal<string | null>(null);

    close() {
        this.visibleChange.emit(false);
        this.form.reset();
        this.errorMessage.set(null);
    }

    submit() {
        if (this.form.invalid || this.loading()) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        this.errorMessage.set(null);

        const { name, adminEmail } = this.form.getRawValue();

        this.adminService
            .createOrganization({
                name: name!,
                adminEmail: adminEmail!,
            })
            .pipe(
                finalize(() => this.loading.set(false)),
                catchError((error) => {
                    if (error.status === 409) {
                        this.errorMessage.set('Eine Organisation mit diesem Namen existiert bereits.');
                    } else if (error.status === 400 && error.error?.errors) {
                        // Handle field-specific errors
                        const firstError = error.error.errors[0];
                        this.errorMessage.set(firstError.message || 'Ungültige Eingabe.');
                    } else {
                        this.errorMessage.set('Fehler beim Anlegen. Bitte versuche es erneut.');
                    }
                    return of(null);
                }),
            )
            .subscribe((res) => {
                if (res) {
                    this.created.emit();
                    this.close();
                }
            });
    }
}
