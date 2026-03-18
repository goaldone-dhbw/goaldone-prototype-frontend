import { Component } from '@angular/core';
import { SettingsComponent } from './settings.component';

@Component({
    selector: 'app-settings-dev-shell',
    standalone: true,
    imports: [SettingsComponent],
    template: `
        <div class="dev-shell">
            <!-- Simuliert den Platz, den die Sidebar einnehmen wird -->
            <aside class="dev-shell__sidebar-placeholder">
                <p>⬅ Sidebar (kommt von Team)</p>
            </aside>
            <main class="dev-shell__content">
                <app-settings />
            </main>
        </div>
    `,
    styles: [
        `
            .dev-shell {
                display: flex;
                height: 100vh;
            }
            .dev-shell__sidebar-placeholder {
                width: 260px;
                background: var(--p-surface-100);
                border-right: 1px solid var(--p-surface-200);
                padding: 1rem;
                color: var(--p-text-muted-color);
            }
            .dev-shell__content {
                flex: 1;
                padding: 2rem;
                overflow-y: auto;
            }
        `,
    ],
})
export class SettingsDevShellComponent {}
