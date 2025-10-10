import { Routes } from '@angular/router';

export const notificationRoutes: Routes = [
  { path: 'center', loadComponent: () => import('./notification-center/notification-center.component').then(m => m.NotificationCenterComponent) },
  { path: '', pathMatch: 'full', redirectTo: 'center' }
];
