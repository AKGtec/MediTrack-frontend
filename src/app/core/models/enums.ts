export enum Role {
  Patient = 'Patient',
  Doctor = 'Doctor',
  Admin = 'Admin'
}

export enum Gender {
  M = 'M',
  F = 'F',
  Other = 'Other'
}

export enum AppointmentStatus {
  Scheduled = 'Scheduled',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  NoShow = 'NoShow'
}

export enum AvailabilityStatus {
  Available = 'Available',
  Busy = 'Busy',
  OnLeave = 'OnLeave'
}

export enum InvoiceStatus {
  Paid = 'Paid',
  Pending = 'Pending',
  Cancelled = 'Cancelled'
}

export enum PaymentMethod {
  CreditCard = 'CreditCard',
  PayPal = 'PayPal',
  Cash = 'Cash',
  Insurance = 'Insurance'
}

export enum NotificationType {
  AppointmentReminder = 'AppointmentReminder',
  Payment = 'Payment',
  General = 'General'
}

export enum DayOfWeek {
  Sunday = 'Sunday',
  Monday = 'Monday',
  Tuesday = 'Tuesday',
  Wednesday = 'Wednesday',
  Thursday = 'Thursday',
  Friday = 'Friday',
  Saturday = 'Saturday'
}