import { Injectable } from '@angular/core';
import { BaseApiService } from './api.service';
import { EduClass } from '../models';
@Injectable({ providedIn: 'root' })
export class ClassService extends BaseApiService<EduClass> {
  protected endpoint = 'classes';
}
