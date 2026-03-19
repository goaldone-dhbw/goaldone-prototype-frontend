import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Card } from 'primeng/card';

@Component({
  selector: 'app-org-settings-page',
  standalone: true,
  imports: [Card],
  templateUrl: './org-settings.page.html',
  styleUrl: './org-settings.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrgSettingsPage {
  protected readonly title = 'Organisation';
}
