import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import deLocale from '@fullcalendar/core/locales/de';
import { AddTaskDialog } from '../../../shared/components/add-task-dialog/add-task-dialog.component';
import { TaskService } from '../../../shared/services/task.service';
import { CalendarEvent } from '../../../shared/models/calendarevent.model';
import { DatePointApi } from '@fullcalendar/core';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [FullCalendarModule],
  templateUrl: 'calendar.component.html',
  styleUrl: 'calendar.component.scss',
})
export class CalendarComponent implements OnInit {
  @ViewChild(AddTaskDialog) addTaskDialog!: AddTaskDialog;

  private taskService = inject(TaskService);

  protected taskArray = this.taskService.loadedTasks;

  protected eventsArray: CalendarEvent[] =
    this.taskArray().map((task) => ({
      title: task.title,
      start: task.startDate!,
      end: task.endDate!,
    }));

  calendarOptions = {
    // Format
    locale: deLocale,
    contentHeight: 'auto',
    slotMinTime: '06:00:00',
    slotMaxTime: '21:00:00',

    // Design
    initialView: 'timeGridWeek',
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    headerToolbar: {
      left: 'prev,today,next',
      center: 'title',
      right: 'timeGridWeek,timeGridDay',
    },
    events: this.eventsArray,

    // Methods
    eventClick: (arg: any) => this.handleEventClick(arg),
    dateClick: (arg: any) => this.handleDateClick(arg),
  };

  ngOnInit(): void {
    this.taskService.loadTasksFromDB();
  }

  handleEventClick(clickedEvent: any) {
    const taskFromEvent = this.taskArray().find((task) =>
        task.title === clickedEvent.title &&
        task.startDate === clickedEvent.start &&
        task.endDate === clickedEvent.end,
    );

    if (!taskFromEvent) {
      console.error(`Event: ${clickedEvent}\nTasks: ${this.taskArray()}`);
      alert('Es ist ein Fehler aufgetreten');
      return;
    }

    this.addTaskDialog.openDialog(taskFromEvent);
  }

  handleDateClick(clickedDate: DatePointApi) {
    const date = clickedDate.date;

    const taskFromDate = this.taskArray().find((task) => {
      if (!task.startDate || !task.endDate) {
        console.error("Date:", date);
        return false;
      }

      return task.startDate <= date && task.endDate >= date;
    });

    if (!taskFromDate) {
      console.error(`Date: ${clickedDate}\nTasks: ${this.taskArray()}`);
      alert('Es ist ein Fehler aufgetreten');
      return;
    }

    this.addTaskDialog.openDialog(taskFromDate);
  }
}
