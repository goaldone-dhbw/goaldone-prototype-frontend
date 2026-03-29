import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageModule } from 'primeng/message';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageService } from 'primeng/api';

import { BreakResponse, BreakType, RecurrenceType } from '../../../api';
import { CreateBreakRequest } from '../../../api';
import { BreaksService } from '../../../shared/services/breaks.service';
import { BreaksModel } from '../../../shared/models/breaks.model';


@Component({
  selector: 'app-add-break-dialog',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    FormsModule,
    SelectModule,
    InputNumberModule,
    FloatLabelModule,
    DatePickerModule,
    CheckboxModule,
    MessageModule,
    ToggleSwitchModule,
  ],
  templateUrl: './breaks-dialog.component.html',
  styleUrls: ['./breaks-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MessageService],
})
export class AddBreakDialog {
  private readonly breaksService = inject(BreaksService);


  title = 'Pause hinzufügen';

  protected showDialog = signal(false);
  protected isLoading = signal(false);
  protected errorMessage = signal<string | undefined>(undefined);

  // Form model based on BreaksModel
  protected breakForm = signal<BreaksModel>({
    label: '',
    startTime: '',
    endTime: '',
    breakType: BreakType.OneTime,
    recurrence: {
      type: RecurrenceType.Daily,
      interval: 1,
    },
    date: null,
    validFrom: null,
    validUntil: null,
  });

  // Enum options for dropdowns
  protected breakTypeOptions = [
    { label: 'Einmalig', value: BreakType.OneTime },
    { label: 'Wiederkehrend', value: BreakType.Recurring },
    { label: 'Begrenzt wiederkehrend', value: BreakType.BoundedRecurring },
  ];

  protected recurrenceTypeOptions = [
    { label: 'Täglich', value: RecurrenceType.Daily },
    { label: 'Wöchentlich', value: RecurrenceType.Weekly },
    { label: 'Monatlich', value: RecurrenceType.Monthly },
  ];

  protected readonly BreakType = BreakType;
  protected readonly RecurrenceType = RecurrenceType;
  private breakId: string = "";


  openDialog(data: BreakResponse | null) {
    this.initializeForm(data);
    this.showDialog.set(true);
  }

  createBreak() {
    const request = this.buildRequest();
    this.breaksService.createBreak(request).subscribe({
      next: () => {
        this.breaksService.emitMessage({
          severity: 'success',
          summary: 'Erfolg',
          detail: 'Pause wurde erstellt.',
        });
        // Trigger reload of breaks
        this.breaksService.triggerBreaksRefresh();
        this.showDialog.set(false);
        this.resetForm();
      },
      error: () => {
        this.breaksService.emitMessage({
          severity: 'error',
          summary: 'Fehler',
          detail: 'Pause konnte nicht erstellt werden.',
        });
      },
      complete: () => {
        this.isLoading.set(false);
      },
    });
  }

  updateBreak(): void {
    const request = this.buildRequest();
    this.breaksService.updateBreak(request, this.breakId).subscribe({
      next: () => {
        this.breaksService.emitMessage({
          severity: 'success',
          summary: 'Erfolg',
          detail: 'Pause wurde aktualisiert.',
        });
        // Trigger reload of breaks
        this.breaksService.triggerBreaksRefresh();
        this.showDialog.set(false);
        this.resetForm();
      },
      error: () => {
        this.breaksService.emitMessage({
          severity: 'error',
          summary: 'Fehler',
          detail: 'Pause konnte nicht aktualisiert werden.',
        });
      },
      complete: () => {
        this.isLoading.set(false);
      },
    });
  }


  onSubmit() {
    if (!this.validate()) {
      return;
    }

    this.isLoading.set(true);

    if (this.breakId) {
      this.updateBreak();
    } else {
      this.createBreak();
    }
  }

