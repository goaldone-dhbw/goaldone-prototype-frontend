import { computed, inject, Injectable, signal } from '@angular/core';
import { ScheduleService } from '../../api/api/schedule.service';
import { ScheduleEntry } from '../../api/model/scheduleEntry';
import { GenerateScheduleRequest } from '../../api/model/generateScheduleRequest';
import { finalize, switchMap, tap } from 'rxjs';
import { TaskService } from '../../shared/services/task.service';

@Injectable({
  providedIn: 'root'
})
export class ScheduleFacadeService {
  private scheduleService = inject(ScheduleService);
  private taskService = inject(TaskService);

  private _scheduleEntries = signal<ScheduleEntry[]>([]);
  private _isLoading = signal(false);
  private _warnings = signal<string[]>([]);

  public scheduleEntries = this._scheduleEntries.asReadonly();
  public isLoading = this._isLoading.asReadonly();
  public warnings = this._warnings.asReadonly();
  public hasSchedule = computed(() => this._scheduleEntries().length > 0);

  /**
   * Formatiert die API-Warnings in lesbare Nachrichten inklusive Task-Titel.
   */
  public formattedWarnings = computed(() => {
    const rawWarnings = this._warnings();
    const tasks = this.taskService.loadedTasks();

    return rawWarnings.map(warning => {
      const [type, taskId] = warning.split(':');
      const task = tasks.find(t => t.id === taskId);
      const taskTitle = task ? `'${task.title}'` : 'Unbekannte Aufgabe';

      switch (type) {
        case 'unschedulable-task':
          return `Aufgabe ${taskTitle} konnte im Zeitraum gar nicht eingeplant werden.`;
        case 'task-budget-exceeded':
          return `Aufgabe ${taskTitle} passt nicht vollständig in das verfügbare Tagesbudget.`;
        case 'deadline-at-risk':
          return `Die Deadline für Aufgabe ${taskTitle} ist gefährdet.`;
        default:
          return `${type}: ${taskTitle}`;
      }
    });
  });

  /**
   * Lädt den Plan für die aktuelle Woche (Montag bis Sonntag)
   */
  public loadCurrentWeek() {
    const { from, to } = this.getCurrentWeekRange();
    return this.loadWeek(from, to);
  }

  /**
   * Lädt den Plan für eine spezifische Woche
   */
  public loadWeek(from: string, to: string) {
    this._isLoading.set(true);

    return this.scheduleService.getSchedule(from, to)
      .pipe(
        tap(response => {
          this._scheduleEntries.set(response.entries || []);
          // Warnungen nur aktualisieren, wenn die API explizit welche zurückgibt.
          // Das verhindert, dass Warnungen aus einer vorherigen Generierung
          // durch eine leere Liste der Wochenansicht gelöscht werden.
          if (response.warnings && response.warnings.length > 0) {
            this._warnings.set(response.warnings);
          }
        }),
        finalize(() => this._isLoading.set(false))
      );
  }

  /**
   * Generiert einen neuen Plan für ein 14-Tage-Fenster ab dem aktuellen Montag
   */
  public generateSchedule() {
    const monday = this.getMonday(new Date());
    const from = monday.toISOString().split('T')[0];

    const sundayTwoWeeksLater = new Date(monday);
    sundayTwoWeeksLater.setDate(monday.getDate() + 13);
    const to = sundayTwoWeeksLater.toISOString().split('T')[0];

    const request: GenerateScheduleRequest = { from };

    this._isLoading.set(true);
    return this.scheduleService.generateSchedule(request)
      .pipe(
        tap(response => {
          // Die Generierung liefert die Warnungen für den gesamten 14-Tage-Zeitraum
          this._warnings.set(response.warnings || []);
        }),
        switchMap(() => {
          // Wir laden die Woche neu, aber wir unterdrücken das Setzen der Warnings in diesem speziellen Call,
          // damit die Warnings aus der Generierung (oben) erhalten bleiben.
          const { from, to } = this.getCurrentWeekRange();
          return this.scheduleService.getSchedule(from, to).pipe(
            tap(res => this._scheduleEntries.set(res.entries || []))
          );
        }),
        finalize(() => this._isLoading.set(false))
      );
  }

  private getCurrentWeekRange() {
    const now = new Date();
    const monday = this.getMonday(now);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
      from: monday.toISOString().split('T')[0],
      to: sunday.toISOString().split('T')[0]
    };
  }

  private getMonday(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); // 0 (Sun) to 6 (Sat)
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
  }
}
