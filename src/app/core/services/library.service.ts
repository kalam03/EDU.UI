import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { BaseApiService } from './api.service';
import {
  ApiResponse, LibraryBook, LibraryBookCatalog, LibraryBookCopy, AvailableLibraryBookCopy,
  LibraryBookIssue, OverdueLibraryBookIssue, IssueLibraryBookRequest, ReturnLibraryBookRequest,
  ReturnLibraryBookResult
} from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LibraryBookService extends BaseApiService<LibraryBook> {
  protected endpoint = 'librarybooks';

  /** Catalog rows with copy-count availability, for the book list screen. */
  getCatalog(): Observable<LibraryBookCatalog[]> {
    return this.http.get<ApiResponse<LibraryBookCatalog[]>>(`${this.url}/catalog`).pipe(map(r => r.data ?? []));
  }
}

@Injectable({ providedIn: 'root' })
export class LibraryBookCopyService extends BaseApiService<LibraryBookCopy> {
  protected endpoint = 'librarybookcopies';

  /** Copies belonging to one book. */
  getAllByBook(bookId: number): Observable<LibraryBookCopy[]> {
    return this.http.get<ApiResponse<LibraryBookCopy[]>>(`${this.url}?bookId=${bookId}`).pipe(map(r => r.data ?? []));
  }

  /** Available copies school-wide, joined with book title, for the Issue Book picker. */
  getAvailable(): Observable<AvailableLibraryBookCopy[]> {
    return this.http.get<ApiResponse<AvailableLibraryBookCopy[]>>(`${this.url}/available`).pipe(map(r => r.data ?? []));
  }
}

@Injectable({ providedIn: 'root' })
export class LibraryBookIssueService {
  private http = inject(HttpClient);
  private get url(): string { return `${environment.apiUrl}/librarybookissues`; }

  getAll(): Observable<LibraryBookIssue[]> {
    return this.http.get<ApiResponse<LibraryBookIssue[]>>(this.url).pipe(map(r => r.data ?? []));
  }

  getByStudent(studentId: number): Observable<LibraryBookIssue[]> {
    return this.http.get<ApiResponse<LibraryBookIssue[]>>(`${this.url}/student/${studentId}`).pipe(map(r => r.data ?? []));
  }

  getOverdue(): Observable<OverdueLibraryBookIssue[]> {
    return this.http.get<ApiResponse<OverdueLibraryBookIssue[]>>(`${this.url}/overdue`).pipe(map(r => r.data ?? []));
  }

  /** Issues an available copy to a student. */
  issue(request: IssueLibraryBookRequest): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(this.url, request);
  }

  /** Returns (or marks lost) a copy; the response carries the computed overdue fine. */
  returnBook(issueId: number, request: ReturnLibraryBookRequest): Observable<ApiResponse<ReturnLibraryBookResult>> {
    return this.http.post<ApiResponse<ReturnLibraryBookResult>>(`${this.url}/${issueId}/return`, request);
  }

  markFinePaid(issueId: number): Observable<ApiResponse<boolean>> {
    return this.http.patch<ApiResponse<boolean>>(`${this.url}/${issueId}/fine-paid`, {});
  }
}
