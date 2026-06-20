import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseApiService } from './api.service';
import { SchoolInfo, ApiResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class SchoolInfoService extends BaseApiService<SchoolInfo> {
  protected endpoint = 'schools';

  get(): Observable<SchoolInfo> {
    return this.list().pipe(map(arr => arr[0] ?? {} as SchoolInfo));
  }

  updateInfo(data: Partial<SchoolInfo>): Observable<ApiResponse<SchoolInfo>> {
    const id = (data as any).schoolId ?? 1;
    return this.update(id, data);
  }
}
