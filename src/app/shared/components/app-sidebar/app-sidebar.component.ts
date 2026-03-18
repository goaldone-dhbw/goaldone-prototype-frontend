import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [Menu],
  templateUrl: './app-sidebar.component.html',
  styleUrl: './app-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppSidebarComponent {
  protected readonly navigationItems: MenuItem[] = [
    {
      label: 'Workspace',
      icon: 'pi pi-home',
      routerLink: '/app',
    },
  ];
}

