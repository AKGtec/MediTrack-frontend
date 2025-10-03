import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

declare const google: any;

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private clientId = "904355761342-4vg0gdqotgq91s7mvs1g68do8l4lttqu.apps.googleusercontent.com";
  public user$ = new BehaviorSubject<any>(null);
  public jwtToken: string | null = null;

  constructor(private http: HttpClient, private zone: NgZone) { }

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
      { theme: 'outline', size: 'large' }
    );
  }

  private handleCredentialResponse(response: any) {
    // response.credential is the id_token
    const idToken = response.credential;
    // Send it to backend
    this.http.post<{ token: string }>(
      '/api/auth/google',
      { idToken: idToken }
    ).subscribe({
      next: (res) => {
        this.jwtToken = res.token;
        // Optionally, decode JWT or store user info
        this.user$.next({ token: res.token });
      },
      error: err => {
        console.error('Google login failed', err);
      }
    });
  }
}
