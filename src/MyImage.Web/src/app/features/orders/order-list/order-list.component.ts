
import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../shared/models/order.models';

@Component({
  selector: 'app-order-list',
  standalone: false,
  template: `
    <div class="orders-container">
      <!-- Enhanced Header Section -->
      <div class="page-header">
        <div class="header-content">
          <div class="title-section">
            <h1 class="page-title">
              <mat-icon class="title-icon">receipt_long</mat-icon>
              My Orders
            </h1>
            <p class="page-description">View and track all your photo printing orders</p>
          </div>

          <div class="header-actions">
            <button mat-raised-button color="primary" routerLink="/photos" class="new-order-btn">
              <mat-icon>add_photo_alternate</mat-icon>
              <span>Create New Order</span>
            </button>
          </div>
        </div>

        <!-- Enhanced Filter Section -->
        <div class="filter-section" *ngIf="allOrders.length > 0">
          <mat-card class="filter-card">
            <mat-card-content>
              <div class="filter-content">
                <div class="filter-group">
                  <mat-form-field appearance="outline" class="status-filter">
                    <mat-label>Filter by Status</mat-label>
                    <mat-select [(value)]="selectedStatus" (selectionChange)="onStatusFilter()">
                      <mat-option value="">All Orders</mat-option>
                      <mat-option value="pending">Pending Payment</mat-option>
                      <mat-option value="payment_verified">Payment Verified</mat-option>
                      <mat-option value="processing">Processing</mat-option>
                      <mat-option value="printed">Printed</mat-option>
                      <mat-option value="shipped">Shipped</mat-option>
                      <mat-option value="completed">Completed</mat-option>
                    </mat-select>

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
                    Showing {{ orders.length }}
                    <span *ngIf="selectedStatus">of {{ allOrders.length }}</span>
                    <span *ngIf="!selectedStatus">of {{ totalOrders }}</span>
                    orders
                    <span *ngIf="selectedStatus" class="filter-indicator">
                      (filtered by {{ getFilterLabel(selectedStatus) }})
                    </span>
                  </span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <!-- Enhanced Orders Table -->
      <div class="orders-table-section" *ngIf="orders.length > 0">
        <mat-card class="orders-table-card">
          <div class="table-header">
            <div class="table-title">
              <mat-icon>list_alt</mat-icon>
              <h2>Order History</h2>
            </div>
            <div class="table-meta">
              <span class="total-count">{{ totalOrders }} total orders</span>
            </div>
          </div>

          <div class="table-container-wrapper">
            <div class="table-container">
              <table mat-table [dataSource]="orders" class="orders-table">
                <!-- Order Number Column -->
                <ng-container matColumnDef="orderNumber">
                  <th mat-header-cell *matHeaderCellDef class="order-number-header">Order #</th>
                  <td mat-cell *matCellDef="let order" class="order-number-cell">
                    <div class="order-number-content">
                      <a [routerLink]="['/orders', order.orderId]" class="order-number-link">
                        {{ order.orderNumber }}
                      </a>
                      <span class="order-id">{{ order.orderId.substring(0, 8) }}...</span>
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
                      <div class="payment-status" [class]="getPaymentStatusClass(order.paymentStatus || 'verified')">
                        {{ getPaymentStatusLabel(order.paymentStatus || 'verified') }}
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
                      <button mat-mini-fab
                              color="primary"
                              [routerLink]="['/orders', order.orderId]"
                              matTooltip="View Order Details"
                              class="action-button details-action">
                        <mat-icon>visibility</mat-icon>
                      </button>
                    </div>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns" class="table-header-row"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                    class="table-data-row"
                    [class.completed-row]="row.status === 'completed'"
                    [routerLink]="['/orders', row.orderId]"></tr>
              </table>
            </div>
          </div>

          <!-- Enhanced Pagination -->
          <div class="pagination-container" *ngIf="totalOrders > pageSize && !selectedStatus">
            <div class="pagination-info">
              <span>Showing {{ getStartIndex() }} - {{ getEndIndex() }} of {{ totalOrders }} orders</span>
            </div>
            <mat-paginator
              [length]="totalOrders"
              [pageSize]="pageSize"
              [pageSizeOptions]="[10, 20, 50]"
              (page)="onPageChange($event)"
              showFirstLastButtons
              class="enhanced-paginator">
            </mat-paginator>
          </div>

          <!-- Filter Info when filtering is active -->
          <div class="filter-info-container" *ngIf="selectedStatus && orders.length > 0">
            <div class="filter-info">
              <mat-icon>filter_list</mat-icon>
              <span>Showing all {{ orders.length }} {{ getFilterLabel(selectedStatus).toLowerCase() }} orders</span>
            </div>
          </div>
        </mat-card>
      </div>

      <!-- Enhanced Empty State -->
      <div class="empty-state" *ngIf="orders.length === 0 && !isLoading">
        <div class="empty-icon-wrapper">
          <mat-icon class="empty-icon">receipt_long</mat-icon>
        </div>
        <h3>No Orders Yet</h3>
        <p>Start by uploading photos and placing your first order to see them here</p>
        <div class="empty-actions">
          <button mat-raised-button color="primary" routerLink="/photos" class="primary-action">
            <mat-icon>photo_library</mat-icon>
            Browse Photos
          </button>
          <button mat-stroked-button routerLink="/public/how-it-works" class="secondary-action">
            <mat-icon>help_outline</mat-icon>
            How It Works
          </button>
        </div>
      </div>

      <!-- Enhanced Loading State -->
      <div class="loading-container" *ngIf="isLoading">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading your orders...</p>
      </div>
    </div>
  `,
  styles: [`
    .orders-container {
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

    .new-order-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 500;
      transition: all 0.3s ease;
      height: 48px;
    }

    .new-order-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(49, 130, 206, 0.3);
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

    .filter-results {
      color: #718096;
      font-size: 0.9rem;
    }

    .filter-indicator {
      color: #3182ce;
      font-weight: 500;
    }

    /* Enhanced Table Section */
    .orders-table-section {
      width: 100%;
      margin-bottom: 32px;
    }

    .orders-table-card {
      border-radius: 20px;
      border: none;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      width: 100%;
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

    .table-container-wrapper {
      width: 100%;
      overflow: visible;
    }

    .table-container {
      width: 100%;
      overflow-x: auto;
      background: white;
    }

    .orders-table {
      width: 100%;
      min-width: 1000px;
      border-collapse: separate;
      border-spacing: 0;
    }

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

    .table-data-row {
      transition: all 0.2s ease;
      border-bottom: 1px solid #f7fafc;
      height: 80px;
      cursor: pointer;
    }

    .table-data-row:hover {
      background-color: #f7fafc;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .completed-row {
      border-left: 4px solid #38a169;
      background: linear-gradient(90deg, #c6f6d5 0%, transparent 2%);
    }

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

    .order-number-link {
      font-weight: 600;
      color: #3182ce;
      font-size: 1rem;
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .order-number-link:hover {
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

    .pending-progress::after { width: 15%; background: #e53e3e; }
    .verified-progress::after { width: 30%; background: #3182ce; }
    .processing-progress::after { width: 60%; background: #805ad5; }
    .printed-progress::after { width: 80%; background: #38a169; }
    .shipped-progress::after { width: 95%; background: #3182ce; }
    .completed-progress::after { width: 100%; background: #2f855a; }

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
      min-width: 140px;
    }

    .action-buttons {
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: flex-end;
    }

    .action-button {
      min-width: 36px;
      height: 36px;
      transition: all 0.2s ease;
    }

    .action-button:hover {
      transform: scale(1.05);
    }

    .details-action {
      background-color: #3182ce !important;
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

    /* Filter Info */
    .filter-info-container {
      background: #f7fafc;
      border-top: 1px solid #e2e8f0;
      padding: 16px 32px;
      text-align: center;
    }

    .filter-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #4a5568;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .filter-info mat-icon {
      color: #3182ce;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* Enhanced Empty State */
    .empty-state {
      text-align: center;
      padding: 80px 20px;
      background: white;
      border-radius: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      max-width: 600px;
      margin: 0 auto;
    }

    .empty-icon-wrapper {
      width: 100px;
      height: 100px;
      background: linear-gradient(135deg, #e9d8fd 0%, #d6bcfa 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }

    .empty-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #6b46c1;
    }

    .empty-state h3 {
      color: #1a365d;
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0 0 12px 0;
    }

    .empty-state p {
      color: #4a5568;
      font-size: 1rem;
      margin: 0 0 32px 0;
      line-height: 1.5;
    }

    .empty-actions {
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

    /* Responsive Design */
    @media (max-width: 1400px) {
      .orders-container {
        padding: 16px;
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

      .table-header {
        padding: 20px;
      }

      .pagination-container {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .empty-actions {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `]
})
export class OrderListComponent implements OnInit {
  orders: Order[] = [];
  allOrders: Order[] = []; // Store all orders for filtering
  totalOrders = 0;
  pageSize = 10;
  currentPage = 1;
  isLoading = false;
  selectedStatus = '';

