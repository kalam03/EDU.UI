import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, Observable } from 'rxjs';
import { ClassService } from '../../core/services/class.service';
import { SectionService } from '../../core/services/section.service';
import { GroupService } from '../../core/services/group.service';
import { SubjectService } from '../../core/services/subject.service';
import { TeacherService } from '../../core/services/teacher.service';
import { ClassRoutineService } from '../../core/services/class-routine.service';
import { ClassRoutine, DAYS_OF_WEEK, TeacherSubjectAssignment } from '../../core/models';
import { SearchableSelectComponent, SelectOption } from '../../common/searchable-select/searchable-select.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

interface RoutineCell {
  classRoutineId: number | null;
  subjectId: number | null;
  teacherId: number | null;
  roomNo: string | null;
  saving?: boolean;
}

interface PeriodTime {
  startTime: string | null; // "HH:mm", the format <input type="time"> uses
  endTime: string | null;
}

@Component({
  selector: 'app-class-routine',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableSelectComponent, IconComponent],
  templateUrl: './class-routine.component.html',
  styleUrl: './class-routine.component.scss'
})
export class ClassRoutineComponent implements OnInit {
  private classService = inject(ClassService);
  private sectionService = inject(SectionService);
  private groupService = inject(GroupService);
  private subjectService = inject(SubjectService);
  private teacherService = inject(TeacherService);
  private routineService = inject(ClassRoutineService);

  readonly days = DAYS_OF_WEEK;
  periods = [1, 2, 3, 4, 5, 6, 7];

  classOptions: SelectOption[] = [];
  sectionOptions: SelectOption[] = [];
  groupOptions: SelectOption[] = [];
  subjectOptions: SelectOption[] = [];

  selectedClassId: number | null = null;
  selectedSectionId: number | null = null;
  selectedGroupId: number | null = null;

  loading = false;
  printing = false;
  printingAll = false;
  error = '';

  private allAssignments: TeacherSubjectAssignment[] = [];
  /** Keyed by `${day}_${period}`. */
  cells: Record<string, RoutineCell> = {};
  /** One start/end time per period, shared across all 7 days in that row — schools run the same
   *  period-time slots every day, so the time is set once per row rather than per cell. */
  periodTimes: Record<number, PeriodTime> = {};
  /** teacherId -> display name, for rendering the compact grid cell without depending on the
   *  subject-filtered `eligibleTeachers()` list (which may not include an already-saved teacher
   *  once the subject/class filters change). */
  private teacherNames: Record<number, string> = {};

  /** The cell currently open in the edit popup — grid cells only show short text; editing the
   *  subject/teacher happens in this popup so the table stays narrow with many periods/subjects. */
  editingCell: { day: string; period: number } | null = null;

  ngOnInit(): void {
    this.classService.list().subscribe(c => {
      this.classOptions = c.map(x => ({ value: x.classId, label: x.className }));
    });
    this.subjectService.list().subscribe(s => {
      this.subjectOptions = s.map(x => ({ value: x.subjectId, label: x.subjectName }));
    });
    this.teacherService.getAllAssignments().subscribe(a => this.allAssignments = a);
    this.teacherService.list().subscribe(t => {
      this.teacherNames = {};
      for (const x of t) this.teacherNames[x.teacherId] = `${x.firstName} ${x.lastName ?? ''}`.trim();
    });
  }

  subjectLabel(subjectId: number | null): string {
    if (!subjectId) return '';
    return this.subjectOptions.find(o => o.value === subjectId)?.label ?? `#${subjectId}`;
  }

  teacherLabelFor(teacherId: number | null): string {
    if (!teacherId) return '';
    return this.teacherNames[teacherId] ?? `#${teacherId}`;
  }

  openCellEditor(day: string, period: number): void {
    if (this.cell(day, period).saving) return;
    this.editingCell = { day, period };
  }

  closeCellEditor(): void {
    this.editingCell = null;
  }

  onClassChange(classId: number | null): void {
    this.selectedClassId = classId;
    this.selectedSectionId = null;
    this.selectedGroupId = null;
    this.sectionOptions = [];
    this.groupOptions = [];
    this.resetGrid();
    if (!classId) return;
    this.sectionService.getByClass(classId).subscribe(s => {
      this.sectionOptions = s.map(x => ({ value: x.sectionId, label: x.sectionName ?? '' }));
    });
    this.groupService.getByClass(classId).subscribe(g => {
      this.groupOptions = g.map(x => ({ value: x.groupId, label: x.groupName ?? '' }));
    });
    this.loadRoutine();
  }

