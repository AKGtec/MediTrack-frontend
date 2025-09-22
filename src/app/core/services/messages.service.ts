import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MessageDto, CreateMessageDto, UpdateMessageStatusDto } from '../models/message.models';

@Injectable({
  providedIn: 'root'
})
export class MessagesService {
  readonly apiUrl = `${environment.apiUrl}/Messages`;

  constructor(readonly http: HttpClient) { }

  /**
   * Get message by ID
   * @param id Message ID
   * @returns Observable of MessageDto
   */
  getMessageById(id: number): Observable<MessageDto> {
    return this.http.get<MessageDto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get conversation between two users
   * @param senderId Sender user ID
   * @param receiverId Receiver user ID
   * @returns Observable of MessageDto array
   */
  getConversation(senderId: number, receiverId: number): Observable<MessageDto[]> {
    const params = new HttpParams()
      .set('senderId', senderId.toString())
      .set('receiverId', receiverId.toString());
    return this.http.get<MessageDto[]>(`${this.apiUrl}/Conversation`, { params });
  }

  /**
   * Send a new message
   * @param createMessageDto Message details
   * @returns Observable of sent MessageDto
   */
  sendMessage(createMessageDto: CreateMessageDto): Observable<MessageDto> {
    return this.http.post<MessageDto>(this.apiUrl, createMessageDto);
  }

  /**
   * Update message status
   * @param id Message ID
   * @param updateMessageStatusDto Status update data
   * @returns Observable of updated MessageDto
   */
  updateMessageStatus(id: number, updateMessageStatusDto: UpdateMessageStatusDto): Observable<MessageDto> {
    return this.http.put<MessageDto>(`${this.apiUrl}/${id}/Read`, updateMessageStatusDto);
  }

  /**
   * Delete message
   * @param id Message ID
   * @returns Observable of void
   */
  deleteMessage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}