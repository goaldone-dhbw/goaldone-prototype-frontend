import { Component, inject, signal, ChangeDetectionStrategy, effect } from '@angular/core';
import { Card } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DatePicker } from 'primeng/datepicker';
import { Select } from 'primeng/select';
import { WorkingHoursModel } from '../../shared/models/working-hours.model';

import { WorkingHoursService } from '../../shared/services/working-hours.service';
import { DayOfWeek } from '../../api';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';


@Component({
  selector: 'app-working-hours-page',
  standalone: true,
  imports: [Card, ButtonModule, ReactiveFormsModule, FormsModule, DatePicker, Select, Toast],
  styleUrl: 'working-hours.page.scss',
  templateUrl: 'working-hours.page.html',
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkingHoursPage {
  private readonly messageService = inject(MessageService);
  private readonly service = inject(WorkingHoursService);

  title = 'Arbeitszeiten und Pausen';
  workingHours = signal<WorkingHoursModel[]>([]);

  constructor() {
    effect(() => {
      this.loadWorkingHours();
    }, { allowSignalWrites: true });
  }

  private loadWorkingHours() {
    this.service.loadWorkingHours().subscribe({
      next: (hours) => {
        this.workingHours.set(hours);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Fehler',
          detail: 'Arbeitszeiten konnten nicht geladen werden.',
        });
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

  // ...existing code...

  saveWorkingHours() {
    if (this.validate()) {
      this.service.saveWorkingHours(this.workingHours());
      this.messageService.add({ severity: 'success', summary: 'Erfolg', detail: 'Arbeitszeiten wurden gespeichert.' });
    }
  }

  private validate(): boolean {
    let isValid = true;
    const coveredDays = new Set<number>();
    const daysOfWeek = Object.values(DayOfWeek);

    for (let i = 0; i < this.workingHours().length; i++) {
      const entry = this.workingHours()[i];

      // 1. Prüfen auf fehlende Eingaben
      if (!entry.startDay || !entry.endDay || !entry.startHour || !entry.endHour) {
        this.messageService.add({
          severity: 'error',
          summary: 'Fehlerhafte Eingabe',
          detail: `Bitte fülle alle Felder in Zeile ${i + 1} aus.`,
        });
        isValid = false;
        continue;
      }

      // 2. Prüfen, ob Startzeit vor Endzeit liegt
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

      // 3. Prüfen auf Dopplungen von Tagen
      const startIndex = daysOfWeek.indexOf(entry.startDay);
      const endIndex = daysOfWeek.indexOf(entry.endDay);

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
        currentDay = (currentDay + 1) % 7; // Wraparound am Wochenende (Sonntag zu Montag)
      }
    }

    return isValid;
  }
}
