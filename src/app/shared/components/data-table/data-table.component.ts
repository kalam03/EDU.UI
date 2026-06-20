import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'badge' | 'date' | 'currency' | 'boolean' | 'image';
  badgeMap?: Record<string, string>;
  sortable?: boolean;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss'
})
export class DataTableComponent implements OnChanges {
  @Input() columns: TableColumn[] = [];
  @Input() data: Record<string, unknown>[] = [];
  @Input() loading = false;
  @Input() pageSize = 15;
  @Input() showSearch = true;
  @Input() searchPlaceholder = 'Search...';
  @Output() edit = new EventEmitter<Record<string, unknown>>();
  @Output() delete = new EventEmitter<Record<string, unknown>>();

  searchTerm = '';
  sortKey = '';
  sortDir: 'asc' | 'desc' = 'asc';
  currentPage = 1;

  ngOnChanges(): void {
    this.currentPage = 1;
  }

  onSearch(): void {
    this.currentPage = 1;
  }

  sortBy(col: TableColumn): void {
    if (col.sortable === false) return;
    if (this.sortKey === col.key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = col.key;
      this.sortDir = 'asc';
    }
    this.currentPage = 1;
  }

  get filteredData(): Record<string, unknown>[] {
    let result = [...this.data];
    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      result = result.filter(row =>
        this.columns.some(col =>
          col.type !== 'image' &&
          String(row[col.key] ?? '').toLowerCase().includes(q)
        )
      );
    }
    if (this.sortKey) {
      result.sort((a, b) => {
        const av = String(a[this.sortKey] ?? '').toLowerCase();
        const bv = String(b[this.sortKey] ?? '').toLowerCase();
        const cmp = av.localeCompare(bv, undefined, { numeric: true });
        return this.sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }

  get totalCount(): number { return this.filteredData.length; }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
  }

  get pages(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  get pagedData(): Record<string, unknown>[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredData.slice(start, start + this.pageSize);
  }

  getCellValue(row: Record<string, unknown>, col: TableColumn): string {
    const val = row[col.key];
    if (val === null || val === undefined) return '-';
    if (col.type === 'boolean') return val ? 'Active' : 'Inactive';
    if (col.type === 'date') return val ? new Date(val as string).toLocaleDateString() : '-';
    if (col.type === 'currency') return `৳${Number(val).toLocaleString()}`;
    return String(val);
  }

  getImageUrl(path: unknown): string {
    const base = environment.apiUrl.replace('/api', '');
    return `${base}/${String(path)}`;
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
