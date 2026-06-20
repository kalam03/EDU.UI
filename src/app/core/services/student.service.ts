import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseApiService } from './api.service';
import { Student } from '../models';
@Injectable({ providedIn: 'root' })
export class StudentService extends BaseApiService<Student> {
  protected endpoint = 'students';
  getByClass(classId: number, sectionId?: number): Observable<Student[]> {
    return this.list().pipe(map(s =>
      s.filter(x => x.classId === classId && (!sectionId || x.sectionId === sectionId))
    ));
  }
}
