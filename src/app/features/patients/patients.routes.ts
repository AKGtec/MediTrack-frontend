import { Routes } from '@angular/router';

export const patientsRoutes: Routes = [
  { path: 'profile', loadComponent: () => import('./profile/profile.component').then(m => m.PatientProfileComponent) },
  { path: 'ehr', loadComponent: () => import('./ehr/ehr.component').then(m => m.PatientEhrComponent) },
  { path: 'appointments', loadComponent: () => import('./appointments/appointments.component').then(m => m.PatientAppointmentsComponent) },
  { path: 'prescriptions', loadComponent: () => import('./prescriptions/prescriptions.component').then(m => m.PatientPrescriptionsComponent) },
  { path: '', pathMatch: 'full', redirectTo: 'profile' }
];
