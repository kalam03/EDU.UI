import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { BaseApiService } from './api.service';
import { SchoolInfo, ApiResponse } from '../models';

const CACHE_PREFIX = 'edu_school_info_';

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

  /**
   * Reads this school's cached name/address/contact info from localStorage, keyed by EIIN so a
   * shared browser used for multiple schools never mixes one school's cached info into another's.
   */
  getCached(eiin: string): SchoolInfo | null {
    if (!eiin) return null;
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + eiin);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private setCached(eiin: string, info: SchoolInfo): void {
    try { localStorage.setItem(CACHE_PREFIX + eiin, JSON.stringify(info)); } catch { /* storage unavailable — non-fatal */ }
  }

  /**
   * Cache-first lookup — pages that just need the school's name/address (e.g. the admission form
   * header) should call this instead of get(), so they don't hit the API on every screen. Falls
   * back to fetching from the API and populating the cache when nothing is stored yet for this
   * EIIN (first login, or a session that started before this cache existed).
   */
  ensureCached(eiin: string): Observable<SchoolInfo> {
    const cached = this.getCached(eiin);
    if (cached) return of(cached);
    return this.get().pipe(tap(info => this.setCached(eiin, info)));
  }
}
