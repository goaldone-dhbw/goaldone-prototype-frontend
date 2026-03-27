import { TaskState} from './task-state.model';
import { TaskDifficultyModel } from './task-difficulty.model';
import { RecurrenceRule } from '../../api';

export interface TaskModel {
  id?: string;
  title: string;
  status: TaskState;
  deadline: Date | undefined;
  difficulty: TaskDifficultyModel;
  estimatedTime: number;
  trackedTime: number;
  startDate: Date | undefined;
  endDate?: Date | undefined;
  description?: string;
  scheduleTask: boolean;
  chunks: string[];
  enableScheduleStart?: boolean;
  scheduleStartDate?: Date;
}

