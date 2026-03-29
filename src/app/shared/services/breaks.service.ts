import { Injectable } from '@angular/core';
import { BreakResponse, CreateBreakRequest } from '../../api';
import { Observable, Subject } from 'rxjs';
import { BreaksService as ApiBreaksService } from '../../api/api/breaks.service';

export interface BreakMessage {
  severity: 'success' | 'error' | 'info' | 'warn';
  summary: string;
  detail: string;
}

@Injectable({
  providedIn: 'root',
})
export class BreaksService {
  private breakMessageSubject = new Subject<BreakMessage>();
  public breakMessage$ = this.breakMessageSubject.asObservable();

  private breaksRefreshSubject = new Subject<void>();
  public breaksRefresh$ = this.breaksRefreshSubject.asObservable();

  constructor(private apiBreaksService: ApiBreaksService) {}

  saveBreaksToDB() {}

  createBreak(request: CreateBreakRequest): Observable<BreakResponse> {
    return this.apiBreaksService.createBreak(request);
  }

  loadBreaksFromDB(): Observable<BreakResponse[]> {
    return this.apiBreaksService.listBreaks();
  }

  deleteBreak(breakId: string): Observable<void> {
    return this.apiBreaksService.deleteBreak(breakId);
  }

  emitMessage(message: BreakMessage) {
    this.breakMessageSubject.next(message);
  }

  triggerBreaksRefresh() {
    this.breaksRefreshSubject.next();
  }

  updateBreak(request: CreateBreakRequest, breakId: string): Observable<BreakResponse> {
    return this.apiBreaksService.updateBreak(breakId, request);
  }
}
