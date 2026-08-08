import { Component, OnInit, inject } from '@angular/core';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StudentService } from '../../../core/services/student.service';
import { AuthService } from '../../../core/services/auth.service';
import { ClassService } from '../../../core/services/class.service';
import { SectionService } from '../../../core/services/section.service';
import { GroupService } from '../../../core/services/group.service';
import { SearchableSelectComponent, SelectOption } from '../../../common/searchable-select/searchable-select.component';
import { EditableDatepickerComponent } from '../../../common/editable-datepicker/editable-datepicker.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-students-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SearchableSelectComponent, EditableDatepickerComponent, IconComponent],
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

  studentImageFile: File | null = null;
  fatherImageFile:  File | null = null;
  motherImageFile:  File | null = null;
  studentImagePreview: string | null = null;
  fatherImagePreview:  string | null = null;
  motherImagePreview:  string | null = null;
  // Tracks an explicit "remove photo" click so onSubmit can tell the API to clear it,
  // as opposed to simply not touching it (previously these were indistinguishable).
  studentImageRemoved = false;
  fatherImageRemoved  = false;
  motherImageRemoved  = false;

  private static readonly MAX_IMAGE_BYTES = 3 * 1024 * 1024;
  private static readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  classOptions:  SelectOption[] = [];
  sectionOptions: SelectOption[] = [];
  groupOptions:  SelectOption[] = [];
  genderOptions: SelectOption[] = [
    { value: 'Male',   label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other',  label: 'Other' }
  ];
  // Covers a reasonable admission window: 5 years back through 1 year ahead of today,
  // newest first so the current year is easy to find at the top of the list.
  // Values are strings to match EnrollmentYear's NVARCHAR storage on the backend —
  // otherwise a loaded student's saved year (e.g. "2024") wouldn't match a numeric option.
  enrollmentYearOptions: SelectOption[] = (() => {
    const current = new Date().getFullYear();
    const years: SelectOption[] = [];
    for (let y = current + 1; y >= current - 5; y--) years.push({ value: String(y), label: String(y) });
    return years;
  })();

  form = this.fb.group({
    admissionNo:      [{ value: '', disabled: true }, Validators.required],
    firstName:        ['', Validators.required],
    lastName:         [''],
    fatherName:       ['', Validators.required],
    motherName:       ['', Validators.required],
    dob:              ['', Validators.required],
    gender:           ['', Validators.required],
    mobileNumber:     ['', Validators.pattern(/^[0-9+\-\s]{7,20}$/)],
    email:            ['', Validators.email],
    address:          [''],
    classId:          [null as number | null, Validators.required],
    sectionId:        [null as number | null, Validators.required],
    groupId:          [null as number | null],
    enrollmentYear:   [String(new Date().getFullYear()), Validators.required],
    guardianName:     [''],
    guardianContact:  ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]{7,20}$/)]],
    guardianRelation: [''],
    // Tuition fee is not editable here — it's assigned/adjusted from the Fee Management
    // pages (fee types + fee assignment). New students always start at 0 due.
    tuitionFee:       [{ value: 0, disabled: true }],
    schoolEiin:       [this.authService.schoolEiin]
  });

  get isEdit(): boolean { return this.id !== null; }

  ngOnInit(): void {
    this.classService.list().subscribe(c => {
      this.classOptions = c.map(x => ({ value: x.classId, label: x.className }));
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      // New student — auto-generate admission number
      this.studentService.getNextAdmissionNo().subscribe({
        next: no => this.form.get('admissionNo')!.setValue(no),
        error: () => {}
      });
    }
    if (idParam) {
      this.id = +idParam;
      this.loading = true;
      this.studentService.fetch(this.id).subscribe({
        next: s => {
          this.form.patchValue(s as any);
          if (s.classId) {
            // Restore this student's class/section/group options without wiping the values we
            // just patched — a *user-driven* class change (see the template binding below) should
            // reset section/group, but loading an existing student's saved class should not.
            this.onClassChange(s.classId, false, s.sectionId ?? null, s.groupId ?? null);
          }
          const base = environment.apiUrl.replace('/api', '');
          if (s.studentImage) this.studentImagePreview = `${base}/${s.studentImage}`;
          if (s.fatherImage)  this.fatherImagePreview  = `${base}/${s.fatherImage}`;
          if (s.motherImage)  this.motherImagePreview  = `${base}/${s.motherImage}`;
          this.loading = false;
        },
        error: () => { this.loading = false; this.error = 'Failed to load student.'; }
      });
    }
  }

  /**
   * @param resetChildren When true (the default, used when the user picks a different class in the
   *   form), clears the section/group selections since they belonged to the previous class.
   *   When false (used only when restoring an existing student on load), the just-loaded
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

  onFileSelect(type: 'student' | 'father' | 'mother', event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!StudentsFormComponent.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      this.error = 'Please choose a JPG, PNG, GIF, or WEBP image.';
      input.value = '';
      return;
    }
    if (file.size > StudentsFormComponent.MAX_IMAGE_BYTES) {
      this.error = 'Image must be under 3 MB.';
      input.value = '';
      return;
    }
    this.error = '';

    const reader = new FileReader();
    reader.onload = e => {
      const preview = e.target?.result as string;
      if (type === 'student') { this.studentImageFile = file; this.studentImagePreview = preview; this.studentImageRemoved = false; }
      if (type === 'father')  { this.fatherImageFile  = file; this.fatherImagePreview  = preview; this.fatherImageRemoved  = false; }
      if (type === 'mother')  { this.motherImageFile  = file; this.motherImagePreview  = preview; this.motherImageRemoved  = false; }
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  removeImage(type: 'student' | 'father' | 'mother'): void {
    if (type === 'student') { this.studentImageFile = null; this.studentImagePreview = null; this.studentImageRemoved = true; }
    if (type === 'father')  { this.fatherImageFile  = null; this.fatherImagePreview  = null; this.fatherImageRemoved  = true; }
    if (type === 'mother')  { this.motherImageFile  = null; this.motherImagePreview  = null; this.motherImageRemoved  = true; }
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    this.error = '';

    const fd = new FormData();
    const val = this.form.getRawValue() as any; // getRawValue includes disabled controls
    Object.keys(val).forEach(key => {
      if (val[key] !== null && val[key] !== undefined && val[key] !== '') {
        fd.append(key, String(val[key]));
      }
    });

    // Field names below must match StudentFormRequest's C# property names exactly
    // (StudentImageFile / FatherImageFile / MotherImageFile) — a mismatched name here
    // silently drops the upload since ASP.NET Core form binding matches by name, not position.
    if (this.studentImageFile) fd.append('studentImageFile', this.studentImageFile);
    else if (this.studentImageRemoved) fd.append('existingStudentImage', '');

    if (this.fatherImageFile) fd.append('fatherImageFile', this.fatherImageFile);
    else if (this.fatherImageRemoved) fd.append('existingFatherImage', '');

    if (this.motherImageFile) fd.append('motherImageFile', this.motherImageFile);
    else if (this.motherImageRemoved) fd.append('existingMotherImage', '');

    const obs = this.isEdit
      ? this.studentService.updateMultipart(this.id!, fd)
      : this.studentService.createMultipart(fd);

    obs.subscribe({
      next: () => this.router.navigate(['/students']),
      error: err => {
        this.saving = false;
        const apiErrors = err?.error?.errors as string[] | undefined;
        this.error = apiErrors?.length ? apiErrors.join(' ') : (err?.error?.message ?? 'Save failed.');
      }
    });
  }
}
