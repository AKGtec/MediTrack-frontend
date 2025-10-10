import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  stats = {
    totalUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
    totalAppointments: 0,
    monthlyRevenue: 0,
    pendingAppointments: 0
  };

  recentActivities = [
    { type: 'user', action: 'New patient registered', time: '2 minutes ago', icon: 'person_add' },
    { type: 'appointment', action: 'Appointment scheduled', time: '15 minutes ago', icon: 'event' },
    { type: 'payment', action: 'Payment received', time: '1 hour ago', icon: 'payment' },
    { type: 'user', action: 'Doctor profile updated', time: '2 hours ago', icon: 'edit' }
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadDashboardStats();
  }

  loadDashboardStats() {
    // Mock data - replace with actual service calls
    this.stats = {
      totalUsers: 1250,
      totalDoctors: 45,
      totalPatients: 1205,
      totalAppointments: 320,
      monthlyRevenue: 45000,
      pendingAppointments: 15
    };
  }

  onQuickAction(action: string) {
    switch (action) {
      case 'add-user':
        this.router.navigate(['/admin/users']);
        break;
      case 'view-reports':
        this.router.navigate(['/admin/reports']);
        break;
      case 'manage-appointments':
        this.router.navigate(['/admin/appointments']);
        break;
      case 'billing':
        this.router.navigate(['/admin/billing']);
        break;
      case 'medical':
        this.router.navigate(['/admin/medical/lab-tests']);
        break;
      case 'notifications':
        this.router.navigate(['/admin/notifications/center']);
        break;
      default:
        console.log('Unknown action:', action);
    }
  }
}
