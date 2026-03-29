import { BreakType } from '../../api';
import { RecurrenceType } from '../../api';


export interface BreaksModel {
  label: string,
  startTime: string,
  endTime: string,
  breakType: BreakType,
  recurrence: {
    type: RecurrenceType,
    interval: number,
  },
  date: Date | null,
  validFrom: Date | null,
  validUntil: Date | null,
}
