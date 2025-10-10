import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { PrescriptionsService } from '../../../core/services/prescriptions.service';
import { PrescriptionDetailsService } from '../../../core/services/prescription-details.service';
import { UsersService } from '../../../core/services/users.service';
import { PrescriptionDto, CreatePrescriptionDto } from '../../../core/models/prescription.models';
import { PrescriptionDetailDto } from '../../../core/models/prescription-detail.models';
import { AuthStorage } from '../../../core/models/user.models';
import { DoctorDto } from '../../../core/models/doctor.models';
import { AvailabilityStatus } from '../../../core/models/enums';

@Component({
  selector: 'app-patient-prescriptions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="prescriptions-container">
      <!-- Header -->
      <div class="header">
        <h1>My Prescriptions</h1>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading prescriptions...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="error-message">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>{{ error }}</span>
        <button class="retry-btn" (click)="loadPrescriptions()">Retry</button>
      </div>

      <!-- Prescriptions List -->
      <div *ngIf="!loading && !error" class="prescriptions-list">
        <div *ngIf="prescriptions.length === 0" class="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <h3>No prescriptions found</h3>
          <p>Your prescriptions will appear here when prescribed by your doctor.</p>
        </div>

        <div *ngFor="let prescription of prescriptions" class="prescription-card">
          <div class="card-header">
            <div class="doctor-info">
              <div class="avatar">{{ getDoctorInitials(prescription.doctorId) }}</div>
              <div>
                <h3>{{ getDoctorName(prescription.doctorId) }}</h3>
                <p class="doctor-meta">
                  Doctor
                  <span *ngIf="prescription.recordId" class="record-badge">
                    • Record: #{{ prescription.recordId }}
                  </span>
                </p>
              </div>
            </div>
            <div class="prescription-meta">
              <span class="date">{{ formatDate(prescription.prescribedDate) }}</span>
              <span class="prescription-id">#{{ prescription.prescriptionId }}</span>
            </div>
          </div>

          <div class="card-body">
            <div class="medicines-list" *ngIf="getPrescriptionDetails(prescription.prescriptionId).length > 0; else noMedicines">
              <div *ngFor="let detail of getPrescriptionDetails(prescription.prescriptionId)" class="medicine-item">
                <div class="medicine-name">{{ detail.medicineName }}</div>
                <div class="medicine-details">
                  <span class="dosage">{{ detail.dosage }}</span>
                  <span class="frequency">{{ detail.frequency }}</span>
                  <span class="duration">{{ detail.duration }}</span>
                </div>
                <div class="medicine-instructions" *ngIf="detail.instructions">
                  {{ detail.instructions }}
                </div>
              </div>
            </div>
            <ng-template #noMedicines>
              <div class="no-medicines">No medicines added to this prescription</div>
            </ng-template>
          </div>

          <div class="card-footer">
            <button class="btn btn-primary" (click)="viewPrescriptionDetails(prescription)">
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Prescription Details Modal -->
    <div *ngIf="showDetailsModal" class="modal-overlay" (click)="closeDetailsModal()">
      <div class="modal-content large" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Prescription Details</h2>
          <button class="modal-close" (click)="closeDetailsModal()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <div *ngIf="selectedPrescription" class="prescription-details">
            <!-- Doctor Information -->
            <div class="details-section">
              <h3 class="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Doctor Information
              </h3>
              <div class="details-grid">
                <div class="detail-item">
                  <span class="detail-label">Name:</span>
                  <span class="detail-value">{{ getDoctorName(selectedPrescription.doctorId) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Doctor ID:</span>
                  <span class="detail-value">#{{ selectedPrescription.doctorId }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Prescription ID:</span>
                  <span class="detail-value">#{{ selectedPrescription.prescriptionId }}</span>
                </div>
                <div class="detail-item" *ngIf="selectedPrescription.recordId">
                  <span class="detail-label">Linked Medical Record:</span>
                  <span class="detail-value">#{{ selectedPrescription.recordId }}</span>
                </div>
                <div class="detail-item" *ngIf="!selectedPrescription.recordId">
                  <span class="detail-label">Linked Medical Record:</span>
                  <span class="detail-value">Not linked</span>
                </div>
              </div>
            </div>

            <!-- Prescription Information -->
            <div class="details-section">
              <h3 class="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Prescription Information
              </h3>
              <div class="details-grid">
                <div class="detail-item">
                  <span class="detail-label">Prescribed Date:</span>
                  <span class="detail-value">{{ formatDate(selectedPrescription.prescribedDate) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Patient:</span>
                  <span class="detail-value">{{ patientName }}</span>
                </div>
              </div>
            </div>

            <!-- Medicines List -->
            <div class="details-section">
              <h3 class="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2v20M2 12h20"></path>
                </svg>
                Prescribed Medicines
              </h3>
              <div *ngIf="getPrescriptionDetails(selectedPrescription.prescriptionId).length > 0; else noMedicinesDetails" class="medicines-details">
                <div *ngFor="let medicine of getPrescriptionDetails(selectedPrescription.prescriptionId)" class="medicine-detail-card">
                  <div class="medicine-header">
                    <h4>{{ medicine.medicineName }}</h4>
                  </div>
                  <div class="medicine-details-grid">
                    <div class="medicine-detail">
                      <span class="detail-label">Dosage:</span>
                      <span class="detail-value">{{ medicine.dosage }}</span>
                    </div>
                    <div class="medicine-detail">
                      <span class="detail-label">Frequency:</span>
                      <span class="detail-value">{{ medicine.frequency }}</span>
                    </div>
                    <div class="medicine-detail">
                      <span class="detail-label">Duration:</span>
                      <span class="detail-value">{{ medicine.duration }}</span>
                    </div>
                    <div class="medicine-detail full-width" *ngIf="medicine.instructions">
                      <span class="detail-label">Instructions:</span>
                      <span class="detail-value">{{ medicine.instructions }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <ng-template #noMedicinesDetails>
                <div class="no-medicines">No medicines prescribed</div>
              </ng-template>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeDetailsModal()">Close</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .prescriptions-container {
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

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      border: none;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
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

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none !important;
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

    .retry-btn {
      margin-left: auto;
      padding: 0.5rem 1rem;
      background: #dc2626;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }

    .retry-btn:hover {
      background: #b91c1c;
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
      margin: 0 0 1.5rem 0;
      font-size: 0.95rem;
    }

    .prescriptions-list {
      display: grid;
      gap: 1.5rem;
    }

    .prescription-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.2s;
    }

    .prescription-card:hover {
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

    .doctor-info {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      flex: 1;
    }

    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4ecdc4, #44a08d);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .doctor-info h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #1a1a1a;
    }

    .doctor-meta {
      margin: 0.25rem 0 0 0;
      font-size: 0.85rem;
      color: #6b7280;
    }

    .record-badge {
      color: #3b82f6;
      font-weight: 500;
    }

    .prescription-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.25rem;
    }

    .date {
      font-size: 0.9rem;
      color: #6b7280;
    }

    .prescription-id {
      font-size: 0.8rem;
      color: #9ca3af;
    }

    .card-body {
      padding: 1.5rem;
    }

    .medicines-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .medicine-item {
      padding: 1rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }

    .medicine-name {
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 0.5rem;
    }

    .medicine-details {
      display: flex;
      gap: 1rem;
      font-size: 0.9rem;
      color: #6b7280;
    }

    .medicine-instructions {
      margin-top: 0.5rem;
      font-size: 0.85rem;
      color: #6b7280;
      font-style: italic;
    }

    .no-medicines {
      text-align: center;
      padding: 2rem;
      color: #9ca3af;
      font-style: italic;
    }

    .card-footer {
      display: flex;
      gap: 0.75rem;
      padding: 1.5rem;
      background: #f9fafb;
      border-top: 1px solid #f3f4f6;
    }

    .card-footer .btn {
      flex: 1;
    }

    /* Modal Styles */
    .modal-overlay {
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

    .modal-content {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      animation: slideIn 0.2s ease-out;
    }

    .modal-content.large {
      max-width: 700px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #1a1a1a;
    }

    .modal-close {
      background: none;
      border: none;
      padding: 0.5rem;
      border-radius: 6px;
      cursor: pointer;
      color: #6b7280;
      transition: all 0.2s;
    }

    .modal-close:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .modal-body {
      padding: 2rem;
    }

    .modal-footer {
      display: flex;
      gap: 0.75rem;
      padding: 1.5rem 2rem;
      border-top: 1px solid #e5e7eb;
      background: #f9fafb;
    }

    .modal-footer .btn {
      flex: 1;
    }

    /* Prescription Details Styles */
    .prescription-details {
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

    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .detail-label {
      font-size: 0.85rem;
      color: #6b7280;
      font-weight: 500;
    }

    .detail-value {
      color: #1a1a1a;
      font-weight: 400;
    }

    .medicines-details {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .medicine-detail-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1.25rem;
    }

    .medicine-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .medicine-header h4 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #1a1a1a;
    }

    .medicine-details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }

    .medicine-detail {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .medicine-detail.full-width {
      grid-column: 1 / -1;
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
      .prescriptions-container {
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

      .card-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .prescription-meta {
        align-items: flex-start;
      }

      .card-footer {
        flex-direction: column;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .modal-content {
        margin: 1rem;
        max-height: calc(100vh - 2rem);
      }

      .modal-header,
      .modal-body,
      .modal-footer {
        padding: 1rem 1.5rem;
      }

      .details-grid {
        grid-template-columns: 1fr;
      }

      .medicine-details-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PatientPrescriptionsComponent implements OnInit, OnDestroy {
  private readonly prescriptionsService = inject(PrescriptionsService);
  private readonly prescriptionDetailsService = inject(PrescriptionDetailsService);
  private readonly usersService = inject(UsersService);

  prescriptions: PrescriptionDto[] = [];
  prescriptionDetails: Map<number, PrescriptionDetailDto[]> = new Map();
  loading = true;
  error: string | null = null;
  patientId: number | null = null;
  patientName: string = '';

  // Modal states
  showDetailsModal = false;

  selectedPrescription: PrescriptionDto | null = null;

  // Cache for doctor data
  private doctorCache = new Map<number, DoctorDto>();

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadPatientContext();
    this.loadPrescriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPatientContext(): void {
    try {
      const currentUser = AuthStorage.get();
      this.patientId = currentUser?.user?.userId ?? null;
      if (currentUser?.user) {
        this.patientName = `${currentUser.user.firstName} ${currentUser.user.lastName}`;
      }
    } catch (err) {
      console.error('Failed to resolve patient context', err);
      this.error = 'Unable to determine patient context. Please sign in again.';
      this.loading = false;
    }
  }

  loadPrescriptions(): void {
    if (!this.patientId) return;

    this.loading = true;
    this.error = null;

    // Load prescriptions for the current patient
    this.prescriptionsService.getPrescriptionsByPatient(this.patientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (prescriptions) => {
          this.prescriptions = prescriptions;
          this.loadPrescriptionDetails();
        },
        error: (err) => {
          console.error('Failed to load prescriptions', err);
          this.error = 'Failed to load prescriptions. Please try again later.';
          this.loading = false;
        }
      });
  }

  private loadPrescriptionDetails(): void {
    if (this.prescriptions.length === 0) {
      this.loading = false;
      return;
    }

    const detailRequests = this.prescriptions.map(prescription =>
      this.prescriptionDetailsService.getDetailsByPrescription(prescription.prescriptionId)
    );

    forkJoin(detailRequests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detailsArrays) => {
          detailsArrays.forEach((details, index) => {
            const prescriptionId = this.prescriptions[index].prescriptionId;
            this.prescriptionDetails.set(prescriptionId, details);
          });
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load prescription details', err);
          this.error = 'Failed to load prescription details.';
          this.loading = false;
        }
      });
  }

  // Modal Management
  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedPrescription = null;
  }

  // Doctor Management
  getDoctorName(doctorId: number): string {
    const cached = this.doctorCache.get(doctorId);
    if (cached) {
      return `Dr. ${cached.fullName}`;
    }

    // Fetch doctor data if not cached
    this.usersService.getDoctorById(doctorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (doctor) => {
          this.doctorCache.set(doctorId, doctor);
        },
        error: (err) => {
          console.error('Failed to load doctor data', err);
          // Set a fallback in cache to avoid repeated failed requests
          const fallback: DoctorDto = {
            userId: doctorId,
            fullName: `Doctor #${doctorId}`,
            email: '',
            phoneNumber: '',
            specialization: '',
            licenseNumber: '',
            clinicName: '',
            availabilityStatus: AvailabilityStatus.Available
          };
          this.doctorCache.set(doctorId, fallback);
        }
      });

    // Return a temporary display while fetching
    return `Doctor #${doctorId}`;
  }

  getDoctorInitials(doctorId: number): string {
    const cached = this.doctorCache.get(doctorId);
    if (cached) {
      if (cached.fullName && cached.fullName.trim()) {
        return cached.fullName
          .split(' ')
          .map(segment => segment[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
      }
    }

    // Return fallback initials
    return doctorId.toString().slice(0, 2).toUpperCase();
  }

  // Prescription Details Management
  getPrescriptionDetails(prescriptionId: number): PrescriptionDetailDto[] {
    return this.prescriptionDetails.get(prescriptionId) || [];
  }

  // Actions
  viewPrescriptionDetails(prescription: PrescriptionDto): void {
    this.selectedPrescription = prescription;
    this.showDetailsModal = true;
  }

  // Utility Methods
  formatDate(date: Date | string): string {
    if (!date) return 'Not specified';

    try {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) return 'Invalid date';

      return parsedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  }
}
