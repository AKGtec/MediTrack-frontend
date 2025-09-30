import { Component, computed, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorAvailabilityService } from '../../../core/services/doctor-availability.service';
import { DoctorAvailabilityDto, CreateDoctorAvailabilityDto, UpdateDoctorAvailabilityDto } from '../../../core/models/doctor-availability.models';
import { AuthStorage } from '../../../core/models/user.models';

interface ToastMessage {
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export enum DayOfWeek {
  Sunday = 'Sunday',
  Monday = 'Monday',
  Tuesday = 'Tuesday',
  Wednesday = 'Wednesday',
  Thursday = 'Thursday',
  Friday = 'Friday',
  Saturday = 'Saturday'
}

@Component({
  selector: 'app-doctor-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="schedule-container">
      <!-- Header Section -->
      <div class="header-section">
        <div class="header-content">
          <div class="title-group">
            <h1 class="page-title">
              <i class="icon calendar-icon">📅</i>
              Schedule Management
            </h1>
            <p class="page-subtitle">Manage your weekly availability and time slots</p>
          </div>
          <div class="header-actions">
            <button class="btn btn-refresh" (click)="loadAvailabilities()" [disabled]="loading()">
              <i class="icon">🔄</i>
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-overlay" *ngIf="loading()">
        <div class="spinner"></div>
        <p>Loading schedule...</p>
      </div>

      <!-- Main Content -->
      <div class="main-content" [class.loading]="loading()">
        <div class="content-grid">
          <!-- Schedule Form Card -->
          <div class="form-card">
            <div class="card-header">
              <h2>
                <i class="icon">{{ editingId() ? '✏️' : '➕' }}</i>
                {{ editingId() ? 'Edit' : 'Add' }} Availability
              </h2>
              <button 
                *ngIf="editingId()" 
                class="btn btn-ghost btn-sm" 
                (click)="cancelEdit()"
                title="Cancel editing">
                <i class="icon">❌</i>
              </button>
            </div>

            <form class="availability-form" (ngSubmit)="saveAvailability()">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">
                    <i class="icon">📅</i>
                    Day of Week
                  </label>
                  <select 
                    class="form-select" 
                    [(ngModel)]="form.dayOfWeek" 
                    name="dayOfWeek"
                    required>
                    <option *ngFor="let day of dayOptions" [ngValue]="day.value">
                      {{ day.label }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="form-row form-row-split">
                <div class="form-group">
                  <label class="form-label">
                    <i class="icon">🕐</i>
                    Start Time
                  </label>
                  <input 
                    type="time" 
                    class="form-input" 
                    [(ngModel)]="form.startTime" 
                    name="startTime"
                    required />
                </div>
                <div class="form-group">
                  <label class="form-label">
                    <i class="icon">🕕</i>
                    End Time
                  </label>
                  <input 
                    type="time" 
                    class="form-input" 
                    [(ngModel)]="form.endTime" 
                    name="endTime"
                    required />
                </div>
              </div>

              <div class="form-actions">
                <button 
                  type="button" 
                  class="btn btn-secondary" 
                  (click)="resetForm()">
                  <i class="icon">🔄</i>
                  Reset
                </button>
                <button 
                  type="submit" 
                  class="btn btn-primary" 
                  [disabled]="!isFormValid() || saving()"
                  [class.loading]="saving()">
                  <i class="icon">{{ editingId() ? '💾' : '➕' }}</i>
                  <span>{{ editingId() ? 'Update' : 'Add' }} Availability</span>
                  <div class="btn-spinner" *ngIf="saving()"></div>
                </button>
              </div>
            </form>
          </div>

          <!-- Weekly Schedule Card -->
          <div class="schedule-card">
            <div class="card-header">
              <h2>
                <i class="icon">📊</i>
                Weekly Schedule
              </h2>
              <div class="schedule-stats">
                <span class="stat-badge">
                  {{ totalSlots() }} slots
                </span>
              </div>
            </div>

            <div class="week-container">
              <div class="week-grid">
                <div 
                  class="day-column" 
                  *ngFor="let day of dayOptions; let dayIdx = index"
                  [class.has-slots]="getDayAvailabilities(day.value).length > 0">
                  
                  <div class="day-header">
                    <span class="day-name">{{ day.label }}</span>
                    <span class="day-count">{{ getDayAvailabilities(day.value).length }}</span>
                  </div>

                  <div class="slots-container">
                    <div 
                      class="time-slot" 
                      *ngFor="let availability of getDayAvailabilities(day.value); trackBy: trackByAvailability"
                      [class.editing]="editingId() === availability.availabilityId">
                      
                      <div class="slot-content">
                        <div class="slot-time">
                          <i class="icon">🕐</i>
                          {{ formatTime(availability.startTime) }} - {{ formatTime(availability.endTime) }}
                        </div>
                        <div class="slot-duration">
                          {{ calculateDuration(availability.startTime, availability.endTime) }}
                        </div>
                      </div>

                      <div class="slot-actions">
                        <button 
                          class="action-btn edit-btn" 
                          (click)="editAvailability(availability)"
                          title="Edit availability"
                          [disabled]="saving()">
                          <i class="icon">✏️</i>
                        </button>
                        <button 
                          class="action-btn delete-btn" 
                          (click)="deleteAvailability(availability)"
                          title="Delete availability"
                          [disabled]="saving()">
                          <i class="icon">🗑️</i>
                        </button>
                      </div>
                    </div>

                    <div class="empty-day" *ngIf="getDayAvailabilities(day.value).length === 0">
                      <i class="icon">📅</i>
                      <span>No availability</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Toast Notifications -->
      <div class="toast-container">
        <div 
          class="toast" 
          *ngFor="let toast of toasts()"
          [class]="'toast-' + toast.type"
          [@slideIn]>
          <div class="toast-icon">
            <i class="icon">{{ getToastIcon(toast.type) }}</i>
          </div>
          <div class="toast-content">
            <div class="toast-title">{{ toast.title }}</div>
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button class="toast-close" (click)="removeToast(toast)">
            <i class="icon">❌</i>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Global Styles */
    .schedule-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
    }

    /* Header Section */
    .header-section {
      margin-bottom: 2rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      padding: 2rem;
    }

    .title-group {
      flex: 1;
    }

    .page-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 0;
      font-size: 2.5rem;
      font-weight: 700;
      color: white;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .calendar-icon {
      font-size: 2.5rem;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    }

    .page-subtitle {
      margin: 0.5rem 0 0;
      font-size: 1.1rem;
      color: rgba(255, 255, 255, 0.8);
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    /* Loading State */
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(5px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #f3f4f6;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .main-content.loading {
      opacity: 0.3;
      pointer-events: none;
    }

    /* Content Grid */
    .content-grid {
      display: grid;
      grid-template-columns: 400px 1fr;
      gap: 2rem;
    }

    /* Card Styles */
    .form-card,
    .schedule-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem 2rem;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      border-bottom: 1px solid rgba(226, 232, 240, 0.5);
    }

    .card-header h2 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #334155;
    }

    /* Form Styles */
    .availability-form {
      padding: 2rem;
    }

    .form-row {
      margin-bottom: 1.5rem;
    }

    .form-row-split {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
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
      color: #374151;
      font-size: 0.9rem;
    }

    .form-select,
    .form-input {
      padding: 0.75rem 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      font-size: 1rem;
      transition: all 0.2s ease;
      background: white;
    }

    .form-select:focus,
    .form-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    /* Button Styles */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    }

