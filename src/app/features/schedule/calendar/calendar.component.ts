import { Component, computed, effect, inject, input, OnInit, ViewChild } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import deLocale from '@fullcalendar/core/locales/de';
import { AddTaskDialog } from '../../../shared/components/add-task-dialog/add-task-dialog.component';
import { TaskService } from '../../../shared/services/task.service';
import { ScheduleEntry } from '../../../api/model/scheduleEntry';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [FullCalendarModule, AddTaskDialog],
  templateUrl: 'calendar.component.html',
  styleUrl: 'calendar.component.scss',
})
export class CalendarComponent implements OnInit {
  @ViewChild(AddTaskDialog) addTaskDialog!: AddTaskDialog;

  private taskService = inject(TaskService);

  // Input Signal für ScheduleEntries
  entries = input<ScheduleEntry[]>([]);

  // Computed Signal für FullCalendar Events
  calendarEvents = computed(() => {
    return this.entries().map((entry) => ({
      id: entry.id,
      title: entry.type === 'TASK' ? (entry.taskTitle || 'Unbenannte Aufgabe') : (entry.breakLabel || 'Pause'),
      start: `${entry.date}T${entry.startTime}`,
      end: `${entry.date}T${entry.endTime}`,
      backgroundColor: entry.type === 'TASK' ? '#63729c' : '#10b981',
      borderColor: entry.type === 'TASK' ? '#505c7c' : '#059669',
      extendedProps: { ...entry }
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
  };

  constructor() {
    // Falls FullCalendar die Events nicht reaktiv über [options] übernimmt, 
    // können wir sie hier im effect an calendarOptions zuweisen
    effect(() => {
      this.calendarOptions = {
        ...this.calendarOptions,
        events: this.calendarEvents()
      };
    });
  }

  ngOnInit(): void {
    this.taskService.loadTasksFromDB();
  }

  handleEventClick(arg: any) {
    const entry = arg.event.extendedProps as ScheduleEntry;

    if (entry.type === 'TASK' && entry.taskId) {
      // Suche den Task im TaskService, um die Details für den Dialog zu haben
      const task = this.taskService.loadedTasks().find(t => t.id === entry.taskId);
      
      if (task) {
        this.addTaskDialog.openDialog(task);
      } else {
        console.warn(`Task mit ID ${entry.taskId} nicht gefunden.`);
      }
    }
  }
}
