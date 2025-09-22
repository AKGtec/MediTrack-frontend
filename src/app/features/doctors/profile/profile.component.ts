import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-doctor-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile">
      <div class="header">
        <h1 class="page-title">My Profile</h1>
        <p class="page-subtitle">Manage your professional information</p>
      </div>

      <div class="grid">
        <div class="card">
          <div class="card-header"><h2>Basic Information</h2></div>
          <div class="form">
            <div class="row two">
              <div>
                <label>Full Name</label>
                <input type="text" [(ngModel)]="profile.name" placeholder="Dr. Jane Doe" />
              </div>
              <div>
                <label>Email</label>
                <input type="email" [(ngModel)]="profile.email" placeholder="jane.doe@clinic.com" />
              </div>
            </div>
            <div class="row two">
              <div>
                <label>Phone</label>
                <input type="text" [(ngModel)]="profile.phone" placeholder="+1 555 123 4567" />
              </div>
              <div>
                <label>Location</label>
                <input type="text" [(ngModel)]="profile.location" placeholder="City, Country" />
              </div>
            </div>
            <div class="row">
              <label>Biography</label>
              <textarea rows="3" [(ngModel)]="profile.bio" placeholder="Short professional biography"></textarea>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h2>Specialties & Certifications</h2></div>
          <div class="form">
            <div class="row">
              <label>Specialties</label>
              <div class="chips">
                <span class="chip" *ngFor="let s of profile.specialties; let i = index">
                  {{ s }} <button class="chip-remove" (click)="removeSpecialty(i)"><i class="icon">close</i></button>
                </span>
              </div>
              <div class="add-chip">
                <input type="text" placeholder="Add specialty..." [(ngModel)]="newSpecialty"/>
                <button class="btn" (click)="addSpecialty()"><i class="icon">add</i><span>Add</span></button>
              </div>
            </div>

            <div class="row">
              <label>Verification</label>
              <div class="verifications">
                <span class="badge" [class.verified]="profile.verifiedLicense"><i class="icon">workspace_premium</i> License</span>
                <span class="badge" [class.verified]="profile.verifiedIdentity"><i class="icon">verified_user</i> Identity</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="actions">
        <button class="btn secondary"><i class="icon">refresh</i><span>Reset</span></button>
        <button class="btn primary" (click)="save()"><i class="icon">save</i><span>Save Changes</span></button>
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
    input, textarea { border: 1px solid #d1d5db; border-radius: 8px; padding: 0.5rem 0.75rem; }
    .chips { display: flex; gap: 0.375rem; flex-wrap: wrap; }
    .chip { background: #eef2ff; color: #3730a3; border: 1px solid #c7d2fe; border-radius: 999px; padding: 0.125rem 0.5rem; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 0.25rem; }
    .chip-remove { border: none; background: transparent; cursor: pointer; color: inherit; display: inline-grid; place-items: center; }
    .add-chip { display: flex; gap: 0.5rem; align-items: center; }
    .verifications { display: flex; gap: 0.5rem; }
    .badge { display: inline-flex; align-items: center; gap: 0.375rem; border: 1px dashed #d1d5db; border-radius: 999px; padding: 0.125rem 0.5rem; color: #6b7280; }
    .badge.verified { border-style: solid; background: #ecfdf5; color: #065f46; border-color: #a7f3d0; }

    .actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }
    .btn { display: inline-flex; align-items: center; gap: 0.375rem; border: 1px solid #e5e7eb; background: #fff; border-radius: 8px; padding: 0.375rem 0.75rem; cursor: pointer; }
    .btn.primary { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: #fff; border: none; }

    .toast { position: fixed; right: 1rem; bottom: 1rem; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; border-radius: 12px; padding: 0.75rem 1rem; display: flex; align-items: start; gap: 0.75rem; max-width: 420px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
    .toast .title { font-weight: 700; }
    .toast .sub { font-size: 0.875rem; color: #047857; }
    .toast .close { background: transparent; border: none; color: inherit; cursor: pointer; }

    @media (max-width: 1200px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class DoctorProfileComponent {
  profile = {
    name: 'Dr. Jane Doe',
    email: 'jane.doe@clinic.com',
    phone: '+1 555 123 4567',
    location: 'Paris, France',
    bio: 'Experienced cardiologist with a passion for digital health.',
    specialties: ['Cardiology'],
    verifiedLicense: true,
    verifiedIdentity: true
  };

  newSpecialty = '';
  saved = false;

  addSpecialty() {
    const s = this.newSpecialty.trim();
    if (!s) return;
    if (!this.profile.specialties.includes(s)) {
      this.profile.specialties.push(s);
    }
    this.newSpecialty = '';
  }

  removeSpecialty(i: number) {
    this.profile.specialties.splice(i, 1);
  }

  save() {
    this.saved = true;
  }
}
