import { Routes } from '@angular/router';

export const appointmentsRoutes: Routes = [
  {
    path: 'booking',
    loadComponent: () => import('./booking/booking.component').then(m => m.BookingComponent)
  },
  {
    path: 'calendar',
    loadComponent: () => import('./calendar/calendar.component').then(m => m.CalendarComponent)
  },
  { path: '', pathMatch: 'full', redirectTo: 'booking' }
];
