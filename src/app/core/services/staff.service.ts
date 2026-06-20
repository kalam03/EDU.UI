import { Injectable } from '@angular/core';
import { BaseApiService } from './api.service';
import { Staff } from '../models';
@Injectable({ providedIn: 'root' })
export class StaffService extends BaseApiService<Staff> {
  protected endpoint = 'staffs';
}
