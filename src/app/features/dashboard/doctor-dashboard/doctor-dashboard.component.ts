import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { AppointmentService } from '../../../core/services/appointment.service';
import { UsersService } from '../../../core/services/users.service';
import { PrescriptionsService } from '../../../core/services/prescriptions.service';
import { MedicalRecordsService } from '../../../core/services/medical-records.service';
import { AuthStorage } from '../../../core/models/user.models';
import { AppointmentDto } from '../../../core/models/appointment.models';
import { PatientDto } from '../../../core/models/patient.models';
import { PrescriptionDto } from '../../../core/models/prescription.models';
import { MedicalRecordDto } from '../../../core/models/medical-record.models';
import {AppointmentStatus} from '../../../core/models/enums';
import { MessagingComponent } from '../../../shared/components/messaging/messaging.component';

interface DashboardAppointment {
  id: number;
  patientName: string;
  time: string;
  type: string;
  status: 'confirmed' | 'pending' | 'completed';
  appointmentDate: Date;
  patientId: number;
}

interface DashboardPatient {
  id: number;
  name: string;
  lastVisit: string;
  nextAppointment: string;
  condition: string;
  patientId: number;
}

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, MessagingComponent],
  templateUrl: './doctor-dashboard.component.html',
  styleUrl: './doctor-dashboard.component.css'
})
export class DoctorDashboardComponent implements OnInit, OnDestroy {
  private readonly appointmentService = inject(AppointmentService);
  private readonly usersService = inject(UsersService);
  private readonly prescriptionsService = inject(PrescriptionsService);
  private readonly medicalRecordsService = inject(MedicalRecordsService);

  constructor(private router: Router) {}

  todaysAppointments: DashboardAppointment[] = [];
  upcomingAppointments: DashboardAppointment[] = [];
  recentPatients: DashboardPatient[] = [];
  loading = true;
  error: string | null = null;

  stats = {
    todaysAppointments: 0,
    totalPatients: 0,
    pendingPrescriptions: 0,
    completedToday: 0
  };

  showMessaging = false;
  selectedPatientId = 0;
  selectedPatientName = '';

  private doctorId: number | null = null;
  private readonly destroy$ = new Subject<void>();

  ngOnInit() {
    this.loadDoctorContext();
    this.loadDashboardData();
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

  loadDashboardData() {
    if (!this.doctorId) {
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = null;

    // Load all required data in parallel
    forkJoin({
      appointments: this.appointmentService.getAppointmentsByDoctor(this.doctorId),
      patients: this.usersService.getAllPatients(),
      prescriptions: this.prescriptionsService.getPrescriptionsByPatient(0), // This will need adjustment
      medicalRecords: this.medicalRecordsService.getRecordsByPatient(0) // This will need adjustment
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ({ appointments, patients, prescriptions, medicalRecords }) => {
        this.processDashboardData(appointments, patients, prescriptions as PrescriptionDto[], medicalRecords as MedicalRecordDto[]);
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load dashboard data', err);
        this.error = 'Failed to load dashboard data. Please try again later.';
        this.loading = false;
      }
    });
  }

  private processDashboardData(
    appointments: AppointmentDto[], 
    patients: PatientDto[], 
    prescriptions: PrescriptionDto[], 
    medicalRecords: MedicalRecordDto[]
  ): void {
    // Filter appointments for current doctor
    const doctorAppointments = appointments.filter(apt => apt.doctorId === this.doctorId);
    
    // Process today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    this.todaysAppointments = doctorAppointments
      .filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate.getTime() === today.getTime();
      })
      .map(apt => this.mapAppointmentToDashboard(apt, patients))
      .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());

