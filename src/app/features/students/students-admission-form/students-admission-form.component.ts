import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { StudentService } from '../../../core/services/student.service';
import { ClassService } from '../../../core/services/class.service';
import { SectionService } from '../../../core/services/section.service';
import { GroupService } from '../../../core/services/group.service';
import { SchoolInfoService } from '../../../core/services/school-info.service';
import { Student, SchoolInfo } from '../../../core/models';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-students-admission-form',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './students-admission-form.component.html',
  styleUrl: './students-admission-form.component.scss'
})
export class StudentsAdmissionFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private studentService = inject(StudentService);
  private classService = inject(ClassService);
  private sectionService = inject(SectionService);
  private groupService = inject(GroupService);
  private schoolInfoService = inject(SchoolInfoService);

  student: Student | null = null;
  school: SchoolInfo | null = null;
  loading = true;
  error = '';

  className = '—';
  sectionName = '—';
  groupName = '—';

  studentImageUrl: string | null = null;

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.schoolInfoService.get().subscribe({ next: s => this.school = s, error: () => {} });
    this.studentService.fetch(id).subscribe({
      next: s => {
        this.student = s;
        this.loading = false;
        this.resolveImage(s);
        this.resolveNames(s);
      },
      error: () => { this.loading = false; this.error = 'Failed to load student.'; }
    });
  }

  private resolveImage(s: Student): void {
    const base = environment.apiUrl.replace('/api', '');
    this.studentImageUrl = s.studentImage ? `${base}/${s.studentImage}` : null;
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

  print(): void { window.print(); }
}
