import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FeesMasterService } from '../../../core/services/fee.service';
import { FeesMaster } from '../../../core/models';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-fees-master-list',
  standalone: true,
  imports: [CommonModule, RouterLink, DataTableComponent],
  templateUrl: './fees-master-list.component.html',
  styleUrl: './fees-master-list.component.scss'
})
export class FeesMasterListComponent implements OnInit {
  private feesMasterService = inject(FeesMasterService);
  private router = inject(Router);

  feeTypes: FeesMaster[] = [];
  loading = true;

  columns: TableColumn[] = [
    { key: 'feeType',        label: 'Fee Type' },
    { key: 'amount',         label: 'Amount (BDT)' },
    { key: 'applicableYear', label: 'Applicable Year' },
    { key: 'authStatus',     label: 'Status', type: 'badge' }
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.feesMasterService.list().subscribe({
      next: d => { this.feeTypes = d; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  onEdit(row: Record<string, unknown>): void {
    this.router.navigate(['/fee-types', row['feeMasterId'], 'edit']);
  }

  onDelete(row: Record<string, unknown>): void {
    if (confirm('Delete this fee type?')) {
      this.feesMasterService.delete(row['feeMasterId'] as number).subscribe(() => this.load());
    }
  }
}
