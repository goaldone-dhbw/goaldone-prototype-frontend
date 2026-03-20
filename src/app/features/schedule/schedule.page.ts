import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';


@Component({
  selector: 'app-schedule-page',
  standalone: true,
  imports: [Card, Button],
  templateUrl: './schedule.page.html',
  styleUrl: './schedule.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulePage {
  protected readonly title = 'Planungsansicht';
  protected button = {
    label: 'Aufgabe hinzufügen',
    icon: 'pi pi-plus',
    class: 'p-button-success',
  };

  onStartPlanning() {

  }
}
