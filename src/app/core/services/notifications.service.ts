import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationDto, CreateNotificationDto, UpdateNotificationStatusDto } from '../models/notification.models';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  readonly apiUrl = `${environment.apiUrl}/Notifications`;

  constructor(readonly http: HttpClient) { }

  /**
   * Get notification by ID
   * @param id Notification ID
   * @returns Observable of NotificationDto
   */
  getNotificationById(id: number): Observable<NotificationDto> {
    return this.http.get<NotificationDto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get notifications by user ID
   * @param userId User ID
   * @returns Observable of NotificationDto array
   */
  getNotificationsByUser(userId: number): Observable<NotificationDto[]> {
    return this.http.get<NotificationDto[]>(`${this.apiUrl}/User/${userId}`);
  }

  /**
   * Send a new notification
   * @param dto Notification details
   * @returns Observable of created NotificationDto
   */
  sendNotification(dto: CreateNotificationDto): Observable<NotificationDto> {
    return this.http.post<NotificationDto>(this.apiUrl, dto);
  }

  /**
   * Mark notification as read
   * @param id Notification ID
   * @param dto Status update
   * @returns Observable of updated NotificationDto
   */
  markAsRead(id: number, dto: UpdateNotificationStatusDto): Observable<NotificationDto> {
    return this.http.put<NotificationDto>(`${this.apiUrl}/${id}/Read`, dto);
  }
}