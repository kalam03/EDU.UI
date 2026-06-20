import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'badge' | 'date' | 'currency' | 'boolean';
  badgeMap?: Record<string, string>;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss'
})
export class DataTableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: Record<string, unknown>[] = [];
  @Input() loading = false;
  @Input() totalCount = 0;
  @Input() pageSize = 20;
  @Input() currentPage = 1;
  @Input() searchPlaceholder = 'Search...';
  @Input() showSearch = true;
  @Output() edit = new EventEmitter<Record<string, unknown>>();
  @Output() delete = new EventEmitter<Record<string, unknown>>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() search = new EventEmitter<string>();

  searchTerm = '';

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  get pages(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  onSearch(): void {
    this.search.emit(this.searchTerm);
  }

  getCellValue(row: Record<string, unknown>, col: TableColumn): string {
    const val = row[col.key];
    if (val === null || val === undefined) return '-';
    if (col.type === 'boolean') return val ? 'Active' : 'Inactive';
    if (col.type === 'date') return val ? new Date(val as string).toLocaleDateString() : '-';
    if (col.type === 'currency') return `৳${Number(val).toLocaleString()}`;
    return String(val);
  }

  getBadgeClass(row: Record<string, unknown>, col: TableColumn): string {
    const val = String(row[col.key] ?? '');
    if (col.badgeMap) return col.badgeMap[val] ?? 'badge-info';
    if (val === 'true' || val === 'Active' || val === 'Present' || val === 'Paid') return 'badge-success';
    if (val === 'false' || val === 'Inactive' || val === 'Absent' || val === 'Unpaid') return 'badge-danger';
    if (val === 'Late' || val === 'Partial' || val === 'Excused') return 'badge-warning';
    return 'badge-info';
  }
}
