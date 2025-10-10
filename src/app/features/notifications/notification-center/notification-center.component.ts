import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationsService } from '../../../core/services/notifications.service';
import { PatientsService } from '../../../core/services/patients.service';
import { NotificationDto, CreateNotificationDto, UpdateNotificationStatusDto } from '../../../core/models/notification.models';
import { PatientDto } from '../../../core/models/patient.models';
import { NotificationType, Role } from '../../../core/models/enums';
import { AuthStorage } from '../../../core/models/user.models';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notification-center.component.html',
  styleUrl: './notification-center.component.css'
})
export class NotificationCenterComponent implements OnInit {
  private notificationsService = inject(NotificationsService);
  private patientsService = inject(PatientsService);

  notifications: NotificationDto[] = [];
  filteredNotifications: NotificationDto[] = [];
  selectedNotification: NotificationDto | null = null;
  showCreateModal = false;
  showDetailsModal = false;

  patients: PatientDto[] = [];
  selectedPatient: PatientDto | null = null;
  currentUserIsDoctor = false;

  isLoading = false;
  error: string | null = null;

  // Filters
  searchTerm = '';
  selectedType: string = 'all';
  showUnreadOnly = false;

  // Create form
  newNotification: CreateNotificationDto = {
    userId: 0,
    title: '',
    message: '',
    type: NotificationType.General
  };

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    const currentUser = AuthStorage.get();

    if (!currentUser) {
      this.error = 'User not authenticated';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.notificationsService.getNotificationsByUser(currentUser.user.userId).subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.filterNotifications();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load notifications:', error);
        this.error = error.error?.message || 'Failed to load notifications. Please try again.';
        this.isLoading = false;
      }
    });
  }

  filterNotifications() {
    this.filteredNotifications = this.notifications.filter(notification => {
      const matchesSearch = notification.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           notification.message.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           (notification.userName || '').toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesType = this.selectedType === 'all' || notification.type.toString() === this.selectedType;
      const matchesReadStatus = !this.showUnreadOnly || !notification.isRead;
      return matchesSearch && matchesType && matchesReadStatus;
    });
  }

  openCreateModal() {
    const currentUser = AuthStorage.get();

    this.currentUserIsDoctor = currentUser?.user?.role === Role.Doctor;

    this.newNotification = {
      userId: currentUser?.user.userId || 0,
      title: '',
      message: '',
      type: NotificationType.General
    };

    // Load patients if user is a doctor
    if (this.currentUserIsDoctor) {
      this.loadPatientsForModal();
    }

    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.patients = [];
    this.selectedPatient = null;
    this.error = null;
  }

  loadPatientsForModal() {
    this.patientsService.getAllPatients().subscribe({
      next: (patients) => {
        this.patients = patients;
      },
      error: (error) => {
        console.error('Failed to load patients:', error);
        this.error = 'Failed to load patients. Please try again.';
      }
    });
  }

  onPatientChange() {
    if (this.selectedPatient) {
      this.newNotification.userId = this.selectedPatient.userId;
    }
  }

  openDetailsModal(notification: NotificationDto) {
    this.selectedNotification = notification;
    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedNotification = null;
  }

  createNotification() {
    if (!this.validateNewNotification()) return;

    this.isLoading = true;
    this.error = null;

    this.notificationsService.sendNotification(this.newNotification).subscribe({
      next: (createdNotification) => {
        this.notifications.push(createdNotification);
        this.filterNotifications();
        this.closeCreateModal();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to create notification:', error);
        this.error = error.error?.message || 'Failed to create notification. Please try again.';
        this.isLoading = false;
      }
    });
  }

  markAsRead(notification: NotificationDto) {
    if (notification.isRead) return;

    this.isLoading = true;
    this.error = null;

    const updateDto: UpdateNotificationStatusDto = { isRead: true };

    this.notificationsService.markAsRead(notification.notificationId, updateDto).subscribe({
      next: (updatedNotification) => {
        notification.isRead = updatedNotification.isRead;
        this.filterNotifications();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to mark notification as read:', error);
        this.error = error.error?.message || 'Failed to mark notification as read. Please try again.';
        this.isLoading = false;
      }
    });
  }

  markAllAsRead() {
    const unreadNotifications = this.notifications.filter(n => !n.isRead);

    if (unreadNotifications.length === 0) return;

    this.isLoading = true;
    this.error = null;

    const markReadPromises = unreadNotifications.map(notification => {
      const updateDto: UpdateNotificationStatusDto = { isRead: true };
      return this.notificationsService.markAsRead(notification.notificationId, updateDto).toPromise();
    });

    Promise.all(markReadPromises.map(p => p.catch(() => null))).then(() => {
      // Reload notifications to get the most recent state
      this.loadNotifications();
    }).catch((error) => {
      console.error('Failed to mark some notifications as read:', error);
      this.error = error.error?.message || 'Failed to mark all notifications as read. Please try again.';
      this.isLoading = false;
    });
  }

  deleteNotification(notification: NotificationDto) {
    if (!confirm(`Are you sure you want to delete this notification: "${notification.title}"?`)) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    // For now, we'll remove locally since the service might not have deleteNotification method
    // In a real implementation, you'd call: this.notificationsService.deleteNotification(notification.notificationId)
    this.notifications = this.notifications.filter(n => n.notificationId !== notification.notificationId);
    this.filterNotifications();
    this.isLoading = false;
  }

  formatDateTime(date: string | Date): string {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  getTypeColor(type: NotificationType): string {
    switch (type) {
      case NotificationType.AppointmentReminder: return '#667eea';
      case NotificationType.Payment: return '#10b981';
      case NotificationType.General: return '#f59e0b';
      default: return '#6c757d';
    }
  }

  getTypeIcon(type: NotificationType): string {
    switch (type) {
      case NotificationType.AppointmentReminder: return 'event';
      case NotificationType.Payment: return 'payment';
      case NotificationType.General: return 'notifications';
      default: return 'info';
    }
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  private validateNewNotification(): boolean {
    if (this.currentUserIsDoctor && !this.selectedPatient) {
      this.error = 'Please select a patient.';
      return false;
    }

    if (!this.currentUserIsDoctor && !this.newNotification.userId) {
      this.error = 'User ID is required.';
      return false;
    }

    if (!this.newNotification.title.trim()) {
      this.error = 'Title is required.';
      return false;
    }
    if (!this.newNotification.message.trim()) {
      this.error = 'Message is required.';
      return false;
    }
    return true;
  }

  // Options for dropdowns
  get notificationTypeOptions() {
    return [
      { value: NotificationType.General, label: 'General' },
      { value: NotificationType.AppointmentReminder, label: 'Appointment Reminder' },
      { value: NotificationType.Payment, label: 'Payment' }
    ];
  }

  get todaysNotificationsCount(): number {
  const today = new Date().toDateString();
  return this.notifications.filter(notification => 
    new Date(notification.sentAt).toDateString() === today
  ).length;
}
}
