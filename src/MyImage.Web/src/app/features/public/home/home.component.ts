
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Home component serving as the main landing page for MyImage photo printing service.
 * Features service overview, sample gallery, pricing highlights, and call-to-action buttons.
 * Designed to convert visitors into registered users.
 */
@Component({
  selector: 'app-home',
  standalone: false,
  template: `
    <div class="home-container">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-content">
          <h1 class="hero-title">Transform Your Digital Photos Into Beautiful Prints</h1>
          <p class="hero-subtitle">
            Professional quality photo printing with convenient online ordering and home delivery.
            From wallet-size memories to stunning large format prints.
          </p>
          <div class="hero-actions">
            <button mat-raised-button color="primary" class="cta-button" (click)="getStarted()">
              <mat-icon>photo_camera</mat-icon>
              Get Started - Upload Photos
            </button>
            <button mat-button class="secondary-button" routerLink="/public/samples">
              <mat-icon>collections</mat-icon>
              View Sample Gallery
            </button>
          </div>
        </div>
        <div class="hero-image">
          <img src="https://picsum.photos/600/400?random=1" alt="Beautiful photo prints" class="hero-photo">
        </div>
      </section>

      <!-- Features Section -->
      <section class="features-section">
        <div class="section-header">
          <h2>Why Choose MyImage?</h2>
          <p>Professional quality, competitive pricing, and convenient service</p>
        </div>

        <div class="features-grid">
          <mat-card class="feature-card">
            <mat-card-content>
              <mat-icon class="feature-icon">high_quality</mat-icon>
              <h3>Premium Quality</h3>
              <p>Professional-grade printing on premium photo paper with vibrant colors and sharp details.</p>
            </mat-card-content>
          </mat-card>

          <mat-card class="feature-card">
            <mat-card-content>
              <mat-icon class="feature-icon">schedule</mat-icon>
              <h3>Fast Turnaround</h3>
              <p>Most orders printed and shipped within 24-48 hours. Express options available.</p>
            </mat-card-content>
          </mat-card>

          <mat-card class="feature-card">
            <mat-card-content>
              <mat-icon class="feature-icon">local_shipping</mat-icon>
              <h3>Home Delivery</h3>
              <p>Secure packaging and reliable shipping directly to your door. Track your order online.</p>
            </mat-card-content>
          </mat-card>

          <mat-card class="feature-card">
            <mat-card-content>
              <mat-icon class="feature-icon">attach_money</mat-icon>
              <h3>Great Value</h3>
              <p>Competitive pricing starting at just $0.29 per print. Volume discounts available.</p>
            </mat-card-content>
          </mat-card>
        </div>
      </section>

      <!-- Sample Prints Preview -->
      <section class="samples-preview">
        <div class="section-header">
          <h2>See the Quality</h2>
          <p>Browse our sample gallery to see the exceptional print quality</p>
        </div>

        <div class="samples-grid">
          <div class="sample-item" *ngFor="let sample of sampleImages; let i = index">
            <img [src]="sample.url" [alt]="sample.description" class="sample-image">
            <div class="sample-info">
              <h4>{{ sample.title }}</h4>
              <p>{{ sample.description }}</p>
            </div>
          </div>
        </div>

        <div class="samples-action">
          <button mat-raised-button color="accent" routerLink="/public/samples">
            View Full Gallery
            <mat-icon>arrow_forward</mat-icon>
          </button>
        </div>
      </section>

      <!-- Pricing Preview -->
      <section class="pricing-preview">
        <div class="section-header">
          <h2>Simple, Transparent Pricing</h2>
          <p>No hidden fees. Pay only for what you print.</p>
        </div>

        <div class="pricing-grid">
          <mat-card class="price-card popular">
            <mat-card-header>
              <mat-card-title>Standard 4×6</mat-card-title>
              <mat-card-subtitle>Perfect for albums and sharing</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="price">$0.29<span class="price-unit">each</span></div>
              <ul class="features-list">
                <li>Professional photo paper</li>
                <li>Glossy or matte finish</li>
                <li>Perfect for memories</li>
              </ul>
            </mat-card-content>
          </mat-card>

          <mat-card class="price-card">
            <mat-card-header>
              <mat-card-title>Classic 5×7</mat-card-title>
              <mat-card-subtitle>Great for frames and gifts</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="price">$0.49<span class="price-unit">each</span></div>
              <ul class="features-list">
                <li>Premium quality paper</li>
                <li>Ideal for framing</li>
                <li>Rich, vibrant colors</li>
              </ul>
            </mat-card-content>
          </mat-card>

          <mat-card class="price-card">
            <mat-card-header>
              <mat-card-title>Large 8×10</mat-card-title>
              <mat-card-subtitle>Statement prints for display</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="price">$2.99<span class="price-unit">each</span></div>
              <ul class="features-list">
                <li>Museum-quality paper</li>
                <li>Perfect for wall display</li>
                <li>Professional finish</li>
              </ul>
            </mat-card-content>
          </mat-card>
        </div>

        <div class="pricing-action">
          <button mat-button routerLink="/public/pricing">
            View All Sizes & Pricing
            <mat-icon>arrow_forward</mat-icon>
          </button>
        </div>
      </section>

      <!-- Call to Action -->
      <section class="cta-section">
        <div class="cta-content">
          <h2>Ready to Print Your Photos?</h2>
          <p>Join thousands of satisfied customers who trust MyImage with their precious memories.</p>
          <div class="cta-actions">
            <button mat-raised-button color="primary" size="large" (click)="getStarted()">
              <mat-icon>add_photo_alternate</mat-icon>
              Start Printing Now
            </button>
            <button mat-button routerLink="/public/how-it-works">
              <mat-icon>help_outline</mat-icon>
              How It Works
            </button>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .home-container {
      min-height: 100vh;
    }

    /* Hero Section */
    .hero-section {
      display: flex;
      align-items: center;
      min-height: 600px;
      padding: 60px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      gap: 40px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .hero-content {
      flex: 1;
      max-width: 500px;
    }

    .hero-title {
      font-size: 3rem;
      font-weight: 600;
      line-height: 1.2;
      margin-bottom: 20px;
    }

    .hero-subtitle {
      font-size: 1.2rem;
      line-height: 1.6;
      margin-bottom: 30px;
      opacity: 0.9;
    }

    .hero-actions {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .cta-button {
      padding: 12px 24px;
      font-size: 1.1rem;
      font-weight: 500;
    }

    .secondary-button {
      color: white;
      border: 1px solid rgba(255,255,255,0.3);
    }

    .hero-image {
      flex: 1;
      display: flex;
      justify-content: center;
    }

    .hero-photo {
      max-width: 100%;
      height: 400px;
      object-fit: cover;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    }

    /* Sections */
    .features-section,
    .samples-preview,
    .pricing-preview {
      padding: 80px 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .cta-section {
      background: #f8f9fa;
      padding: 80px 20px;
      text-align: center;
    }

    .section-header {
      text-align: center;
      margin-bottom: 50px;
    }

    .section-header h2 {
      font-size: 2.5rem;
      margin-bottom: 16px;
      color: #333;
    }

    .section-header p {
      font-size: 1.1rem;
      color: #666;
      max-width: 600px;
      margin: 0 auto;
    }

    /* Features Grid */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 30px;
    }

    .feature-card {
      text-align: center;
      padding: 20px;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .feature-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }

    .feature-icon {
      font-size: 48px;
      color: #3f51b5;
      margin-bottom: 20px;
    }

    .feature-card h3 {
      font-size: 1.3rem;
      margin-bottom: 16px;
      color: #333;
    }

    .feature-card p {
      color: #666;
      line-height: 1.6;
    }

    /* Samples Grid */
    .samples-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 30px;
      margin-bottom: 40px;
    }

    .sample-item {
      text-align: center;
    }

    .sample-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
      border-radius: 8px;
      margin-bottom: 16px;
      transition: transform 0.3s ease;
    }

    .sample-item:hover .sample-image {
      transform: scale(1.05);
    }

    .sample-info h4 {
      font-size: 1.1rem;
      margin-bottom: 8px;
      color: #333;
    }

    .sample-info p {
      color: #666;
      font-size: 0.9rem;
    }

    .samples-action {
      text-align: center;
    }

    /* Pricing Grid */
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 30px;
      margin-bottom: 40px;
    }

    .price-card {
      text-align: center;
      position: relative;
      transition: transform 0.3s ease;
    }

    .price-card:hover {
      transform: translateY(-5px);
    }

    .price-card.popular {
      border: 2px solid #3f51b5;
      transform: scale(1.05);
    }

    .price-card.popular::before {
      content: 'Most Popular';
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: #3f51b5;
      color: white;
      padding: 4px 16px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .price {
      font-size: 2.5rem;
      font-weight: 600;
      color: #3f51b5;
      margin: 20px 0;
    }

    .price-unit {
      font-size: 1rem;
      font-weight: normal;
      color: #666;
    }

    .features-list {
      list-style: none;
      padding: 0;
      margin: 20px 0;
    }

    .features-list li {
      padding: 8px 0;
      color: #666;
      position: relative;
      padding-left: 24px;
    }

    .features-list li::before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #4caf50;
      font-weight: bold;
    }

    .pricing-action {
      text-align: center;
    }

    /* CTA Section */
    .cta-content h2 {
      font-size: 2.5rem;
      margin-bottom: 16px;
      color: #333;
    }

    .cta-content p {
      font-size: 1.1rem;
      color: #666;
      margin-bottom: 30px;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    .cta-actions {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .hero-section {
        flex-direction: column;
        text-align: center;
        padding: 40px 20px;
      }

      .hero-title {
        font-size: 2rem;
      }

      .hero-subtitle {
        font-size: 1rem;
      }

      .section-header h2 {
        font-size: 2rem;
      }

      .features-grid,
      .samples-grid,
      .pricing-grid {
        grid-template-columns: 1fr;
      }

      .hero-actions,
      .cta-actions {
        flex-direction: column;
        align-items: center;
      }

      .cta-button,
      .secondary-button {
        width: 100%;
        max-width: 300px;
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  // Sample images for preview (combination of static and dynamic)
  sampleImages = [
    {
      title: 'Family Memories',
      description: 'Beautiful family portraits printed on premium photo paper',
      url: 'https://picsum.photos/300/200?random=10'
    },
    {
      title: 'Travel Adventures',
      description: 'Capture your travel moments in stunning detail',
      url: 'https://picsum.photos/300/200?random=11'
    },
    {
      title: 'Special Occasions',
      description: 'Wedding and celebration photos with vibrant colors',
      url: 'https://picsum.photos/300/200?random=12'
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if user is already authenticated and redirect appropriately
    if (this.authService.isAuthenticated()) {
      console.log('Home: User already authenticated, could redirect to photos');
      // Optionally redirect authenticated users to their photos
      // this.router.navigate(['/photos']);
    }
  }

  /**
   * Handle the "Get Started" call-to-action.
   * Redirects to registration for new users or photos for authenticated users.
   */
  getStarted(): void {
    if (this.authService.isAuthenticated()) {
      // User is already logged in, take them to photo upload
      this.router.navigate(['/photos/upload']);
    } else {
      // New user, take them to registration
      this.router.navigate(['/auth/register']);
    }
  }
}
