import { Routes } from '@angular/router';

export const billingRoutes: Routes = [
  { path: 'invoices', loadComponent: () => import('./invoices/invoices.component').then(m => m.InvoicesComponent) },
  { path: 'payments', loadComponent: () => import('./payments/payments.component').then(m => m.PaymentsComponent) },
  { path: '', pathMatch: 'full', redirectTo: 'invoices' }
];
