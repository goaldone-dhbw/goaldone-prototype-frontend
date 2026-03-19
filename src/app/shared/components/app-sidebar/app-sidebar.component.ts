import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
import { Image } from 'primeng/image';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [Menu, Image, RouterLink],
    templateUrl: './app-sidebar.component.html',
    styleUrl: './app-sidebar.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppSidebarComponent {
    protected readonly navigationItems: MenuItem[] = [
        {
            label: 'Start',
            icon: 'pi pi-home',
            routerLink: '/app',
        },
        {
            label: 'Einstellungen',
            icon: 'pi pi-cog',
            routerLink: '/app/settings',
        },
    ];
}
