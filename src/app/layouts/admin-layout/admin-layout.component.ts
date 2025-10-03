import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Images } from '../../../assets/styles/constance';
import { NotificationPanelComponent } from '../../shared/components/notification-panel/notification-panel.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationPanelComponent],
  templateUrl: `./admin-layout.component.html`,
  styleUrl: `./admin-layout.component.css`,
})
export class AdminLayoutComponent {
  @ViewChild(NotificationPanelComponent) notificationPanel!: NotificationPanelComponent;
  
  imageURL = Images.logo;
  // TODO: Replace with actual user ID from auth service
  currentUserId = 1;

  openNotifications(): void {
    this.notificationPanel.openPanel(this.currentUserId);
  }

  get unreadCount(): number {
    return this.notificationPanel?.unreadCount || 0;
  }
}
