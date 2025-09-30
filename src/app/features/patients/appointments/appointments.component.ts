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
    <div class="appointments" *ngIf="!loading; else loadingTpl">
      <div class="header">
        <h1 class="page-title">My Appointments</h1>
        <div class="legend">
          <span><span class="dot scheduled"></span> Scheduled</span>
          <span><span class="dot confirmed"></span> Confirmed</span>
          <span><span class="dot completed"></span> Completed</span>
          <span><span class="dot cancelled"></span> Cancelled</span>
        </div>
      </div>

      <div class="error" *ngIf="error">{{ error }}</div>

      <div class="list" *ngIf="appointments.length > 0">
        <div class="item" *ngFor="let a of appointments" [class]="'item ' + statusClass(a.status)">
          <div class="main">
            <div class="date">{{ a.appointmentDate | date:'medium' }}</div>
            <div class="with">with Dr. {{ a.doctorName || a.doctorId }}</div>
          </div>
          <div class="status">
            <span class="badge" [class]="statusClass(a.status)">{{ a.status }}</span>
          </div>
        </div>
      </div>

      <div class="empty" *ngIf="appointments.length === 0">
        <div class="empty-icon"><i class="icon">event_busy</i></div>
        <div>No appointments found.</div>
      </div>
    </div>

    <ng-template #loadingTpl>
      <div class="loading">Loading appointments...</div>
    </ng-template>
  `,
  styles: [`
    .appointments { padding: 1rem; }
    .page-title { margin: 0; font-weight: 700; font-size: 1.25rem; }
    .legend { display: flex; gap: 1rem; color: #6b7280; }
    .legend .dot { display: inline-block; width: 10px; height: 10px; border-radius: 999px; margin-right: 0.375rem; }
    .legend .dot.scheduled { background: #38bdf8; }
    .legend .dot.confirmed { background: #34d399; }
    .legend .dot.completed { background: #8b5cf6; }
    .legend .dot.cancelled { background: #f87171; }

    .list { display: grid; gap: 0.5rem; margin-top: 1rem; }
    .item { display: flex; align-items: center; justify-content: space-between; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 0.5rem 0.75rem; }
    .item .date { font-weight: 700; }
    .badge { border-radius: 999px; padding: 0.125rem 0.5rem; font-size: 0.75rem; border: 1px solid transparent; }
    .item.scheduled .badge { background: #e0f2fe; color: #075985; border-color: #bae6fd; }
    .item.confirmed .badge { background: #dcfce7; color: #065f46; border-color: #bbf7d0; }
    .item.completed .badge { background: #ede9fe; color: #5b21b6; border-color: #ddd6fe; }
    .item.cancelled .badge { background: #fee2e2; color: #991b1b; border-color: #fecaca; }

    .empty { text-align: center; padding: 1.5rem; color: #6b7280; }
    .empty-icon { font-size: 2rem; color: #9ca3af; margin-bottom: 0.25rem; }
    .loading { padding: 1rem; }
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

  ngOnDestroy() { this.sub?.unsubscribe(); }

  load(patientId: number) {
    this.loading = true;
    this.error = null;
    this.sub = this.appointmentsService.getAppointmentsByPatient(patientId).subscribe({
      next: (data) => { this.appointments = data; this.loading = false; },
      error: (err) => { this.error = 'Failed to load appointments.'; this.loading = false; console.error(err); }
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
