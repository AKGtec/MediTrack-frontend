import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { MedicalRecordsService } from '../../../core/services/medical-records.service';
import { UsersService } from '../../../core/services/users.service';
import { PrescriptionsService } from '../../../core/services/prescriptions.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AuthStorage } from '../../../core/models/user.models';
import { MedicalRecordDto, CreateMedicalRecordDto, UpdateMedicalRecordDto } from '../../../core/models/medical-record.models';
import { PatientDto } from '../../../core/models/patient.models';
import { PrescriptionDto } from '../../../core/models/prescription.models';
import { AppointmentDto,  } from '../../../core/models/appointment.models';
import {AppointmentStatus} from '../../../core/models/enums'
interface MedicalRecordWithDetails extends MedicalRecordDto {
  patientDetails?: PatientDto;
  prescriptionCount?: number;
}

@Component({
  selector: 'app-doctor-medical-records',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="medical-records-container">
      <!-- Header -->
      <div class="header">
        <h1>Medical Records Management</h1>
        <button class="btn btn-primary" (click)="openCreateRecordModal()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Create New Record
        </button>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="search-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            placeholder="Search patients, diagnoses..." 
            [(ngModel)]="searchTerm" 
            (input)="applyFilters()" 
          />
        </div>
        <select [(ngModel)]="selectedPatient" (change)="applyFilters()">
          <option value="all">All Patients</option>
          <option *ngFor="let patient of patients" [value]="patient.userId">
            {{ patient.fullName }}
          </option>
        </select>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading medical records...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="error-message">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>{{ error }}</span>
        <button class="retry-btn" (click)="loadMedicalRecords()">Retry</button>
      </div>

      <!-- Medical Records List -->
      <div *ngIf="!loading && !error" class="medical-records-list">
        <div *ngIf="filteredRecords.length === 0" class="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <h3>No medical records found</h3>
          <p *ngIf="searchTerm || selectedPatient !== 'all'">
            No records match your search criteria. Try adjusting your filters.
          </p>
          <p *ngIf="!searchTerm && selectedPatient === 'all'">
            Get started by creating your first medical record.
          </p>
          <button class="btn btn-primary" (click)="openCreateRecordModal()">
            Create Medical Record
          </button>
        </div>

        <div *ngFor="let record of filteredRecords" class="record-card">
          <div class="card-header">
            <div class="patient-info">
              <div class="avatar">{{ getPatientInitials(record.patientId) }}</div>
              <div>
                <h3>{{ getPatientName(record.patientId) }}</h3>
                <p class="patient-meta">
                  Patient ID: #{{ record.patientId }} • 
                  Record ID: #{{ record.recordId }} •
                  Created: {{ formatDate(record.createdAt) }}
                  <span *ngIf="record.appointmentId" class="appointment-badge">
                    • Appointment: #{{ record.appointmentId }}
                  </span>
                </p>
              </div>
            </div>
            <div class="record-actions">
              <button class="btn-icon" (click)="viewRecordDetails(record)" title="View Details">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
              <button class="btn-icon" (click)="editRecord(record)" title="Edit Record">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
            </div>
          </div>

          <div class="card-body">
            <!-- Diagnosis -->
            <div class="record-section" *ngIf="record.diagnosis">
              <h4 class="section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Diagnosis
              </h4>
              <p class="section-content">{{ record.diagnosis }}</p>
            </div>

            <!-- Treatment Plan -->
            <div class="record-section" *ngIf="record.treatmentPlan">
              <h4 class="section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                  <line x1="6" y1="1" x2="6" y2="4"></line>
                  <line x1="10" y1="1" x2="10" y2="4"></line>
                  <line x1="14" y1="1" x2="14" y2="4"></line>
                </svg>
                Treatment Plan
              </h4>
              <p class="section-content">{{ record.treatmentPlan }}</p>
            </div>

            <!-- Notes -->
            <div class="record-section" *ngIf="record.notes">
              <h4 class="section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                Notes
              </h4>
              <p class="section-content">{{ record.notes }}</p>
            </div>

            <!-- Statistics -->
            <div class="record-stats">
              <div class="stat-item">
                <span class="stat-label">Prescriptions</span>
                <span class="stat-value">{{ record.prescriptionCount || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Lab Tests</span>
                <span class="stat-value">{{ record.labTests?.length || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Medical Record Modal -->
    <div *ngIf="showRecordModal" class="modal-overlay" (click)="closeRecordModal()">
      <div class="modal-content large" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>{{ isEditing ? 'Edit Medical Record' : 'Create Medical Record' }}</h2>
          <button class="modal-close" (click)="closeRecordModal()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <form class="record-form">
            <!-- Patient Selection -->
            <div class="form-group" *ngIf="!isEditing">
              <label for="patientSelect">Select Patient *</label>
              <select 
                id="patientSelect" 
                [(ngModel)]="newRecord.patientId" 
                name="patientId"
                class="form-select"
                required
                (change)="onPatientChange()"
              >
                <option value="">Select a patient</option>
                <option *ngFor="let patient of patients" [value]="patient.userId">
                  {{ patient.fullName }} (ID: {{ patient.userId }})
                </option>
              </select>
            </div>

            <!-- Appointment Selection -->
            <div class="form-group" *ngIf="!isEditing && availableAppointments.length > 0">
              <label for="appointmentSelect">Link to Appointment (Optional)</label>
              <select 
                id="appointmentSelect" 
                [(ngModel)]="newRecord.appointmentId" 
                name="appointmentId"
                class="form-select"
              >
                <option [value]="undefined">No appointment linked</option>
                <option *ngFor="let appointment of availableAppointments" [value]="appointment.appointmentId">
                  {{ formatAppointmentOption(appointment) }}
                </option>
              </select>
              <small class="form-help">
                Select an appointment to link this medical record to. Only completed appointments are shown.
              </small>
            </div>

            <!-- Diagnosis -->
            <div class="form-group">
              <label for="diagnosis">Diagnosis</label>
              <textarea 
                id="diagnosis" 
                [(ngModel)]="newRecord.diagnosis" 
                name="diagnosis"
                class="form-textarea" 
                placeholder="Enter diagnosis..."
                rows="3"
              ></textarea>
            </div>

            <!-- Treatment Plan -->
            <div class="form-group">
              <label for="treatmentPlan">Treatment Plan</label>
              <textarea 
                id="treatmentPlan" 
                [(ngModel)]="newRecord.treatmentPlan" 
                name="treatmentPlan"
                class="form-textarea" 
                placeholder="Enter treatment plan..."
                rows="3"
              ></textarea>
            </div>

            <!-- Notes -->
            <div class="form-group">
              <label for="notes">Additional Notes</label>
              <textarea 
                id="notes" 
                [(ngModel)]="newRecord.notes" 
                name="notes"
                class="form-textarea" 
                placeholder="Enter any additional notes..."
                rows="3"
              ></textarea>
            </div>
          </form>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeRecordModal()">Cancel</button>
          <button 
            class="btn btn-primary" 
            (click)="isEditing ? updateRecord() : createRecord()" 
            [disabled]="!isValidRecord()"
          >
            {{ isEditing ? 'Update Record' : 'Create Record' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Medical Record Details Modal -->
    <div *ngIf="showDetailsModal" class="modal-overlay" (click)="closeDetailsModal()">
      <div class="modal-content x-large" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Medical Record Details</h2>
          <button class="modal-close" (click)="closeDetailsModal()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <div *ngIf="selectedRecord" class="record-details">
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
                  <span class="detail-value">{{ getPatientName(selectedRecord.patientId) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Patient ID:</span>
                  <span class="detail-value">#{{ selectedRecord.patientId }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Record ID:</span>
                  <span class="detail-value">#{{ selectedRecord.recordId }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Created:</span>
                  <span class="detail-value">{{ formatDate(selectedRecord.createdAt) }}</span>
                </div>
                <div class="detail-item" *ngIf="selectedRecord.appointmentId">
                  <span class="detail-label">Linked Appointment:</span>
                  <span class="detail-value">#{{ selectedRecord.appointmentId }}</span>
                </div>
              </div>
            </div>

            <!-- Medical Information -->
            <div class="details-section">
              <h3 class="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
                Medical Information
              </h3>
              
              <div class="detail-item full-width" *ngIf="selectedRecord.diagnosis">
                <span class="detail-label">Diagnosis:</span>
                <div class="detail-value">{{ selectedRecord.diagnosis }}</div>
              </div>

              <div class="detail-item full-width" *ngIf="selectedRecord.treatmentPlan">
                <span class="detail-label">Treatment Plan:</span>
                <div class="detail-value">{{ selectedRecord.treatmentPlan }}</div>
              </div>

              <div class="detail-item full-width" *ngIf="selectedRecord.notes">
                <span class="detail-label">Notes:</span>
                <div class="detail-value">{{ selectedRecord.notes }}</div>
              </div>
            </div>

            <!-- Prescriptions Section -->
            <div class="details-section" *ngIf="selectedRecord.prescriptions && selectedRecord.prescriptions.length > 0">
              <h3 class="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2v20M2 12h20"></path>
                </svg>
                Prescriptions ({{ selectedRecord.prescriptions.length }})
              </h3>
              <div class="prescriptions-list">
                <div *ngFor="let prescription of selectedRecord.prescriptions" class="prescription-item">
                  <div class="prescription-header">
                    <strong>Prescription #{{ prescription.prescriptionId }}</strong>
                    <span class="prescription-date">{{ formatDate(prescription.prescribedDate) }}</span>
                  </div>
                  <div class="prescription-details">
                    {{ getPrescriptionDetailsCount(prescription.prescriptionId) }} medicines prescribed
                  </div>
                </div>
              </div>
            </div>

            <!-- Lab Tests Section -->
            <div class="details-section" *ngIf="selectedRecord.labTests && selectedRecord.labTests.length > 0">
              <h3 class="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19.428 15.428a2 2 0 0 0-1.022-.547l-2.387-.477a6 6 0 0 0-3.86.517l-.318.158a6 6 0 0 1-3.86.517L6.05 15.21a2 2 0 0 0-1.806.547M8 4h8l-1 1v5.172a2 2 0 0 0 .586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 0 0 9 10.172V5L8 4z"></path>
                </svg>
                Lab Tests ({{ selectedRecord.labTests.length }})
              </h3>
              <div class="lab-tests-list">
                <div *ngFor="let test of selectedRecord.labTests" class="lab-test-item">
                  <div class="test-name">{{ test.testName }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeDetailsModal()">Close</button>
          <button class="btn btn-primary" (click)="editRecord(selectedRecord!)">
            Edit Record
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .medical-records-container {
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

    .filters-section {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      align-items: center;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 0.5rem 1rem;
      background: white;
      flex: 1;
      max-width: 400px;
    }

    .search-box input {
      border: none;
      outline: none;
      width: 100%;
      font-size: 0.95rem;
    }

    .search-box svg {
      color: #6b7280;
    }

    select {
      padding: 0.5rem 1rem;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      font-size: 0.95rem;
      background: white;
      cursor: pointer;
      min-width: 200px;
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

    .btn-icon {
      padding: 0.5rem;
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

    .medical-records-list {
      display: grid;
      gap: 1.5rem;
    }

    .record-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.2s;
    }

    .record-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      border-color: #d1d5db;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
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

    .appointment-badge {
      color: #3b82f6;
      font-weight: 500;
    }

    .record-actions {
      display: flex;
      gap: 0.5rem;
    }

    .card-body {
      padding: 1.5rem;
    }

    .record-section {
      margin-bottom: 1.5rem;
    }

    .record-section:last-child {
      margin-bottom: 0;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 0.5rem 0;
      font-size: 0.95rem;
      font-weight: 600;
      color: #374151;
    }

    .section-title svg {
      color: #6b7280;
    }

    .section-content {
      margin: 0;
      color: #4b5563;
      line-height: 1.5;
      font-size: 0.9rem;
    }

    .record-stats {
      display: flex;
      gap: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #f3f4f6;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .stat-label {
      font-size: 0.8rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1a1a1a;
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
      max-width: 600px;
    }

    .modal-content.x-large {
      max-width: 800px;
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
    .record-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
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

    /* Details Styles */
    .record-details {
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

    .detail-item.full-width {
      grid-column: 1 / -1;
    }

    .detail-label {
      font-size: 0.85rem;
      color: #6b7280;
      font-weight: 500;
    }

    .detail-value {
      color: #1a1a1a;
      font-weight: 400;
      line-height: 1.5;
    }

    .prescriptions-list, .lab-tests-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .prescription-item, .lab-test-item {
      padding: 1rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }

    .prescription-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .prescription-date {
      font-size: 0.85rem;
      color: #6b7280;
    }

    .prescription-details {
      font-size: 0.9rem;
      color: #4b5563;
    }

    .lab-test-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .test-name {
      font-weight: 500;
    }

    .test-status {
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-completed {
      background: #d1fae5;
      color: #065f46;
    }

    .status-pending {
      background: #fef3c7;
      color: #92400e;
    }

    .status-inprogress {
      background: #dbeafe;
      color: #1e40af;
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
      .medical-records-container {
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

      .filters-section {
        flex-direction: column;
        align-items: stretch;
      }

      .search-box {
        max-width: none;
      }

      select {
        min-width: auto;
      }

      .card-header {
        flex-direction: column;
        gap: 1rem;
      }

      .record-actions {
        align-self: flex-end;
      }

      .record-stats {
        justify-content: space-around;
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
    }
  `]
})
export class DoctorMedicalRecordsComponent implements OnInit, OnDestroy {
  private readonly medicalRecordsService = inject(MedicalRecordsService);
  private readonly usersService = inject(UsersService);
  private readonly prescriptionsService = inject(PrescriptionsService);
  private readonly appointmentService = inject(AppointmentService);

  medicalRecords: MedicalRecordWithDetails[] = [];
  filteredRecords: MedicalRecordWithDetails[] = [];
  patients: PatientDto[] = [];
  availableAppointments: AppointmentDto[] = [];
  loading = true;
  error: string | null = null;
  doctorId: number | null = null;
  doctorName: string = '';

  // Filters
  searchTerm = '';
  selectedPatient: string | number = 'all';

  // Modal states
  showRecordModal = false;
  showDetailsModal = false;
  isEditing = false;

  // Form data
  newRecord: CreateMedicalRecordDto = {
    patientId: 0,
    doctorId: 0
  };

  selectedRecord: MedicalRecordWithDetails | null = null;

  // Cache for patient names and prescription details
  private patientNamesCache = new Map<number, string>();
  private prescriptionDetailsCache = new Map<number, number>();

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

    // Load patients first
    this.usersService.getAllPatients()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (patients) => {
          this.patients = patients;
          this.loadMedicalRecords();
        },
        error: (err) => {
          console.error('Failed to load patients', err);
          this.error = 'Failed to load patients data.';
          this.loading = false;
        }
      });
  }

  loadMedicalRecords(): void {
    if (!this.doctorId) return;

    // Get records for all patients of this doctor
    const patientRequests = this.patients.map(patient =>
      this.medicalRecordsService.getRecordsByPatient(patient.userId)
    );

    forkJoin(patientRequests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (recordsArrays) => {
          // Flatten and filter records by doctor ID
          const allRecords = recordsArrays.flat();
          this.medicalRecords = allRecords
            .filter(record => record.doctorId === this.doctorId)
            .map(record => ({
              ...record,
              patientDetails: this.patients.find(p => p.userId === record.patientId),
              prescriptionCount: record.prescriptions?.length || 0
            }));

          this.applyFilters();
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load medical records', err);
          this.error = 'Failed to load medical records. Please try again later.';
          this.loading = false;
        }
      });
  }

  loadAvailableAppointments(patientId: number): void {
    if (!this.doctorId || !patientId) {
      this.availableAppointments = [];
      return;
    }

    this.appointmentService.getAppointmentsByDoctor(this.doctorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (appointments) => {
          // Filter appointments for the selected patient that are completed
          this.availableAppointments = appointments.filter(appointment => 
            appointment.patientId === patientId && 
            appointment.status === AppointmentStatus.Completed
          );
        },
        error: (err) => {
          console.error('Failed to load appointments', err);
          this.availableAppointments = [];
        }
      });
  }

  onPatientChange(): void {
    if (this.newRecord.patientId) {
      this.loadAvailableAppointments(this.newRecord.patientId);
    } else {
      this.availableAppointments = [];
    }
  }

  applyFilters(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredRecords = this.medicalRecords.filter(record => {
      const matchesTerm = 
        this.getPatientName(record.patientId).toLowerCase().includes(term) ||
        record.diagnosis?.toLowerCase().includes(term) ||
        record.treatmentPlan?.toLowerCase().includes(term) ||
        record.notes?.toLowerCase().includes(term) ||
        String(record.recordId).includes(term);

      const matchesPatient = this.selectedPatient === 'all' || record.patientId === this.selectedPatient;

      return matchesTerm && matchesPatient;
    });
  }

  // Modal Management
  openCreateRecordModal(): void {
    this.isEditing = false;
    this.newRecord = {
      patientId: 0,
      doctorId: this.doctorId!
    };
    this.availableAppointments = [];
    this.showRecordModal = true;
  }

  closeRecordModal(): void {
    this.showRecordModal = false;
    this.isEditing = false;
    this.newRecord = {
      patientId: 0,
      doctorId: this.doctorId!
    };
    this.availableAppointments = [];
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedRecord = null;
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

  // Form Validation
  isValidRecord(): boolean {
    return !!this.newRecord.patientId && this.newRecord.doctorId > 0;
  }

  // Actions
  createRecord(): void {
    if (!this.isValidRecord()) return;

    this.loading = true;
    this.medicalRecordsService.createRecord(this.newRecord)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (record) => {
          const newRecordWithDetails: MedicalRecordWithDetails = {
            ...record,
            patientDetails: this.patients.find(p => p.userId === record.patientId),
            prescriptionCount: 0
          };
          this.medicalRecords.push(newRecordWithDetails);
          this.applyFilters();
          this.closeRecordModal();
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to create medical record', err);
          this.error = 'Failed to create medical record. Please try again.';
          this.loading = false;
        }
      });
  }

  updateRecord(): void {
    if (!this.selectedRecord || !this.isValidRecord()) return;

    const updateData: UpdateMedicalRecordDto = {
      diagnosis: this.newRecord.diagnosis,
      treatmentPlan: this.newRecord.treatmentPlan,
      notes: this.newRecord.notes
    };

    this.loading = true;
    this.medicalRecordsService.updateRecord(this.selectedRecord.recordId, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedRecord) => {
          const index = this.medicalRecords.findIndex(r => r.recordId === updatedRecord.recordId);
          if (index !== -1) {
            this.medicalRecords[index] = {
              ...updatedRecord,
              patientDetails: this.medicalRecords[index].patientDetails,
              prescriptionCount: this.medicalRecords[index].prescriptionCount
            };
            this.applyFilters();
          }
          this.closeRecordModal();
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to update medical record', err);
          this.error = 'Failed to update medical record. Please try again.';
          this.loading = false;
        }
      });
  }

  viewRecordDetails(record: MedicalRecordWithDetails): void {
    this.selectedRecord = record;
    this.showDetailsModal = true;
  }

  editRecord(record: MedicalRecordWithDetails): void {
    this.isEditing = true;
    this.selectedRecord = record;
    this.newRecord = {
      patientId: record.patientId,
      doctorId: record.doctorId,
      appointmentId: record.appointmentId,
      diagnosis: record.diagnosis,
      treatmentPlan: record.treatmentPlan,
      notes: record.notes
    };
    this.showRecordModal = true;
  }

  getPrescriptionDetailsCount(prescriptionId: number): number {
    // This would need to be implemented based on your prescription details service
    return this.prescriptionDetailsCache.get(prescriptionId) || 0;
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

  formatAppointmentOption(appointment: AppointmentDto): string {
    const date = this.formatDate(appointment.appointmentDate);
    return `Appointment #${appointment.appointmentId} - ${date} - ${appointment.patientName}`;
  }
}