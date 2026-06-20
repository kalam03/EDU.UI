import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { Router } from '@angular/router';
import { ApiResponse, LoginRequest, LoginResponse } from '../models';
import { environment } from '../../../environments/environment';

const USER_KEY = 'edu_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;

  private currentUserSubject = new BehaviorSubject<LoginResponse | null>(this.storedUser());
  currentUser$ = this.currentUserSubject.asObservable();

  get currentUser(): LoginResponse | null { return this.currentUserSubject.value; }
  get token(): string | null { return this.currentUser?.token ?? null; }
  get isLoggedIn(): boolean { return !!this.token; }
  get role(): string { return this.currentUser?.role ?? ''; }
  get fullName(): string { return this.currentUser?.fullName ?? ''; }

  private storedUser(): LoginResponse | null {
    try {
      const s = localStorage.getItem(USER_KEY);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/auth/login`, credentials).pipe(
      map(res => {
        if (!res.success || !res.data) throw new Error(res.message || 'Login failed');
        return res.data;
      }),
      tap(user => {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  hasRole(role: string): boolean {
    return this.currentUser?.role === role;
  }
}
