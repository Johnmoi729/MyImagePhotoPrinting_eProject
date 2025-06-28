
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PrintSizeService } from '../../../core/services/print-size.service';
import { PrintSize } from '../../../shared/models/print-size.models';

/**
 * Public pricing component that displays all available print sizes and pricing
 * without requiring authentication. Includes quality information and recommendations.
 */
@Component({
  selector: 'app-pricing',
  standalone: false,
  template: `
    <div class="pricing-container">
      <!-- Header Section -->
      <section class="pricing-header">
        <h1>Simple, Transparent Pricing</h1>
        <p class="pricing-subtitle">
          Professional quality prints at competitive prices. No hidden fees, no subscription required.
          Pay only for what you print.
        </p>
      </section>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-section">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Loading pricing information...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error && !loading" class="error-section">
        <mat-icon color="warn">error</mat-icon>
        <h3>Unable to Load Pricing</h3>
        <p>Please try again later or contact us for current pricing information.</p>
        <button mat-button color="primary" (click)="loadPricing()">
          <mat-icon>refresh</mat-icon>
          Try Again
        </button>
      </div>

      <!-- Pricing Grid -->
      <section class="pricing-grid" *ngIf="!loading && !error">
        <mat-card
          class="price-card"
          *ngFor="let printSize of printSizes; trackBy: trackBySize"
          [class.popular]="printSize.sizeCode === '4x6'">

          <!-- Popular Badge -->
          <div class="popular-badge" *ngIf="printSize.sizeCode === '4x6'">
            <mat-icon>star</mat-icon>
            Most Popular
          </div>

          <mat-card-header>
            <mat-card-title>{{ printSize.displayName }}</mat-card-title>
            <mat-card-subtitle>{{ printSize.width }}" × {{ printSize.height }}" print</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <!-- Price Display -->
            <div class="price-display">
              <span class="price">{{ printSize.price.toFixed(2) }}</span>
              <span class="price-unit">each</span>
            </div>

            <!-- Size Visualization -->
            <div class="size-visual">
              <div class="size-box"
                   [style.width.px]="getSizeVisualizationWidth(printSize)"
                   [style.height.px]="getSizeVisualizationHeight(printSize)">
                <span class="size-label">{{ printSize.width }}"×{{ printSize.height }}"</span>
              </div>
            </div>

            <!-- Features List -->
            <ul class="features-list">
              <li>Professional photo paper</li>
              <li>Glossy or matte finish available</li>
              <li>Vibrant, long-lasting colors</li>
              <li *ngIf="printSize.width >= 8">Museum-quality paper</li>
              <li *ngIf="printSize.sizeCode === '4x6'">Perfect for photo albums</li>
              <li *ngIf="printSize.width >= 5 && printSize.width < 8">Great for framing</li>
              <li *ngIf="printSize.width >= 8">Professional display quality</li>
            </ul>

            <!-- Quality Requirements -->
            <div class="quality-info">
              <h4>Image Quality Requirements:</h4>
              <div class="quality-row">
                <span class="label">Minimum:</span>
                <span class="value">{{ printSize.minWidth }}×{{ printSize.minHeight }}px</span>
              </div>
              <div class="quality-row">
                <span class="label">Recommended:</span>
                <span class="value">{{ printSize.recommendedWidth }}×{{ printSize.recommendedHeight }}px</span>
              </div>
              <p class="quality-note">
                Higher resolution images produce better print quality.
              </p>
            </div>

            <!-- Use Cases -->
            <div class="use-cases">
              <h4>Perfect For:</h4>
              <div class="use-case-tags">
                <span class="tag" *ngFor="let useCase of getUseCases(printSize)">
                  {{ useCase }}
                </span>
              </div>
            </div>
          </mat-card-content>

          <mat-card-actions>
            <button mat-raised-button
                    color="primary"
                    class="order-button"
                    (click)="startOrder()">
              <mat-icon>shopping_cart</mat-icon>
              Order This Size
            </button>
          </mat-card-actions>
        </mat-card>
      </section>

      <!-- Volume Pricing Information -->
      <section class="volume-pricing" *ngIf="!loading && !error">
        <mat-card class="volume-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>trending_down</mat-icon>
              Volume Discounts Available
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>Save more when you print more! Contact us for custom pricing on large orders.</p>
            <div class="volume-tiers">
              <div class="tier">
                <span class="quantity">50+ prints</span>
                <span class="discount">5% off</span>
              </div>
              <div class="tier">
                <span class="quantity">100+ prints</span>
                <span class="discount">10% off</span>
              </div>
              <div class="tier">
                <span class="quantity">500+ prints</span>
                <span class="discount">15% off</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </section>

      <!-- Additional Information -->
      <section class="additional-info">
        <div class="info-grid">
          <mat-card class="info-card">
            <mat-card-content>
              <mat-icon class="info-icon">local_shipping</mat-icon>
              <h3>Free Shipping</h3>
              <p>Free standard shipping on orders over $25. Express shipping available.</p>
            </mat-card-content>
          </mat-card>

          <mat-card class="info-card">
            <mat-card-content>
              <mat-icon class="info-icon">schedule</mat-icon>
              <h3>Fast Turnaround</h3>
              <p>Most orders printed and shipped within 24-48 hours.</p>
            </mat-card-content>
          </mat-card>

          <mat-card class="info-card">
            <mat-card-content>
              <mat-icon class="info-icon">verified</mat-icon>
              <h3>Quality Guarantee</h3>
              <p>Not satisfied? We'll reprint your order at no charge.</p>
            </mat-card-content>
          </mat-card>
        </div>
      </section>

      <!-- Call to Action -->
      <section class="cta-section">
        <h2>Ready to Print Your Photos?</h2>
        <p>Get started with our simple upload process and see your memories come to life.</p>
        <div class="cta-actions">
          <button mat-raised-button color="primary" size="large" (click)="startOrder()">
            <mat-icon>add_photo_alternate</mat-icon>
            Start Your Order
          </button>
          <button mat-button routerLink="/public/samples">
            <mat-icon>collections</mat-icon>
            View Sample Gallery
          </button>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .pricing-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    /* Header */
    .pricing-header {
      text-align: center;
      padding: 60px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
      margin-bottom: 40px;
    }

    .pricing-header h1 {
      font-size: 3rem;
      margin-bottom: 20px;
      font-weight: 600;
    }

    .pricing-subtitle {
      font-size: 1.2rem;
      max-width: 600px;
      margin: 0 auto;
      opacity: 0.9;
      line-height: 1.6;
    }

    /* Loading and Error States */
    .loading-section,
    .error-section {
      text-align: center;
      padding: 60px 20px;
    }

    .error-section mat-icon {
      font-size: 48px;
      margin-bottom: 20px;
    }

    /* Pricing Grid */
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 30px;
      margin-bottom: 60px;
    }

    .price-card {
      position: relative;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .price-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 40px rgba(0,0,0,0.1);
    }

    .price-card.popular {
      border: 2px solid #3f51b5;
      transform: scale(1.02);
    }

    .popular-badge {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: #3f51b5;
      color: white;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 4px;
      z-index: 1;
    }

    .popular-badge mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    /* Price Display */
    .price-display {
      text-align: center;
      margin: 20px 0;
    }

    .price {
      font-size: 3rem;
      font-weight: 700;
      color: #3f51b5;
    }

    .price-unit {
      font-size: 1.1rem;
      color: #666;
      margin-left: 8px;
    }

    /* Size Visualization */
    .size-visual {
      display: flex;
      justify-content: center;
      margin: 30px 0;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .size-box {
      border: 2px solid #3f51b5;
      background: rgba(63, 81, 181, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      min-width: 40px;
      min-height: 30px;
    }

    .size-label {
      font-size: 0.8rem;
      font-weight: 500;
      color: #3f51b5;
    }

    /* Features List */
    .features-list {
      list-style: none;
      padding: 0;
      margin: 20px 0;
    }

    .features-list li {
      padding: 8px 0;
      position: relative;
      padding-left: 24px;
      color: #555;
    }

    .features-list li::before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #4caf50;
      font-weight: bold;
    }

    /* Quality Info */
    .quality-info {
      background: #f0f7ff;
      padding: 16px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #3f51b5;
    }

    .quality-info h4 {
      margin: 0 0 12px 0;
      color: #3f51b5;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .quality-row {
      display: flex;
      justify-content: space-between;
      margin: 8px 0;
      font-size: 0.9rem;
    }

    .quality-row .label {
      color: #666;
    }

    .quality-row .value {
      font-weight: 500;
      color: #333;
    }

    .quality-note {
      font-size: 0.8rem;
      color: #666;
      margin: 12px 0 0 0;
      font-style: italic;
    }

    /* Use Cases */
    .use-cases {
      margin: 20px 0;
    }

    .use-cases h4 {
      margin: 0 0 12px 0;
      color: #333;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .use-case-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .tag {
      background: #e3f2fd;
      color: #1976d2;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    /* Order Button */
    .order-button {
      width: 100%;
      padding: 12px;
      font-weight: 500;
    }

    /* Volume Pricing */
    .volume-pricing {
      margin-bottom: 60px;
    }

    .volume-card {
      background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
      color: white;
    }

    .volume-tiers {
      display: flex;
      justify-content: space-around;
      flex-wrap: wrap;
      gap: 20px;
      margin-top: 20px;
    }

    .tier {
      text-align: center;
      padding: 16px;
      background: rgba(255,255,255,0.1);
      border-radius: 8px;
      flex: 1;
      min-width: 150px;
    }

    .tier .quantity {
      display: block;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .tier .discount {
      font-size: 1.2rem;
      font-weight: 700;
      color: #81c784;
    }

    /* Additional Info */
    .additional-info {
      margin-bottom: 60px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 30px;
    }

    .info-card {
      text-align: center;
      padding: 20px;
    }

    .info-icon {
      font-size: 48px;
      color: #3f51b5;
      margin-bottom: 16px;
    }

    .info-card h3 {
      margin: 0 0 12px 0;
      color: #333;
    }

    .info-card p {
      color: #666;
      line-height: 1.6;
    }

    /* CTA Section */
    .cta-section {
      text-align: center;
      padding: 60px 20px;
      background: #f8f9fa;
      border-radius: 12px;
    }

    .cta-section h2 {
      font-size: 2.5rem;
      margin-bottom: 16px;
      color: #333;
    }

    .cta-section p {
      font-size: 1.1rem;
      color: #666;
      margin-bottom: 30px;
      max-width: 500px;
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
      .pricing-header h1 {
        font-size: 2rem;
      }

      .pricing-subtitle {
        font-size: 1rem;
      }

      .pricing-grid {
        grid-template-columns: 1fr;
      }

      .price {
        font-size: 2.5rem;
      }

      .volume-tiers {
        flex-direction: column;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .cta-actions {
        flex-direction: column;
        align-items: center;
      }

      .cta-actions button {
        width: 100%;
        max-width: 300px;
      }
    }
  `]
})
export class PricingComponent implements OnInit {
  printSizes: PrintSize[] = [];
  loading = true;
  error = false;

