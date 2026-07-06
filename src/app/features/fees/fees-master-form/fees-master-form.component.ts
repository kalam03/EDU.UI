import { Component, OnInit, inject } from '@angular/core';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FeesMasterService } from '../../../core/services/fee.service';
import { AuthService } from '../../../core/services/auth.service';
import { ClassService } from '../../../core/services/class.service';
import { SectionService } from '../../../core/services/section.service';
import { GroupService } from '../../../core/services/group.service';
import { SelectOption, SearchableSelectComponent } from '../../../common/searchable-select/searchable-select.component';

@Component({
  selector: 'app-fees-master-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SearchableSelectComponent, IconComponent],
  templateUrl: './fees-master-form.component.html',
  styleUrl: './fees-master-form.component.scss'
})
export class FeesMasterFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private feesMasterService = inject(FeesMasterService);
  private classService = inject(ClassService);
  private sectionService = inject(SectionService);
  private groupService = inject(GroupService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  id: number | null = null;
  loading = false;
  saving = false;
  error = '';

  classOptions:   SelectOption[] = [];
  sectionOptions: SelectOption[] = [];
  groupOptions:   SelectOption[] = [];

  form = this.fb.group({
    feeType:        ['', Validators.required],
    amount:         [0, [Validators.required, Validators.min(0)]],
    applicableYear: [''],
    classId:        [null as number | null],
    sectionId:      [null as number | null],
    groupId:        [null as number | null],
    schoolEiin:     [this.authService.schoolEiin]
  });

  get isEdit(): boolean { return this.id !== null; }

  ngOnInit(): void {
    this.classService.list().subscribe(c => {
      this.classOptions = c.map(x => ({ value: x.classId, label: x.className }));
    });

    const p = this.route.snapshot.paramMap.get('id');
    if (p) {
      this.id = +p;
      this.loading = true;
      this.feesMasterService.fetch(this.id).subscribe({
        next: f => {
          this.form.patchValue(f as any);
          if (f.classId) this.onClassChange(f.classId, false, f.sectionId ?? null, f.groupId ?? null);
          this.loading = false;
        },
        error: () => { this.loading = false; this.error = 'Failed to load fee type.'; }
      });
    }
  }

  onClassChange(classId: number | null, resetChildren = true, restoreSectionId: number | null = null, restoreGroupId: number | null = null): void {
    this.sectionOptions = [];
    this.groupOptions = [];
    if (resetChildren) {
      this.form.patchValue({ sectionId: null, groupId: null });
    }
    if (!classId) return;
    this.sectionService.getByClass(classId).subscribe(s => {
      this.sectionOptions = s.map(x => ({ value: x.sectionId, label: x.sectionName ?? '' }));
      if (!resetChildren && restoreSectionId != null) this.form.patchValue({ sectionId: restoreSectionId });
    });
    this.groupService.getByClass(classId).subscribe(g => {
      this.groupOptions = g.map(x => ({ value: x.groupId, label: x.groupName ?? '' }));
      if (!resetChildren && restoreGroupId != null) this.form.patchValue({ groupId: restoreGroupId });
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const obs = this.isEdit
      ? this.feesMasterService.update(this.id!, this.form.value as any)
      : this.feesMasterService.create(this.form.value as any);
    obs.subscribe({
      next: () => this.router.navigate(['/fee-types']),
      error: err => { this.saving = false; this.error = err?.error?.message ?? 'Save failed.'; }
    });
  }
}
