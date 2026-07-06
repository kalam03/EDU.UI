import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SubjectService } from '../../../core/services/subject.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-subjects-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './subjects-form.component.html',
  styleUrl: './subjects-form.component.scss'
})
export class SubjectsFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private subjectService = inject(SubjectService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  id: number | null = null;
  loading = false; saving = false; error = '';
  form = this.fb.group({
    subjectName: ['', Validators.required],
    subjectCode: [''],
    isPractical:  [false],
    schoolEiin:   [this.authService.schoolEiin]
  });
  get isEdit(): boolean { return this.id !== null; }
  ngOnInit(): void {
    const p = this.route.snapshot.paramMap.get('id');
    if (p) {
      this.id = +p; this.loading = true;
      this.subjectService.fetch(this.id).subscribe({ next: s => { this.form.patchValue(s as any); this.loading = false; }, error: () => { this.loading = false; } });
    }
  }
  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const obs = this.isEdit ? this.subjectService.update(this.id!, this.form.value as any) : this.subjectService.create(this.form.value as any);
    obs.subscribe({ next: () => this.router.navigate(['/subjects']), error: err => { this.saving = false; this.error = err?.error?.message ?? 'Save failed.'; } });
  }
}
