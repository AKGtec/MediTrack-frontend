import { Routes } from '@angular/router';

export const billingRoutes: Routes = [
  { path: 'invoices', loadComponent: () => import('./invoice-management/invoice-management.component').then(m => m.InvoiceManagementComponent) },
  { path: 'payments', loadComponent: () => import('./payment-processing/payment-processing.component').then(m => m.PaymentProcessingComponent) },
  { path: '', pathMatch: 'full', redirectTo: 'invoices' }
];
