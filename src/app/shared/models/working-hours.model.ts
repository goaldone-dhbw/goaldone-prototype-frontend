import { DayOfWeek } from '../../api';

export interface WorkingHoursModel {
  startDay: DayOfWeek | null;
  endDay: DayOfWeek | null;
  startHour: Date | null;
  endHour: Date | null;
}