  onSectionOrGroupChange(): void {
    this.loadRoutine();
  }

  removingPeriod = false;

  addPeriod(): void {
    this.periods = [...this.periods, this.periods.length ? this.periods[this.periods.length - 1] + 1 : 1];
  }

  /** Drops the last period column — deletes any saved slots in that period first (across every
   *  day), then removes the column locally once the server confirms. */
  removePeriod(): void {
    if (this.periods.length <= 1 || this.removingPeriod) return;
    const lastPeriod = this.periods[this.periods.length - 1];
    const idsToDelete = this.days
      .map(day => this.cell(day, lastPeriod).classRoutineId)
      .filter((id): id is number => id != null);

    this.removingPeriod = true;
    this.error = '';
    // Explicitly typed as Observable<unknown> — without this, TS infers a union of two
    // differently-shaped Observable types (forkJoin's vs of(null)'s), and calling .subscribe()
    // on that union trips TS2349 ("not callable") because the two subscribe() overload sets
    // aren't compatible with each other.
    const done$: Observable<unknown> = idsToDelete.length
      ? forkJoin(idsToDelete.map(id => this.routineService.delete(id)))
      : of(null);

    done$.subscribe({
      next: () => {
        for (const day of this.days) delete this.cells[this.key(day, lastPeriod)];
        delete this.periodTimes[lastPeriod];
        this.periods = this.periods.slice(0, -1);
        this.removingPeriod = false;
      },
      error: () => { this.error = 'Failed to remove period.'; this.removingPeriod = false; }
    });
  }

  private resetGrid(): void {
    this.cells = {};
    this.periodTimes = {};
    for (const day of this.days) {
      for (const p of this.periods) {
        this.cells[this.key(day, p)] = { classRoutineId: null, subjectId: null, teacherId: null, roomNo: null };
      }
    }
    for (const p of this.periods) this.periodTimes[p] = { startTime: null, endTime: null };
  }

  private key(day: string, period: number): string { return `${day}_${period}`; }

  cell(day: string, period: number): RoutineCell {
    const k = this.key(day, period);
    if (!this.cells[k]) this.cells[k] = { classRoutineId: null, subjectId: null, teacherId: null, roomNo: null };
    return this.cells[k];
  }

