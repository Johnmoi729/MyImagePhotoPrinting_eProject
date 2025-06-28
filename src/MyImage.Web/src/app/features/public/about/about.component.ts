
import { Component } from '@angular/core';
import { Router } from '@angular/router';

/**
 * About component providing company information, mission, and contact details.
 * Builds trust and credibility with potential customers.
 */
@Component({
  selector: 'app-about',
  standalone: false,
  template: `
    <div class="about-container">
      <!-- Hero Section -->
      <section class="about-hero">
        <div class="hero-content">
          <h1>About MyImage</h1>
          <p class="hero-subtitle">
            Transforming your digital memories into beautiful, lasting prints since 2024.
            We're passionate about preserving your most precious moments with professional quality and personal care.
          </p>
        </div>
      </section>

      <!-- Mission Section -->
      <section class="mission-section">
        <div class="content-grid">
          <div class="mission-text">
            <h2>Our Mission</h2>
            <p class="mission-statement">
              At MyImage, we believe that your most treasured memories deserve more than just existing on a screen.
              Our mission is to bring your digital photos to life through professional-quality printing,
              making it easy and affordable for everyone to hold their memories in their hands.
            </p>
            <div class="mission-values">
              <div class="value-item">
                <mat-icon>star</mat-icon>
                <div>
                  <h4>Quality First</h4>
                  <p>We use only premium materials and professional-grade equipment to ensure every print meets our high standards.</p>
                </div>
              </div>
              <div class="value-item">
                <mat-icon>favorite</mat-icon>
                <div>
                  <h4>Customer Focused</h4>
                  <p>Your satisfaction is our priority. We're here to help you preserve your memories exactly as you envision them.</p>
                </div>
              </div>
              <div class="value-item">
                <mat-icon>security</mat-icon>
                <div>
                  <h4>Privacy Protected</h4>
                  <p>Your photos are handled with the utmost care and privacy. We delete all images after successful delivery.</p>
                </div>
              </div>
            </div>
          </div>
          <div class="mission-image">
            <img src="https://picsum.photos/500/400?random=50" alt="Professional photo printing" class="about-image">
          </div>
        </div>
      </section>

      <!-- Company Story -->
      <section class="story-section">
        <mat-card class="story-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>history</mat-icon>
              Our Story
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="story-content">
              <p>
                MyImage was founded with a simple belief: in an increasingly digital world,
                there's something irreplaceable about holding a physical photograph. Whether it's a
                family portrait on the mantle, vacation photos in an album, or a cherished moment
                framed on your desk, printed photos create connections that screens simply can't match.
              </p>
              <p>
                Our founders, passionate photographers themselves, recognized the gap between
                professional printing services that were expensive and inaccessible, and consumer
                options that compromised on quality. MyImage bridges that gap by combining
                professional-grade equipment and materials with an easy-to-use online platform
                and competitive pricing.
              </p>
              <p>
                Today, we're proud to serve thousands of customers who trust us with their most
                precious memories. From family milestones to artistic creations, every photo
                tells a story, and we're honored to help bring those stories to life.
              </p>
            </div>
          </mat-card-content>
        </mat-card>
      </section>

      <!-- Team Section -->
      <section class="team-section">
        <h2>Meet Our Team</h2>
        <div class="team-grid">
          <mat-card class="team-member" *ngFor="let member of teamMembers">
            <div class="member-photo">
              <img [src]="member.photo" [alt]="member.name" class="member-image">
            </div>
            <mat-card-content>
              <h3>{{ member.name }}</h3>
              <p class="member-role">{{ member.role }}</p>
              <p class="member-bio">{{ member.bio }}</p>
            </mat-card-content>
          </mat-card>
        </div>
      </section>

      <!-- Technology Section -->
      <section class="technology-section">
        <h2>Professional Technology</h2>
        <p class="tech-intro">
          We invest in the latest printing technology to ensure every photo meets professional standards.
        </p>
        <div class="tech-grid">
          <div class="tech-item">
            <mat-icon class="tech-icon">print</mat-icon>
            <h4>Professional Printers</h4>
            <p>State-of-the-art inkjet printers with 12-color systems for exceptional color accuracy and detail.</p>
          </div>
          <div class="tech-item">
            <mat-icon class="tech-icon">palette</mat-icon>
            <h4>Color Management</h4>
            <p>Calibrated color profiles ensure your prints match your digital photos with precision.</p>
          </div>
          <div class="tech-item">
            <mat-icon class="tech-icon">description</mat-icon>
            <h4>Premium Papers</h4>
            <p>Archive-quality photo papers from leading manufacturers for longevity and vibrant colors.</p>
          </div>
          <div class="tech-item">
            <mat-icon class="tech-icon">search</mat-icon>
            <h4>Quality Control</h4>
            <p>Automated and manual inspection processes ensure every print meets our exacting standards.</p>
          </div>
        </div>
      </section>

      <!-- Contact Information -->
      <section class="contact-section">
        <div class="contact-grid">
          <mat-card class="contact-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>location_on</mat-icon>
                Branch Locations
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="location-list">
                <div class="location-item" *ngFor="let location of branchLocations">
                  <h4>{{ location.name }}</h4>
                  <p class="location-address">{{ location.address }}</p>
                  <p class="location-phone">{{ location.phone }}</p>
                  <p class="location-hours">{{ location.hours }}</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="contact-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>support</mat-icon>
                Customer Support
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="support-options">
                <div class="support-item">
                  <mat-icon>email</mat-icon>
                  <div>
                    <h4>Email Support</h4>
                    <!-- FIXED: Use HTML entity for @ symbol instead of literal @ -->
                    <p>support&#64;myimage.com</p>
                    <small>Response within 4 hours</small>
                  </div>
                </div>
                <div class="support-item">
                  <mat-icon>phone</mat-icon>
                  <div>
                    <h4>Phone Support</h4>
                    <p>1-800-MY-IMAGE</p>
                    <small>Mon-Fri 9AM-6PM EST</small>
                  </div>
                </div>
                <div class="support-item">
                  <mat-icon>chat</mat-icon>
                  <div>
                    <h4>Live Chat</h4>
                    <p>Available on website</p>
                    <small>Mon-Fri 9AM-5PM EST</small>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </section>

      <!-- Certifications & Trust -->
      <section class="trust-section">
        <h2>Your Trust, Our Priority</h2>
        <div class="trust-grid">
          <div class="trust-item">
            <mat-icon class="trust-icon">shield</mat-icon>
            <h4>Secure Processing</h4>
            <p>SSL encryption and secure payment processing protect your personal information.</p>
          </div>
          <div class="trust-item">
            <mat-icon class="trust-icon">verified_user</mat-icon>
            <h4>Privacy Guaranteed</h4>
            <p>Your photos are automatically deleted after successful delivery to protect your privacy.</p>
          </div>
          <div class="trust-item">
            <mat-icon class="trust-icon">thumb_up</mat-icon>
            <h4>Satisfaction Promise</h4>
            <p>Not happy with your prints? We'll reprint your order at no charge within 30 days.</p>
          </div>
          <div class="trust-item">
            <mat-icon class="trust-icon">eco</mat-icon>
            <h4>Eco-Friendly</h4>
            <p>Environmentally responsible printing practices and sustainable material sourcing.</p>
          </div>
        </div>
      </section>

      <!-- Call to Action -->
      <section class="cta-section">
        <h2>Ready to Start Printing?</h2>
        <p>Join our growing community of satisfied customers and bring your memories to life.</p>
        <div class="cta-actions">
          <button mat-raised-button color="primary" size="large" (click)="getStarted()">
            <mat-icon>add_photo_alternate</mat-icon>
            Start Your First Order
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
    .about-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    /* Hero Section */
    .about-hero {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
      padding: 80px 40px;
      text-align: center;
      margin-bottom: 60px;
    }

    .about-hero h1 {
      font-size: 3.5rem;
      margin-bottom: 24px;
      font-weight: 600;
    }

    .hero-subtitle {
      font-size: 1.3rem;
      max-width: 800px;
      margin: 0 auto;
      opacity: 0.9;
      line-height: 1.6;
    }

    /* Mission Section */
    .mission-section {
      margin-bottom: 80px;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 60px;
      align-items: center;
    }

    .mission-text h2 {
      font-size: 2.5rem;
      margin-bottom: 24px;
      color: #333;
    }

    .mission-statement {
      font-size: 1.2rem;
      line-height: 1.7;
      color: #555;
      margin-bottom: 40px;
    }

    .mission-values {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .value-item {
      display: flex;
      align-items: flex-start;
      gap: 20px;
    }

    .value-item mat-icon {
      color: #3f51b5;
      font-size: 32px;
      margin-top: 4px;
    }

    .value-item h4 {
      margin: 0 0 8px 0;
      color: #333;
      font-size: 1.1rem;
    }

    .value-item p {
      margin: 0;
      color: #666;
      line-height: 1.5;
    }

    .mission-image {
      text-align: center;
    }

    .about-image {
      width: 100%;
      max-width: 400px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    }

    /* Story Section */
    .story-section {
      margin-bottom: 80px;
    }

    .story-card {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    }

    .story-content p {
      font-size: 1.1rem;
      line-height: 1.7;
      color: #555;
      margin-bottom: 20px;
    }

    .story-content p:last-child {
      margin-bottom: 0;
    }

    /* Team Section */
    .team-section {
      margin-bottom: 80px;
    }

    .team-section h2 {
      text-align: center;
      font-size: 2.5rem;
      margin-bottom: 40px;
      color: #333;
    }

    .team-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 30px;
    }

    .team-member {
      text-align: center;
      transition: transform 0.3s ease;
    }

    .team-member:hover {
      transform: translateY(-5px);
    }

    .member-photo {
      width: 120px;
      height: 120px;
      margin: 0 auto 20px auto;
      border-radius: 50%;
      overflow: hidden;
      border: 4px solid #3f51b5;
    }

    .member-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .team-member h3 {
      margin: 0 0 8px 0;
      color: #333;
      font-size: 1.2rem;
    }

    .member-role {
      color: #3f51b5;
      font-weight: 500;
      margin-bottom: 12px;
    }

    .member-bio {
      color: #666;
      font-size: 0.9rem;
      line-height: 1.5;
    }

    /* Technology Section */
    .technology-section {
      margin-bottom: 80px;
    }

    .technology-section h2 {
      text-align: center;
      font-size: 2.5rem;
      margin-bottom: 16px;
      color: #333;
    }

    .tech-intro {
      text-align: center;
      font-size: 1.1rem;
      color: #666;
      margin-bottom: 40px;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    .tech-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 30px;
    }

    .tech-item {
      text-align: center;
      padding: 30px 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transition: transform 0.3s ease;
    }

    .tech-item:hover {
      transform: translateY(-5px);
    }

    .tech-icon {
      font-size: 48px;
      color: #3f51b5;
      margin-bottom: 20px;
    }

    .tech-item h4 {
      margin: 0 0 12px 0;
      color: #333;
      font-size: 1.2rem;
    }

    .tech-item p {
      color: #666;
      line-height: 1.6;
      margin: 0;
    }

    /* Contact Section */
    .contact-section {
      margin-bottom: 80px;
    }

    .contact-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 30px;
    }

    .contact-card {
      padding: 20px;
    }

    .location-list {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .location-item h4 {
      margin: 0 0 8px 0;
      color: #333;
      font-size: 1.1rem;
    }

    .location-address,
    .location-phone,
    .location-hours {
      margin: 4px 0;
      color: #666;
      font-size: 0.9rem;
    }

    .support-options {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .support-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }

    .support-item mat-icon {
      color: #3f51b5;
      font-size: 24px;
      margin-top: 2px;
    }

    .support-item h4 {
      margin: 0 0 4px 0;
      color: #333;
      font-size: 1rem;
    }

    .support-item p {
      margin: 0 0 4px 0;
      color: #666;
      font-weight: 500;
    }

    .support-item small {
      color: #888;
      font-size: 0.8rem;
    }

    /* Trust Section */
    .trust-section {
      margin-bottom: 80px;
    }

    .trust-section h2 {
      text-align: center;
      font-size: 2.5rem;
      margin-bottom: 40px;
      color: #333;
    }

    .trust-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 30px;
    }

    .trust-item {
      text-align: center;
      padding: 30px 20px;
      background: #e8f5e8;
      border-radius: 12px;
    }

    .trust-icon {
      font-size: 48px;
      color: #2e7d32;
      margin-bottom: 20px;
    }

    .trust-item h4 {
      margin: 0 0 12px 0;
      color: #1b5e20;
      font-size: 1.2rem;
    }

    .trust-item p {
      color: #2e7d32;
      line-height: 1.6;
      margin: 0;
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
      .about-hero {
        padding: 60px 20px;
      }

      .about-hero h1 {
        font-size: 2.5rem;
      }

      .hero-subtitle {
        font-size: 1.1rem;
      }

      .content-grid {
        grid-template-columns: 1fr;
        gap: 40px;
      }

      .mission-text h2 {
        font-size: 2rem;
      }

      .mission-statement {
        font-size: 1.1rem;
      }

      .team-grid {
        grid-template-columns: 1fr;
      }

      .tech-grid,
      .trust-grid {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      }

      .contact-grid {
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
export class AboutComponent {
  // Team members data
  teamMembers = [
    {
      name: 'Sarah Johnson',
      role: 'Founder & CEO',
      bio: 'Professional photographer with 15+ years of experience in digital imaging and print production.',
      photo: 'https://picsum.photos/200/200?random=60'
    },
    {
      name: 'Michael Chen',
      role: 'Head of Quality',
      bio: 'Color management specialist ensuring every print meets professional standards.',
      photo: 'https://picsum.photos/200/200?random=61'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Customer Success',
      bio: 'Dedicated to providing exceptional service and helping customers create perfect prints.',
      photo: 'https://picsum.photos/200/200?random=62'
    },
    {
      name: 'David Kim',
      role: 'Print Operations',
      bio: 'Master printer with expertise in professional printing techniques and equipment.',
      photo: 'https://picsum.photos/200/200?random=63'
    }
  ];

  // Branch locations for payment pickup
  branchLocations = [
    {
      name: 'Boston Downtown',
      address: '123 Main Street, Boston, MA 02101',
      phone: '(617) 555-0100',
      hours: 'Mon-Fri: 9AM-6PM, Sat: 10AM-4PM'
    },
    {
      name: 'Cambridge Center',
      address: '456 Tech Boulevard, Cambridge, MA 02139',
      phone: '(617) 555-0200',
      hours: 'Mon-Fri: 8AM-7PM, Sat: 9AM-5PM'
    }
  ];

  constructor(private router: Router) {}

  /**
   * Navigate to registration to start using the service.
   */
  getStarted(): void {
    this.router.navigate(['/auth/register']);
  }
}
