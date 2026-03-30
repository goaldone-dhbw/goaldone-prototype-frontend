import { ChangeDetectionStrategy, Component, inject, OnInit, ViewChild } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DatePipe } from '@angular/common';
import { TaskService } from '../../shared/services/task.service';
import { RecurringTemplateService } from '../../shared/services/recurring-template.service';
import { AddTaskDialogComponent } from '../../shared/components/add-task-dialog/add-task-dialog.component';
import { TaskModel } from '../../shared/models/task.model';
import { TaskState } from '../../shared/models/task-state.model';
import { TaskDifficultyModel } from '../../shared/models/task-difficulty.model';
import { RecurringTemplateModel } from '../../shared/models/recurring-template.model';
import { RecurrenceType } from '../../api';

@Component({
  selector: 'app-tasks-page',
  standalone: true,
  imports: [
    CardModule,
    ButtonModule,
    TabsModule,
    TableModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    DatePipe,
    AddTaskDialogComponent,
  ],
  providers: [ConfirmationService],
  templateUrl: './tasks.page.html',
  styleUrl: './tasks.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksPage implements OnInit {
  @ViewChild(AddTaskDialogComponent) addTaskDialog!: AddTaskDialogComponent;

  protected taskService = inject(TaskService);
  protected recurringTemplateService = inject(RecurringTemplateService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  ngOnInit() {
    this.taskService.loadTasksFromDB();
    this.recurringTemplateService.loadTemplatesFromDB();
  }

  onAddTask() {
    this.addTaskDialog.openDialog(null);
  }

  onDialogSaved() {
    this.taskService.loadTasksFromDB();
    this.recurringTemplateService.loadTemplatesFromDB();
  }

  onEditTask(task: TaskModel) {
    this.addTaskDialog.openDialog(task);
  }

  onDeleteTask(task: TaskModel) {
    this.confirmationService.confirm({
      message: `Aufgabe "${task.title}" wirklich löschen?`,
      header: 'Löschen bestätigen',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Löschen',
      rejectLabel: 'Abbrechen',
      accept: () => {
        this.taskService.deleteTaskFromDB(task.id!).subscribe({
          next: () => this.messageService.add({ severity: 'success', summary: 'Gelöscht', detail: 'Aufgabe wurde gelöscht' }),
          error: () => this.messageService.add({ severity: 'error', summary: 'Fehler', detail: 'Aufgabe konnte nicht gelöscht werden' }),
        });
      },
    });
  }

  onEditTemplate(template: RecurringTemplateModel) {
    this.addTaskDialog.openDialog(template);
  }

  onDeleteTemplate(template: RecurringTemplateModel) {
    this.confirmationService.confirm({
      message: `Routine "${template.title}" wirklich löschen?`,
      header: 'Löschen bestätigen',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Löschen',
      rejectLabel: 'Abbrechen',
      accept: () => {
        this.recurringTemplateService.deleteTemplateFromDB(template.id!).subscribe({
          next: () => this.messageService.add({ severity: 'success', summary: 'Gelöscht', detail: 'Routine wurde gelöscht' }),
          error: () => this.messageService.add({ severity: 'error', summary: 'Fehler', detail: 'Routine konnte nicht gelöscht werden' }),
        });
      },
    });
  }

  getStatusSeverity(status: TaskState): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (status) {
      case TaskState.DONE: return 'success';
      case TaskState.IN_PROGRESS: return 'info';
      case TaskState.OPEN: return 'warn';
      default: return 'secondary';
    }
  }

  getDifficultySeverity(difficulty: TaskDifficultyModel): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (difficulty) {
      case TaskDifficultyModel.Easy: return 'success';
      case TaskDifficultyModel.Moderate: return 'warn';
      case TaskDifficultyModel.Difficult: return 'danger';
      default: return 'secondary';
    }
  }

  formatEstimatedTime(minutes: number): string {
    if (!minutes) return '-';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  }

  formatRecurrence(template: RecurringTemplateModel): string {
    const type = template.recurrenceRule?.type;
    const interval = template.recurrenceRule?.interval ?? 1;
    switch (type) {
      case 'DAILY': return interval === 1 ? 'Täglich' : `Alle ${interval} Tage`;
      case 'WEEKLY': return interval === 1 ? 'Wöchentlich' : `Alle ${interval} Wochen`;
      case 'MONTHLY': return interval === 1 ? 'Monatlich' : `Alle ${interval} Monate`;
      default: return '-';
    }
  }
}
