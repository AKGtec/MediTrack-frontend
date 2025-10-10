import { Routes } from '@angular/router';

export const medicalRoutes: Routes = [
  { path: 'lab-tests', loadComponent: () => import('./lab-tests/lab-tests-management.component').then(m => m.LabTestsManagementComponent) },
  { path: '', pathMatch: 'full', redirectTo: 'lab-tests' }
];
