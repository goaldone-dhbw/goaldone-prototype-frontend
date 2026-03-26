import { inject, Injectable, signal } from '@angular/core';
import { TaskModel } from '../models/task.model';
import { BaseService } from '../../api/api.base.service';
import { TaskDifficultyModel } from '../models/task-difficulty.model';
import { TaskState } from '../models/task-state.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class TaskService extends BaseService {

  private readonly _loadedTasks = signal<TaskModel[]>([]);
  readonly loadedTasks = this._loadedTasks.asReadonly();

  constructor() {
    super();
  }

  private http: HttpClient = inject(HttpClient);

  saveTaskToDB(task: TaskModel) {
    this.http.post(`${this.basePath}/tasks`, task).subscribe()
  }

  loadTasksFromDB() {
    //this.http.get<TaskModel[]>(`${this.basePath}/tasks`).subscribe(tasks => {
    //  this.loadedTasks.set(tasks);
    //})

    this._loadedTasks.set([
      {
        title: 'Meeting',
        status: TaskState.Open,
        deadline: new Date('2026-03-30'),
        estimatedTime: 120,
        difficulty: TaskDifficultyModel.Moderate,
        trackedTime: 0,
        startDate: new Date('2026-03-23T10:00:00'),
        endDate: new Date('2026-03-23T12:00:00'),
        description: 'Description for Meeting',
        scheduleTask: true,
        recurring: false,
        numChunks: 1,
        chunks: []
      }, {
        title: 'Meeting',
        status: TaskState.Open,
        deadline: new Date('2026-03-30'),
        difficulty: TaskDifficultyModel.Moderate,
        estimatedTime: 120,
        trackedTime: 0,
        startDate: new Date('2026-03-26T12:00:00'),
        endDate: new Date('2026-03-26T15:00:00'),
        description: 'Description for Task Meeting',
        scheduleTask: true,
        recurring: false,
        numChunks: 1,
        chunks: []
      }, {
        title: 'Lunch',
        status: TaskState.Open,
        deadline: new Date('2026-03-31'),
        difficulty: TaskDifficultyModel.Easy,
        estimatedTime: 120,
        trackedTime: 0,
        startDate: new Date('2026-03-25T11:00:00'),
        endDate: new Date('2026-03-25T13:00:00'),
        description: 'Description for Task Lunch',
        scheduleTask: true,
        recurring: false,
        numChunks: 1,
        chunks: []
      }
    ])
  }
}
