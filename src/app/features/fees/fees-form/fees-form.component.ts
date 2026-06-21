import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FeePaymentService, FeesMasterService } from '../../../core/services/fee.service';
import { AuthService } from '../../../core/services/auth.service';
import { StudentService } from '../../../core/services/student.service';
import { SelectOption, SearchableSelectComponent } from '../../../common/searchable-select/searchable-select.component';
import { CustomDatepickerComponent } from '../../../shared/components/custom-datepicker/custom-datepicker.component';

@Component({ selector: 'app-fees-form', standalone: true, imports: [CommonModule, ReactiveFormsModule, RouterLink, SearchableSelectComponent, CustomDatepickerComponent], templateUrl: './fees-form.component.html', styleUrl: './fees-form.component.scss' })
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
  statusOptions: SelectOption[] = [
    { value: 'Unpaid', label: 'Unpaid' }, { value: 'Paid', label: 'Paid' }, { value: 'Partial', label: 'Partial' }
  ];

  form = this.fb.group({
    studentId:      [null as number | null, Validators.required],
    feeMasterId:    [null as number | null, Validators.required],
    amountPaid:     [0, [Validators.required, Validators.min(0)]],
    discountAmount: [0],
    fineAmount:     [0],
    paymentDate:    [''],
    status:         ['Unpaid', Validators.required],
    schoolEiin:     [this.authService.schoolEiin]
  });

  get isEdit(): boolean { return this.id !== null; }

  ngOnInit(): void {
    this.studentService.list().subscribe(s => {
      this.studentOptions = s.map(x => ({ value: x.studentId, label: `${x.firstName} ${x.lastName ?? ''} (${x.admissionNo})` }));
    });
    this.feesMasterService.list().subscribe(f => {
      this.feeMasterOptions = f.map(x => ({ value: x.feeMasterId, label: `${x.feeType ?? ''} - ${x.applicableYear ?? ''}` }));
    });
    const p = this.route.snapshot.paramMap.get('id');
    if (p) {
      this.id = +p; this.loading = true;
      this.feeService.fetch(this.id).subscribe({
        next: f => { this.form.patchValue(f as any); this.loading = false; },
        error: () => { this.loading = false; this.error = 'Failed to load.'; }
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const obs = this.isEdit
      ? this.feeService.update(this.id!, this.form.value as any)
      : this.feeService.create(this.form.value as any);
    obs.subscribe({
      next: () => this.router.navigate(['/fees']),
      error: err => { this.saving = false; this.error = err?.error?.message ?? 'Save failed.'; }
    });
  }
}
