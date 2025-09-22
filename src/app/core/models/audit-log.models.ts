export interface AuditLogDto {
  logId: number;
  userId?: number;
  userName: string;
  action: string;
  timestamp: Date;
  ipAddress: string;
}

export interface CreateAuditLogDto {
  userId?: number;
  action: string;
  ipAddress: string;
}

export interface AuditLogFilterDto {
  userId?: number;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
}