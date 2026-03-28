import { Component, inject } from '@angular/core';
import { Card } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DatePicker } from 'primeng/datepicker';
import { Select } from 'primeng/select';
import { WorkingHoursModel } from '../../shared/models/working-hours.model';
import { DayOfWeek} from '../../api';

import { WorkingHoursService } from '../../shared/services/working-hours.service';


@Component({
  selector: 'app-working-hours-page',
  standalone: true,
  imports: [Card, ButtonModule, ReactiveFormsModule, FormsModule, DatePicker, Select],
  styleUrl: 'working-hours.page.scss',
  templateUrl: 'working-hours.page.html',
})
export class WorkingHoursPage {
  title: string = 'Arbeitszeiten und Pausen';

  service = inject(WorkingHoursService)

  workingHours: WorkingHoursModel[] = [];

  capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  days = Object.values(DayOfWeek).map(dayOfWeek => ({
    label: this.capitalize(dayOfWeek),
    value: this.capitalize(dayOfWeek),
  }))

  addWorkingHours() {
    this.workingHours.push({
      startDay: null,
      endDay: null,
      startHour: null,
      endHour: null,
    });
  }

  removeWorkingHour(index: number) {
    this.workingHours.splice(index, 1);
  }

  protected saveWorkingHours() {
    this.service.saveWorkingHours(this.workingHours);
  }
}
