import { Routes } from '@angular/router';

export const doctorsRoutes: Routes = [
  { path: 'schedule', loadComponent: () => import('./schedule/schedule.component').then(m => m.ScheduleComponent) },
  { path: 'patients', loadComponent: () => import('./patients/patients.component').then(m => m.DoctorPatientsComponent) },
  { path: 'profile', loadComponent: () => import('./profile/profile.component').then(m => m.DoctorProfileComponent) },
  { path: 'appointments', loadComponent: () => import('./appointments/doctor-appointment.component').then(m => m.DoctorAppointmentsComponent) },
  { path: 'prescriptions', loadComponent: () => import('./prescription/prescription.component').then(m => m.DoctorPrescriptionsComponent) },
  { path: 'medical-record', loadComponent: () => import('./medical record/medical-record.component').then(m => m.DoctorMedicalRecordsComponent) },
  { path: '', pathMatch: 'full', redirectTo: 'schedule' }
  
  ];
