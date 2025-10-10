import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { GoogleAuthComponent } from './google-auth.component';
import { GoogleAuthService } from '../../../core/services/googleauth.service';

describe('GoogleAuthComponent', () => {
  let component: GoogleAuthComponent;
  let fixture: ComponentFixture<GoogleAuthComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockGoogleAuthService: jasmine.SpyObj<GoogleAuthService>;

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const googleAuthServiceSpy = jasmine.createSpyObj('GoogleAuthService', [
      'initialize',
      'renderButton'
    ]);

    await TestBed.configureTestingModule({
      imports: [GoogleAuthComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: GoogleAuthService, useValue: googleAuthServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GoogleAuthComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockGoogleAuthService = TestBed.inject(GoogleAuthService) as jasmine.SpyObj<GoogleAuthService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize Google Auth on component init', () => {
    spyOn(component as any, 'initializeGoogleAuth');
    component.ngOnInit();
    expect((component as any).initializeGoogleAuth).toHaveBeenCalled();
  });

  it('should navigate to manual login when onManualLogin is called', () => {
    component.onManualLogin();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
  });
});
