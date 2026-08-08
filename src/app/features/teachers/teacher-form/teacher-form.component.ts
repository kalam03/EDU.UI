import { Component, OnInit, inject } from '@angular/core';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TeacherService } from '../../../core/services/teacher.service';
import { AuthService } from '../../../core/services/auth.service';
import { ClassService } from '../../../core/services/class.service';
import { SectionService } from '../../../core/services/section.service';
import { GroupService } from '../../../core/services/group.service';
import { SubjectService } from '../../../core/services/subject.service';
import { SearchableSelectComponent, SelectOption } from '../../../common/searchable-select/searchable-select.component';
import { EditableDatepickerComponent } from '../../../common/editable-datepicker/editable-datepicker.component';
import { environment } from '../../../../environments/environment';
import { Religion } from '../../../core/models';

@Component({
  selector: 'app-teacher-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SearchableSelectComponent, EditableDatepickerComponent, IconComponent],
  templateUrl: './teacher-form.component.html',
  styleUrl: './teacher-form.component.scss'
})
export class TeacherFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private teacherService = inject(TeacherService);
  private classService = inject(ClassService);
  private sectionService = inject(SectionService);
  private groupService = inject(GroupService);
  private subjectService = inject(SubjectService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  id: number | null = null;
  loading = false;
  saving = false;
  error = '';

  teacherImageFile: File | null = null;
  teacherImagePreview: string | null = null;
  teacherImageRemoved = false;

  private static readonly MAX_IMAGE_BYTES = 3 * 1024 * 1024;
  private static readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  private static readonly MAX_IMAGE_DIMENSION = 1000;

  classOptions:  SelectOption[] = [];
  subjectOptions: SelectOption[] = [];
  // Per assignment-row section/group options, indexed by row position — each row's Class choice
  // cascades independently, so a single shared list (like the main form's) won't work here.
  assignmentSectionOptions: SelectOption[][] = [];
  assignmentGroupOptions:   SelectOption[][] = [];

  genderOptions: SelectOption[] = [
    { value: 'Male',   label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other',  label: 'Other' }
  ];
  religionOptions: SelectOption[] = Object.values(Religion).map(r => ({ value: r, label: r }));
  bloodGroupOptions: SelectOption[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => ({ value: b, label: b }));
  designationOptions: SelectOption[] = [
    { value: 'Assistant Teacher', label: 'Assistant Teacher' },
    { value: 'Senior Teacher',    label: 'Senior Teacher' },
    { value: 'Head Teacher',      label: 'Head Teacher' },
    { value: 'Vice Principal',    label: 'Vice Principal' },
    { value: 'Principal',         label: 'Principal' }
  ];
  employmentTypeOptions: SelectOption[] = [
    { value: 'Full-time',    label: 'Full-time' },
    { value: 'Part-time',    label: 'Part-time' },
    { value: 'Contractual',  label: 'Contractual' }
  ];

  form = this.fb.group({
    employeeNo:              [{ value: '', disabled: true }, Validators.required],
    firstName:               ['', Validators.required],
    lastName:                [''],
    fatherName:              [''],
    motherName:              [''],
    dob:                     [''],
    gender:                  [''],
    mobileNumber:            ['', [Validators.pattern(/^[0-9]{7,11}$/), Validators.maxLength(11)]],
    email:                   ['', Validators.email],
    address:                 [''],
    nidNumber:               [''],
    bloodGroup:              [''],
    nationality:             [''],
    religion:                [''],
    designation:             ['', Validators.required],
    educationQualification:  ['', Validators.required],
    employmentType:          [''],
    joiningDate:             [''],
    salary:                  [null as number | null],
    bankAccount:             [''],
    emergencyContact:        ['', [Validators.pattern(/^[0-9]{7,11}$/), Validators.maxLength(11)]],
    schoolEiin:              [this.authService.schoolEiin],
    assignments:             this.fb.array([])
  });

  get isEdit(): boolean { return this.id !== null; }
  get assignments(): FormArray { return this.form.get('assignments') as FormArray; }

  ngOnInit(): void {
    this.classService.list().subscribe(c => {
      this.classOptions = c.map(x => ({ value: x.classId, label: x.className }));
    });
    this.subjectService.list().subscribe(s => {
      this.subjectOptions = s.map(x => ({ value: x.subjectId, label: x.subjectName }));
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.teacherService.getNextEmployeeNo().subscribe({
        next: no => this.form.get('employeeNo')!.setValue(no),
        error: () => {}
      });
    }
    if (idParam) {
      this.id = +idParam;
      this.loading = true;
      this.teacherService.fetch(this.id).subscribe({
        next: t => {
          this.form.patchValue(t as any);
          const base = environment.apiUrl.replace('/api', '');
          if (t.teacherImage) this.teacherImagePreview = `${base}/${t.teacherImage}`;
          (t.assignments ?? []).forEach(a => this.addAssignmentRow(a.subjectId, a.classId, a.sectionId ?? null, a.groupId ?? null));
          this.loading = false;
        },
        error: () => { this.loading = false; this.error = 'Failed to load teacher.'; }
      });
    }
  }

  // ── Photo upload ─────────────────────────────────────────────────────────

  async onFileSelect(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!TeacherFormComponent.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      this.error = 'Please choose a JPG, PNG, GIF, or WEBP image.';
      input.value = '';
      return;
    }
    this.error = '';

    const resized = await this.resizeImage(file);
    if (resized.size > TeacherFormComponent.MAX_IMAGE_BYTES) {
      this.error = 'Image is still too large even after compression. Please choose a smaller photo.';
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      this.teacherImageFile = resized;
      this.teacherImagePreview = e.target?.result as string;
      this.teacherImageRemoved = false;
    };
    reader.readAsDataURL(resized);
    input.value = '';
  }

  private resizeImage(file: File): Promise<File> {
    const maxDim = TeacherFormComponent.MAX_IMAGE_DIMENSION;
    return new Promise(resolve => {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        let { width, height } = img;
        if (width <= maxDim && height <= maxDim) { resolve(file); return; }

        const scale = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(file); return; }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(blob => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.85);
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
      img.src = objectUrl;
    });
  }

  removeImage(): void {
    this.teacherImageFile = null;
    this.teacherImagePreview = null;
    this.teacherImageRemoved = true;
  }

  // ── Subjects & Classes assignment rows ──────────────────────────────────

  addAssignmentRow(subjectId: number | null = null, classId: number | null = null, sectionId: number | null = null, groupId: number | null = null): void {
    const row = this.fb.group({
      subjectId: [subjectId, Validators.required],
      classId:   [classId, Validators.required],
      sectionId: [sectionId],
      groupId:   [groupId]
    });
    const index = this.assignments.length;
    this.assignments.push(row);
    this.assignmentSectionOptions[index] = [];
    this.assignmentGroupOptions[index] = [];
    if (classId) this.onAssignmentClassChange(index, classId, false, sectionId, groupId);
  }

  removeAssignmentRow(index: number): void {
    this.assignments.removeAt(index);
    this.assignmentSectionOptions.splice(index, 1);
    this.assignmentGroupOptions.splice(index, 1);
  }

  onAssignmentClassChange(index: number, classId: number | null, resetChildren = true, restoreSectionId: number | null = null, restoreGroupId: number | null = null): void {
    this.assignmentSectionOptions[index] = [];
    this.assignmentGroupOptions[index] = [];
    const row = this.assignments.at(index) as FormGroup;
    if (resetChildren) row.patchValue({ sectionId: null, groupId: null });
    if (!classId) return;
    this.sectionService.getByClass(classId).subscribe(s => {
      this.assignmentSectionOptions[index] = s.map(x => ({ value: x.sectionId, label: x.sectionName ?? '' }));
      if (!resetChildren && restoreSectionId != null) row.patchValue({ sectionId: restoreSectionId });
    });
    this.groupService.getByClass(classId).subscribe(g => {
      this.assignmentGroupOptions[index] = g.map(x => ({ value: x.groupId, label: x.groupName ?? '' }));
      if (!resetChildren && restoreGroupId != null) row.patchValue({ groupId: restoreGroupId });
    });
  }

  // ── Submit ───────────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    this.error = '';

    const fd = new FormData();
    const val = this.form.getRawValue() as any;
    Object.keys(val).forEach(key => {
      if (key === 'assignments') return; // sent separately below as JSON
      if (val[key] !== null && val[key] !== undefined && val[key] !== '') {
        fd.append(key, String(val[key]));
      }
    });
    fd.append('assignmentsJson', JSON.stringify(val.assignments ?? []));

    if (this.teacherImageFile) fd.append('teacherImageFile', this.teacherImageFile);
    else if (this.teacherImageRemoved) fd.append('existingTeacherImage', '');

    const obs = this.isEdit
      ? this.teacherService.updateMultipart(this.id!, fd)
      : this.teacherService.createMultipart(fd);

    obs.subscribe({
      next: () => this.router.navigate(['/teachers']),
      error: err => {
        this.saving = false;
        const apiErrors = err?.error?.errors as string[] | undefined;
        this.error = apiErrors?.length ? apiErrors.join(' ') : (err?.error?.message ?? 'Save failed.');
      }
    });
  }
}
