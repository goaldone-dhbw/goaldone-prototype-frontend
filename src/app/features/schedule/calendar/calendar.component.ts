import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import deLocale from '@fullcalendar/core/locales/de';
import { AddTaskDialog } from '../../../shared/components/add-task-dialog/add-task-dialog.component';
import { TaskService } from '../../../shared/services/task.service';

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

  protected eventsArray: { title: string; start: string | Date; end: string | Date }[] =
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
    dateClick: (arg: any) => this.handleDateClick(arg),
    eventClick: (arg: any) => this.handleEventClick(arg),
  };

  ngOnInit(): void {
    this.taskService.loadTasksFromDB();
  }

  handleEventClick(arg: any) {
    // Somehow get Task from Event

    this.addTaskDialog.openDialog(this.taskArray()[0]); // Example task
  }

  handleDateClick(arg: any) {
    datum: String = arg.dateStr;

    // event <- AddTaskDialog()
    //
  }
}
