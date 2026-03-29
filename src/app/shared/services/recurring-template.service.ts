import { inject, Injectable, signal } from '@angular/core';
import { RecurringTemplateModel } from '../models/recurring-template.model';
import { TaskDifficultyModel } from '../models/task-difficulty.model';
import { RecurringTemplatesService as RecurringTemplatesApiService } from '../../api/api/recurringTemplates.service';
import { CreateRecurringTemplateRequest } from '../../api/model/createRecurringTemplateRequest';
import { UpdateRecurringTemplateRequest } from '../../api/model/updateRecurringTemplateRequest';
import { CognitiveLoad } from '../../api/model/cognitiveLoad';
import { RecurringTemplateResponse } from '../../api/model/recurringTemplateResponse';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RecurringTemplateService {
  private readonly _loadedTemplates = signal<RecurringTemplateModel[]>([]);
  readonly loadedTemplates = this._loadedTemplates.asReadonly();

  private apiService = inject(RecurringTemplatesApiService);

  saveTemplateToDB(template: RecurringTemplateModel) {
    const request: CreateRecurringTemplateRequest = {
      title: template.title,
      description: template.description,
      durationMinutes: template.estimatedTime,
      cognitiveLoad: this.mapDifficultyToCognitiveLoad(template.difficulty),
      recurrenceRule: template.recurrenceRule,
      preferredStartTime: template.preferredStartTime,
    };

    return this.apiService.createRecurringTemplate(request).pipe(
      map((response) => {
        this.loadTemplatesFromDB();
        return response;
      })
    );
  }

  updateTemplateInDB(template: RecurringTemplateModel) {
    if (!template.id) {
      throw new Error('Template ID is required for update');
    }

    const request: UpdateRecurringTemplateRequest = {
      title: template.title,
      description: template.description,
      durationMinutes: template.estimatedTime,
      cognitiveLoad: this.mapDifficultyToCognitiveLoad(template.difficulty),
      recurrenceRule: template.recurrenceRule,
      preferredStartTime: template.preferredStartTime,
    };

    return this.apiService.updateRecurringTemplate(template.id, request).pipe(
      map((response) => {
        this.loadTemplatesFromDB();
        return response;
      })
    );
  }

  deleteTemplateFromDB(templateId: string) {
    return this.apiService.deleteRecurringTemplate(templateId).pipe(
      map(() => {
        this.loadTemplatesFromDB();
      })
    );
  }

  loadTemplatesFromDB() {
    this.apiService.listRecurringTemplates().pipe(
      map(page => page.content?.map(t => this.mapResponseToModel(t)) || [])
    ).subscribe({
      next: (templates) => {
        this._loadedTemplates.set(templates);
      },
      error: (err) => {
        console.error('Error loading recurring templates:', err);
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

  private mapResponseToModel(response: RecurringTemplateResponse): RecurringTemplateModel {
    return {
      id: response.id,
      title: response.title,
      description: response.description ?? undefined,
      difficulty: this.mapCognitiveLoadToDifficulty(response.cognitiveLoad),
      estimatedTime: response.durationMinutes,
      recurrenceRule: response.recurrenceRule,
      preferredStartTime: response.preferredStartTime ?? undefined,
    };
  }
}
