
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api.models';
import { AuthResponse, LoginRequest, RegisterRequest } from '../../shared/models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<AuthResponse | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // FIXED: Simplified initialization - no aggressive validation on startup
  private isInitialized = false;

  constructor(private http: HttpClient) {
    // FIXED: Simple initialization - only check for existing token and user data
    this.initializeFromStorage();
  }

  /**
   * FIXED: Simplified initialization that doesn't make network calls
   * Only loads existing user data if we have a valid token
   */
  private initializeFromStorage(): void {
    const token = this.getToken();

    if (token) {
      // Try to get cached user data from localStorage
      const cachedUser = this.getCachedUser();
      if (cachedUser) {
        console.log('Auth service: Loaded cached user data', cachedUser);
        this.currentUserSubject.next(cachedUser);
      }
      // Note: We don't validate the token here - let it fail naturally on first API call
    }

    this.isInitialized = true;
    console.log('Auth service: Initialized with token:', !!token);
  }

  /**
   * FIXED: Simple wait for initialization (no network calls)
   */
  async waitForInitialization(): Promise<void> {
    // Since we don't do network calls, this is immediate
    return Promise.resolve();
  }

  register(request: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    console.log('Auth service: Registering user', request.email);

    return this.http.post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/register`, request)
      .pipe(
        tap(response => {
          console.log('Auth service: Register response', response);
          if (response.success && response.data) {
            this.setCurrentUser(response.data);
            console.log('Auth service: User registered and logged in', response.data);
          }
        })
      );
  }

  login(request: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    console.log('Auth service: Logging in user', request.identifier);

    return this.http.post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/login`, request)
      .pipe(
        tap(response => {
          console.log('Auth service: Login response', response);
          if (response.success && response.data) {
            this.setCurrentUser(response.data);
            console.log('Auth service: User logged in successfully', response.data);
          }
        })
      );
  }

  logout(): void {
    console.log('Auth service: Logging out user');
    this.clearAuthData();
  }

  /**
   * FIXED: Get current user info from server (on-demand only)
   */
  getCurrentUserFromServer(): Observable<ApiResponse<AuthResponse>> {
    console.log('Auth service: Fetching current user from server');

    return this.http.get<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/me`)
      .pipe(
        tap(response => {
          console.log('Auth service: Current user response', response);
          if (response.success && response.data) {
            this.currentUserSubject.next(response.data);
            this.cacheUser(response.data);
          }
        })
      );
  }

  getCurrentUser(): AuthResponse | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    const hasToken = !!this.getToken();
    const hasUser = !!this.getCurrentUser();
    console.log('Auth service: isAuthenticated check', { hasToken, hasUser, isInitialized: this.isInitialized });

    // FIXED: Only require token for authentication check
    return hasToken && this.isInitialized;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    const result = user?.role === 'admin';
    console.log('Auth service: isAdmin check', { user: user?.userId, role: user?.role, isAdmin: result });
    return result;
  }

  getToken(): string | null {
    return localStorage.getItem(environment.tokenKey);
  }

  /**
   * FIXED: Improved token validation for manual retry
   */
  async validateCurrentToken(): Promise<boolean> {
    const token = this.getToken();
    if (!token) {
      console.log('Auth service: No token to validate');
      return false;
    }

    console.log('Auth service: Validating current token');

    try {
      const response = await this.getCurrentUserFromServer().toPromise();

      // FIXED: Ensure boolean return type
      const isValid = !!(response?.success && response.data);

      if (!isValid) {
        console.log('Auth service: Token validation failed, clearing auth data');
        this.clearAuthData();
      }

      return isValid;
    } catch (error: any) {
      console.error('Auth service: Token validation error', error);

      // Clear token only on definitive auth errors
      if (error.status === 401 || error.status === 403) {
        console.log('Auth service: Auth error detected, clearing token');
        this.clearAuthData();
        return false;
      }

      // For network errors, assume token might still be valid
      console.log('Auth service: Network error during validation, keeping token');
      return true; // Assume valid for network errors
    }
  }

  /**
   * FIXED: Clean auth data clearing
   */
  private clearAuthData(): void {
    console.log('Auth service: Clearing auth data');
    localStorage.removeItem(environment.tokenKey);
    localStorage.removeItem(environment.tokenKey + '_user'); // Clear cached user too
    this.currentUserSubject.next(null);
  }

  /**
   * FIXED: Improved user data storage with caching
   */
  private setCurrentUser(authResponse: AuthResponse): void {
    console.log('Auth service: Setting current user', authResponse);
    localStorage.setItem(environment.tokenKey, authResponse.token);
    this.cacheUser(authResponse);
    this.currentUserSubject.next(authResponse);
  }

  /**
   * Cache user data for quick loading
   */
  private cacheUser(user: AuthResponse): void {
    try {
      localStorage.setItem(environment.tokenKey + '_user', JSON.stringify(user));
    } catch (error) {
      console.warn('Auth service: Failed to cache user data', error);
    }
  }

  /**
   * Get cached user data
   */
  private getCachedUser(): AuthResponse | null {
    try {
      const cached = localStorage.getItem(environment.tokenKey + '_user');
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('Auth service: Failed to load cached user data', error);
      return null;
    }
  }
}
