import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UsersService } from '../../../core/services/users.service';
import { GoogleAuthService } from '../../../core/services/googleauth.service';
import { UserLoginDto, AuthStorage } from '../../../core/models/user.models';
import { Subscription } from 'rxjs';

declare const google: any;

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
export class LoginComponent implements OnInit, OnDestroy {
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
  isGoogleLoading = false;
  private googleAuthSub: Subscription | null = null;

  constructor(
    readonly usersService: UsersService, 
    readonly googleAuthService: GoogleAuthService,
    readonly  router: Router
  ) {}

  ngOnInit() {
    this.initializeGoogleAuth();
    
    // Subscribe to Google auth errors
    this.googleAuthSub = this.googleAuthService.user$.subscribe({
      error: (error) => {
        this.showNotification('Google signup failed. Please try again.', 'error');
        this.isGoogleLoading = false;
      }
    });
  }

  ngOnDestroy() {
    if (this.googleAuthSub) {
      this.googleAuthSub.unsubscribe();
    }
  }

  initializeGoogleAuth() {
    this.googleAuthService.initialize(() => {
      console.log('Google Auth initialized');
    });
  }

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

  // New method for Google sign-up
  onGoogleSignUp() {
    this.isGoogleLoading = true;
    this.showNotification('Connecting to Google...', 'info');

    try {
      // Render the button programmatically and trigger click
      const buttonContainer = document.getElementById('googleSignUpButton');
      if (buttonContainer) {
        this.googleAuthService.renderButton('googleSignUpButton');
        
        // Simulate click on the Google button
        const googleButton = buttonContainer.querySelector('div[role="button"]') as HTMLElement;
        if (googleButton) {
          googleButton.click();
        } else {
          // If button not found immediately, try after a short delay
          setTimeout(() => {
            const retryButton = buttonContainer.querySelector('div[role="button"]') as HTMLElement;
            if (retryButton) {
              retryButton.click();
            } else {
              this.isGoogleLoading = false;
              this.showNotification('Failed to initialize Google sign up. Please refresh and try again.', 'error');
            }
          }, 500);
        }
      }
    } catch (error) {
      this.isGoogleLoading = false;
      this.showNotification('Google sign up failed. Please try again.', 'error');
      console.error('Google sign up error:', error);
    }
  }

  // Alternative manual Google sign-up implementation
  manualGoogleSignUp() {
    this.isGoogleLoading = true;
    this.showNotification('Opening Google sign up...', 'info');

    google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkipped()) {
        this.isGoogleLoading = false;
        this.showNotification('Please allow pop-ups for Google sign up.', 'info');
      }
    });
  }
}