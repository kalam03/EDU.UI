import { Component, OnInit, inject } from '@angular/core';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GroupService } from '../../../core/services/group.service';
import { AuthService } from '../../../core/services/auth.service';
import { ClassService } from '../../../core/services/class.service';
import { SelectOption, SearchableSelectComponent } from '../../../common/searchable-select/searchable-select.component';

@Component({
  selector: 'app-groups-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SearchableSelectComponent, IconComponent],
  templateUrl: './groups-form.component.html',
  styleUrl: './groups-form.component.scss'
})
export class GroupsFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private groupService = inject(GroupService);
  private classService = inject(ClassService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  id: number | null = null;
  loading = false; saving = false; error = '';
  classOptions: SelectOption[] = [];
  form = this.fb.group({ groupName: ['', Validators.required], classId: [null as number | null, Validators.required], schoolEiin: [this.authService.schoolEiin] });
  get isEdit(): boolean { return this.id !== null; }
  ngOnInit(): void {
    this.classService.list().subscribe(c => { this.classOptions = c.map(x => ({ value: x.classId, label: x.className })); });
    const p = this.route.snapshot.paramMap.get('id');
    if (p) {
      this.id = +p; this.loading = true;
      this.groupService.fetch(this.id).subscribe({ next: g => { this.form.patchValue(g as any); this.loading = false; }, error: () => { this.loading = false; } });
    }
  }
  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const obs = this.isEdit ? this.groupService.update(this.id!, this.form.value as any) : this.groupService.create(this.form.value as any);
    obs.subscribe({ next: () => this.router.navigate(['/groups']), error: err => { this.saving = false; this.error = err?.error?.message ?? 'Save failed.'; } });
  }
}
