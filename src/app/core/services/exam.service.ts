import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BaseApiService } from './api.service';
import { ApiResponse, Exam, ExamRoutineRow, ExamSubject } from '../models';

@Injectable({ providedIn: 'root' })
export class ExamService extends BaseApiService<Exam> {
  protected endpoint = 'exams';
}

@Injectable({ providedIn: 'root' })
export class ExamSubjectService extends BaseApiService<ExamSubject> {
  protected endpoint = 'examsubjects';

  /** Full routine for one exam — Class/Subject names already joined in, ordered by class then time. */
  getRoutine(examId: number): Observable<ExamRoutineRow[]> {
    return this.http
      .get<ApiResponse<ExamRoutineRow[]>>(`${this.url}/routine/${examId}`)
      .pipe(map(r => r.data ?? []));
  }

  /** Downloads the printable exam routine PDF as a blob (open in a new tab / save). */
  downloadRoutinePdf(examId: number): Observable<Blob> {
    return this.http.get(`${this.url}/routine/${examId}/pdf`, { responseType: 'blob' });
  }
}
