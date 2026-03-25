import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { PaginatorModule } from 'primeng/paginator';
import { MessageService } from 'primeng/api';
import { AdminService, OrganizationResponse, PageMetadata, UserResponse } from '../../api';
import { AuthStore } from '../../core/auth/auth.store';
import { CreateOrganizationDialogComponent } from './create-organization-dialog/create-organization-dialog.component';
import { DeleteOrganizationDialogComponent } from './delete-organization-dialog/delete-organization-dialog.component';
import { AddSuperAdminDialogComponent } from './add-super-admin-dialog/add-super-admin-dialog.component';
import { RemoveSuperAdminDialogComponent } from './remove-super-admin-dialog/remove-super-admin-dialog.component';
import { catchError, finalize, of } from 'rxjs';

@Component({
    selector: 'app-super-admin-page',
    standalone: true,
    imports: [
        CommonModule,
        CardModule,
        ButtonModule,
        TableModule,
        TooltipModule,
        PaginatorModule,
        CreateOrganizationDialogComponent,
        DeleteOrganizationDialogComponent,
        AddSuperAdminDialogComponent,
        RemoveSuperAdminDialogComponent,
    ],
    providers: [MessageService],
    templateUrl: './super-admin.page.html',
    styleUrl: './super-admin.page.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminPage implements OnInit {
    protected readonly title = 'Super-Admin Einstellungen';

    private adminService = inject(AdminService);
    private messageService = inject(MessageService);
    protected authStore = inject(AuthStore);

    // Organization state
    organizations = signal<OrganizationResponse[]>([]);
    orgTotalElements = signal(0);
    orgPage = signal(0);
    orgSize = signal(10);
    orgLoading = signal(false);

    // Super-Admin state
    superAdmins = signal<UserResponse[]>([]);
    saTotalElements = signal(0);
    saPage = signal(0);
    saSize = signal(10);
    saLoading = signal(false);

    // Dialog state
    showCreateOrgDialog = signal(false);
    showDeleteOrgDialog = signal(false);
    orgToDelete = signal<OrganizationResponse | null>(null);

    showAddSuperAdminDialog = signal(false);
    showRemoveSuperAdminDialog = signal(false);
    saToDelete = signal<UserResponse | null>(null);

    ngOnInit(): void {
        this.loadOrganizations();
        this.loadSuperAdmins();
    }

    loadOrganizations(page: number = this.orgPage()) {
        this.orgLoading.set(true);
        this.adminService
            .listOrganizations(page, this.orgSize())
            .pipe(
                finalize(() => this.orgLoading.set(false)),
                catchError(() => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Fehler',
                        detail: 'Organisationen konnten nicht geladen werden.',
                    });
                    return of({ content: [], totalElements: 0 });
                }),
            )
            .subscribe((res) => {
                this.organizations.set(res.content || []);
                this.orgTotalElements.set(res.totalElements || 0);
                this.orgPage.set(page);
            });
    }

    loadSuperAdmins(page: number = this.saPage()) {
        this.saLoading.set(true);
        this.adminService
            .listSuperAdmins(page, this.saSize())
            .pipe(
                finalize(() => this.saLoading.set(false)),
                catchError(() => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Fehler',
                        detail: 'Super-Admins konnten nicht geladen werden.',
                    });
                    return of({ content: [], totalElements: 0 });
                }),
            )
            .subscribe((res) => {
                this.superAdmins.set(res.content || []);
                this.saTotalElements.set(res.totalElements || 0);
                this.saPage.set(page);
            });
    }

    onOrgPageChange(event: any) {
        this.loadOrganizations(event.page);
    }

    onSaPageChange(event: any) {
        this.loadSuperAdmins(event.page);
    }

    openDeleteOrgDialog(org: OrganizationResponse) {
        this.orgToDelete.set(org);
        this.showDeleteOrgDialog.set(true);
    }

    openDeleteSaDialog(sa: UserResponse) {
        this.saToDelete.set(sa);
        this.showRemoveSuperAdminDialog.set(true);
    }

    truncateId(id: string): string {
        return id.substring(0, 8);
    }

    formatDate(dateStr?: string): string {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString();
    }
}
