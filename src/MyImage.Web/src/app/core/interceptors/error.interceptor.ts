
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        console.log('Error interceptor: Caught error', error);

        let errorMessage = 'An unexpected error occurred';

        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // Server-side error
          switch (error.status) {
            case 401:
              // FIXED: Don't auto-redirect on auth endpoints
              if (this.isAuthEndpoint(req.url)) {
                console.log('Error interceptor: 401 on auth endpoint, not redirecting');
                errorMessage = 'Invalid credentials';
              } else {
                console.log('Error interceptor: 401 on protected endpoint, clearing auth and redirecting');
                this.authService.logout();
                this.router.navigate(['/auth/login']);
                errorMessage = 'Your session has expired. Please log in again.';
              }
              break;
            case 403:
              errorMessage = 'You do not have permission to perform this action.';
              break;
            case 404:
              errorMessage = 'The requested resource was not found.';
              break;
            case 413:
              errorMessage = 'File size too large. Maximum size is 50MB per file.';
              break;
            case 422:
              errorMessage = error.error?.message || 'Invalid data provided.';
              break;
            case 500:
              errorMessage = 'Server error. Please try again later.';
              break;
            default:
              errorMessage = error.error?.message || 'An unexpected error occurred.';
          }
        }

        // FIXED: Only show error message for non-auth endpoints or non-401 errors
        if (!this.isAuthEndpoint(req.url) || error.status !== 401) {
          this.snackBar.open(errorMessage, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }

        return throwError(() => error);
      })
    );
  }

  /**
   * FIXED: Check if the request is to an auth endpoint
   */
  private isAuthEndpoint(url: string): boolean {
    return url.includes('/auth/login') ||
           url.includes('/auth/register') ||
           url.includes('/auth/me');
  }
}
