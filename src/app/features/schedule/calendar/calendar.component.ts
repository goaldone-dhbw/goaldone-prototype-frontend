import { Component, computed, effect, inject, input, OnInit, output, signal, ViewChild } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import deLocale from '@fullcalendar/core/locales/de';
import { TaskService } from '../../../shared/services/task.service';
import { RecurringTemplateService } from '../../../shared/services/recurring-template.service';
import { ScheduleEntry } from '../../../api';
import { AddTaskDialogComponent } from '../../../shared/components/add-task-dialog/add-task-dialog.component';

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

  // Output event when week changes
  weekChanged = output<{ from: string; to: string }>();

  // Computed Signal für FullCalendar Events
  calendarEvents = computed(() => {
    return this.entries().map((entry) => ({
      id: entry.source === 'ONE_TIME' ? entry.entryId : `${entry.templateId}-${entry.occurrenceDate}`,
      title:
        entry.type === 'TASK'
          ? entry.taskTitle || entry.templateTitle || 'Unbenannte Aufgabe'
          : entry.breakLabel || 'Pause',
      start: `${entry.date}T${entry.startTime}`,
      end: `${entry.date}T${entry.endTime}`,
      backgroundColor: entry.type === 'TASK' ? '#63729c' : '#10b981',
      borderColor: entry.type === 'TASK' ? '#505c7c' : '#059669',
      extendedProps: { ...entry },
    }));
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

    // Wir nutzen ein Effect oder binden direkt an [events] im HTML
    // Hier setzen wir es initial leer, und im HTML binden wir es dynamisch
    events: [],

    // Methods
    eventClick: (arg: any) => this.handleEventClick(arg),
    datesSet: (arg: any) => this.handleDatesSet(arg),
  };

  constructor() {
    // Falls FullCalendar die Events nicht reaktiv über [options] übernimmt,
    // können wir sie hier im effect an calendarOptions zuweisen
    effect(() => {
      this.calendarOptions = {
        ...this.calendarOptions,
        events: this.calendarEvents(),
      };
    });
  }

  ngOnInit(): void {
    this.taskService.loadTasksFromDB();
    this.recurringTemplateService.loadTemplatesFromDB();
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
    // Get the start and end dates of the current view
    // Extract just the date part (YYYY-MM-DD) to ensure consistent format for the backend
    const from = this.formatDateString(arg.startStr);
    const to = this.formatDateString(arg.endStr);
    const currentRange = { from, to };
    const lastRange = this.lastEmittedRange();

    // Only emit if the range has actually changed (prevent duplicate API calls)
    if (!lastRange || lastRange.from !== from || lastRange.to !== to) {
      this.lastEmittedRange.set(currentRange);
      this.weekChanged.emit(currentRange);
    }
  }

  private formatDateString(dateString: string): string {
    // Extract just the date part (YYYY-MM-DD) from any date format
    // Handles both "2026-03-30" and "2026-03-30T00:00:00+02:00"
    return dateString.split('T')[0];
  }
}
