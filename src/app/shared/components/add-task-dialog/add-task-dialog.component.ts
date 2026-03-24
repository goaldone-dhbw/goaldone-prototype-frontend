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
import {DatePicker} from 'primeng/datepicker';


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
    DatePicker
  ],
  templateUrl: './add-task-dialog.component.html',
  styleUrls: ['./add-task-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddTaskDialog {
  protected date: Date | null = null;

  protected items = [
    { label: 'Open', value: 'Open' },
    { label: 'Active', value: 'Active' },
    { label: 'Done', value: 'Done' },
    { label: 'Needs Review', value: 'Needs Review' },
    { label: 'In Review', value: 'In Review' },
    { label: 'Closed', value: 'Closed' }
  ];

  protected showDialog = signal(false);

  protected formData = signal({
    name: '',
    status: null as string | null,
    deadline: null as Date | null,
    estimatedTime: null as number | null,
    trackedTime: null as number | null,
    description: '',
  });

  updateFormData(field: keyof ReturnType<typeof this.formData>, value: any) {
    const current = this.formData();
    this.formData.set({ ...current, [field]: value });
  }

  onSubmit() {
    console.log('Form eingereicht:', this.formData());
    this.showDialog.set(false);
  }

  openDialog() {
    this.showDialog.set(true);
  }
}
