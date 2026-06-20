import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './api.service';
import { Mark, ApiResponse } from '../models';
@Injectable({ providedIn: 'root' })
export class MarkService extends BaseApiService<Mark> {
  protected endpoint = 'marks';
  bulkCreate(records: Partial<Mark>[]): Observable<ApiResponse<Mark[]>> {
    return this.http.post<ApiResponse<Mark[]>>(this.url, records);
  }
}
