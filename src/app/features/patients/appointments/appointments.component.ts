import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AppointmentDto } from '../../../core/models/appointment.models';
import { AppointmentStatus } from '../../../core/models/enums';
import { AuthStorage } from '../../../core/models/user.models';

@Component({
  selector: 'app-patient-appointments',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="appointments-container">
      <div class="appointments" *ngIf="!loading; else loadingTpl">
        <div class="header">
          <div class="title-section">
            <h1 class="page-title">My Appointments</h1>
            <p class="subtitle">Manage and view all your upcoming and past appointments</p>
          </div>
          <div class="legend">
            <div class="legend-item">
              <span class="dot scheduled"></span>
              <span class="legend-text">Scheduled</span>
            </div>
            <div class="legend-item">
              <span class="dot confirmed"></span>
              <span class="legend-text">Confirmed</span>
            </div>
            <div class="legend-item">
              <span class="dot completed"></span>
              <span class="legend-text">Completed</span>
            </div>
            <div class="legend-item">
              <span class="dot cancelled"></span>
              <span class="legend-text">Cancelled</span>
            </div>
          </div>
        </div>

        <div class="error-card" *ngIf="error">
          <svg class="error-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ error }}</span>
        </div>

        <div class="list" *ngIf="appointments.length > 0">
          <div class="appointment-card" *ngFor="let a of appointments" [class]="'appointment-card ' + statusClass(a.status)">
            <div class="card-accent"></div>
            <div class="card-content">
              <div class="main-info">
                <div class="icon-wrapper" [class]="statusClass(a.status)">
                  <svg class="calendar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div class="appointment-details">
                  <div class="date-time">{{ a.appointmentDate | date:'EEEE, MMMM d, y' }}</div>
                  <div class="time">{{ a.appointmentDate | date:'h:mm a' }}</div>
                  <div class="doctor-info">
                    <svg class="doctor-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Dr. {{ a.doctorName || a.doctorId }}</span>
                  </div>
                </div>
              </div>
              <div class="status-badge" [class]="statusClass(a.status)">
                <span class="status-text">{{ a.status }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="empty-state" *ngIf="appointments.length === 0">
          <div class="empty-icon-wrapper">
            <svg class="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 class="empty-title">No appointments yet</h3>
          <p class="empty-message">You don't have any appointments scheduled at the moment.</p>
        </div>
      </div>

      <ng-template #loadingTpl>
        <div class="loading-container">
          <div class="loading-spinner">
            <div class="spinner"></div>
          </div>
          <p class="loading-text">Loading your appointments...</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .appointments-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem 1rem;
    }

    .appointments {
      max-width: 1200px;
      margin: 0 auto;
      animation: fadeIn 0.5s ease-in;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .header {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 24px;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    }

    .title-section {
      margin-bottom: 1.5rem;
    }

    .page-title {
      margin: 0 0 0.5rem 0;
      font-weight: 800;
      font-size: 2.5rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .subtitle {
      margin: 0;
      color: #6b7280;
      font-size: 1rem;
    }

    .legend {
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #f9fafb;
      border-radius: 12px;
      transition: all 0.3s ease;
    }

    .legend-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .legend .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .legend .dot.scheduled { background: linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%); }
    .legend .dot.confirmed { background: linear-gradient(135deg, #34d399 0%, #10b981 100%); }
    .legend .dot.completed { background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%); }
    .legend .dot.cancelled { background: linear-gradient(135deg, #f87171 0%, #ef4444 100%); }

    .legend-text {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
    }

    .error-card {
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      border: 2px solid #fca5a5;
      border-radius: 16px;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      color: #991b1b;
      font-weight: 600;
      animation: slideIn 0.3s ease-out;
    }

    .error-icon {
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }

    @keyframes slideIn {
      from { transform: translateX(-20px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    .list {
      display: grid;
      gap: 1rem;
    }

    .appointment-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      animation: slideUp 0.4s ease-out;
      position: relative;
    }

    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .appointment-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    }

    .card-accent {
      height: 6px;
      width: 100%;
    }

    .appointment-card.scheduled .card-accent {
      background: linear-gradient(90deg, #38bdf8 0%, #0ea5e9 100%);
    }

    .appointment-card.confirmed .card-accent {
      background: linear-gradient(90deg, #34d399 0%, #10b981 100%);
    }

    .appointment-card.completed .card-accent {
      background: linear-gradient(90deg, #a78bfa 0%, #8b5cf6 100%);
    }

    .appointment-card.cancelled .card-accent {
      background: linear-gradient(90deg, #f87171 0%, #ef4444 100%);
    }

    .card-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem;
      gap: 1rem;
    }

    .main-info {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      flex: 1;
    }

    .icon-wrapper {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .icon-wrapper.scheduled {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    }

    .icon-wrapper.confirmed {
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
    }

    .icon-wrapper.completed {
      background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
    }

    .icon-wrapper.cancelled {
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
    }

    .calendar-icon {
      width: 28px;
      height: 28px;
      color: #374151;
    }

    .appointment-details {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .date-time {
      font-weight: 700;
      font-size: 1.125rem;
      color: #111827;
    }

    .time {
      font-size: 0.875rem;
      color: #6b7280;
      font-weight: 600;
    }

    .doctor-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #4b5563;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .doctor-icon {
      width: 16px;
      height: 16px;
    }

    .status-badge {
      padding: 0.625rem 1.25rem;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      flex-shrink: 0;
    }

    .status-badge.scheduled {
      background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
      color: #075985;
    }

    .status-badge.confirmed {
      background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
      color: #065f46;
    }

    .status-badge.completed {
      background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
      color: #5b21b6;
    }

    .status-badge.cancelled {
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      color: #991b1b;
    }

    .empty-state {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 24px;
      padding: 4rem 2rem;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    }

    .empty-icon-wrapper {
      width: 120px;
      height: 120px;
      margin: 0 auto 1.5rem;
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .empty-icon {
      width: 60px;
      height: 60px;
      color: #9ca3af;
    }

    .empty-title {
      margin: 0 0 0.75rem 0;
      font-size: 1.75rem;
      font-weight: 800;
      color: #111827;
    }

    .empty-message {
      margin: 0;
      color: #6b7280;
      font-size: 1.125rem;
    }

    .loading-container {
      max-width: 1200px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 24px;
      padding: 4rem 2rem;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    }

    .loading-spinner {
      display: flex;
      justify-content: center;
      margin-bottom: 1.5rem;
    }

    .spinner {
      width: 60px;
      height: 60px;
      border: 4px solid #e5e7eb;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-text {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    @media (max-width: 768px) {
      .appointments-container {
        padding: 1rem;
      }

      .header {
        padding: 1.5rem;
      }

      .page-title {
        font-size: 2rem;
      }

      .legend {
        gap: 0.75rem;
      }

      .legend-item {
        padding: 0.375rem 0.75rem;
      }

      .card-content {
        flex-direction: column;
        align-items: flex-start;
      }

      .status-badge {
        align-self: flex-end;
      }
    }
  `]
})
export class PatientAppointmentsComponent implements OnInit, OnDestroy {
  appointments: AppointmentDto[] = [];
  loading = false;
  error: string | null = null;
  sub?: Subscription;

  constructor(private appointmentsService: AppointmentService, private route: ActivatedRoute) {}

  ngOnInit() {
    const auth = AuthStorage.get();
    const patientId = auth?.user?.userId;

    if (!patientId) {
      this.error = 'Unable to identify the logged-in patient. Please log in again.';
      return;
    }

    this.load(patientId);
  }

  ngOnDestroy() { 
    this.sub?.unsubscribe(); 
  }

  load(patientId: number) {
    this.loading = true;
    this.error = null;
    this.sub = this.appointmentsService.getAppointmentsByPatient(patientId).subscribe({
      next: (data) => { 
        this.appointments = data; 
        this.loading = false; 
      },
      error: (err) => { 
        this.error = 'Failed to load appointments.'; 
        this.loading = false; 
        console.error(err); 
      }
    });
  }

  statusClass(status: AppointmentStatus) {
    const statusStr = status.toString().toLowerCase();
    switch (statusStr) {
      case 'scheduled': return 'scheduled';
      case 'confirmed': return 'confirmed';
      case 'completed': return 'completed';
      case 'cancelled': return 'cancelled';
      default: return 'scheduled';
    }
  }
}