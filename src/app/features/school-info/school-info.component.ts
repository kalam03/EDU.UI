import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SchoolInfoService } from '../../core/services/school-info.service';

@Component({
  selector: 'app-school-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './school-info.component.html',
  styleUrl: './school-info.component.scss'
})
export class SchoolInfoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private schoolInfoService = inject(SchoolInfoService);

  loading = true; saving = false; error = ''; success = '';
  schoolId: number | null = null;

  form = this.fb.group({
    schoolEiin:       ['', Validators.required],
    schoolName:       ['', Validators.required],
    schoolType:       [''],
    address:          [''],
    district:         [''],
    thana:            [''],
    postCode:         [''],
    phone:            [''],
    email:            ['', Validators.email],
    website:          [''],
    principalName:    [''],
    principalPhone:   [''],
    principalEmail:   ['', Validators.email],
    establishedYear:  ['']
  });

  ngOnInit(): void {
    this.schoolInfoService.get().subscribe({
      next: info => {
        this.schoolId = (info as any).schoolId ?? null;
        this.form.patchValue(info as any);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true; this.error = ''; this.success = '';
    const data = { ...this.form.value, schoolId: this.schoolId };
    this.schoolInfoService.updateInfo(data as any).subscribe({
      next: () => { this.saving = false; this.success = 'School information updated successfully.'; setTimeout(() => this.success = '', 3000); },
      error: err => { this.saving = false; this.error = err?.error?.message ?? 'Failed to update.'; }
    });
  }
}
