import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { DoctorsService } from '../../../core/services/doctors.service';
import { DoctorAvailabilityService } from '../../../core/services/doctor-availability.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { DoctorDto } from '../../../core/models/doctor.models';
import { DoctorAvailabilityDto } from '../../../core/models/doctor-availability.models';
import { AppointmentDto, CreateAppointmentDto } from '../../../core/models/appointment.models';
import { AuthStorage } from '../../../core/models/user.models';

interface TimeSlot {
  time: string;
  available: boolean;
  availabilityId?: number;
}

@Component({
  selector: 'app-appointment-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="booking-container" *ngIf="!isLoading(); else loading">
      <!-- Header Section -->
      <div class="header-section">
        <div class="header-content">
          <div class="title-group">
            <h1 class="main-title">Book Your Appointment</h1>
            <p class="subtitle">Find the perfect specialist and schedule your visit with ease</p>
          </div>
          <div class="header-decoration">
            <div class="decoration-circle"></div>
            <div class="decoration-wave"></div>
          </div>
        </div>
      </div>

      <!-- Search & Filters Section -->
      <div class="filters-section">
        <div class="filters-grid">
          <div class="filter-group">
            <label class="filter-label">
              <i class="icon">local_hospital</i>
              Specialty
            </label>
            <div class="select-wrapper">
              <select [(ngModel)]="selectedSpecialty" (change)="onSpecialtyChange()" class="modern-select">
                <option value="">All Specialties</option>
                <option *ngFor="let s of specialties" [value]="s">{{ s }}</option>
              </select>
              <i class="select-arrow">expand_more</i>
            </div>
          </div>

          <div class="filter-group">
            <label class="filter-label">
              <i class="icon">person</i>
              Doctor
            </label>
            <div class="select-wrapper">
              <select [(ngModel)]="selectedDoctorId" (change)="onDoctorChange()" class="modern-select">
                <option [ngValue]="null">Choose a doctor</option>
                <option *ngFor="let d of filteredDoctors" [ngValue]="d.userId">
                  {{ d.fullName }} • {{ d.specialization }}
                </option>
              </select>
              <i class="select-arrow">expand_more</i>
            </div>
          </div>

          <div class="filter-group">
            <label class="filter-label">
              <i class="icon">event</i>
              Date
            </label>
            <div class="date-input-wrapper">
              <input 
                type="date" 
                [(ngModel)]="selectedDate" 
                (change)="loadTimeSlots()"
                class="modern-date-input"
              />
              <i class="date-icon">calendar_today</i>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="main-content">
        <!-- Doctors Panel -->
        <div class="panel doctors-panel">
          <div class="panel-header">
            <div class="panel-title-group">
              <h2 class="panel-title">Available Doctors</h2>
              <span class="count-badge">{{ filteredDoctors.length }}</span>
            </div>
            <div class="search-box">
              <i class="icon">search</i>
              <input 
                type="text" 
                placeholder="Search doctors..." 
                (input)="onSearchDoctors($event)"
                class="search-input"
              />
            </div>
          </div>

          <div class="doctors-list">
            <div 
              class="doctor-card" 
              *ngFor="let d of filteredDoctors" 
              [class.active]="d.userId === selectedDoctorId" 
              (click)="selectDoctor(d)"
            >
              <div class="doctor-avatar">
                <div class="avatar-initial">{{ d.fullName.charAt(0) }}</div>
                <div class="online-indicator" [class.available]="d.availabilityStatus"></div>
              </div>
              <div class="doctor-info">
                <h3 class="doctor-name">{{ d.fullName }}</h3>
                <p class="doctor-specialty">{{ d.specialization }}</p>
                <div class="doctor-meta">
                  <span class="clinic-name">
                    <i class="icon small">location_on</i>
                    {{ d.clinicName }}
                  </span>
                  <span class="rating" *ngIf="d.availabilityStatus">
                    <i class="icon small">star</i>
                    {{ 5 }}
                  </span>
                </div>
              </div>
              <i class="nav-icon">chevron_right</i>
            </div>

            <div class="empty-state" *ngIf="filteredDoctors.length === 0">
              <div class="empty-illustration">
                <i class="icon">groups</i>
              </div>
              <h3>No doctors found</h3>
              <p>Try adjusting your search criteria</p>
            </div>
          </div>
        </div>

        <!-- Time Slots & Booking Panel -->
        <div class="panel booking-panel">
          <div class="panel-header">
            <div class="panel-title-group">
              <h2 class="panel-title">Available Time Slots</h2>
              <span class="selected-info" *ngIf="selectedDoctorId && selectedDate">
                Dr. {{ getSelectedDoctor()?.fullName }} • {{ selectedDate | date:'EEEE, MMMM d' }}
              </span>
            </div>
          </div>

          <!-- Time Slots Grid -->
          <div class="time-slots-section">
            <div class="time-slots-grid">
              <button 
                class="time-slot-card" 
                *ngFor="let s of timeSlots"
                [disabled]="!s.available"
                [class.selected]="s.time === selectedTime"
                [class.unavailable]="!s.available"
                (click)="selectTime(s.time)"
              >
                <div class="time-slot-content">
                  <i class="slot-icon">schedule</i>
                  <span class="slot-time">{{ s.time }}</span>
                  <span class="slot-status" [class.available]="s.available">
                    {{ s.available ? 'Available' : 'Booked' }}
                  </span>
                </div>
              </button>
            </div>

            <div class="empty-state" *ngIf="timeSlots.length === 0">
              <div class="empty-illustration">
                <i class="icon">event_busy</i>
              </div>
              <h3>No available slots</h3>
              <p>Select a doctor and date to view availability</p>
            </div>
          </div>

          <!-- Booking Form -->
          <div class="booking-form-section" *ngIf="selectedTime">
            <div class="form-header">
              <h3>Appointment Details</h3>
              <div class="selected-time">
                <i class="icon">check_circle</i>
                Selected: {{ selectedTime }}
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">
                  <i class="icon">description</i>
                  Reason for Visit
                </label>
                <input 
                  type="text" 
                  [(ngModel)]="reason" 
                  placeholder="e.g., General consultation, Follow-up, Specific concern..."
                  class="modern-input"
                />
              </div>
              
              <div class="form-group">
                <label class="form-label">
                  <i class="icon">note</i>
                  Additional Notes
                </label>
                <textarea 
                  [(ngModel)]="notes" 
                  rows="3" 
                  placeholder="Any specific symptoms, concerns, or information you'd like to share with the doctor..."
                  class="modern-textarea"
                ></textarea>
              </div>
            </div>

            <div class="action-buttons">
              <button class="btn secondary" (click)="reset()">
                <i class="icon">refresh</i>
                <span>Clear All</span>
              </button>
              <button 
                class="btn primary" 
                [disabled]="!canBook()" 
                (click)="bookAppointment()"
                [class.loading]="isLoading()"
              >
                <i class="icon" *ngIf="!isLoading()">event_available</i>
                <div class="spinner" *ngIf="isLoading()"></div>
                <span>{{ isLoading() ? 'Booking...' : 'Confirm Appointment' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Notifications -->
      <div class="notification-container">
        <!-- Error Toast -->
        <div class="toast error" *ngIf="error" @fadeInOut>
          <div class="toast-icon">
            <i class="icon">error</i>
          </div>
          <div class="toast-content">
            <div class="toast-title">Booking Failed</div>
            <div class="toast-message">{{ error }}</div>
          </div>
          <button class="toast-close" (click)="error = null">
            <i class="icon">close</i>
          </button>
        </div>

        <!-- Success Toast -->
        <div class="toast success" *ngIf="confirmation" @fadeInOut>
          <div class="toast-icon">
            <i class="icon">check_circle</i>
          </div>
          <div class="toast-content">
            <div class="toast-title">Appointment Confirmed!</div>
            <div class="toast-message">
              Your appointment with {{ confirmation.doctor }} on 
              {{ confirmation.date | date:'fullDate' }} at {{ confirmation.time }} has been scheduled.
            </div>
          </div>
          <button class="toast-close" (click)="confirmation = null">
            <i class="icon">close</i>
          </button>
        </div>
      </div>
    </div>

    <ng-template #loading>
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <h3>Loading appointment data...</h3>
        <p>Please wait while we prepare your booking experience</p>
      </div>
    </ng-template>
  `,
  styles: [
    `
    /* Modern CSS Variables */
    :host {
      --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      --secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      --success-gradient: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      --background: #f8fafc;
      --surface: #ffffff;
      --text-primary: #1e293b;
      --text-secondary: #64748b;
      --text-muted: #94a3b8;
      --border: #e2e8f0;
      --border-light: #f1f5f9;
      --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      --shadow-lg: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
      --radius: 16px;
      --radius-sm: 8px;
    }

    * {
      box-sizing: border-box;
    }

    .booking-container {
      min-height: 100vh;
      background: var(--background);
      padding: 2rem;
    }

    /* Header Section */
    .header-section {
      margin-bottom: 2rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      position: relative;
    }

    .title-group {
      z-index: 2;
    }

    .main-title {
      font-size: 2.5rem;
      font-weight: 800;
      background: var(--primary-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 0 0 0.5rem 0;
      line-height: 1.2;
    }

    .subtitle {
      font-size: 1.125rem;
      color: var(--text-secondary);
      margin: 0;
      font-weight: 500;
    }

    .header-decoration {
      position: absolute;
      right: 0;
      bottom: 0;
    }

    .decoration-circle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: var(--secondary-gradient);
      opacity: 0.1;
    }

    .decoration-wave {
      width: 80px;
      height: 80px;
      background: var(--success-gradient);
      opacity: 0.05;
      border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
      position: absolute;
      right: 60px;
      bottom: 20px;
    }

    /* Filters Section */
    .filters-section {
      background: var(--surface);
      border-radius: var(--radius);
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: var(--shadow);
      border: 1px solid var(--border-light);
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: var(--text-primary);
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .filter-label .icon {
      font-size: 1.125rem;
      color: #667eea;
    }

    .select-wrapper, .date-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .modern-select, .modern-date-input, .modern-input, .modern-textarea {
      width: 100%;
      padding: 0.875rem 1rem;
      border: 2px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--surface);
      font-size: 0.95rem;
      transition: all 0.2s ease;
      appearance: none;
    }

    .modern-select:focus, .modern-date-input:focus, .modern-input:focus, .modern-textarea:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .select-arrow {
      position: absolute;
      right: 1rem;
      pointer-events: none;
      color: var(--text-muted);
    }

    .date-icon {
      position: absolute;
      right: 1rem;
      pointer-events: none;
      color: var(--text-muted);
    }

    /* Main Content */
    .main-content {
      display: grid;
      grid-template-columns: 1fr 1.5fr;
      gap: 2rem;
      align-items: start;
    }

    @media (max-width: 1024px) {
      .main-content {
        grid-template-columns: 1fr;
      }
    }

    /* Panels */
    .panel {
      background: var(--surface);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      border: 1px solid var(--border-light);
      overflow: hidden;
    }

    .panel-header {
      padding: 1.5rem;
      border-bottom: 1px solid var(--border-light);
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    }

    .panel-title-group {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .panel-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .count-badge {
      background: var(--primary-gradient);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .selected-info {
      font-size: 0.875rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    /* Search Box */
    .search-box {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-box .icon {
      position: absolute;
      left: 1rem;
      color: var(--text-muted);
    }

    .search-input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 2.5rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--surface);
      font-size: 0.875rem;
      transition: all 0.2s ease;
    }

    .search-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    /* Doctors List */
    .doctors-list {
      max-height: 600px;
      overflow-y: auto;
    }

    .doctor-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      border-bottom: 1px solid var(--border-light);
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    }

    .doctor-card:hover {
      background: #f8fafc;
      transform: translateX(4px);
    }

    .doctor-card.active {
      background: linear-gradient(135deg, #667eea10 0%, #764ba210 100%);
      border-left: 4px solid #667eea;
    }

    .doctor-avatar {
      position: relative;
      flex-shrink: 0;
    }

    .avatar-initial {
      width: 48px;
      height: 48px;
      background: var(--primary-gradient);
      color: white;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.125rem;
    }

    .online-indicator {
      width: 12px;
      height: 12px;
      border: 2px solid white;
      border-radius: 50%;
      position: absolute;
      bottom: -2px;
      right: -2px;
      background: #94a3b8;
    }

    .online-indicator.available {
      background: #10b981;
    }

    .doctor-info {
      flex: 1;
      min-width: 0;
    }

    .doctor-name {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.25rem 0;
    }

    .doctor-specialty {
      font-size: 0.875rem;
      color: #667eea;
      font-weight: 500;
      margin: 0 0 0.5rem 0;
    }

    .doctor-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .doctor-meta .icon.small {
      font-size: 0.875rem;
    }

    .nav-icon {
      color: var(--text-muted);
      font-size: 1.25rem;
    }

    /* Time Slots */
    .time-slots-section {
      padding: 1.5rem;
    }

    .time-slots-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 1rem;
    }

    .time-slot-card {
      border: 2px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 1rem;
      background: var(--surface);
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
    }

    .time-slot-card:hover:not(.unavailable):not([disabled]) {
      border-color: #667eea;
      transform: translateY(-2px);
      box-shadow: var(--shadow);
    }

    .time-slot-card.selected {
      background: linear-gradient(135deg, #667eea10 0%, #764ba210 100%);
      border-color: #667eea;
    }

    .time-slot-card.unavailable {
      opacity: 0.5;
      cursor: not-allowed;
      background: #f8fafc;
    }

    .time-slot-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      text-align: center;
    }

    .slot-icon {
      font-size: 1.5rem;
      color: var(--text-muted);
    }

    .time-slot-card.selected .slot-icon {
      color: #667eea;
    }

    .slot-time {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .slot-status {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      background: #f1f5f9;
      color: var(--text-muted);
    }

    .slot-status.available {
      background: #d1fae5;
      color: #065f46;
    }

    /* Booking Form */
    .booking-form-section {
      padding: 1.5rem;
      border-top: 1px solid var(--border-light);
      background: #f8fafc;
    }

    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .form-header h3 {
      margin: 0;
      color: var(--text-primary);
      font-size: 1.125rem;
    }

    .selected-time {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--success-gradient);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .form-grid {
      display: grid;
      gap: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: var(--text-primary);
      font-size: 0.875rem;
    }

    .form-label .icon {
      color: #667eea;
      font-size: 1.125rem;
    }

    .modern-textarea {
      resize: vertical;
      min-height: 80px;
      font-family: inherit;
    }

    /* Action Buttons */
    .action-buttons {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      border: none;
      border-radius: var(--radius-sm);
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn.secondary {
      background: var(--surface);
      color: var(--text-secondary);
      border: 2px solid var(--border);
    }

    .btn.secondary:hover:not(:disabled) {
      background: #f1f5f9;
      border-color: var(--text-muted);
    }

    .btn.primary {
      background: var(--primary-gradient);
      color: white;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }

    .btn.primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    }

    .btn.primary.loading {
      pointer-events: none;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Empty States */
    .empty-state {
      text-align: center;
      padding: 3rem 2rem;
      color: var(--text-muted);
    }

    .empty-illustration {
      font-size: 4rem;
      color: var(--border);
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem 0;
      color: var(--text-secondary);
      font-size: 1.125rem;
    }

    .empty-state p {
      margin: 0;
      font-size: 0.875rem;
    }

    /* Notifications */
    .notification-container {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      z-index: 1000;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem 1.25rem;
      border-radius: var(--radius);
      box-shadow: var(--shadow-lg);
      margin-bottom: 1rem;
      max-width: 400px;
      animation: slideInRight 0.3s ease;
      border-left: 4px solid;
    }

    .toast.success {
      background: var(--surface);
      border-left-color: #10b981;
    }

    .toast.error {
      background: var(--surface);
      border-left-color: #ef4444;
    }

    .toast-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .toast.success .toast-icon {
      color: #10b981;
    }

    .toast.error .toast-icon {
      color: #ef4444;
    }

    .toast-content {
      flex: 1;
      min-width: 0;
    }

    .toast-title {
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }

    .toast-message {
      font-size: 0.875rem;
      color: var(--text-secondary);
      line-height: 1.4;
    }

    .toast-close {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .toast-close:hover {
      background: #f1f5f9;
      color: var(--text-primary);
    }

    /* Loading State */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      text-align: center;
    }

    .loading-spinner {
      width: 48px;
      height: 48px;
      border: 3px solid #f1f5f9;
      border-top: 3px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1.5rem;
    }

    .loading-container h3 {
      margin: 0 0 0.5rem 0;
      color: var(--text-primary);
    }

    .loading-container p {
      margin: 0;
      color: var(--text-secondary);
    }

    /* Animations */
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes fadeInOut {
      0% { opacity: 0; transform: translateY(10px); }
      10% { opacity: 1; transform: translateY(0); }
      90% { opacity: 1; transform: translateY(0); }
      100% { opacity: 0; transform: translateY(-10px); }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .booking-container {
        padding: 1rem;
      }

      .main-title {
        font-size: 2rem;
      }

      .filters-grid {
        grid-template-columns: 1fr;
      }

      .action-buttons {
        flex-direction: column;
      }

      .btn {
        justify-content: center;
      }

      .notification-container {
        bottom: 1rem;
        right: 1rem;
        left: 1rem;
      }

      .toast {
        max-width: none;
      }
    }
    `
  ]
})
export class BookingComponent implements OnInit {
  private readonly doctorsService = inject(DoctorsService);
  private readonly availabilityService = inject(DoctorAvailabilityService);
  private readonly appointmentService = inject(AppointmentService);

  private readonly loadingSignal = signal<boolean>(false);

  readonly isLoading = computed(() => this.loadingSignal());

  doctors: DoctorDto[] = [];
  filteredDoctors: DoctorDto[] = [];
  specialties: string[] = [];

  selectedSpecialty: string = '';
  selectedDoctorId: number | null = null;
  selectedDate: string = '';
  selectedTime: string | null = null;

  timeSlots: TimeSlot[] = [];

  reason = '';
  notes = '';

  confirmation: { doctor: string; date: string; time: string } | null = null;
  error: string | null = null;

  ngOnInit(): void {
    this.fetchDoctors();
  }

  onSpecialtyChange() {
    this.filteredDoctors = this.selectedSpecialty
      ? this.doctors.filter(d => d.specialization === this.selectedSpecialty)
      : [...this.doctors];

    // Reset selection if current doctor not in filtered list
    if (!this.filteredDoctors.find(d => d.userId === this.selectedDoctorId)) {
      this.selectedDoctorId = null;
      this.timeSlots = [];
      this.selectedTime = null;
    }
  }

  onDoctorChange() {
    this.loadTimeSlots();
  }

  onSearchDoctors(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    if (!searchTerm) {
      this.onSpecialtyChange();
      return;
    }

    this.filteredDoctors = this.doctors.filter(d => 
      d.fullName.toLowerCase().includes(searchTerm) ||
      d.specialization.toLowerCase().includes(searchTerm) ||
      d.clinicName.toLowerCase().includes(searchTerm)
    );
  }

  selectDoctor(d: DoctorDto) {
    this.selectedDoctorId = d.userId;
    this.loadTimeSlots();
  }

  loadTimeSlots() {
    this.timeSlots = [];
    this.selectedTime = null;

    if (!this.selectedDoctorId || !this.selectedDate) {
      return;
    }

    this.loadingSignal.set(true);
    this.error = null;

    // Fetch availability for the selected doctor
    this.availabilityService.getAvailabilityByDoctor(this.selectedDoctorId)
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: (availabilities) => {
          this.timeSlots = this.mapAvailabilityToSlots(availabilities, this.selectedDate);
        },
        error: (err) => {
          console.error('Failed to load availability', err);
          this.error = 'Unable to load availability for the selected doctor. Please try again later.';
        }
      });
  }

  selectTime(time: string) {
    if (!this.timeSlots.find(s => s.time === time && s.available)) return;
    this.selectedTime = time;
  }

  canBook(): boolean {
    return !!(this.selectedDoctorId && this.selectedDate && this.selectedTime);
  }

  bookAppointment() {
    if (!this.canBook()) return;

    const auth = AuthStorage.get();
    const patientId = auth?.user?.userId;

    if (!patientId) {
      this.error = 'Unable to identify the logged-in patient. Please log in again.';
      return;
    }

    const appointmentPayload: CreateAppointmentDto = {
      patientId,
      doctorId: this.selectedDoctorId!,
      appointmentDate: new Date(`${this.selectedDate}T${this.selectedTime}:00`)
    };

    this.loadingSignal.set(true);
    this.error = null;

    this.appointmentService.scheduleAppointment(appointmentPayload)
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: (appointment: AppointmentDto) => {
          const doctor = this.getSelectedDoctor()?.fullName || 'Selected doctor';
          const bookedTime = this.selectedTime!;
          this.confirmation = {
            doctor,
            date: appointment.appointmentDate as unknown as string,
            time: bookedTime
          };

          this.reason = '';
          this.notes = '';
        },
        error: (err) => {
          console.error('Failed to schedule appointment', err);

          if (err?.status === 409 && err?.error?.message) {
            this.error = err.error.message;
          } else {
            this.error = 'Unable to book the appointment. Please try again later.';
          }
        }
      });
  }

  getSelectedDoctor(): DoctorDto | undefined {
    return this.doctors.find(d => d.userId === this.selectedDoctorId!);
  }

  reset() {
    this.selectedSpecialty = '';
    this.filteredDoctors = [...this.doctors];
    this.selectedDoctorId = null;
    this.selectedDate = '';
    this.selectedTime = null;
    this.timeSlots = [];
    this.reason = '';
    this.notes = '';
    this.confirmation = null;
    this.error = null;
  }

  private fetchDoctors() {
    this.loadingSignal.set(true);
    this.error = null;

    this.doctorsService.getAllDoctors()
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: (doctors) => {
          this.doctors = doctors;
          this.filteredDoctors = [...doctors];
          this.specialties = Array.from(new Set(doctors.map(d => d.specialization).filter(Boolean)));
        },
        error: (err) => {
          console.error('Failed to load doctors', err);
          this.error = 'Unable to load doctors list. Please try again later.';
        }
      });
  }

  private mapAvailabilityToSlots(availabilities: DoctorAvailabilityDto[], targetDate: string): TimeSlot[] {
    if (!availabilities.length) {
      return [];
    }

    const targetDay = new Date(targetDate).toLocaleDateString('en-US', { weekday: 'long' });

    const relevantAvailabilities = availabilities.filter(a => a.dayOfWeek === targetDay);

    const slots: TimeSlot[] = [];

    relevantAvailabilities.forEach(avail => {
      const start = this.parseTime(avail.startTime);
      const end = this.parseTime(avail.endTime);

      let current = new Date(start);
      while (current < end) {
        const label = current.toTimeString().slice(0, 5);

        slots.push({
          time: label,
          available: true,
          availabilityId: avail.availabilityId
        });

        current = new Date(current.getTime() + 30 * 60000);
      }
    });

    return slots;
  }

  private parseTime(time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }
}