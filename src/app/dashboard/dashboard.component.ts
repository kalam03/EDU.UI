import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { StudentService } from '../core/services/student.service';
import { StaffService } from '../core/services/staff.service';
import { ClassService } from '../core/services/class.service';
import { SubjectService } from '../core/services/subject.service';
import { AttendanceService } from '../core/services/attendance.service';
import { FeePaymentService } from '../core/services/fee.service';
import { DashboardStats } from '../core/models';
import { IconComponent } from '../shared/components/icon/icon.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private studentService    = inject(StudentService);
  private staffService      = inject(StaffService);
  private classService      = inject(ClassService);
  private subjectService    = inject(SubjectService);
  private attendanceService = inject(AttendanceService);
  private feeService        = inject(FeePaymentService);

  stats: DashboardStats = {
    totalStudents: 0, totalStaff: 0, totalClasses: 0, totalSubjects: 0,
    presentToday: 0, absentToday: 0, feesCollected: 0, feesPending: 0
  };
  loading = true;
  today = new Date();

  /** Today as YYYY-MM-DD to match API's DateOnly serialisation */
  private todayStr = new Date().toISOString().split('T')[0];

  recentAttendance: { label: string; status: string }[] = [];

  quickLinks = [
    { label: 'Add Student', route: '/students/new',    icon: 'graduation-cap', color: '#3182ce' },
    { label: 'Add Staff',   route: '/staff/new',       icon: 'user-check',     color: '#38a169' },
    { label: 'Attendance',  route: '/attendance/new',  icon: 'check-square',   color: '#d69e2e' },
    { label: 'Enter Marks', route: '/marks/new',       icon: 'award',          color: '#805ad5' },
    { label: 'Collect Fee', route: '/fees/new',        icon: 'dollar-sign',    color: '#e53e3e' },
    { label: 'Add Exam',    route: '/exams/new',       icon: 'file-text',      color: '#dd6b20' }
  ];

  ngOnInit(): void {
    forkJoin({
      students:   this.studentService.list(),
      staff:      this.staffService.list(),
      classes:    this.classService.list(),
      subjects:   this.subjectService.list(),
      attendance: this.attendanceService.list(),
      fees:       this.feeService.list()
    }).subscribe({
      next: ({ students, staff, classes, subjects, attendance, fees }) => {
        this.stats.totalStudents = students.length;
        this.stats.totalStaff    = staff.length;
        this.stats.totalClasses  = classes.length;
        this.stats.totalSubjects = subjects.length;

        // Today's attendance — API returns DateOnly as "YYYY-MM-DD"
        const todayRecords = attendance.filter(a =>
          (a.attendanceDate ?? '').toString().startsWith(this.todayStr)
        );
        this.stats.presentToday = todayRecords.filter(a => a.status === 'Present').length;
        this.stats.absentToday  = todayRecords.filter(a => a.status === 'Absent').length;

        // Fee totals
        this.stats.feesCollected = fees
          .filter(f => f.status === 'Paid')
          .reduce((sum, f) => sum + (f.amountPaid ?? 0), 0);
        this.stats.feesPending = fees
          .filter(f => f.status !== 'Paid')
          .reduce((sum, f) => sum + (f.amountPaid ?? 0), 0);

        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get attendancePercent(): number {
    const total = this.stats.presentToday + this.stats.absentToday;
    return total ? Math.round((this.stats.presentToday / total) * 100) : 0;
  }

  get feesCollectionPercent(): number {
    const total = this.stats.feesCollected + this.stats.feesPending;
    return total ? Math.round((this.stats.feesCollected / total) * 100) : 0;
  }

  get totalAttendanceToday(): number {
    return this.stats.presentToday + this.stats.absentToday;
  }
}
