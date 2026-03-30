import { ChangeDetectionStrategy, Component, inject, OnInit, ViewChild } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { CalendarComponent } from './calendar/calendar.component'
import { AddTaskDialogComponent } from '../../shared/components/add-task-dialog/add-task-dialog.component';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { ScheduleFacadeService } from './schedule.facade';
import { MessageService } from 'primeng/api';
@Component({
  selector: 'app-schedule-page',
  standalone: true,
  imports: [
    CalendarComponent,
    CardModule,
    ButtonModule,
    ToastModule,
    MessageModule,
    AddTaskDialogComponent,
  ],
  templateUrl: './schedule.page.html',
  styleUrl: './schedule.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulePage implements OnInit {
  @ViewChild(AddTaskDialogComponent) addTaskDialog!: AddTaskDialogComponent;

  public facade = inject(ScheduleFacadeService);
  private messageService = inject(MessageService);

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
  };

  ngOnInit() {
    this.facade.loadCurrentWeek().subscribe();
  }

  onAddTask() {
    this.addTaskDialog.openDialog(null);
  }

  onTaskSaved(range: { from: string; to: string }) {
    this.facade.loadWeek(range.from, range.to).subscribe();
  }

  onWeekChanged(event: { from: string; to: string }) {
    // Load the schedule for the selected week
    this.facade.loadWeek(event.from, event.to).subscribe();
  }

  scheduleTasks() {
    this.facade.generateSchedule().subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Erfolg',
          detail: 'Zeitplan erfolgreich generiert',
        });
      },
      error: (err) => {
        if (err.status === 400 && err.error?.detail === 'working-hours-missing') {
          this.messageService.add({
            severity: 'warn',
            summary: 'Konfiguration fehlt',
            detail: 'Bitte konfiguriere zuerst deine Arbeitszeiten',
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Fehler',
            detail: 'Zeitplan konnte nicht generiert werden',
          });
        }
      },
    });
  }
}
