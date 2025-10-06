import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessagesService } from '../../../core/services/messages.service';
import { AuthStorage } from '../../../core/models/user.models';
import { MessageDto, CreateMessageDto } from '../../../core/models/message.models';

@Component({
  selector: 'app-messaging',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messaging.component.html',
  styleUrl: './messaging.component.css'
})
export class MessagingComponent implements OnInit {
  @Input() partnerId!: number;
  @Input() partnerName!: string;
  @Output() close = new EventEmitter<void>();

  private messagesService = inject(MessagesService);

  messages: MessageDto[] = [];
  currentUserId: number = 0;
  newMessageText: string = '';
  loading = true;
  error: string | null = null;

  ngOnInit() {
    try {
      const currentUser = AuthStorage.get();
      this.currentUserId = currentUser?.user?.userId || 0;
      if (this.currentUserId && this.partnerId) {
        this.loadConversation();
      } else {
        this.error = 'User or partner not found.';
        this.loading = false;
      }
    } catch (err) {
      this.error = 'Unable to load messaging. Please try again.';
      this.loading = false;
    }
  }

  loadConversation() {
    this.loading = true;
    this.error = null;
    this.messagesService.getConversation(this.currentUserId, this.partnerId)
      .subscribe({
        next: (messages) => {
          this.messages = messages.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load conversation', err);
          this.error = 'Failed to load messages.';
          this.loading = false;
        }
      });
  }

  sendMessage() {
    if (!this.newMessageText.trim()) return;

    const createMessage: CreateMessageDto = {
      senderId: this.currentUserId,
      receiverId: this.partnerId,
      messageText: this.newMessageText.trim()
    };

    this.messagesService.sendMessage(createMessage).subscribe({
      next: (sentMessage) => {
        this.messages.push(sentMessage);
        this.newMessageText = '';
        // Optionally refresh conversation
      },
      error: (err) => {
        console.error('Failed to send message', err);
        // Handle error, perhaps show alert
      }
    });
  }

  closeMessaging() {
    this.close.emit();
  }
}
