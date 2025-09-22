export interface MessageDto {
  messageId: number;
  senderId: number;
  senderName?: string;
  receiverId: number;
  receiverName?: string;
  messageText: string;
  sentAt: Date;
  isRead: boolean;
}

export interface CreateMessageDto {
  senderId: number;
  receiverId: number;
  messageText: string;
}

export interface UpdateMessageStatusDto {
  isRead: boolean;
}