import {ChangeDetectionStrategy, Component, ViewChild} from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { CalendarComponent } from './calendar/calendar.component'
import { AddTaskDialog } from '../../shared/components/add-task-dialog/add-task-dialog.component';

@Component({
  selector: 'app-schedule-page',
  standalone: true,
  imports: [CalendarComponent, CardModule, ButtonModule, AddTaskDialog],
  templateUrl: './schedule.page.html',
  styleUrl: './schedule.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class SchedulePage {
  @ViewChild(AddTaskDialog) addTaskDialog!: AddTaskDialog;

  protected readonly title = 'Planungsansicht';

  protected addTaskButton = {
    label: 'Aufgabe hinzufügen',
    icon: 'pi pi-plus',
    severity: 'success',
  };

  protected scheduleTasksButton = {
    label: 'Planung starten',
    icon: 'pi pi-calendar',
    severity: 'primary',
  }

  onAddTask() {
    console.log('Dialog geöffnet');
    this.addTaskDialog.openDialog(null)
  }

  scheduleTasks() {
    console.log('Scheduling tasks')
  }
}
