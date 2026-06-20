import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { GroupService } from '../../../core/services/group.service';
import { Group } from '../../../core/models';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-groups-list',
  standalone: true,
  imports: [CommonModule, RouterLink, DataTableComponent],
  templateUrl: './groups-list.component.html',
  styleUrl: './groups-list.component.scss'
})
export class GroupsListComponent implements OnInit {
  private groupService = inject(GroupService);
  private router = inject(Router);
  groups: Group[] = [];
  loading = true;
  columns: TableColumn[] = [
    { key: 'groupId',   label: '#' },
    { key: 'classId',   label: 'Class ID' },
    { key: 'groupName', label: 'Group Name' },
    { key: 'authStatus',label: 'Status' }
  ];
  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading = true;
    this.groupService.list().subscribe({ next: d => { this.groups = d; this.loading = false; }, error: () => { this.loading = false; } });
  }
  onEdit(row: Record<string, unknown>): void { this.router.navigate(['/groups', row['groupId'], 'edit']); }
  onDelete(row: Record<string, unknown>): void {
    if (confirm('Delete group?')) this.groupService.delete(row['groupId'] as number).subscribe(() => this.load());
  }
}
