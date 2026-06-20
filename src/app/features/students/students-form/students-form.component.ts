import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StudentService } from '../../../core/services/student.service';
import { AuthService } from '../../../core/services/auth.service';
import { ClassService } from '../../../core/services/class.service';
import { SectionService } from '../../../core/services/section.service';
import { GroupService } from '../../../core/services/group.service';
import { EduClass, Section, Group } from '../../../core/models';
import { SearchableDropdownComponent, DropdownOption } from '../../../shared/components/searchable-dropdown/searchable-dropdown.component';
import { CustomDatepickerComponent } from '../../../shared/components/custom-datepicker/custom-datepicker.component';

@Component({
  selector: 'app-students-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SearchableDropdownComponent, CustomDatepickerComponent],
  templateUrl: './students-form.component.html',
  styleUrl: './students-form.component.scss'
})
export class StudentsFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private studentService = inject(StudentService);
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

  classOptions: DropdownOption[] = [];
  sectionOptions: DropdownOption[] = [];
  groupOptions: DropdownOption[] = [];
  genderOptions: DropdownOption[] = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' }
  ];

  form = this.fb.group({
    admissionNo:      ['', Validators.required],
    firstName:        ['', Validators.required],
    lastName:         [''],
    fatherName:       [''],
    motherName:       [''],
    dob:              [''],
    gender:           [''],
    mobileNumber:     [''],
    email:            ['', Validators.email],
    address:          [''],
    classId:          [null as number | null],
    sectionId:        [null as number | null],
    groupId:          [null as number | null],
    enrollmentYear:   [''],
    guardianName:     [''],
    guardianContact:  [''],
    guardianRelation: [''],
    tuitionFee:       [null as number | null],
    schoolEiin:       [this.authService.schoolEiin]
  });

  get isEdit(): boolean { return this.id !== null; }

  ngOnInit(): void {
    this.classService.list().subscribe(c => {
      this.classOptions = c.map(x => ({ value: x.classId, label: x.className }));
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.id = +idParam;
      this.loading = true;
      this.studentService.fetch(this.id).subscribe({
        next: s => {
          this.form.patchValue(s as any);
          if (s.classId) this.onClassChange(s.classId);
          this.loading = false;
        },
        error: () => { this.loading = false; this.error = 'Failed to load student.'; }
      });
    }
  }

  onClassChange(classId: number | null): void {
    this.sectionOptions = [];
    this.groupOptions = [];
    if (!classId) return;
    this.sectionService.getByClass(classId).subscribe(s => {
      this.sectionOptions = s.map(x => ({ value: x.sectionId, label: x.sectionName ?? '' }));
    });
    this.groupService.getByClass(classId).subscribe(g => {
      this.groupOptions = g.map(x => ({ value: x.groupId, label: x.groupName ?? '' }));
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const obs = this.isEdit
      ? this.studentService.update(this.id!, this.form.value as any)
      : this.studentService.create(this.form.value as any);
    obs.subscribe({
      next: () => this.router.navigate(['/students']),
      error: err => { this.saving = false; this.error = err?.error?.message ?? 'Save failed.'; }
    });
  }
}
