import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  @Input() sidebarCollapsed = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  authService = inject(AuthService);
  router = inject(Router);
  showUserMenu = false;

  get username(): string {
    return this.authService.currentUser?.username ?? 'User';
  }

  logout(): void {
    this.authService.logout();
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }
}
