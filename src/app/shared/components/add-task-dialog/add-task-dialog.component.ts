import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
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

import { Recurrence, TaskModel } from '../../models/task.model';
import { TaskState } from '../../models/task-state.model';
import { TaskDifficultyModel } from '../../models/task-difficulty.model';

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
  ],
  templateUrl: './add-task-dialog.component.html',
  styleUrls: ['./add-task-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class AddTaskDialog {
  protected taskStates = Object.values(TaskState).map((status) => ({
    label: status,
    value: status,
  }));

  protected taskDifficulty = Object.values(TaskDifficultyModel).map((difficulty) => ({
    label: difficulty,
    value: difficulty,
  }));

  isValidTime(value: string | null): boolean {
    if (!value) return false;

    const regex = /^([0-1]?\d|2[0-3]):[0-5]\d$/;
    return regex.test(value);
  }

  protected showDialog = signal(false);

  protected formData = signal<TaskModel>(this.getDefaultFormData());

  updateFormData(field: keyof TaskModel, value: any) {
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

  onSubmit() {
    console.log('Form eingereicht:', this.formData());
    this.showDialog.set(false);
  }

  openDialog(taskData: TaskModel | null) {
    this.setData(taskData);
    this.showDialog.set(true);
  }

  private getDefaultFormData(): TaskModel {
    return {
      title: '',
      status: TaskState.OPEN,
      deadline: undefined,
      difficulty: TaskDifficultyModel.Easy,
      estimatedTime: 0,
      trackedTime: 0,
      startDate: undefined,
      endDate: undefined,
      description: '',
      scheduleTask: true,
      chunks: ['00:00'],
      enableScheduleStart: false,
      scheduleStartDate: undefined,
      recurrence: {
        isRecurring: false,
        type: 'daily',
        interval: 1,
        daysOfWeek: [],
        endType: 'never',
        occurrences: 1,
        endDate: undefined,
      },
    };
  }

  addChunk() {
    const current = this.formData();

    this.formData.set({
      ...current,
      chunks: [...current.chunks, '00:00'],
    });
  }

  removeChunk(index: number) {
    const current = this.formData();

    const updatedChunks = current.chunks.filter((_, i) => i !== index);

    this.formData.set({
      ...current,
      chunks: updatedChunks,
    });
  }

  setData(taskData: TaskModel | null) {
    const base = this.getDefaultFormData();
    const data = taskData ? { ...base, ...taskData } : base;

    const chunks = data.chunks?.length ? data.chunks : ['00:00'];

    this.formData.set({
      ...data,
      chunks,
      enableScheduleStart: data.enableScheduleStart ?? false,
      scheduleStartDate: data.scheduleStartDate ?? undefined,
    });
  }

  protected recurrenceTypes = [
    { label: 'Nie', value: 'never' },
    { label: 'Täglich', value: 'daily' },
    { label: 'Wöchentlich', value: 'weekly' },
    { label: 'Monatlich', value: 'monthly' },
  ];

  updateRecurrence<K extends keyof Recurrence>(field: K, value: Recurrence[K]) {
    this.formData.update((fd) => {
      const rec = { ...fd.recurrence!, [field]: value };

      if (field === 'endType') {
        if (value === 'after') rec.endDate = undefined;
        if (value === 'date') rec.occurrences = 1;
      }

      return { ...fd, recurrence: rec };
    });
  }

  toggleWeekday(day: string) {
    const current = this.formData();
    const days = current.recurrence?.daysOfWeek || [];

    const updated = days.includes(day) ? days.filter((d) => d !== day) : [...days, day];

    this.updateRecurrence('daysOfWeek', updated);
  }
}

export default AddTaskDialog;
