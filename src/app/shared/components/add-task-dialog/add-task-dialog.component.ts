import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DatePicker } from 'primeng/datepicker';
import { Checkbox } from 'primeng/checkbox';
import {TaskModel} from '../../models/task.model';
import {TaskState} from '../../models/task-state.model';

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

  protected items = Object.values(TaskState).map(status => ({
    label: status,
    value: status
  }));

  protected showDialog = signal(false);

  protected formData = signal<TaskModel>({
    title: '',
    estimatedTime: 0,
    status: TaskState.Open,
    deadline: undefined,
    trackedTime: 0,
    start: undefined,
    end: undefined,
    description: '',
    scheduleTask: false,
    numChunks: 0,
    chunks: []
  });

  updateFormData(field: keyof ReturnType<typeof this.formData>, value: any) {
    const current = this.formData();

    let updated = { ...current, [field]: value };

    if (field === 'numChunks') {
      updated.chunks = Array.from(
        { length: value },
        (_, i) => current.chunks[i] || null
      );
    }
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
    this.setData(taskData)
    this.showDialog.set(true);
  }

  isOpened() {
    return this.showDialog();
  }


  setData(taskData: TaskModel | null) {
    if (taskData) {
      this.updateFormData("title", taskData.title)
      this.updateFormData("estimatedTime", taskData.estimatedTime)
      this.updateFormData("status", taskData.status)
      this.updateFormData("deadline", taskData.deadline)
      this.updateFormData("description", taskData.description)
      this.updateFormData("scheduleTask", taskData.scheduleTask)
      this.updateFormData("numChunks", taskData.numChunks)
      this.updateFormData("chunks", taskData.chunks)
    }
    else {
      this.updateFormData("title", '')
      this.updateFormData("estimatedTime", 0)
      this.updateFormData("status", TaskState.Open)
      this.updateFormData("deadline", undefined)
      this.updateFormData("description", '')
      this.updateFormData("scheduleTask", false)
      this.updateFormData("numChunks", 0)
      this.updateFormData("chunks", [])
    }
  }
}
