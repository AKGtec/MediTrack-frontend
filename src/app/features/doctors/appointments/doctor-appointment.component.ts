import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { AppointmentService } from '../../../core/services/appointment.service';
import { UsersService } from '../../../core/services/users.service';
import { AppointmentDto } from '../../../core/models/appointment.models';
import { AppointmentStatus } from '../../../core/models/enums';
import { AuthStorage } from '../../../core/models/user.models';
import { PatientDto } from '../../../core/models/patient.models';

@Component({
  selector: 'app-doctor-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="appointments-container">
      <!-- Header -->
      <div class="header">
        <h1>Doctor Appointments</h1>
        <div class="header-actions">
          <select class="filter-select" [(ngModel)]="selectedStatus" (change)="filterAppointments()">
            <option [value]="''">All Statuses</option>
            <option [value]="AppointmentStatus.Scheduled">Scheduled</option>
            <option [value]="AppointmentStatus.NoShow">No Show</option>
            <option [value]="AppointmentStatus.Cancelled">Cancelled</option>
            <option [value]="AppointmentStatus.Completed">Completed</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading appointments...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="error-message">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>{{ error }}</span>
      </div>

      <!-- Appointments List -->
      <div *ngIf="!loading && !error" class="appointments-list">
        <div *ngIf="filteredAppointments.length === 0" class="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <h3>No appointments found</h3>
          <p>There are no appointments matching your criteria.</p>
        </div>

        <div *ngFor="let appointment of filteredAppointments" class="appointment-card">
          <div class="card-header">
            <div class="patient-info">
              <div class="avatar">{{ getInitials(appointment.patientName) }}</div>
              <div>
                <h3>{{ appointment.patientName }}</h3>
                <p class="patient-id">Patient ID: #{{ appointment.patientId }}</p>
              </div>
            </div>
            <span [class]="'status-badge status-' + getStatusString(appointment.status).toLowerCase()">
              {{ getStatusString(appointment.status) }}
            </span>
          </div>

          <div class="card-body">
            <div class="info-row">
              <div class="info-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <div>
                  <span class="label">Doctor</span>
                  <span class="value">{{ getDoctorName(appointment) }}</span>
                </div>
              </div>

              <div class="info-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <div>
                  <span class="label">Date & Time</span>
                  <span class="value">{{ formatDate(appointment.appointmentDate) }}</span>
                </div>
              </div>
            </div>

            <div class="info-row">
              <div class="info-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <div>
                  <span class="label">Created</span>
                  <span class="value">{{ formatDate(appointment.createdAt) }}</span>
                </div>
              </div>

              <div class="info-item" *ngIf="appointment.updatedAt">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
                <div>
                  <span class="label">Updated</span>
                  <span class="value">{{ formatDate(appointment.updatedAt) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <button class="btn btn-secondary" (click)="viewDetails(appointment)">
              View Details
            </button>
            <button 
              *ngIf="appointment.status === AppointmentStatus.Scheduled"
              class="btn btn-primary" 
              (click)="confirmAppointment(appointment)">
              Confirm
            </button>
            <button 
              *ngIf="appointment.status !== AppointmentStatus.Cancelled && appointment.status !== AppointmentStatus.Completed"
              class="btn btn-danger" 
              (click)="cancelAppointment(appointment)">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Details Popup -->
    <div *ngIf="showDetailsPopup" class="popup-overlay" (click)="closeDetails()">
      <div class="popup-content" (click)="$event.stopPropagation()">
        <div class="popup-header">
          <h2>Appointment Details</h2>
          <button class="popup-close" (click)="closeDetails()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="popup-body">
          <div *ngIf="selectedAppointment" class="details-grid">
            <!-- Patient Information -->
            <div class="details-section">
              <h3 class="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Patient Information
              </h3>
              <div class="details-row">
                <span class="detail-label">Name:</span>
                <span class="detail-value">{{ selectedAppointment.patientName || 'Not available' }}</span>
              </div>
              <div class="details-row">
                <span class="detail-label">Patient ID:</span>
                <span class="detail-value">#{{ selectedAppointment.patientId || 'N/A' }}</span>
              </div>
              <div class="details-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">{{ getPatientEmail() }}</span>
              </div>
              <div class="details-row">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">{{ getPatientPhone() }}</span>
              </div>
              <div class="details-row" *ngIf="getPatientAdditionalInfo()">
                <span class="detail-label">Additional Info:</span>
                <span class="detail-value">{{ getPatientAdditionalInfo() }}</span>
              </div>
            </div>

            <!-- Appointment Information -->
            <div class="details-section">
              <h3 class="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Appointment Information
              </h3>
              <div class="details-row">
                <span class="detail-label">Status:</span>
                <span [class]="'status-badge status-' + getStatusString(selectedAppointment.status).toLowerCase()">
                  {{ getStatusString(selectedAppointment.status) }}
                </span>
              </div>
              <div class="details-row">
                <span class="detail-label">Appointment Date:</span>
                <span class="detail-value">{{ formatDate(selectedAppointment.appointmentDate) }}</span>
              </div>
              <div class="details-row">
                <span class="detail-label">Doctor:</span>
                <span class="detail-value">{{ getDoctorName(selectedAppointment) }}</span>
              </div>
              <div class="details-row">
                <span class="detail-label">Appointment ID:</span>
                <span class="detail-value">#{{ selectedAppointment.appointmentId || 'N/A' }}</span>
              </div>
            </div>

            <!-- Timestamps -->
            <div class="details-section">
              <h3 class="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Timestamps
              </h3>
              <div class="details-row">
                <span class="detail-label">Created:</span>
                <span class="detail-value">{{ formatDate(selectedAppointment.createdAt) }}</span>
              </div>
              <div class="details-row" *ngIf="selectedAppointment.updatedAt">
                <span class="detail-label">Last Updated:</span>
                <span class="detail-value">{{ formatDate(selectedAppointment.updatedAt) }}</span>
              </div>
            </div>

            <!-- Additional Notes -->
            <div class="details-section">
              <h3 class="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                Notes
              </h3>
              <div class="notes-content">
                {{ getAppointmentNotes() }}
              </div>
            </div>
          </div>
        </div>

        <div class="popup-footer">
          <button class="btn btn-secondary" (click)="closeDetails()">Close</button>
          <button 
            *ngIf="selectedAppointment?.status === AppointmentStatus.Scheduled"
            class="btn btn-primary" 
            (click)="confirmAppointment(selectedAppointment!)">
            Confirm Appointment
          </button>
          <button 
            *ngIf="selectedAppointment?.status !== AppointmentStatus.Cancelled && selectedAppointment?.status !== AppointmentStatus.Completed"
            class="btn btn-danger" 
            (click)="cancelAppointment(selectedAppointment!)">
            Cancel Appointment
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .appointments-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .filter-select {
      padding: 0.5rem 1rem;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      font-size: 0.95rem;
      background: white;
      cursor: pointer;
      transition: all 0.2s;
    }

    .filter-select:hover {
      border-color: #3b82f6;
    }

    .filter-select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      color: #6b7280;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #f3f4f6;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      color: #dc2626;
      margin-bottom: 1rem;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #6b7280;
    }

    .empty-state svg {
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-state h3 {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
      color: #374151;
    }

    .empty-state p {
      margin: 0;
      font-size: 0.95rem;
    }

    .appointments-list {
      display: grid;
      gap: 1.5rem;
    }

    .appointment-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.2s;
    }

    .appointment-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      border-color: #d1d5db;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #f3f4f6;
    }

    .patient-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 1.1rem;
    }

    .patient-info h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #1a1a1a;
    }

    .patient-id {
      margin: 0.25rem 0 0 0;
      font-size: 0.85rem;
      color: #6b7280;
    }

    .status-badge {
      padding: 0.375rem 0.875rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-scheduled {
      background: #dbeafe;
      color: #1e40af;
    }

    .status-completed {
      background: #d1fae5;
      color: #065f46;
    }

    .status-cancelled {
      background: #fee2e2;
      color: #991b1b;
    }

    .status-noshow {
      background: #fef3c7;
      color: #92400e;
    }

    .card-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .info-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.25rem;
    }

    .info-item {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
    }

    .info-item svg {
      color: #6b7280;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .info-item .label {
      display: block;
      font-size: 0.8rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.25rem;
    }

    .info-item .value {
      display: block;
      font-size: 0.95rem;
      color: #1a1a1a;
      font-weight: 500;
    }

    .card-footer {
      display: flex;
      gap: 0.75rem;
      padding: 1.5rem;
      background: #f9fafb;
      border-top: 1px solid #f3f4f6;
    }

    .btn {
      padding: 0.625rem 1.25rem;
      border: none;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      flex: 1;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
    }

    .btn-secondary {
      background: white;
      color: #374151;
      border: 1px solid #e5e7eb;
    }

    .btn-secondary:hover {
      background: #f9fafb;
      border-color: #d1d5db;
    }

    .btn-danger {
      background: #ef4444;
      color: white;
    }

    .btn-danger:hover {
      background: #dc2626;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
    }

    .btn:active {
      transform: translateY(0);
    }

    /* Popup Styles */
    .popup-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
      animation: fadeIn 0.2s ease-out;
    }

    .popup-content {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      animation: slideIn 0.2s ease-out;
    }

    .popup-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .popup-header h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #1a1a1a;
    }

    .popup-close {
      background: none;
      border: none;
      padding: 0.5rem;
      border-radius: 6px;
      cursor: pointer;
      color: #6b7280;
      transition: all 0.2s;
    }

    .popup-close:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .popup-body {
      padding: 2rem;
    }

    .popup-footer {
      display: flex;
      gap: 0.75rem;
      padding: 1.5rem 2rem;
      border-top: 1px solid #e5e7eb;
      background: #f9fafb;
    }

    .popup-footer .btn {
      flex: none;
      min-width: 120px;
    }

    .details-grid {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .details-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #374151;
    }

    .section-title svg {
      color: #6b7280;
    }

    .details-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.5rem 0;
    }

    .detail-label {
      font-weight: 500;
      color: #374151;
      min-width: 120px;
    }

    .detail-value {
      color: #1a1a1a;
      font-weight: 400;
    }

    .notes-content {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
      color: #374151;
      line-height: 1.5;
      min-height: 80px;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @media (max-width: 768px) {
      .appointments-container {
        padding: 1rem;
      }

      .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .header h1 {
        font-size: 1.5rem;
      }

      .info-row {
        grid-template-columns: 1fr;
      }

      .card-footer {
        flex-direction: column;
      }

      .popup-content {
        margin: 1rem;
        max-height: calc(100vh - 2rem);
      }

      .popup-header,
      .popup-body,
      .popup-footer {
        padding: 1rem 1.5rem;
      }

      .details-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
      }

      .detail-label {
        min-width: auto;
      }

      .popup-footer {
        flex-direction: column;
      }

      .popup-footer .btn {
        min-width: auto;
      }
    }
  `]
})
export class DoctorAppointmentsComponent implements OnInit, OnDestroy {
  private readonly appointmentService = inject(AppointmentService);
  private readonly usersService = inject(UsersService);

  // Expose enum to template
  readonly AppointmentStatus = AppointmentStatus;

  appointments: AppointmentDto[] = [];
  filteredAppointments: AppointmentDto[] = [];
  selectedStatus: AppointmentStatus | '' = '';
  loading = true;
  error: string | null = null;
  doctorId: number | null = null;
  doctorName: string = '';

  // Popup state
  showDetailsPopup = false;
  selectedAppointment: AppointmentDto | null = null;
  selectedPatientDetails: PatientDto | null = null;
  loadingPatientDetails = false;

  // Cache for doctor names and patient details
  private doctorNamesCache = new Map<number, string>();
  private patientDetailsCache = new Map<number, PatientDto>();

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadDoctorContext();
    this.loadAppointments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDoctorContext(): void {
    try {
      const currentUser = AuthStorage.get();
      this.doctorId = currentUser?.user?.userId ?? null;
      if (currentUser?.user) {
        this.doctorName = `${currentUser.user.firstName} ${currentUser.user.lastName}`;
      }
    } catch (err) {
      console.error('Failed to resolve doctor context', err);
      this.error = 'Unable to determine doctor context. Please sign in again.';
      this.loading = false;
    }
  }

  private loadAppointments(): void {
    if (!this.doctorId) {
      this.loading = false;
      if (!this.error) {
        this.error = 'Doctor information is missing. Please sign in again.';
      }
      return;
    }

    this.loading = true;
    this.error = null;

    this.appointmentService
      .getAppointmentsByDoctor(this.doctorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (appointments) => {
          this.appointments = appointments ?? [];
          this.loadMissingDoctorNames();
          this.filteredAppointments = [...this.appointments];
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load appointments', err);
          this.error = 'Failed to load appointments. Please try again later.';
          this.loading = false;
        }
      });
  }

  private loadMissingDoctorNames(): void {
    // Get unique doctor IDs that need names loaded
    const doctorIdsToLoad = [...new Set(
      this.appointments
        .filter(app => !app.doctorName || app.doctorName.trim() === '')
        .map(app => app.doctorId)
    )];

    if (doctorIdsToLoad.length === 0) return;

    // Load all doctor names in parallel
    const doctorRequests = doctorIdsToLoad.map(id => 
      this.usersService.getUserById(id)
    );

    forkJoin(doctorRequests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (doctors) => {
          doctors.forEach((doctor, index) => {
            const doctorId = doctorIdsToLoad[index];
            const fullName = `${doctor.firstName} ${doctor.lastName}`;
            this.doctorNamesCache.set(doctorId, fullName);
            
            // Update appointments with the doctor name
            this.appointments.forEach(app => {
              if (app.doctorId === doctorId) {
                app.doctorName = fullName;
              }
            });
          });
          this.filterAppointments();
        },
        error: (err) => {
          console.error('Failed to load doctor names', err);
          // Don't show error, just use fallback
        }
      });
  }

  private loadPatientDetails(patientId: number): void {
    // Check cache first
    const cachedPatient = this.patientDetailsCache.get(patientId);
    if (cachedPatient) {
      this.selectedPatientDetails = cachedPatient;
      return;
    }

    this.loadingPatientDetails = true;

    this.usersService.getPatientById(patientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (patient) => {
          this.selectedPatientDetails = patient;
          this.patientDetailsCache.set(patientId, patient);
          this.loadingPatientDetails = false;
        },
        error: (err) => {
          console.error('Failed to load patient details', err);
          this.selectedPatientDetails = null;
          this.loadingPatientDetails = false;
        }
      });
  }

  filterAppointments(): void {
    if (this.selectedStatus === '') {
      this.filteredAppointments = [...this.appointments];
      return;
    }

    this.filteredAppointments = this.appointments.filter(
      (appointment) => appointment.status === this.selectedStatus
    );
  }

  getInitials(name: string): string {
    if (!name || name.trim() === '') return '??';
    return name
      .split(' ')
      .map((segment) => segment[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  formatDate(date: Date | string): string {
    if (!date) return 'Not available';
    
    try {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return 'Invalid date';
      }
      
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return parsedDate.toLocaleDateString('en-US', options);
    } catch {
      return 'Invalid date';
    }
  }

  getStatusString(status: AppointmentStatus): string {
    return status || 'Unknown';
  }

  getDoctorName(appointment: AppointmentDto): string {
    if (appointment.doctorName && appointment.doctorName.trim() !== '') {
      return appointment.doctorName;
    }
    
    // Try cache
    const cached = this.doctorNamesCache.get(appointment.doctorId);
    if (cached) return cached;
    
    // Use logged-in doctor's name if it's their appointment
    if (appointment.doctorId === this.doctorId && this.doctorName) {
      return this.doctorName;
    }
    
    return 'Loading...';
  }

  viewDetails(appointment: AppointmentDto): void {
    this.selectedAppointment = appointment;
    this.showDetailsPopup = true;
    
    // Load patient details when viewing details
    if (appointment.patientId) {
      this.loadPatientDetails(appointment.patientId);
    } else {
      this.selectedPatientDetails = null;
    }
  }

  closeDetails(): void {
    this.showDetailsPopup = false;
    this.selectedAppointment = null;
    this.selectedPatientDetails = null;
  }

  getPatientEmail(): string {
    if (this.loadingPatientDetails) {
      return 'Loading...';
    }
    return this.selectedPatientDetails?.email || 'Not available';
  }

  getPatientPhone(): string {
    if (this.loadingPatientDetails) {
      return 'Loading...';
    }
    return this.selectedPatientDetails?.phoneNumber || 'Not available';
  }

  getPatientAdditionalInfo(): string {
    if (this.loadingPatientDetails || !this.selectedPatientDetails) {
      return '';
    }
    
    const patient = this.selectedPatientDetails;
    const infoParts = [];
    
    if (patient.bloodType && patient.bloodType !== 'Unknown') {
      infoParts.push(`Blood Type: ${patient.bloodType}`);
    }
    
    if (patient.allergies) {
      infoParts.push(`Allergies: ${patient.allergies}`);
    }
    
    return infoParts.join(' • ');
  }

  getAppointmentNotes(): string {
    if (!this.selectedAppointment) {
      return 'No notes available for this appointment.';
    }

    // Since AppointmentDto doesn't have notes or reason, we can show status-based messages
    const status = this.selectedAppointment.status;
    switch (status) {
      case AppointmentStatus.Scheduled:
        return 'Appointment is scheduled and awaiting confirmation.';
      case AppointmentStatus.Completed:
        return 'Appointment has been completed successfully.';
      case AppointmentStatus.Cancelled:
        return 'Appointment has been cancelled.';
      case AppointmentStatus.NoShow:
        return 'Patient did not show up for the appointment.';
      default:
        return 'No additional notes available for this appointment.';
    }
  }

  confirmAppointment(appointment: AppointmentDto): void {
    if (!appointment?.appointmentId) {
      console.error('No appointment ID found');
      return;
    }

    this.loading = true;
    this.appointmentService
      .updateAppointmentStatus(appointment.appointmentId, { status: AppointmentStatus.Completed })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedAppointment) => {
          this.replaceAppointment(updatedAppointment);
          this.loading = false;
          // Close popup if it's open for this appointment
          if (this.selectedAppointment?.appointmentId === appointment.appointmentId) {
            this.closeDetails();
          }
        },
        error: (err) => {
          console.error('Failed to confirm appointment', err);
          this.error = 'Unable to confirm appointment. Please try again.';
          this.loading = false;
        }
      });
  }

  cancelAppointment(appointment: AppointmentDto): void {
    if (!appointment?.appointmentId) {
      console.error('No appointment ID found for cancellation');
      return;
    }

    this.loading = true;
    this.appointmentService
      .cancelAppointment(appointment.appointmentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.removeAppointment(appointment.appointmentId);
          this.loading = false;
          // Close popup if it's open for this appointment
          if (this.selectedAppointment?.appointmentId === appointment.appointmentId) {
            this.closeDetails();
          }
        },
        error: (err) => {
          console.error('Failed to cancel appointment', err);
          this.error = 'Unable to cancel appointment. Please try again.';
          this.loading = false;
        }
      });
  }

  private replaceAppointment(updatedAppointment: AppointmentDto): void {
    this.appointments = this.appointments.map((existing) => {
      return existing.appointmentId === updatedAppointment.appointmentId ? updatedAppointment : existing;
    });
    this.filterAppointments();
  }

  private removeAppointment(appointmentId: number): void {
    this.appointments = this.appointments.filter((appointment) => {
      return appointment.appointmentId !== appointmentId;
    });
    this.filterAppointments();
  }
}