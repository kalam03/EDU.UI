import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../models';
import { environment } from '../../../environments/environment';

export abstract class BaseApiService<T> {
  protected http = inject(HttpClient);
  protected abstract endpoint: string;
  protected baseUrl = environment.apiUrl;
  protected get url(): string { return `${this.baseUrl}/${this.endpoint}`; }

  getAll(): Observable<ApiResponse<T[]>> {
    return this.http.get<ApiResponse<T[]>>(this.url);
  }
  /** Unwrapped: returns T[] directly */
  list(): Observable<T[]> {
    return this.http.get<ApiResponse<T[]>>(this.url).pipe(map(r => r.data ?? []));
  }
  getById(id: number): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.url}/${id}`);
  }
  /** Unwrapped: returns T directly */
  fetch(id: number): Observable<T> {
    return this.http.get<ApiResponse<T>>(`${this.url}/${id}`).pipe(map(r => r.data));
  }
  create(data: Partial<T>): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(this.url, data);
  }
  update(id: number, data: Partial<T>): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.url}/${id}`, data);
  }
  delete(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.url}/${id}`);
  }
}
