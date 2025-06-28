
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../../../core/services/admin.service';
import { OrderDetailsDialogComponent } from '../order-details-dialog/order-details-dialog.component';
import { OrderStatusDialogComponent } from '../order-status-dialog/order-status-dialog.component';

@Component({
  selector: 'app-admin-orders',
  standalone: false,
  template: `
    <div class="admin-orders-container">
      <!-- Enhanced Header Section -->
      <div class="page-header">
        <div class="header-content">
          <div class="title-section">
            <h1 class="page-title">
              <mat-icon class="title-icon">assignment</mat-icon>
              Order Management
            </h1>
            <p class="page-description">Manage and track all customer orders across the platform</p>
          </div>

          <div class="header-actions">
            <button mat-stroked-button (click)="refreshOrders()" [disabled]="isLoading" class="refresh-button">
              <mat-icon>refresh</mat-icon>
              Refresh Data
            </button>
          </div>
        </div>

        <!-- FIXED: Enhanced Filter Section with proper icon display -->
        <div class="filter-section">
          <mat-card class="filter-card">
            <mat-card-content>
              <div class="filter-content">
                <div class="filter-group">
                  <mat-form-field appearance="outline" class="status-filter">
                    <mat-label>Filter by Status</mat-label>
                    <mat-select [(value)]="selectedStatus" (selectionChange)="onStatusFilter()">
                      <!-- FIXED: Simplified option structure to prevent icon-to-text conversion -->
                      <mat-option value="">
                        All Orders
                      </mat-option>
                      <mat-option value="pending">
                        Pending Payment
                      </mat-option>
                      <mat-option value="payment_verified">
                        Payment Verified
                      </mat-option>
                      <mat-option value="processing">
                        Processing
                      </mat-option>
                      <mat-option value="printed">
                        Printed
                      </mat-option>
                      <mat-option value="shipped">
                        Shipped
                      </mat-option>
                      <mat-option value="completed">
                        Completed
                      </mat-option>
                    </mat-select>

                    <!-- FIXED: Add custom trigger to display proper icon when selected -->
                    <mat-select-trigger *ngIf="selectedStatus">
                      <div class="selected-filter-display">
                        <mat-icon class="selected-filter-icon">{{ getFilterIcon(selectedStatus) }}</mat-icon>
                        <span>{{ getFilterLabel(selectedStatus) }}</span>
                      </div>
                    </mat-select-trigger>
                  </mat-form-field>
                </div>

                <div class="filter-results">
                  <span class="results-text">
                    Showing {{ orders.length }} of {{ totalOrders }} orders
                    <span *ngIf="selectedStatus" class="filter-indicator">
                      (filtered by {{ getFilterLabel(selectedStatus) }})
                    </span>
                  </span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

      <!-- Enhanced Quick Stats -->
      <div class="quick-stats" *ngIf="quickStats">
        <div class="stats-grid">
          <mat-card class="stat-card priority-stat" [class.highlight]="quickStats.pending > 0">
            <mat-card-content>
              <div class="stat-content">
                <div class="stat-icon-wrapper priority-bg">
                  <mat-icon class="stat-icon">priority_high</mat-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-number priority-number">{{ quickStats.pending }}</div>
                  <div class="stat-label">Needs Attention</div>
                  <div class="stat-description">Pending payment verification</div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card processing-stat">
            <mat-card-content>
              <div class="stat-content">
                <div class="stat-icon-wrapper processing-bg">
                  <mat-icon class="stat-icon">sync</mat-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-number processing-number">{{ quickStats.processing }}</div>
                  <div class="stat-label">In Progress</div>
                  <div class="stat-description">Currently being processed</div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card success-stat">
            <mat-card-content>
              <div class="stat-content">
                <div class="stat-icon-wrapper success-bg">
                  <mat-icon class="stat-icon">task_alt</mat-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-number success-number">{{ quickStats.completedToday }}</div>
                  <div class="stat-label">Completed Today</div>
                  <div class="stat-description">Successfully delivered</div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card revenue-stat">
            <mat-card-content>
              <div class="stat-content">
                <div class="stat-icon-wrapper revenue-bg">
                  <mat-icon class="stat-icon">attach_money</mat-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-number revenue-number">{{ (quickStats.totalRevenue || 0).toFixed(0) }}</div>
                  <div class="stat-label">Total Revenue</div>
                  <div class="stat-description">Today</div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <!-- FIXED: Widened Orders Table with Full Width -->
      <div class="orders-table-section">
        <mat-card class="orders-table-card">
          <div class="table-header">
            <div class="table-title">
              <mat-icon>list_alt</mat-icon>
              <h2>Orders Management</h2>
            </div>
            <div class="table-meta">
              <span class="total-count">{{ totalOrders }} total orders</span>
            </div>
          </div>

          <!-- FIXED: Full width table container without constraints -->
          <div class="table-container-wrapper">
            <div class="table-container">
              <table mat-table [dataSource]="orders" class="orders-table">
                <!-- Order Number Column -->
                <ng-container matColumnDef="orderNumber">
                  <th mat-header-cell *matHeaderCellDef class="order-number-header">Order #</th>
                  <td mat-cell *matCellDef="let order" class="order-number-cell">
                    <div class="order-number-content">
                      <span class="order-number">{{ order.orderNumber }}</span>
                      <span class="order-id">{{ order.orderId.substring(0, 8) }}...</span>
                    </div>
                  </td>
                </ng-container>

                <!-- Customer Column -->
                <ng-container matColumnDef="customer">
                  <th mat-header-cell *matHeaderCellDef class="customer-header">Customer</th>
                  <td mat-cell *matCellDef="let order" class="customer-cell">
                    <div class="customer-info">
                      <div class="customer-avatar">
                        <mat-icon>account_circle</mat-icon>
                      </div>
                      <div class="customer-details">
                        <span class="customer-name">{{ order.customerName }}</span>
                        <span class="customer-email">{{ order.customerEmail }}</span>
                      </div>
                    </div>
                  </td>
                </ng-container>

                <!-- Date Column -->
                <ng-container matColumnDef="orderDate">
                  <th mat-header-cell *matHeaderCellDef class="date-header">Order Date</th>
                  <td mat-cell *matCellDef="let order" class="date-cell">
                    <div class="date-info">
                      <span class="date-primary">{{ formatDate(order.orderDate) }}</span>
                      <span class="date-relative">{{ getRelativeDate(order.orderDate) }}</span>
                    </div>
                  </td>
                </ng-container>

                <!-- Enhanced Status Column -->
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef class="status-header">Status</th>
                  <td mat-cell *matCellDef="let order" class="status-cell">
                    <div class="status-container">
                      <mat-chip [class]="getEnhancedStatusClass(order.status)" class="enhanced-status-chip">
                        <mat-icon class="status-icon">{{ getStatusIcon(order.status) }}</mat-icon>
                        <span>{{ getStatusLabel(order.status) }}</span>
                      </mat-chip>
                      <div class="status-progress" [class]="getStatusProgressClass(order.status)"></div>
                    </div>
                  </td>
                </ng-container>

                <!-- Payment Column -->
                <ng-container matColumnDef="paymentMethod">
                  <th mat-header-cell *matHeaderCellDef class="payment-header">Payment</th>
                  <td mat-cell *matCellDef="let order" class="payment-cell">
                    <div class="payment-info">
                      <div class="payment-method">
                        <mat-icon [class]="getPaymentIconClass(order.paymentMethod)">
                          {{ getPaymentIcon(order.paymentMethod) }}
                        </mat-icon>
                        <span>{{ getPaymentLabel(order.paymentMethod) }}</span>
                      </div>
                      <div class="payment-status" [class]="getPaymentStatusClass(order.paymentStatus)">
                        {{ getPaymentStatusLabel(order.paymentStatus) }}
                      </div>
                    </div>
                  </td>
                </ng-container>

                <!-- Items Column -->
                <ng-container matColumnDef="items">
                  <th mat-header-cell *matHeaderCellDef class="items-header">Items</th>
                  <td mat-cell *matCellDef="let order" class="items-cell">
                    <div class="items-info">
                      <div class="item-stat">
                        <mat-icon>photo_library</mat-icon>
                        <span>{{ order.photoCount }} photos</span>
                      </div>
                      <div class="item-stat">
                        <mat-icon>print</mat-icon>
                        <span>{{ order.printCount }} prints</span>
                      </div>
                    </div>
                  </td>
                </ng-container>

                <!-- Total Column -->
                <ng-container matColumnDef="totalAmount">
                  <th mat-header-cell *matHeaderCellDef class="total-header">Total</th>
                  <td mat-cell *matCellDef="let order" class="total-cell">
                    <span class="order-total">\${{ order.totalAmount.toFixed(2) }}</span>
                  </td>
                </ng-container>

                <!-- Enhanced Actions Column -->
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef class="actions-header">Actions</th>
                  <td mat-cell *matCellDef="let order" class="actions-cell">
                    <div class="action-buttons">
                      <!-- Primary Action - Status Update -->
                      <button mat-mini-fab
                              color="primary"
                              (click)="updateOrderStatus(order)"
                              [disabled]="!canUpdateStatus(order)"
                              [class.disabled-action]="!canUpdateStatus(order)"
                              matTooltip="{{ getUpdateStatusTooltip(order) }}"
                              class="action-button primary-action">
                        <mat-icon>edit</mat-icon>
                      </button>

                      <!-- View Details -->
                      <button mat-mini-fab
                              color="accent"
                              (click)="viewOrderDetails(order)"
                              matTooltip="View Order Details"
                              class="action-button details-action">
                        <mat-icon>visibility</mat-icon>
                      </button>

                      <!-- Quick Actions Menu -->
                      <button mat-mini-fab
                              [matMenuTriggerFor]="quickActionsMenu"
                              matTooltip="Quick Actions"
                              class="action-button menu-action">
                        <mat-icon>more_vert</mat-icon>
                      </button>

                      <mat-menu #quickActionsMenu="matMenu" class="quick-actions-menu">
                        <button mat-menu-item
                                *ngIf="order.status === 'pending'"
                                (click)="quickStatusUpdate(order, 'payment_verified')">
                          <mat-icon>payment</mat-icon>
                          <span>Verify Payment</span>
                        </button>
                        <button mat-menu-item
                                *ngIf="order.status === 'payment_verified'"
                                (click)="quickStatusUpdate(order, 'processing')">
                          <mat-icon>play_arrow</mat-icon>
                          <span>Start Processing</span>
                        </button>
                        <button mat-menu-item
                                *ngIf="order.status === 'processing'"
                                (click)="quickStatusUpdate(order, 'printed')">
                          <mat-icon>print</mat-icon>
                          <span>Mark as Printed</span>
                        </button>
                        <button mat-menu-item
                                *ngIf="order.status === 'printed'"
                                (click)="quickStatusUpdate(order, 'shipped')">
                          <mat-icon>local_shipping</mat-icon>
                          <span>Mark as Shipped</span>
                        </button>
                        <button mat-menu-item
                                *ngIf="order.status === 'shipped'"
                                (click)="completeOrder(order)">
                          <mat-icon>check_circle</mat-icon>
                          <span>Complete Order</span>
                        </button>
                      </mat-menu>
                    </div>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns" class="table-header-row"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                    class="table-data-row"
                    [class.priority-row]="row.status === 'pending'"
                    [class.processing-row]="row.status === 'processing'"></tr>
              </table>
            </div>
          </div>

          <!-- Enhanced Pagination -->
          <div class="pagination-container">
            <div class="pagination-info">
              <span>Showing {{ getStartIndex() }} - {{ getEndIndex() }} of {{ totalOrders }} orders</span>
            </div>
            <mat-paginator
              [length]="totalOrders"
              [pageSize]="pageSize"
              [pageSizeOptions]="[10, 25, 50, 100]"
              (page)="onPageChange($event)"
              showFirstLastButtons
              class="enhanced-paginator">
            </mat-paginator>
          </div>
        </mat-card>
      </div>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="isLoading && orders.length === 0">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading orders...</p>
      </div>
    </div>
  `,
  styles: [`
    .admin-orders-container {
      max-width: none; /* FIXED: Remove max-width constraint */
      width: 100%; /* FIXED: Full width */
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

    .refresh-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 500;
      border: 2px solid #3182ce;
      color: #3182ce;
      transition: all 0.3s ease;
    }

    .refresh-button:hover {
      background: #3182ce;
      color: white;
      transform: translateY(-1px);
    }

    /* Enhanced Filter Section */
    .filter-section {
      margin-bottom: 24px;
    }

    .filter-card {
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
    }

    .filter-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
    }

    .filter-group {
      display: flex;
      gap: 16px;
      align-items: center;
    }

    .status-filter {
      min-width: 250px;
    }

    .filter-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
    }

    .filter-option mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .status-icon.pending-icon { color: #e53e3e; }
    .status-icon.verified-icon { color: #3182ce; }
    .status-icon.processing-icon { color: #805ad5; }
    .status-icon.printed-icon { color: #38a169; }
    .status-icon.shipped-icon { color: #3182ce; }
    .status-icon.completed-icon { color: #2f855a; }

    .filter-results {
      color: #718096;
      font-size: 0.9rem;
    }

    .filter-indicator {
      color: #3182ce;
      font-weight: 500;
    }

    /* Enhanced Quick Stats */
    .quick-stats {
      margin-bottom: 32px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
    }

    .stat-card {
      border-radius: 16px;
      border: none;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
      overflow: hidden;
      position: relative;
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #3182ce 0%, #667eea 100%);
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 40px rgba(0, 0, 0, 0.12);
    }

    .stat-card.highlight {
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }

    .stat-content {
      display: flex;
      align-items: center;
      padding: 24px;
      gap: 20px;
    }

    .stat-icon-wrapper {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: white;
    }

    .stat-info {
      flex: 1;
      min-width: 0;
    }

    .stat-number {
      font-size: 2rem;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 4px;
    }

    .stat-label {
      color: #4a5568;
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 2px;
    }

    .stat-description {
      color: #718096;
      font-size: 0.85rem;
      line-height: 1.3;
    }

    .priority-stat::before { background: linear-gradient(90deg, #e53e3e 0%, #fc8181 100%); }
    .priority-bg { background: linear-gradient(135deg, #fed7d7 0%, #e53e3e 100%); }
    .priority-number { color: #c53030; }

    .processing-stat::before { background: linear-gradient(90deg, #805ad5 0%, #b794f6 100%); }
    .processing-bg { background: linear-gradient(135deg, #e9d8fd 0%, #805ad5 100%); }
    .processing-number { color: #6b46c1; }

    .success-stat::before { background: linear-gradient(90deg, #38a169 0%, #68d391 100%); }
    .success-bg { background: linear-gradient(135deg, #c6f6d5 0%, #38a169 100%); }
    .success-number { color: #2f855a; }

    .revenue-stat::before { background: linear-gradient(90deg, #3182ce 0%, #63b3ed 100%); }
    .revenue-bg { background: linear-gradient(135deg, #bee3f8 0%, #3182ce 100%); }
    .revenue-number { color: #2c5282; }

    /* FIXED: Enhanced Table Section with Full Width */
    .orders-table-section {
      width: 100%; /* FIXED: Full width */
      margin-bottom: 32px;
    }

    .orders-table-card {
      border-radius: 20px;
      border: none;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      width: 100%; /* FIXED: Full width */
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .table-title {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .table-title mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .table-title h2 {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0;
    }

    .table-meta {
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.9rem;
      font-weight: 500;
    }

    /* FIXED: Table Container - Full Width Without Constraints */
    .table-container-wrapper {
      width: 100%; /* FIXED: Full width */
      overflow: visible; /* FIXED: Allow natural overflow */
    }

    .table-container {
      width: 100%; /* FIXED: Full width */
      overflow-x: auto; /* FIXED: Only horizontal scroll when needed */
      background: white;
    }

    .orders-table {
      width: 100%; /* FIXED: Full table width */
      min-width: 1200px; /* FIXED: Minimum width for proper column display */
      border-collapse: separate;
      border-spacing: 0;
    }

    /* Enhanced Table Headers */
    .table-header-row {
      background: #f7fafc;
      height: 64px;
    }

    .table-header-row th {
      border-bottom: 2px solid #e2e8f0;
      color: #2d3748;
      font-weight: 600;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 16px;
    }

    /* Enhanced Table Rows */
    .table-data-row {
      transition: all 0.2s ease;
      border-bottom: 1px solid #f7fafc;
      height: 80px;
    }

    .table-data-row:hover {
      background-color: #f7fafc;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .priority-row {
      border-left: 4px solid #e53e3e;
      background: linear-gradient(90deg, #fed7d7 0%, transparent 2%);
    }

    .processing-row {
      border-left: 4px solid #805ad5;
      background: linear-gradient(90deg, #e9d8fd 0%, transparent 2%);
    }

    /* FIXED: Enhanced Column Styles with Better Spacing */
    .orders-table td {
      padding: 16px;
      vertical-align: middle;
      border-bottom: 1px solid #f7fafc;
    }

    .order-number-cell {
      min-width: 150px;
    }

    .order-number-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .order-number {
      font-weight: 600;
      color: #3182ce;
      font-size: 1rem;
      cursor: pointer;
      transition: color 0.2s ease;
    }

    .order-number:hover {
      color: #2c5282;
      text-decoration: underline;
    }

    .order-id {
      font-size: 0.75rem;
      color: #718096;
      font-family: 'Courier New', monospace;
      background: #f7fafc;
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-block;
    }

    .customer-cell {
      min-width: 220px;
    }

    .customer-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .customer-avatar {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #3182ce 0%, #667eea 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .customer-avatar mat-icon {
      color: white;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .customer-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .customer-name {
      font-weight: 500;
      color: #2d3748;
      font-size: 0.95rem;
    }

    .customer-email {
      color: #718096;
      font-size: 0.85rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .date-cell {
      min-width: 130px;
    }

    .date-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .date-primary {
      font-weight: 500;
      color: #2d3748;
      font-size: 0.9rem;
    }

    .date-relative {
      font-size: 0.8rem;
      color: #718096;
    }

    .status-cell {
      min-width: 160px;
    }

    .status-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .enhanced-status-chip {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 0.85rem;
      min-height: 36px;
      border: 1px solid transparent;
      transition: all 0.3s ease;
    }

    .enhanced-status-chip:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .status-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .status-progress {
      height: 3px;
      border-radius: 2px;
      background: #e2e8f0;
      position: relative;
      overflow: hidden;
    }

    .status-progress::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      border-radius: 2px;
      transition: width 0.3s ease;
    }

    .status-progress.pending-progress::after {
      width: 15%;
      background: #e53e3e;
    }

    .status-progress.verified-progress::after {
      width: 30%;
      background: #3182ce;
    }

    .status-progress.processing-progress::after {
      width: 60%;
      background: #805ad5;
    }

    .status-progress.printed-progress::after {
      width: 80%;
      background: #38a169;
    }

    .status-progress.shipped-progress::after {
      width: 95%;
      background: #3182ce;
    }

    .status-progress.completed-progress::after {
      width: 100%;
      background: #2f855a;
    }

    /* Status Colors */
    .status-pending {
      background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
      color: #c53030;
      border-color: #fc8181;
    }

    .status-payment-verified {
      background: linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%);
      color: #1d4ed8;
      border-color: #60a5fa;
    }

    .status-processing {
      background: linear-gradient(135deg, #e9d8fd 0%, #d6bcfa 100%);
      color: #6b46c1;
      border-color: #b794f6;
    }

    .status-printed {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      color: #92400e;
      border-color: #f59e0b;
    }

    .status-shipped {
      background: linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%);
      color: #1e40af;
      border-color: #3b82f6;
    }

    .status-completed {
      background: linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%);
      color: #065f46;
      border-color: #10b981;
    }

    .payment-cell {
      min-width: 140px;
    }

    .payment-info {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .payment-method {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
    }

    .payment-method mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .payment-method .credit-card-icon {
      color: #3182ce;
    }

    .payment-method .branch-payment-icon {
      color: #805ad5;
    }

    .payment-status {
      font-size: 0.8rem;
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 500;
      text-align: center;
    }

    .payment-status.verified {
      background: #c6f6d5;
      color: #276749;
    }

    .payment-status.pending {
      background: #fed7d7;
      color: #c53030;
    }

    .payment-status.failed {
      background: #fed7d7;
      color: #c53030;
    }

    .items-cell {
      min-width: 120px;
    }

    .items-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .item-stat {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      color: #4a5568;
    }

    .item-stat mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #718096;
    }

    .total-cell {
      min-width: 100px;
      text-align: right;
    }

    .order-total {
      font-weight: 700;
      color: #2f855a;
      font-size: 1.1rem;
      background: #f0fff4;
      padding: 6px 12px;
      border-radius: 8px;
      display: inline-block;
    }

    .actions-cell {
      min-width: 180px;
    }

    .action-buttons {
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: flex-end;
    }

    .action-button {
      min-width: 40px;
      height: 40px;
      transition: all 0.3s ease;
    }

    .action-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .disabled-action {
      opacity: 0.4;
      background-color: #e2e8f0 !important;
      color: #a0aec0 !important;
      cursor: not-allowed;
    }

    .primary-action {
      background-color: #3182ce !important;
    }

    .details-action {
      background-color: #805ad5 !important;
    }

    .menu-action {
      background-color: #718096 !important;
    }

    /* FIXED: Additional styles for proper filter display */
.selected-filter-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.selected-filter-icon {
  font-size: 18px;
  width: 18px;
  height: 18px;
  color: #3182ce;
}

.selected-filter-display span {
  color: #2d3748;
  font-weight: 500;
}

/* Enhanced mat-select trigger styles */
.status-filter .mat-mdc-select-trigger {
  display: flex;
  align-items: center;
  min-height: 24px;
}

.status-filter .mat-mdc-select-placeholder {
  color: #718096;
}

.status-filter .mat-mdc-select-value {
  display: flex;
  align-items: center;
}

/* Option styles in dropdown */
.status-filter .mat-mdc-option {
  display: flex;
  align-items: center;
  min-height: 48px;
  padding: 0 16px;
}

.status-filter .mat-mdc-option .mdc-list-item__primary-text {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Ensure icons in dropdown don't interfere with selection */
.status-filter .mat-mdc-option mat-icon {
  margin-right: 8px;
  color: #718096;
}

    /* Enhanced Pagination */
    .pagination-container {
      background: #f7fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 32px;
    }

    .pagination-info {
      color: #718096;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .enhanced-paginator {
      background: transparent;
    }

    /* Loading State */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 80px 20px;
      color: #718096;
    }

    .loading-container mat-spinner {
      margin-bottom: 20px;
    }

    .loading-container p {
      font-size: 1.1rem;
      margin: 0;
    }

    /* Responsive Design */
    @media (max-width: 1400px) {
      .admin-orders-container {
        padding: 16px;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        gap: 20px;
        align-items: stretch;
      }

      .filter-content {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .table-header {
        padding: 20px;
      }

      .pagination-container {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }
    }
  `]
})
export class AdminOrdersComponent implements OnInit {
  orders: any[] = [];
  totalOrders = 0;
  pageSize = 25;
  currentPage = 1;
  selectedStatus = '';
  quickStats: any = null;
  isLoading = false;

