import { Gender, Role } from './enums';

export interface UserDto {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth?: Date;
  gender?: string;
  role: string;
}

export interface UserRegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;

  // New properties
  gender: string;
  role: string;
}

export interface UserLoginDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  user: UserDto;
  token: string;
}

export class AuthStorage {
  private static readonly storageKey = 'authData';

  static save(authResponse: AuthResponseDto) {
    localStorage.setItem(this.storageKey, JSON.stringify(authResponse));
  }

  static get(): AuthResponseDto | null {
    const serialized = localStorage.getItem(this.storageKey);
    return serialized ? (JSON.parse(serialized) as AuthResponseDto) : null;
  }

  static clear() {
    localStorage.removeItem(this.storageKey);
  }
}