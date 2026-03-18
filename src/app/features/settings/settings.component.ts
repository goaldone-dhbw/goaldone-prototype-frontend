import { Component, OnInit, computed, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthStore } from '../../core/auth.store';
import { AuthService } from '../../core/auth.service';
import { MembersService, InvitationsService, UsersService, MemberResponse, InvitationResponse, UserResponse } from '../../api';
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
import { ChangePasswordDialogComponent } from './change-password-dialog/change-password-dialog.component';
import { catchError, of, finalize } from 'rxjs';

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
        ChangePasswordDialogComponent,
    ],
    providers: [MessageService],
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
    private authStore = inject(AuthStore);
    private authService = inject(AuthService);
    private usersService = inject(UsersService);
    private membersService = inject(MembersService);
    private invitationsService = inject(InvitationsService);
    private messageService = inject(MessageService);

    userProfile = signal<UserResponse | null>(null);
    isLoggedIn = this.authStore.isLoggedIn;
    isAdmin = computed(() => this.userProfile()?.role === 'ADMIN');
    isSuperAdmin = computed(() => this.userProfile()?.role === 'SUPER_ADMIN');

    showPasswordDialog = signal(false);

    // Members state
    members = signal<MemberResponse[]>([]);
    membersTotal = signal(0);
    membersPage = signal(0);
    membersSize = 20;
    membersLoading = signal(false);

    // Invitations state
    invitations = signal<InvitationResponse[]>([]);
    invitationsTotal = signal(0);
    invitationsPage = signal(0);
    invitationsSize = 20;
    invitationsLoading = signal(false);
    inviteEmail = signal('');
    inviteError = signal<string | null>(null);
    inviteWarn = signal<string | null>(null);
    inviteSending = signal(false);

    constructor() {
        effect(() => {
            if (this.isAdmin()) {
                this.loadMembers();
                this.loadInvitations();
            }
        });
    }

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

    loadMembers(page: number = this.membersPage()) {
        this.membersLoading.set(true);
        this.membersService
            .listMembers(page, this.membersSize)
            .pipe(
                finalize(() => this.membersLoading.set(false)),
                catchError(() => {
                    this.messageService.add({
                        key: 'settings-toast',
                        severity: 'error',
                        summary: 'Fehler',
                        detail: 'Mitglieder konnten nicht geladen werden.',
                    });
                    return of({ content: [], totalElements: 0 });
                }),
            )
            .subscribe((res) => {
                this.members.set(res.content || []);
                this.membersTotal.set(res.totalElements || 0);
                this.membersPage.set(page);
            });
    }

    removeMember(userId: string) {
        this.membersService
            .removeMember(userId)
            .pipe(
                catchError((error) => {
                    if (error.status === 404) {
                        this.messageService.add({
                            key: 'settings-toast',
                            severity: 'error',
                            summary: 'Fehler',
                            detail: 'Mitglied nicht gefunden.',
                        });
                    }
                    return of(null);
                }),
            )
            .subscribe((res) => {
                if (res !== null) {
                    this.messageService.add({
                        key: 'settings-toast',
                        severity: 'success',
                        summary: 'Erfolg',
                        detail: 'Mitglied entfernt.',
                    });
                    this.loadMembers();
                }
            });
    }

    onMembersPageChange(event: any) {
        this.loadMembers(event.page);
    }

    loadInvitations(page: number = this.invitationsPage()) {
        this.invitationsLoading.set(true);
        this.invitationsService
            .listInvitations(page, this.invitationsSize)
            .pipe(
                finalize(() => this.invitationsLoading.set(false)),
                catchError(() => {
                    this.messageService.add({
                        key: 'settings-toast',
                        severity: 'error',
                        summary: 'Fehler',
                        detail: 'Einladungen konnten nicht geladen werden.',
                    });
                    return of({ content: [], totalElements: 0 });
                }),
            )
            .subscribe((res) => {
                this.invitations.set(res.content || []);
                this.invitationsTotal.set(res.totalElements || 0);
                this.invitationsPage.set(page);
            });
    }

    sendInvitation() {
        if (!this.inviteEmail()) return;

        this.inviteSending.set(true);
        this.inviteError.set(null);
        this.inviteWarn.set(null);

        this.invitationsService
            .createInvitation({ email: this.inviteEmail() })
            .pipe(
                finalize(() => this.inviteSending.set(false)),
                catchError((error) => {
                    const detail = error.error;
                    if (error.status === 409) {
                        this.inviteError.set(detail?.detail || 'E-Mail wird bereits verwendet.');
                    } else if (error.status === 400) {
                        this.inviteWarn.set(detail?.detail || 'Ungültige E-Mail-Adresse.');
                    } else {
                        this.messageService.add({
                            key: 'settings-toast',
                            severity: 'error',
                            summary: 'Fehler',
                            detail: 'Einladung konnte nicht gesendet werden.',
                        });
                    }
                    return of(null);
                }),
            )
            .subscribe((res) => {
                if (res) {
                    this.inviteEmail.set('');
                    this.messageService.add({
                        key: 'settings-toast',
                        severity: 'success',
                        summary: 'Erfolg',
                        detail: 'Einladung wurde versendet.',
                    });
                    this.loadInvitations();
                }
            });
    }

    revokeInvitation(invitationId: string) {
        this.invitationsService
            .revokeInvitation(invitationId)
            .pipe(
                catchError((error) => {
                    if (error.status === 404) {
                        this.messageService.add({
                            key: 'settings-toast',
                            severity: 'error',
                            summary: 'Fehler',
                            detail: 'Einladung nicht gefunden.',
                        });
                    }
                    return of(null);
                }),
            )
            .subscribe((res) => {
                if (res !== null) {
                    this.messageService.add({
                        key: 'settings-toast',
                        severity: 'success',
                        summary: 'Erfolg',
                        detail: 'Einladung widerrufen.',
                    });
                    this.loadInvitations();
                }
            });
    }

    onInvitationsPageChange(event: any) {
        this.loadInvitations(event.page);
    }

    formatDate(dateStr?: string): string {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString();
    }
}
