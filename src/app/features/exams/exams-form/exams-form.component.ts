import { Component, OnInit, inject } from '@angular/core';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ExamService } from '../../../core/services/exam.service';
import { AuthService } from '../../../core/services/auth.service';
import { ClassService } from '../../../core/services/class.service';
import { SelectOption, SearchableSelectComponent } from '../../../common/searchable-select/searchable-select.component';
import { CustomDatepickerComponent } from '../../../shared/components/custom-datepicker/custom-datepicker.component';

@Component({ selector: 'app-exams-form', standalone: true, imports: [CommonModule, ReactiveFormsModule, RouterLink, SearchableSelectComponent, CustomDatepickerComponent, IconComponent], templateUrl: './exams-form.component.html', styleUrl: './exams-form.component.scss' })
export class ExamsFormComponent implements OnInit {
  private fb = inject(FormBuilder); private examService = inject(ExamService);
  private classService = inject(ClassService); private route = inject(ActivatedRoute); private router = inject(Router);
  private authService = inject(AuthService);
  id: number | null = null; loading = false; saving = false; error = '';
  classOptions: SelectOption[] = [];
  shiftOptions: SelectOption[] = [
    { value: 'Morning', label: 'Morning' },
    { value: 'Day', label: 'Day' },
    { value: 'Evening', label: 'Evening' }
  ];
  form = this.fb.group({ examName: ['', Validators.required], classId: [null as number | null], sectionId: [null as number | null], groupId: [null as number | null], examDate: [''], startTime: [''], endTime: [''], shiftName: [null as string | null], schoolEiin: [this.authService.schoolEiin] });
  get isEdit(): boolean { return this.id !== null; }
  ngOnInit(): void {
    this.classService.list().subscribe(c => { this.classOptions = c.map(x => ({ value: x.classId, label: x.className })); });
    const p = this.route.snapshot.paramMap.get('id');
    if (p) { this.id = +p; this.loading = true; this.examService.fetch(this.id).subscribe({ next: e => { this.form.patchValue(e as any); this.loading = false; }, error: () => { this.loading = false; } }); }
  }
  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const obs = this.isEdit ? this.examService.update(this.id!, this.form.value as any) : this.examService.create(this.form.value as any);
    obs.subscribe({ next: () => this.router.navigate(['/exams']), error: err => { this.saving = false; this.error = err?.error?.message ?? 'Save failed.'; } });
  }
}
