
import { Component } from '@angular/core';
import { Router } from '@angular/router';

/**
 * How It Works component explaining the photo printing process to potential customers.
 * Uses a step-by-step approach with visual elements to guide users through the service.
 */
@Component({
  selector: 'app-how-it-works',
  standalone: false,
  template: `
    <div class="how-it-works-container">
      <!-- Header -->
      <section class="how-header">
        <h1>How It Works</h1>
        <p class="how-subtitle">
          Getting professional photo prints is simple with MyImage.
          Follow these easy steps to transform your digital memories into beautiful prints.
        </p>
      </section>

      <!-- Process Steps -->
      <section class="process-steps">
        <div class="step-container" *ngFor="let step of processSteps; let i = index; trackBy: trackByStep">
          <div class="step-card" [class.highlight]="i % 2 === 0">
            <div class="step-number">
              <span>{{ i + 1 }}</span>
            </div>

            <div class="step-content">
              <div class="step-icon">
                <mat-icon>{{ step.icon }}</mat-icon>
              </div>

              <div class="step-info">
                <h3>{{ step.title }}</h3>
                <p>{{ step.description }}</p>

                <div class="step-details" *ngIf="step.details">
                  <ul>
                    <li *ngFor="let detail of step.details">{{ detail }}</li>
                  </ul>
                </div>

                <div class="step-tips" *ngIf="step.tips">
                  <h4><mat-icon>lightbulb</mat-icon> Pro Tips:</h4>
                  <p>{{ step.tips }}</p>
                </div>
              </div>
            </div>

            <!-- Arrow connector (except for last step) -->
            <div class="step-arrow" *ngIf="i < processSteps.length - 1">
              <mat-icon>arrow_downward</mat-icon>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Overview -->
      <section class="features-overview">
        <h2>Why Choose Our Process?</h2>
        <div class="features-grid">
          <mat-card class="feature-card" *ngFor="let feature of processFeatures">
            <mat-card-content>
              <mat-icon class="feature-icon">{{ feature.icon }}</mat-icon>
              <h3>{{ feature.title }}</h3>
              <p>{{ feature.description }}</p>
            </mat-card-content>
          </mat-card>
        </div>
      </section>

      <!-- FAQ Section -->
      <section class="faq-section">
        <h2>Frequently Asked Questions</h2>
        <mat-expansion-panel class="faq-panel" *ngFor="let faq of frequentlyAsked">
          <mat-expansion-panel-header>
            <mat-panel-title>{{ faq.question }}</mat-panel-title>
          </mat-expansion-panel-header>
          <p>{{ faq.answer }}</p>
        </mat-expansion-panel>
      </section>

      <!-- Quality Assurance -->
      <section class="quality-assurance">
        <mat-card class="quality-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>verified</mat-icon>
              Quality Assurance Process
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="quality-steps">
              <div class="quality-step" *ngFor="let step of qualitySteps">
                <div class="quality-icon">
                  <mat-icon>{{ step.icon }}</mat-icon>
                </div>
                <div class="quality-content">
                  <h4>{{ step.title }}</h4>
                  <p>{{ step.description }}</p>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </section>

      <!-- Technical Requirements -->
      <section class="tech-requirements">
        <h2>Technical Requirements</h2>
        <div class="requirements-grid">
          <mat-card class="req-card">
            <mat-card-header>
              <mat-card-title>File Formats</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="format-list">
                <span class="format-item supported">
                  <mat-icon>check_circle</mat-icon>
                  JPEG (.jpg, .jpeg)
                </span>
                <span class="format-item not-supported">
                  <mat-icon>cancel</mat-icon>
                  PNG, GIF, TIFF
                </span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="req-card">
            <mat-card-header>
              <mat-card-title>File Size</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="size-requirements">
                <div class="size-item">
                  <mat-icon>description</mat-icon>
                  <span>Maximum: 50MB per file</span>
                </div>
                <div class="size-item">
                  <mat-icon>photo</mat-icon>
                  <span>Recommended: 2-10MB</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="req-card">
            <mat-card-header>
              <mat-card-title>Resolution Guide</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="resolution-guide">
                <div class="res-item">
                  <span class="size">4×6"</span>
                  <span class="pixels">1200×1800px min</span>
                </div>
                <div class="res-item">
                  <span class="size">5×7"</span>
                  <span class="pixels">1500×2100px min</span>
                </div>
                <div class="res-item">
                  <span class="size">8×10"</span>
                  <span class="pixels">2400×3000px min</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </section>

      <!-- Call to Action -->
      <section class="cta-section">
        <h2>Ready to Get Started?</h2>
        <p>Join thousands of satisfied customers and start printing your photos today.</p>
        <div class="cta-actions">
          <button mat-raised-button color="primary" size="large" (click)="getStarted()">
            <mat-icon>add_photo_alternate</mat-icon>
            Start Your First Order
          </button>
          <button mat-button routerLink="/public/samples">
            <mat-icon>collections</mat-icon>
            View Sample Gallery
          </button>
          <button mat-button routerLink="/public/pricing">
            <mat-icon>attach_money</mat-icon>
            See Pricing
          </button>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .how-it-works-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    /* Header */
    .how-header {
      text-align: center;
      padding: 60px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
      margin-bottom: 60px;
    }

    .how-header h1 {
      font-size: 3rem;
      margin-bottom: 20px;
      font-weight: 600;
    }

    .how-subtitle {
      font-size: 1.2rem;
      max-width: 700px;
      margin: 0 auto;
      opacity: 0.9;
      line-height: 1.6;
    }

    /* Process Steps */
    .process-steps {
      margin-bottom: 80px;
    }

    .step-container {
      margin-bottom: 40px;
    }

    .step-card {
      position: relative;
      display: flex;
      align-items: center;
      background: white;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      transition: transform 0.3s ease;
    }

    .step-card:hover {
      transform: translateY(-5px);
    }

    .step-card.highlight {
      background: linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%);
      border: 2px solid #3f51b5;
    }

    .step-number {
      background: #3f51b5;
      color: white;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 600;
      margin-right: 30px;
      flex-shrink: 0;
    }

    .step-content {
      display: flex;
      align-items: center;
      flex: 1;
      gap: 30px;
    }

    .step-icon {
      background: #e8f2ff;
      color: #3f51b5;
      width: 80px;
      height: 80px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .step-icon mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .step-info {
      flex: 1;
    }

    .step-info h3 {
      font-size: 1.5rem;
      margin-bottom: 12px;
      color: #333;
      font-weight: 600;
    }

    .step-info p {
      color: #666;
      font-size: 1.1rem;
      line-height: 1.6;
      margin-bottom: 16px;
    }

    .step-details ul {
      list-style: none;
      padding: 0;
      margin: 16px 0;
    }

    .step-details li {
      padding: 6px 0;
      color: #555;
      position: relative;
      padding-left: 20px;
    }

    .step-details li::before {
      content: '•';
      position: absolute;
      left: 0;
      color: #3f51b5;
      font-weight: bold;
    }

    .step-tips {
      background: #fff3e0;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #ff9800;
      margin-top: 16px;
    }

    .step-tips h4 {
      margin: 0 0 8px 0;
      color: #e65100;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .step-tips h4 mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .step-tips p {
      margin: 0;
      color: #bf360c;
      font-size: 0.9rem;
    }

    .step-arrow {
      position: absolute;
      bottom: -30px;
      left: 50%;
      transform: translateX(-50%);
      background: #3f51b5;
      color: white;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1;
    }

    /* Features Overview */
    .features-overview {
      margin-bottom: 80px;
    }

    .features-overview h2 {
      text-align: center;
      font-size: 2.5rem;
      margin-bottom: 40px;
      color: #333;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 30px;
    }

    .feature-card {
      text-align: center;
      padding: 20px;
      transition: transform 0.3s ease;
    }

    .feature-card:hover {
      transform: translateY(-5px);
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

    /* FAQ Section */
    .faq-section {
      margin-bottom: 80px;
    }

    .faq-section h2 {
      text-align: center;
      font-size: 2.5rem;
      margin-bottom: 40px;
      color: #333;
    }

    .faq-panel {
      margin-bottom: 8px;
    }

    /* Quality Assurance */
    .quality-assurance {
      margin-bottom: 80px;
    }

    .quality-card {
      background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
      color: white;
    }

    .quality-steps {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 30px;
      margin-top: 20px;
    }

    .quality-step {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .quality-icon {
      background: rgba(255,255,255,0.2);
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .quality-icon mat-icon {
      font-size: 24px;
    }

    .quality-content h4 {
      margin: 0 0 8px 0;
      font-weight: 600;
    }

    .quality-content p {
      margin: 0;
      opacity: 0.9;
      font-size: 0.9rem;
      line-height: 1.5;
    }

    /* Technical Requirements */
    .tech-requirements {
      margin-bottom: 80px;
    }

    .tech-requirements h2 {
      text-align: center;
      font-size: 2.5rem;
      margin-bottom: 40px;
      color: #333;
    }

    .requirements-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 30px;
    }

    .req-card {
      padding: 20px;
    }

    .format-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .format-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px;
      border-radius: 8px;
    }

    .format-item.supported {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .format-item.not-supported {
      background: #ffebee;
      color: #c62828;
    }

    .size-requirements,
    .resolution-guide {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .size-item,
    .res-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .res-item {
      justify-content: space-between;
    }

    .res-item .size {
      font-weight: 600;
      color: #3f51b5;
    }

    .res-item .pixels {
      color: #666;
      font-size: 0.9rem;
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
      .how-header h1 {
        font-size: 2rem;
      }

      .how-subtitle {
        font-size: 1rem;
      }

      .step-card {
        flex-direction: column;
        text-align: center;
        padding: 30px 20px;
      }

      .step-content {
        flex-direction: column;
        gap: 20px;
      }

      .step-number {
        margin-right: 0;
        margin-bottom: 20px;
      }

      .quality-steps {
        grid-template-columns: 1fr;
      }

      .requirements-grid {
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
export class HowItWorksComponent {
  // Process steps with detailed information
  processSteps = [
    {
      icon: 'person_add',
      title: 'Create Your Account',
      description: 'Sign up for free and get your unique user ID. No subscription fees or hidden costs.',
      details: [
        'Instant account creation',
        'Secure password protection',
        'Unique user ID for easy login',
        'Order history tracking'
      ],
      tips: 'Keep your user ID handy - you can use either your email or user ID to log in!'
    },
    {
      icon: 'folder_open',
      title: 'Select Your Photos',
      description: 'Browse your computer folders and select the JPEG photos you want to print.',
      details: [
        'Browse any folder on your computer',
        'Select multiple photos at once',
        'Preview before uploading',
        'Only JPEG files supported'
      ],
      tips: 'Higher resolution photos (2400×3000px+) produce the best print quality, especially for larger sizes.'
    },
    {
      icon: 'cloud_upload',
      title: 'Upload & Organize',
      description: 'Securely upload your selected photos to our platform with progress tracking.',
      details: [
        'Secure encrypted upload',
        'Progress tracking',
        'Automatic thumbnail generation',
        'Files up to 50MB supported'
      ],
      tips: 'Upload during off-peak hours for faster speeds, and ensure you have a stable internet connection.'
    },
    {
      icon: 'photo_size_select_large',
      title: 'Choose Print Sizes',
      description: 'Select from multiple print sizes and specify quantities for each photo.',
      details: [
        'Multiple sizes per photo',
        'Real-time quality preview',
        'Quantity selection',
        'Price calculation'
      ],
      tips: 'Check the quality indicator for each size - higher resolution photos work better for larger prints.'
    },
    {
      icon: 'shopping_cart',
      title: 'Review Your Order',
      description: 'Review your selections, see total cost, and make any final adjustments.',
      details: [
        'Order summary with thumbnails',
        'Cost breakdown',
        'Edit quantities easily',
        'Tax calculation'
      ]
    },
    {
      icon: 'payment',
      title: 'Secure Payment',
      description: 'Choose your payment method: credit card online or pay at our branch location.',
      details: [
        'Secure online payment',
        'Branch payment option',
        'Multiple payment methods',
        'Order confirmation'
      ],
      tips: 'Credit card payments are processed immediately, while branch payments require pickup at our location.'
    },
    {
      icon: 'print',
      title: 'Professional Printing',
      description: 'Our team prints your photos on premium paper with professional equipment.',
      details: [
        'Professional-grade printers',
        'Premium photo paper',
        'Color calibration',
        'Quality inspection'
      ]
    },
    {
      icon: 'local_shipping',
      title: 'Fast Delivery',
      description: 'Your prints are carefully packaged and shipped directly to your address.',
      details: [
        'Secure packaging',
        'Fast shipping (24-48 hours)',
        'Tracking information',
        'Safe delivery'
      ],
      tips: 'Orders placed before 2 PM typically ship the same day!'
    }
  ];

  // Process features highlighting benefits
  processFeatures = [
    {
      icon: 'security',
      title: 'Secure & Private',
      description: 'Your photos are securely stored and automatically deleted after printing to protect your privacy.'
    },
    {
      icon: 'speed',
      title: 'Fast Turnaround',
      description: 'Most orders are printed and shipped within 24-48 hours of payment confirmation.'
    },
    {
      icon: 'verified',
      title: 'Quality Guaranteed',
      description: 'Every print is inspected for quality. Not satisfied? We\'ll reprint at no charge.'
    },
    {
      icon: 'support',
      title: '24/7 Support',
      description: 'Our customer service team is available to help with any questions or concerns.'
    }
  ];

  // Quality assurance steps
  qualitySteps = [
    {
      icon: 'search',
      title: 'Image Analysis',
      description: 'Each image is automatically analyzed for optimal print quality'
    },
    {
      icon: 'tune',
      title: 'Color Calibration',
      description: 'Professional color correction ensures accurate reproduction'
    },
    {
      icon: 'print',
      title: 'Test Print',
      description: 'Sample prints verify color accuracy and quality standards'
    },
    {
      icon: 'visibility',
      title: 'Final Inspection',
      description: 'Every print is manually inspected before packaging'
    }
  ];

  // Frequently asked questions
  frequentlyAsked = [
    {
      question: 'What file formats do you accept?',
      answer: 'We currently accept JPEG files (.jpg and .jpeg). This format provides the best balance of quality and compatibility with our printing process.'
    },
    {
      question: 'How long does printing and shipping take?',
      answer: 'Most orders are printed within 24 hours and shipped within 48 hours. Express shipping options are available for faster delivery.'
    },
    {
      question: 'What happens to my photos after printing?',
      answer: 'For your privacy and security, all photos are automatically deleted from our servers after your order is completed and shipped.'
    },
    {
      question: 'Can I reorder the same photos later?',
      answer: 'Since photos are deleted after shipping, you would need to upload them again for reorders. We recommend keeping backup copies of your digital photos.'
    },
    {
      question: 'What if I\'m not satisfied with my prints?',
      answer: 'We guarantee the quality of our prints. If you\'re not satisfied, contact us within 30 days and we\'ll reprint your order at no charge.'
    },
    {
      question: 'Do you offer bulk discounts?',
      answer: 'Yes! We offer volume discounts starting at 50 prints. Contact us for custom pricing on large orders.'
    }
  ];

  constructor(private router: Router) {}

  /**
   * Track function for ngFor performance optimization.
   */
  trackByStep(index: number, step: any): number {
    return index;
  }

  /**
   * Navigate to registration to start the process.
   */
  getStarted(): void {
    this.router.navigate(['/auth/register']);
  }
}
