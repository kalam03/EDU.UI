import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { FeePaymentService, FeeAdjustmentService } from '../../../core/services/fee.service';
import { ClassService } from '../../../core/services/class.service';
import { SectionService } from '../../../core/services/section.service';
import { StudentFeeDue, StudentFeeDueDetail } from '../../../core/models';
import { SelectOption, SearchableSelectComponent } from '../../../common/searchable-select/searchable-select.component';

@Component({
  selector: 'app-fee-dues',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SearchableSelectComponent, IconComponent],
  templateUrl: './fee-dues.component.html',
  styleUrl: './fee-dues.component.scss'
})
export class FeeDuesComponent implements OnInit {
  private feePaymentService = inject(FeePaymentService);
  private feeAdjustmentService = inject(FeeAdjustmentService);
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

  // Inline "Adjust Advance" form: moves surplus credit from one fee type (adjustFromFeeMasterId,
  // which must currently show a negative Due) onto another fee type's outstanding due for the
  // same student, without any new cash changing hands.
  adjustFromFeeMasterId: number | null = null;
  adjustToFeeMasterId: number | null = null;
  adjustAmount = 0;
  adjustRemarks = '';
  adjustSaving = false;
  adjustError = '';

  get totalDue(): number {
    return this.rows.reduce((sum, r) => sum + (r.totalDue || 0), 0);
  }

  /** Destination options for the currently-open adjust form: the same student's other fee types
   *  that still have an outstanding due. */
  get adjustDestinationOptions(): SelectOption[] {
    return this.detailRows
      .filter(r => r.feeMasterId !== this.adjustFromFeeMasterId && r.due > 0)
      .map(r => ({ value: r.feeMasterId, label: `${r.feeType} (due ৳${r.due.toFixed(2)})` }));
  }

  get adjustAvailableCredit(): number {
    const source = this.detailRows.find(r => r.feeMasterId === this.adjustFromFeeMasterId);
    return source ? -source.due : 0;
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
    this.closeAdjustForm();
    this.loadDetail(row.studentId);
  }

  private loadDetail(studentId: number): void {
    this.detailLoading = true;
    this.detailRows = [];
    this.feePaymentService.getFeeDueDetail(studentId).subscribe({
      next: d => { this.detailRows = d; this.detailLoading = false; },
      error: () => { this.detailLoading = false; }
    });
  }

  openAdjustForm(sourceFeeMasterId: number): void {
    this.adjustFromFeeMasterId = sourceFeeMasterId;
    this.adjustToFeeMasterId = null;
    this.adjustAmount = this.adjustAvailableCredit;
    this.adjustRemarks = '';
    this.adjustError = '';
  }

  closeAdjustForm(): void {
    this.adjustFromFeeMasterId = null;
  }

  onAdjustDestinationSelect(feeMasterId: number | null): void {
    this.adjustToFeeMasterId = feeMasterId;
    // Default the amount to whichever is smaller — the available credit or what's actually owed
    // on the destination — so a normal transfer doesn't overshoot into a negative due by default.
    const dest = this.detailRows.find(r => r.feeMasterId === feeMasterId);
    if (dest) this.adjustAmount = Math.min(this.adjustAvailableCredit, dest.due);
  }

  confirmAdjust(row: StudentFeeDue): void {
    if (!this.adjustFromFeeMasterId || !this.adjustToFeeMasterId || this.adjustAmount <= 0) {
      this.adjustError = 'Select a destination fee type and enter an amount greater than zero.';
      return;
    }
    if (this.adjustAmount > this.adjustAvailableCredit + 0.005) {
      this.adjustError = `Only ৳${this.adjustAvailableCredit.toFixed(2)} of advance credit is available.`;
      return;
    }
    this.adjustSaving = true;
    this.adjustError = '';
    this.feeAdjustmentService.create({
      studentId: row.studentId,
      fromFeeMasterId: this.adjustFromFeeMasterId,
      toFeeMasterId: this.adjustToFeeMasterId,
      amount: this.adjustAmount,
      remarks: this.adjustRemarks || undefined
    }).subscribe({
      next: res => {
        this.adjustSaving = false;
        if (!res.success) { this.adjustError = res.message; return; }
        this.closeAdjustForm();
        this.loadDetail(row.studentId);
      },
      error: err => { this.adjustSaving = false; this.adjustError = err?.error?.message ?? 'Adjustment failed.'; }
    });
  }
}
