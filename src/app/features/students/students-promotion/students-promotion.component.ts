import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { StudentService } from '../../../core/services/student.service';
import { ClassService } from '../../../core/services/class.service';
import { SectionService } from '../../../core/services/section.service';
import { GroupService } from '../../../core/services/group.service';
import { Student } from '../../../core/models';
import { SelectOption, SearchableSelectComponent } from '../../../common/searchable-select/searchable-select.component';

@Component({
  selector: 'app-students-promotion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SearchableSelectComponent, IconComponent],
  templateUrl: './students-promotion.component.html',
  styleUrl: './students-promotion.component.scss'
})
export class StudentsPromotionComponent implements OnInit {
  private studentService = inject(StudentService);
  private classService = inject(ClassService);
  private sectionService = inject(SectionService);
  private groupService = inject(GroupService);

  classOptions: SelectOption[] = [];
  groupOptions: SelectOption[] = [];

  // ── Source (From) ───────────────────────────────────────────────────────────
  fromClassId: number | null = null;
  fromSectionId: number | null = null;
  fromSectionOptions: SelectOption[] = [];
  students: Student[] = [];
  studentsLoading = false;
  selected = new Set<number>();

  // ── Destination (To) ─────────────────────────────────────────────────────────
  toClassId: number | null = null;
  toSectionId: number | null = null;
  toGroupId: number | null = null;
  toSectionOptions: SelectOption[] = [];
  enrollmentYear = '';

  saving = false;
  error = '';
  successMessage = '';

  get allSelected(): boolean {
    return this.students.length > 0 && this.selected.size === this.students.length;
  }

  get selectedCount(): number { return this.selected.size; }

  ngOnInit(): void {
    this.classService.list().subscribe(c => {
      this.classOptions = c.map(x => ({ value: x.classId, label: x.className }));
    });
    this.groupService.list().subscribe(g => {
      this.groupOptions = g.map(x => ({ value: x.groupId, label: x.groupName ?? '' }));
    });
    // Sensible default: most schools promote into the next calendar year.
    this.enrollmentYear = String(new Date().getFullYear() + 1);
  }

  onFromClassSelect(classId: number | null): void {
    this.fromClassId = classId ?? null;
    this.fromSectionId = null;
    this.fromSectionOptions = [];
    this.students = [];
    this.selected.clear();
    this.successMessage = '';
    if (this.fromClassId) {
      this.sectionService.getByClass(this.fromClassId).subscribe(s => {
        this.fromSectionOptions = s.map(x => ({ value: x.sectionId, label: x.sectionName ?? '' }));
      });
      this.loadStudents();
    }
  }

  onFromSectionSelect(sectionId: number | null): void {
    this.fromSectionId = sectionId ?? null;
    this.loadStudents();
  }

  private loadStudents(): void {
    if (!this.fromClassId) return;
    this.studentsLoading = true;
    this.studentService.getByClass(this.fromClassId, this.fromSectionId ?? undefined).subscribe(list => {
      this.students = list;
      // Default to selecting everyone — the common case is promoting the whole class/section.
      this.selected = new Set(list.map(s => s.studentId));
      this.studentsLoading = false;
    });
  }

  toggleAll(): void {
    if (this.allSelected) {
      this.selected.clear();
    } else {
      this.selected = new Set(this.students.map(s => s.studentId));
    }
  }

  toggleOne(studentId: number): void {
    if (this.selected.has(studentId)) this.selected.delete(studentId);
    else this.selected.add(studentId);
  }

  onToClassSelect(classId: number | null): void {
    this.toClassId = classId ?? null;
    this.toSectionId = null;
    this.toSectionOptions = [];
    if (this.toClassId) {
      this.sectionService.getByClass(this.toClassId).subscribe(s => {
        this.toSectionOptions = s.map(x => ({ value: x.sectionId, label: x.sectionName ?? '' }));
      });
    }
  }

  onToSectionSelect(sectionId: number | null): void {
    this.toSectionId = sectionId ?? null;
  }

  onToGroupSelect(groupId: number | null): void {
    this.toGroupId = groupId ?? null;
  }

  confirmPromote(): void {
    this.error = '';
    this.successMessage = '';
    if (this.selected.size === 0) { this.error = 'Select at least one student.'; return; }
    if (!this.toClassId) { this.error = 'Select the class to promote into.'; return; }
    if (this.toClassId === this.fromClassId && this.toSectionId === this.fromSectionId) {
      this.error = 'Destination class/section is the same as the source — nothing to promote.';
      return;
    }
    if (!confirm(`Promote ${this.selected.size} student(s) to the selected class/section? This cannot be undone automatically.`)) {
      return;
    }

    this.saving = true;
    this.studentService.promote({
      studentIds: Array.from(this.selected),
      toClassId: this.toClassId,
      toSectionId: this.toSectionId,
      toGroupId: this.toGroupId,
      enrollmentYear: this.enrollmentYear || undefined
    }).subscribe({
      next: res => {
        this.saving = false;
        if (!res.success) { this.error = res.message; return; }
        this.successMessage = res.message;
        this.loadStudents(); // the promoted students should now disappear from the source list
      },
      error: err => { this.saving = false; this.error = err?.error?.message ?? 'Promotion failed.'; }
    });
  }
}
