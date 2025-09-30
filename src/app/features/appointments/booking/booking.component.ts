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
    <div class="booking" *ngIf="!isLoading(); else loading">
      <div class="header">
        <div class="header-content">
          <h1 class="page-title">Book an Appointment</h1>
          <p class="page-subtitle">Find a doctor and choose an available time slot</p>
        </div>
      </div>

      <!-- Search/Filters -->
      <div class="filters">
        <div class="form-group">
          <label>Specialty</label>
          <select [(ngModel)]="selectedSpecialty" (change)="onSpecialtyChange()">
            <option value="">All Specialties</option>
            <option *ngFor="let s of specialties" [value]="s">{{ s }}</option>
          </select>
        </div>

        <div class="form-group">
          <label>Doctor</label>
          <select [(ngModel)]="selectedDoctorId" (change)="onDoctorChange()">
            <option [ngValue]="null">Select a doctor</option>
            <option *ngFor="let d of filteredDoctors" [ngValue]="d.userId">{{ d.fullName }} ({{ d.specialization }})</option>
          </select>
        </div>

        <div class="form-group">
          <label>Date</label>
          <input type="date" [(ngModel)]="selectedDate" (change)="loadTimeSlots()"/>
        </div>
      </div>

      <div class="content-grid">
        <!-- Doctors list -->
        <div class="card doctors">
          <div class="card-header">
            <h2>Available Doctors</h2>
            <span class="badge">{{ filteredDoctors.length }}</span>
          </div>
          <div class="doctor-list">
            <div class="doctor-item" *ngFor="let d of filteredDoctors" [class.active]="d.userId === selectedDoctorId" (click)="selectDoctor(d)">
              <div class="avatar">{{ d.fullName.charAt(0) }}</div>
              <div class="meta">
                <div class="name">{{ d.fullName }}</div>
                <div class="sub">{{ d.specialization }} • {{ d.clinicName }}</div>
              </div>
              <i class="icon">chevron_right</i>
            </div>

            <div class="empty-state" *ngIf="filteredDoctors.length === 0">
              <div class="empty-icon"><i class="icon">groups</i></div>
              <h3>No doctors found</h3>
              <p>Try a different specialty</p>
            </div>
          </div>
        </div>

        <!-- Time slots and booking form -->
        <div class="card slots">
          <div class="card-header">
            <h2>Available Time Slots</h2>
            <span class="hint" *ngIf="selectedDoctorId && selectedDate">For {{ getSelectedDoctor()?.fullName }} on {{ selectedDate | date:'fullDate' }}</span>
          </div>

          <div class="slots-grid">
            <button class="slot" *ngFor="let s of timeSlots"
                    [disabled]="!s.available"
                    [class.selected]="s.time === selectedTime"
                    (click)="selectTime(s.time)">
              <i class="icon">schedule</i>
              <span>{{ s.time }}</span>
            </button>
          </div>

          <div class="empty-state" *ngIf="timeSlots.length === 0">
            <div class="empty-icon"><i class="icon">event_busy</i></div>
            <h3>No time slots</h3>
            <p>Select a doctor and date to see availability</p>
          </div>

          <div class="divider"></div>

          <div class="booking-form">
            <h3>Appointment Details</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Reason for visit</label>
                <input type="text" [(ngModel)]="reason" placeholder="e.g., General consultation"/>
              </div>
              <div class="form-group">
                <label>Notes</label>
                <textarea [(ngModel)]="notes" rows="3" placeholder="Optional notes for the doctor"></textarea>
              </div>
            </div>

            <div class="actions">
              <button class="btn secondary" (click)="reset()">
                <i class="icon">refresh</i>
                <span>Reset</span>
              </button>
              <button class="btn primary" [disabled]="!canBook()" (click)="bookAppointment()">
                <i class="icon">event_available</i>
                <span>Book Appointment</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Error banner -->
      <div class="toast error" *ngIf="error">
        <i class="icon">error</i>
        <div class="toast-content">
          <div class="title">Booking failed</div>
          <div class="sub">{{ error }}</div>
        </div>
        <button class="close" (click)="error = null"><i class="icon">close</i></button>
      </div>

      <!-- Confirmation banner -->
      <div class="toast" *ngIf="confirmation">
        <i class="icon">check_circle</i>
        <div class="toast-content">
          <div class="title">Appointment Booked</div>
          <div class="sub">Your appointment with {{ confirmation.doctor }} on {{ confirmation.date | date:'fullDate' }} at {{ confirmation.time }} is confirmed.</div>
        </div>
        <button class="close" (click)="confirmation = null"><i class="icon">close</i></button>
      </div>
    </div>
    <ng-template #loading>
      <div class="booking loading-state">
        <p>Loading booking data...</p>
      </div>
    </ng-template>
  `,
  styles: [
    `
    .booking { padding: 1rem; }
    .header { margin-bottom: 1rem; }
    .page-title { margin: 0; font-weight: 700; font-size: 1.5rem; }
    .page-subtitle { margin: 0.25rem 0 0; color: #6b7280; }
    .filters { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; background: #fff; border: 1px solid #e5e7eb; padding: 1rem; border-radius: 12px; }
    .form-group { display: flex; flex-direction: column; gap: 0.25rem; }
    .form-group label { font-weight: 600; color: #374151; }
    .form-group select, .form-group input, .form-group textarea { padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; background: #fff; }

    .content-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 1rem; margin-top: 1rem; }
    .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
    .card-header { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border-bottom: 1px solid #f3f4f6; }
    .card-header h2 { margin: 0; font-size: 1.125rem; }
    .badge { background: #eef2ff; color: #3730a3; border-radius: 999px; padding: 0.125rem 0.5rem; font-size: 0.75rem; }

    .doctor-list { max-height: 520px; overflow: auto; }
    .doctor-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-bottom: 1px solid #f3f4f6; cursor: pointer; }
    .doctor-item:hover { background: #f9fafb; }
    .doctor-item.active { background: #eef2ff; }
    .avatar { width: 36px; height: 36px; background: #4338ca; color: #fff; border-radius: 999px; display: grid; place-items: center; font-weight: 700; }
    .meta .name { font-weight: 600; }
    .meta .sub { color: #6b7280; font-size: 0.875rem; }

    .slots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.5rem; padding: 1rem; }
    .slot { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.5rem; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer; }
    .slot[disabled] { opacity: 0.5; cursor: not-allowed; }
    .slot.selected { background: #eef2ff; border-color: #c7d2fe; }

    .divider { height: 1px; background: #f3f4f6; margin: 0 1rem; }

    .booking-form { padding: 1rem; }
    .form-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }

    .actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem; }
    .btn { display: inline-flex; align-items: center; gap: 0.5rem; border: 1px solid transparent; border-radius: 8px; padding: 0.5rem 0.75rem; cursor: pointer; }
    .btn.primary { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: #fff; }
    .btn.secondary { background: #fff; color: #374151; border-color: #e5e7eb; }

    .empty-state { text-align: center; padding: 2rem; color: #6b7280; }
    .empty-icon { font-size: 2rem; color: #9ca3af; margin-bottom: 0.5rem; }

    .toast { position: fixed; right: 1rem; bottom: 1rem; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; border-radius: 12px; padding: 0.75rem 1rem; display: flex; align-items: start; gap: 0.75rem; max-width: 420px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
    .toast.error { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
    .toast.error .sub { color: #dc2626; }
    .toast .title { font-weight: 700; }
    .toast .sub { font-size: 0.875rem; color: #047857; }
    .toast .close { background: transparent; border: none; color: inherit; cursor: pointer; }

    @media (max-width: 1024px) {
      .content-grid { grid-template-columns: 1fr; }
    }
  `]
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
