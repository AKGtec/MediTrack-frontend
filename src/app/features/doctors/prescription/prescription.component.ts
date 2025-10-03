import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { PrescriptionsService } from '../../../core/services/prescriptions.service';
import { PrescriptionDetailsService } from '../../../core/services/prescription-details.service';
import { UsersService } from '../../../core/services/users.service';
import { MedicalRecordsService } from '../../../core/services/medical-records.service';
import { AuthStorage } from '../../../core/models/user.models';
import { PrescriptionDto, CreatePrescriptionDto } from '../../../core/models/prescription.models';
import { PrescriptionDetailDto, CreatePrescriptionDetailDto, UpdatePrescriptionDetailDto } from '../../../core/models/prescription-detail.models';
import { PatientDto } from '../../../core/models/patient.models';
import { MedicalRecordDto } from '../../../core/models/medical-record.models';

@Component({
  selector: 'app-doctor-prescriptions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="prescriptions-container">
      <!-- Header -->
      <div class="header">
        <h1>Prescriptions Management</h1>
        <button class="btn btn-primary" (click)="openCreatePrescriptionModal()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Create New Prescription
        </button>
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
          <p>Get started by creating your first prescription.</p>
          <button class="btn btn-primary" (click)="openCreatePrescriptionModal()">
            Create Prescription
          </button>
        </div>

        <div *ngFor="let prescription of prescriptions" class="prescription-card">
          <div class="card-header">
            <div class="patient-info">
              <div class="avatar">{{ getPatientInitials(prescription.patientId) }}</div>
              <div>
                <h3>{{ getPatientName(prescription.patientId) }}</h3>
                <p class="patient-meta">
                  Patient ID: #{{ prescription.patientId }}
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
            <button class="btn btn-secondary" (click)="viewPrescriptionDetails(prescription)">
              View Details
            </button>
            <button class="btn btn-primary" (click)="editPrescription(prescription)">
              Edit
            </button>
            <button class="btn btn-danger" (click)="addMedicineToPrescription(prescription)">
              Add Medicine
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Prescription Modal -->
    <div *ngIf="showCreateModal" class="modal-overlay" (click)="closeCreateModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Create New Prescription</h2>
          <button class="modal-close" (click)="closeCreateModal()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label for="patientSelect">Select Patient *</label>
            <select 
              id="patientSelect" 
              [(ngModel)]="newPrescription.patientId" 
              class="form-select"
              (change)="onPatientChange()"
              required
            >
              <option value="">Select a patient</option>
              <option *ngFor="let patient of patients" [value]="patient.userId">
                {{ patient.fullName }} (ID: {{ patient.userId }})
              </option>
            </select>
          </div>

          <!-- Medical Record Selection -->
          <div class="form-group" *ngIf="availableMedicalRecords.length > 0">
            <label for="recordSelect">Link to Medical Record (Optional)</label>
            <select 
              id="recordSelect" 
              [(ngModel)]="newPrescription.recordId" 
              class="form-select"
            >
              <option [value]="0">No medical record linked</option>
              <option *ngFor="let record of availableMedicalRecords" [value]="record.recordId">
                {{ formatMedicalRecordOption(record) }}
              </option>
            </select>
            <small class="form-help">
              Select a medical record to link this prescription to. Only your medical records for this patient are shown.
            </small>
          </div>

          <div class="form-group">
            <label for="prescribedDate">Prescription Date *</label>
            <input 
              type="date" 
              id="prescribedDate" 
              [(ngModel)]="newPrescription.prescribedDate" 
              class="form-input" 
              required
            />
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeCreateModal()">Cancel</button>
          <button class="btn btn-primary" (click)="createPrescription()" [disabled]="!isValidNewPrescription()">
            Create Prescription
          </button>
        </div>
      </div>
    </div>

    <!-- Add Medicine Modal -->
    <div *ngIf="showAddMedicineModal" class="modal-overlay" (click)="closeAddMedicineModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Add Medicine to Prescription</h2>
          <button class="modal-close" (click)="closeAddMedicineModal()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label for="medicineName">Medicine Name *</label>
            <input 
              type="text" 
              id="medicineName" 
              [(ngModel)]="newMedicine.medicineName" 
              class="form-input" 
              placeholder="Enter medicine name" 
              required
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="dosage">Dosage *</label>
              <input 
                type="text" 
                id="dosage" 
                [(ngModel)]="newMedicine.dosage" 
                class="form-input" 
                placeholder="e.g., 500mg" 
                required
              />
            </div>

            <div class="form-group">
              <label for="frequency">Frequency *</label>
              <input 
                type="text" 
                id="frequency" 
                [(ngModel)]="newMedicine.frequency" 
                class="form-input" 
                placeholder="e.g., 3 times daily" 
                required
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="duration">Duration *</label>
              <input 
                type="text" 
                id="duration" 
                [(ngModel)]="newMedicine.duration" 
                class="form-input" 
                placeholder="e.g., 7 days" 
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label for="instructions">Special Instructions</label>
            <textarea 
              id="instructions" 
              [(ngModel)]="newMedicine.instructions" 
              class="form-textarea" 
              placeholder="Enter any special instructions..."
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeAddMedicineModal()">Cancel</button>
          <button class="btn btn-primary" (click)="addMedicine()" [disabled]="!isValidNewMedicine()">
            Add Medicine
          </button>
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
            <!-- Patient Information -->
            <div class="details-section">
              <h3 class="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Patient Information
              </h3>
              <div class="details-grid">
                <div class="detail-item">
                  <span class="detail-label">Name:</span>
                  <span class="detail-value">{{ getPatientName(selectedPrescription.patientId) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Patient ID:</span>
                  <span class="detail-value">#{{ selectedPrescription.patientId }}</span>
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
                  <span class="detail-label">Doctor:</span>
                  <span class="detail-value">{{ doctorName }}</span>
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
                    <div class="medicine-actions">
                      <button class="btn-icon" (click)="editMedicine(medicine)">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button class="btn-icon btn-danger" (click)="deleteMedicine(medicine)">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
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
          <button class="btn btn-primary" (click)="addMedicineToPrescription(selectedPrescription!)">
            Add Medicine
          </button>
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

    .btn-danger {
      background: #ef4444;
      color: white;
    }

    .btn-danger:hover {
      background: #dc2626;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none !important;
    }

    .btn-icon {
      padding: 0.375rem;
      border: none;
      background: none;
      border-radius: 6px;
      cursor: pointer;
      color: #6b7280;
      transition: all 0.2s;
    }

    .btn-icon:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-icon.btn-danger:hover {
      background: #fef2f2;
      color: #dc2626;
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

    .patient-info {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      flex: 1;
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
      flex-shrink: 0;
    }

    .patient-info h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #1a1a1a;
    }

    .patient-meta {
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

    /* Form Styles */
    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #374151;
    }

    .form-input, .form-select, .form-textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 0.95rem;
      transition: all 0.2s;
    }

    .form-input:focus, .form-select:focus, .form-textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-textarea {
      resize: vertical;
      min-height: 80px;
    }

    .form-help {
      display: block;
      margin-top: 0.5rem;
      font-size: 0.8rem;
      color: #6b7280;
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

    .medicine-actions {
      display: flex;
      gap: 0.5rem;
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
export class DoctorPrescriptionsComponent implements OnInit, OnDestroy {
  private readonly prescriptionsService = inject(PrescriptionsService);
  private readonly prescriptionDetailsService = inject(PrescriptionDetailsService);
  private readonly usersService = inject(UsersService);
  private readonly medicalRecordsService = inject(MedicalRecordsService);

  prescriptions: PrescriptionDto[] = [];
  prescriptionDetails: Map<number, PrescriptionDetailDto[]> = new Map();
  patients: PatientDto[] = [];
  availableMedicalRecords: MedicalRecordDto[] = [];
  loading = true;
  error: string | null = null;
  doctorId: number | null = null;
  doctorName: string = '';

  // Modal states
  showCreateModal = false;
  showAddMedicineModal = false;
  showDetailsModal = false;

  // Form data
  newPrescription: CreatePrescriptionDto = {
    recordId: 0,
    doctorId: 0,
    patientId: 0,
    prescribedDate: new Date(new Date().toISOString().split('T')[0])

  };

  newMedicine: CreatePrescriptionDetailDto = {
    prescriptionId: 0,
    medicineName: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  };

  selectedPrescription: PrescriptionDto | null = null;
  selectedMedicine: PrescriptionDetailDto | null = null;

  // Cache for patient names
  private patientNamesCache = new Map<number, string>();

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadDoctorContext();
    this.loadData();
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

  private loadData(): void {
    if (!this.doctorId) {
      this.loading = false;
      if (!this.error) {
        this.error = 'Doctor information is missing. Please sign in again.';
      }
      return;
    }

    this.loading = true;
    this.error = null;

    // Load patients first, then load prescriptions
    this.usersService.getAllPatients()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (patients) => {
          this.patients = patients;
          this.loadPrescriptions();
        },
        error: (err) => {
          console.error('Failed to load patients', err);
          this.error = 'Failed to load patients data.';
          this.loading = false;
        }
      });
  }

  loadPrescriptions(): void {
    if (!this.doctorId) return;

    // In a real scenario, you might need to get prescriptions by doctor ID
    // For now, we'll load all prescriptions and filter by doctorId
    this.prescriptionsService.getPrescriptionsByPatient(0) // This would need to be adjusted based on your API
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (prescriptions) => {
          // Filter prescriptions by current doctor
          this.prescriptions = prescriptions.filter(p => p.doctorId === this.doctorId);
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

  loadAvailableMedicalRecords(patientId: number): void {
    if (!this.doctorId || !patientId) {
      this.availableMedicalRecords = [];
      return;
    }

    this.medicalRecordsService.getRecordsByPatient(patientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (records) => {
          // Filter records by current doctor
          this.availableMedicalRecords = records.filter(record => 
            record.doctorId === this.doctorId
          );
        },
        error: (err) => {
          console.error('Failed to load medical records', err);
          this.availableMedicalRecords = [];
        }
      });
  }

  onPatientChange(): void {
    if (this.newPrescription.patientId) {
      this.loadAvailableMedicalRecords(this.newPrescription.patientId);
    } else {
      this.availableMedicalRecords = [];
      this.newPrescription.recordId = 0;
    }
  }

  // Modal Management
  openCreatePrescriptionModal(): void {
    this.newPrescription = {
      recordId: 0,
      doctorId: this.doctorId!,
      patientId: 0,
      prescribedDate: new Date(new Date().toISOString().split('T')[0])

    };
    this.availableMedicalRecords = [];
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.newPrescription = {
      recordId: 0,
      doctorId: this.doctorId!,
      patientId: 0,
      prescribedDate: new Date(new Date().toISOString().split('T')[0])

    };
    this.availableMedicalRecords = [];
  }

  openAddMedicineModal(): void {
    this.showAddMedicineModal = true;
  }

  closeAddMedicineModal(): void {
    this.showAddMedicineModal = false;
    this.resetNewMedicine();
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedPrescription = null;
  }

  // Form Validation
  isValidNewPrescription(): boolean {
    return !!this.newPrescription.patientId && !!this.newPrescription.prescribedDate;
  }

  isValidNewMedicine(): boolean {
    return !!this.newMedicine.medicineName && !!this.newMedicine.dosage && 
           !!this.newMedicine.frequency && !!this.newMedicine.duration;
  }

  // Patient Management
  getPatientName(patientId: number): string {
    const cached = this.patientNamesCache.get(patientId);
    if (cached) return cached;

    const patient = this.patients.find(p => p.userId === patientId);
    if (patient) {
      const name = patient.fullName || `Unknown Patient ${patient.userId}`;
      this.patientNamesCache.set(patientId, name);
      return name;
    }

    return 'Unknown Patient';
  }

  getPatientInitials(patientId: number): string {
    const name = this.getPatientName(patientId);
    if (name === 'Unknown Patient') return '??';
    
    return name
      .split(' ')
      .map(segment => segment[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  // Prescription Details Management
  getPrescriptionDetails(prescriptionId: number): PrescriptionDetailDto[] {
    return this.prescriptionDetails.get(prescriptionId) || [];
  }

  // Actions
  createPrescription(): void {
    if (!this.isValidNewPrescription()) return;

    this.loading = true;
    this.prescriptionsService.createPrescription(this.newPrescription)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (prescription) => {
          this.prescriptions.push(prescription);
          this.prescriptionDetails.set(prescription.prescriptionId, []);
          this.closeCreateModal();
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to create prescription', err);
          this.error = 'Failed to create prescription. Please try again.';
          this.loading = false;
        }
      });
  }

  addMedicineToPrescription(prescription: PrescriptionDto): void {
    this.selectedPrescription = prescription;
    this.newMedicine.prescriptionId = prescription.prescriptionId;
    this.showAddMedicineModal = true;
  }

  addMedicine(): void {
    if (!this.isValidNewMedicine()) return;

    this.loading = true;
    this.prescriptionDetailsService.addDetail(this.newMedicine)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detail) => {
          const currentDetails = this.prescriptionDetails.get(this.newMedicine.prescriptionId) || [];
          this.prescriptionDetails.set(this.newMedicine.prescriptionId, [...currentDetails, detail]);
          this.closeAddMedicineModal();
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to add medicine', err);
          this.error = 'Failed to add medicine. Please try again.';
          this.loading = false;
        }
      });
  }

  viewPrescriptionDetails(prescription: PrescriptionDto): void {
    this.selectedPrescription = prescription;
    this.showDetailsModal = true;
  }

  editPrescription(prescription: PrescriptionDto): void {
    // Implementation for editing prescription
    console.log('Edit prescription:', prescription);
  }

  editMedicine(medicine: PrescriptionDetailDto): void {
    // Implementation for editing medicine
    console.log('Edit medicine:', medicine);
  }

  deleteMedicine(medicine: PrescriptionDetailDto): void {
    if (confirm('Are you sure you want to delete this medicine?')) {
      this.loading = true;
      this.prescriptionDetailsService.deleteDetail(medicine.prescriptionDetailId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            const currentDetails = this.prescriptionDetails.get(medicine.prescriptionId) || [];
            const updatedDetails = currentDetails.filter(d => d.prescriptionDetailId !== medicine.prescriptionDetailId);
            this.prescriptionDetails.set(medicine.prescriptionId, updatedDetails);
            this.loading = false;
          },
          error: (err) => {
            console.error('Failed to delete medicine', err);
            this.error = 'Failed to delete medicine. Please try again.';
            this.loading = false;
          }
        });
    }
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

  formatMedicalRecordOption(record: MedicalRecordDto): string {
    const date = this.formatDate(record.createdAt);
    let description = `Record #${record.recordId} - ${date}`;
    
    if (record.diagnosis) {
      const shortDiagnosis = record.diagnosis.length > 30 
        ? record.diagnosis.substring(0, 30) + '...' 
        : record.diagnosis;
      description += ` - ${shortDiagnosis}`;
    }
    
    return description;
  }

  private resetNewMedicine(): void {
    this.newMedicine = {
      prescriptionId: 0,
      medicineName: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    };
  }
}