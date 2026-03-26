import { TaskState} from './task-state.model';
import { TaskDifficultyModel } from './task-difficulty.model';

export interface TaskModel {
  title: string;
  status: TaskState,
  deadline: Date | undefined,
  difficulty: TaskDifficultyModel,
  estimatedTime: number;
  trackedTime: number;
  startDate: Date | undefined;
  endDate?: Date | undefined;
  description?: string;
  scheduleTask: boolean;
  recurring: boolean;
  recurrenceType?: string;
  recurrenceIntervall?: number;
  numChunks: number;
  chunks: (number | null)[];
}

