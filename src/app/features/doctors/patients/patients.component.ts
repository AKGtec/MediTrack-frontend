import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { UsersService } from '../../../core/services/users.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AuthStorage } from '../../../core/models/user.models';
import { PatientDto } from '../../../core/models/patient.models';
import { AppointmentDto } from '../../../core/models/appointment.models';

interface PatientWithDetails extends PatientDto {
  lastAppointmentDate?: Date;
  upcomingAppointmentDate?: Date;
  appointmentCount: number;
}

@Component({
  selector: 'app-doctor-patients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="patients">
      <div class="header">
        <h1 class="page-title">My Patients</h1>
        <div class="filters">
          <div class="search-box">
            <i class="icon">search</i>
            <input type="text" placeholder="Search patients..." [(ngModel)]="search" (input)="applyFilters()" />
          </div>
          <select [(ngModel)]="selectedGender" (change)="applyFilters()">
            <option value="all">All</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading patients...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <p>{{ error }}</p>
        <button class="retry-btn" (click)="loadPatients()">Try Again</button>
      </div>

      <!-- Patients Table -->
      <div *ngIf="!loading && !error" class="table">
        <div class="table-header">
          <div class="cell">Patient</div>
          <div class="cell">Age</div>
          <div class="cell">Gender</div>
          <div class="cell">Last Visit</div>
          <div class="cell">Upcoming</div>
          <div class="cell">Conditions</div>
        </div>

        <div class="table-row" *ngFor="let p of filteredPatients">
          <div class="cell">
            <div class="name">{{ p.fullName || 'Unknown Patient' }}</div>
            <div class="sub">ID: {{ p.userId }}</div>
          </div>
          <div class="cell">{{ calculateAge(p.dateOfBirth) }}</div>
          <div class="cell">{{ p.gender || 'Not specified' }}</div>
          <div class="cell">{{ formatDate(p.lastAppointmentDate) }}</div>
          <div class="cell">{{ formatDate(p.upcomingAppointmentDate) }}</div>
          <div class="cell tags">
            <span class="tag" *ngIf="p.chronicConditions">{{ p.chronicConditions }}</span>
            <span class="tag" *ngIf="p.allergies">{{ p.allergies }}</span>
            <span class="tag" *ngIf="!p.chronicConditions && !p.allergies">No conditions</span>
          </div>
        </div>

        <div class="empty" *ngIf="filteredPatients.length === 0">
          <div class="empty-icon"><i class="icon">group_off</i></div>
          <div>No patients found</div>
          <p class="empty-subtext" *ngIf="search || selectedGender !== 'all'">
            Try adjusting your search criteria
          </p>
        </div>
      </div>

      <!-- Stats Summary -->
      <div *ngIf="!loading && !error && patients.length > 0" class="stats-summary">
        <div class="stat-card">
          <div class="stat-number">{{ patients.length }}</div>
          <div class="stat-label">Total Patients</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ getGenderCount('Male') }}</div>
          <div class="stat-label">Male</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ getGenderCount('Female') }}</div>
          <div class="stat-label">Female</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ getPatientsWithUpcomingAppointments() }}</div>
          <div class="stat-label">Upcoming Appointments</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .patients { padding: 1rem; }
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
    .page-title { margin: 0; font-weight: 700; font-size: 1.25rem; }

    .filters { display: flex; align-items: center; gap: 0.5rem; }
    .search-box { display: flex; align-items: center; gap: 0.5rem; border: 1px solid #e5e7eb; padding: 0.25rem 0.5rem; border-radius: 8px; background: #fff; }
    .search-box input { border: none; outline: none; }
    select { border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.375rem 0.5rem; background: #fff; }

    .table { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 1rem; }
    .table-header, .table-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 2fr; align-items: center; }
    .table-header { background: #f9fafb; font-weight: 700; color: #374151; }
    .cell { padding: 0.625rem 0.75rem; border-bottom: 1px solid #f3f4f6; }
    .name { font-weight: 700; }
    .sub { color: #6b7280; font-size: 0.875rem; }
    .tags { display: flex; gap: 0.375rem; flex-wrap: wrap; }
    .tag { background: #eef2ff; color: #3730a3; border: 1px solid #c7d2fe; border-radius: 999px; padding: 0.125rem 0.5rem; font-size: 0.75rem; }

    .empty { text-align: center; padding: 1.5rem; color: #6b7280; }
    .empty-icon { font-size: 2rem; color: #9ca3af; margin-bottom: 0.25rem; }
    .empty-subtext { font-size: 0.875rem; margin-top: 0.25rem; }

    /* Loading State */
    .loading-state { 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      justify-content: center; 
      padding: 3rem; 
      color: #6b7280; 
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f4f6;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Error State */
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      color: #dc2626;
      text-align: center;
    }
    .error-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }
    .retry-btn {
      margin-top: 1rem;
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

    /* Stats Summary */
    .stats-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }
    .stat-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1rem;
      text-align: center;
    }
    .stat-number {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1f2937;
    }
    .stat-label {
      font-size: 0.875rem;
      color: #6b7280;
      margin-top: 0.25rem;
    }

    @media (max-width: 768px) {
      .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
      .filters {
        width: 100%;
      }
      .search-box {
        flex: 1;
      }
      .table-header, .table-row {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }
      .cell {
        border-bottom: none;
        padding: 0.25rem 0.75rem;
      }
      .table-row {
        border-bottom: 1px solid #f3f4f6;
        padding: 0.5rem 0;
      }
    }
  `]
})
export class DoctorPatientsComponent implements OnInit, OnDestroy {
  private readonly usersService = inject(UsersService);
  private readonly appointmentService = inject(AppointmentService);

  patients: PatientWithDetails[] = [];
  filteredPatients: PatientWithDetails[] = [];
  search = '';
  selectedGender: 'all' | string = 'all';
  loading = true;
  error: string | null = null;
  doctorId: number | null = null;

  private readonly destroy$ = new Subject<void>();

  ngOnInit() {
    this.loadDoctorContext();
    this.loadPatients();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDoctorContext(): void {
    try {
      const currentUser = AuthStorage.get();
      this.doctorId = currentUser?.user?.userId ?? null;
    } catch (err) {
      console.error('Failed to resolve doctor context', err);
      this.error = 'Unable to determine doctor context. Please sign in again.';
      this.loading = false;
    }
  }

  loadPatients(): void {
    if (!this.doctorId) {
      this.loading = false;
      this.error = 'Doctor information is missing. Please sign in again.';
      return;
    }

    this.loading = true;
    this.error = null;

    // Get all patients first
    this.usersService.getAllPatients()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (allPatients) => {
          // Get doctor's appointments to filter patients
          this.appointmentService.getAppointmentsByDoctor(this.doctorId!)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (appointments) => {
                this.processPatientsData(allPatients, appointments);
                this.loading = false;
              },
              error: (err) => {
                console.error('Failed to load appointments', err);
                this.error = 'Failed to load patient appointment data.';
                this.loading = false;
              }
            });
        },
        error: (err) => {
          console.error('Failed to load patients', err);
          this.error = 'Failed to load patients. Please try again later.';
          this.loading = false;
        }
      });
  }

  private processPatientsData(allPatients: PatientDto[], appointments: AppointmentDto[]): void {
    // Get unique patient IDs from doctor's appointments
    const doctorPatientIds = [...new Set(appointments.map(apt => apt.patientId))];
    
    // Filter patients who have appointments with this doctor
    const doctorPatients = allPatients.filter(patient => 
      doctorPatientIds.includes(patient.userId)
    );

    // Enhance patient data with appointment information
    this.patients = doctorPatients.map(patient => {
      const patientAppointments = appointments.filter(apt => apt.patientId === patient.userId);
      
      // Sort appointments by date to find latest and upcoming
      const sortedAppointments = patientAppointments.sort((a, b) => 
        new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
      );

      const now = new Date();
      const pastAppointments = sortedAppointments.filter(apt => new Date(apt.appointmentDate) < now);
      const upcomingAppointments = sortedAppointments.filter(apt => new Date(apt.appointmentDate) >= now);

      return {
        ...patient,
        lastAppointmentDate: pastAppointments.length > 0 ? new Date(pastAppointments[0].appointmentDate) : undefined,
        upcomingAppointmentDate: upcomingAppointments.length > 0 ? new Date(upcomingAppointments[0].appointmentDate) : undefined,
        appointmentCount: patientAppointments.length
      };
    });

    this.applyFilters();
  }

  applyFilters() {
    const term = this.search.toLowerCase();
    this.filteredPatients = this.patients.filter(p => {
      const matchesTerm = p.fullName?.toLowerCase().includes(term) || 
                         String(p.userId).includes(term) ||
                         p.email?.toLowerCase().includes(term);
      const matchesGender = this.selectedGender === 'all' || p.gender === this.selectedGender;
      return matchesTerm && matchesGender;
    });
  }

  calculateAge(dateOfBirth?: Date): string {
    if (!dateOfBirth) return 'Unknown';
    
    try {
      const birthDate = new Date(dateOfBirth);
      if (isNaN(birthDate.getTime())) return 'Unknown';
      
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age.toString();
    } catch {
      return 'Unknown';
    }
  }

  formatDate(date?: Date): string {
    if (!date) return 'No visits';
    
    try {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) return 'Invalid date';
      
      return parsedDate.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return 'Invalid date';
    }
  }

  getGenderCount(gender: string): number {
    return this.patients.filter(p => p.gender === gender).length;
  }

  getPatientsWithUpcomingAppointments(): number {
    return this.patients.filter(p => p.upcomingAppointmentDate).length;
  }
}