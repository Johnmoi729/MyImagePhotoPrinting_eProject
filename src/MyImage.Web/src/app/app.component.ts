
import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';

/**
 * UPDATED: Main App Component with enhanced public page support.
 * Handles both public and authenticated user experiences seamlessly.
 */
@Component({
  selector: 'app-root',
  standalone: false,
  template: `
    <div class="app-container" [class.public-mode]="isPublicPage">
      <!-- UPDATED: Header that adapts to public/private context -->
      <app-header></app-header>

      <!-- Main Content Area -->
      <main class="main-content" [class.public-content]="isPublicPage">
        <router-outlet></router-outlet>
      </main>

      <!-- UPDATED: Footer for public pages -->
      <footer class="app-footer" *ngIf="isPublicPage">
        <div class="footer-content">
          <div class="footer-section">
            <h4>MyImage</h4>
            <p>Professional photo printing service bringing your digital memories to life.</p>
          </div>

          <div class="footer-section">
            <h4>Quick Links</h4>
            <ul class="footer-links">
              <li><a routerLink="/public">Home</a></li>
              <li><a routerLink="/public/about">About</a></li>
              <li><a routerLink="/public/pricing">Pricing</a></li>
              <li><a routerLink="/public/samples">Gallery</a></li>
              <li><a routerLink="/public/how-it-works">How It Works</a></li>
            </ul>
          </div>

          <div class="footer-section">
            <h4>Get Started</h4>
            <ul class="footer-links">
              <li><a routerLink="/auth/register">Create Account</a></li>
              <li><a routerLink="/auth/login">Sign In</a></li>
            </ul>
          </div>

          <div class="footer-section">
            <h4>Support</h4>
            <ul class="footer-links">
              <li><a href="mailto:support@myimage.com">Contact Us</a></li>
              <li><a href="tel:1-800-MY-IMAGE">1-800-MY-IMAGE</a></li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <p>&copy; 2024 MyImage Photo Printing. All rights reserved.</p>
          <div class="footer-legal">
            <a href="#" onclick="return false;">Privacy Policy</a>
            <a href="#" onclick="return false;">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .main-content {
      flex: 1;
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }

    /* UPDATED: Different styles for public vs authenticated pages */
    .main-content.public-content {
      padding: 0;
      max-width: none;
      margin: 0;
    }

    .app-container.public-mode {
      background: #ffffff;
    }

    /* NEW: Footer Styles for Public Pages */
    .app-footer {
      background: #2c3e50;
      color: white;
      margin-top: auto;
    }

    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 40px;
    }

    .footer-section h4 {
      color: #ecf0f1;
      margin-bottom: 16px;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .footer-section p {
      color: #bdc3c7;
      line-height: 1.6;
      margin: 0;
    }

    .footer-links {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .footer-links li {
      margin-bottom: 8px;
    }

    .footer-links a {
      color: #bdc3c7;
      text-decoration: none;
      transition: color 0.3s ease;
      font-size: 0.9rem;
    }

    .footer-links a:hover {
      color: #3498db;
    }

    .footer-bottom {
      border-top: 1px solid #34495e;
      padding: 20px;
      text-align: center;
      background: #34495e;
    }

    .footer-bottom p {
      margin: 0 0 8px 0;
      color: #bdc3c7;
      font-size: 0.9rem;
    }

    .footer-legal {
      display: flex;
      justify-content: center;
      gap: 20px;
    }

    .footer-legal a {
      color: #95a5a6;
      text-decoration: none;
      font-size: 0.8rem;
      transition: color 0.3s ease;
    }

    .footer-legal a:hover {
      color: #3498db;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .main-content {
        padding: 10px;
      }

      .main-content.public-content {
        padding: 0;
      }

      .footer-content {
        grid-template-columns: repeat(2, 1fr);
        gap: 30px;
        padding: 30px 20px;
      }

      .footer-legal {
        flex-direction: column;
        gap: 8px;
      }
    }

    @media (max-width: 480px) {
      .footer-content {
        grid-template-columns: 1fr;
        gap: 20px;
        padding: 20px;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  isPublicPage = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Monitor route changes to determine if we're on a public page
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updatePageContext(event.urlAfterRedirects);
    });

    // Set initial page context
    this.updatePageContext(this.router.url);
  }

  /**
   * UPDATED: Determine if current page is public and update UI accordingly
   */
  private updatePageContext(url: string): void {
    // Determine if current route is a public page
    this.isPublicPage = url.startsWith('/public') ||
                       url.startsWith('/auth') ||
                       url === '/' ||
                       url === '';

    console.log('App: Route changed to', url, 'isPublicPage:', this.isPublicPage);

    // Update page title based on route
    this.updatePageTitle(url);
  }

  /**
   * NEW: Update page title based on current route
   */
  private updatePageTitle(url: string): void {
    let title = 'MyImage - Professional Photo Printing';

    if (url.includes('/public/about')) {
      title = 'About Us - MyImage Photo Printing';
    } else if (url.includes('/public/pricing')) {
      title = 'Pricing - MyImage Photo Printing';
    } else if (url.includes('/public/samples')) {
      title = 'Sample Gallery - MyImage Photo Printing';
    } else if (url.includes('/public/how-it-works')) {
      title = 'How It Works - MyImage Photo Printing';
    } else if (url.includes('/auth/login')) {
      title = 'Sign In - MyImage Photo Printing';
    } else if (url.includes('/auth/register')) {
      title = 'Create Account - MyImage Photo Printing';
    } else if (url.includes('/photos')) {
      title = 'My Photos - MyImage';
    } else if (url.includes('/cart')) {
      title = 'Shopping Cart - MyImage';
    } else if (url.includes('/orders')) {
      title = 'My Orders - MyImage';
    } else if (url.includes('/admin')) {
      title = 'Admin Panel - MyImage';
    }

    document.title = title;
  }
}
