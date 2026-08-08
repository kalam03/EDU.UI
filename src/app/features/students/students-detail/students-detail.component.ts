import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { StudentService } from '../../../core/services/student.service';
import { ClassService } from '../../../core/services/class.service';
import { SectionService } from '../../../core/services/section.service';
import { GroupService } from '../../../core/services/group.service';
import { FeePaymentService } from '../../../core/services/fee.service';
import { Student, StudentFeeDueDetail } from '../../../core/models';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-students-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './students-detail.component.html',
  styleUrl: './students-detail.component.scss'
})
export class StudentsDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private studentService = inject(StudentService);
  private classService = inject(ClassService);
  private sectionService = inject(SectionService);
  private groupService = inject(GroupService);
  private feePaymentService = inject(FeePaymentService);

  student: Student | null = null;
  loading = true;
  error = '';

  className = '—';
  sectionName = '—';
  groupName = '—';

  studentImageUrl: string | null = null;
  fatherImageUrl: string | null = null;
  motherImageUrl: string | null = null;

  feeDueRows: StudentFeeDueDetail[] = [];
  feeDueLoading = true;

  get totalDue(): number {
    return this.feeDueRows.reduce((sum, r) => sum + (r.due || 0), 0);
  }

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.studentService.fetch(id).subscribe({
      next: s => {
        this.student = s;
        this.loading = false;
        this.resolveImages(s);
        this.resolveNames(s);
      },
      error: () => { this.loading = false; this.error = 'Failed to load student.'; }
    });
    this.feePaymentService.getFeeDueDetail(id).subscribe({
      next: rows => { this.feeDueRows = rows; this.feeDueLoading = false; },
      error: () => { this.feeDueLoading = false; }
    });
  }

  private resolveImages(s: Student): void {
    const base = environment.apiUrl.replace('/api', '');
    this.studentImageUrl = s.studentImage ? `${base}/${s.studentImage}` : null;
    this.fatherImageUrl  = s.fatherImage  ? `${base}/${s.fatherImage}`  : null;
    this.motherImageUrl  = s.motherImage  ? `${base}/${s.motherImage}`  : null;
  }

  private resolveNames(s: Student): void {
    if (s.classId) {
      this.classService.list().subscribe(list => {
        this.className = list.find(c => c.classId === s.classId)?.className ?? '—';
      });
    }
    if (s.sectionId) {
      this.sectionService.list().subscribe(list => {
        this.sectionName = list.find(x => x.sectionId === s.sectionId)?.sectionName ?? '—';
      });
    }
    if (s.groupId) {
      this.groupService.list().subscribe(list => {
        this.groupName = list.find(x => x.groupId === s.groupId)?.groupName ?? '—';
      });
    }
  }

  onDelete(): void {
    if (!this.student) return;
    if (confirm('Delete this student?')) {
      this.studentService.delete(this.student.studentId).subscribe(() => this.router.navigate(['/students']));
    }
  }
}
