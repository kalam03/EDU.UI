import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FeePaymentService } from '../../../core/services/fee.service';
import { FeePayment } from '../../../core/models';
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
  private router = inject(Router);

  fees: FeePayment[] = [];
  filtered: FeePayment[] = [];
  loading = true;
  filterStatus = '';

  statusOptions: SelectOption[] = [
    { value: '', label: 'All Status' },
    { value: 'Paid',    label: 'Paid' },
    { value: 'Unpaid',  label: 'Unpaid' },
    { value: 'Partial', label: 'Partial' }
  ];

  columns: TableColumn[] = [
    { key: 'paymentId',   label: '#' },
    { key: 'studentId',   label: 'Student ID' },
    { key: 'feeMasterId', label: 'Fee Type ID' },
    { key: 'amountPaid',  label: 'Amount Paid', type: 'currency' },
    { key: 'paymentDate', label: 'Date',         type: 'date' },
    { key: 'status',      label: 'Status',       type: 'badge' }
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.feeService.list().subscribe({
      next: d => { this.fees = d; this.applyFilter(); this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  onStatusSelect(val: number | string | null): void {
    this.filterStatus = (val ?? '') as string;
    this.applyFilter();
  }

  applyFilter(): void {
    this.filtered = this.filterStatus
      ? this.fees.filter(f => f.status === this.filterStatus)
      : this.fees;
  }

  onEdit(row: Record<string, unknown>): void { this.router.navigate(['/fees', row['paymentId'], 'edit']); }
  onDelete(row: Record<string, unknown>): void {
    if (confirm('Delete fee record?')) this.feeService.delete(row['paymentId'] as number).subscribe(() => this.load());
  }
}
