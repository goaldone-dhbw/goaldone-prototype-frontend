import { DayOfWeek } from '../../api';

export interface WorkingHoursModel {
  dayOfWeek: DayOfWeek | null;
  startTime: Date | null;
  endTime: Date | null;
  isWorkDay: boolean;
}
