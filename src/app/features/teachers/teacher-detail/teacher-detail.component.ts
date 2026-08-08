import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { TeacherService } from '../../../core/services/teacher.service';
import { ClassService } from '../../../core/services/class.service';
import { SectionService } from '../../../core/services/section.service';
import { GroupService } from '../../../core/services/group.service';
import { Teacher } from '../../../core/models';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-teacher-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './teacher-detail.component.html',
  styleUrl: './teacher-detail.component.scss'
})
export class TeacherDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private teacherService = inject(TeacherService);
  private classService = inject(ClassService);
  private sectionService = inject(SectionService);
  private groupService = inject(GroupService);

  teacher: Teacher | null = null;
  loading = true;
  error = '';

  teacherImageUrl: string | null = null;

  // classId/sectionId/groupId -> display name, so each assignment row can be labelled without
  // an extra API round-trip per row.
  private classNames: Record<number, string> = {};
  private sectionNames: Record<number, string> = {};
  private groupNames: Record<number, string> = {};

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.teacherService.fetch(id).subscribe({
      next: t => {
        this.teacher = t;
        this.loading = false;
        this.resolveImage(t);
        this.resolveAssignmentNames();
      },
      error: () => { this.loading = false; this.error = 'Failed to load teacher.'; }
    });
  }

  private resolveImage(t: Teacher): void {
    const base = environment.apiUrl.replace('/api', '');
    this.teacherImageUrl = t.teacherImage ? `${base}/${t.teacherImage}` : null;
  }

  private resolveAssignmentNames(): void {
    this.classService.list().subscribe(list => list.forEach(c => this.classNames[c.classId] = c.className));
    this.sectionService.list().subscribe(list => list.forEach(s => this.sectionNames[s.sectionId] = s.sectionName ?? ''));
    this.groupService.list().subscribe(list => list.forEach(g => this.groupNames[g.groupId] = g.groupName ?? ''));
  }

  className(classId: number): string { return this.classNames[classId] ?? `#${classId}`; }
  sectionName(sectionId?: number | null): string { return sectionId ? (this.sectionNames[sectionId] ?? `#${sectionId}`) : 'All Sections'; }
  groupName(groupId?: number | null): string { return groupId ? (this.groupNames[groupId] ?? `#${groupId}`) : '—'; }

  onDelete(): void {
    if (!this.teacher) return;
    if (confirm('Delete this teacher?')) {
      this.teacherService.delete(this.teacher.teacherId).subscribe(() => this.router.navigate(['/teachers']));
    }
  }
}
