import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  location: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

@Component({
  selector: 'app-appointment-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="booking">
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
            <option *ngFor="let d of filteredDoctors" [ngValue]="d.id">{{ d.name }} ({{ d.specialty }})</option>
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
            <div class="doctor-item" *ngFor="let d of filteredDoctors" [class.active]="d.id === selectedDoctorId" (click)="selectDoctor(d)">
              <div class="avatar">{{ d.name.charAt(0) }}</div>
              <div class="meta">
                <div class="name">{{ d.name }}</div>
                <div class="sub">{{ d.specialty }} • {{ d.location }}</div>
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
            <span class="hint" *ngIf="selectedDoctorId && selectedDate">For {{ getSelectedDoctor()?.name }} on {{ selectedDate | date:'fullDate' }}</span>
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
  `,
  styles: [`
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
    .toast .title { font-weight: 700; }
    .toast .sub { font-size: 0.875rem; color: #047857; }
    .toast .close { background: transparent; border: none; color: inherit; cursor: pointer; }

    @media (max-width: 1024px) {
      .content-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class BookingComponent {
  specialties: string[] = ['General Medicine', 'Cardiology', 'Dermatology', 'Pediatrics'];

  doctors: Doctor[] = [
    { id: 1, name: 'Dr. Alice Martin', specialty: 'General Medicine', location: 'Central Clinic' },
    { id: 2, name: 'Dr. Bruno Keller', specialty: 'Cardiology', location: 'Heart Center' },
    { id: 3, name: 'Dr. Claire Dubois', specialty: 'Dermatology', location: 'Skin Care Institute' },
    { id: 4, name: 'Dr. David Rossi', specialty: 'Pediatrics', location: 'Children Hospital' },
  ];

  filteredDoctors: Doctor[] = [...this.doctors];

  selectedSpecialty: string = '';
  selectedDoctorId: number | null = null;
  selectedDate: string = '';
  selectedTime: string | null = null;

  timeSlots: TimeSlot[] = [];

  reason = '';
  notes = '';

  confirmation: { doctor: string; date: string; time: string } | null = null;

  onSpecialtyChange() {
    this.filteredDoctors = this.selectedSpecialty
      ? this.doctors.filter(d => d.specialty === this.selectedSpecialty)
      : [...this.doctors];

    // Reset selection if current doctor not in filtered list
    if (!this.filteredDoctors.find(d => d.id === this.selectedDoctorId)) {
      this.selectedDoctorId = null;
      this.timeSlots = [];
      this.selectedTime = null;
    }
  }

  onDoctorChange() {
    this.loadTimeSlots();
  }

  selectDoctor(d: Doctor) {
    this.selectedDoctorId = d.id;
    this.loadTimeSlots();
  }

  loadTimeSlots() {
    this.timeSlots = [];
    this.selectedTime = null;

    if (!this.selectedDoctorId || !this.selectedDate) {
      return;
    }

    // Mock slot generation: every 30 minutes between 9:00 and 17:00
    const slots: TimeSlot[] = [];
    for (let h = 9; h <= 17; h++) {
      for (let m of [0, 30]) {
        const hh = h.toString().padStart(2, '0');
        const mm = m.toString().padStart(2, '0');
        const label = `${hh}:${mm}`;
        const available = Math.random() > 0.2; // 80% available
        slots.push({ time: label, available });
      }
    }
    this.timeSlots = slots;
  }

  selectTime(time: string) {
    if (!this.timeSlots.find(s => s.time === time && s.available)) return;
    this.selectedTime = time;
  }

  canBook(): boolean {
    return !!(this.selectedDoctorId && this.selectedDate && this.selectedTime && this.reason.trim());
  }

  bookAppointment() {
    if (!this.canBook()) return;
    const doctor = this.getSelectedDoctor()?.name || '';
    this.confirmation = { doctor, date: this.selectedDate, time: this.selectedTime! };

    // Reset form except filters
    this.reason = '';
    this.notes = '';
  }

  getSelectedDoctor(): Doctor | undefined {
    return this.doctors.find(d => d.id === this.selectedDoctorId!);
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
  }
}
