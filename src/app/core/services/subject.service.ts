import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './api.service';
import { Subject } from '../models';
@Injectable({ providedIn: 'root' })
export class SubjectService extends BaseApiService<Subject> {
  protected endpoint = 'subjects';
  getByClass(_classId: number): Observable<Subject[]> {
    return this.list(); // simplified — returns all subjects
  }
}
