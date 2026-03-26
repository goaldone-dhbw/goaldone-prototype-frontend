import { Component, computed, signal } from '@angular/core';
import { Card } from 'primeng/card';
import { DataView } from 'primeng/dataview';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Divider } from 'primeng/divider';
import { Paginator, PaginatorState } from 'primeng/paginator';

@Component({
    selector: 'app-task-view',
    imports: [Card, DataView, FormsModule, Button, Divider, Paginator],
    templateUrl: './task-view.page.html',
    styleUrl: './task-view.page.scss',
})
export class TaskViewPage {
    protected readonly title = 'Taskansicht';
    protected readonly rowsCount = signal(20);
    protected readonly first = signal(0);
    protected readonly tasks = signal<any[]>([]);
    protected readonly total = computed(() => this.tasks().length);
    protected readonly visibleTasks = computed(() => {
        const start = this.first();
        const end = start + this.rowsCount();

        return this.tasks().slice(start, end);
    });

    // TODO: replace dummy values with actual logic
    constructor() {
        let hourOffset: number;
        let dayOffset: number;
        for (let i = 0; i < 50; i++) {
            hourOffset = 1_000 * 60 * 60;
            dayOffset = hourOffset * 24 * i;
            this.tasks.update((tasks) => {
                tasks.push({
                    title: `Do something ${i}`,
                    description: `please just do it ${i}`,
                    startDate: new Date(Date.now() + dayOffset),
                    endDate: new Date(Date.now() + dayOffset + hourOffset),
                });

                return tasks;
            });
        }
    }

    protected onPageChange(event: PaginatorState): void {
        this.first.set(event.first ?? 0);
        this.rowsCount.set(event.rows ?? this.rowsCount());
    }

    protected editTask(task: any) {
        // TODO: implement editing logic
        alert('Sowwy leute, heute leider kein Bearbeiten :(');
    }

    protected deleteTask(task: any) {
        // TODO: implement deletion logic
        alert('Sowwy leute, heute leider kein Löschen :(');
    }

    protected formatDate(date: Date): string {
        return date.toLocaleDateString('de-DE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: 'numeric',
            minute: 'numeric',
        });
    }
}
