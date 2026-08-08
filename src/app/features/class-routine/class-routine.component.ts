import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClassService } from '../../core/services/class.service';
import { SectionService } from '../../core/services/section.service';
import { GroupService } from '../../core/services/group.service';
import { SubjectService } from '../../core/services/subject.service';
import { TeacherService } from '../../core/services/teacher.service';
import { ClassRoutineService } from '../../core/services/class-routine.service';
import { ClassRoutine, DAYS_OF_WEEK, TeacherSubjectAssignment } from '../../core/models';
import { SearchableSelectComponent, SelectOption } from '../../common/searchable-select/searchable-select.component';

interface RoutineCell {
  classRoutineId: number | null;
  subjectId: number | null;
  teacherId: number | null;
  roomNo: string | null;
  saving?: boolean;
}

@Component({
  selector: 'app-class-routine',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableSelectComponent],
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
  error = '';

  private allAssignments: TeacherSubjectAssignment[] = [];
  /** Keyed by `${day}_${period}`. */
  cells: Record<string, RoutineCell> = {};

  ngOnInit(): void {
    this.classService.list().subscribe(c => {
      this.classOptions = c.map(x => ({ value: x.classId, label: x.className }));
    });
    this.subjectService.list().subscribe(s => {
      this.subjectOptions = s.map(x => ({ value: x.subjectId, label: x.subjectName }));
    });
    this.teacherService.getAllAssignments().subscribe(a => this.allAssignments = a);
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

  addPeriod(): void {
    this.periods = [...this.periods, this.periods.length ? this.periods[this.periods.length - 1] + 1 : 1];
  }

  private resetGrid(): void {
    this.cells = {};
    for (const day of this.days) {
      for (const p of this.periods) {
        this.cells[this.key(day, p)] = { classRoutineId: null, subjectId: null, teacherId: null, roomNo: null };
      }
    }
  }

  private key(day: string, period: number): string { return `${day}_${period}`; }

  cell(day: string, period: number): RoutineCell {
    const k = this.key(day, period);
    if (!this.cells[k]) this.cells[k] = { classRoutineId: null, subjectId: null, teacherId: null, roomNo: null };
    return this.cells[k];
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
    const payload = {
      classId: this.selectedClassId,
      sectionId: this.selectedSectionId,
      groupId: this.selectedGroupId,
      dayOfWeek: day,
      periodNo: period,
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
}
