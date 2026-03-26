import { inject, Injectable, signal } from '@angular/core';
import { TaskModel } from '../models/task.model';
import { TaskDifficultyModel } from '../models/task-difficulty.model';
import { TaskState } from '../models/task-state.model';
import { TasksService as TasksApiService } from '../../api/api/tasks.service';
import { CreateTaskRequest } from '../../api/model/createTaskRequest';
import { CognitiveLoad } from '../../api/model/cognitiveLoad';
import { TaskStatus } from '../../api/model/taskStatus';
import { TaskResponse } from '../../api/model/taskResponse';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly _loadedTasks = signal<TaskModel[]>([]);
  readonly loadedTasks = this._loadedTasks.asReadonly();

  private tasksApiService = inject(TasksApiService);

  saveTaskToDB(task: TaskModel) {
    const request: CreateTaskRequest = {
      title: task.title,
      description: task.description,
      estimatedDurationMinutes: task.estimatedTime,
      cognitiveLoad: this.mapDifficultyToCognitiveLoad(task.difficulty),
      deadline: task.deadline?.toISOString(),
      recurrence: task.recurrence,
    };

    this.tasksApiService.createTask(request).subscribe({
      next: (response) => {
        // Optional: Den neu erstellten Task lokal hinzufügen oder die Liste neu laden
        this.loadTasksFromDB();
      },
      error: (err) => {
        console.error('Error saving task:', err);
      }
    });
  }

  loadTasksFromDB() {
    this.tasksApiService.listTasks().pipe(
      map(page => page.content?.map(t => this.mapResponseToModel(t)) || [])
    ).subscribe({
      next: (tasks) => {
        this._loadedTasks.set(tasks);
      },
      error: (err) => {
        console.error('Error loading tasks:', err);
      }
    });
  }

  private mapDifficultyToCognitiveLoad(difficulty: TaskDifficultyModel): CognitiveLoad {
    switch (difficulty) {
      case TaskDifficultyModel.Easy: return 'LOW';
      case TaskDifficultyModel.Moderate: return 'MEDIUM';
      case TaskDifficultyModel.Difficult: return 'HIGH';
      default: return 'MEDIUM';
    }
  }

  private mapCognitiveLoadToDifficulty(load: CognitiveLoad): TaskDifficultyModel {
    switch (load) {
      case 'LOW': return TaskDifficultyModel.Easy;
      case 'MEDIUM': return TaskDifficultyModel.Moderate;
      case 'HIGH': return TaskDifficultyModel.Difficult;
      default: return TaskDifficultyModel.Moderate;
    }
  }

  private mapStatusToState(status: TaskStatus): TaskState {
    switch (status) {
      case 'OPEN': return TaskState.OPEN;
      case 'IN_PROGRESS': return TaskState.IN_PROGRESS;
      case 'DONE': return TaskState.DONE;
      default: return TaskState.OPEN;
    }
  }

  private mapResponseToModel(response: TaskResponse): TaskModel {
    return {
      id: response.id,
      title: response.title,
      description: response.description ?? undefined,
      status: this.mapStatusToState(response.status),
      difficulty: this.mapCognitiveLoadToDifficulty(response.cognitiveLoad),
      estimatedTime: response.estimatedDurationMinutes,
      deadline: response.deadline ? new Date(response.deadline) : undefined,
      trackedTime: 0, // Muss ggf. noch vom Backend kommen
      startDate: undefined, // Vom Schedule-Service
      endDate: undefined,   // Vom Schedule-Service
      scheduleTask: true,
      recurrence: response.recurrence,
      chunks: []
    };
  }
}
