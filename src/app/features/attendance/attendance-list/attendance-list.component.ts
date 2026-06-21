import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AttendanceService } from '../../../core/services/attendance.service';
import { Attendance } from '../../../core/models';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { CustomDatepickerComponent } from '../../../shared/components/custom-datepicker/custom-datepicker.component';

@Component({
  selector: 'app-attendance-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DataTableComponent, CustomDatepickerComponent],
  templateUrl: './attendance-list.component.html',
  styleUrl: './attendance-list.component.scss'
})
export class AttendanceListComponent implements OnInit {
  private attendanceService = inject(AttendanceService);
  attendance: Attendance[] = [];
  filtered: Attendance[] = [];
  loading = true;
  filterDate = new Date().toISOString().split('T')[0];
  columns: TableColumn[] = [
    { key: 'attendanceId', label: '#' },
    { key: 'studentId',    label: 'Student ID' },
    { key: 'attendanceDate', label: 'Date' },
    { key: 'status',       label: 'Status' },
    { key: 'note',         label: 'Note' }
  ];
  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading = true;
    this.attendanceService.list().subscribe({
      next: d => { this.attendance = d; this.applyFilter(); this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
  applyFilter(): void {
    this.filtered = this.filterDate
      ? this.attendance.filter(a => String(a.attendanceDate).startsWith(this.filterDate))
      : [...this.attendance];
  }
  onEdit(_row: Record<string, unknown>): void {}
  onDelete(row: Record<string, unknown>): void {
    if (confirm('Delete?')) this.attendanceService.delete(row['attendanceId'] as number).subscribe(() => this.load());
  }
}
