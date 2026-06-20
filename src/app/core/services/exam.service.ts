import { Injectable } from '@angular/core';
import { BaseApiService } from './api.service';
import { Exam } from '../models';
@Injectable({ providedIn: 'root' })
export class ExamService extends BaseApiService<Exam> {
  protected endpoint = 'exams';
}
