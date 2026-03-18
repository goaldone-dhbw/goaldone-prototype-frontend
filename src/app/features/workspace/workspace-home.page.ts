import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Card } from 'primeng/card';

@Component({
  selector: 'app-workspace-home-page',
  standalone: true,
  imports: [Card],
  templateUrl: './workspace-home.page.html',
  styleUrl: './workspace-home.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceHomePage {}