  constructor(
    private printSizeService: PrintSizeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPricing();
  }

  /**
   * Load print sizes and pricing from the API.
   * This endpoint should be public and not require authentication.
   */
  loadPricing(): void {
    this.loading = true;
    this.error = false;

    this.printSizeService.getPrintSizes().subscribe({
      next: (response) => {
        this.loading = false;
        console.log('Pricing - Print sizes response:', response);

        if (response.success && response.data) {
          // Filter to only show active print sizes and sort by size
          this.printSizes = response.data
            .filter(size => size.isActive)
            .sort((a, b) => {
              // Sort by area (width * height)
              const areaA = a.width * a.height;
              const areaB = b.width * b.height;
              return areaA - areaB;
            });
        } else {
          this.error = true;
          console.error('Pricing - API returned success=false:', response);
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = true;
        console.error('Pricing - Error loading print sizes:', err);
      }
    });
  }

  /**
   * Handle starting an order - redirect to registration if not authenticated.
   */
  startOrder(): void {
    // Always redirect to registration for public users
    this.router.navigate(['/auth/register']);
  }

  /**
   * Track function for ngFor performance optimization.
   */
  trackBySize(index: number, printSize: PrintSize): string {
    return printSize.sizeCode;
  }

  /**
   * Get visualization width for size comparison (scaled for display).
   */
  getSizeVisualizationWidth(printSize: PrintSize): number {
    const baseScale = 15; // Base scale factor
    return Math.max(printSize.width * baseScale, 40); // Minimum 40px width
  }

  /**
   * Get visualization height for size comparison (scaled for display).
   */
  getSizeVisualizationHeight(printSize: PrintSize): number {
    const baseScale = 15; // Base scale factor
    return Math.max(printSize.height * baseScale, 30); // Minimum 30px height
  }

  /**
   * Get appropriate use cases for each print size.
   */
  getUseCases(printSize: PrintSize): string[] {
    const area = printSize.width * printSize.height;

    if (area <= 24) { // 4x6 and smaller
      return ['Photo Albums', 'Wallets', 'Scrapbooking', 'Gifts'];
    } else if (area <= 35) { // 5x7 range
      return ['Frames', 'Desk Display', 'Gifts', 'Portfolios'];
    } else if (area <= 80) { // 8x10 range
      return ['Wall Art', 'Professional Display', 'Matting & Framing'];
    } else { // Larger sizes
      return ['Large Wall Art', 'Professional Prints', 'Gallery Display'];
    }
  }
}
