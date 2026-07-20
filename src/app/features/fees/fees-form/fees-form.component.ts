import { Component, OnInit, inject } from '@angular/core';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FeePaymentService, FeesMasterService } from '../../../core/services/fee.service';
import { AuthService } from '../../../core/services/auth.service';
import { StudentService } from '../../../core/services/student.service';
import { SelectOption, SearchableSelectComponent } from '../../../common/searchable-select/searchable-select.component';
import { CustomDatepickerComponent } from '../../../shared/components/custom-datepicker/custom-datepicker.component';

// Currency-rounding tolerance used when comparing Amount Paid against the due amount (both are
// stored as decimal(18,2), so anything smaller than half a cent is a rounding artifact, not a
// real mismatch).
const AMOUNT_EPSILON = 0.005;

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
  submitted = false;
  studentOptions: SelectOption[] = [];
  feeMasterOptions: SelectOption[] = [];
  feeMasterOptionsLoading = true;

  // Paid: Amount Paid must exactly clear the due. Partial: it must fall short of the due.
  // Advance: it must exceed the due (a prepayment). "Unpaid" was dropped — a payment record only
  // exists once money has actually changed hands, so every row is one of these three outcomes.
  statusOptions: SelectOption[] = [
    { value: 'Partial', label: 'Partial' },
    { value: 'Paid', label: 'Paid' },
    { value: 'Advance', label: 'Advance' }
  ];

  // Shows the selected student's outstanding balance for the selected fee type, so staff can see
  // the payment's effect on the due before saving, and confirm it's dropped after saving, instead
  // of having to jump over to the separate Fee Dues report to check.
  currentDue: number | null = null;
  currentDueLoading = false;

  // When editing an existing payment, the due fetched above already has THIS payment's own
  // amounts netted out of it (it's aggregated across all saved payments, including this row).
  // To validate/display "the due this payment is being applied against" the same way Create
  // does, we add this payment's own contribution back on top — see effectiveDue() below.
  private originalPayment: { studentId: number; feeMasterId: number; amountPaid: number; discountAmount: number; fineAmount: number } | null = null;

  /** The due amount to validate Amount Paid/Status against — adjusted for edit mode (see above). */
  get effectiveDue(): number | null {
    if (this.currentDue === null) return null;
    const o = this.originalPayment;
    const studentId = this.form.get('studentId')!.value;
    const feeMasterId = this.form.get('feeMasterId')!.value;
    if (o && o.studentId === studentId && o.feeMasterId === feeMasterId) {
      return this.currentDue + o.discountAmount - o.fineAmount + o.amountPaid;
    }
    return this.currentDue;
  }

  form = this.fb.group({
    studentId:      [null as number | null, Validators.required],
    feeMasterId:    [null as number | null, Validators.required],
    amountPaid:     [0, [Validators.required, Validators.min(0)]],
    discountAmount: [0],
    fineAmount:     [0],
    // Defaults to today rather than '' — the API's payment date is required, and previously an
    // untouched (empty-string) date field caused every "Add Fee" submission to be rejected outright.
    paymentDate:    [FeesFormComponent.todayIso(), Validators.required],
    status:         ['Partial', Validators.required],
    schoolEiin:     [this.authService.schoolEiin]
  }, { validators: (group) => this.statusDueValidator(group) });

  private static todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }

  get isEdit(): boolean { return this.id !== null; }

  /** Cross-field rule tying Status to how Amount Paid compares against the due amount. */
  private statusDueValidator(group: AbstractControl): ValidationErrors | null {
    const due = this.effectiveDue;
    if (due === null) return null; // no student/fee selected yet — nothing to check against

    const status = group.get('status')?.value;
    const amountPaid = Number(group.get('amountPaid')?.value ?? 0);
    const diff = amountPaid - due;

    if (status === 'Paid' && Math.abs(diff) > AMOUNT_EPSILON) {
      return { statusMismatch: `Amount Paid (৳${amountPaid.toFixed(2)}) must equal the due amount (৳${due.toFixed(2)}) when Status is Paid.` };
    }
    if (status === 'Partial' && diff > -AMOUNT_EPSILON) {
      return { statusMismatch: `Amount Paid (৳${amountPaid.toFixed(2)}) cannot equal or exceed the due amount (৳${due.toFixed(2)}) when Status is Partial.` };
    }
    if (status === 'Advance' && diff < AMOUNT_EPSILON) {
      return { statusMismatch: `Amount Paid (৳${amountPaid.toFixed(2)}) must exceed the due amount (৳${due.toFixed(2)}) when Status is Advance.` };
    }
    return null;
  }

  /** Auto-selects "Paid" the moment Amount Paid exactly matches the due — saves a manual click and
   *  keeps the common case (paying off the full due) from tripping the validator above. */
  private autoSelectStatus(): void {
    const due = this.effectiveDue;
    if (due === null) return;
    const amountPaid = Number(this.form.get('amountPaid')?.value ?? 0);
    if (Math.abs(amountPaid - due) <= AMOUNT_EPSILON && this.form.get('status')?.value !== 'Paid') {
      this.form.get('status')!.setValue('Paid', { emitEvent: false });
    }
  }

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
        next: f => {
          this.form.patchValue(f as any);
          this.originalPayment = {
            studentId: f.studentId, feeMasterId: f.feeMasterId,
            amountPaid: f.amountPaid ?? 0, discountAmount: f.discountAmount ?? 0, fineAmount: f.fineAmount ?? 0
          };
          this.loading = false;
          this.refreshCurrentDue();
        },
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
    // amountPaid/status changes automatically re-run the group validator above (Angular re-runs
    // group-level validators on every child value change); we only need to also re-check the
    // auto-select-"Paid" shortcut whenever the paid amount moves.
    this.form.get('amountPaid')!.valueChanges.subscribe(() => {
      this.autoSelectStatus();
      this.form.updateValueAndValidity({ emitEvent: false });
    });
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
        // currentDue lives outside the form model, so the group validator (which reads it) won't
        // re-run on its own — nudge it, and apply the auto-select-"Paid" shortcut for this due.
        this.autoSelectStatus();
        this.form.updateValueAndValidity({ emitEvent: false });
      },
      error: () => { this.currentDue = null; this.currentDueLoading = false; }
    });
  }

  onSubmit(): void {
    this.submitted = true;
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
