
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-order-details-dialog',
  standalone: false,
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <div class="header-main">
          <h2 mat-dialog-title>
            <mat-icon class="dialog-icon">receipt_long</mat-icon>
            Order Details
          </h2>
          <div class="order-number-section">
            <span class="order-number">{{ data.order.orderNumber }}</span>
            <mat-chip [class]="getEnhancedStatusClass(data.order.status)" class="status-chip">
              <mat-icon class="status-icon">{{ getStatusIcon(data.order.status) }}</mat-icon>
              {{ getStatusLabel(data.order.status) }}
            </mat-chip>
          </div>
        </div>

        <div class="header-actions">
          <button mat-icon-button (click)="printOrder()" *ngIf="canPrint()" matTooltip="Print Order Details">
            <mat-icon>print</mat-icon>
          </button>
          <button mat-icon-button mat-dialog-close class="close-btn">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <mat-dialog-content class="dialog-content">
        <!-- Quick Overview Stats -->
        <div class="overview-stats">
          <div class="stat-card">
            <mat-icon class="stat-icon customer-icon">person</mat-icon>
            <div class="stat-info">
              <span class="stat-label">Customer</span>
              <span class="stat-value">{{ data.order.customerName }}</span>
            </div>
          </div>

          <div class="stat-card">
            <mat-icon class="stat-icon date-icon">schedule</mat-icon>
            <div class="stat-info">
              <span class="stat-label">Order Date</span>
              <span class="stat-value">{{ formatDate(data.order.orderDate) }}</span>
            </div>
          </div>

          <div class="stat-card">
            <mat-icon class="stat-icon amount-icon">account_balance_wallet</mat-icon>
            <div class="stat-info">
              <span class="stat-label">Total Amount</span>
              <span class="stat-value amount">\${{ data.order.totalAmount.toFixed(2) }}</span>
            </div>
          </div>

          <div class="stat-card">
            <mat-icon class="stat-icon items-icon">photo_library</mat-icon>
            <div class="stat-info">
              <span class="stat-label">Items</span>
              <span class="stat-value">{{ data.order.photoCount }} photos, {{ data.order.printCount }} prints</span>
            </div>
          </div>
        </div>

        <!-- Main Content Sections -->
        <div class="content-sections">
          <!-- Customer Information -->
          <mat-card class="section-card customer-section">
            <mat-card-header class="section-header">
              <div class="section-title">
                <mat-icon class="section-icon">person_outline</mat-icon>
                <mat-card-title>Customer Information</mat-card-title>
              </div>
            </mat-card-header>
            <mat-card-content>
              <div class="info-grid">
                <div class="info-item">
                  <mat-icon class="info-icon">badge</mat-icon>
                  <div class="info-content">
                    <span class="info-label">Full Name</span>
                    <span class="info-value">{{ data.order.customerName }}</span>
                  </div>
                </div>

                <div class="info-item">
                  <mat-icon class="info-icon">email</mat-icon>
                  <div class="info-content">
                    <span class="info-label">Email Address</span>
                    <span class="info-value">{{ data.order.customerEmail }}</span>
                  </div>
                </div>

                <div class="info-item">
                  <mat-icon class="info-icon">schedule</mat-icon>
                  <div class="info-content">
                    <span class="info-label">Order Date</span>
                    <span class="info-value">{{ formatDetailedDate(data.order.orderDate) }}</span>
                  </div>
                </div>

                <div class="info-item">
                  <mat-icon class="info-icon">trending_up</mat-icon>
                  <div class="info-content">
                    <span class="info-label">Current Status</span>
                    <div class="status-with-progress">
                      <span class="info-value">{{ getStatusLabel(data.order.status) }}</span>
                      <div class="progress-bar">
                        <div class="progress-fill" [style.width.%]="getStatusProgress(data.order.status)"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Payment Information -->
          <mat-card class="section-card payment-section">
            <mat-card-header class="section-header">
              <div class="section-title">
                <mat-icon class="section-icon">payment</mat-icon>
                <mat-card-title>Payment Information</mat-card-title>
              </div>
              <div class="payment-status-indicator">
                <mat-chip [class]="getPaymentStatusClass(data.order.paymentStatus)" class="payment-status-chip">
                  <mat-icon class="payment-icon">{{ getPaymentStatusIcon(data.order.paymentStatus) }}</mat-icon>
                  {{ getPaymentStatusLabel(data.order.paymentStatus) }}
                </mat-chip>
              </div>
            </mat-card-header>

            <mat-card-content>
              <div class="payment-details">
                <div class="payment-method-card">
                  <div class="payment-method-header">
                    <mat-icon [class]="getPaymentMethodIconClass(data.order.paymentMethod)">
                      {{ getPaymentIcon(data.order.paymentMethod) }}
                    </mat-icon>
                    <span class="payment-method-name">{{ getPaymentLabel(data.order.paymentMethod) }}</span>
                  </div>

                  <div class="payment-info-grid">
                    <div class="payment-item">
                      <span class="payment-label">Method:</span>
                      <span class="payment-value">{{ getPaymentLabel(data.order.paymentMethod) }}</span>
                    </div>

                    <div class="payment-item">
                      <span class="payment-label">Status:</span>
                      <span class="payment-value" [class]="getPaymentStatusTextClass(data.order.paymentStatus)">
                        {{ getPaymentStatusLabel(data.order.paymentStatus) }}
                      </span>
                    </div>

                    <div class="payment-item" *ngIf="data.order.paymentVerifiedDate">
                      <span class="payment-label">Verified:</span>
                      <span class="payment-value">{{ formatDate(data.order.paymentVerifiedDate) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Pricing Breakdown -->
                <div class="pricing-breakdown">
                  <h4 class="breakdown-title">
                    <mat-icon>calculate</mat-icon>
                    Pricing Breakdown
                  </h4>

                  <div class="pricing-items">
                    <div class="pricing-item">
                      <span class="pricing-label">Subtotal:</span>
                      <span class="pricing-value">\${{ (data.order.totalAmount * 0.9375).toFixed(2) }}</span>
                    </div>
                    <div class="pricing-item">
                      <span class="pricing-label">Tax (6.25%):</span>
                      <span class="pricing-value">\${{ (data.order.totalAmount * 0.0625).toFixed(2) }}</span>
                    </div>
                    <div class="pricing-item total-item">
                      <span class="pricing-label">Total:</span>
                      <span class="pricing-value total-amount">\${{ data.order.totalAmount.toFixed(2) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Order Items Summary -->
          <mat-card class="section-card items-section">
            <mat-card-header class="section-header">
              <div class="section-title">
                <mat-icon class="section-icon">inventory_2</mat-icon>
                <mat-card-title>Order Items</mat-card-title>
              </div>
              <div class="items-summary">
                <span class="summary-text">{{ data.order.photoCount }} photos • {{ data.order.printCount }} prints</span>
              </div>
            </mat-card-header>

            <mat-card-content>
              <div class="order-summary-stats">
                <div class="summary-stat">
                  <div class="summary-icon-wrapper photos">
                    <mat-icon>photo_library</mat-icon>
                  </div>
                  <div class="summary-info">
                    <span class="summary-number">{{ data.order.photoCount }}</span>
                    <span class="summary-label">Photos</span>
                  </div>
                </div>

                <div class="summary-stat">
                  <div class="summary-icon-wrapper prints">
                    <mat-icon>print</mat-icon>
                  </div>
                  <div class="summary-info">
                    <span class="summary-number">{{ data.order.printCount }}</span>
                    <span class="summary-label">Total Prints</span>
                  </div>
                </div>

                <div class="summary-stat">
                  <div class="summary-icon-wrapper sizes">
                    <mat-icon>photo_size_select_large</mat-icon>
                  </div>
                  <div class="summary-info">
                    <span class="summary-number">{{ getUniqueSizeCount() }}</span>
                    <span class="summary-label">Print Sizes</span>
                  </div>
                </div>
              </div>

              <!-- Detailed Items List (if available) -->
              <div class="detailed-items" *ngIf="data.order.items && data.order.items.length > 0">
                <h4 class="items-title">
                  <mat-icon>list_alt</mat-icon>
                  Detailed Item List
                </h4>

                <div class="items-list">
                  <div class="order-item" *ngFor="let item of data.order.items; trackBy: trackByItemId">
                    <div class="item-photo-section">
                      <div class="photo-thumbnail">
                        <img [src]="item.photoThumbnailUrl || '/assets/placeholder-photo.png'"
                             [alt]="item.photoFilename"
                             class="photo-thumb"
                             (error)="onImageError($event)">
                      </div>
                      <div class="photo-info">
                        <span class="photo-name">{{ item.photoFilename }}</span>
                        <span class="photo-size">{{ formatFileSize(item.photoFileSize) }}</span>
                      </div>
                    </div>

                    <div class="item-prints-section">
                      <div class="print-selection" *ngFor="let print of item.printSelections">
                        <div class="print-info">
                          <span class="print-size">{{ print.sizeName }}</span>
                          <span class="print-details">{{ print.quantity }}x &#64; \${{ print.unitPrice.toFixed(2) }}</span>
                        </div>
                        <span class="print-total">\${{ print.lineTotal.toFixed(2) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Shipping Information -->
          <mat-card class="section-card shipping-section" *ngIf="data.order.shippingAddress">
            <mat-card-header class="section-header">
              <div class="section-title">
                <mat-icon class="section-icon">local_shipping</mat-icon>
                <mat-card-title>Shipping Information</mat-card-title>
              </div>
            </mat-card-header>

            <mat-card-content>
              <div class="shipping-content">
                <div class="shipping-address-card">
                  <div class="address-header">
                    <mat-icon>home</mat-icon>
                    <span>Delivery Address</span>
                  </div>

                  <div class="address-details">
                    <div class="address-line primary">{{ data.order.shippingAddress.fullName }}</div>
                    <div class="address-line">{{ data.order.shippingAddress.streetLine1 }}</div>
                    <div class="address-line" *ngIf="data.order.shippingAddress.streetLine2">
                      {{ data.order.shippingAddress.streetLine2 }}
                    </div>
                    <div class="address-line">
                      {{ data.order.shippingAddress.city }}, {{ data.order.shippingAddress.state }} {{ data.order.shippingAddress.postalCode }}
                    </div>
                    <div class="address-line">{{ data.order.shippingAddress.country }}</div>
                    <div class="address-line contact" *ngIf="data.order.shippingAddress.phone">
                      <mat-icon>phone</mat-icon>
                      {{ data.order.shippingAddress.phone }}
                    </div>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Fulfillment Information -->
          <mat-card class="section-card fulfillment-section" *ngIf="data.order.fulfillment">
            <mat-card-header class="section-header">
              <div class="section-title">
                <mat-icon class="section-icon">assignment_turned_in</mat-icon>
                <mat-card-title>Fulfillment Status</mat-card-title>
              </div>
            </mat-card-header>

            <mat-card-content>
              <div class="fulfillment-timeline">
                <div class="timeline-item"
                     [class.completed]="data.order.fulfillment.printedAt"
                     [class.current]="!data.order.fulfillment.printedAt && data.order.status === 'processing'">
                  <div class="timeline-icon">
                    <mat-icon>print</mat-icon>
                  </div>
                  <div class="timeline-content">
                    <span class="timeline-title">Printed</span>
                    <span class="timeline-date" *ngIf="data.order.fulfillment.printedAt">
                      {{ formatDate(data.order.fulfillment.printedAt) }}
                    </span>
                  </div>
                </div>

                <div class="timeline-item"
                     [class.completed]="data.order.fulfillment.shippedAt"
                     [class.current]="!data.order.fulfillment.shippedAt && data.order.status === 'printed'">
                  <div class="timeline-icon">
                    <mat-icon>local_shipping</mat-icon>
                  </div>
                  <div class="timeline-content">
                    <span class="timeline-title">Shipped</span>
                    <span class="timeline-date" *ngIf="data.order.fulfillment.shippedAt">
                      {{ formatDate(data.order.fulfillment.shippedAt) }}
                    </span>
                    <span class="tracking-info" *ngIf="data.order.fulfillment.trackingNumber">
                      Tracking: {{ data.order.fulfillment.trackingNumber }}
                    </span>
                  </div>
                </div>

                <div class="timeline-item"
                     [class.completed]="data.order.fulfillment.completedAt"
                     [class.current]="!data.order.fulfillment.completedAt && data.order.status === 'shipped'">
                  <div class="timeline-icon">
                    <mat-icon>check_circle</mat-icon>
                  </div>
                  <div class="timeline-content">
                    <span class="timeline-title">Completed</span>
                    <span class="timeline-date" *ngIf="data.order.fulfillment.completedAt">
                      {{ formatDate(data.order.fulfillment.completedAt) }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="fulfillment-notes" *ngIf="data.order.fulfillment.notes && data.order.fulfillment.notes.length > 0">
                <h4 class="notes-title">
                  <mat-icon>note</mat-icon>
                  Fulfillment Notes
                </h4>
                <div class="note-list">
                  <div class="note-item" *ngFor="let note of data.order.fulfillment.notes">
                    <mat-icon class="note-icon">sticky_note_2</mat-icon>
                    <span class="note-text">{{ note }}</span>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="close()">
          <mat-icon>close</mat-icon>
          Close
        </button>

        <button mat-raised-button color="primary" (click)="printOrder()" *ngIf="canPrint()">
          <mat-icon>print</mat-icon>
          Print Order Details
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      max-width: 900px;
      width: 100%;
      max-height: 90vh;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 20px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .header-main {
      flex: 1;
    }

    .dialog-header h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      color: white;
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0 0 12px 0;
    }

    .dialog-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .order-number-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .order-number {
      font-size: 1.1rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
    }

    .status-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
    }

    .status-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .header-actions button {
      color: rgba(255, 255, 255, 0.9);
      transition: all 0.2s ease;
    }

    .header-actions button:hover {
      color: white;
      background: rgba(255, 255, 255, 0.1);
    }

    .dialog-content {
      padding: 0;
      max-height: 70vh;
      overflow-y: auto;
    }

    /* Overview Stats */
    .overview-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      padding: 24px;
      background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
      border-bottom: 1px solid #e2e8f0;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      transition: all 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .stat-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    .stat-icon.customer-icon {
      background: linear-gradient(135deg, #bee3f8 0%, #90cdf4 100%);
      color: #2c5282;
    }

    .stat-icon.date-icon {
      background: linear-gradient(135deg, #e9d8fd 0%, #d6bcfa 100%);
      color: #6b46c1;
    }

    .stat-icon.amount-icon {
      background: linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%);
      color: #276749;
    }

    .stat-icon.items-icon {
      background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
      color: #c53030;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #718096;
      font-weight: 500;
    }

    .stat-value {
      font-weight: 600;
      color: #2d3748;
    }

    .stat-value.amount {
      color: #2f855a;
      font-size: 1.1rem;
    }

    /* Content Sections */
    .content-sections {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .section-card {
      border-radius: 16px;
      border: none;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    .section-header {
      background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
      border-bottom: 1px solid #e2e8f0;
      padding: 20px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .section-title mat-card-title {
      color: #1a365d;
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0;
    }

    .section-icon {
      color: #3182ce;
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    /* Info Grid */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      padding: 24px;
    }

    .info-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background: #f7fafc;
      border-radius: 12px;
      transition: all 0.2s ease;
    }

    .info-item:hover {
      background: #edf2f7;
    }

    .info-icon {
      color: #718096;
      font-size: 20px;
      width: 20px;
      height: 20px;
      margin-top: 2px;
      flex-shrink: 0;
    }

    .info-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }

    .info-label {
      font-size: 0.875rem;
      color: #4a5568;
      font-weight: 500;
    }

    .info-value {
      color: #2d3748;
      font-weight: 600;
    }

    .status-with-progress {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .progress-bar {
      width: 100%;
      height: 6px;
      background: #e2e8f0;
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #3182ce 0%, #38a169 100%);
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    /* Payment Section */
    .payment-status-indicator {
      display: flex;
      align-items: center;
    }

    .payment-status-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 16px;
    }

    .payment-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .payment-details {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .payment-method-card {
      background: #f7fafc;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #e2e8f0;
    }

    .payment-method-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .payment-method-header mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .payment-method-header .credit-card-icon {
      color: #3182ce;
    }

    .payment-method-header .branch-payment-icon {
      color: #805ad5;
    }

    .payment-method-name {
      font-weight: 600;
      color: #2d3748;
      font-size: 1.1rem;
    }

    .payment-info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
    }

    .payment-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .payment-label {
      font-size: 0.9rem;
      color: #4a5568;
      font-weight: 500;
    }

    .payment-value {
      font-weight: 600;
      color: #2d3748;
    }

    .payment-value.verified {
      color: #2f855a;
    }

    .payment-value.pending {
      color: #d69e2e;
    }

    .payment-value.failed {
      color: #e53e3e;
    }

    /* Pricing Breakdown */
    .pricing-breakdown {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
    }

    .breakdown-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #2d3748;
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 16px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
    }

    .pricing-items {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .pricing-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
    }

    .pricing-item.total-item {
      border-top: 2px solid #e2e8f0;
      padding-top: 12px;
      margin-top: 8px;
    }

    .pricing-label {
      color: #4a5568;
      font-weight: 500;
    }

    .pricing-value {
      font-weight: 600;
      color: #2d3748;
    }

    .total-amount {
      color: #2f855a;
      font-size: 1.1rem;
    }

    /* Order Items */
    .items-summary {
      display: flex;
      align-items: center;
    }

    .summary-text {
      font-size: 0.9rem;
      color: #718096;
      font-weight: 500;
    }

    .order-summary-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 16px;
      padding: 24px;
      margin-bottom: 20px;
    }

    .summary-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 16px;
      background: #f7fafc;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }

    .summary-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .summary-icon-wrapper.photos {
      background: linear-gradient(135deg, #bee3f8 0%, #90cdf4 100%);
      color: #2c5282;
    }

    .summary-icon-wrapper.prints {
      background: linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%);
      color: #276749;
    }

    .summary-icon-wrapper.sizes {
      background: linear-gradient(135deg, #e9d8fd 0%, #d6bcfa 100%);
      color: #6b46c1;
    }

    .summary-icon-wrapper mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .summary-info {
      text-align: center;
    }

    .summary-number {
      font-size: 1.5rem;
      font-weight: 700;
      color: #2d3748;
      display: block;
      line-height: 1;
    }

    .summary-label {
      font-size: 0.875rem;
      color: #718096;
      font-weight: 500;
    }

    /* Detailed Items */
    .detailed-items {
      padding: 0 24px 24px 24px;
    }

    .items-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #2d3748;
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 16px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
    }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .order-item {
      display: flex;
      gap: 20px;
      padding: 16px;
      background: #f7fafc;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }

    .item-photo-section {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 200px;
    }

    .photo-thumbnail {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      overflow: hidden;
      border: 2px solid #e2e8f0;
    }

    .photo-thumb {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .photo-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .photo-name {
      font-weight: 500;
      color: #2d3748;
      font-size: 0.9rem;
    }

    .photo-size {
      font-size: 0.8rem;
      color: #718096;
    }

    .item-prints-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .print-selection {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .print-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .print-size {
      font-weight: 600;
      color: #2d3748;
    }

    .print-details {
      font-size: 0.8rem;
      color: #718096;
    }

    .print-total {
      font-weight: 600;
      color: #2f855a;
    }

    /* Shipping Section */
    .shipping-content {
      padding: 24px;
    }

    .shipping-address-card {
      background: #f7fafc;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #e2e8f0;
    }

    .address-header {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #2d3748;
      font-weight: 600;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
    }

    .address-details {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .address-line {
      color: #4a5568;
      font-size: 0.95rem;
      line-height: 1.4;
    }

    .address-line.primary {
      font-weight: 600;
      color: #2d3748;
      font-size: 1rem;
    }

    .address-line.contact {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
    }

    .address-line.contact mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #718096;
    }

    /* Fulfillment Timeline */
    .fulfillment-timeline {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .timeline-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      position: relative;
    }

    .timeline-item:not(:last-child)::after {
      content: '';
      position: absolute;
      left: 20px;
      top: 40px;
      bottom: -20px;
      width: 2px;
      background: #e2e8f0;
    }

    .timeline-item.completed::after {
      background: #38a169;
    }

    .timeline-item.current::after {
      background: linear-gradient(to bottom, #3182ce, #e2e8f0);
    }

    .timeline-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e2e8f0;
      color: #718096;
      transition: all 0.3s ease;
    }

    .timeline-item.completed .timeline-icon {
      background: #38a169;
      color: white;
    }

    .timeline-item.current .timeline-icon {
      background: #3182ce;
      color: white;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .timeline-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }

    .timeline-title {
      font-weight: 600;
      color: #2d3748;
      font-size: 1rem;
    }

    .timeline-date {
      font-size: 0.875rem;
      color: #718096;
    }

    .tracking-info {
      font-size: 0.8rem;
      color: #3182ce;
      font-weight: 500;
      background: #e6f3ff;
      padding: 4px 8px;
      border-radius: 4px;
      margin-top: 4px;
      display: inline-block;
    }

    .fulfillment-notes {
      padding: 0 24px 24px 24px;
    }

    .notes-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #2d3748;
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 16px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
    }

    .note-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .note-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 12px;
      background: #f7fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .note-icon {
      color: #718096;
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-top: 1px;
      flex-shrink: 0;
    }

    .note-text {
      color: #4a5568;
      line-height: 1.4;
      font-family: 'Roboto Mono', monospace;
      font-size: 0.9rem;
    }

    /* FIXED: Updated Status Colors for consistency */
    .status-pending {
      background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
      color: #c53030;
    }

    .status-verified {
      background: linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%);
      color: #1d4ed8;
    }

    .status-processing {
      background: linear-gradient(135deg, #e9d8fd 0%, #d6bcfa 100%);
      color: #6b46c1;
    }

    .status-printed {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      color: #92400e;
    }

    .status-shipped {
      background: linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%);
      color: #1e40af;
    }

    .status-completed {
      background: linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%);
      color: #065f46;
    }

    .payment-status-verified {
      background: linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%);
      color: #276749;
    }

    .payment-status-pending {
      background: linear-gradient(135deg, #fef5e7 0%, #fed7aa 100%);
      color: #c05621;
    }

    .payment-status-failed {
      background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
      color: #c53030;
    }

    /* Dialog Actions */
    .dialog-actions {
      padding: 20px 24px;
      background: #f7fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .dialog-actions button {
      height: 44px;
      border-radius: 8px;
      font-weight: 500;
      min-width: 120px;
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .overview-stats {
        grid-template-columns: repeat(2, 1fr);
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .payment-info-grid {
        grid-template-columns: 1fr;
      }

      .order-summary-stats {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (max-width: 768px) {
      .dialog-container {
        max-width: 95vw;
      }

      .overview-stats {
        grid-template-columns: 1fr;
        padding: 16px;
      }

      .content-sections {
        padding: 16px;
      }

      .order-item {
        flex-direction: column;
        gap: 12px;
      }

      .item-photo-section {
        min-width: auto;
      }

      .order-summary-stats {
        grid-template-columns: 1fr;
      }

      .dialog-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .order-number-section {
        justify-content: space-between;
      }
    }
  `]
})
export class OrderDetailsDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<OrderDetailsDialogComponent>
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  printOrder(): void {
    window.print();
  }

  canPrint(): boolean {
    const printableStatuses = ['payment_verified', 'processing', 'printed', 'shipped', 'completed'];
    return printableStatuses.includes(this.data.order.status);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatDetailedDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'pending': 'Pending Payment',
      'payment_verified': 'Payment Verified',
      'processing': 'Processing',
      'printed': 'Printed',
      'shipped': 'Shipped',
      'completed': 'Completed'
    };
    return statusLabels[status] || status;
  }

  getEnhancedStatusClass(status: string): string {
    return `status-${status.replace('_', '-')}`;
  }

  getStatusIcon(status: string): string {
    const statusIcons: { [key: string]: string } = {
      'pending': 'pending',
      'payment_verified': 'verified',
      'processing': 'autorenew',
      'printed': 'print',
      'shipped': 'local_shipping',
      'completed': 'check_circle'
    };
    return statusIcons[status] || 'help';
  }

  getStatusProgress(status: string): number {
    const progressMap: { [key: string]: number } = {
      'pending': 15,
      'payment_verified': 30,
      'processing': 50,
      'printed': 75,
      'shipped': 90,
      'completed': 100
    };
    return progressMap[status] || 0;
  }

  getPaymentStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'pending': 'Pending',
      'verified': 'Verified',
      'failed': 'Failed'
    };
    return statusLabels[status] || status;
  }

  getPaymentStatusClass(status: string): string {
    return `payment-status-${status.replace('_', '-')}`;
  }

  getPaymentStatusTextClass(status: string): string {
    return status || 'pending';
  }

  getPaymentStatusIcon(status: string): string {
    const statusIcons: { [key: string]: string } = {
      'pending': 'schedule',
      'verified': 'check_circle',
      'failed': 'cancel'
    };
    return statusIcons[status] || 'help';
  }

  getPaymentIcon(paymentMethod: string): string {
    return paymentMethod === 'credit_card' ? 'credit_card' : 'store';
  }

  getPaymentMethodIconClass(paymentMethod: string): string {
    return paymentMethod === 'credit_card' ? 'credit-card-icon' : 'branch-payment-icon';
  }

  getPaymentLabel(paymentMethod: string): string {
    return paymentMethod === 'credit_card' ? 'Credit Card' : 'Branch Payment';
  }

  getUniqueSizeCount(): number {
    if (!this.data.order.items) return 0;
    const sizes = new Set();
    this.data.order.items.forEach((item: any) => {
      item.printSelections?.forEach((print: any) => {
        sizes.add(print.sizeName);
      });
    });
    return sizes.size;
  }

  trackByItemId(index: number, item: any): any {
    return item.photoId || index;
  }

  onImageError(event: any): void {
    event.target.src = '/assets/placeholder-photo.png';
  }
}
