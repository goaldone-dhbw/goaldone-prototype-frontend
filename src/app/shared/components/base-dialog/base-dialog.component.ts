import { Component, EventEmitter, Input, Output, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';

type ButtonSeverity = 'success' | 'info' | 'warn' | 'danger' | 'help' | 'primary' | 'secondary' | 'contrast' | null | undefined;

@Component({
  selector: 'app-base-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, ButtonModule, MessageModule],
  templateUrl: './base-dialog.component.html',
  styleUrl: './base-dialog.component.scss'
})
export class BaseDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  header = input<string>('');
  styleClass = input<string>('');
  cancelLabel = input<string>('Abbrechen');
  actionLabel = input<string>('Bestätigen');
  actionSeverity = input<string>('primary');
  actionIcon = input<string>('');
  
  actionDisabled = input<boolean>(false);
  loading = input<boolean>(false);
  errorMessage = input<string | null>(null);

  @Output() confirm = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  // Map 'primary' to undefined because PrimeNG uses it as default when severity is not set
  // Other values like 'danger', 'success' etc. are passed through
  computedSeverity = computed(() => {
    const s = this.actionSeverity();
    if (s === 'primary') return undefined;
    return s as any; // Cast to any here to satisfy the compiler, as we know these are valid ButtonSeverity strings
  });

  onClose() {
    if (this.loading()) return;
    this.visibleChange.emit(false);
    this.close.emit();
  }

  onConfirm() {
    this.confirm.emit();
  }
}
