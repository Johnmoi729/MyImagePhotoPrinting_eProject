
// Enhanced Order detail component with modern UI/UX template

import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';

@Component({
  selector: 'app-order-detail',
  standalone: false,
  template: `
    <div class="order-detail-container" *ngIf="order">
      <!-- Enhanced Order Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="title-section">
            <h1 class="page-title">
              <mat-icon class="title-icon">receipt_long</mat-icon>
              Order {{ order.orderNumber }}
            </h1>
            <p class="page-description">View detailed information about your order and track its progress</p>
          </div>

          <div class="header-actions">
            <button mat-stroked-button routerLink="/orders" class="back-button">
              <mat-icon>arrow_back</mat-icon>
              <span>Back to Orders</span>
            </button>
          </div>
        </div>

        <!-- Order Status Banner -->
        <div class="status-banner">
          <mat-card class="status-card">
            <mat-card-content>
              <div class="status-content">
                <div class="status-main">
                  <mat-chip [class]="getEnhancedStatusClass(order.status)" class="status-chip-large">
                    <mat-icon class="status-icon">{{ getStatusIcon(order.status) }}</mat-icon>
                    <span>{{ getStatusLabel(order.status) }}</span>
                  </mat-chip>
                  <div class="status-description">
                    <span>{{ getStatusDescription(order.status) }}</span>
                  </div>
                </div>

                <div class="order-summary">
                  <div class="summary-item">
                    <span class="summary-label">Order Date:</span>
                    <span class="summary-value">{{ formatDate(order.createdAt || order.orderDate) }}</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">Total Amount:</span>
                    <span class="summary-value amount">\${{ (order.pricing?.total || order.totalAmount || 0).toFixed(2) }}</span>
                  </div>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="progress-section">
                <div class="progress-bar">
                  <div class="progress-fill" [style.width.%]="getStatusProgress(order.status)"></div>
                </div>
                <div class="progress-labels">
                  <span>Ordered</span>
                  <span>Processing</span>
                  <span>Shipped</span>
                  <span>Completed</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <!-- Main Content Sections -->
      <div class="content-sections">
        <!-- Order Information -->
        <mat-card class="section-card order-info-section">
          <mat-card-header class="section-header">
            <div class="section-title">
              <mat-icon class="section-icon">info_outline</mat-icon>
              <mat-card-title>Order Information</mat-card-title>
            </div>
          </mat-card-header>

          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <mat-icon class="info-icon">schedule</mat-icon>
                <div class="info-content">
                  <span class="info-label">Order Date:</span>
                  <span class="info-value">{{ formatDateTime(order.createdAt || order.orderDate) }}</span>
                </div>
              </div>

              <div class="info-item">
                <mat-icon class="info-icon">payment</mat-icon>
                <div class="info-content">
                  <span class="info-label">Payment Method:</span>
                  <div class="payment-info">
                    <mat-icon class="payment-method-icon">{{ getPaymentIcon(order.payment?.method || order.paymentMethod) }}</mat-icon>
                    <span>{{ getPaymentLabel(order.payment?.method || order.paymentMethod) }}</span>
                  </div>
                </div>
              </div>

              <div class="info-item">
                <mat-icon class="info-icon">verified</mat-icon>
                <div class="info-content">
                  <span class="info-label">Payment Status:</span>
                  <mat-chip [class]="getPaymentStatusClass(order.payment?.status || 'verified')" class="payment-status-chip">
                    {{ getPaymentStatusLabel(order.payment?.status || 'verified') }}
                  </mat-chip>
                </div>
              </div>

              <div class="info-item">
                <mat-icon class="info-icon">account_balance_wallet</mat-icon>
                <div class="info-content">
                  <span class="info-label">Total Amount:</span>
                  <span class="info-value amount">\${{ (order.pricing?.total || order.totalAmount || 0).toFixed(2) }}</span>
                </div>
              </div>

              <div class="info-item" *ngIf="order.fulfillment?.trackingNumber">
                <mat-icon class="info-icon">local_shipping</mat-icon>
                <div class="info-content">
                  <span class="info-label">Tracking Number:</span>
                  <span class="info-value tracking">{{ order.fulfillment.trackingNumber }}</span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Order Items -->
        <mat-card class="section-card order-items-section">
          <mat-card-header class="section-header">
            <div class="section-title">
              <mat-icon class="section-icon">inventory_2</mat-icon>
              <mat-card-title>Order Items</mat-card-title>
            </div>
            <div class="items-summary">
              <span class="summary-text">{{ getPhotoCount() }} photos • {{ getPrintCount() }} prints</span>
            </div>
          </mat-card-header>

          <mat-card-content>
            <!-- Order Statistics -->
            <div class="order-stats">
              <div class="stat-item">
                <div class="stat-icon-wrapper photos">
                  <mat-icon>photo_library</mat-icon>
                </div>
                <div class="stat-info">
                  <span class="stat-number">{{ getPhotoCount() }}</span>
                  <span class="stat-label">Photos</span>
                </div>
              </div>

              <div class="stat-item">
                <div class="stat-icon-wrapper prints">
                  <mat-icon>print</mat-icon>
                </div>
                <div class="stat-info">
                  <span class="stat-number">{{ getPrintCount() }}</span>
                  <span class="stat-label">Prints</span>
                </div>
              </div>

              <div class="stat-item">
                <div class="stat-icon-wrapper sizes">
                  <mat-icon>photo_size_select_large</mat-icon>
                </div>
                <div class="stat-info">
                  <span class="stat-number">{{ getUniqueSizeCount() }}</span>
                  <span class="stat-label">Print Sizes</span>
                </div>
              </div>
            </div>

            <!-- Items List -->
            <div class="items-list" *ngIf="order.items && order.items.length > 0">
              <mat-expansion-panel *ngFor="let item of order.items; trackBy: trackByItemId" class="item-panel">
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <div class="item-summary">
                      <div class="item-placeholder">
                        <mat-icon>photo</mat-icon>
                      </div>
                      <div class="item-info">
                        <span class="item-name">{{ item.photoFilename }}</span>
                        <span class="item-subtitle">
                          {{ item.printSelections?.length || 0 }} size(s) • \${{ (item.photoTotal || 0).toFixed(2) }}
                        </span>
                        <span class="item-filesize">{{ formatFileSize(item.photoFileSize) }}</span>
                      </div>
                    </div>
                  </mat-panel-title>
                </mat-expansion-panel-header>

                <div class="item-details">
                  <h4 class="details-title">
                    <mat-icon>print</mat-icon>
                    Print Selections
                  </h4>
                  <div class="selections-list" *ngIf="item.printSelections">
                    <div class="selection-item" *ngFor="let selection of item.printSelections">
                      <div class="selection-main">
                        <div class="selection-info">
                          <span class="size-name">{{ selection.sizeName }}</span>
                          <span class="quantity">Quantity: {{ selection.quantity }}</span>
                        </div>
                        <div class="selection-pricing">
                          <span class="unit-price">\${{ (selection.unitPrice || 0).toFixed(2) }} each</span>
                          <span class="line-total">\${{ (selection.subtotal || selection.lineTotal || 0).toFixed(2) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </mat-expansion-panel>
            </div>

            <!-- Fallback if no items structure -->
            <div *ngIf="!order.items || order.items.length === 0" class="no-items">
              <div class="no-items-icon">
                <mat-icon>photo_library</mat-icon>
              </div>
              <h4>Order Items</h4>
              <p>Detailed item information is not available for this order</p>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Shipping Information -->
        <mat-card class="section-card shipping-section" *ngIf="order.shippingAddress">
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
                  <div class="address-line primary">{{ order.shippingAddress.fullName }}</div>
                  <div class="address-line">{{ order.shippingAddress.streetLine1 }}</div>
                  <div class="address-line" *ngIf="order.shippingAddress.streetLine2">
                    {{ order.shippingAddress.streetLine2 }}
                  </div>
                  <div class="address-line">
                    {{ order.shippingAddress.city }}, {{ order.shippingAddress.state }}
                    {{ order.shippingAddress.postalCode }}
                  </div>
                  <div class="address-line">{{ order.shippingAddress.country }}</div>
                  <div class="address-line contact" *ngIf="order.shippingAddress.phone">
                    <mat-icon>phone</mat-icon>
                    {{ order.shippingAddress.phone }}
                  </div>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Pricing Breakdown -->
        <mat-card class="section-card pricing-section" *ngIf="order.pricing">
          <mat-card-header class="section-header">
            <div class="section-title">
              <mat-icon class="section-icon">calculate</mat-icon>
              <mat-card-title>Pricing Breakdown</mat-card-title>
            </div>
          </mat-card-header>

          <mat-card-content>
            <div class="pricing-breakdown">
              <div class="pricing-row">
                <span class="pricing-label">Subtotal:</span>
                <span class="pricing-value">\${{ (order.pricing.subtotal || 0).toFixed(2) }}</span>
              </div>

              <div class="pricing-row">
                <span class="pricing-label">Tax ({{ ((order.pricing.taxRate || 0) * 100).toFixed(2) }}%):</span>
                <span class="pricing-value">\${{ (order.pricing.taxAmount || 0).toFixed(2) }}</span>
              </div>

              <mat-divider class="pricing-divider"></mat-divider>

              <div class="pricing-row total-row">
                <span class="pricing-label">Total:</span>
                <span class="pricing-value total-amount">\${{ (order.pricing.total || 0).toFixed(2) }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Payment Details -->
        <mat-card class="section-card payment-details-section" *ngIf="order.stripeDetails">
          <mat-card-header class="section-header">
            <div class="section-title">
              <mat-icon class="section-icon">credit_card</mat-icon>
              <mat-card-title>Payment Details</mat-card-title>
            </div>
          </mat-card-header>

          <mat-card-content>
            <div class="payment-details">
              <div class="detail-row" *ngIf="order.stripeDetails.paymentIntentId">
                <span class="detail-label">Payment ID:</span>
                <span class="detail-value mono">{{ order.stripeDetails.paymentIntentId }}</span>
              </div>
              <div class="detail-row" *ngIf="order.stripeDetails.processingFee">
                <span class="detail-label">Processing Fee:</span>
                <span class="detail-value">\${{ order.stripeDetails.processingFee.toFixed(2) }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>

    <!-- Enhanced Loading State -->
    <div class="loading-container" *ngIf="!order && isLoading">
      <mat-spinner diameter="50"></mat-spinner>
      <p>Loading order details...</p>
    </div>

    <!-- Enhanced Error State -->
    <div class="error-state" *ngIf="!order && !isLoading">
      <div class="error-icon-wrapper">
        <mat-icon class="error-icon">error_outline</mat-icon>
      </div>
      <h3>Order Not Found</h3>
      <p>{{ errorMessage || 'The order you are looking for does not exist or you do not have access to it.' }}</p>
      <div class="error-actions">
        <button mat-raised-button color="primary" routerLink="/orders" class="primary-action">
          <mat-icon>arrow_back</mat-icon>
          Back to Orders
        </button>
        <button mat-stroked-button (click)="retryLoad()" *ngIf="errorMessage" class="secondary-action">
          <mat-icon>refresh</mat-icon>
          Try Again
        </button>
      </div>
    </div>
  `,
  styles: [`
    .order-detail-container {
      max-width: none;
      width: 100%;
      margin: 0;
      padding: 24px;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      min-height: 100vh;
    }

    /* Enhanced Page Header */
    .page-header {
      margin-bottom: 32px;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .title-section {
      flex: 1;
    }

    .page-title {
      display: flex;
      align-items: center;
      gap: 16px;
      color: #1a365d;
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0 0 12px 0;
      line-height: 1.2;
    }

    .title-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: #3182ce;
      background: rgba(49, 130, 206, 0.1);
      border-radius: 12px;
      padding: 6px;
    }

    .page-description {
      color: #4a5568;
      font-size: 1.1rem;
      margin: 0;
      line-height: 1.5;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .back-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 500;
      transition: all 0.3s ease;
      height: 48px;
      border: 2px solid #3182ce;
      color: #3182ce;
    }

    .back-button:hover {
      background: #3182ce;
      color: white;
      transform: translateY(-1px);
    }

    /* Status Banner */
    .status-banner {
      margin-bottom: 32px;
    }

    .status-card {
      border-radius: 20px;
      border: none;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .status-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .status-main {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .status-chip-large {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 700;
      padding: 12px 20px;
      border-radius: 25px;
      font-size: 1rem;
      border: 2px solid rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      color: white;
    }

    .status-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .status-description {
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.95rem;
      margin-left: 8px;
    }

    .order-summary {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: flex-end;
    }

    .summary-item {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .summary-label {
      color: rgba(255, 255, 255, 0.8);
      font-weight: 500;
    }

    .summary-value {
      color: white;
      font-weight: 600;
    }

    .summary-value.amount {
      font-size: 1.2rem;
      background: rgba(255, 255, 255, 0.1);
      padding: 6px 12px;
      border-radius: 8px;
    }

    /* Progress Section */
    .progress-section {
      margin-top: 24px;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 12px;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #38a169 0%, #68d391 100%);
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    .progress-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.8);
    }

    /* Content Sections */
    .content-sections {
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
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
    }

    .section-icon {
      color: #3182ce;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .items-summary {
      display: flex;
      align-items: center;
    }

    .summary-text {
      font-size: 0.9rem;
      color: #718096;
      font-weight: 500;
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
      transform: translateY(-1px);
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

    .info-value.amount {
      color: #2f855a;
      font-size: 1.1rem;
    }

    .payment-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .payment-method-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #3182ce;
    }

    .payment-status-chip {
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.8rem;
    }

    .tracking {
      font-family: 'Courier New', monospace;
      background: #e6f3ff;
      padding: 4px 8px;
      border-radius: 4px;
      color: #3182ce;
      font-weight: 500;
    }

    /* Order Statistics */
    .order-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 16px;
      padding: 24px;
      margin-bottom: 20px;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 16px;
      background: #f7fafc;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      transition: all 0.2s ease;
    }

    .stat-item:hover {
      background: #edf2f7;
      transform: translateY(-2px);
    }

    .stat-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon-wrapper.photos {
      background: linear-gradient(135deg, #bee3f8 0%, #90cdf4 100%);
      color: #2c5282;
    }

    .stat-icon-wrapper.prints {
      background: linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%);
      color: #276749;
    }

    .stat-icon-wrapper.sizes {
      background: linear-gradient(135deg, #e9d8fd 0%, #d6bcfa 100%);
      color: #6b46c1;
    }

    .stat-icon-wrapper mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .stat-info {
      text-align: center;
    }

    .stat-number {
      font-size: 1.5rem;
      font-weight: 700;
      color: #2d3748;
      display: block;
      line-height: 1;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #718096;
      font-weight: 500;
    }

    /* Items List */
    .items-list {
      padding: 0 24px 24px 24px;
    }

    .item-panel {
      margin-bottom: 12px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .item-summary {
      display: flex;
      align-items: center;
      gap: 16px;
      width: 100%;
    }

    .item-placeholder {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #e9d8fd 0%, #d6bcfa 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6b46c1;
      flex-shrink: 0;
    }

    .item-placeholder mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .item-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }

    .item-name {
      font-weight: 600;
      color: #2d3748;
      font-size: 1rem;
    }

    .item-subtitle {
      color: #4a5568;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .item-filesize {
      color: #718096;
      font-size: 0.8rem;
    }

    .item-details {
      padding: 20px 0;
    }

    .details-title {
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

    .selections-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .selection-item {
      background: #f7fafc;
      border-radius: 8px;
      padding: 16px;
      border: 1px solid #e2e8f0;
    }

    .selection-main {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .selection-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .size-name {
      font-weight: 600;
      color: #2d3748;
    }

    .quantity {
      color: #4a5568;
      font-size: 0.9rem;
    }

    .selection-pricing {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    .unit-price {
      color: #718096;
      font-size: 0.9rem;
    }

    .line-total {
      font-weight: 600;
      color: #2f855a;
      font-size: 1.1rem;
    }

    /* No Items State */
    .no-items {
      text-align: center;
      padding: 40px 24px;
      color: #718096;
    }

    .no-items-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #e9d8fd 0%, #d6bcfa 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }

    .no-items-icon mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: #6b46c1;
    }

    .no-items h4 {
      color: #2d3748;
      margin: 0 0 8px 0;
    }

    .no-items p {
      margin: 0;
      color: #718096;
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

    /* Pricing Section */
    .pricing-breakdown {
      padding: 24px;
      background: #f7fafc;
      border-radius: 12px;
      margin: 24px;
      border: 1px solid #e2e8f0;
    }

    .pricing-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
    }

    .pricing-divider {
      margin: 16px 0;
    }

    .pricing-row.total-row {
      border-top: 2px solid #e2e8f0;
      padding-top: 16px;
      margin-top: 16px;
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
      font-size: 1.25rem;
      font-weight: 700;
    }

    /* Payment Details */
    .payment-details {
      padding: 24px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #f7fafc;
      border-radius: 8px;
      margin-bottom: 8px;
      border: 1px solid #e2e8f0;
    }

    .detail-label {
      color: #4a5568;
      font-weight: 500;
    }

    .detail-value {
      font-weight: 600;
      color: #2d3748;
    }

    .mono {
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
      background: #e6f3ff;
      padding: 4px 8px;
      border-radius: 4px;
      color: #3182ce;
    }

    /* Status Colors */
    .status-pending {
      background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
      color: #c53030;
    }

    .status-payment-verified {
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

    /* Payment Status Colors */
    .payment-verified {
      background: #c6f6d5;
      color: #276749;
    }

    .payment-pending {
      background: #fed7d7;
      color: #c53030;
    }

    .payment-failed {
      background: #fed7d7;
      color: #c53030;
    }

    /* Enhanced Loading State */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 80px 20px;
      color: #718096;
      background: white;
      border-radius: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      max-width: 400px;
      margin: 0 auto;
    }

    .loading-container mat-spinner {
      margin-bottom: 20px;
    }

    .loading-container p {
      font-size: 1.1rem;
      margin: 0;
    }

    /* Enhanced Error State */
    .error-state {
      text-align: center;
      padding: 80px 20px;
      background: white;
      border-radius: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      max-width: 600px;
      margin: 0 auto;
    }

    .error-icon-wrapper {
      width: 100px;
      height: 100px;
      background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }

    .error-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #c53030;
    }

    .error-state h3 {
      color: #1a365d;
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0 0 12px 0;
    }

    .error-state p {
      color: #4a5568;
      font-size: 1rem;
      margin: 0 0 32px 0;
      line-height: 1.5;
    }

    .error-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .primary-action {
      height: 48px;
      padding: 0 24px;
      border-radius: 8px;
      font-weight: 500;
    }

    .secondary-action {
      height: 48px;
      padding: 0 24px;
      border-radius: 8px;
      font-weight: 500;
      border: 2px solid #3182ce;
      color: #3182ce;
    }

    .secondary-action:hover {
      background: #3182ce;
      color: white;
    }

    /* Responsive Design */
    @media (max-width: 1200px) {
      .order-detail-container {
        padding: 16px;
      }

      .info-grid {
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      }

      .order-stats {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        gap: 20px;
        align-items: stretch;
      }

      .status-content {
        flex-direction: column;
        gap: 20px;
        align-items: stretch;
      }

      .order-summary {
        align-items: stretch;
      }

      .info-grid {
        grid-template-columns: 1fr;
        padding: 16px;
      }

      .order-stats {
        grid-template-columns: 1fr;
        padding: 16px;
      }

      .item-summary {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .selection-main {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .selection-pricing {
        align-items: flex-start;
      }

      .error-actions {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `]
})
export class OrderDetailComponent implements OnInit {
  order: any = null;
  isLoading = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadOrderDetail(params['id']);
      }
    });
  }

  private loadOrderDetail(orderId: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    console.log('Loading order details for:', orderId);

    this.orderService.getOrderDetails(orderId).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Order detail response:', response);

        if (response.success) {
          this.order = response.data;
          console.log('Order loaded successfully:', this.order);
        } else {
          this.errorMessage = response.message || 'Failed to load order details';
          console.error('Order detail error:', response);
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Order detail API error:', error);

        if (error.status === 404) {
          this.errorMessage = 'Order not found';
        } else if (error.status === 403) {
          this.errorMessage = 'You do not have permission to view this order';
        } else {
          this.errorMessage = 'Failed to load order details. Please try again.';
        }

        this.snackBar.open(this.errorMessage, 'Close', { duration: 3000 });
      }
    });
  }

  retryLoad(): void {
    const orderId = this.route.snapshot.params['id'];
    if (orderId) {
      this.loadOrderDetail(orderId);
    }
  }

  // Helper methods for enhanced display
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid Date' :
           date.toLocaleDateString('en-US', {
             month: 'long',
             day: 'numeric',
             year: 'numeric'
           });
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid Date' :
           date.toLocaleDateString('en-US', {
             weekday: 'long',
             year: 'numeric',
             month: 'long',
             day: 'numeric',
             hour: '2-digit',
             minute: '2-digit'
           });
  }

  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'pending': 'Pending Payment',
      'payment_verified': 'Payment Verified',
      'payment_failed': 'Payment Failed',
      'processing': 'Processing',
      'printed': 'Printed',
      'shipped': 'Shipped',
      'completed': 'Completed'
    };
    return statusLabels[status] || status;
  }

  getStatusDescription(status: string): string {
    const descriptions: { [key: string]: string } = {
      'pending': 'Your order is waiting for payment confirmation',
      'payment_verified': 'Payment confirmed, order will be processed soon',
      'processing': 'Your photos are being prepared for printing',
      'printed': 'Your photos have been printed and are being packaged',
      'shipped': 'Your order is on its way to you',
      'completed': 'Your order has been delivered successfully'
    };
    return descriptions[status] || 'Order status information';
  }

  getEnhancedStatusClass(status: string): string {
    return `status-${status.replace('_', '-')}`;
  }

  getStatusIcon(status: string): string {
    const statusIcons: { [key: string]: string } = {
      'pending': 'pending',
      'payment_verified': 'verified',
      'payment_failed': 'error',
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
      'verified': 'Verified',
      'pending': 'Pending',
      'processing': 'Processing',
      'failed': 'Failed',
      'canceled': 'Canceled'
    };
    return statusLabels[status] || status;
  }

  getPaymentStatusClass(status: string): string {
    return `payment-${status}`;
  }

  getPaymentIcon(paymentMethod: string): string {
    return paymentMethod === 'credit_card' ? 'credit_card' : 'store';
  }

  getPaymentLabel(paymentMethod: string): string {
    return paymentMethod === 'credit_card' ? 'Credit Card' : 'Branch Payment';
  }

  getPhotoCount(): number {
    return this.order?.items?.length || this.order?.photoCount || 0;
  }

  getPrintCount(): number {
    if (this.order?.items) {
      return this.order.items.reduce((total: number, item: any) => {
        return total + (item.printSelections?.reduce((sum: number, selection: any) =>
          sum + (selection.quantity || 0), 0) || 0);
      }, 0);
    }
    return this.order?.printCount || 0;
  }

  getUniqueSizeCount(): number {
    if (!this.order?.items) return 0;
    const sizes = new Set();
    this.order.items.forEach((item: any) => {
      item.printSelections?.forEach((print: any) => {
        sizes.add(print.sizeName);
      });
    });
    return sizes.size;
  }

  trackByItemId(index: number, item: any): any {
    return item.photoId || index;
  }
}
