import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseApiService } from './api.service';
import { ApiResponse, ClassRoutine } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ClassRoutineService extends BaseApiService<ClassRoutine> {
  protected endpoint = 'classroutines';
  private http2 = inject(HttpClient);

  /** Weekly grid data for one class (+ optional section/group). */
  getByClass(classId: number, sectionId?: number | null, groupId?: number | null): Observable<ClassRoutine[]> {
    let url = `${environment.apiUrl}/classroutines/by-class?classId=${classId}`;
    if (sectionId != null) url += `&sectionId=${sectionId}`;
    if (groupId != null) url += `&groupId=${groupId}`;
    return this.http2.get<ApiResponse<ClassRoutine[]>>(url).pipe(map(r => r.data ?? []));
  }
}
