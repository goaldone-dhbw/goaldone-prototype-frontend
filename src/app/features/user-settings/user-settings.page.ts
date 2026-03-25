import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { UsersService, UserResponse, Role } from '../../api';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { PaginatorModule } from 'primeng/paginator';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ChangePasswordDialogComponent } from './change-password-dialog/change-password-dialog.component';
import { DeleteAccountDialogComponent } from './delete-account-dialog/delete-account-dialog.component';
import { catchError, of } from 'rxjs';
import { AuthStore } from '../../core/auth/auth.store';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        ButtonModule,
        DividerModule,
        TableModule,
        TagModule,
        PaginatorModule,
        InputTextModule,
        MessageModule,
        ToastModule,
        TooltipModule,
        ChangePasswordDialogComponent,
        DeleteAccountDialogComponent,
    ],
    providers: [MessageService],
    templateUrl: './user-settings.page.html',
    styleUrl: './user-settings.page.scss',
})
export class UserSettingsPage implements OnInit {
    protected readonly title = 'Einstellungen';

    private authService = inject(AuthService);
    private usersService = inject(UsersService);
    private messageService = inject(MessageService);
    private authStore = inject(AuthStore);

    userProfile = signal<UserResponse | null>(null);
    isSuperAdmin = computed(() => this.authStore.hasRole(Role.SuperAdmin));

    showPasswordDialog = signal(false);
    showDeleteAccountDialog = signal(false);

    ngOnInit() {
        this.loadUserProfile();
    }

    loadUserProfile() {
        this.usersService
            .getMyProfile()
            .pipe(
                catchError(() => {
                    this.messageService.add({
                        key: 'settings-toast',
                        severity: 'error',
                        summary: 'Fehler',
                        detail: 'Profil konnte nicht geladen werden.',
                    });
                    return of(null);
                }),
            )
            .subscribe((profile) => {
                this.userProfile.set(profile);
            });
    }

    logout() {
        this.authService.logout();
    }

    formatDate(dateStr?: string): string {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString();
    }
}
