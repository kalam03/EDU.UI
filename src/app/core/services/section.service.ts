import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseApiService } from './api.service';
import { Section } from '../models';
@Injectable({ providedIn: 'root' })
export class SectionService extends BaseApiService<Section> {
  protected endpoint = 'sections';
  getByClass(classId: number): Observable<Section[]> {
    return this.list().pipe(map(s => s.filter(x => x.classId === classId)));
  }
}
