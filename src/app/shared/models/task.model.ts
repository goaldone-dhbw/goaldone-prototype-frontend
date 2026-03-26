import { TaskState} from './task-state.model';
import { TaskDifficultyModel } from './task-difficulty.model';

export interface TaskModel {
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
  recurrence?: Recurrence;
}

export interface Recurrence {
  isRecurring: boolean;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number;
  daysOfWeek: string[];
  endType: 'never' | 'after' | 'date';
  occurrences: number;
  endDate?: Date;
}

