import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseApiService } from './api.service';
import { FeesMaster, FeePayment, StudentFeeDue, StudentFeeDueDetail, ApiResponse } from '../models';

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

  /** Student-wise fee due summary, optionally narrowed to a class/section. */
  getFeeDueSummary(classId?: number | null, sectionId?: number | null): Observable<StudentFeeDue[]> {
    let params = '';
    const q: string[] = [];
    if (classId)   q.push(`classId=${classId}`);
    if (sectionId) q.push(`sectionId=${sectionId}`);
    if (q.length) params = `?${q.join('&')}`;
    return this.http.get<ApiResponse<StudentFeeDue[]>>(`${this.url}/dues${params}`).pipe(
      map(r => r.data ?? [])
    );
  }

  /** Per-fee-type due breakdown for a single student. */
  getFeeDueDetail(studentId: number): Observable<StudentFeeDueDetail[]> {
    return this.http.get<ApiResponse<StudentFeeDueDetail[]>>(`${this.url}/dues/${studentId}`).pipe(
      map(r => r.data ?? [])
    );
  }
}

/** Alias for backward compat with components that use FeeService */
@Injectable({ providedIn: 'root' })
export class FeeService extends FeePaymentService {}
