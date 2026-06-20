import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseApiService } from './api.service';
import { Group } from '../models';
@Injectable({ providedIn: 'root' })
export class GroupService extends BaseApiService<Group> {
  protected endpoint = 'groups';
  getByClass(classId: number): Observable<Group[]> {
    return this.list().pipe(map(g => g.filter(x => x.classId === classId)));
  }
}
