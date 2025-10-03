import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsService } from '../../../core/services/notifications.service';
import { NotificationDto } from '../../../core/models/notification.models';
import { NotificationType } from '../../../core/models/enums';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-panel" [class.open]="isOpen">
      <div class="panel-header">
        <h3>Notifications</h3>
        <button class="close-btn" (click)="closePanel()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="panel-content" *ngIf="!loading">
        <div class="notification-list" *ngIf="notifications.length > 0; else noNotifications">
          <div 
            *ngFor="let notification of notifications" 
            class="notification-item"
            [class.unread]="!notification.isRead"
            (click)="markAsRead(notification)"
          >
            <div class="notification-icon" [class]="getIconClass(notification.type)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path [attr.d]="getIconPath(notification.type)"/>
              </svg>
            </div>
            <div class="notification-content">
              <h4>{{ notification.title }}</h4>
              <p>{{ notification.message }}</p>
              <span class="notification-time">{{ formatTime(notification.sentAt) }}</span>
            </div>
            <div class="notification-indicator" *ngIf="!notification.isRead"></div>
          </div>
        </div>

        <ng-template #noNotifications>
          <div class="no-notifications">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <p>No notifications</p>
          </div>
        </ng-template>
      </div>

      <div class="panel-content loading-state" *ngIf="loading">
        <div class="loading-spinner"></div>
        <p>Loading notifications...</p>
      </div>

      <div class="panel-footer" *ngIf="notifications.length > 0">
        <button class="mark-all-btn" (click)="markAllAsRead()">
          Mark all as read
        </button>
      </div>
    </div>

    <div class="panel-overlay" [class.visible]="isOpen" (click)="closePanel()"></div>
  `,
  styles: [`
    :host {
      position: relative;
    }

    .notification-panel {
      position: fixed;
      top: 0;
      right: -400px;
      width: 400px;
      height: 100vh;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
      transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 1001;
      display: flex;
      flex-direction: column;
    }

    .notification-panel.open {
      right: 0;
    }

    .panel-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(2px);
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      z-index: 1000;
    }

    .panel-overlay.visible {
      opacity: 1;
      visibility: visible;
    }

    .panel-header {
      padding: 1.5rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(0, 242, 254, 0.1) 100%);
    }

    .panel-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: #2c3e50;
    }

    .close-btn {
      background: none;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      color: #7f8c8d;
    }

    .close-btn:hover {
      background: rgba(0, 0, 0, 0.05);
      color: #2c3e50;
    }

    .close-btn svg {
      width: 20px;
      height: 20px;
    }

    .panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
    }

    .panel-content.loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      color: #7f8c8d;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(79, 172, 254, 0.2);
      border-top-color: #4facfe;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .notification-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .notification-item {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: white;
      border-radius: 12px;
      border: 1px solid rgba(0, 0, 0, 0.05);
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    }

    .notification-item:hover {
      transform: translateX(-4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .notification-item.unread {
      background: linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, rgba(0, 242, 254, 0.05) 100%);
      border-color: rgba(79, 172, 254, 0.2);
    }

    .notification-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .notification-icon.info {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
    }

    .notification-icon.success {
      background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
      color: white;
    }

    .notification-icon.warning {
      background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
      color: white;
    }

    .notification-icon.error {
      background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
      color: white;
    }

    .notification-icon svg {
      width: 20px;
      height: 20px;
    }

    .notification-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .notification-content h4 {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 600;
      color: #2c3e50;
    }

    .notification-content p {
      margin: 0;
      font-size: 0.85rem;
      color: #7f8c8d;
      line-height: 1.4;
    }

    .notification-time {
      font-size: 0.75rem;
      color: #95a5a6;
      margin-top: 0.25rem;
    }

    .notification-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #4facfe;
      flex-shrink: 0;
      margin-top: 0.5rem;
      box-shadow: 0 0 8px rgba(79, 172, 254, 0.5);
    }

    .no-notifications {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 3rem 1rem;
      color: #95a5a6;
    }

    .no-notifications svg {
      width: 60px;
      height: 60px;
      opacity: 0.5;
    }

    .no-notifications p {
      margin: 0;
      font-size: 1rem;
    }

    .panel-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
      background: rgba(255, 255, 255, 0.8);
    }

    .mark-all-btn {
      width: 100%;
      padding: 0.75rem;
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .mark-all-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(79, 172, 254, 0.4);
    }

    .panel-content::-webkit-scrollbar {
      width: 6px;
    }

    .panel-content::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.05);
    }

    .panel-content::-webkit-scrollbar-thumb {
      background: rgba(79, 172, 254, 0.3);
      border-radius: 3px;
    }

    .panel-content::-webkit-scrollbar-thumb:hover {
      background: rgba(79, 172, 254, 0.5);
    }

    @media (max-width: 480px) {
      .notification-panel {
        width: 100%;
        right: -100%;
      }
    }
  `]
})
export class NotificationPanelComponent implements OnInit, OnDestroy {
  isOpen = false;
  notifications: NotificationDto[] = [];
  loading = false;
  private destroy$ = new Subject<void>();

  constructor(private notificationsService: NotificationsService) {}

  ngOnInit(): void {
    // Auto-load notifications when panel opens
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openPanel(userId: number): void {
    this.isOpen = true;
    this.loadNotifications(userId);
  }

  closePanel(): void {
    this.isOpen = false;
  }

  loadNotifications(userId: number): void {
    this.loading = true;
    this.notificationsService.getNotificationsByUser(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notifications) => {
          this.notifications = notifications.sort((a, b) => 
            new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
          );
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading notifications:', error);
          this.loading = false;
        }
      });
  }

  markAsRead(notification: NotificationDto): void {
    if (notification.isRead) return;

    this.notificationsService.markAsRead(notification.notificationId, { isRead: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedNotification) => {
          const index = this.notifications.findIndex(n => n.notificationId === notification.notificationId);
          if (index !== -1) {
            this.notifications[index] = updatedNotification;
          }
        },
        error: (error) => {
          console.error('Error marking notification as read:', error);
        }
      });
  }

  markAllAsRead(): void {
    const unreadNotifications = this.notifications.filter(n => !n.isRead);
    
    unreadNotifications.forEach(notification => {
      this.notificationsService.markAsRead(notification.notificationId, { isRead: true })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedNotification) => {
            const index = this.notifications.findIndex(n => n.notificationId === notification.notificationId);
            if (index !== -1) {
              this.notifications[index] = updatedNotification;
            }
          },
          error: (error) => {
            console.error('Error marking notification as read:', error);
          }
        });
    });
  }

  getIconClass(type: NotificationType): string {
    const typeMap: { [key: string]: string } = {
      [NotificationType.AppointmentReminder]: 'info',
      [NotificationType.Payment]: 'success',
      [NotificationType.General]: 'info'
    };
    return typeMap[type] || 'info';
  }

  getIconPath(type: NotificationType): string {
    const pathMap: { [key: string]: string } = {
      [NotificationType.AppointmentReminder]: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z',
      [NotificationType.Payment]: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z',
      [NotificationType.General]: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9'
    };
    return pathMap[type] || pathMap[NotificationType.General];
  }

  formatTime(date: Date): string {
    const now = new Date();
    const sentAt = new Date(date);
    const diffMs = now.getTime() - sentAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return sentAt.toLocaleDateString();
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }
}
