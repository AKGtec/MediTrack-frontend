import { NotificationType } from './enums';

export interface NotificationDto {
  notificationId: number;
  userId: number;
  userName?: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  sentAt: Date;
}

export interface CreateNotificationDto {
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
}

export interface UpdateNotificationStatusDto {
  isRead: boolean;
}