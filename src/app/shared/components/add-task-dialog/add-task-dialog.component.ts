import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';

import { ButtonModule } from 'primeng/button';

import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';

import { FloatLabelModule } from 'primeng/floatlabel';

import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { Checkbox } from 'primeng/checkbox';

import { TaskModel } from '../../models/task.model';
import { TaskState } from '../../models/task-state.model';
import { TaskDifficultyModel } from '../../models/task-difficulty.model';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-add-task-dialog',
  standalone: true,
  imports: [
    CardModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    FormsModule,
    SelectModule,
    InputNumberModule,
    FloatLabelModule,
    DatePicker,
    Checkbox,
  ],
  templateUrl: './add-task-dialog.component.html',
  styleUrls: ['./add-task-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddTaskDialog {

  protected taskStates = Object.values(TaskState).map((status) => ({
    label: status,
    value: status,
  }));

  protected taskDifficulty = Object.values(TaskDifficultyModel).map((difficulty) => ({
    label: difficulty,
    value: difficulty,
  }));

  protected showDialog = signal(false);

  protected formData = signal<TaskModel>(this.getDefaultFormData());

  recurringOptions = [
    { label: 'Täglich', value: 'daily' },
    { label: 'Wöchentlich', value: 'weekly' },
    { label: 'Monatlich', value: 'monthly' }
  ];

  constructor(private taskService: TaskService) {}
  updateFormData(field: keyof TaskModel, value: any) {

    console.log("Updated form", field)

    const current = this.formData();
    let updated = { ...current, [field]: value };

    if (field === 'numChunks') {
      updated.chunks = Array.from(
        { length: value },
        (_, i) => current.chunks[i] ?? null
      );
    }

    this.formData.set(updated);
  }

  updateChunk(index: number, value: number) {
    const current = this.formData();
    const updatedChunks = [...current.chunks];
    updatedChunks.push(value)

    console.log(updatedChunks.length)

    this.formData.set({
      ...current,
      chunks: updatedChunks,
    });
  }

  onSubmit() {
    console.log('Form eingereicht:', this.formData());
    this.showDialog.set(false);

    this.taskService.saveTaskToDB(this.formData());

  }

  openDialog(taskData: TaskModel | null) {
    this.setData(taskData);
    this.showDialog.set(true);
  }

  private getDefaultFormData(): TaskModel {
    return {
      title: '',
      status: TaskState.Open,
      deadline: undefined,
      difficulty: TaskDifficultyModel.Easy,
      estimatedTime: 0,
      trackedTime: 0,
      startDate: undefined,
      endDate: undefined,
      description: '',
      scheduleTask: true,
      recurring: false,
      recurrenceType: undefined,
      recurrenceIntervall: undefined,
      numChunks: 1,
      chunks: [0]
    };
  }

  setData(taskData: TaskModel | null) {
    const base = this.getDefaultFormData();

    // Set available data
    const data = taskData
      ? { ...base, ...taskData }
      : base;

    // Update chunks based on numChunks
    const chunks = Array.from(
      { length: data.numChunks },
      (_, i) => data.chunks?.[i] ?? null
    );

    this.formData.set({
      ...data,
      chunks,
    });
  }
}
