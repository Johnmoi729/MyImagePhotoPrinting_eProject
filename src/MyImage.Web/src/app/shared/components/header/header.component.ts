
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';

/**
 * REDESIGNED: Enhanced HeaderComponent with universal access to public pages
 * - All users (guest, authenticated, admin) can access public pages
 * - Improved visibility with better contrast and clearer sections
 * - Organized navigation with distinct areas for different functions
 * - Responsive design that adapts to different screen sizes
 * - Maintains consistent theme while improving usability
 */
@Component({
  selector: 'app-header',
  standalone: false,
  template: `
    <header class="app-header">
      <mat-toolbar class="header-toolbar">
        <div class="toolbar-content">
          <!-- Enhanced Logo Section - Always visible and functional -->
          <div class="logo-section">
            <button mat-button class="logo-button" [routerLink]="getLogoLink()">
              <div class="logo-icon">
                <mat-icon>photo_camera</mat-icon>
              </div>
              <div class="logo-text">
                <span class="brand-name">MyImage</span>
                <span class="brand-tagline">Professional Printing</span>
              </div>
            </button>
          </div>

          <!-- Universal Public Navigation - Always visible -->
          <nav class="public-nav" [class.compact]="currentUser$ | async">
            <div class="nav-section public-section">
              <span class="nav-section-label" *ngIf="currentUser$ | async">Explore</span>
              <div class="nav-links">
                <a mat-button routerLink="/public" routerLinkActive="nav-active"
                   [routerLinkActiveOptions]="{exact: true}" class="nav-link public-link">
                  <mat-icon>home</mat-icon>
                  <span>Home</span>
                </a>
                <a mat-button routerLink="/public/about" routerLinkActive="nav-active" class="nav-link public-link">
                  <mat-icon>info</mat-icon>
                  <span>About</span>
                </a>
                <a mat-button routerLink="/public/pricing" routerLinkActive="nav-active" class="nav-link public-link">
                  <mat-icon>attach_money</mat-icon>
                  <span>Pricing</span>
                </a>
                <a mat-button routerLink="/public/samples" routerLinkActive="nav-active" class="nav-link public-link">
                  <mat-icon>collections</mat-icon>
                  <span>Gallery</span>
                </a>
                <a mat-button routerLink="/public/how-it-works" routerLinkActive="nav-active" class="nav-link public-link">
                  <mat-icon>help_outline</mat-icon>
                  <span>How It Works</span>
                </a>
              </div>
            </div>
          </nav>

          <!-- Authenticated User Navigation - Separate section -->
          <nav class="auth-nav" *ngIf="currentUser$ | async">
            <div class="nav-section auth-section">
              <span class="nav-section-label">My Account</span>
              <div class="nav-links">
                <a mat-button routerLink="/photos" routerLinkActive="nav-active" class="nav-link auth-link">
                  <mat-icon>photo_library</mat-icon>
                  <span>My Photos</span>
                </a>
                <a mat-button routerLink="/orders" routerLinkActive="nav-active" class="nav-link auth-link">
                  <mat-icon>receipt</mat-icon>
                  <span>Orders</span>
                </a>
              </div>
            </div>
          </nav>

          <!-- Admin Navigation - Separate section for admins -->
          <nav class="admin-nav" *ngIf="isAdmin">
            <div class="nav-section admin-section">
              <span class="nav-section-label">Admin</span>
              <div class="nav-links">
                <a mat-button routerLink="/admin" routerLinkActive="nav-active" class="nav-link admin-link">
                  <mat-icon>admin_panel_settings</mat-icon>
                  <span>Dashboard</span>
                </a>
              </div>
            </div>
          </nav>

          <!-- Spacer -->
          <div class="nav-spacer"></div>

          <!-- Enhanced User Actions Section -->
          <div class="user-section">
            <!-- Cart Icon (authenticated users only) -->
            <div *ngIf="currentUser$ | async" class="cart-section">
              <button mat-icon-button
                      routerLink="/cart"
                      class="action-button cart-button"
                      matTooltip="Shopping Cart"
                      [class.has-items]="cartItemCount > 0">
                <mat-icon
                  [matBadge]="cartItemCount"
                  [matBadgeHidden]="cartItemCount === 0"
                  matBadgeColor="accent"
                  matBadgeSize="small"
                  matBadgePosition="above after">
                  shopping_cart
                </mat-icon>
              </button>
            </div>

            <!-- Authenticated User Menu -->
            <div *ngIf="currentUser$ | async as user" class="user-menu-section">
              <button mat-button [matMenuTriggerFor]="userMenu" class="user-menu-trigger">
                <div class="user-avatar">
                  <mat-icon>account_circle</mat-icon>
                </div>
                <div class="user-info">
                  <span class="user-name">{{ user.firstName }}</span>
                  <span class="user-role" *ngIf="isAdmin">Admin</span>
                </div>
                <mat-icon class="dropdown-icon">expand_more</mat-icon>
              </button>

              <!-- Enhanced User Menu with better organization -->
              <mat-menu #userMenu="matMenu" class="enhanced-user-menu">
                <div class="menu-header">
                  <div class="user-details">
                    <div class="user-name-full">{{ user.firstName }} {{ user.lastName }}</div>
                    <div class="user-id-badge">ID: {{ user.userId }}</div>
                    <div class="user-email">{{ user.email }}</div>
                  </div>
                </div>

                <mat-divider></mat-divider>

                <!-- Quick Actions Section -->
                <div class="menu-sections">
                  <div class="menu-section">
                    <div class="section-label">Quick Actions</div>
                    <button mat-menu-item routerLink="/photos/upload" class="menu-item quick-action">
                      <mat-icon>cloud_upload</mat-icon>
                      <span>Upload Photos</span>
                    </button>
                    <button mat-menu-item routerLink="/cart" class="menu-item quick-action">
                      <mat-icon>shopping_cart</mat-icon>
                      <span>Shopping Cart</span>
                      <div class="item-badge" *ngIf="cartItemCount > 0">{{ cartItemCount }}</div>
                    </button>
                  </div>

                  <!-- Account Section -->
                  <div class="menu-section">
                    <div class="section-label">My Account</div>
                    <button mat-menu-item routerLink="/photos" class="menu-item">
                      <mat-icon>photo_library</mat-icon>
                      <span>My Photos</span>
                      <div class="item-badge" *ngIf="photoCount > 0">{{ photoCount }}</div>
                    </button>
                    <button mat-menu-item routerLink="/orders" class="menu-item">
                      <mat-icon>receipt</mat-icon>
                      <span>My Orders</span>
                    </button>
                  </div>

                  <!-- Public Pages Section - Easy access for authenticated users -->
                  <div class="menu-section">
                    <div class="section-label">Explore</div>
                    <button mat-menu-item routerLink="/public/pricing" class="menu-item">
                      <mat-icon>attach_money</mat-icon>
                      <span>Pricing</span>
                    </button>
                    <button mat-menu-item routerLink="/public/samples" class="menu-item">
                      <mat-icon>collections</mat-icon>
                      <span>Sample Gallery</span>
                    </button>
                    <button mat-menu-item routerLink="/public/about" class="menu-item">
                      <mat-icon>info</mat-icon>
                      <span>About Us</span>
                    </button>
                  </div>

                  <!-- Admin Section -->
                  <div class="menu-section" *ngIf="isAdmin">
                    <div class="section-label">Administration</div>
                    <button mat-menu-item routerLink="/admin" class="menu-item admin-item">
                      <mat-icon>admin_panel_settings</mat-icon>
                      <span>Admin Dashboard</span>
                    </button>
                  </div>
                </div>

                <mat-divider></mat-divider>

                <button mat-menu-item (click)="logout()" class="logout-item">
                  <mat-icon>logout</mat-icon>
                  <span>Sign Out</span>
                </button>
              </mat-menu>
            </div>

            <!-- Enhanced Guest Actions -->
            <div *ngIf="!(currentUser$ | async)" class="guest-section">
              <button mat-button routerLink="/auth/login" class="login-button">
                <mat-icon>login</mat-icon>
                <span>Sign In</span>
              </button>
              <button mat-raised-button color="primary" routerLink="/auth/register" class="register-button">
                <mat-icon>person_add</mat-icon>
                <span>Get Started</span>
              </button>
            </div>
          </div>
        </div>
      </mat-toolbar>
    </header>
  `,
  styles: [`
    /* Base Header Styles */
    .app-header {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: white;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      border-bottom: 1px solid #e2e8f0;
    }

    .header-toolbar {
      background: white !important;
      color: #2d3748 !important;
      min-height: 84px;
      padding: 0;
    }

    .toolbar-content {
      display: flex;
      align-items: center;
      width: 100%;
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 24px;
      height: 84px;
      gap: 16px;
    }

    /* Enhanced Logo Section */
    .logo-section {
      flex-shrink: 0;
    }

    .logo-button {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 12px;
      transition: all 0.3s ease;
      background: transparent;
      border: none;
    }

    .logo-button:hover {
      background: rgba(63, 81, 181, 0.08);
      transform: translateY(-1px);
    }

    .logo-icon {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(63, 81, 181, 0.25);
    }

    .logo-icon mat-icon {
      color: white;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .logo-text {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .brand-name {
      font-size: 1.5rem;
      font-weight: 700;
      line-height: 1;
      letter-spacing: -0.5px;
      color: #2d3748;
    }

    .brand-tagline {
      font-size: 0.75rem;
      color: #718096;
      font-weight: 500;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    /* Navigation Sections */
    .public-nav, .auth-nav, .admin-nav {
      flex-shrink: 0;
    }

    .nav-section {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }

    .nav-section-label {
      font-size: 0.7rem;
      font-weight: 600;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 0 8px;
      display: none; /* Hidden by default, shown when needed */
    }

    .public-nav.compact .nav-section-label,
    .auth-nav .nav-section-label,
    .admin-nav .nav-section-label {
      display: block;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* Navigation Link Styles */
    .nav-link {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border-radius: 8px;
      font-weight: 500;
      font-size: 0.9rem;
      transition: all 0.3s ease;
      position: relative;
      min-height: 40px;
    }

    /* Public Links */
    .public-link {
      color: #4a5568;
      background: transparent;
    }

    .public-link:hover {
      background: rgba(63, 81, 181, 0.08);
      color: #3f51b5;
      transform: translateY(-1px);
    }

    .public-link.nav-active {
      background: rgba(63, 81, 181, 0.12);
      color: #3f51b5;
      font-weight: 600;
    }

    /* Auth Links */
    .auth-link {
      color: #2d3748;
      background: rgba(66, 153, 225, 0.08);
    }

    .auth-link:hover {
      background: rgba(66, 153, 225, 0.15);
      color: #3182ce;
      transform: translateY(-1px);
    }

    .auth-link.nav-active {
      background: #3182ce;
      color: white;
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(49, 130, 206, 0.3);
    }

    /* Admin Links */
    .admin-link {
      color: #742a2a;
      background: rgba(229, 62, 62, 0.08);
    }

    .admin-link:hover {
      background: rgba(229, 62, 62, 0.15);
      color: #e53e3e;
      transform: translateY(-1px);
    }

    .admin-link.nav-active {
      background: #e53e3e;
      color: white;
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(229, 62, 62, 0.3);
    }

    .nav-link mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .nav-spacer {
      flex: 1;
    }

    /* User Section */
    .user-section {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-shrink: 0;
    }

    /* Action Buttons */
    .action-button {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(63, 81, 181, 0.08);
      transition: all 0.3s ease;
      position: relative;
    }

    .action-button:hover {
      background: rgba(63, 81, 181, 0.15);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(63, 81, 181, 0.2);
    }

    .cart-button.has-items {
      background: rgba(229, 62, 62, 0.1);
      color: #e53e3e;
    }

    .cart-button.has-items:hover {
      background: rgba(229, 62, 62, 0.15);
      box-shadow: 0 6px 20px rgba(229, 62, 62, 0.2);
    }

    .action-button mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    /* User Menu */
    .user-menu-trigger {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
      border-radius: 12px;
      background: rgba(63, 81, 181, 0.08);
      transition: all 0.3s ease;
      min-width: 140px;
      height: 48px;
    }

    .user-menu-trigger:hover {
      background: rgba(63, 81, 181, 0.15);
      transform: translateY(-1px);
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .user-avatar mat-icon {
      color: white;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      flex: 1;
      min-width: 0;
    }

    .user-name {
      font-weight: 600;
      font-size: 0.9rem;
      line-height: 1;
      color: #2d3748;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-role {
      font-size: 0.7rem;
      color: #e53e3e;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .dropdown-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      transition: transform 0.3s ease;
      color: #718096;
      flex-shrink: 0;
    }

    .user-menu-trigger[aria-expanded="true"] .dropdown-icon {
      transform: rotate(180deg);
    }

    /* Enhanced Menu Styles */
    ::ng-deep .enhanced-user-menu {
      min-width: 340px;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }

    ::ng-deep .enhanced-user-menu .mat-mdc-menu-content {
      padding: 0;
    }

    .menu-header {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      padding: 20px;
      text-align: center;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .user-name-full {
      font-weight: 600;
      font-size: 1.1rem;
      color: #2d3748;
    }

    .user-id-badge {
      display: inline-block;
      background: linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%);
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .user-email {
      font-size: 0.85rem;
      color: #718096;
      margin-top: 4px;
    }

    .menu-sections {
      padding: 8px 0;
    }

    .menu-section {
      margin-bottom: 12px;
    }

    .section-label {
      padding: 8px 20px 6px 20px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      width: 100%;
      border: none;
      background: transparent;
      transition: all 0.2s ease;
      position: relative;
    }

    .menu-item:hover {
      background: #f8fafc;
      color: #3f51b5;
    }

    .menu-item mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #718096;
      transition: color 0.2s ease;
    }

    .menu-item:hover mat-icon {
      color: #3f51b5;
    }

    .menu-item span {
      flex: 1;
      text-align: left;
      font-weight: 500;
    }

    .item-badge {
      background: #3f51b5;
      color: white;
      padding: 2px 6px;
      border-radius: 8px;
      font-size: 0.7rem;
      font-weight: 600;
      min-width: 20px;
      text-align: center;
    }

    .quick-action {
      background: rgba(66, 153, 225, 0.05);
    }

    .quick-action:hover {
      background: rgba(66, 153, 225, 0.1);
      color: #3182ce;
    }

    .admin-item {
      background: rgba(229, 62, 62, 0.05);
      color: #c53030;
    }

    .admin-item:hover {
      background: rgba(229, 62, 62, 0.1);
      color: #e53e3e;
    }

    .admin-item mat-icon {
      color: #c53030;
    }

    .admin-item:hover mat-icon {
      color: #e53e3e;
    }

    .logout-item {
      color: #e53e3e;
      border-top: 1px solid #e2e8f0;
      margin-top: 8px;
      font-weight: 600;
    }

    .logout-item:hover {
      background: rgba(229, 62, 62, 0.05);
    }

    .logout-item mat-icon {
      color: #e53e3e;
    }

    /* Guest Section */
    .guest-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .login-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 8px;
      font-weight: 500;
      color: #4a5568;
      transition: all 0.3s ease;
    }

    .login-button:hover {
      background: rgba(63, 81, 181, 0.08);
      color: #3f51b5;
    }

    .register-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(63, 81, 181, 0.25);
      transition: all 0.3s ease;
    }

    .register-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(63, 81, 181, 0.3);
    }

    /* Badge Enhancements */
    ::ng-deep .mat-badge-content {
      background: #e53e3e;
      color: white;
      font-weight: 600;
      font-size: 10px;
      min-width: 18px;
      height: 18px;
      line-height: 18px;
    }

    /* Responsive Design */
    @media (max-width: 1200px) {
      .nav-section-label {
        display: none !important;
      }

      .nav-links {
        gap: 2px;
      }

      .nav-link {
        padding: 6px 10px;
        font-size: 0.85rem;
      }
    }

    @media (max-width: 1024px) {
      .toolbar-content {
        padding: 0 16px;
        gap: 12px;
      }

      .brand-tagline {
        display: none;
      }
    }

    @media (max-width: 768px) {
      .public-nav .nav-links,
      .auth-nav .nav-links,
      .admin-nav .nav-links {
        display: none;
      }

      .user-info .user-role {
        display: none;
      }

      .login-button span,
      .register-button span {
        display: none;
      }

      .user-menu-trigger {
        min-width: auto;
        padding: 8px 12px;
      }
    }

    @media (max-width: 480px) {
      .toolbar-content {
        padding: 0 12px;
        gap: 8px;
      }

      .logo-text {
        display: none;
      }

      .user-section {
        gap: 8px;
      }

      .guest-section {
        gap: 8px;
      }
    }

    /* Animation Classes */
    .fade-in {
      animation: fadeIn 0.3s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Focus States for Accessibility */
    .nav-link:focus,
    .action-button:focus,
    .user-menu-trigger:focus,
    .login-button:focus,
    .register-button:focus {
      outline: 2px solid #3f51b5;
      outline-offset: 2px;
    }
  `]
})
export class HeaderComponent implements OnInit, OnDestroy {
  // Observable streams for reactive data
  currentUser$ = this.authService.currentUser$;
  cartItemCount = 0;
  photoCount = 0; // Can be loaded from PhotoService if needed
  isPublicPage = false;