  displayedColumns = [
    'orderNumber',
    'customer',
    'orderDate',
    'status',
    'paymentMethod',
    'items',
    'totalAmount',
    'actions'
  ];

  constructor(
    private adminService: AdminService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.loadQuickStats();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.adminService.getOrders(this.selectedStatus, this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.orders = response.data.items;
          this.totalOrders = response.data.totalCount;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.snackBar.open('Failed to load orders', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  loadQuickStats(): void {
    Promise.all([
      this.adminService.getOrders('pending', 1, 1).toPromise(),
      this.adminService.getOrders('processing', 1, 1).toPromise(),
      this.adminService.getDashboardStats().toPromise()
    ]).then(([pendingRes, processingRes, dashboardRes]) => {
      this.quickStats = {
        pending: pendingRes?.data?.totalCount || 0,
        processing: processingRes?.data?.totalCount || 0,
        completedToday: dashboardRes?.data?.completedToday || 0,
        totalRevenue: dashboardRes?.data?.totalRevenue || 0
      };
    }).catch(() => {
      // Ignore errors for quick stats
    });
  }

  refreshOrders(): void {
    this.loadOrders();
    this.loadQuickStats();
  }

  onStatusFilter(): void {
    this.currentPage = 1;
    this.loadOrders();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadOrders();
  }

  updateOrderStatus(order: any): void {
    const dialogRef = this.dialog.open(OrderStatusDialogComponent, {
      width: '600px',
      data: { order }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadOrders();
        this.loadQuickStats();
      }
    });
  }

  viewOrderDetails(order: any): void {
    this.adminService.getOrderDetails(order.orderId).subscribe({
      next: (response) => {
        if (response.success) {
          this.dialog.open(OrderDetailsDialogComponent, {
            width: '900px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            data: { order: response.data }
          });
        }
      },
      error: () => {
        this.dialog.open(OrderDetailsDialogComponent, {
          width: '900px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          data: { order }
        });
      }
    });
  }

  quickStatusUpdate(order: any, newStatus: string): void {
    const statusMessages: { [key: string]: string } = {
      'payment_verified': 'Payment verified and ready for processing',
      'processing': 'Order moved to processing queue',
      'printed': 'Order has been printed and ready for shipping',
      'shipped': 'Order has been shipped to customer'
    };

    this.adminService.updateOrderStatus(order.orderId, newStatus, statusMessages[newStatus]).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open(
            `Order ${order.orderNumber} updated to ${this.getStatusLabel(newStatus)}`,
            'Close',
            {
              duration: 3000,
              panelClass: ['success-snackbar']
            }
          );
          this.loadOrders();
          this.loadQuickStats();
        }
      },
      error: () => {
        this.snackBar.open('Failed to update order status', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  completeOrder(order: any): void {
    if (confirm(`Mark order ${order.orderNumber} as completed? This will delete all associated photos.`)) {
      const completionData = {
        shippingDate: new Date().toISOString(),
        notes: 'Order completed and photos scheduled for deletion'
      };

      this.adminService.completeOrder(order.orderId, completionData).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Order completed successfully', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.loadOrders();
            this.loadQuickStats();
          }
        },
        error: () => {
          this.snackBar.open('Failed to complete order', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  // Helper methods
  // FIXED: Add these helper methods for proper filter display
  getFilterIcon(status: string): string {
    const filterIcons: { [key: string]: string } = {
      '': 'view_list',
      'pending': 'pending',
      'payment_verified': 'verified',
      'processing': 'autorenew',
      'printed': 'print',
      'shipped': 'local_shipping',
      'completed': 'check_circle'
    };
    return filterIcons[status] || 'view_list';
  }

  getFilterLabel(status: string): string {
    const filterLabels: { [key: string]: string } = {
      '': 'All Orders',
      'pending': 'Pending Payment',
      'payment_verified': 'Payment Verified',
      'processing': 'Processing',
      'printed': 'Printed',
      'shipped': 'Shipped',
      'completed': 'Completed'
    };
    return filterLabels[status] || 'All Orders';
  }
  canUpdateStatus(order: any): boolean {
    return order.status !== 'completed';
  }

  getUpdateStatusTooltip(order: any): string {
    if (!this.canUpdateStatus(order)) {
      return 'Completed orders cannot be modified';
    }
    return 'Update order status';
  }

  getStartIndex(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalOrders);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getRelativeDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return `${diffDays - 1} days ago`;
    }
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

  getStatusProgressClass(status: string): string {
    return `${status.replace('_', '-')}-progress`;
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

  getPaymentIcon(paymentMethod: string): string {
    return paymentMethod === 'credit_card' ? 'credit_card' : 'store';
  }

  getPaymentIconClass(paymentMethod: string): string {
    return paymentMethod === 'credit_card' ? 'credit-card-icon' : 'branch-payment-icon';
  }

  getPaymentLabel(paymentMethod: string): string {
    return paymentMethod === 'credit_card' ? 'Credit Card' : 'Branch Payment';
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
    return status || 'pending';
  }
}
