import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseApiService } from './api.service';
import { FeesMaster, FeePayment, StudentFeeDue, StudentFeeDueDetail, FeePaymentSlip, FeeAdjustment, CreateFeeAdjustment, ApiResponse } from '../models';
import { environment } from '../../../environments/environment';

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

  /** Printable receipt/slip data for a single payment. */
  getSlip(paymentId: number): Observable<FeePaymentSlip> {
    return this.http.get<ApiResponse<FeePaymentSlip>>(`${this.url}/${paymentId}/slip`).pipe(
      map(r => r.data)
    );
  }
}

/** Alias for backward compat with components that use FeeService */
@Injectable({ providedIn: 'root' })
export class FeeService extends FeePaymentService {}

@Injectable({ providedIn: 'root' })
export class FeeAdjustmentService {
  private http = inject(HttpClient);
  private get url(): string { return `${environment.apiUrl}/feeadjustments`; }

  /** Moves advance credit from one fee type to another for a student. No new cash changes hands. */
  create(data: CreateFeeAdjustment): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(this.url, data);
  }

  /** Adjustment history for one student. */
  getHistory(studentId: number): Observable<FeeAdjustment[]> {
    return this.http.get<ApiResponse<FeeAdjustment[]>>(`${this.url}/student/${studentId}`).pipe(
      map(r => r.data ?? [])
    );
  }
}
