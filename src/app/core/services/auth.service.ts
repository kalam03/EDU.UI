import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { Router } from '@angular/router';
import { ApiResponse, LoginRequest, LoginResponse } from '../models';
import { environment } from '../../../environments/environment';
import { SchoolInfoService } from './school-info.service';

const USER_KEY = 'edu_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private schoolInfoService = inject(SchoolInfoService);
  private apiUrl = environment.apiUrl;

  private currentUserSubject = new BehaviorSubject<LoginResponse | null>(this.storedUser());
  currentUser$ = this.currentUserSubject.asObservable();

  get currentUser(): LoginResponse | null { return this.currentUserSubject.value; }
  get token(): string | null { return this.currentUser?.token ?? null; }
  get isLoggedIn(): boolean { return !!this.token; }
  get role(): string { return this.currentUser?.role ?? ''; }
  get fullName(): string { return this.currentUser?.fullName ?? ''; }
  get schoolEiin(): string { return this.currentUser?.schoolEiin ?? ''; }

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
        localStorage.setItem(USER_KEY,(JSON.stringify(user)));
         localStorage.setItem("edu_username", user.username);
         localStorage.setItem("edu_token", user.token);
         localStorage.setItem("edu_school_eiin", user.schoolEiin ?? '');
        this.currentUserSubject.next(user);

        // Best-effort pre-warm of the school-info cache (name/address/contact numbers), keyed by
        // this login's EIIN, so pages like the admission form can read it straight from
        // localStorage instead of hitting the API every time. If it's already cached from a
        // previous login this is a no-op; failures here must never block login itself.
        if (user.schoolEiin) {
          this.schoolInfoService.ensureCached(user.schoolEiin).subscribe({ error: () => {} });
        }
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
