import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadComponent: () => import('./layouts/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      },
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
      }
    ]
  },
  // Dashboard routes under layout shells
  {
    path: 'patient',
    loadComponent: () => import('./layouts/patient-layout/patient-layout.component').then(m => m.PatientLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./features/dashboard/patient-dashboard/patient-dashboard.component').then(m => m.PatientDashboardComponent) },
      { path: 'appointments', loadChildren: () => import('./features/appointments/appointments.routes').then(m => m.appointmentsRoutes) },
      { path: 'billing', loadChildren: () => import('./features/billing/billing.routes').then(m => m.billingRoutes) },
      { path: 'patients', loadChildren: () => import('./features/patients/patients.routes').then(m => m.patientsRoutes) }

    ]
  },
  {
    path: 'doctor',
    loadComponent: () => import('./layouts/doctor-layout/doctor-layout.component').then(m => m.DoctorLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./features/dashboard/doctor-dashboard/doctor-dashboard.component').then(m => m.DoctorDashboardComponent) },
      { path: 'doctors', loadChildren: () => import('./features/doctors/doctors.routes').then(m => m.doctorsRoutes) }
    ]
  },
  {
    path: 'admin',
    loadComponent: () => import('./layouts/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./features/dashboard/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'users', loadComponent: () => import('./features/admin/users-management/users-management.component').then(m => m.UsersManagementComponent) },
      { path: 'appointments', loadComponent: () => import('./features/admin/appointments-management/appointments-management.component').then(m => m.AppointmentsManagementComponent) },
      { path: 'billing', loadComponent: () => import('./features/admin/billing/billing.component').then(m => m.BillingComponent) },
      { path: 'reports', loadComponent: () => import('./features/admin/reports/reports.component').then(m => m.ReportsComponent) }
    ]
  }
];
