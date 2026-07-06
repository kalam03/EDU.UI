import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';

const MOBILE_BREAKPOINT = 992;

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent implements OnInit {
  sidebarCollapsed = false;
  mobileMenuOpen = false;
  isMobile = false;

  constructor(private router: Router) {
    this.updateIsMobile();
  }

  ngOnInit(): void {
    // Close the off-canvas drawer automatically after any navigation on mobile.
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        this.mobileMenuOpen = false;
      });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateIsMobile();
  }

  private updateIsMobile(): void {
    const wasMobile = this.isMobile;
    this.isMobile = typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT;
    if (wasMobile && !this.isMobile) {
      this.mobileMenuOpen = false;
    }
  }

  toggleSidebar(): void {
    if (this.isMobile) {
      this.mobileMenuOpen = !this.mobileMenuOpen;
    } else {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    }
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }
}
