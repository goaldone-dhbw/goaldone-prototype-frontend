import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
import { Image } from 'primeng/image';
import { RouterLink } from '@angular/router';
import { Role } from '../../../api';
import { AuthStore } from '../../../core/auth/auth.store';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [Menu, Image, RouterLink],
    templateUrl: './app-sidebar.component.html',
    styleUrl: './app-sidebar.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppSidebarComponent {
    private authStore = inject(AuthStore);

    isSuperAdmin = computed(() => this.authStore.hasRole(Role.SuperAdmin));

    protected readonly navigationItems: MenuItem[] = [
        {
            label: 'Workspace',
            icon: 'pi pi-home',
            routerLink: '/app',
        },
        {
            label: 'Aufgaben & Routinen',
            icon: 'pi pi-list',
            routerLink: '/app/tasks',
        },
        {
            label: 'Planungsansicht',
            icon: 'pi pi-list-check',
            routerLink: '/app/schedule',
        },
        {
          label: 'Arbeitszeiten & Pausen',
          icon: 'pi pi-clock',
          routerLink: '/app/working-hours',
        }
    ];

    protected settingsItems = computed<MenuItem[]>(() => {
        const currentRole = this.authStore.role();
        const items: MenuItem[] = [
            {
                label: 'Einstellungen',
                icon: 'pi pi-cog',
                routerLink: '/app/settings',
            },
        ];

        // Nur für ADMIN anzeigen (nicht SUPER_ADMIN, nicht USER)
        if (currentRole === Role.Admin) {
            items.unshift({
                label: 'Organisation verwalten',
                icon: 'pi pi-building',
                routerLink: '/app/organization',
            });
        }

        if (currentRole === Role.SuperAdmin) {
            items.unshift({
                label: 'Super-Admin',
                icon: 'pi pi-key',
                routerLink: '/app/super-admin',
            });
        }

        return items;
    });
}
