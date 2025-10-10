import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationPanelComponent } from '../../shared/components/notification-panel/notification-panel.component';

@Component({
  selector: 'app-doctor-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationPanelComponent],
  template: `
    <div class="layout">
      <!-- Animated Background -->
      <div class="bg-animation">
        <div class="gradient-orb orb-1"></div>
        <div class="gradient-orb orb-2"></div>
        <div class="gradient-orb orb-3"></div>
      </div>

      <aside class="sidebar">
        <!-- Brand Section -->
        <div class="brand">
          <div class="logo-container">
            <div class="logo-image">
              <img src="https://img.freepik.com/premium-vector/medical-center-circle-badge-modern-logo-vector-icon-design-line-style_1183619-140.jpg?semt=ais_hybrid&w=740&q=80" alt="MediTrack logo" />
            </div>
            <div class="brand-text">
              <span class="logo">MediTrack</span>
              <span class="role">Doctor Portal</span>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="nav">
          <a routerLink="/doctor" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="nav-item">
            <div class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
            </div>
            <span class="nav-text">Dashboard</span>
            <div class="nav-indicator"></div>
          </a>

          <a routerLink="/doctor/doctors/schedule" routerLinkActive="active" class="nav-item">
            <div class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
                <circle cx="12" cy="14" r="2"/>
                <line x1="12" y1="14" x2="12" y2="16"/>
              </svg>
            </div>
            <span class="nav-text">Schedule</span>
            <div class="nav-indicator"></div>
          </a>

          <a routerLink="/doctor/doctors/patients" routerLinkActive="active" class="nav-item">
            <div class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <span class="nav-text">Patients</span>
            <div class="nav-indicator"></div>
          </a>

          <a routerLink="/doctor/doctors/appointments" routerLinkActive="active" class="nav-item">
            <div class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
                <path d="M8 14h.01"/>
                <path d="M12 14h.01"/>
                <path d="M16 14h.01"/>
                <path d="M8 18h.01"/>
                <path d="M12 18h.01"/>
                <path d="M16 18h.01"/>
              </svg>
            </div>
            <span class="nav-text">Appointments</span>
            <div class="nav-indicator"></div>
          </a>

          <a routerLink="/doctor/doctors/profile" routerLinkActive="active" class="nav-item">
            <div class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <span class="nav-text">Profile</span>
            <div class="nav-indicator"></div>
          </a>

          <a routerLink="/doctor/doctors/prescriptions" routerLinkActive="active" class="nav-item">
  <div class="nav-icon">
    <svg xmlns="http://www.w3.org/2000/svg" 
         viewBox="0 0 24 24" 
         fill="none" 
         stroke="currentColor" 
         stroke-width="2" 
         stroke-linecap="round" 
         stroke-linejoin="round">
      <!-- Capsule -->
      <path d="M7.5 7.5l9 9"/>
      <rect x="3" y="3" width="8" height="12" rx="4" transform="rotate(45 7 7)"/>
      <rect x="13" y="9" width="8" height="12" rx="4" transform="rotate(45 17 13)"/>
    </svg>
  </div>
  <span class="nav-text">Prescriptions</span>
  <div class="nav-indicator"></div>
</a>


          <a routerLink="/doctor/doctors/medical-record" routerLinkActive="active" class="nav-item">
  <div class="nav-icon">
    <svg xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 24 24"
         fill="none"
         stroke="currentColor"
         stroke-width="2"
         stroke-linecap="round"
         stroke-linejoin="round">
      <!-- Clipboard shape -->
      <path d="M9 2h6a2 2 0 0 1 2 2v2h-2V4H9v2H7V4a2 2 0 0 1 2-2z"/>
      <rect x="4" y="6" width="16" height="16" rx="2" ry="2"/>
      <!-- Medical cross -->
      <line x1="12" y1="11" x2="12" y2="17"/>
      <line x1="9" y1="14" x2="15" y2="14"/>
    </svg>
  </div>
  <span class="nav-text">Medical record</span>
  <div class="nav-indicator"></div>
</a>

          <a routerLink="/doctor/billing/invoices" routerLinkActive="active" class="nav-item">
  <div class="nav-icon">
    <svg xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 24 24"
         fill="none"
         stroke="currentColor"
         stroke-width="2"
         stroke-linecap="round"
         stroke-linejoin="round">
      <!-- Billing/payment -->
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  </div>
  <span class="nav-text">Billing</span>
  <div class="nav-indicator"></div>
</a>

          <a routerLink="/doctor/medical/lab-tests" routerLinkActive="active" class="nav-item">
  <div class="nav-icon">
    <svg xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 24 24"
         fill="none"
         stroke="currentColor"
         stroke-width="2"
         stroke-linecap="round"
         stroke-linejoin="round">
      <!-- Test tube -->
      <path d="M14.5 2v6.5c0 .8-.7 1.5-1.5 1.5h-5c-.8 0-1.5-.7-1.5-1.5V2"/>
      <path d="M8.5 2h7"/>
      <path d="M9 12.5v6"/>
      <path d="M15 12.5v6"/>
      <path d="M7 18.5h10"/>
    </svg>
  </div>
  <span class="nav-text">Lab Tests</span>
  <div class="nav-indicator"></div>
</a>

          <a routerLink="/doctor/notifications/center" routerLinkActive="active" class="nav-item">
  <div class="nav-icon">
    <svg xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 24 24"
         fill="none"
         stroke="currentColor"
         stroke-width="2"
         stroke-linecap="round"
         stroke-linejoin="round">
      <!-- Notification bell -->
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  </div>
  <span class="nav-text">Notifications</span>
  <div class="nav-indicator"></div>
</a>

        </nav>

        <!-- Spacer -->
        <div class="spacer"></div>

 

        <!-- Logout -->
        <a class="logout" routerLink="/auth/login">
          <div class="logout-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </div>
          <span>Sign Out</span>
        </a>
      </aside>

      <main class="content">
        <!-- Top Bar -->
        <header class="topbar">
          <div class="topbar-left">
            <button class="menu-toggle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <h1 class="page-title">Doctor Dashboard</h1>
          </div>
          
          <div class="topbar-right">
            <button class="notification-btn" (click)="openNotifications()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span class="notification-badge" *ngIf="unreadCount > 0">{{ unreadCount }}</span>
            </button>
            
            <button class="settings-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
              </svg>
            </button>
          </div>
        </header>

        <!-- Page Content -->
        <section class="page">
          <div class="page-container">
            <router-outlet></router-outlet>
          </div>
        </section>
      </main>

      <!-- Notification Panel -->
      <app-notification-panel></app-notification-panel>
    </div>
  `,
  styles: [`
    :host { 
      display: block; 
      height: 100vh; 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    * {
      box-sizing: border-box;
    }

    /* Layout */
    .layout { 
      display: flex; 
      min-height: 100vh; 
      position: relative;
      overflow: hidden;
    }

    /* Animated Background */
    .bg-animation {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: -1;
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }

    .gradient-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(40px);
      opacity: 0.4;
      animation: float 6s ease-in-out infinite;
    }

    .orb-1 {
      width: 300px;
      height: 300px;
      background: linear-gradient(45deg, #4facfe, #00f2fe);
      top: 10%;
      left: 10%;
      animation-delay: 0s;
    }

    .orb-2 {
      width: 200px;
      height: 200px;
      background: linear-gradient(45deg, #43e97b, #38f9d7);
      top: 60%;
      right: 20%;
      animation-delay: 2s;
    }

    .orb-3 {
      width: 150px;
      height: 150px;
      background: linear-gradient(45deg, #fa709a, #fee140);
      bottom: 20%;
      left: 50%;
      animation-delay: 4s;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(5deg); }
    }

    /* Sidebar */
    .sidebar { 
      width: 280px; 
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border-right: 1px solid rgba(255, 255, 255, 0.1);
      color: #ffffff; 
      display: flex; 
      flex-direction: column; 
      padding: 2rem 1.5rem;
      position: relative;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .sidebar::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
      pointer-events: none;
    }

    /* Brand */
    .brand { 
      margin-bottom: 3rem;
    }

    .logo-container {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .logo-image {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.2);
      box-shadow: 0 4px 16px rgba(79, 172, 254, 0.3);
    }

    .logo-image img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .logo { 
      font-weight: 700; 
      font-size: 1.4rem; 
      color: #ffffff;
      letter-spacing: -0.5px;
    }

    .role { 
      font-size: 0.8rem; 
      color: rgba(255, 255, 255, 0.7);
      font-weight: 500;
    }

    /* Navigation */
    .nav { 
      display: flex; 
      flex-direction: column; 
      gap: 0.5rem; 
    }

    .nav-item { 
      display: flex; 
      align-items: center; 
      gap: 1rem; 
      padding: 1rem 1.25rem; 
      color: rgba(255, 255, 255, 0.8); 
      text-decoration: none; 
      border-radius: 16px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      font-weight: 500;
    }

    .nav-item::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .nav-item:hover::before {
      opacity: 1;
    }

    .nav-icon {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s ease;
    }

    .nav-icon svg {
      width: 100%;
      height: 100%;
    }

    .nav-text {
      font-size: 0.95rem;
      flex: 1;
    }

    .nav-indicator {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: transparent;
      transition: all 0.3s ease;
    }

    .nav-item:hover { 
      color: #ffffff;
      transform: translateX(4px);
    }

    .nav-item:hover .nav-icon {
      transform: scale(1.1);
    }

    .nav-item.active { 
      background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.1) 100%);
      color: #ffffff;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .nav-item.active .nav-indicator {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      box-shadow: 0 0 10px rgba(79, 172, 254, 0.5);
    }

    /* Spacer */
    .spacer { 
      flex: 1; 
    }

    /* User Profile */
    .user-profile {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 1rem;
    }

    .profile-avatar {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .profile-avatar svg {
      width: 20px;
      height: 20px;
      color: white;
    }

    .profile-info {
      display: flex;
      flex-direction: column;
    }

    .profile-name {
      font-size: 0.9rem;
      font-weight: 600;
      color: #ffffff;
    }

    .profile-email {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.6);
    }

    /* Logout */
    .logout { 
      display: flex; 
      align-items: center; 
      gap: 1rem; 
      color: rgba(255, 99, 99, 0.9); 
      text-decoration: none; 
      padding: 1rem 1.25rem; 
      border-radius: 16px;
      transition: all 0.3s ease;
      font-weight: 500;
      border: 1px solid rgba(255, 99, 99, 0.2);
    }

    .logout-icon {
      width: 20px;
      height: 20px;
    }

    .logout:hover { 
      background: rgba(255, 99, 99, 0.1);
      color: #ff6363;
      transform: translateX(4px);
    }

    /* Content */
    .content { 
      flex: 1; 
      display: flex; 
      flex-direction: column;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(20px);
    }

    /* Top Bar */
    .topbar { 
      height: 80px; 
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex; 
      align-items: center; 
      justify-content: space-between;
      padding: 0 2rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    }

    .topbar-left {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .menu-toggle {
      background: none;
      border: none;
      color: #ffffff;
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background: rgba(255, 255, 255, 0.1);
    }

    .menu-toggle:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: scale(1.05);
    }

    .menu-toggle svg {
      width: 20px;
      height: 20px;
    }

    .page-title { 
      font-size: 1.5rem; 
      font-weight: 700;
      margin: 0; 
      color: #ffffff;
      letter-spacing: -0.5px;
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .notification-btn,
    .settings-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #ffffff;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
    }

    .notification-btn:hover,
    .settings-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
    }

    .notification-btn svg,
    .settings-btn svg {
      width: 20px;
      height: 20px;
    }

    .notification-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
      color: white;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.2rem 0.5rem;
      border-radius: 10px;
      min-width: 18px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
    }

    /* Page */
    .page { 
      flex: 1;
      overflow-y: auto;
    }

    .page-container {
      padding: 2rem;
      max-width: 100%;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .sidebar {
        width: 260px;
        padding: 1.5rem 1rem;
      }
      
      .topbar {
        padding: 0 1rem;
      }
      
      .page-container {
        padding: 1rem;
      }
    }

    /* Smooth scrolling */
    .page::-webkit-scrollbar {
      width: 8px;
    }

    .page::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
    }

    .page::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
    }

    .page::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  `]
})
export class DoctorLayoutComponent {
  @ViewChild(NotificationPanelComponent) notificationPanel!: NotificationPanelComponent;
  
  // TODO: Replace with actual user ID from auth service
  currentUserId = 1;

  openNotifications(): void {
    this.notificationPanel.openPanel(this.currentUserId);
  }

  get unreadCount(): number {
    return this.notificationPanel?.unreadCount || 0;
  }
}
