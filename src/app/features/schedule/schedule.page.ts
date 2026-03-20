import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule} from 'primeng/inputtext'; // Used in template
import { TextareaModule } from 'primeng/textarea';
import { FormsModule } from '@angular/forms';
import {JsonPipe} from '@angular/common';

@Component({
  selector: 'app-schedule-page',
  standalone: true,
  imports: [CardModule, ButtonModule, DialogModule, InputTextModule, TextareaModule, FormsModule],
  templateUrl: './schedule.page.html',
  styleUrl: './schedule.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulePage {
  protected readonly title = 'Planungsansicht';
  protected button = {
    label: 'Aufgabe hinzufügen',
    icon: 'pi pi-plus',
    severity: 'success',
  };

  protected showDialog = signal(false);
  protected formData = signal({
    name: '',
    description: '',
  });

  onStartPlanning() {
    this.showDialog.set(true);
  }

  updateFormData(field: 'name' | 'description', value: string) {
    const current = this.formData();
    this.formData.set({ ...current, [field]: value });
  }

  onSubmit() {
    console.log('Form eingereicht:', this.formData());
    this.showDialog.set(false);
    // Hier kannst du die Daten verarbeiten (z.B. API-Aufruf)
  }
}