    .btn-secondary {
      background: #f8fafc;
      color: #64748b;
      border: 2px solid #e2e8f0;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }

    .btn-refresh {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .btn-ghost {
      background: transparent;
      color: #64748b;
    }

    .btn-sm {
      padding: 0.5rem;
      font-size: 0.875rem;
    }

    .btn.loading .icon {
      opacity: 0;
    }

    .btn-spinner {
      position: absolute;
      width: 20px;
      height: 20px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
    }

    /* Schedule Styles */
    .schedule-stats {
      display: flex;
      gap: 0.5rem;
    }

    .stat-badge {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .week-container {
      padding: 1.5rem;
    }

    .week-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 1rem;
    }

    .day-column {
      border-radius: 16px;
      overflow: hidden;
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      transition: all 0.2s ease;
    }

    .day-column.has-slots {
      border-color: #cbd5e1;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    }

    .day-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      background: linear-gradient(135deg, #334155 0%, #475569 100%);
      color: white;
      font-weight: 600;
    }

    .day-name {
      font-size: 0.9rem;
    }

    .day-count {
      background: rgba(255, 255, 255, 0.2);
      padding: 0.25rem 0.5rem;
      border-radius: 999px;
      font-size: 0.75rem;
    }

    .slots-container {
      padding: 1rem;
      min-height: 200px;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .time-slot {
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 1rem;
      transition: all 0.2s ease;
      position: relative;
    }

    .time-slot:hover {
      border-color: #cbd5e1;
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }

    .time-slot.editing {
      border-color: #667eea;
      background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
    }

    .slot-content {
      margin-bottom: 0.75rem;
    }

    .slot-time {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }

    .slot-duration {
      font-size: 0.875rem;
      color: #64748b;
    }

    .slot-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .edit-btn {
      background: #f0f9ff;
      color: #0284c7;
    }

    .edit-btn:hover:not(:disabled) {
      background: #e0f2fe;
      transform: scale(1.1);
    }

    .delete-btn {
      background: #fef2f2;
      color: #dc2626;
    }

    .delete-btn:hover:not(:disabled) {
      background: #fee2e2;
      transform: scale(1.1);
    }

    .empty-day {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #9ca3af;
      font-style: italic;
    }

    .empty-day .icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      opacity: 0.5;
    }

    /* Toast Styles */
    .toast-container {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(10px);
      max-width: 400px;
      animation: slideIn 0.3s ease-out;
    }

    .toast-success {
      background: rgba(16, 185, 129, 0.9);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .toast-error {
      background: rgba(239, 68, 68, 0.9);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .toast-info {
      background: rgba(59, 130, 246, 0.9);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .toast-icon {
      font-size: 1.25rem;
    }

    .toast-content {
      flex: 1;
    }

    .toast-title {
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .toast-message {
      font-size: 0.9rem;
      opacity: 0.9;
    }

    .toast-close {
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      padding: 0.25rem;
      opacity: 0.7;
      transition: opacity 0.2s ease;
    }

    .toast-close:hover {
      opacity: 1;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    /* Responsive Design */
    @media (max-width: 1400px) {
      .content-grid {
        grid-template-columns: 350px 1fr;
      }
    }

    @media (max-width: 1200px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
      
      .week-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    @media (max-width: 768px) {
      .schedule-container {
        padding: 1rem;
      }
      
      .header-content {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }
      
      .page-title {
        font-size: 2rem;
      }
      
      .week-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .form-row-split {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 480px) {
      .week-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Utility Classes */
    .icon {
      display: inline-block;
    }
  `]
})
export class ScheduleComponent implements OnInit {
  private doctorAvailabilityService = inject(DoctorAvailabilityService);
  
  // Signals for state management
  availabilities = signal<DoctorAvailabilityDto[]>([]);
  loading = signal(false);
  saving = signal(false);
  editingId = signal<number | null>(null);
  toasts = signal<ToastMessage[]>([]);

  // Logged-in doctor ID retrieved from stored auth data
  private readonly doctorId: number | null = AuthStorage.get()?.user.userId ?? null;

  constructor() {
    if (!this.doctorId) {
      this.showToast('Error', 'Doctor information missing. Please log in again.', 'error');
    }
  }

  dayOptions = [
    { value: DayOfWeek.Monday, label: 'Monday' },
    { value: DayOfWeek.Tuesday, label: 'Tuesday' },
    { value: DayOfWeek.Wednesday, label: 'Wednesday' },
    { value: DayOfWeek.Thursday, label: 'Thursday' },
    { value: DayOfWeek.Friday, label: 'Friday' },
    { value: DayOfWeek.Saturday, label: 'Saturday' },
    { value: DayOfWeek.Sunday, label: 'Sunday' }
  ];

  form: Omit<CreateDoctorAvailabilityDto, 'doctorId'> = {
    dayOfWeek: DayOfWeek.Monday,
    startTime: '09:00',
    endTime: '17:00'
  };

  // Computed values
  totalSlots = computed(() => this.availabilities().length);

  ngOnInit() {
    this.loadAvailabilities();
  }

  loadAvailabilities() {
    if (!this.doctorId) {
      this.showToast('Error', 'Doctor information missing. Please log in again.', 'error');
      return;
    }

    this.loading.set(true);
    this.doctorAvailabilityService.getAvailabilityByDoctor(this.doctorId)
      .subscribe({
        next: (availabilities) => {
          this.availabilities.set(availabilities);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading availabilities:', error);
          this.showToast('Error', 'Failed to load availabilities', 'error');
          this.loading.set(false);
        }
      });
  }

  getDayAvailabilities(dayOfWeek: DayOfWeek): DoctorAvailabilityDto[] {
    return this.availabilities()
      .filter(a => a.dayOfWeek === dayOfWeek)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  isFormValid(): boolean {
    return !!(
      this.form.dayOfWeek !== undefined &&
      this.form.startTime &&
      this.form.endTime &&
      this.form.startTime < this.form.endTime
    );
  }

  saveAvailability() {
    if (!this.isFormValid()) return;
    if (!this.doctorId) {
      this.showToast('Error', 'Doctor information missing. Please log in again.', 'error');
      return;
    }

    this.saving.set(true);
    const editId = this.editingId();

    if (editId) {
      // Update existing availability
      const updateDto: UpdateDoctorAvailabilityDto = {
        dayOfWeek: this.form.dayOfWeek,
        startTime: this.form.startTime,
        endTime: this.form.endTime
      };

      this.doctorAvailabilityService.updateAvailability(editId, updateDto)
        .subscribe({
          next: (updated) => {
            const currentAvailabilities = this.availabilities();
            const index = currentAvailabilities.findIndex(a => a.availabilityId === editId);
            if (index !== -1) {
              const newAvailabilities = [...currentAvailabilities];
              newAvailabilities[index] = updated;
              this.availabilities.set(newAvailabilities);
            }
            
            this.showToast('Success', 'Availability updated successfully', 'success');
            this.resetForm();
            this.saving.set(false);
          },
          error: (error) => {
            console.error('Error updating availability:', error);
            this.showToast('Error', 'Failed to update availability', 'error');
            this.saving.set(false);
          }
        });
    } else {
      // Create new availability
      const createDto: CreateDoctorAvailabilityDto = {
        doctorId: this.doctorId!,
        dayOfWeek: this.form.dayOfWeek,
        startTime: this.form.startTime,
        endTime: this.form.endTime
      };

      this.doctorAvailabilityService.addAvailability(createDto)
        .subscribe({
          next: (created) => {
            this.availabilities.set([...this.availabilities(), created]);
            this.showToast('Success', 'Availability added successfully', 'success');
            this.resetForm();
            this.saving.set(false);
          },
          error: (error) => {
            console.error('Error creating availability:', error);
            this.showToast('Error', 'Failed to add availability', 'error');
            this.saving.set(false);
          }
        });
    }
  }

  editAvailability(availability: DoctorAvailabilityDto) {
    this.editingId.set(availability.availabilityId);
    this.form = {
      dayOfWeek: availability.dayOfWeek,
      startTime: availability.startTime,
      endTime: availability.endTime
    };
  }

  deleteAvailability(availability: DoctorAvailabilityDto) {
    if (!confirm('Are you sure you want to delete this availability?')) {
      return;
    }

    this.saving.set(true);
    this.doctorAvailabilityService.deleteAvailability(availability.availabilityId)
      .subscribe({
        next: () => {
          const filtered = this.availabilities().filter(a => a.availabilityId !== availability.availabilityId);
          this.availabilities.set(filtered);
          this.showToast('Success', 'Availability deleted successfully', 'success');
          this.saving.set(false);
        },
        error: (error) => {
          console.error('Error deleting availability:', error);
          this.showToast('Error', 'Failed to delete availability', 'error');
          this.saving.set(false);
        }
      });
  }

  cancelEdit() {
    this.editingId.set(null);
    this.resetForm();
  }

  resetForm() {
    this.editingId.set(null);
    this.form = {
      dayOfWeek: DayOfWeek.Monday,
      startTime: '09:00',
      endTime: '17:00'
    };
  }

  formatTime(time: string): string {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  }

  calculateDuration(startTime: string, endTime: string): string {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours === 0) {
      return `${diffMinutes}min`;
    } else if (diffMinutes === 0) {
      return `${diffHours}h`;
    } else {
      return `${diffHours}h ${diffMinutes}min`;
    }
  }

  trackByAvailability(index: number, availability: DoctorAvailabilityDto): number {
    return availability.availabilityId;
  }

  showToast(title: string, message: string, type: 'success' | 'error' | 'info') {
    const toast: ToastMessage = { title, message, type };
    this.toasts.set([...this.toasts(), toast]);
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      this.removeToast(toast);
    }, 5000);
  }

  removeToast(toastToRemove: ToastMessage) {
    this.toasts.set(this.toasts().filter(toast => toast !== toastToRemove));
  }

  getToastIcon(type: 'success' | 'error' | 'info'): string {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  }
}