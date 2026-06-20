import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseApiService } from './api.service';
import { FeesMaster, FeePayment, ApiResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class FeesMasterService extends BaseApiService<FeesMaster> {
  protected endpoint = 'feesmasters';
}

@Injectable({ providedIn: 'root' })
export class FeePaymentService extends BaseApiService<FeePayment> {
  protected endpoint = 'feepayments';
  markPaid(id: number, amount: number): Observable<ApiResponse<FeePayment>> {
    return this.http.patch<ApiResponse<FeePayment>>(`${this.url}/${id}/pay`, { amountPaid: amount });
  }
}

/** Alias for backward compat with components that use FeeService */
@Injectable({ providedIn: 'root' })
export class FeeService extends FeePaymentService {}
