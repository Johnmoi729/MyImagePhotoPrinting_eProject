
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    console.log('Admin guard: Checking admin access');

    // FIXED: Check both authentication and admin role
    const isAuthenticated = this.authService.isAuthenticated();
    const isAdmin = this.authService.isAdmin();

    console.log('Admin guard: Auth check', { isAuthenticated, isAdmin });

    if (isAuthenticated && isAdmin) {
      console.log('Admin guard: Access granted');
      return true;
    }

    // FIXED: Redirect non-admin users to photos, not login
    if (isAuthenticated && !isAdmin) {
      console.log('Admin guard: User is authenticated but not admin, redirecting to photos');
      this.router.navigate(['/photos']);
    } else {
      console.log('Admin guard: User not authenticated, redirecting to login');
      this.router.navigate(['/auth/login']);
    }

    return false;
  }
}
