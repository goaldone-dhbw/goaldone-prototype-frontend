import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskViewPage } from './task-view.page';

describe('TaskViewPage', () => {
    let component: TaskViewPage;
    let fixture: ComponentFixture<TaskViewPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TaskViewPage],
        }).compileComponents();

        fixture = TestBed.createComponent(TaskViewPage);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
