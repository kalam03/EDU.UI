import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StaffService } from '../../../core/services/staff.service';
import { AuthService } from '../../../core/services/auth.service';
import { CustomDatepickerComponent } from '../../../shared/components/custom-datepicker/custom-datepicker.component';

@Component({
  selector: 'app-staff-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, CustomDatepickerComponent],
  templateUrl: './staff-form.component.html',
  styleUrl: './staff-form.component.scss'
})
export class StaffFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private staffService = inject(StaffService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  id: number | null = null;
  loading = false; saving = false; error = '';

  form = this.fb.group({
    userId:      [null as number | null, Validators.required],
    staffRole:   [''],
    joinDate:    [''],
    salary:      [null as number | null],
    bankAccount: [''],
    schoolEiin:  [this.authService.schoolEiin]
  });

  get isEdit(): boolean { return this.id !== null; }

  ngOnInit(): void {
    const p = this.route.snapshot.paramMap.get('id');
    if (p) {
      this.id = +p; this.loading = true;
      this.staffService.fetch(this.id).subscribe({
        next: s => { this.form.patchValue(s as any); this.loading = false; },
        error: () => { this.loading = false; this.error = 'Failed to load.'; }
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const obs = this.isEdit
      ? this.staffService.update(this.id!, this.form.value as any)
      : this.staffService.create(this.form.value as any);
    obs.subscribe({
      next: () => this.router.navigate(['/staff']),
      error: err => { this.saving = false; this.error = err?.error?.message ?? 'Save failed.'; }
    });
  }
}