  displayedColumns = [
    'orderNumber',
    'orderDate',
    'status',
    'items',
    'paymentMethod',
    'totalAmount',
    'actions'
  ];

  constructor(
    private orderService: OrderService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;

    this.orderService.getOrders(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.allOrders = response.data.items; // Store all orders
          this.totalOrders = response.data.totalCount;
          this.applyFilter(); // Apply current filter
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.snackBar.open('Failed to load orders', 'Close', { duration: 3000 });
      }
    });
  }

  private applyFilter(): void {
    if (this.selectedStatus) {
      this.orders = this.allOrders.filter(order => order.status === this.selectedStatus);
    } else {
      this.orders = [...this.allOrders];
    }
  }

  onStatusFilter(): void {
    this.applyFilter();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    // Only reload orders if no filter is applied (server-side pagination)
    if (!this.selectedStatus) {
      this.loadOrders();
    }
  }

  // Helper methods for enhanced display
  getStartIndex(): number {
    if (this.selectedStatus) {
      return 1; // When filtering, always start from 1
    }
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getEndIndex(): number {
    if (this.selectedStatus) {
      return this.orders.length; // When filtering, show all filtered results
    }
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

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return `${diffDays - 1} days ago`;
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
      'verified': 'Verified',
      'pending': 'Pending',
      'failed': 'Failed'
    };
    return statusLabels[status] || status;
  }

  getPaymentStatusClass(status: string): string {
    return status || 'verified';
  }

  // Filter helper methods
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
}
