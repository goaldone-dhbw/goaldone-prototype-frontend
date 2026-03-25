import {Component} from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid'
import deLocale from '@fullcalendar/core/locales/de';


@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [FullCalendarModule],
  templateUrl: 'calendar.component.html',
  styleUrl: 'calendar.component.scss'
})
export class CalendarComponent {
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
      right: 'timeGridWeek,timeGridDay'
    },

    // Events
    events: [
      { title: 'Meeting', start: '2026-03-23T10:00:00', end: '2026-03-23T12:00:00' },
      { title: 'Meeting', start: '2026-03-24T14:00:00', end: '2026-03-24T15:00:00' },
      { title: 'Meeting', start: '2026-03-27T09:00:00', end: '2026-03-27T12:00:00' }
    ],

    // Methods
    dateClick: (arg: any) => this.handleDateClick(arg),
  };

  handleDateClick(arg: any) {
    alert('date click! ' + arg.dateStr); // add Event to Calendar
  }
}
