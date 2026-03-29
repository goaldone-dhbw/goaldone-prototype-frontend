import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { AddTaskDialogComponent } from '../../shared/components/add-task-dialog/add-task-dialog.component';

@Component({
    selector: 'app-mainpage',
    standalone: true,
    imports: [CommonModule, CardModule, ButtonModule, AddTaskDialogComponent],
    templateUrl: './mainpage.html',
    styleUrls: ['./mainpage.scss'],
})
export class MainpageComponent {
    @ViewChild('taskDialog') taskDialog!: AddTaskDialogComponent;

    openDialog() {
        this.taskDialog.openDialog(null);
    }

    tasks = [
        {
            title: 'Projektmeeting vorbereiten',
            startDate: '25.03.2026',
            duration: 60,
            description:
                'Agenda erstellen, Präsentation vorbereiten und relevante Dokumente zusammentragen.',
        },
        {
            title: 'Code Review durchführen',
            startDate: '24.03.2026',
            duration: 45,
            description:
                'Pull Requests prüfen, Feedback geben und mögliche Verbesserungen vorschlagen.',
        },
        {
            title: 'Dokumentation aktualisieren',
            startDate: '23.03.2026',
            duration: 30,
            description: 'Neue Features dokumentieren und bestehende Inhalte überarbeiten.',
        },
        {
            title: 'Bugfixing Login-Modul',
            startDate: '22.03.2026',
            duration: 50,
            description: 'Fehleranalyse im Login-Prozess und Implementierung eines Fixes.',
        },
        {
            title: 'Sprint Planung',
            startDate: '21.03.2026',
            duration: 90,
            description: 'Aufgaben für den nächsten Sprint definieren und priorisieren.',
        },
        {
            title: 'UI Verbesserungen',
            startDate: '20.03.2026',
            duration: 40,
            description: 'Kleine Anpassungen im Design zur besseren Benutzerfreundlichkeit.',
        },
    ];

    completedTasks = 3;
    totalTasks = 6;

    workedMinutes = 180;
    totalMinutes = 315;

    nextTask = this.tasks[0];
}

