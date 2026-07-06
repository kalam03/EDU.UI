import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent } from '../../shared/components/icon/icon.component';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  children?: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Input() mobileOpen = false;
  @Output() toggleCollapse = new EventEmitter<void>();
  @Output() navigate = new EventEmitter<void>();

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'bar-chart-2', route: '/dashboard' },
    { label: 'Students', icon: 'graduation-cap', route: '/students' },
    { label: 'Staff', icon: 'user-check', route: '/staff' },
    { label: 'Classes', icon: 'building', route: '/classes' },
    { label: 'Sections', icon: 'clipboard', route: '/sections' },
    { label: 'Groups', icon: 'users', route: '/groups' },
    { label: 'Subjects', icon: 'book-open', route: '/subjects' },
    { label: 'Attendance', icon: 'check-square', route: '/attendance' },
    { label: 'Exams', icon: 'file-text', route: '/exams' },
    { label: 'Marks', icon: 'award', route: '/marks' },
    { label: 'Fees', icon: 'dollar-sign', route: '/fees' },
    { label: 'Marksheet', icon: 'file', route: '/marksheet' },
    { label: 'School Info', icon: 'home', route: '/school-info' }
  ];
}
