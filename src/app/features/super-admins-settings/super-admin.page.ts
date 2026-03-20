import { Component } from '@angular/core';
import { Card } from 'primeng/card';

@Component({
    selector: 'app-super-admin.page',
    imports: [Card],
    templateUrl: './super-admin.page.html',
    styleUrl: './super-admin.page.scss',
})
export class SuperAdminPage {
    protected readonly title = 'Super-Admin Einstellungen';
}
