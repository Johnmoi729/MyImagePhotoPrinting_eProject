
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    console.log('Auth guard: Checking route access for', state.url);

    // FIXED: Simple initialization wait (no network calls)
    await this.authService.waitForInitialization();

    // FIXED: Simple authentication check
    if (this.authService.isAuthenticated()) {
      console.log('Auth guard: User is authenticated, allowing access');
      return true;
    }

    // FIXED: Not authenticated, redirect to login
    console.log('Auth guard: User not authenticated, redirecting to login');
    this.navigateToLogin(state.url);
    return false;
  }

  private navigateToLogin(returnUrl: string): void {
    // Don't store returnUrl for auth routes to prevent loops
    if (returnUrl.startsWith('/auth/')) {
      console.log('Auth guard: Redirecting to login without returnUrl (auth route)');
      this.router.navigate(['/auth/login']);
    } else {
      console.log('Auth guard: Redirecting to login with returnUrl:', returnUrl);
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl }
      });
    }
  }
}
