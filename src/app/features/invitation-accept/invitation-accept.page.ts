import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { finalize, catchError, of } from 'rxjs';
import { ProblemDetail } from '../../api';

@Component({
    selector: 'app-invitation-accept',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        CardModule,
        ButtonModule,
        InputTextModule,
        PasswordModule,
        MessageModule,
        ProgressSpinnerModule,
        RouterLink,
    ],
    templateUrl: './invitation-accept.page.html',
    styleUrl: './invitation-accept.page.scss',
})
export class InvitationAcceptPage implements OnInit {
    private route = inject(ActivatedRoute);
    private authService = inject(AuthService);
    private fb = inject(FormBuilder);

    token: string | null = null;
    loading = signal(true);
    submitting = signal(false);
    errorMessage = signal<string | null>(null);
    invitationExpired = signal(false);
    invitationInvalid = signal(false);

    form: FormGroup = this.fb.group({
        email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
        firstName: ['', [Validators.required]],
        lastName: ['', [Validators.required]],
        password: ['', [Validators.required, Validators.minLength(8)]],
    });

    ngOnInit() {
        this.token = this.route.snapshot.paramMap.get('token');
        if (this.token) {
            this.loadInvitationInfo(this.token);
        } else {
            this.invitationInvalid.set(true);
            this.loading.set(false);
        }
    }

    loadInvitationInfo(token: string) {
        this.loading.set(true);
        this.authService
            .getInvitationInfo(token)
            .pipe(
                finalize(() => this.loading.set(false)),
                catchError((error) => {
                    if (error.status === 404) {
                        this.invitationInvalid.set(true);
                    } else if (error.status === 410) {
                        this.invitationExpired.set(true);
                    } else {
                        this.errorMessage.set(
                            'Ein unbekannter Fehler ist aufgetreten. Bitte versuche es erneut.',
                        );
                    }
                    return of(null);
                }),
            )
            .subscribe((info) => {
                if (info) {
                    this.form.patchValue({ email: info.email });
                }
            });
    }

    onSubmit() {
        if (this.form.invalid || !this.token) {
            this.form.markAllAsTouched();
            return;
        }

        this.submitting.set(true);
        this.errorMessage.set(null);

        const data = {
            firstName: this.form.value.firstName,
            lastName: this.form.value.lastName,
            password: this.form.value.password,
        };

        this.authService
            .acceptInvitation(this.token, data)
            .pipe(
                finalize(() => this.submitting.set(false)),
                catchError((error) => {
                    if (error.status === 400) {
                        const problem: ProblemDetail = error.error;
                        if (problem.errors) {
                            problem.errors.forEach((err) => {
                                const control = this.form.get(err.field!);
                                if (control) {
                                    control.setErrors({ serverError: err.message });
                                }
                            });
                        } else {
                            this.errorMessage.set(problem.detail || 'Eingabedaten sind ungültig.');
                        }
                    } else if (error.status === 410) {
                        this.invitationExpired.set(true);
                    } else {
                        this.errorMessage.set(
                            'Ein unbekannter Fehler ist aufgetreten. Bitte versuche es erneut.',
                        );
                    }
                    return of(null);
                }),
            )
            .subscribe();
    }

    getControlError(controlName: string): string | null {
        const control = this.form.get(controlName);
        if (control?.invalid && (control.dirty || control.touched)) {
            if (control.errors?.['required']) return 'Dieses Feld ist ein Pflichtfeld.';
            if (control.errors?.['email']) return 'Ungültige E-Mail-Adresse.';
            if (control.errors?.['minlength'])
                return 'Passwort muss mindestens 8 Zeichen lang sein.';
            if (control.errors?.['serverError']) return control.errors['serverError'];
        }
        return null;
    }
}
