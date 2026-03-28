import { inject, Injectable } from '@angular/core';
import { WorkingHoursService as WorkingHoursApiService } from '../../api/api/workingHours.service';
import { UpsertWorkingHoursRequest } from '../../api/model/upsertWorkingHoursRequest';
import { WorkingHoursDayEntry } from '../../api/model/workingHoursDayEntry';
import { WorkingHoursModel } from '../models/working-hours.model';
import { DayOfWeek } from '../../api/model/dayOfWeek';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WorkingHoursService {
  private apiService = inject(WorkingHoursApiService);

  getWorkingHours(): Observable<WorkingHoursModel[]> {
    return this.apiService.getWorkingHours().pipe(
      map(response => response.days.map(day => this.mapEntryToModel(day)))
    );
  }

  saveWorkingHours(workingHours: WorkingHoursModel[]): Observable<any> {
    const days: WorkingHoursDayEntry[] = workingHours.map(day => this.mapModelToEntry(day));
    const request: UpsertWorkingHoursRequest = { days };
    return this.apiService.upsertWorkingHours(request);
  }

  private mapModelToEntry(model: WorkingHoursModel): WorkingHoursDayEntry {
    return {
      dayOfWeek: model.dayOfWeek as DayOfWeek,
      isWorkDay: model.isWorkDay,
      startTime: model.startTime ? this.formatTime(model.startTime) : undefined,
      endTime: model.endTime ? this.formatTime(model.endTime) : undefined,
    };
  }

  private mapEntryToModel(entry: WorkingHoursDayEntry): WorkingHoursModel {
    return {
      dayOfWeek: entry.dayOfWeek,
      isWorkDay: entry.isWorkDay,
      startTime: entry.startTime ? this.parseTime(entry.startTime) : null,
      endTime: entry.endTime ? this.parseTime(entry.endTime) : null,
    };
  }

  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private parseTime(timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }
}
