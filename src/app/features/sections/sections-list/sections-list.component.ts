import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SectionService } from '../../../core/services/section.service';
import { Section } from '../../../core/models';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-sections-list',
  standalone: true,
  imports: [CommonModule, RouterLink, DataTableComponent],
  templateUrl: './sections-list.component.html',
  styleUrl: './sections-list.component.scss'
})
export class SectionsListComponent implements OnInit {
  private sectionService = inject(SectionService);
  private router = inject(Router);
  sections: Section[] = [];
  loading = true;
  columns: TableColumn[] = [
    { key: 'sectionId',   label: '#' },
    { key: 'classId',     label: 'Class ID' },
    { key: 'sectionName', label: 'Section Name' },
    { key: 'authStatus',  label: 'Status' }
  ];
  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading = true;
    this.sectionService.list().subscribe({ next: d => { this.sections = d; this.loading = false; }, error: () => { this.loading = false; } });
  }
  onEdit(row: Record<string, unknown>): void { this.router.navigate(['/sections', row['sectionId'], 'edit']); }
  onDelete(row: Record<string, unknown>): void {
    if (confirm('Delete section?')) this.sectionService.delete(row['sectionId'] as number).subscribe(() => this.load());
  }
}
