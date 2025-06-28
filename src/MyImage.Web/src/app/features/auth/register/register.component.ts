
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: false,
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>Create Your MyImage Account</mat-card-title>
          <mat-card-subtitle>Start printing your photos today</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <div class="name-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>First Name</mat-label>
                <input matInput formControlName="firstName">
                <mat-error *ngIf="registerForm.get('firstName')?.hasError('required')">
                  First name is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Last Name</mat-label>
                <input matInput formControlName="lastName">
                <mat-error *ngIf="registerForm.get('lastName')?.hasError('required')">
                  Last name is required
                </mat-error>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email Address</mat-label>
              <input matInput type="email" formControlName="email">
              <mat-icon matSuffix>email</mat-icon>
              <mat-error *ngIf="registerForm.get('email')?.hasError('required')">
                Email is required
              </mat-error>
              <mat-error *ngIf="registerForm.get('email')?.hasError('email')">
                Please enter a valid email address
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password">
              <mat-icon matSuffix>lock</mat-icon>
              <mat-error *ngIf="registerForm.get('password')?.hasError('required')">
                Password is required
              </mat-error>
              <mat-error *ngIf="registerForm.get('password')?.hasError('minlength')">
                Password must be at least 8 characters
              </mat-error>
              <mat-error *ngIf="registerForm.get('password')?.hasError('pattern')">
                Password must contain uppercase, lowercase, number, and special character
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirm Password</mat-label>
              <input matInput type="password" formControlName="confirmPassword">
              <mat-icon matSuffix>lock</mat-icon>
              <mat-error *ngIf="registerForm.get('confirmPassword')?.hasError('required')">
                Please confirm your password
              </mat-error>
              <mat-error *ngIf="registerForm.get('confirmPassword')?.hasError('mismatch')">
                Passwords do not match
              </mat-error>
            </mat-form-field>

            <div class="form-actions">
              <button mat-raised-button color="primary" type="submit"
                      [disabled]="registerForm.invalid || isLoading" class="full-width">
                <mat-spinner diameter="20" *ngIf="isLoading"></mat-spinner>
                <span *ngIf="!isLoading">Create Account</span>
              </button>
            </div>
          </form>
        </mat-card-content>

        <mat-card-actions>
          <p class="login-link">
            Already have an account?
            <a routerLink="/auth/login" mat-button color="primary">Sign in here</a>
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
      max-width: 500px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .name-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }

    .half-width {
      flex: 1;
    }

    .form-actions {
      margin-top: 16px;
    }

    .login-link {
      text-align: center;
      margin: 0;
      padding: 16px;
    }

    mat-spinner {
      margin-right: 8px;
    }
  `]
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
      ]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    console.log('Register component: Initializing');

    // FIXED: Clear any existing auth state to prevent conflicts
    this.authService.logout();

    console.log('Register component: Ready for registration');
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
    } else if (confirmPassword?.hasError('mismatch')) {
      confirmPassword.setErrors(null);
    }

    return null;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      console.log('Register component: Submitting registration form');
      this.isLoading = true;

      // FIXED: Ensure clean state before registration
      this.authService.logout();

      const registerData = this.registerForm.value;
      console.log('Register component: Attempting registration for', registerData.email);

      this.authService.register(registerData).subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('Register component: Registration response received', response);

          if (response.success && response.data) {
            this.snackBar.open(
              `Account created! Your User ID is: ${response.data.userId}`,
              'Close',
              { duration: 8000 }
            );

            console.log('Register component: Registration successful, redirecting based on role');
            this.redirectBasedOnRole();
          } else {
            console.error('Register component: Registration failed - invalid response', response);
            this.snackBar.open('Registration failed. Please try again.', 'Close', { duration: 5000 });
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Register component: Registration error', error);

          let errorMessage = 'Registration failed. Please try again.';
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.status === 409) {
            errorMessage = 'An account with this email already exists.';
          } else if (error.status === 0) {
            errorMessage = 'Cannot connect to server. Please check your connection.';
          }

          this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
        }
      });
    } else {
      console.log('Register component: Form is invalid');
      this.markFormGroupTouched(this.registerForm);
    }
  }

  /**
   * FIXED: Redirect users based on their role
   */
  private redirectBasedOnRole(): void {
    if (this.authService.isAdmin()) {
      console.log('Register component: Admin user, redirecting to admin orders');
      this.router.navigate(['/admin/orders']);
    } else {
      console.log('Register component: Regular user, redirecting to photos');
      this.router.navigate(['/photos']);
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
