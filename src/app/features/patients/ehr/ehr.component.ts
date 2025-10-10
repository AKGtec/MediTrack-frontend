import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { MedicalRecordsService } from '../../../core/services/medical-records.service';
import { MedicalRecordDto } from '../../../core/models/medical-record.models';
import { AuthStorage } from '../../../core/models/user.models';

@Component({
  selector: 'app-patient-ehr',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ehr" *ngIf="!loading; else loadingTpl">
      <div class="header">
        <h1 class="page-title">My Medical Records (EHR)</h1>
        <p class="page-subtitle">View consultations, diagnoses, prescriptions, and lab results</p>
      </div>

      <div class="error" *ngIf="error">{{ error }}</div>

      <div class="records" *ngIf="records.length > 0">
        <div class="record" *ngFor="let r of records">
          <div class="record-head">
            <div class="meta">
              <div class="date">{{ r.createdAt | date:'medium' }}</div>
              <div class="doctor">Dr. {{ r.doctorName || r.doctorId }}</div>
            </div>
            <div class="id">#{{ r.recordId }}</div>
          </div>

          <div class="section" *ngIf="r.diagnosis">
            <div class="title"><i class="icon">sick</i> Diagnosis</div>
            <div class="content">{{ r.diagnosis }}</div>
          </div>

          <div class="section" *ngIf="r.treatmentPlan">
            <div class="title"><i class="icon">healing</i> Treatment Plan</div>
            <div class="content">{{ r.treatmentPlan }}</div>
          </div>

          <div class="section" *ngIf="r.notes">
            <div class="title"><i class="icon">note_alt</i> Notes</div>
            <div class="content">{{ r.notes }}</div>
          </div>

          <div class="section" *ngIf="r.prescriptions?.length">
            <div class="title"><i class="icon">prescriptions</i> Prescriptions</div>
            <ul class="content">
              <li *ngFor="let p of r.prescriptions">Prescription #{{ p.prescriptionId }} - {{ p.prescribedDate | date:'mediumDate' }}</li>
            </ul>
          </div>

          <div class="section" *ngIf="r.labTests?.length">
            <div class="title"><i class="icon">science</i> Lab Tests</div>
            <ul class="content">
              <li *ngFor="let l of r.labTests">{{ l.testName }} - {{ l.results || 'Pending' }}</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="empty" *ngIf="records.length === 0">
        <div class="empty-icon"><i class="icon">folder_off</i></div>
        <div>No medical records found.</div>
      </div>
    </div>

    <ng-template #loadingTpl>
      <div class="loading">Loading EHR...</div>
    </ng-template>
  `,
  styles: [`
    .ehr { padding: 1rem; }
    .page-title { margin: 0; font-weight: 700; font-size: 1.25rem; }
    .page-subtitle { margin: 0.25rem 0 0; color: #6b7280; }

    .records { display: grid; gap: 0.75rem; margin-top: 1rem; }
    .record { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 0.75rem; }
    .record-head { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f3f4f6; padding-bottom: 0.5rem; margin-bottom: 0.5rem; }
    .record-head .meta { display: flex; gap: 1rem; color: #374151; }
    .record-head .id { color: #6b7280; }

    .section { margin-top: 0.5rem; }
    .section .title { font-weight: 700; display: flex; align-items: center; gap: 0.375rem; }
    .section .content { margin-left: 1.625rem; color: #374151; }

    .empty { text-align: center; padding: 1.5rem; color: #6b7280; }
    .empty-icon { font-size: 2rem; color: #9ca3af; margin-bottom: 0.25rem; }
    .loading { padding: 1rem; }
  `]
})
export class PatientEhrComponent implements OnInit, OnDestroy {
  records: MedicalRecordDto[] = [];
  loading = false;
  error: string | null = null;
  sub?: Subscription;
  patientId: number | null = null;

  constructor(private medicalRecords: MedicalRecordsService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.loading = true;

    // Get the authenticated patient ID
    try {
      const currentUser = AuthStorage.get();
      this.patientId = currentUser?.user?.userId ?? null;

      if (this.patientId) {
        this.load(this.patientId);
      } else {
        this.error = 'Unable to determine patient context. Please sign in again.';
        this.loading = false;
      }
    } catch (err) {
      console.error('Failed to resolve patient context', err);
      this.error = 'Unable to determine patient context. Please sign in again.';
      this.loading = false;
    }
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  load(patientId: number) {
    this.loading = true;
    this.error = null;
    this.sub = this.medicalRecords.getRecordsByPatient(patientId).subscribe({
      next: (records) => { this.records = records; this.loading = false; },
      error: (err) => { this.error = 'Failed to load medical records.'; this.loading = false; console.error(err); }
    });
  }
}
