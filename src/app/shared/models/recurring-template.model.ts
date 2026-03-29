import { TaskDifficultyModel } from './task-difficulty.model';
import { RecurrenceRule } from '../../api';

export interface RecurringTemplateModel {
  id?: string;
  title: string;
  description?: string;
  difficulty: TaskDifficultyModel;
  estimatedTime: number; // maps to durationMinutes
  recurrenceRule: RecurrenceRule;
  preferredStartTime?: string; // e.g., "09:00"
}
