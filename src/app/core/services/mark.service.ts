import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './api.service';
import { Mark, ApiResponse } from '../models';
@Injectable({ providedIn: 'root' })
export class MarkService extends BaseApiService<Mark> {
  protected endpoint = 'marks';
  bulkCreate(records: Partial<Mark>[]): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.url}/bulk`, { records });
  }
  getMarksheet(studentId: number, examId: number): Observable<Blob> {
    return this.http.get(
      `${this.url}/marksheet?studentId=${studentId}&examId=${examId}`,
      { responseType: 'blob' }
    );
  }
}