  periodTime(period: number): PeriodTime {
    if (!this.periodTimes[period]) this.periodTimes[period] = { startTime: null, endTime: null };
    return this.periodTimes[period];
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

  private loadRoutine(): void {
    if (!this.selectedClassId) return;
    this.loading = true;
    this.error = '';
    this.resetGrid();
    this.routineService.getByClass(this.selectedClassId, this.selectedSectionId, this.selectedGroupId).subscribe({
      next: (rows: ClassRoutine[]) => {
        // Ensure the period-row list covers every period actually saved, even beyond the default 1-7.
        const maxPeriod = rows.reduce((m, r) => Math.max(m, r.periodNo), 0);
        if (maxPeriod > this.periods.length) {
          this.periods = Array.from({ length: maxPeriod }, (_, i) => i + 1);
        }
        for (const r of rows) {
          this.cells[this.key(r.dayOfWeek, r.periodNo)] = {
            classRoutineId: r.classRoutineId,
            subjectId: r.subjectId,
            teacherId: r.teacherId ?? null,
            roomNo: r.roomNo ?? null
          };
          // First slot found for a period supplies that row's shared time — later slots in the
          // same period are assumed to share it (they were all saved together via the time inputs).
          if (!this.periodTimes[r.periodNo]) this.periodTimes[r.periodNo] = { startTime: null, endTime: null };
          if (!this.periodTimes[r.periodNo].startTime && r.startTime) {
            this.periodTimes[r.periodNo] = {
              startTime: ClassRoutineComponent.toInputTime(r.startTime),
              endTime: ClassRoutineComponent.toInputTime(r.endTime)
            };
          }
        }
        this.loading = false;
      },
      error: () => { this.loading = false; this.error = 'Failed to load routine.'; }
    });
  }

  /** Teachers eligible for this cell's currently-chosen subject, filtered to the selected
   *  class/section/group — an assignment with a blank section/group means "any section/group". */
  eligibleTeachers(day: string, period: number): SelectOption[] {
    const c = this.cell(day, period);
    if (!c.subjectId || !this.selectedClassId) return [];
    return this.allAssignments
      .filter(a => a.subjectId === c.subjectId
        && a.classId === this.selectedClassId
        && (a.sectionId == null || a.sectionId === this.selectedSectionId)
        && (a.groupId == null || a.groupId === this.selectedGroupId))
      .map(a => ({ value: a.teacherId, label: a.teacherName ?? `Teacher #${a.teacherId}` }));
  }

  onSubjectChange(day: string, period: number, subjectId: number | null): void {
    const c = this.cell(day, period);
    c.subjectId = subjectId;
    c.teacherId = null;
    this.saveCell(day, period);
  }

  onTeacherChange(day: string, period: number, teacherId: number | null): void {
    const c = this.cell(day, period);
    c.teacherId = teacherId;
    this.saveCell(day, period);
  }

  /** Setting a period's time applies to every day already using that period — re-saves each
   *  populated slot in the row so the new time is persisted everywhere it's used. */
  onPeriodTimeChange(period: number, field: 'startTime' | 'endTime', value: string): void {
    this.periodTime(period)[field] = value || null;
    for (const day of this.days) {
      if (this.cell(day, period).subjectId) this.saveCell(day, period);
    }
  }

  clearCell(day: string, period: number): void {
    const c = this.cell(day, period);
    if (!c.classRoutineId) { c.subjectId = null; c.teacherId = null; c.roomNo = null; return; }
    c.saving = true;
    this.routineService.delete(c.classRoutineId).subscribe({
      next: () => {
        this.cells[this.key(day, period)] = { classRoutineId: null, subjectId: null, teacherId: null, roomNo: null };
      },
      error: () => { c.saving = false; this.error = 'Failed to clear slot.'; }
    });
  }

  /** Auto-saves a cell the moment its subject/teacher changes — no separate "Save" button per
   *  slot, since a weekly grid with 40+ cells makes per-cell save buttons tedious to click through. */
  private saveCell(day: string, period: number): void {
    if (!this.selectedClassId) return;
    const c = this.cell(day, period);
    if (!c.subjectId) {
      // Subject cleared out — remove the slot entirely if it existed.
      if (c.classRoutineId) this.clearCell(day, period);
      return;
    }

    c.saving = true;
    this.error = '';
    const pt = this.periodTime(period);
    const payload = {
      classId: this.selectedClassId,
      sectionId: this.selectedSectionId,
      groupId: this.selectedGroupId,
      dayOfWeek: day,
      periodNo: period,
      startTime: ClassRoutineComponent.toApiTime(pt.startTime),
      endTime: ClassRoutineComponent.toApiTime(pt.endTime),
      subjectId: c.subjectId,
      teacherId: c.teacherId,
      roomNo: c.roomNo
    };

    const obs = c.classRoutineId
      ? this.routineService.update(c.classRoutineId, payload as any)
      : this.routineService.create(payload as any);

    obs.subscribe({
      next: res => {
        c.saving = false;
        if (!c.classRoutineId && res.data) c.classRoutineId = (res.data as ClassRoutine).classRoutineId;
      },
      error: () => { c.saving = false; this.error = 'Failed to save slot.'; }
    });
  }

  /** Downloads the whole-week routine as a PDF (server-rendered) and opens it in a new tab, ready
   *  to print — mirroring the Exam Routine page's print button. */
  printRoutine(): void {
    if (!this.selectedClassId) return;
    this.printing = true;
    this.error = '';
    this.routineService.downloadPdf(this.selectedClassId, this.selectedSectionId, this.selectedGroupId).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        this.printing = false;
      },
      error: () => { this.error = 'Failed to generate the routine PDF.'; this.printing = false; }
    });
  }

  /** Downloads every class's routine as one combined PDF (one page per class/section/group) —
   *  for printing the whole school's timetable in a single go instead of one class at a time. */
  printAllRoutines(): void {
    this.printingAll = true;
    this.error = '';
    this.routineService.downloadAllPdf().subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        this.printingAll = false;
      },
      error: () => { this.error = 'Failed to generate the combined routine PDF.'; this.printingAll = false; }
    });
  }
}
