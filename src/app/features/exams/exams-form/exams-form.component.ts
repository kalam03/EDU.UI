import { Component, OnInit, inject } from '@angular/core';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ExamService } from '../../../core/services/exam.service';
import { AuthService } from '../../../core/services/auth.service';
import { ClassService } from '../../../core/services/class.service';
import { SectionService } from '../../../core/services/section.service';
import { GroupService } from '../../../core/services/group.service';
import { SelectOption, SearchableSelectComponent } from '../../../common/searchable-select/searchable-select.component';
import { CustomDatepickerComponent } from '../../../shared/components/custom-datepicker/custom-datepicker.component';

@Component({ selector: 'app-exams-form', standalone: true, imports: [CommonModule, ReactiveFormsModule, RouterLink, SearchableSelectComponent, CustomDatepickerComponent, IconComponent], templateUrl: './exams-form.component.html', styleUrl: './exams-form.component.scss' })
export class ExamsFormComponent implements OnInit {
  private fb = inject(FormBuilder); private examService = inject(ExamService);
  private classService = inject(ClassService); private route = inject(ActivatedRoute); private router = inject(Router);
  private authService = inject(AuthService);
  private sectionService = inject(SectionService); private groupService = inject(GroupService);
  id: number | null = null; loading = false; saving = false; error = '';
  classOptions: SelectOption[] = [];
  sectionOptions: SelectOption[] = [];
  groupOptions: SelectOption[] = [];
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
    if (p) {
      this.id = +p; this.loading = true;
      this.examService.fetch(this.id).subscribe({
        next: e => {
          this.form.patchValue(e as any);
          if (e.classId) {
            // Restore this exam's section/group options without wiping the values we just
            // patched — a *user-driven* class change (see the template binding below) should
            // reset section/group, but loading an existing exam's saved class should not.
            this.onClassChange(e.classId, false, e.sectionId ?? null, e.groupId ?? null);
          }
          this.loading = false;
        },
        error: () => { this.loading = false; }
      });
    }
  }

  /**
   * @param resetChildren When true (the default, used when the user picks a different class in the
   *   form), clears the section/group selections since they belonged to the previous class —
   *   Section and Group are always scoped to the selected Class.
   *   When false (used only when restoring an existing exam on load), the just-loaded
   *   section/group ids are re-applied once their option lists arrive.
   */
  onClassChange(classId: number | null, resetChildren = true, restoreSectionId: number | null = null, restoreGroupId: number | null = null): void {
    this.sectionOptions = [];
    this.groupOptions = [];
    if (resetChildren) {
      this.form.patchValue({ sectionId: null, groupId: null });
    }
    if (!classId) return;
    this.sectionService.getByClass(classId).subscribe(s => {
      this.sectionOptions = s.map(x => ({ value: x.sectionId, label: x.sectionName ?? '' }));
      if (!resetChildren && restoreSectionId != null) {
        this.form.patchValue({ sectionId: restoreSectionId });
      }
    });
    this.groupService.getByClass(classId).subscribe(g => {
      this.groupOptions = g.map(x => ({ value: x.groupId, label: x.groupName ?? '' }));
      if (!resetChildren && restoreGroupId != null) {
        this.form.patchValue({ groupId: restoreGroupId });
      }
    });
  }
  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const obs = this.isEdit ? this.examService.update(this.id!, this.form.value as any) : this.examService.create(this.form.value as any);
    obs.subscribe({ next: () => this.router.navigate(['/exams']), error: err => { this.saving = false; this.error = err?.error?.message ?? 'Save failed.'; } });
  }
}
