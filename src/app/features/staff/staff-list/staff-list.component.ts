import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { StaffService } from '../../../core/services/staff.service';
import { Staff } from '../../../core/models';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-staff-list',
  standalone: true,
  imports: [CommonModule, RouterLink, DataTableComponent],
  templateUrl: './staff-list.component.html',
  styleUrl: './staff-list.component.scss'
})
export class StaffListComponent implements OnInit {
  private staffService = inject(StaffService);
  private router = inject(Router);

  staff: Staff[] = [];
  loading = true;

  columns: TableColumn[] = [
    { key: 'staffId',    label: 'Staff ID' },
    { key: 'staffRole',  label: 'Role' },
    { key: 'joinDate',   label: 'Join Date', type: 'date' },
    { key: 'salary',     label: 'Salary',    type: 'currency' },
    { key: 'authStatus', label: 'Status',    type: 'badge' }
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.staffService.list().subscribe({
      next: d => { this.staff = d; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  onEdit(row: Record<string, unknown>): void { this.router.navigate(['/staff', row['staffId'], 'edit']); }
  onDelete(row: Record<string, unknown>): void {
    if (confirm('Delete staff?')) this.staffService.delete(row['staffId'] as number).subscribe(() => this.load());
  }
}
