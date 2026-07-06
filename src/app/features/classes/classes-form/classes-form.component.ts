import { Component, OnInit, inject } from '@angular/core';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClassService } from '../../../core/services/class.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-classes-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './classes-form.component.html',
  styleUrl: './classes-form.component.scss'
})
export class ClassesFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private classService = inject(ClassService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  id: number | null = null;
  loading = false;
  saving = false;
  error = '';

  form = this.fb.group({
    className: ['', [Validators.required, Validators.maxLength(100)]],
    classCode: [''],
    schoolEiin: [this.authService.schoolEiin]
  });

  get isEdit(): boolean { return this.id !== null; }

  ngOnInit(): void {
    const p = this.route.snapshot.paramMap.get('id');
    if (p) {
      this.id = +p; this.loading = true;
      this.classService.fetch(this.id).subscribe({
        next: c => { this.form.patchValue(c as any); this.loading = false; },
        error: () => { this.loading = false; this.error = 'Failed to load.'; }
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const obs = this.isEdit
      ? this.classService.update(this.id!, this.form.value as any)
      : this.classService.create(this.form.value as any);
    obs.subscribe({
      next: () => this.router.navigate(['/classes']),
      error: err => { this.saving = false; this.error = err?.error?.message ?? 'Save failed.'; }
    });
  }
}
