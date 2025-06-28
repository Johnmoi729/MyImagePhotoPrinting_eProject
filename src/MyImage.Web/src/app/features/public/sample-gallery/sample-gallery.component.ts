
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Sample gallery component showcasing the quality and variety of prints available.
 * Uses high-quality placeholder images to demonstrate the service without requiring authentication.
 * Organized by categories to help users understand different use cases.
 */
@Component({
  selector: 'app-sample-gallery',
  standalone: false,
  template: `
    <div class="gallery-container">
      <!-- Header -->
      <section class="gallery-header">
        <h1>Sample Gallery</h1>
        <p class="gallery-subtitle">
          See the exceptional quality of our photo prints. All samples shown represent
          the professional results you can expect from our printing service.
        </p>
      </section>

      <!-- Category Tabs -->
      <mat-tab-group class="category-tabs" mat-stretch-tabs="false" mat-align-tabs="center">
        <mat-tab label="All Samples">
          <div class="tab-content">
            <div class="samples-grid">
              <div class="sample-card"
                   *ngFor="let sample of allSamples; let i = index; trackBy: trackBySample"
                   (click)="openSampleModal(sample)">
                <div class="sample-image-container">
                  <img [src]="sample.imageUrl"
                       [alt]="sample.title"
                       class="sample-image"
                       loading="lazy">
                  <div class="sample-overlay">
                    <mat-icon class="zoom-icon">zoom_in</mat-icon>
                    <span class="view-text">View Details</span>
                  </div>
                </div>
                <div class="sample-info">
                  <h3>{{ sample.title }}</h3>
                  <p class="sample-description">{{ sample.description }}</p>
                  <div class="sample-specs">
                    <span class="spec-item">
                      <mat-icon>photo_size_select_large</mat-icon>
                      {{ sample.printSize }}
                    </span>
                    <span class="spec-item">
                      <mat-icon>star</mat-icon>
                      {{ sample.quality }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="Family Photos">
          <div class="tab-content">
            <p class="category-description">
              Beautiful family portraits and candid moments, perfect for albums and framing.
            </p>
            <div class="samples-grid">
              <div class="sample-card"
                   *ngFor="let sample of familySamples; trackBy: trackBySample"
                   (click)="openSampleModal(sample)">
                <div class="sample-image-container">
                  <img [src]="sample.imageUrl"
                       [alt]="sample.title"
                       class="sample-image"
                       loading="lazy">
                  <div class="sample-overlay">
                    <mat-icon class="zoom-icon">zoom_in</mat-icon>
                    <span class="view-text">View Details</span>
                  </div>
                </div>
                <div class="sample-info">
                  <h3>{{ sample.title }}</h3>
                  <p class="sample-description">{{ sample.description }}</p>
                  <div class="sample-specs">
                    <span class="spec-item">{{ sample.printSize }}</span>
                    <span class="spec-item">{{ sample.quality }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="Landscapes">
          <div class="tab-content">
            <p class="category-description">
              Stunning landscape and nature photography showcasing color vibrancy and detail.
            </p>
            <div class="samples-grid">
              <div class="sample-card"
                   *ngFor="let sample of landscapeSamples; trackBy: trackBySample"
                   (click)="openSampleModal(sample)">
                <div class="sample-image-container">
                  <img [src]="sample.imageUrl"
                       [alt]="sample.title"
                       class="sample-image"
                       loading="lazy">
                  <div class="sample-overlay">
                    <mat-icon class="zoom-icon">zoom_in</mat-icon>
                    <span class="view-text">View Details</span>
                  </div>
                </div>
                <div class="sample-info">
                  <h3>{{ sample.title }}</h3>
                  <p class="sample-description">{{ sample.description }}</p>
                  <div class="sample-specs">
                    <span class="spec-item">{{ sample.printSize }}</span>
                    <span class="spec-item">{{ sample.quality }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="Special Events">
          <div class="tab-content">
            <p class="category-description">
              Wedding, graduation, and celebration photos with vibrant colors and sharp details.
            </p>
            <div class="samples-grid">
              <div class="sample-card"
                   *ngFor="let sample of eventSamples; trackBy: trackBySample"
                   (click)="openSampleModal(sample)">
                <div class="sample-image-container">
                  <img [src]="sample.imageUrl"
                       [alt]="sample.title"
                       class="sample-image"
                       loading="lazy">
                  <div class="sample-overlay">
                    <mat-icon class="zoom-icon">zoom_in</mat-icon>
                    <span class="view-text">View Details</span>
                  </div>
                </div>
                <div class="sample-info">
                  <h3>{{ sample.title }}</h3>
                  <p class="sample-description">{{ sample.description }}</p>
                  <div class="sample-specs">
                    <span class="spec-item">{{ sample.printSize }}</span>
                    <span class="spec-item">{{ sample.quality }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>

      <!-- Quality Information -->
      <section class="quality-section">
        <mat-card class="quality-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>verified</mat-icon>
              Professional Quality Guaranteed
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="quality-grid">
              <div class="quality-item">
                <mat-icon>palette</mat-icon>
                <h4>Premium Photo Paper</h4>
                <p>Professional-grade paper with excellent color reproduction and durability.</p>
              </div>
              <div class="quality-item">
                <mat-icon>high_quality</mat-icon>
                <h4>Advanced Printing Technology</h4>
                <p>State-of-the-art printers ensure sharp details and vibrant colors.</p>
              </div>
              <div class="quality-item">
                <mat-icon>schedule</mat-icon>
                <h4>Expert Quality Control</h4>
                <p>Every print is inspected to ensure it meets our high standards.</p>
              </div>
              <div class="quality-item">
                <mat-icon>security</mat-icon>
                <h4>Archival Quality</h4>
                <p>Prints are designed to last for decades without fading.</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </section>

      <!-- Size Comparison -->
      <section class="size-comparison">
        <h2>Print Size Reference</h2>
        <p>Compare our available print sizes to find the perfect fit for your needs.</p>

        <div class="size-visual-grid">
          <div class="size-visual-item" *ngFor="let size of popularSizes">
            <div class="size-box"
                 [style.width.px]="size.visualWidth"
                 [style.height.px]="size.visualHeight">
              <span class="size-label">{{ size.name }}</span>
            </div>
            <div class="size-details">
              <h4>{{ size.name }}</h4>
              <p>{{ size.description }}</p>
              <span class="price">{{ size.price }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Call to Action -->
      <section class="cta-section">
        <h2>Ready to Print Your Photos?</h2>
        <p>Experience the same professional quality with your own photos.</p>
        <div class="cta-actions">
          <button mat-raised-button color="primary" size="large" (click)="startPrinting()">
            <mat-icon>add_photo_alternate</mat-icon>
            Start Printing Your Photos
          </button>
          <button mat-button routerLink="/public/pricing">
            <mat-icon>attach_money</mat-icon>
            View Pricing
          </button>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .gallery-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    /* Header */
    .gallery-header {
      text-align: center;
      padding: 60px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
      margin-bottom: 40px;
    }

    .gallery-header h1 {
      font-size: 3rem;
      margin-bottom: 20px;
      font-weight: 600;
    }

    .gallery-subtitle {
      font-size: 1.2rem;
      max-width: 700px;
      margin: 0 auto;
      opacity: 0.9;
      line-height: 1.6;
    }

    /* Tabs */
    .category-tabs {
      margin-bottom: 40px;
    }

    .tab-content {
      padding: 30px 0;
    }

    .category-description {
      text-align: center;
      color: #666;
      font-size: 1.1rem;
      margin-bottom: 30px;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    /* Samples Grid */
    .samples-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 30px;
      margin-bottom: 40px;
    }

    .sample-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      cursor: pointer;
    }

    .sample-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }

    .sample-image-container {
      position: relative;
      width: 100%;
      height: 200px;
      overflow: hidden;
    }

    .sample-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .sample-card:hover .sample-image {
      transform: scale(1.05);
    }

    .sample-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.6);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .sample-card:hover .sample-overlay {
      opacity: 1;
    }

    .zoom-icon {
      font-size: 32px;
      margin-bottom: 8px;
    }

    .view-text {
      font-weight: 500;
    }

    .sample-info {
      padding: 20px;
    }

    .sample-info h3 {
      margin: 0 0 8px 0;
      color: #333;
      font-size: 1.2rem;
    }

    .sample-description {
      color: #666;
      margin-bottom: 16px;
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .sample-specs {
      display: flex;
      gap: 16px;
      font-size: 0.8rem;
      color: #888;
    }

    .spec-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .spec-item mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    /* Quality Section */
    .quality-section {
      margin: 60px 0;
    }

    .quality-card {
      background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
      color: white;
    }

    .quality-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 30px;
      margin-top: 20px;
    }

    .quality-item {
      text-align: center;
    }

    .quality-item mat-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.9;
    }

    .quality-item h4 {
      margin: 0 0 12px 0;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .quality-item p {
      font-size: 0.9rem;
      line-height: 1.5;
      opacity: 0.9;
    }

    /* Size Comparison */
    .size-comparison {
      text-align: center;
      margin: 60px 0;
    }

    .size-comparison h2 {
      font-size: 2.2rem;
      margin-bottom: 16px;
      color: #333;
    }

    .size-comparison p {
      font-size: 1.1rem;
      color: #666;
      margin-bottom: 40px;
    }

    .size-visual-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 30px;
      max-width: 800px;
      margin: 0 auto;
    }

    .size-visual-item {
      text-align: center;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 12px;
    }

    .size-box {
      border: 2px solid #3f51b5;
      background: rgba(63, 81, 181, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      margin: 0 auto 16px auto;
      min-width: 40px;
      min-height: 30px;
    }

    .size-label {
      font-size: 0.8rem;
      font-weight: 500;
      color: #3f51b5;
    }

    .size-details h4 {
      margin: 0 0 8px 0;
      color: #333;
    }

    .size-details p {
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 8px;
    }

    .price {
      font-weight: 600;
      color: #3f51b5;
      font-size: 1.1rem;
    }

    /* CTA Section */
    .cta-section {
      text-align: center;
      padding: 60px 20px;
      background: #f8f9fa;
      border-radius: 12px;
      margin-top: 60px;
    }

    .cta-section h2 {
      font-size: 2.5rem;
      margin-bottom: 16px;
      color: #333;
    }

    .cta-section p {
      font-size: 1.2rem;
      color: #666;
      margin-bottom: 30px;
    }

    .cta-actions {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .gallery-header h1 {
        font-size: 2rem;
      }

      .gallery-subtitle {
        font-size: 1rem;
      }

      .samples-grid {
        grid-template-columns: 1fr;
      }

      .quality-grid {
        grid-template-columns: 1fr;
      }

      .size-visual-grid {
        grid-template-columns: repeat(2, 1fr);
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

    @media (max-width: 480px) {
      .size-visual-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SampleGalleryComponent implements OnInit {
  // Sample data with high-quality placeholder images
  familySamples = [
    {
      id: 'family1',
      title: 'Family Portrait',
      description: 'Beautiful family moment captured with rich colors and sharp details',
      imageUrl: 'https://picsum.photos/400/300?random=20',
      printSize: '8×10"',
      quality: 'Premium'
    },
    {
      id: 'family2',
      title: 'Children Playing',
      description: 'Candid moments with excellent motion capture and vibrant colors',
      imageUrl: 'https://picsum.photos/400/300?random=21',
      printSize: '5×7"',
      quality: 'Professional'
    },
    {
      id: 'family3',
      title: 'Grandparents',
      description: 'Timeless portrait with exceptional detail and warmth',
      imageUrl: 'https://picsum.photos/400/300?random=22',
      printSize: '4×6"',
      quality: 'Standard'
    }
  ];

  landscapeSamples = [
    {
      id: 'landscape1',
      title: 'Mountain Sunrise',
      description: 'Stunning landscape with incredible color range and detail',
      imageUrl: 'https://picsum.photos/400/300?random=30',
      printSize: '11×14"',
      quality: 'Museum Quality'
    },
    {
      id: 'landscape2',
      title: 'Ocean Waves',
      description: 'Dynamic seascape with perfect blues and foam detail',
      imageUrl: 'https://picsum.photos/400/300?random=31',
      printSize: '8×10"',
      quality: 'Premium'
    },
    {
      id: 'landscape3',
      title: 'Forest Path',
      description: 'Rich greens and natural lighting beautifully reproduced',
      imageUrl: 'https://picsum.photos/400/300?random=32',
      printSize: '5×7"',
      quality: 'Professional'
    }
  ];

  eventSamples = [
    {
      id: 'event1',
      title: 'Wedding Ceremony',
      description: 'Precious moments with perfect skin tones and dress detail',
      imageUrl: 'https://picsum.photos/400/300?random=40',
      printSize: '8×10"',
      quality: 'Premium'
    },
    {
      id: 'event2',
      title: 'Graduation Day',
      description: 'Celebration captured with vivid colors and sharp focus',
      imageUrl: 'https://picsum.photos/400/300?random=41',
      printSize: '5×7"',
      quality: 'Professional'
    },
    {
      id: 'event3',
      title: 'Birthday Party',
      description: 'Joyful moments with excellent color reproduction',
      imageUrl: 'https://picsum.photos/400/300?random=42',
      printSize: '4×6"',
      quality: 'Standard'
    }
  ];

  // Combined samples for "All" tab
  allSamples = [
    ...this.familySamples,
    ...this.landscapeSamples,
    ...this.eventSamples
  ];

  // Popular sizes for comparison
  popularSizes = [
    {
      name: '4×6"',
      description: 'Perfect for albums',
      price: '0.29',
      visualWidth: 60,
      visualHeight: 45
    },
    {
      name: '5×7"',
      description: 'Great for frames',
      price: '0.49',
      visualWidth: 75,
      visualHeight: 60
    },
    {
      name: '8×10"',
      description: 'Wall display',
      price: '2.99',
      visualWidth: 96,
      visualHeight: 75
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    console.log('SampleGallery - Component initialized');
  }

  /**
   * Track function for ngFor performance optimization.
   */
  trackBySample(index: number, sample: any): string {
    return sample.id;
  }

  /**
   * Open sample in a modal or detailed view.
   * For now, we'll just log the action.
   */
  openSampleModal(sample: any): void {
    console.log('SampleGallery - Opening sample:', sample.title);
    // TODO: Implement modal dialog to show larger image and details
    // This could open a dialog similar to PhotoPreviewComponent
  }

  /**
   * Navigate to start the printing process.
   */
  startPrinting(): void {
    this.router.navigate(['/auth/register']);
  }
}
