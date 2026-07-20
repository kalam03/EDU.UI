import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ExamService, ExamSubjectService } from '../../../core/services/exam.service';
import { ClassService } from '../../../core/services/class.service';
import { SubjectService } from '../../../core/services/subject.service';
import { AuthService } from '../../../core/services/auth.service';
import { ExamRoutineRow } from '../../../core/models';
import { SelectOption, SearchableSelectComponent } from '../../../common/searchable-select/searchable-select.component';
import { CustomDatepickerComponent } from '../../../shared/components/custom-datepicker/custom-datepicker.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-exam-routine',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SearchableSelectComponent, CustomDatepickerComponent, IconComponent],
  templateUrl: './exam-routine.component.html',
  styleUrl: './exam-routine.component.scss'
})
export class ExamRoutineComponent implements OnInit {
  private fb = inject(FormBuilder);
  private examService = inject(ExamService);
  private examSubjectService = inject(ExamSubjectService);
  private classService = inject(ClassService);
  private subjectService = inject(SubjectService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  examOptions: SelectOption[] = [];
  classOptions: SelectOption[] = [];
  subjectOptions: SelectOption[] = [];

  selectedExamId: number | null = null;
  rows: ExamRoutineRow[] = [];

  loadingOptions = true;
  loadingRows = false;
  saving = false;
  printing = false;
  error = '';

  form = this.fb.group({
    classId:   [null as number | null, Validators.required],
    subjectId: [null as number | null, Validators.required],
    examDate:  [''],
    startTime: [''],
    endTime:   [''],
    roomNote:  ['']
  });

  ngOnInit(): void {
    this.examService.list().subscribe({
      next: exams => {
        this.examOptions = exams.map(e => ({ value: e.examId, label: e.examName ?? '' }));
        this.loadingOptions = false;

        // Deep-link support: /exams/routine?examId=5 from the Exams list "Routine" action.
        const q = this.route.snapshot.queryParamMap.get('examId');
        if (q) this.onExamSelect(+q);
      },
      error: () => { this.loadingOptions = false; this.error = 'Failed to load exams.'; }
    });
    this.classService.list().subscribe(c => {
      this.classOptions = c.map(x => ({ value: x.classId, label: x.className }));
    });
    this.subjectService.list().subscribe(s => {
      this.subjectOptions = s.map(x => ({ value: x.subjectId, label: x.subjectName }));
    });
  }

  onExamSelect(val: number | string | null): void {
    this.selectedExamId = val ? Number(val) : null;
    this.error = '';
    if (this.selectedExamId) this.loadRoutine();
    else this.rows = [];
  }

  private loadRoutine(): void {
    if (!this.selectedExamId) return;
    this.loadingRows = true;
    this.examSubjectService.getRoutine(this.selectedExamId).subscribe({
      next: rows => { this.rows = rows; this.loadingRows = false; },
      error: () => { this.error = 'Failed to load the routine.'; this.loadingRows = false; }
    });
  }

  addSlot(): void {
    if (!this.selectedExamId || this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    this.error = '';
    const v = this.form.value;
    this.examSubjectService.create({
      examId: this.selectedExamId,
      subjectId: v.subjectId!,
      classId: v.classId ?? undefined,
      examDate: v.examDate || undefined,
      startTime: v.startTime || undefined,
      endTime: v.endTime || undefined,
      roomNote: v.roomNote || undefined,
      schoolEiin: this.authService.schoolEiin
    } as any).subscribe({
      next: () => {
        this.saving = false;
        this.form.reset({ classId: null, subjectId: null, examDate: '', startTime: '', endTime: '', roomNote: '' });
        this.loadRoutine();
      },
      error: err => { this.saving = false; this.error = err?.error?.message ?? 'Failed to add the slot.'; }
    });
  }

  removeSlot(row: ExamRoutineRow): void {
    if (!confirm(`Remove ${row.subjectName ?? 'this subject'} from the routine?`)) return;
    this.examSubjectService.delete(row.examSubjectId).subscribe(() => this.loadRoutine());
  }

  printRoutine(): void {
    if (!this.selectedExamId) return;
    this.printing = true;
    this.error = '';
    this.examSubjectService.downloadRoutinePdf(this.selectedExamId).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        this.printing = false;
      },
      error: () => { this.error = 'Failed to generate the routine PDF.'; this.printing = false; }
    });
  }
}
