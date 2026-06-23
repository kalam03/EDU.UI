import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { MarkService } from '../../core/services/mark.service';
import { ExamService } from '../../core/services/exam.service';
import { StudentService } from '../../core/services/student.service';
import { ClassService } from '../../core/services/class.service';
import { Exam, Student, EduClass } from '../../core/models';
import { SearchableSelectComponent, SelectOption } from '../../common/searchable-select/searchable-select.component';

@Component({
  selector: 'app-marksheet',
  standalone: true,
  imports: [CommonModule, SearchableSelectComponent],
  templateUrl: './marksheet.component.html',
  styleUrl: './marksheet.component.scss'
})
export class MarksheetComponent implements OnInit {
  private markService   = inject(MarkService);
  private examService   = inject(ExamService);
  private studentService = inject(StudentService);
  private classService  = inject(ClassService);

  // Options
  classOptions:   SelectOption[] = [];
  examOptions:    SelectOption[] = [];
  studentOptions: SelectOption[] = [];

  // Selections
  selectedClassId:   number | null = null;
  selectedExamId:    number | null = null;
  selectedStudentId: number | null = null;

  // State
  loading    = false;
  generating = false;
  error      = '';

  ngOnInit(): void {
    forkJoin({
      classes: this.classService.list(),
      exams:   this.examService.list()
    }).subscribe({
      next: ({ classes, exams }) => {
        this.classOptions = classes.map(c => ({ value: c.classId!, label: c.className ?? '' }));
        this.examOptions  = exams.map(e  => ({ value: e.examId!,  label: e.examName  ?? '' }));
      },
      error: () => { this.error = 'Failed to load data.'; }
    });
  }

  onClassSelect(val: number | string | null): void {
    this.selectedClassId   = val ? Number(val) : null;
    this.selectedStudentId = null;
    this.studentOptions    = [];
    if (!this.selectedClassId) return;

    this.loading = true;
    this.studentService.list().subscribe({
      next: students => {
        this.studentOptions = students
          .filter(s => s.classId === this.selectedClassId)
          .map(s => ({
            value: s.studentId!,
            label: `${s.admissionNo ? s.admissionNo + ' – ' : ''}${s.firstName ?? ''} ${s.lastName ?? ''}`.trim()
          }));
        this.loading = false;
      },
      error: () => { this.error = 'Failed to load students.'; this.loading = false; }
    });
  }

  onExamSelect(val: number | string | null): void {
    this.selectedExamId = val ? Number(val) : null;
  }

  onStudentSelect(val: number | string | null): void {
    this.selectedStudentId = val ? Number(val) : null;
  }

  get canGenerate(): boolean {
    return !!this.selectedStudentId && !!this.selectedExamId && !this.generating;
  }

  generateMarksheet(): void {
    if (!this.canGenerate) return;
    this.generating = true;
    this.error = '';

    this.markService.getMarksheet(this.selectedStudentId!, this.selectedExamId!).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        this.generating = false;
      },
      error: () => {
        this.error = 'Failed to generate marksheet. Please check that marks exist for this student and exam.';
        this.generating = false;
      }
    });
  }
}
