import { Routes } from '@angular/router';

export const doctorsRoutes: Routes = [
  { path: 'schedule', loadComponent: () => import('./schedule/schedule.component').then(m => m.ScheduleComponent) },
  { path: 'patients', loadComponent: () => import('./patients/patients.component').then(m => m.DoctorPatientsComponent) },
  { path: 'profile', loadComponent: () => import('./profile/profile.component').then(m => m.DoctorProfileComponent) },
  { path: '', pathMatch: 'full', redirectTo: 'schedule' }
];
