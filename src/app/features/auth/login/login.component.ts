import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UsersService } from '../../../core/services/users.service';
import { UserLoginDto, AuthStorage } from '../../../core/models/user.models';

export interface NotificationData {
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
}

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginData: UserLoginDto = {
    email: '',
    password: ''
  };

  notification: NotificationData = {
    message: '',
    type: 'info',
    show: false
  };

  isLoading = false;

  constructor(private usersService: UsersService, private router: Router) {}

  showNotification(message: string, type: 'success' | 'error' | 'info') {
    this.notification = {
      message,
      type,
      show: true
    };

    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      this.hideNotification();
    }, 5000);
  }

  hideNotification() {
    this.notification.show = false;
  }

  onLogin() {
    if (!this.loginData.email || !this.loginData.password) {
      this.showNotification('Please fill in all fields', 'error');
      return;
    }

    this.isLoading = true;

    this.usersService.login(this.loginData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.showNotification('Login successful! Redirecting...', 'success');
        
        // Store auth data, navigate to dashboard
        AuthStorage.save(response);
        
        // Delay navigation to show success message
        setTimeout(() => {
          if (response.user.role === 'Patient') {
            this.router.navigate(['/patient']);
          } else if (response.user.role === 'Doctor') {
            this.router.navigate(['/doctor']);
          } else {
            this.router.navigate(['/admin']);
          }
        }, 1500);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Login failed', error);
        
        let errorMessage = 'Login failed. Please try again.';
        
        if (error.status === 401) {
          errorMessage = 'Invalid email or password.';
        } else if (error.status === 0) {
          errorMessage = 'Unable to connect to server. Please check your connection.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        this.showNotification(errorMessage, 'error');
      }
    });
  }
}