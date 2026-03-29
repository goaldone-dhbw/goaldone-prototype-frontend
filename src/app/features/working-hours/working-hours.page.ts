import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
  effect,
  ViewChild,
  OnInit,
  computed,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Card } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DatePicker } from 'primeng/datepicker';
import { Select } from 'primeng/select';
import { WorkingHoursModel } from '../../shared/models/working-hours.model';

import { WorkingHoursService } from '../../shared/services/working-hours.service';
import { BreaksService } from '../../shared/services/breaks.service';
import { DayOfWeek, BreakResponse, BreakType } from '../../api';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { AddBreakDialog } from './breaks-dialog/breaks-dialog.component';
import { InputText } from 'primeng/inputtext';

@Component({
  selector: 'app-working-hours-page',
  standalone: true,
  imports: [
    Card,
    ButtonModule,
    ReactiveFormsModule,
    FormsModule,
    DatePicker,
    Select,
    Toast,
    AddBreakDialog,
    InputText,
  ],
  styleUrl: 'working-hours.page.scss',
  templateUrl: 'working-hours.page.html',
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkingHoursPage implements OnInit {
  @ViewChild(AddBreakDialog) addBreakDialog!: AddBreakDialog;

  private readonly messageService = inject(MessageService);
  private readonly service = inject(WorkingHoursService);
  private readonly breaksService = inject(BreaksService);

  title = 'Arbeitszeiten und Pausen';
  workingHours = signal<WorkingHoursModel[]>([]);
  breaks = signal<BreakResponse[]>([]);

  // Computeds for template conditions
  hasWorkingHours = computed(() => this.workingHours().length > 0);
  hasBreaks = computed(() => this.breaks().length > 0);

  mapBreakTypes(breakType: BreakType): string {
    switch (breakType) {
      case BreakType.OneTime:
        return 'Einmalig';
      case BreakType.Recurring:
        return 'Wiederkehrend';
      case BreakType.BoundedRecurring:
        return 'Begrenzt wiederkehrend';
      default:
        return 'N/A';
    }
  }

  ngOnInit() {
    // Subscribe to break messages from the dialog component
    this.breaksService.breakMessage$.subscribe((message) => {
      this.messageService.add({
        severity: message.severity,
        summary: message.summary,
        detail: message.detail,
      });
    });

    // Subscribe to breaks refresh trigger
    this.breaksService.breaksRefresh$.subscribe(() => {
      this.loadBreaks();
    });
  }

  constructor() {
    effect(
      () => {
        this.loadWorkingHours();
        this.loadBreaks();
      },
      { allowSignalWrites: true },
    );
  }

  private loadWorkingHours() {
    this.service.loadWorkingHours().subscribe({
      next: (hours) => {
        this.workingHours.set(hours);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.messageService.add({
            severity: 'info',
            summary: 'Hinweis',
            detail: 'Bitte lege deine Arbeitszeiten fest.',
          });
          this.workingHours.set([]);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Fehler',
            detail: 'Arbeitszeiten konnten nicht geladen werden.',
          });
        }
      },
    });
  }

  capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  days = Object.values(DayOfWeek).map((dayOfWeek) => ({
    label: this.capitalize(dayOfWeek),
    value: dayOfWeek,
  }));

  addWorkingHours() {
    this.workingHours.update((hours) => [
      ...hours,
      {
        startDay: null,
        endDay: null,
        startHour: null,
        endHour: null,
      } as WorkingHoursModel,
    ]);
  }

  removeWorkingHour(index: number) {
    this.workingHours.update((hours) => hours.filter((_, i) => i !== index));
  }

  saveWorkingHours() {
    if (this.validateWorkingHours()) {
      this.service.saveWorkingHours(this.workingHours()).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Erfolg',
            detail: 'Arbeitszeiten wurden gespeichert.',
          });
        },
        error: (err: HttpErrorResponse) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Fehler',
            detail: 'Arbeitszeiten konnten nicht gespeichert werden.',
          });
          this.loadWorkingHours();
        },
      });
    }
  }

  private validateWorkingHours(): boolean {
    let isValid = true;
    const coveredDays = new Set<number>();
    const daysOfWeek = Object.values(DayOfWeek);

    for (let i = 0; i < this.workingHours().length; i++) {
      const entry = this.workingHours()[i];

      // Check missing entries
      if (!entry.startDay || !entry.endDay || !entry.startHour || !entry.endHour) {
        this.messageService.add({
          severity: 'error',
          summary: 'Fehlerhafte Eingabe',
          detail: `Bitte fülle alle Felder in Zeile ${i + 1} aus.`,
        });
        isValid = false;
        continue;
      }

      // Check order of time
      const startTime = entry.startHour.getHours() * 60 + entry.startHour.getMinutes();
      const endTime = entry.endHour.getHours() * 60 + entry.endHour.getMinutes();

      if (startTime >= endTime) {
        this.messageService.add({
          severity: 'error',
          summary: 'Ungültige Zeit',
          detail: `In Zeile ${i + 1} muss die Endzeit nach der Startzeit liegen.`,
        });
        isValid = false;
      }

      // Check order of days
      const startIndex = daysOfWeek.indexOf(entry.startDay);
      const endIndex = daysOfWeek.indexOf(entry.endDay);

      if (startIndex > endIndex) {
        this.messageService.add({
          severity: 'error',
          summary: 'Ungültige Tage',
          detail: `In Zeile ${i + 1} muss der Starttag vor oder am selben Tag wie der Endtag liegen.`,
        });
        isValid = false;
        continue;
      }

      let currentDay = startIndex;
      while (true) {
        if (coveredDays.has(currentDay)) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Doppelte Belegung',
            detail: `Der Tag ${daysOfWeek[currentDay]} ist mehrfach belegt. Ein Tag darf nur in einem Zeitraum vorkommen.`,
          });
          isValid = false;
        }
        coveredDays.add(currentDay);

        if (currentDay === endIndex) break;
        currentDay = (currentDay + 1) % 7;
      }
    }
    return isValid;
  }

  addBreak() {
    this.addBreakDialog.openDialog(null);
  }

  private loadBreaks() {
    this.breaksService.loadBreaksFromDB().subscribe({
      next: (breaks) => {
        this.breaks.set(breaks);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.breaks.set([]);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Fehler',
            detail: 'Pausen konnten nicht geladen werden.',
          });
        }
      },
    });
  }

  deleteBreak(breakId: string) {
    this.breaksService.deleteBreak(breakId).subscribe({
      next: () => {
        this.breaks.update((breaks) => breaks.filter((b) => b.id !== breakId));
        this.messageService.add({
          severity: 'success',
          summary: 'Erfolg',
          detail: 'Pause wurde gelöscht.',
        });
      },
      error: (err: HttpErrorResponse) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Fehler',
          detail: 'Pause konnte nicht gelöscht werden.',
        });
      },
    });
  }

  protected editBreak(breakModel: BreakResponse) {
    this.addBreakDialog.openDialog(breakModel);
  }
}
