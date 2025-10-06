import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router'; // Add this import
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponseDto, AuthStorage } from '../models/user.models'; // Add AuthStorage import

declare const google: any;

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  readonly  clientId = "904355761342-4vg0gdqotgq91s7mvs1g68do8l4lttqu.apps.googleusercontent.com";
  readonly apiUrl = environment.apiUrl;
  public user$ = new BehaviorSubject<any>(null);
  public jwtToken: string | null = null;

  constructor(
    readonly http: HttpClient, 
    readonly zone: NgZone,
    readonly router: Router // Inject Router here
  ) { }

  initialize(initCallBack: () => void) {
    google.accounts.id.initialize({
      client_id: this.clientId,
      callback: (response: any) => this.handleCredentialResponse(response)
    });
    initCallBack();
  }

  renderButton(elementId: string) {
    google.accounts.id.renderButton(
      document.getElementById(elementId),
      { theme: 'outline', size: 'large', text: 'signup_with' }
    );
  }

  private handleCredentialResponse(response: any) {
    const idToken = response.credential;
    
    this.http.post<AuthResponseDto>(
      `${this.apiUrl}/Users/auth/google/patient`,
      { idToken: idToken }
    ).subscribe({
      next: (res) => {
        this.zone.run(() => {
          this.jwtToken = res.token;
          this.user$.next(res.user);
          
          // Store auth data
          AuthStorage.save(res);
          
          // Navigate to patient dashboard
          this.router.navigate(['/patient']);
        });
      },
      error: err => {
        this.zone.run(() => {
          console.error('Google signup failed', err);
          // You might want to emit an error subject here
          this.user$.error(err);
        });
      }
    });
  }

  // Alternative method that returns observable for component handling
  signUpWithGoogle(idToken: string): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(
      `${this.apiUrl}/Users/auth/google/patient`,
      { idToken: idToken }
    );
  }
}