import { DayOfWeek } from '../../api';
import { RecurrenceType } from '../../api';
import { RecurrenceRule} from '../../api';


export interface BreaksModel {
  startDay: DayOfWeek;
  endDay: DayOfWeek;
  startHour: Date;
  endHour: Date;
  recurrenceType: RecurrenceType;
  recurrenceRule: RecurrenceRule;
}
