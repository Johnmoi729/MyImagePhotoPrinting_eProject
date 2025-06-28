
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: false,
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>Sign In to MyImage</mat-card-title>
          <mat-card-subtitle>Access your photo printing account</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email or User ID</mat-label>
              <input matInput formControlName="identifier" placeholder="user@example.com or USR-2024-001234">
              <mat-icon matSuffix>person</mat-icon>
              <mat-error *ngIf="loginForm.get('identifier')?.hasError('required')">
                Email or User ID is required
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password">
              <mat-icon matSuffix>lock</mat-icon>
              <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                Password is required
              </mat-error>
            </mat-form-field>

            <div class="form-actions">
              <button mat-raised-button color="primary" type="submit"
                      [disabled]="loginForm.invalid || isLoading" class="full-width">
                <mat-spinner diameter="20" *ngIf="isLoading"></mat-spinner>
                <span *ngIf="!isLoading">Sign In</span>
              </button>
            </div>
          </form>
        </mat-card-content>

        <mat-card-actions>
          <p class="register-link">
            Don't have an account?
            <a routerLink="/auth/register" mat-button color="primary">Register here</a>
          </p>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 120px);
      padding: 20px;
    }

    .auth-card {
      width: 100%;
      max-width: 400px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .form-actions {
      margin-top: 16px;
    }

    .register-link {
      text-align: center;
      margin: 0;
      padding: 16px;
    }

    mat-spinner {
      margin-right: 8px;
    }
  `]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  returnUrl = '/photos';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      identifier: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    console.log('Login component: Initializing');

    // FIXED: Clear any existing auth state to prevent conflicts
    this.authService.logout();

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/photos';
    console.log('Login component: Return URL set to', this.returnUrl);

    // FIXED: Remove the redirect check - let users login even if they have old tokens
    console.log('Login component: Ready for login');
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      console.log('Login component: Submitting login form');
      this.isLoading = true;

      // FIXED: Ensure clean state before login
      this.authService.logout();

      const loginData = this.loginForm.value;
      console.log('Login component: Attempting login for', loginData.identifier);

      this.authService.login(loginData).subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('Login component: Login response received', response);

          if (response.success && response.data) {
            this.snackBar.open('Login successful!', 'Close', { duration: 3000 });
            console.log('Login component: Login successful, redirecting based on role');
            this.redirectBasedOnRole();
          } else {
            console.error('Login component: Login failed - invalid response', response);
            this.snackBar.open('Login failed. Please check your credentials.', 'Close', { duration: 5000 });
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Login component: Login error', error);

          let errorMessage = 'Login failed. Please try again.';
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.status === 401) {
            errorMessage = 'Invalid email/User ID or password.';
          } else if (error.status === 0) {
            errorMessage = 'Cannot connect to server. Please check your connection.';
          }

          this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
        }
      });
    } else {
      console.log('Login component: Form is invalid');
      this.markFormGroupTouched(this.loginForm);
    }
  }

  /**
   * FIXED: Redirect users based on their role
   */
  private redirectBasedOnRole(): void {
    if (this.authService.isAdmin()) {
      console.log('Login component: Admin user, redirecting to admin orders');
      this.router.navigate(['/admin/orders']);
    } else {
      console.log('Login component: Regular user, redirecting to', this.returnUrl);
      this.router.navigate([this.returnUrl]);
    }
  }

  /**
   * Helper method to show validation errors
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
  }
}
