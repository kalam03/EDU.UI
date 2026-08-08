import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of, Observable } from 'rxjs';
import { ExamService, ExamSubjectService } from '../../../core/services/exam.service';
import { ClassService } from '../../../core/services/class.service';
import { SubjectService } from '../../../core/services/subject.service';
import { TeacherService } from '../../../core/services/teacher.service';
import { AuthService } from '../../../core/services/auth.service';
import { ExamRoutineRow } from '../../../core/models';
import { SelectOption, SearchableSelectComponent } from '../../../common/searchable-select/searchable-select.component';
import { MultiSelectComponent } from '../../../common/multi-select/multi-select.component';
import { CustomDatepickerComponent } from '../../../shared/components/custom-datepicker/custom-datepicker.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

/** One class-row x exam-date cell in the grid. */
interface ExamCell {
  examSubjectId: number | null;
  subjectId: number | null;
  roomNote: string | null;
  invigilatorTeacherIds: number[];
  saving?: boolean;
}

interface DateTime {
  startTime: string | null; // "HH:mm", the format <input type="time"> uses
  endTime: string | null;
}

/** A row in the grid — a real class, or the "Unassigned" bucket for legacy slots saved without
 *  a class (kept editable like any other row, just not tied to a real ClassId). */
interface ClassRow {
  classId: number;
  className: string;
}

const UNASSIGNED_CLASS_ID = 0;