    // Process upcoming appointments (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    this.upcomingAppointments = doctorAppointments
      .filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate > today && aptDate <= nextWeek;
      })
      .map(apt => this.mapAppointmentToDashboard(apt, patients))
      .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());

    // Process recent patients (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const recentAppointments = doctorAppointments
      .filter(apt => new Date(apt.createdAt) >= thirtyDaysAgo)
      .slice(0, 6); // Limit to 6 recent patients

    this.recentPatients = recentAppointments.map(apt => {
      const patient = patients.find(p => p.userId === apt.patientId);
      const patientMedicalRecords = medicalRecords.filter(record => record.patientId === apt.patientId);
      const latestRecord = patientMedicalRecords.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

      return {
        id: apt.appointmentId,
        patientId: apt.patientId,
        name: apt.patientName || patient?.fullName || 'Unknown Patient',
        lastVisit: this.formatRelativeDate(new Date(apt.appointmentDate)),
        nextAppointment: this.getNextAppointment(doctorAppointments, apt.patientId),
        condition: latestRecord?.diagnosis || 'No diagnosis recorded'
      };
    });

    // Calculate statistics
    this.calculateStatistics(doctorAppointments, patients, prescriptions);
  }

  private mapAppointmentToDashboard(apt: AppointmentDto, patients: PatientDto[]): DashboardAppointment {
    const patient = patients.find(p => p.userId === apt.patientId);
    const aptDate = new Date(apt.appointmentDate);
    
    return {
      id: apt.appointmentId,
      patientName: apt.patientName || patient?.fullName || 'Unknown Patient',
      time: this.formatAppointmentTime(aptDate),
      type: 'Consultation', // You might want to add appointment type to your model
      status: this.mapAppointmentStatus(apt.status),
      appointmentDate: aptDate,
      patientId: apt.patientId
    };
  }

  private mapAppointmentStatus(status: AppointmentStatus): 'confirmed' | 'pending' | 'completed' {
    switch (status) {
      case AppointmentStatus.Scheduled:
        return 'confirmed';
      case AppointmentStatus.Completed:
        return 'completed';
      case AppointmentStatus.Cancelled:
      case AppointmentStatus.NoShow:
        return 'pending'; // You might want different handling for cancelled/no-show
      default:
        return 'pending';
    }
  }

  private formatAppointmentTime(date: Date): string {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const aptDate = new Date(date);
    aptDate.setHours(0, 0, 0, 0);
    
    if (aptDate.getTime() === today.getTime()) {
      // Today - show time only
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      // Other days - show date and time
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true 
      });
    }
  }

  private formatRelativeDate(date: Date): string {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  }

  private getNextAppointment(appointments: AppointmentDto[], patientId: number): string {
    const futureAppointments = appointments
      .filter(apt => apt.patientId === patientId && new Date(apt.appointmentDate) > new Date())
      .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
    
    if (futureAppointments.length === 0) return 'No upcoming';
    
    const nextApt = futureAppointments[0];
    const aptDate = new Date(nextApt.appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = aptDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `${diffDays} days`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks`;
    return `${Math.ceil(diffDays / 30)} months`;
  }

  private calculateStatistics(
    appointments: AppointmentDto[], 
    patients: PatientDto[], 
    prescriptions: PrescriptionDto[]
  ): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get unique patients for this doctor
    const doctorPatientIds = [...new Set(appointments.map(apt => apt.patientId))];
    const doctorPatients = patients.filter(patient => doctorPatientIds.includes(patient.userId));
    
    // Today's appointments count
    const todaysApts = appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate);
      aptDate.setHours(0, 0, 0, 0);
      return aptDate.getTime() === today.getTime();
    });
    
    // Completed today count
    const completedToday = todaysApts.filter(apt => apt.status === AppointmentStatus.Completed).length;
    
    // Pending prescriptions (you might need to adjust this based on your prescription status)
    const pendingPrescriptions = prescriptions.filter(presc => {
      // Assuming prescriptions without a completed status are pending
      // Adjust this logic based on your actual prescription status field
      return true; // Placeholder - adjust based on your data model
    }).length;

    this.stats = {
      todaysAppointments: todaysApts.length,
      totalPatients: doctorPatients.length,
      pendingPrescriptions: pendingPrescriptions,
      completedToday: completedToday
    };
  }

  onStartConsultation(appointmentId: number) {
    console.log('Starting consultation for appointment:', appointmentId);
    const appointment = this.todaysAppointments.find(apt => apt.id === appointmentId);
    if (appointment) {
      this.router.navigate(['/doctor/consultation', appointmentId], {
        queryParams: { patientId: appointment.patientId }
      });
    }
  }

  onViewPatient(patientId: number) {
    console.log('Viewing patient:', patientId);
    const patient = this.recentPatients.find(p => p.patientId === patientId);
    if (patient) {
      this.selectedPatientId = patientId;
      this.selectedPatientName = patient.name;
      this.showMessaging = true;
    } else {
      this.router.navigate(['/doctor/patients', patientId]);
    }
  }

  onUpdateSchedule() {
    console.log('Updating schedule');
    this.router.navigate(['/doctor/schedule']);
  }

  onViewAllAppointments() {
    console.log('Viewing all appointments');
    this.router.navigate(['/doctor/appointments']);
  }

  onViewAllPatients() {
    this.router.navigate(['/doctor/patients']);
  }

  onViewPrescriptions() {
    this.router.navigate(['/doctor/prescriptions']);
  }

  onViewLabResults() {
    this.router.navigate(['/doctor/lab-results']);
  }

  onViewMessages() {
    this.router.navigate(['/doctor/messages']);
  }
}
