import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { FeePaymentService } from '../../../core/services/fee.service';
import { FeePaymentSlip } from '../../../core/models';

@Component({
  selector: 'app-fee-slip',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './fee-slip.component.html',
  styleUrl: './fee-slip.component.scss'
})
export class FeeSlipComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private feeService = inject(FeePaymentService);

  slip: FeePaymentSlip | null = null;
  loading = true;
  error = '';

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.feeService.getSlip(id).subscribe({
      next: s => { this.slip = s; this.loading = false; },
      error: () => { this.loading = false; this.error = 'Failed to load payment slip.'; }
    });
  }

  print(): void { window.print(); }
}
