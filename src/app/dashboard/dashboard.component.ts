import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StudentService } from '../core/services/student.service';
import { StaffService } from '../core/services/staff.service';
import { ClassService } from '../core/services/class.service';
import { SubjectService } from '../core/services/subject.service';
import { DashboardStats } from '../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private studentService = inject(StudentService);
  private staffService = inject(StaffService);
  private classService = inject(ClassService);
  private subjectService = inject(SubjectService);

  stats: DashboardStats = {
    totalStudents: 0, totalStaff: 0, totalClasses: 0, totalSubjects: 0,
    presentToday: 0, absentToday: 0, feesCollected: 0, feesPending: 0
  };
  loading = true;
  today = new Date();

  quickLinks = [
    { label: 'Add Student', route: '/students/new', icon: '🎓', color: '#3182ce' },
    { label: 'Add Staff',   route: '/staff/new',    icon: '👨‍🏫', color: '#38a169' },
    { label: 'Attendance',  route: '/attendance/new', icon: '✅', color: '#d69e2e' },
    { label: 'Enter Marks', route: '/marks/new',    icon: '🏆', color: '#805ad5' },
    { label: 'Collect Fee', route: '/fees/new',     icon: '💰', color: '#e53e3e' },
    { label: 'Add Exam',    route: '/exams/new',    icon: '📝', color: '#dd6b20' }
  ];

  ngOnInit(): void {
    this.studentService.list().subscribe(s => { this.stats.totalStudents = s.length; this.checkDone(); });
    this.staffService.list().subscribe(s => { this.stats.totalStaff = s.length; this.checkDone(); });
    this.classService.list().subscribe(c => { this.stats.totalClasses = c.length; this.checkDone(); });
    this.subjectService.list().subscribe(s => { this.stats.totalSubjects = s.length; this.checkDone(); });
  }

  private checkDone(): void { this.loading = false; }

  get attendancePercent(): number {
    const total = this.stats.presentToday + this.stats.absentToday;
    return total ? Math.round((this.stats.presentToday / total) * 100) : 0;
  }
  get feesCollectionPercent(): number {
    const total = this.stats.feesCollected + this.stats.feesPending;
    return total ? Math.round((this.stats.feesCollected / total) * 100) : 0;
  }
}
