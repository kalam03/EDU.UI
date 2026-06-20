import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseApiService } from './api.service';
import { ApiResponse, Student } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StudentService extends BaseApiService<Student> {
  protected endpoint = 'students';
  private http2 = inject(HttpClient);

  getByClass(classId: number, sectionId?: number): Observable<Student[]> {
    return this.list().pipe(map(s =>
      s.filter(x => x.classId === classId && (!sectionId || x.sectionId === sectionId))
    ));
  }

  getNextAdmissionNo(): Observable<string> {
    return this.http2.get<any>(`${environment.apiUrl}/students/next-admission-no`).pipe(
      map(r => r?.data ?? r)
    );
  }

  createMultipart(fd: FormData): Observable<ApiResponse<Student>> {
    return this.http2.post<ApiResponse<Student>>(`${environment.apiUrl}/students`, fd);
  }

  updateMultipart(id: number, fd: FormData): Observable<ApiResponse<Student>> {
    return this.http2.put<ApiResponse<Student>>(`${environment.apiUrl}/students/${id}`, fd);
  }
}
