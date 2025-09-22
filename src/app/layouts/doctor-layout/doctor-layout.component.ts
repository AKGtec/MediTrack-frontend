import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-doctor-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">
          <span class="logo">MediTrack</span>
          <span class="role">Doctor</span>
        </div>
        <nav class="nav">
          <a routerLink="/doctor" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            <i class="icon">dashboard</i>
            <span>Dashboard</span>
          </a>
          <a routerLink="/doctors/schedule" routerLinkActive="active">
            <i class="icon">event</i>
            <span>Schedule</span>
          </a>
          <a routerLink="/doctors/patients" routerLinkActive="active">
            <i class="icon">groups</i>
            <span>Patients</span>
          </a>
          <a routerLink="/doctors/profile" routerLinkActive="active">
            <i class="icon">person</i>
            <span>Profile</span>
          </a>
        </nav>
        <div class="spacer"></div>
        <a class="logout" routerLink="/auth/login">
          <i class="icon">logout</i>
          <span>Logout</span>
        </a>
      </aside>
      <main class="content">
        <header class="topbar">
          <h1>Doctor Portal</h1>
        </header>
        <section class="page">
          <router-outlet></router-outlet>
        </section>
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; }
    .layout { display: flex; min-height: 100vh; background: #f5f7fa; }
    .sidebar { width: 240px; background: #0f172a; color: #e5e7eb; display: flex; flex-direction: column; padding: 1rem; }
    .brand { display: flex; flex-direction: column; gap: 0.25rem; padding: 0.5rem 0.75rem; margin-bottom: 1rem; }
    .brand .logo { font-weight: 700; font-size: 1.25rem; color: #fff; }
    .brand .role { font-size: 0.85rem; color: #9ca3af; }
    .nav { display: flex; flex-direction: column; gap: 0.25rem; }
    .nav a { display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem 0.75rem; color: #e5e7eb; text-decoration: none; border-radius: 8px; }
    .nav a .icon { font-size: 20px; }
    .nav a:hover { background: rgba(255,255,255,0.06); }
    .nav a.active { background: rgba(255,255,255,0.12); color: #fff; }
    .spacer { flex: 1; }
    .logout { display: flex; align-items: center; gap: 0.5rem; color: #fca5a5; text-decoration: none; padding: 0.5rem 0.75rem; border-radius: 8px; }
    .logout:hover { background: rgba(252, 165, 165, 0.12); }
    .content { flex: 1; display: flex; flex-direction: column; }
    .topbar { height: 56px; background: #ffffff; box-shadow: 0 1px 2px rgba(0,0,0,0.06); display: flex; align-items: center; padding: 0 1rem; }
    .topbar h1 { font-size: 1.125rem; margin: 0; color: #111827; }
    .page { padding: 1rem; }
  `]
})
export class DoctorLayoutComponent {}
