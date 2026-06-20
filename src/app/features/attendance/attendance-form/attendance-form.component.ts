import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AttendanceService } from '../../../core/services/attendance.service';
import { ClassService } from '../../../core/services/class.service';
import { SectionService } from '../../../core/services/section.service';
import { StudentService } from '../../../core/services/student.service';
import { EduClass, Section, Student } from '../../../core/models';
import { CustomDatepickerComponent } from '../../../shared/components/custom-datepicker/custom-datepicker.component';
import { SearchableDropdownComponent, DropdownOption } from '../../../shared/components/searchable-dropdown/searchable-dropdown.component';

interface AttendanceRow { studentId: number; studentName: string; status: string; note: string; }

@Component({
  selector: 'app-attendance-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CustomDatepickerComponent, SearchableDropdownComponent],
  templateUrl: './attendance-form.component.html',
  styleUrl: './attendance-form.component.scss'
})
export class AttendanceFormComponent implements OnInit {
  private attendanceService = inject(AttendanceService);
  private classService = inject(ClassService);
  private sectionService = inject(SectionService);
  private studentService = inject(StudentService);
  private router = inject(Router);

  classes: EduClass[] = [];
  sections: Section[] = [];
  selectedClassId: number | null = null;
  selectedSectionId: number | null = null;

  get classOptions(): DropdownOption[] { return this.classes.map(c => ({ value: c.classId, label: c.className || '' })); }
  get sectionOptions(): DropdownOption[] { return this.sections.map(s => ({ value: s.sectionId, label: s.sectionName || '' })); }

  onClassSelect(val: number | string | null): void { this.selectedClassId = val as number | null; this.onClassChange(); }
  onSectionSelect(val: number | string | null): void { this.selectedSectionId = val as number | null; }
  attendanceDate = new Date().toISOString().split('T')[0];
  rows: AttendanceRow[] = [];
  loading = false; saving = false; error = '';
  studentsLoaded = false;
  statusOptions = ['Present', 'Absent', 'Late'];

  ngOnInit(): void { this.classService.list().subscribe(c => this.classes = c); }

  onClassChange(): void {
    this.sections = []; this.selectedSectionId = null; this.rows = []; this.studentsLoaded = false;
    if (this.selectedClassId) this.sectionService.getByClass(this.selectedClassId).subscribe(s => this.sections = s);
  }

  loadStudents(): void {
    if (!this.selectedClassId) return;
    this.loading = true;
    this.studentService.getByClass(this.selectedClassId, this.selectedSectionId ?? undefined).subscribe({
      next: students => {
        this.rows = students.map(s => ({
          studentId: s.studentId,
          studentName: `${s.firstName} ${s.lastName ?? ''}`.trim(),
          status: 'Present', note: ''
        }));
        this.studentsLoaded = true; this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  markAll(status: string): void { this.rows.forEach(r => r.status = status); }

  onSubmit(): void {
    if (!this.selectedClassId || !this.rows.length) return;
    this.saving = true;
    const records = this.rows.map(r => ({
      studentId: r.studentId, attendanceDate: this.attendanceDate,
      status: r.status, note: r.note, schoolEiin: ''
    }));
    this.attendanceService.bulkCreate(records as any).subscribe({
      next: () => this.router.navigate(['/attendance']),
      error: err => { this.saving = false; this.error = err?.error?.message ?? 'Save failed.'; }
    });
  }
}
