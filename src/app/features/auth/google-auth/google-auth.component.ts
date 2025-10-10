import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GoogleAuthService } from '../../../core/services/googleauth.service';
import { AuthStorage } from '../../../core/models/user.models';
import { AuthResponseDto } from '../../../core/models/user.models';

@Component({
  selector: 'app-google-auth',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './google-auth.component.html',
  styleUrl: './google-auth.component.css'
})
export class GoogleAuthComponent implements OnInit {
  private router = inject(Router);
  private googleAuthService = inject(GoogleAuthService);

  isLoading = false;
  error: string | null = null;

  ngOnInit() {
    this.initializeGoogleAuth();
  }

  private initializeGoogleAuth() {
    // Check if Google Auth SDK is loaded
    if (typeof window !== 'undefined' && (window as any).google) {
      this.loadGoogleAuth();
    } else {
      // Load Google Auth SDK
      this.loadGoogleSDK();
    }
  }

  private loadGoogleSDK() {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => this.loadGoogleAuth();
    document.head.appendChild(script);
  }

  private loadGoogleAuth() {
    if (typeof window !== 'undefined' && (window as any).google) {
      this.googleAuthService.initialize(() => {
        this.googleAuthService.renderButton('google-signin-button');
      });
    }
  }

  onManualLogin() {
    this.router.navigate(['/auth/login']);
  }
}
