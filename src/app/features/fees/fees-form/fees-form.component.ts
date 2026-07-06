import { Component, OnInit, inject } from '@angular/core';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FeePaymentService, FeesMasterService } from '../../../core/services/fee.service';
import { AuthService } from '../../../core/services/auth.service';
import { StudentService } from '../../../core/services/student.service';
import { SelectOption, SearchableSelectComponent } from '../../../common/searchable-select/searchable-select.component';
import { CustomDatepickerComponent } from '../../../shared/components/custom-datepicker/custom-datepicker.component';

@Component({ selector: 'app-fees-form', standalone: true, imports: [CommonModule, ReactiveFormsModule, RouterLink, SearchableSelectComponent, CustomDatepickerComponent, IconComponent], templateUrl: './fees-form.component.html', styleUrl: './fees-form.component.scss' })
export class FeesFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private feeService = inject(FeePaymentService);
  private feesMasterService = inject(FeesMasterService);
  private studentService = inject(StudentService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  id: number | null = null;
  loading = false; saving = false; error = '';
  studentOptions: SelectOption[] = [];
  feeMasterOptions: SelectOption[] = [];
  feeMasterOptionsLoading = true;
  statusOptions: SelectOption[] = [
    { value: 'Unpaid', label: 'Unpaid' }, { value: 'Paid', label: 'Paid' }, { value: 'Partial', label: 'Partial' }
  ];

  // Shows the selected student's outstanding balance for the selected fee type, so staff can see
  // the payment's effect on the due before saving, and confirm it's dropped after saving, instead
  // of having to jump over to the separate Fee Dues report to check.
  currentDue: number | null = null;
  currentDueLoading = false;

  form = this.fb.group({
    studentId:      [null as number | null, Validators.required],
    feeMasterId:    [null as number | null, Validators.required],
    amountPaid:     [0, [Validators.required, Validators.min(0)]],
    discountAmount: [0],
    fineAmount:     [0],
    // Defaults to today rather than '' — the API's payment date is required, and previously an
    // untouched (empty-string) date field caused every "Add Fee" submission to be rejected outright.
    paymentDate:    [FeesFormComponent.todayIso(), Validators.required],
    status:         ['Unpaid', Validators.required],
    schoolEiin:     [this.authService.schoolEiin]
  });

  private static todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }

  get isEdit(): boolean { return this.id !== null; }

  ngOnInit(): void {
    this.studentService.list().subscribe(s => {
      this.studentOptions = s.map(x => ({ value: x.studentId, label: `${x.firstName} ${x.lastName ?? ''} (${x.admissionNo})` }));
    });
    this.feesMasterService.list().subscribe({
      next: f => {
        this.feeMasterOptions = f.map(x => ({ value: x.feeMasterId, label: `${x.feeType ?? ''} - ${x.applicableYear ?? ''}` }));
        this.feeMasterOptionsLoading = false;
      },
      error: () => { this.feeMasterOptionsLoading = false; }
    });

    const p = this.route.snapshot.paramMap.get('id');
    if (p) {
      this.id = +p; this.loading = true;
      this.feeService.fetch(this.id).subscribe({
        next: f => { this.form.patchValue(f as any); this.loading = false; this.refreshCurrentDue(); },
        error: () => { this.loading = false; this.error = 'Failed to load.'; }
      });
    } else {
      // Supports "Pay" links from the Fee Dues report (/fees/new?studentId=..&feeMasterId=..) that
      // jump straight into a prefilled payment for a specific student's outstanding fee type.
      const q = this.route.snapshot.queryParamMap;
      const studentId = q.get('studentId');
      const feeMasterId = q.get('feeMasterId');
      if (studentId) this.form.patchValue({ studentId: +studentId });
      if (feeMasterId) this.form.patchValue({ feeMasterId: +feeMasterId });
    }

    this.form.get('studentId')!.valueChanges.subscribe(() => this.refreshCurrentDue());
    this.form.get('feeMasterId')!.valueChanges.subscribe(() => this.refreshCurrentDue());
    this.refreshCurrentDue();
  }

  private refreshCurrentDue(): void {
    const studentId = this.form.get('studentId')!.value;
    const feeMasterId = this.form.get('feeMasterId')!.value;
    if (!studentId || !feeMasterId) { this.currentDue = null; return; }
    this.currentDueLoading = true;
    this.feeService.getFeeDueDetail(studentId).subscribe({
      next: rows => {
        const match = rows.find(r => r.feeMasterId === feeMasterId);
        this.currentDue = match ? match.due : 0;
        this.currentDueLoading = false;
      },
      error: () => { this.currentDue = null; this.currentDueLoading = false; }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const obs = this.isEdit
      ? this.feeService.update(this.id!, this.form.value as any)
      : this.feeService.create(this.form.value as any);
    obs.subscribe({
      // Land back on the Fee Dues report so the effect of the payment on the student's
      // outstanding balance is immediately visible, rather than the generic payments list.
      next: () => this.router.navigate(['/fees/dues']),
      error: err => { this.saving = false; this.error = err?.error?.message ?? 'Save failed.'; }
    });
  }
}
