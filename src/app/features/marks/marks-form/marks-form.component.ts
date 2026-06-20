import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { MarkService } from '../../../core/services/mark.service';
import { ExamService } from '../../../core/services/exam.service';
import { SubjectService } from '../../../core/services/subject.service';
import { StudentService } from '../../../core/services/student.service';
import { ClassService } from '../../../core/services/class.service';
import { Exam, Subject, Student, EduClass, Mark } from '../../../core/models';
import { SearchableDropdownComponent, DropdownOption } from '../../../shared/components/searchable-dropdown/searchable-dropdown.component';

interface MarkRow { studentId: number; studentName: string; writtenMark: number; classTestMark: number; homeworkMark: number; examTotalMark: number; }

@Component({ selector: 'app-marks-form', standalone: true, imports: [CommonModule, FormsModule, RouterLink, SearchableDropdownComponent], templateUrl: './marks-form.component.html', styleUrl: './marks-form.component.scss' })
export class MarksFormComponent implements OnInit {
  private markService = inject(MarkService); private examService = inject(ExamService);
  private subjectService = inject(SubjectService); private studentService = inject(StudentService);
  private classService = inject(ClassService); private router = inject(Router); private route = inject(ActivatedRoute);

  id: number | null = null;
  classes: EduClass[] = []; exams: Exam[] = []; subjects: Subject[] = []; students: Student[] = [];
  selectedClassId: number | null = null; selectedExamId: number | null = null; selectedSubjectId: number | null = null;

  get classOptions(): DropdownOption[] { return this.classes.map(c => ({ value: c.classId, label: c.className || '' })); }
  get examOptions(): DropdownOption[] { return this.exams.map(e => ({ value: e.examId, label: e.examName || '' })); }
  get subjectOptions(): DropdownOption[] { return this.subjects.map(s => ({ value: s.subjectId, label: s.subjectName || '' })); }
  markRows: MarkRow[] = []; studentsLoaded = false;
  loading = false; saving = false; error = '';
  editMark: Partial<Mark> = {};

  get isEdit(): boolean { return this.id !== null; }

  ngOnInit(): void {
    this.classService.list().subscribe(c => this.classes = c);
    this.examService.list().subscribe(e => this.exams = e);
    const p = this.route.snapshot.paramMap.get('id');
    if (p) { this.id = +p; this.loading = true; this.markService.fetch(this.id).subscribe({ next: m => { this.editMark = m; this.loading = false; }, error: () => { this.loading = false; } }); }
  }

  onClassSelect(val: number | string | null): void {
    this.selectedClassId = val as number | null;
    this.onClassChange();
  }

  onExamSelect(val: number | string | null): void { this.selectedExamId = val as number | null; }

  onSubjectSelect(val: number | string | null): void {
    this.selectedSubjectId = val as number | null;
    if (val) this.onSubjectChange();
  }

  onClassChange(): void {
    this.subjects = []; this.markRows = []; this.studentsLoaded = false;
    if (this.selectedClassId) {
      this.subjectService.list().subscribe(s => this.subjects = s);
      this.studentService.getByClass(this.selectedClassId).subscribe(s => this.students = s);
    }
  }

  onSubjectChange(): void {
    this.markRows = this.students.map(s => ({
      studentId: s.studentId, studentName: `${s.firstName} ${s.lastName ?? ''}`.trim(),
      writtenMark: 0, classTestMark: 0, homeworkMark: 0, examTotalMark: 100
    }));
    this.studentsLoaded = true;
  }

  getGrade(r: MarkRow): string {
    const total = r.writtenMark + r.classTestMark + r.homeworkMark;
    const pct = r.examTotalMark ? (total / r.examTotalMark) * 100 : 0;
    if (pct >= 80) return 'A+'; if (pct >= 70) return 'A'; if (pct >= 60) return 'B';
    if (pct >= 50) return 'C'; if (pct >= 40) return 'D'; return 'F';
  }

  onSubmit(): void {
    if (!this.selectedExamId || !this.selectedSubjectId || !this.markRows.length) return;
    this.saving = true;
    const records = this.markRows.map(r => ({
      studentId: r.studentId, examId: this.selectedExamId!, subjectId: this.selectedSubjectId!,
      writtenMark: r.writtenMark, classTestMark: r.classTestMark, homeworkMark: r.homeworkMark,
      obtainTotalMark: r.writtenMark + r.classTestMark + r.homeworkMark, examTotalMark: r.examTotalMark,
      grade: this.getGrade(r), isAbsent: false
    }));
    this.markService.bulkCreate(records as any).subscribe({
      next: () => this.router.navigate(['/marks']),
      error: err => { this.saving = false; this.error = err?.error?.message ?? 'Save failed.'; }
    });
  }

  onEditSubmit(): void {
    if (!this.id) return;
    this.saving = true;
    this.markService.update(this.id, this.editMark as any).subscribe({
      next: () => this.router.navigate(['/marks']),
      error: err => { this.saving = false; this.error = err?.error?.message ?? 'Save failed.'; }
    });
  }
}
