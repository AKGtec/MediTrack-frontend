import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserDto, UserRegisterDto, UserLoginDto, AuthResponseDto } from '../models/user.models';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  readonly apiUrl = `${environment.apiUrl}/Users`;

  constructor(readonly http: HttpClient) { }

  /**
   * Get all users
   * @returns Observable of UserDto array
   */
  getAllUsers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(this.apiUrl);
  }

  /**
   * Get user by ID
   * @param id User ID
   * @returns Observable of UserDto
   */
  getUserById(id: number): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get user by email
   * @param email User email
   * @returns Observable of UserDto
   */
  getUserByEmail(email: string): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.apiUrl}/Email/${email}`);
  }

  /**
   * Create a new user
   * @param userRegisterDto User registration details
   * @returns Observable of created UserDto
   */
  createUser(userRegisterDto: UserRegisterDto): Observable<UserDto> {
    return this.http.post<UserDto>(this.apiUrl, userRegisterDto);
  }

  /**
   * Login a user
   * @param userLoginDto User login details
   * @returns Observable of AuthResponseDto
   */
  login(userLoginDto: UserLoginDto): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.apiUrl}/login`, userLoginDto);
  }

  /**
   * Update an existing user
   * @param id User ID
   * @param userDto Updated user details
   * @returns Observable of updated UserDto
   */
  updateUser(id: number, userDto: UserDto): Observable<UserDto> {
    return this.http.put<UserDto>(`${this.apiUrl}/${id}`, userDto);
  }

  /**
   * Delete a user
   * @param id User ID
   * @returns Observable of void
   */
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}