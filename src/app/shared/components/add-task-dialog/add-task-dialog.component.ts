import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';

import { ButtonModule } from 'primeng/button';

import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';

import { FloatLabelModule } from 'primeng/floatlabel';

import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { TaskModel } from '../../models/task.model';
import { TaskState } from '../../models/task-state.model';
import { TaskDifficultyModel } from '../../models/task-difficulty.model';
import { TaskService } from '../../services/task.service';
import { RecurringTemplateService } from '../../services/recurring-template.service';
import { RecurringTemplateModel } from '../../models/recurring-template.model';
import { RecurrenceType } from '../../../api';

@Component({
  selector: 'app-add-task-dialog',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    FormsModule,
    SelectModule,
    InputNumberModule,
    FloatLabelModule,
    DatePickerModule,
    CheckboxModule,
    ToggleSwitchModule,
    ToastModule,
  ],
  templateUrl: './add-task-dialog.component.html',
  styleUrls: ['./add-task-dialog.component.scss'],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddTaskDialogComponent {
  private taskService = inject(TaskService);
  private routineService = inject(RecurringTemplateService);
  private messageService = inject(MessageService);

  protected taskStates = Object.values(TaskState).map((status) => ({
    label: status,
    value: status,
  }));

  protected taskDifficulty = Object.values(TaskDifficultyModel).map((difficulty) => ({
    label: difficulty,
    value: difficulty,
  }));

  protected showDialog = signal(false);
  protected estimatedTimeString = signal<string>('');
  protected isSubmitting = signal(false);
  protected isEditMode = signal(false);
  protected isRoutine = signal(false);
  protected selectedRecurrenceType = signal<RecurrenceType | null>(null);

  isValidTime(value: string | null): boolean {
    if (!value) return false;

    const regex = /^([0-1]?\d|2[0-3]):[0-5]\d$/;
    return regex.test(value);
  }

  formatEstimatedTime(minutes: number | undefined): string {
    if (!minutes) return '';
    const d = Math.floor(minutes / 1440);
    const h = Math.floor((minutes % 1440) / 60);
    const m = minutes % 60;

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0 || parts.length === 0) parts.push(`${m}m`);

    return parts.join(' ');
  }

  parseEstimatedTime(value: string): number {
    if (!value) return 0;

    let totalMinutes = 0;
    const regex = /(\d+)\s*([dhm])/g;
    let match;
    let found = false;

    while ((match = regex.exec(value.toLowerCase())) !== null) {
      found = true;
      const amount = parseInt(match[1], 10);
      const unit = match[2];

      if (unit === 'd') totalMinutes += amount * 1440;
      if (unit === 'h') totalMinutes += amount * 60;
      if (unit === 'm') totalMinutes += amount;
    }

    if (!found && !isNaN(Number(value))) {
      return Number(value);
    }
    return totalMinutes;
  }

  updateEstimatedTimeString(value: string) {
    this.estimatedTimeString.set(value);
    const minutes = this.parseEstimatedTime(value);
    this.updateFormData('estimatedTime', minutes);
  }

  protected formData = signal<any>(this.getDefaultTaskData());

  updateFormData(field: string, value: any) {
    const current = this.formData();
    const updated = { ...current, [field]: value };
    this.formData.set(updated);
  }

  updateChunk(index: number, value: string) {
    const current = this.formData();
    const updatedChunks = [...current.chunks];

    updatedChunks[index] = value;

    this.formData.set({
      ...current,
      chunks: updatedChunks,
    });
  }

  private validateForm(): string | undefined {
    const formData = this.formData();

    if (!formData.title || formData.title.trim() === '') {
      return 'Titel ist erforderlich';
    }

    if (!this.isRoutine() && !formData.status) {
      return 'Status ist erforderlich';
    }

    if (formData.estimatedTime <= 0) {
      return 'Geschätzte Zeit muss größer als 0 Minuten sein';
    }

    if (!this.isRoutine() && formData.deadline && formData.scheduleStartDate) {
      if (new Date(formData.deadline) < new Date(formData.scheduleStartDate)) {
        return 'Die Frist darf nicht vor dem "Nicht planen vor"-Datum liegen';
      }
    }

    if (this.isRoutine()) {
      if (!this.selectedRecurrenceType()) {
        return 'Wiederholungs-Typ ist erforderlich für Routinen';
      }
      if (formData.preferredStartTime && !this.isValidTime(formData.preferredStartTime)) {
        return 'Bevorzugte Startzeit muss im Format HH:mm sein';
      }
    }

    return undefined;
  }

  onSubmit() {
    const validationError = this.validateForm();
    if (validationError) {
      this.messageService.add({ severity: 'error', summary: 'Fehler', detail: validationError });
      return;
    }

    this.isSubmitting.set(true);
    const data = this.formData();

    if (this.isRoutine()) {
      const routineData: RecurringTemplateModel = {
        id: data.id,
        title: data.title,
        description: data.description,
        difficulty: data.difficulty,
        estimatedTime: data.estimatedTime,
        recurrenceRule: {
          type: this.selectedRecurrenceType()!,
          interval: data.recurrenceRule?.interval || 1
        },
        preferredStartTime: data.preferredStartTime
      };

      const submitObservable = this.isEditMode()
        ? this.routineService.updateTemplateInDB(routineData)
        : this.routineService.saveTemplateToDB(routineData);

      this.handleResponse(submitObservable);
    } else {
      const taskData: TaskModel = {
        ...data,
        recurrence: undefined // Ensure no recurrence for one-time tasks
      };

      const submitObservable = this.isEditMode()
        ? this.taskService.updateTaskInDB(taskData)
        : this.taskService.saveTaskToDB(taskData);

      this.handleResponse(submitObservable);
    }
  }

  private handleResponse(observable: any) {
    observable.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.showDialog.set(false);
        this.isEditMode.set(false);
      },
      error: (err: any) => {
        this.isSubmitting.set(false);
        const errorMsg = err?.error?.detail || 'Fehler beim Speichern';
        this.messageService.add({ severity: 'error', summary: 'Fehler', detail: errorMsg });
        console.error('Error saving:', err);
      }
    });
  }

  openDialog(data: any | null) {
    this.isEditMode.set(data !== null);
    if (data) {
      // Check if it's a routine (has recurrenceRule) or a task
      this.isRoutine.set('recurrenceRule' in data);
    } else {
      this.isRoutine.set(false);
    }
    this.setData(data);
    this.showDialog.set(true);
  }

  onDelete() {
    const id = this.formData().id;
    if (!id) {
      this.messageService.add({ severity: 'error', summary: 'Fehler', detail: 'ID nicht gefunden' });
      return;
    }

    if (!confirm('Wirklich löschen?')) {
      return;
    }

    this.isSubmitting.set(true);
    const deleteObservable = this.isRoutine()
      ? this.routineService.deleteTemplateFromDB(id)
      : this.taskService.deleteTaskFromDB(id);

    deleteObservable.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.showDialog.set(false);
        this.isEditMode.set(false);
      },
      error: (err: any) => {
        this.isSubmitting.set(false);
        const errorMsg = err?.error?.detail || 'Fehler beim Löschen';
        this.messageService.add({ severity: 'error', summary: 'Fehler', detail: errorMsg });
      }
    });
  }

  private getDefaultTaskData(): TaskModel {
    return {
      title: '',
      status: TaskState.OPEN,
      deadline: undefined,
      difficulty: TaskDifficultyModel.Easy,
      estimatedTime: 0,
      trackedTime: 0,
      startDate: undefined,
      description: '',
      scheduleTask: true,
      chunks: ['00:00'],
      enableScheduleStart: false,
      scheduleStartDate: undefined,
    };
  }

  private getDefaultRoutineData(): RecurringTemplateModel {
    return {
      title: '',
      description: '',
      difficulty: TaskDifficultyModel.Easy,
      estimatedTime: 0,
      recurrenceRule: { type: RecurrenceType.Daily, interval: 1 },
      preferredStartTime: undefined
    };
  }

  onRoutineToggle(val: boolean) {
    this.isRoutine.set(val);
    const current = this.formData();
    if (val) {
      this.formData.set({ ...this.getDefaultRoutineData(), title: current.title, description: current.description, difficulty: current.difficulty, estimatedTime: current.estimatedTime });
      this.selectedRecurrenceType.set(RecurrenceType.Daily);
    } else {
      this.formData.set({ ...this.getDefaultTaskData(), title: current.title, description: current.description, difficulty: current.difficulty, estimatedTime: current.estimatedTime });
      this.selectedRecurrenceType.set(null);
    }
  }

  addChunk() {
    const current = this.formData();
    if (!current.chunks) return;

    this.formData.set({
      ...current,
      chunks: [...current.chunks, '00:00'],
    });
  }

  removeChunk(index: number) {
    const current = this.formData();
    if (!current.chunks) return;

    const updatedChunks = current.chunks.filter((_: any, i: number) => i !== index);

    this.formData.set({
      ...current,
      chunks: updatedChunks,
    });
  }

  setData(data: any | null) {
    if (!data) {
      this.formData.set(this.isRoutine() ? this.getDefaultRoutineData() : this.getDefaultTaskData());
      this.estimatedTimeString.set('');
      this.selectedRecurrenceType.set(this.isRoutine() ? RecurrenceType.Daily : null);
      return;
    }

    this.formData.set({ ...data });
    this.estimatedTimeString.set(this.formatEstimatedTime(data.estimatedTime || data.durationMinutes));

    if (this.isRoutine()) {
      this.selectedRecurrenceType.set(data.recurrenceRule?.type ?? RecurrenceType.Daily);
    } else {
      this.selectedRecurrenceType.set(null);
    }
  }

  protected recurrenceTypes = [
    { label: 'Täglich', value: RecurrenceType.Daily },
    { label: 'Wöchentlich', value: RecurrenceType.Weekly },
    { label: 'Monatlich', value: RecurrenceType.Monthly },
  ];

  updateRecurrence(type: RecurrenceType) {
    this.selectedRecurrenceType.set(type);
    this.updateFormData('recurrenceRule', { ...this.formData().recurrenceRule, type });
  }

  updateInterval(interval: number) {
    this.updateFormData('recurrenceRule', { ...this.formData().recurrenceRule, interval });
  }

}
