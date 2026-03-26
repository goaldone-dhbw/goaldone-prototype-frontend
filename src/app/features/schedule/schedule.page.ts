import { ChangeDetectionStrategy, Component, inject, OnInit, ViewChild } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { CalendarComponent } from './calendar/calendar.component'
import AddTaskDialog from '../../shared/components/add-task-dialog/add-task-dialog.component';
import { Message, MessageModule } from 'primeng/message';
import { Toast, ToastModule } from 'primeng/toast';
import { ScheduleFacadeService } from './schedule.facade';
import { MessageService } from 'primeng/api';
@Component({
  selector: 'app-schedule-page',
  standalone: true,
  imports: [CalendarComponent, CardModule, ButtonModule, ToastModule, MessageModule, AddTaskDialog],
  templateUrl: './schedule.page.html',
  styleUrl: './schedule.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulePage implements OnInit {
  @ViewChild(AddTaskDialog) addTaskDialog!: AddTaskDialog;

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