  private validate(): boolean {
    const model = this.breakForm();

    // Required fields
    if (!model.label.trim()) {
      this.errorMessage.set('Pausenbezeichnung ist erforderlich.');
      return false;
    }

    if (!model.startTime) {
      this.errorMessage.set('Startzeit ist erforderlich.');
      return false;
    }

    if (!model.endTime) {
      this.errorMessage.set('Endzeit ist erforderlich.');
      return false;
    }

    // Validate time format and order
    if (!this.isValidTimeFormat(model.startTime)) {
      this.errorMessage.set('Startzeit muss im Format HH:mm sein.');
      return false;
    }

    if (!this.isValidTimeFormat(model.endTime)) {
      this.errorMessage.set('Endzeit muss im Format HH:mm sein.');
      return false;
    }

    if (model.startTime >= model.endTime) {
      this.errorMessage.set('Endzeit muss nach der Startzeit liegen.');
      return false;
    }

    // ONE_TIME specific validation
    if (model.breakType === BreakType.OneTime) {
      if (!model.date) {
        this.errorMessage.set('Datum ist erforderlich für einmalige Pausen.');
        return false;
      }
    }

    if (
      model.breakType === BreakType.Recurring ||
      model.breakType === BreakType.BoundedRecurring
    ) {
      if (model.recurrence.interval < 1) {
        this.errorMessage.set('Wiederholungsintervall muss mindestens 1 sein.');
        return false;
      }
    }

    if (model.breakType === BreakType.BoundedRecurring) {
      if (!model.validFrom) {
        this.errorMessage.set('Startdatum ist erforderlich für begrenzt wiederkehrende Pausen.');
        return false;
      }
      if (!model.validUntil) {
        this.errorMessage.set('Enddatum ist erforderlich für begrenzt wiederkehrende Pausen.');
        return false;
      }
      if (model.validFrom > model.validUntil) {
        this.errorMessage.set('Enddatum muss nach dem Startdatum liegen.');
        return false;
      }
    }

    this.errorMessage.set(undefined);
    return true;
  }

  private isValidTimeFormat(time: string): boolean {
    console.log(`Validating time format for: ${time}`);

    const regex = /^([01]\d|2[0-3]):[0-5]\d$/;
    return regex.test(time);
  }

  private buildRequest(): CreateBreakRequest {
    const model = this.breakForm();

    const request: CreateBreakRequest = {
      label: model.label,
      startTime: model.startTime,
      endTime: model.endTime,
      breakType: model.breakType,
    };

    if (model.breakType === BreakType.OneTime) {
      request.date = this.dateToString(model.date);
    } else if (
      model.breakType === BreakType.Recurring ||
      model.breakType === BreakType.BoundedRecurring
    ) {
      request.recurrence = {
        type: model.recurrence.type,
        interval: model.recurrence.interval,
      };
    }

    if (model.breakType === BreakType.BoundedRecurring) {
      request.validFrom = this.dateToString(model.validFrom);
      request.validUntil = this.dateToString(model.validUntil);
    }

    return request;
  }

  private dateToString(date: Date | null): string | null {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  updateForm(field: string, value: any) {
    const current = this.breakForm();

    // nested fields (recurrence.*)
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      const parentValue = current[parent as keyof typeof current];

      // Type-safe handling for nested objects
      if (parent === 'recurrence' && parentValue && typeof parentValue === 'object') {
        this.breakForm.set({
          ...current,
          recurrence: {
            ...(parentValue as typeof current.recurrence),
            [child]: value,
          },
        });
      }
      return;
    }

    if (field === 'breakType') {
      const updated = { ...current, breakType: value };

      if (value === BreakType.OneTime) {
        updated.validFrom = null;
        updated.validUntil = null;
      }

      if (value === BreakType.Recurring) {
        updated.date = null;
        updated.validFrom = null;
        updated.validUntil = null;
      }

      if (value === BreakType.BoundedRecurring) {
        updated.date = null;
      }

      this.breakForm.set(updated);
      return;
    }

    this.breakForm.set({
      ...current,
      [field]: value,
    });
  }

  private resetForm() {
    this.breakId = "";

    this.breakForm.set({
      label: '',
      startTime: '09:00',
      endTime: '10:00',
      breakType: BreakType.OneTime,
      recurrence: {
        type: RecurrenceType.Daily,
        interval: 1,
      },
      date: null,
      validFrom: null,
      validUntil: null,
    });
    this.errorMessage.set(undefined);
  }

  private initializeForm(data: BreakResponse | null) {
    if (!data) {
      this.resetForm();
    }
    else {
      this.breakId = data.id
      this.breakForm.set({
        label: data.label,
        startTime: data.startTime,
        endTime: data.endTime,
        breakType: data.breakType,
        recurrence: {
          type: data.recurrence?.type || RecurrenceType.Daily,
          interval: data.recurrence?.interval || 1,
        },
        date: data.date ? new Date(data.date) : null,
        validFrom: data.validFrom ? new Date(data.validFrom) : null,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
      });
    }
  }
}
