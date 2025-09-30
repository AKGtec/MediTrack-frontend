import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { UsersService } from '../../../core/services/users.service';
import { AuthStorage } from '../../../core/models/user.models';
import { DoctorDto, UpdateDoctorDto } from '../../../core/models/doctor.models';
import { AvailabilityStatus } from '../../../core/models/enums';

@Component({
  selector: 'app-doctor-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile" *ngIf="!loading; else loadingTpl">
      <div class="header">
        <h1 class="page-title">My Profile</h1>
        <p class="page-subtitle">Manage your professional information</p>
      </div>

      <div class="error" *ngIf="error">{{ error }}</div>

      <div class="grid" *ngIf="doctor">
        <div class="card">
          <div class="card-header"><h2>Basic Information</h2></div>
          <div class="form">
            <div class="row two">
              <div>
                <label>Full Name</label>
                <input type="text" [value]="doctor.fullName" disabled />
              </div>
              <div>
                <label>Email</label>
                <input type="email" [value]="doctor.email" disabled />
              </div>
            </div>
            <div class="row two">
              <div>
                <label>Phone</label>
                <input type="text" [(ngModel)]="form.phoneNumber" />
              </div>
              <div>
                <label>Clinic / Location</label>
                <input type="text" [(ngModel)]="form.clinicName" />
              </div>
            </div>
            <div class="row">
              <label>Specialization</label>
              <input type="text" [(ngModel)]="form.specialization" />
            </div>
            <div class="row two">
              <div>
                <label>License Number</label>
                <input type="text" [(ngModel)]="form.licenseNumber" />
              </div>
              <div>
                <label>Experience (years)</label>
                <input type="number" [(ngModel)]="form.experienceYears" />
              </div>
            </div>
            <div class="row two">
              <div>
                <label>Consultation Fee</label>
                <input type="number" [(ngModel)]="form.consultationFee" />
              </div>
              <div>
                <label>Availability Status</label>
                <select [(ngModel)]="form.availabilityStatus">
                  <option *ngFor="let status of availabilityStatuses" [ngValue]="status">{{ status }}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h2>Biography</h2></div>
          <div class="form">
            <div class="row">
              <label>About</label>
              <textarea rows="4" [(ngModel)]="bio"></textarea>
            </div>
          </div>
        </div>
      </div>

      <div class="actions" *ngIf="doctor">
        <button class="btn secondary" (click)="reload()"><i class="icon">refresh</i><span>Reload</span></button>
        <button class="btn primary" (click)="save()" [disabled]="saving"><i class="icon">save</i><span>{{ saving ? 'Saving...' : 'Save Changes' }}</span></button>
      </div>

      <div class="toast" *ngIf="saved">
        <i class="icon">check_circle</i>
        <div class="toast-content">
          <div class="title">Profile Saved</div>
          <div class="sub">Your profile has been updated successfully.</div>
        </div>
        <button class="close" (click)="saved = false"><i class="icon">close</i></button>
      </div>
    </div>

    <ng-template #loadingTpl>
      <div class="loading">Loading profile...</div>
    </ng-template>
  `,
  styles: [`
    .profile { padding: 1rem; }
    .page-title { margin: 0; font-weight: 700; font-size: 1.25rem; }
    .page-subtitle { margin: 0.25rem 0 0; color: #6b7280; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; }
    .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
    .card-header { padding: 0.75rem 1rem; border-bottom: 1px solid #f3f4f6; }
    .form { display: grid; gap: 0.75rem; padding: 0.75rem; }
    .row { display: grid; gap: 0.25rem; }
    .row.two { grid-template-columns: 1fr 1fr; gap: 0.5rem; }
    input, textarea, select { border: 1px solid #d1d5db; border-radius: 8px; padding: 0.5rem 0.75rem; }

    .actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }
    .btn { display: inline-flex; align-items: center; gap: 0.375rem; border: 1px solid #e5e7eb; background: #fff; border-radius: 8px; padding: 0.375rem 0.75rem; cursor: pointer; }
    .btn.primary { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: #fff; border: none; }

    .error { color: #b91c1c; background: #fee2e2; border: 1px solid #fecaca; padding: 0.5rem; border-radius: 8px; margin-top: 0.75rem; }
    .loading { padding: 1rem; }

    .toast { position: fixed; right: 1rem; bottom: 1rem; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; border-radius: 12px; padding: 0.75rem 1rem; display: flex; align-items: start; gap: 0.75rem; max-width: 420px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
    .toast .title { font-weight: 700; }
    .toast .sub { font-size: 0.875rem; color: #047857; }
    .toast .close { background: transparent; border: none; color: inherit; cursor: pointer; }

    @media (max-width: 1200px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class DoctorProfileComponent implements OnInit, OnDestroy {
  doctor: DoctorDto | null = null;
  form: UpdateDoctorDto = {
    userId: 0,
    phoneNumber: '',
    address: '',
    specialization: '',
    licenseNumber: '',
    experienceYears: undefined,
    clinicName: '',
    consultationFee: undefined,
    availabilityStatus: AvailabilityStatus.Available
  };
  bio = '';
  availabilityStatuses = Object.values(AvailabilityStatus);
  loading = false;
  saving = false;
  saved = false;
  error: string | null = null;
  sub?: Subscription;
  private readonly doctorId = AuthStorage.get()?.user.userId ?? null;

  constructor(private usersService: UsersService) {}

  ngOnInit() {
    if (this.doctorId) {
      this.load(this.doctorId);
    } else {
      this.error = 'Unable to determine doctor identifier.';
    }
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  reload() {
    if (!this.doctorId) { return; }
    this.load(this.doctorId);
  }

  load(userId: number) {
    this.loading = true;
    this.error = null;
    this.sub = this.usersService.getDoctorById(userId).subscribe({
      next: (doctor) => {
        this.doctor = doctor;
        this.form = {
          userId: doctor.userId,
          phoneNumber: doctor.phoneNumber,
          address: '',
          specialization: doctor.specialization,
          licenseNumber: doctor.licenseNumber,
          experienceYears: doctor.experienceYears,
          clinicName: doctor.clinicName,
          consultationFee: doctor.consultationFee,
          availabilityStatus: doctor.availabilityStatus
        };
        this.bio = doctor.specialization;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load profile.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  save() {
    if (!this.doctor || !this.doctorId) { return; }
    this.saving = true;
    const payload: UpdateDoctorDto = {
      ...this.form,
      userId: this.doctorId,
      address: this.form.address
    };
    this.usersService.updateDoctor(this.doctorId, payload).subscribe({
      next: () => {
        this.saving = false;
        this.saved = true;
      },
      error: (err) => {
        this.saving = false;
        this.error = 'Failed to save profile.';
        console.error(err);
      }
    });
  }
}
