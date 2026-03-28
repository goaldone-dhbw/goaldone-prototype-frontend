import { Component, inject, OnInit } from '@angular/core';
import { Card } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DatePicker } from 'primeng/datepicker';
import { Select } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { WorkingHoursModel } from '../../shared/models/working-hours.model';
import { DayOfWeek } from '../../api';
import { WorkingHoursService } from '../../shared/services/working-hours.service';

@Component({
  selector: 'app-working-hours-page',
  standalone: true,
  imports: [Card, ButtonModule, ReactiveFormsModule, FormsModule, DatePicker, Select, CheckboxModule],
  styleUrl: 'working-hours.page.scss',
  templateUrl: 'working-hours.page.html',
})
export class WorkingHoursPage implements OnInit {
  title: string = 'Arbeitszeiten und Pausen';

  service = inject(WorkingHoursService);

  workingHours: WorkingHoursModel[] = [];

  capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  days = Object.values(DayOfWeek).map(dayOfWeek => ({
    label: this.capitalize(dayOfWeek),
    value: dayOfWeek,
  }));

  ngOnInit() {
    this.service.getWorkingHours().subscribe({
      next: (hours) => {
        this.workingHours = hours;
      },
      error: (err) => {
        console.error('Error loading working hours:', err);
      }
    });
  }

  addWorkingHours() {
    this.workingHours.push({
      startTime: null,
      endTime: null,
      isWorkDay: true,
      dayOfWeek: null,
    });
  }

  removeWorkingHour(index: number) {
    this.workingHours.splice(index, 1);
  }

  protected saveWorkingHours() {
    this.service.saveWorkingHours(this.workingHours).subscribe({
      next: () => {
        console.log('Working hours saved successfully');
      },
      error: (err) => {
        console.error('Error saving working hours:', err);
      }
    });
  }
}
