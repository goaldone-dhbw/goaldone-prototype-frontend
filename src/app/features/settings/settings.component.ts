// settings.component.ts
import { Component } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { CardModule } from 'primeng/card';
import { Button } from 'primeng/button';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [TabsModule, CardModule, Button],
    templateUrl: './settings.component.html'
})
export class SettingsComponent {}
