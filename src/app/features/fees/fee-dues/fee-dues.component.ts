import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { FeePaymentService } from '../../../core/services/fee.service';
import { ClassService } from '../../../core/services/class.service';
import { SectionService } from '../../../core/services/section.service';
import { StudentFeeDue, StudentFeeDueDetail } from '../../../core/models';
import { SelectOption, SearchableSelectComponent } from '../../../common/searchable-select/searchable-select.component';

@Component({
  selector: 'app-fee-dues',
  standalone: true,
  imports: [CommonModule, RouterLink, SearchableSelectComponent, IconComponent],
  templateUrl: './fee-dues.component.html',
  styleUrl: './fee-dues.component.scss'
})
export class FeeDuesComponent implements OnInit {
  private feePaymentService = inject(FeePaymentService);
  private classService = inject(ClassService);
  private sectionService = inject(SectionService);

  rows: StudentFeeDue[] = [];
  loading = true;
  error = '';

  classOptions:   SelectOption[] = [];
  sectionOptions: SelectOption[] = [];
  selectedClassId:   number | null = null;
  selectedSectionId: number | null = null;

  // Per-student detail breakdown, expanded inline below the row.
  expandedStudentId: number | null = null;
  detailRows: StudentFeeDueDetail[] = [];
  detailLoading = false;

  get totalDue(): number {
    return this.rows.reduce((sum, r) => sum + (r.totalDue || 0), 0);
  }

  ngOnInit(): void {
    this.classService.list().subscribe(c => {
      this.classOptions = c.map(x => ({ value: x.classId, label: x.className }));
    });
    this.load();
  }

  onClassSelect(classId: number | null): void {
    this.selectedClassId = classId ?? null;
    this.selectedSectionId = null;
    this.sectionOptions = [];
    if (this.selectedClassId) {
      this.sectionService.getByClass(this.selectedClassId).subscribe(s => {
        this.sectionOptions = s.map(x => ({ value: x.sectionId, label: x.sectionName ?? '' }));
      });
    }
    this.load();
  }

  onSectionSelect(sectionId: number | null): void {
    this.selectedSectionId = sectionId ?? null;
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.expandedStudentId = null;
    this.feePaymentService.getFeeDueSummary(this.selectedClassId, this.selectedSectionId).subscribe({
      next: rows => { this.rows = rows; this.loading = false; },
      error: () => { this.loading = false; this.error = 'Failed to load fee dues.'; }
    });
  }

  toggleDetail(row: StudentFeeDue): void {
    if (this.expandedStudentId === row.studentId) {
      this.expandedStudentId = null;
      return;
    }
    this.expandedStudentId = row.studentId;
    this.detailLoading = true;
    this.detailRows = [];
    this.feePaymentService.getFeeDueDetail(row.studentId).subscribe({
      next: d => { this.detailRows = d; this.detailLoading = false; },
      error: () => { this.detailLoading = false; }
    });
  }
}
