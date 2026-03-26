import { Component, ViewChild } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import deLocale from '@fullcalendar/core/locales/de';
import AddTaskDialog from '../../../shared/components/add-task-dialog/add-task-dialog.component';
import { TaskModel } from '../../../shared/models/task.model';
import { TaskState } from '../../../shared/models/task-state.model';
import { TaskDifficultyModel } from '../../../shared/models/task-difficulty.model';


@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [FullCalendarModule],
  templateUrl: 'calendar.component.html',
  styleUrl: 'calendar.component.scss',
})
export class CalendarComponent {
  @ViewChild(AddTaskDialog) addTaskDialog!: AddTaskDialog;

  protected taskArray: TaskModel[] = [
    {
      title: 'Meeting',
      status: TaskState.OPEN,
      deadline: new Date('2026-03-30'),
      estimatedTime: 120,
      difficulty: TaskDifficultyModel.Moderate,
      trackedTime: 0,
      startDate: new Date('2026-03-23T10:00:00'),
      endDate: new Date('2026-03-23T12:00:00'),
      description: 'Description for Meeting',
      scheduleTask: true,
      chunks: ['00:00'],
    },
    {
      title: 'Meeting',
      status: TaskState.OPEN,
      deadline: new Date('2026-03-30'),
      difficulty: TaskDifficultyModel.Moderate,
      estimatedTime: 120,
      trackedTime: 0,
      startDate: new Date('2026-03-26T12:00:00'),
      endDate: new Date('2026-03-26T15:00:00'),
      description: 'Description for Task Meeting',
      scheduleTask: true,
      chunks: ['00:00'],
    },
    {
      title: 'Lunch',
      status: TaskState.OPEN,
      deadline: new Date('2026-03-31'),
      difficulty: TaskDifficultyModel.Easy,
      estimatedTime: 120,
      trackedTime: 0,
      startDate: new Date('2026-03-25T11:00:00'),
      endDate: new Date('2026-03-25T13:00:00'),
      description: 'Description for Task Lunch',
      scheduleTask: true,
      chunks: ['00:00'],
    },
  ];

  protected eventsArray: { title: string; start: string | Date; end: string | Date }[] =
    this.taskArray.map((task) => ({
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

  handleEventClick(arg: any) {
    // Somehow get Task from Event

    this.addTaskDialog.openDialog(this.taskArray[0]); // Example task
  }

  handleDateClick(arg: any) {
    datum: String = arg.dateStr;

    // event <- AddTaskDialog()
    //
  }
}
