import { inject, Injectable, signal } from '@angular/core';
import { TaskModel } from '../models/task.model';
import { TaskDifficultyModel } from '../models/task-difficulty.model';
import { TaskState } from '../models/task-state.model';
import { TasksService as TasksApiService } from '../../api/api/tasks.service';
import { map } from 'rxjs';
import {
  CognitiveLoad,
  CreateTaskRequest,
  TaskResponse,
  TaskStatus,
  UpdateTaskRequest,
} from '../../api';

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
      startDate: task.scheduleStartDate?.toISOString(),
    };

    return this.tasksApiService.createTask(request).pipe(
      map((response) => {
        this.loadTasksFromDB();
        return response;
      })
    );
  }

  updateTaskInDB(task: TaskModel) {
    if (!task.id) {
      throw new Error('Task ID is required for update');
    }

    const request: UpdateTaskRequest = {
      title: task.title,
      description: task.description,
      estimatedDurationMinutes: task.estimatedTime,
      cognitiveLoad: this.mapDifficultyToCognitiveLoad(task.difficulty),
      deadline: task.deadline?.toISOString(),
      startDate: task.scheduleStartDate?.toISOString(),
    };

    return this.tasksApiService.updateTask(task.id, request).pipe(
      map((response) => {
        this.loadTasksFromDB();
        return response;
      })
    );
  }

  deleteTaskFromDB(taskId: string) {
    return this.tasksApiService.deleteTask(taskId).pipe(
      map(() => {
        this.loadTasksFromDB();
      })
    );
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
      scheduleStartDate: response.startDate ? new Date(response.startDate) : undefined,
      chunks: []
    };
  }
}
