import { Component, computed, inject, input, OnInit, output, signal, ViewChild } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import deLocale from '@fullcalendar/core/locales/de';
import { TaskService } from '../../../shared/services/task.service';
import { RecurringTemplateService } from '../../../shared/services/recurring-template.service';
import { ScheduleEntry } from '../../../api';
import { AddTaskDialogComponent } from '../../../shared/components/add-task-dialog/add-task-dialog.component';
import { TaskState } from '../../../shared/models/task-state.model';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [FullCalendarModule, AddTaskDialogComponent],
  templateUrl: 'calendar.component.html',
  styleUrl: 'calendar.component.scss',
})
export class CalendarComponent implements OnInit {
  @ViewChild(AddTaskDialogComponent) addTaskDialog!: AddTaskDialogComponent;

  private taskService = inject(TaskService);
  private recurringTemplateService = inject(RecurringTemplateService);
  private lastEmittedRange = signal<{ from: string; to: string } | null>(null);

  // Input Signal für ScheduleEntries
  entries = input<ScheduleEntry[]>([]);

  // Output events
  weekChanged = output<{ from: string; to: string }>();
  saved = output<{ from: string; to: string }>();

  // Lookup: taskId → TaskState für Farbbestimmung
  private taskStatusMap = computed(() => {
    const map = new Map<string, TaskState>();
    for (const task of this.taskService.loadedTasks()) {
      if (task.id) map.set(task.id, task.status);
    }
    return map;
  });

  // Computed Signal für FullCalendar Events
  calendarEvents = computed(() => {
    const statusMap = this.taskStatusMap();
    return this.entries().map((entry) => {
      const colors = this.getEntryColors(entry, statusMap);
      return {
        id: entry.source === 'ONE_TIME' ? (entry.entryId ?? undefined) : `${entry.templateId}-${entry.occurrenceDate}`,
        title:
          entry.type === 'TASK'
            ? entry.taskTitle || entry.templateTitle || 'Unbenannte Aufgabe'
            : entry.breakLabel || 'Pause',
        start: `${entry.date}T${entry.startTime}`,
        end: `${entry.date}T${entry.endTime}`,
        backgroundColor: colors.bg,
        borderColor: colors.border,
        extendedProps: { ...entry },
      };
    });
  });

  calendarOptions: any = {
    // Format
    locale: deLocale,
    contentHeight: 'auto',
    slotMinTime: '06:00:00',
    slotMaxTime: '21:00:00',
    allDaySlot: false,

    // Design
    initialView: 'timeGridWeek',
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    headerToolbar: {
      left: 'prev,today,next',
      center: 'title',
      right: 'timeGridWeek,timeGridDay',
    },

    // Methods
    eventClick: (arg: any) => this.handleEventClick(arg),
    datesSet: (arg: any) => this.handleDatesSet(arg),
  };

  ngOnInit(): void {
    this.taskService.loadTasksFromDB();
    this.recurringTemplateService.loadTemplatesFromDB();
  }

  onDialogSaved() {
    this.taskService.loadTasksFromDB();
    this.recurringTemplateService.loadTemplatesFromDB();
    const range = this.lastEmittedRange();
    if (range) {
      this.saved.emit(range);
    }
  }

  handleEventClick(arg: any) {
    const entry = arg.event.extendedProps as ScheduleEntry;

    if (entry.type === 'TASK') {
      if (entry.taskId) {
        const task = this.taskService.loadedTasks().find((t) => t.id === entry.taskId);
        if (task) {
          this.addTaskDialog.openDialog(task);
          return;
        }
      }

      if (entry.templateId) {
        const template = this.recurringTemplateService.loadedTemplates().find((t) => t.id === entry.templateId);
        if (template) {
          this.addTaskDialog.openDialog(template);
          return;
        }
      }

      console.warn(`Weder Task noch Template für ID ${entry.taskId || entry.templateId} gefunden.`);
    }
  }

  handleDatesSet(arg: any) {
    const from = this.formatDateString(arg.startStr);
    const to = this.formatDateString(arg.endStr);
    const currentRange = { from, to };
    const lastRange = this.lastEmittedRange();

    if (!lastRange || lastRange.from !== from || lastRange.to !== to) {
      this.lastEmittedRange.set(currentRange);
      this.weekChanged.emit(currentRange);
    }
  }

  private getEntryColors(entry: ScheduleEntry, statusMap: Map<string, TaskState>): { bg: string; border: string } {
    if (entry.type === 'BREAK') {
      return { bg: '#10b981', border: '#059669' };
    }

    // Schedule-Entry-Level Flags (via /schedule/{id}/complete bzw. recurring exceptions)
    if (entry.isCompleted) {
      return { bg: '#22c55e', border: '#16a34a' };
    }
    if (entry.isPinned) {
      return { bg: '#f59e0b', border: '#d97706' };
    }

    // Task-Status aus loadedTasks (via /tasks/{id}/complete — Backlog-Ansicht)
    if (entry.taskId) {
      const status = statusMap.get(entry.taskId);
      if (status === TaskState.DONE) {
        return { bg: '#22c55e', border: '#16a34a' };
      }
      if (status === TaskState.IN_PROGRESS) {
        return { bg: '#3b82f6', border: '#2563eb' };
      }
    }

    return { bg: '#63729c', border: '#505c7c' };
  }

  private formatDateString(dateString: string): string {
    return dateString.split('T')[0];
  }
}
