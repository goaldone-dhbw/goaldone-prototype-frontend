import { TaskState} from './task-state.model';

export interface TaskModel {
  id?: number;
  title: string;
  status: TaskState,
  deadline: Date | undefined,
  estimatedTime: number;
  trackedTime: number;
  start: Date | undefined;
  end?: Date | undefined;
  description?: string;
  scheduleTask: boolean;
  numChunks: number;
  chunks: (number | null)[];
}

