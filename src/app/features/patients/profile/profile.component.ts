import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { PatientsService } from '../../../core/services/patients.service';
import { PatientDto, UpdatePatientDto } from '../../../core/models/patient.models';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile" *ngIf="!loading; else loadingTpl">
      <div class="header">
        <h1 class="page-title">My Profile</h1>
        <p class="page-subtitle">Manage your personal and emergency information</p>
      </div>

      <div class="error" *ngIf="error">{{ error }}</div>

      <div class="grid" *ngIf="patient">
        <div class="card">
          <div class="card-header"><h2>Personal Information</h2></div>
          <div class="form">
            <div class="row two">
              <div>
                <label>Full Name</label>
                <input type="text" [value]="patient.fullName" disabled />
              </div>
              <div>
                <label>Email</label>
                <input type="email" [value]="patient.email" disabled />
              </div>
            </div>
            <div class="row two">
              <div>
                <label>Phone</label>
                <input type="text" [(ngModel)]="form.phoneNumber" />
              </div>
              <div>
                <label>Address</label>
                <input type="text" [(ngModel)]="form.address" />
              </div>
            </div>
            <div class="row three">
              <div>
                <label>Gender</label>
                <input type="text" [value]="patient.gender" disabled />
              </div>
              <div>
                <label>Date of Birth</label>
                <input type="text" [value]="patient.dateOfBirth ? (patient.dateOfBirth | date:'mediumDate') : ''" disabled />
              </div>
              <div>
                <label>Blood Type</label>
                <input type="text" [(ngModel)]="form.bloodType" />
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h2>Medical Information</h2></div>
          <div class="form">
            <div class="row">
              <label>Allergies</label>
              <textarea rows="2" [(ngModel)]="form.allergies"></textarea>
            </div>
            <div class="row">
              <label>Chronic Conditions</label>
              <textarea rows="2" [(ngModel)]="form.chronicConditions"></textarea>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h2>Emergency Contact</h2></div>
          <div class="form">
            <div class="row two">
              <div>
                <label>Contact Name</label>
                <input type="text" [(ngModel)]="form.emergencyContactName" />
              </div>
              <div>
                <label>Contact Phone</label>
                <input type="text" [(ngModel)]="form.emergencyContactPhone" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="actions" *ngIf="patient">
        <button class="btn secondary" (click)="load(patient.userId)"><i class="icon">refresh</i><span>Reload</span></button>
        <button class="btn primary" (click)="save()" [disabled]="saving"><i class="icon">save</i><span>{{ saving ? 'Saving...' : 'Save Changes' }}</span></button>
      </div>

      <div class="toast" *ngIf="saved">
        <i class="icon">check_circle</i>
        <div class="toast-content">
          <div class="title">Profile Updated</div>
          <div class="sub">Your profile has been saved successfully.</div>
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
    .row.three { grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; }
    input, textarea { border: 1px solid #d1d5db; border-radius: 8px; padding: 0.5rem 0.75rem; }

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
export class PatientProfileComponent implements OnInit, OnDestroy {
  patient: PatientDto | null = null;
  form: UpdatePatientDto = {
    phoneNumber: '',
    address: '',
    bloodType: '',
    allergies: '',
    chronicConditions: '',
    emergencyContactName: '',
    emergencyContactPhone: ''
  };
  loading = false;
  saving = false;
  saved = false;
  error: string | null = null;
  sub?: Subscription;

  constructor(private patientsService: PatientsService, private route: ActivatedRoute) {}

  ngOnInit() {
    const idParam = this.route.snapshot.queryParamMap.get('id');
    const id = idParam ? Number(idParam) : 1; // TODO: replace with authenticated patient id
    this.load(id);
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  load(id: number) {
    this.loading = true;
    this.error = null;
    this.sub = this.patientsService.getPatientById(id).subscribe({
      next: (p) => {
        this.patient = p;
        this.form = {
          phoneNumber: p.phoneNumber,
          address: p.address,
          bloodType: p.bloodType,
          allergies: p.allergies,
          chronicConditions: p.chronicConditions,
          emergencyContactName: p.emergencyContactName,
          emergencyContactPhone: p.emergencyContactPhone
        };
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
    if (!this.patient) return;
    this.saving = true;
    this.patientsService.updatePatient(this.patient.userId, this.form).subscribe({
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
