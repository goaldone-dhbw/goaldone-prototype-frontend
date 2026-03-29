import { inject, Injectable, signal } from '@angular/core';
import { WorkingHoursModel } from '../models/working-hours.model';
import { WorkingHoursService as WorkingHoursApiService } from '../../api/api/workingHours.service';

import { map } from 'rxjs';
import {
  DayOfWeek,
  WorkingHoursDayEntry,
  WorkingHoursResponse,
} from '../../api';

@Injectable({
  providedIn: 'root',
})
export class WorkingHoursService {

  readonly loadedWorkingHours = signal<WorkingHoursModel[]>([]);
  private workingHoursApiService = inject(WorkingHoursApiService);

  saveWorkingHours(models: WorkingHoursModel[]) {
    const daysOfWeek = Object.values(DayOfWeek);
    const resultDays: WorkingHoursDayEntry[] = [];

    for (const day of daysOfWeek) {
      // Find if this day falls within any model's range
      let isWorkDay = false;
      let startTime = undefined;
      let endTime = undefined;

      const dayIndex = daysOfWeek.indexOf(day);

      for (const model of models) {
        if (!model.startDay || !model.endDay || !model.startHour || !model.endHour) continue;

        const startIndex = daysOfWeek.indexOf(model.startDay);
        const endIndex = daysOfWeek.indexOf(model.endDay);


        // Check if current day is between start and end (inclusive)
        if (startIndex <= endIndex) {
          console.log("Check 1")
          if (dayIndex >= startIndex && dayIndex <= endIndex) {
            isWorkDay = true;
            startTime = this.parseDateToString(model.startHour);
            endTime = this.parseDateToString(model.endHour);
            break;
          }
        } else {
          console.log("Check 2")
          // Range wraps around the week
          if (dayIndex >= startIndex || dayIndex <= endIndex) {
            isWorkDay = true;
            startTime = this.parseDateToString(model.startHour);
            endTime = this.parseDateToString(model.endHour);
            break;
          }
        }
      }

      resultDays.push({
        dayOfWeek: day,
        isWorkDay,
        startTime,
        endTime
      });
    }
    console.log(resultDays);

    return this.workingHoursApiService.upsertWorkingHours({ days: resultDays });
  }

  mapResponseToWorkingHours(response: WorkingHoursResponse): WorkingHoursModel[] {
    const models: WorkingHoursModel[] = [];
    const workDays = response.days.filter(day => day.isWorkDay);

    if (workDays.length === 0) {
      return [];
    }

    // Group consecutive work days
    let currentStartDay = workDays[0];
    let currentEndDay = workDays[0];

    for (let i = 1; i < workDays.length; i++) {
      const currentDay = workDays[i];
      const prevDay = workDays[i - 1];
      const daysOfWeek = Object.values(DayOfWeek);

      const currentDayIndex = daysOfWeek.indexOf(currentDay.dayOfWeek);
      const prevDayIndex = daysOfWeek.indexOf(prevDay.dayOfWeek);

      // Check if days are consecutive
      if (currentDayIndex === prevDayIndex + 1 &&
          currentDay.startTime === currentStartDay.startTime &&
          currentDay.endTime === currentStartDay.endTime) {
        // Continue the current range
        currentEndDay = currentDay;
      } else {
        // End the current range and start a new one
        models.push({
          startDay: currentStartDay.dayOfWeek,
          endDay: currentEndDay.dayOfWeek,
          startHour: this.parseTimeToDate(currentStartDay.startTime || ''),
          endHour: this.parseTimeToDate(currentStartDay.endTime || ''),
        });

        currentStartDay = currentDay;
        currentEndDay = currentDay;
      }
    }

    // Add the last range
    models.push({
      startDay: currentStartDay.dayOfWeek,
      endDay: currentEndDay.dayOfWeek,
      startHour: this.parseTimeToDate(currentStartDay.startTime || ''),
      endHour: this.parseTimeToDate(currentStartDay.endTime || ''),
    });

    return models;
  }

  private parseDateToString(time: Date | null): string {
    if (!time) return '';

    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes}`;
  }

  private parseTimeToDate(timeString: string): Date | null {
    if (!timeString) return null;

    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  loadWorkingHours() {
    return this.workingHoursApiService.getWorkingHours().pipe(
      map((response) => {
        const models = this.mapResponseToWorkingHours(response);
        this.loadedWorkingHours.set(models);
        return models;
      })
    );
  }
}

