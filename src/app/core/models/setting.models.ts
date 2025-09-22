export interface SettingDto {
  settingId: number;
  key: string;
  value: string;
}

export interface CreateSettingDto {
  key: string;
  value: string;
}

export interface UpdateSettingDto {
  settingId: number;
  value: string;
}