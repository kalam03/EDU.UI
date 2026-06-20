import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  children?: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Output() toggleCollapse = new EventEmitter<void>();

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: '&#128200;', route: '/dashboard' },
    { label: 'Students', icon: '&#127891;', route: '/students' },
    { label: 'Staff', icon: '&#128104;&#8205;&#127979;', route: '/staff' },
    { label: 'Classes', icon: '&#127970;', route: '/classes' },
    { label: 'Sections', icon: '&#128203;', route: '/sections' },
    { label: 'Groups', icon: '&#128101;', route: '/groups' },
    { label: 'Subjects', icon: '&#128218;', route: '/subjects' },
    { label: 'Attendance', icon: '&#9989;', route: '/attendance' },
    { label: 'Exams', icon: '&#128221;', route: '/exams' },
    { label: 'Marks', icon: '&#127942;', route: '/marks' },
    { label: 'Fees', icon: '&#128176;', route: '/fees' },
    { label: 'School Info', icon: '&#127968;', route: '/school-info' }
  ];
}