@Component({
  selector: 'app-exam-routine',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SearchableSelectComponent, MultiSelectComponent, CustomDatepickerComponent, IconComponent],
  templateUrl: './exam-routine.component.html',
  styleUrl: './exam-routine.component.scss'
})
export class ExamRoutineComponent implements OnInit {
  private examService = inject(ExamService);
  private examSubjectService = inject(ExamSubjectService);
  private classService = inject(ClassService);
  private subjectService = inject(SubjectService);
  private teacherService = inject(TeacherService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  examOptions: SelectOption[] = [];
  subjectOptions: SelectOption[] = [];
  /** Every teacher in the school — options for the "Invigilators" multi-select. */
  teacherOptions: SelectOption[] = [];
  private allClassRows: ClassRow[] = [];

  selectedExamId: number | null = null;

  /** Exam dates added to the grid, ascending — the grid's columns. */
  dates: string[] = [];
  /** Class rows actually shown — every class, plus "Unassigned" only if legacy data needs it. */
  classRows: ClassRow[] = [];
  /** Keyed by `${classId}_${date}`. */
  cells: Record<string, ExamCell> = {};
  /** One shared start/end time per date column — every class sits the same exam slot on a given day. */
  dateTimes: Record<string, DateTime> = {};

  /** The cell currently open in the edit popup. */
  editingCell: { classId: number; date: string } | null = null;
  /** Bound to the "+ Add Date" datepicker before it's committed to `dates`. */
  newDate: string | null = null;

  loadingOptions = true;
  loadingRoutine = false;
  printing = false;
  removingDate = false;
  error = '';

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
      this.allClassRows = c.map(x => ({ classId: x.classId, className: x.className }));
      this.classRows = [...this.allClassRows];
    });
    this.subjectService.list().subscribe(s => {
      this.subjectOptions = s.map(x => ({ value: x.subjectId, label: x.subjectName }));
    });
    this.teacherService.list().subscribe(t => {
      this.teacherOptions = t.map(x => ({ value: x.teacherId, label: `${x.firstName} ${x.lastName ?? ''}`.trim() }));
    });
  }

  onExamSelect(val: number | string | null): void {
    this.selectedExamId = val ? Number(val) : null;
    this.error = '';
    if (this.selectedExamId) this.loadRoutine();
    else this.resetGrid();
  }

  private resetGrid(): void {
    this.dates = [];
    this.cells = {};
    this.dateTimes = {};
    this.classRows = [...this.allClassRows];
  }

  private loadRoutine(): void {
    if (!this.selectedExamId) return;
    this.loadingRoutine = true;
    this.error = '';
    this.resetGrid();
    this.examSubjectService.getRoutine(this.selectedExamId).subscribe({
      next: (rows: ExamRoutineRow[]) => {
        const dateSet = new Set<string>();
        let hasUnassigned = false;

        for (const r of rows) {
          if (!r.examDate) continue; // legacy slot with no date — nothing to place in a column
          dateSet.add(r.examDate);

          const classId = r.classId ?? UNASSIGNED_CLASS_ID;
          if (classId === UNASSIGNED_CLASS_ID) hasUnassigned = true;

          this.cells[this.key(classId, r.examDate)] = {
            examSubjectId: r.examSubjectId,
            subjectId: r.subjectId,
            roomNote: r.roomNote ?? null,
            invigilatorTeacherIds: r.invigilatorTeacherIds ?? []
          };

          if (!this.dateTimes[r.examDate]) this.dateTimes[r.examDate] = { startTime: null, endTime: null };
          if (!this.dateTimes[r.examDate].startTime && r.startTime) {
            this.dateTimes[r.examDate] = {
              startTime: ExamRoutineComponent.toInputTime(r.startTime),
              endTime: ExamRoutineComponent.toInputTime(r.endTime)
            };
          }
        }

        this.dates = Array.from(dateSet).sort();
        for (const d of this.dates) if (!this.dateTimes[d]) this.dateTimes[d] = { startTime: null, endTime: null };

        this.classRows = hasUnassigned
          ? [...this.allClassRows, { classId: UNASSIGNED_CLASS_ID, className: 'Unassigned' }]
          : [...this.allClassRows];

        this.loadingRoutine = false;
      },
      error: () => { this.error = 'Failed to load the routine.'; this.loadingRoutine = false; }
    });
  }

  private key(classId: number, date: string): string { return `${classId}_${date}`; }

  cell(classId: number, date: string): ExamCell {
    const k = this.key(classId, date);
    if (!this.cells[k]) this.cells[k] = { examSubjectId: null, subjectId: null, roomNote: null, invigilatorTeacherIds: [] };
    return this.cells[k];
  }

  dateTime(date: string): DateTime {
    if (!this.dateTimes[date]) this.dateTimes[date] = { startTime: null, endTime: null };
    return this.dateTimes[date];
  }

  subjectLabel(subjectId: number | null): string {
    if (!subjectId) return '';
    return this.subjectOptions.find(o => o.value === subjectId)?.label ?? `#${subjectId}`;
  }

  classNameFor(classId: number): string {
    return this.classRows.find(r => r.classId === classId)?.className ?? `Class #${classId}`;
  }

  dateHeading(date: string): string {
    const d = new Date(date + 'T00:00:00');
    return isNaN(d.getTime()) ? date : d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
  }

  dayHeading(date: string): string {
    const d = new Date(date + 'T00:00:00');
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { weekday: 'short' });
  }

  addDate(): void {
    if (!this.selectedExamId || !this.newDate) return;
    if (!this.dates.includes(this.newDate)) {
      this.dates = [...this.dates, this.newDate].sort();
      if (!this.dateTimes[this.newDate]) this.dateTimes[this.newDate] = { startTime: null, endTime: null };
    }
    this.newDate = null;
  }

  /** Drops the last (latest) date column — deletes any saved slots on that date first (across
   *  every class row), then removes the column locally once the server confirms. */
  removeDate(): void {
    if (this.dates.length === 0 || this.removingDate) return;
    const lastDate = this.dates[this.dates.length - 1];
    const idsToDelete = this.classRows
      .map(row => this.cell(row.classId, lastDate).examSubjectId)
      .filter((id): id is number => id != null);

    this.removingDate = true;
    this.error = '';
    const done$: Observable<unknown> = idsToDelete.length
      ? forkJoin(idsToDelete.map(id => this.examSubjectService.delete(id)))
      : of(null);

    done$.subscribe({
      next: () => {
        for (const row of this.classRows) delete this.cells[this.key(row.classId, lastDate)];
        delete this.dateTimes[lastDate];
        this.dates = this.dates.slice(0, -1);
        this.removingDate = false;
      },
      error: () => { this.error = 'Failed to remove the date.'; this.removingDate = false; }
    });
  }

  /** "12:00:00" (API/TimeOnly) -> "12:00" (<input type="time"> format). */
  private static toInputTime(v: string | null | undefined): string | null {
    return v ? v.slice(0, 5) : null;
  }

  /** "12:00" (<input type="time">) -> "12:00:00" (API/TimeOnly format). */
  private static toApiTime(v: string | null | undefined): string | undefined {
    if (!v) return undefined;
    return v.length === 5 ? `${v}:00` : v;
  }

  /** Setting a date's time applies to every class already using that date — re-saves each
   *  populated slot in the column so the new time is persisted everywhere it's used. */
  onDateTimeChange(date: string, field: 'startTime' | 'endTime', value: string): void {
    this.dateTime(date)[field] = value || null;
    for (const row of this.classRows) {
      if (this.cell(row.classId, date).subjectId) this.saveCell(row.classId, date);
    }
  }

  openCellEditor(classId: number, date: string): void {
    if (this.cell(classId, date).saving) return;
    this.editingCell = { classId, date };
  }

  closeCellEditor(): void {
    this.editingCell = null;
  }

  onBackdropClick(e: MouseEvent): void {
    if (e.target === e.currentTarget) this.closeCellEditor();
  }

  onSubjectChange(classId: number, date: string, subjectId: number | null): void {
    const c = this.cell(classId, date);
    const prevSubjectId = c.subjectId;
    c.subjectId = subjectId;
    if (!subjectId) { this.clearCell(classId, date); return; }
    this.saveCell(classId, date, () => { c.subjectId = prevSubjectId; });
  }

  onRoomNoteBlur(classId: number, date: string): void {
    const c = this.cell(classId, date);
    if (c.subjectId) this.saveCell(classId, date);
  }

  onInvigilatorsChange(classId: number, date: string, teacherIds: (number | string)[]): void {
    const c = this.cell(classId, date);
    const previous = c.invigilatorTeacherIds;
    c.invigilatorTeacherIds = teacherIds.map(v => Number(v));
    if (c.subjectId) this.saveCell(classId, date, () => { c.invigilatorTeacherIds = previous; });
  }

  /** Comma-joined invigilator names for the compact cell display. */
  invigilatorNamesFor(teacherIds: number[]): string {
    return teacherIds
      .map(id => this.teacherOptions.find(o => o.value === id)?.label ?? `#${id}`)
      .join(', ');
  }

  clearCell(classId: number, date: string): void {
    const c = this.cell(classId, date);
    if (!c.examSubjectId) { c.subjectId = null; c.roomNote = null; c.invigilatorTeacherIds = []; return; }
    c.saving = true;
    this.examSubjectService.delete(c.examSubjectId).subscribe({
      next: () => {
        this.cells[this.key(classId, date)] = { examSubjectId: null, subjectId: null, roomNote: null, invigilatorTeacherIds: [] };
      },
      error: () => { c.saving = false; this.error = 'Failed to clear slot.'; }
    });
  }

  /** Auto-saves a cell the moment its subject/room changes — no separate "Save" button per slot.
   *  `onFailure`, if given, undoes the optimistic UI change already applied by the caller. */
  private saveCell(classId: number, date: string, onFailure?: () => void): void {
    if (!this.selectedExamId) return;
    const c = this.cell(classId, date);
    if (!c.subjectId) return;

    c.saving = true;
    this.error = '';
    const dt = this.dateTime(date);
    const payload = {
      examId: this.selectedExamId,
      subjectId: c.subjectId,
      classId: classId === UNASSIGNED_CLASS_ID ? undefined : classId,
      examDate: date,
      startTime: ExamRoutineComponent.toApiTime(dt.startTime),
      endTime: ExamRoutineComponent.toApiTime(dt.endTime),
      roomNote: c.roomNote || undefined,
      invigilatorTeacherIds: c.invigilatorTeacherIds,
      schoolEiin: this.authService.schoolEiin
    };

    const obs = c.examSubjectId
      ? this.examSubjectService.update(c.examSubjectId, payload as any)
      : this.examSubjectService.create(payload as any);

    obs.subscribe({
      next: res => {
        c.saving = false;
        if (!c.examSubjectId && res.data) c.examSubjectId = (res.data as { examSubjectId: number }).examSubjectId;
      },
      error: (err: HttpErrorResponse) => {
        c.saving = false;
        this.error = err?.error?.message || 'Failed to save slot.';
        if (onFailure) onFailure();
      }
    });
  }

  /** Downloads the routine as a PDF (server-rendered) and opens it in a new tab, ready to print. */
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
