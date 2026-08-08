import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseApiService } from './api.service';
import { ApiResponse, Teacher, TeacherSubjectAssignment } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TeacherService extends BaseApiService<Teacher> {
  protected endpoint = 'teachers';
  private http2 = inject(HttpClient);

  getNextEmployeeNo(): Observable<string> {
    return this.http2.get<any>(`${environment.apiUrl}/teachers/next-employee-no`).pipe(
      map(r => r?.data ?? r)
    );
  }

  createMultipart(fd: FormData): Observable<ApiResponse<Teacher>> {
    return this.http2.post<ApiResponse<Teacher>>(`${environment.apiUrl}/teachers`, fd);
  }

  updateMultipart(id: number, fd: FormData): Observable<ApiResponse<Teacher>> {
    return this.http2.put<ApiResponse<Teacher>>(`${environment.apiUrl}/teachers/${id}`, fd);
  }

  /** All subject/class/section teaching assignments for the school — used by Class Routine to
   *  filter which teachers can be picked for a given subject/class/section. */
  getAllAssignments(): Observable<TeacherSubjectAssignment[]> {
    return this.http2.get<ApiResponse<TeacherSubjectAssignment[]>>(`${environment.apiUrl}/teachers/assignments`).pipe(
      map(r => r.data ?? [])
    );
  }
}
