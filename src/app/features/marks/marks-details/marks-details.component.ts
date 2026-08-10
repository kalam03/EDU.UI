import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MarkService } from '../../../core/services/mark.service';
import { Mark } from '../../../core/models';

@Component({
  selector: 'app-marks-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './marks-details.component.html',
  styleUrl: './marks-details.component.scss'
})
export class MarksDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private markService = inject(MarkService);

  mark?: Mark;
  loading = true;
  error = '';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.error = 'Invalid mark record.';
      this.loading = false;
      return;
    }

    this.markService.fetch(id).subscribe({
      next: mark => { this.mark = mark; this.loading = false; },
      error: () => { this.error = 'Unable to load the mark record.'; this.loading = false; }
    });
  }
}
