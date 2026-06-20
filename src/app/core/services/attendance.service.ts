import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { BaseApiService } from './api.service';
import { Attendance, ApiResponse } from '../models';
@Injectable({ providedIn: 'root' })
export class AttendanceService extends BaseApiService<Attendance> {
  protected endpoint = 'attendances';
  bulkCreate(records: Partial<Attendance>[]): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.url}/bulk`, { records });
  }
}
