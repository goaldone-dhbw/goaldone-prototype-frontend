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

  protected items = [
    { label: 'Open', value: 'Open' },
    { label: 'Active', value: 'Active' },
    { label: 'Done', value: 'Done' },
    { label: 'Needs Review', value: 'Needs Review' },
    { label: 'In Review', value: 'In Review' },
    { label: 'Closed', value: 'Closed' },
  ];

  protected showDialog = signal(false);

  protected formData = signal({
    name: '',
    status: null as string | null,
    deadline: null as Date | null,
    estimatedTime: null as number | null,
    trackedTime: null as number | null,
    description: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
    scheduled: true,
    chunked: false,
    chunkCount: 0,
    chunkDurations: [] as (string | null)[],
  });

  updateFormData(field: keyof ReturnType<typeof this.formData>, value: any) {
    const current = this.formData();

    let updated = { ...current, [field]: value };

    // 👉 Chunk Count -> Array anpassen
    if (field === 'chunkCount') {
      updated.chunkDurations = Array.from(
        { length: value },
        (_, i) => current.chunkDurations[i] || null
      );
    }

    this.formData.set(updated);
  }

  updateChunk(index: number, value: string) {
    const current = this.formData();
    const updatedChunks = [...current.chunkDurations];
    updatedChunks[index] = value;

    this.formData.set({
      ...current,
      chunkDurations: updatedChunks,
    });
  }

  onSubmit() {
    console.log('Form eingereicht:', this.formData());
    this.showDialog.set(false);

    // submit

    this.resetFormData()
  }

  openDialog() {
    this.showDialog.set(true);
  }

  resetFormData() {
    this.formData.set({
      name: '',
      status: null,
      deadline: null,
      estimatedTime: null,
      trackedTime: null,
      description: '',
      startDate: null,
      endDate: null,
      scheduled: true,
      chunked: false,
      chunkCount: 0,
      chunkDurations: [],
    });
  }
}