  // Subject for cleanup subscriptions
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to cart changes to update item count
    this.cartService.cart$.pipe(
      takeUntil(this.destroy$),
      map(cart => cart?.summary?.totalPhotos ?? 0)
    ).subscribe(count => {
      this.cartItemCount = count;
    });

    // Track route changes for public page detection
    // Using NavigationEnd to ensure we get the final route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.updatePublicPageStatus();
    });

    // Initial public page check
    this.updatePublicPageStatus();

    // Load cart data if user is authenticated
    if (this.isAuthenticated) {
      this.cartService.loadCart().subscribe({
        error: (error) => {
          console.warn('Failed to load cart:', error);
        }
      });
    }
  }

  ngOnDestroy(): void {
    // Clean up subscriptions to prevent memory leaks
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Checks if the current user is authenticated
   * @returns boolean indicating authentication status
   */
  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  /**
   * Checks if the current user has admin privileges
   * @returns boolean indicating admin status
   */
  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  /**
   * Determines the appropriate logo link based on authentication status
   * @returns string route for logo navigation
   */
  getLogoLink(): string {
    return this.isAuthenticated ? '/photos' : '/public';
  }

  /**
   * Updates the public page status based on current route
   * This affects styling and navigation behavior
   */
  private updatePublicPageStatus(): void {
    const url = this.router.url;
    this.isPublicPage = url.startsWith('/public') ||
                       url.startsWith('/auth') ||
                       url === '/';
  }

  /**
   * Handles user logout process
   * Clears cart data and redirects to public page
   */
  logout(): void {
    // Clear cart data before logging out
    this.cartService.clearCart().subscribe({
      complete: () => {
        // Perform logout and redirect
        this.authService.logout();
        this.router.navigate(['/public']);
      },
      error: (error) => {
        console.warn('Error clearing cart during logout:', error);
        // Still proceed with logout even if cart clear fails
        this.authService.logout();
        this.router.navigate(['/public']);
      }
    });
  }
}
