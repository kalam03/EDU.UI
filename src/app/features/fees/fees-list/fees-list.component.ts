import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FeePaymentService, FeesMasterService } from '../../../core/services/fee.service';
import { StudentService } from '../../../core/services/student.service';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { SearchableSelectComponent, SelectOption } from '../../../common/searchable-select/searchable-select.component';

@Component({
  selector: 'app-fees-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DataTableComponent, SearchableSelectComponent],
  templateUrl: './fees-list.component.html',
  styleUrl: './fees-list.component.scss'
})
export class FeesListComponent implements OnInit {
  private feeService = inject(FeePaymentService);
  private feesMasterService = inject(FeesMasterService);
  private studentService = inject(StudentService);
  private router = inject(Router);

  fees: Record<string, unknown>[] = [];
  filtered: Record<string, unknown>[] = [];
  loading = true;
  filterStatus = '';

  // Lookups used to show real names in the grid instead of raw StudentId / FeeMasterId columns.
  private studentNames = new Map<number, string>();
  private feeTypeNames = new Map<number, string>();

  statusOptions: SelectOption[] = [
    { value: '', label: 'All Status' },
    { value: 'Paid',    label: 'Paid' },
    { value: 'Unpaid',  label: 'Unpaid' },
    { value: 'Partial', label: 'Partial' }
  ];

  columns: TableColumn[] = [
    { key: 'paymentId',   label: '#' },
    { key: 'studentName', label: 'Student' },
    { key: 'feeType',     label: 'Fee Type' },
    { key: 'amountPaid',  label: 'Amount Paid', type: 'currency' },
    { key: 'paymentDate', label: 'Date',         type: 'date' },
    { key: 'status',      label: 'Status',       type: 'badge' }
  ];

  ngOnInit(): void {
    this.studentService.list().subscribe(s => {
      s.forEach(x => this.studentNames.set(x.studentId, `${x.firstName} ${x.lastName ?? ''}`.trim()));
      this.rebuild();
    });
    this.feesMasterService.list().subscribe(f => {
      f.forEach(x => this.feeTypeNames.set(x.feeMasterId, x.feeType ?? `Fee #${x.feeMasterId}`));
      this.rebuild();
    });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.feeService.list().subscribe({
      next: d => { this.fees = d as unknown as Record<string, unknown>[]; this.rebuild(); this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  /** Re-derives display rows (student/fee-type names) whenever the payments or lookup lists change. */
  private rebuild(): void {
    const withNames = this.fees.map(f => ({
      ...f,
      studentName: this.studentNames.get(f['studentId'] as number) ?? `Student #${f['studentId']}`,
      feeType: this.feeTypeNames.get(f['feeMasterId'] as number) ?? `Fee #${f['feeMasterId']}`
    }));
    this.fees = withNames;
    this.applyFilter();
  }

  onStatusSelect(val: number | string | null): void {
    this.filterStatus = (val ?? '') as string;
    this.applyFilter();
  }

  applyFilter(): void {
    this.filtered = this.filterStatus
      ? this.fees.filter(f => String(f['status']).toLowerCase() === this.filterStatus.toLowerCase())
      : [...this.fees];
  }

  onView(row: Record<string, unknown>): void { this.router.navigate(['/fees', row['paymentId'], 'slip']); }
  onEdit(row: Record<string, unknown>): void { this.router.navigate(['/fees', row['paymentId'], 'edit']); }
  onDelete(row: Record<string, unknown>): void {
    if (confirm('Delete fee record?')) this.feeService.delete(row['paymentId'] as number).subscribe(() => this.load());
  }
}
