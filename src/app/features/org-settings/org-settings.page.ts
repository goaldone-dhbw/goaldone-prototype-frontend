import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Paginator } from 'primeng/paginator';
import { MessageService, PrimeTemplate } from 'primeng/api';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { Tooltip } from 'primeng/tooltip';
import { DeleteMemberDialogComponent } from './delete-member-dialog/delete-member-dialog.component';
import { UpdateMemberRoleDialogComponent } from './update-member-role-dialog/update-member-role-dialog.component';
import { catchError, finalize, of } from 'rxjs';
import {
    InvitationResponse,
    InvitationsService,
    MemberResponse,
    MembersService,
    OrganizationsService,
    Role,
} from '../../api';
import { AuthStore } from '../../core/auth.store';
import { Toast } from 'primeng/toast';

@Component({
    selector: 'app-org-settings-page',
    standalone: true,
    imports: [
        Card,
        Button,
        InputText,
        Message,
        Paginator,
        PrimeTemplate,
        ReactiveFormsModule,
        TableModule,
        Tag,
        Tooltip,
        DeleteMemberDialogComponent,
        UpdateMemberRoleDialogComponent,
        FormsModule,
        Toast,
    ],
    templateUrl: './org-settings.page.html',
    styleUrl: './org-settings.page.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrgSettingsPage implements OnInit {
    protected readonly title = 'Organisation';

    private authStore = inject(AuthStore);
    private membersService = inject(MembersService);
    private invitationsService = inject(InvitationsService);
    private organizationsService = inject(OrganizationsService);
    private messageService = inject(MessageService);

    userProfile = this.authStore.user;
    isAdmin = computed(() => this.authStore.hasRole(Role.Admin));

    showDeleteMemberDialog = signal(false);
    showUpdateRoleDialog = signal(false);
    memberToDelete = signal<MemberResponse | null>(null);
    memberToUpdateRole = signal<MemberResponse | null>(null);

    // Organization state
    orgName = signal('');
    allowedDomain = signal<string | null>(null);
    orgLoading = signal(false);
    orgUpdating = signal(false);

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

    ngOnInit(): void {
        this.loadOrganization();
        this.loadMembers();
        this.loadInvitations();
    }

    loadOrganization() {
        this.orgLoading.set(true);
        this.organizationsService
            .getMyOrganization()
            .pipe(finalize(() => this.orgLoading.set(false)))
            .subscribe((org) => {
                this.orgName.set(org.name);
                this.allowedDomain.set(org.allowedDomain ?? null);
            });
    }

    updateOrganization() {
        this.orgUpdating.set(true);
        this.organizationsService
            .updateOrganizationSettings({
                name: this.orgName(),
                allowedDomain: this.allowedDomain() || null,
            })
            .pipe(
                finalize(() => this.orgUpdating.set(false)),
                catchError((error) => {
                    this.messageService.add({
                        key: 'settings-toast',
                        severity: 'error',
                        summary: 'Fehler',
                        detail: 'Einstellungen konnten nicht gespeichert werden.',
                    });
                    return of(null);
                }),
            )
            .subscribe((res) => {
                if (res) {
                    this.messageService.add({
                        key: 'settings-toast',
                        severity: 'success',
                        summary: 'Erfolg',
                        detail: 'Organisationseinstellungen gespeichert.',
                    });
                }
            });
    }

    openDeleteMemberDialog(member: MemberResponse) {
        this.memberToDelete.set(member);
        this.showDeleteMemberDialog.set(true);
    }

    openUpdateRoleDialog(member: MemberResponse) {
        this.memberToUpdateRole.set(member);
        this.showUpdateRoleDialog.set(true);
    }

    onMembersPageChange(event: any) {
        this.loadMembers(event.page);
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
                            detail: 'Einladung nicht gefunden. Die Seite wird neu geladen.',
                        });
                        this.loadInvitations();
                    } else {
                        this.messageService.add({
                            key: 'settings-toast',
                            severity: 'error',
                            summary: 'Fehler',
                            detail: 'Einladung konnte nicht widerrufen werden.',
                        });
                    }
                    // Return a special value to indicate error
                    return of({ error: true });
                }),
            )
            .subscribe((res: any) => {
                if (res?.error) return;

                this.messageService.add({
                    key: 'settings-toast',
                    severity: 'success',
                    summary: 'Erfolg',
                    detail: 'Einladung wurde widerrufen.',
                });
                this.loadInvitations();
            });
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

    onInvitationsPageChange(event: any) {
        this.loadInvitations(event.page);
    }

    formatDate(dateStr?: string): string {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString();
    }
}
