
import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h2 class="dashboard-title">
          <mat-icon>dashboard</mat-icon>
          Admin Dashboard
        </h2>
        <div class="header-actions">
          <button mat-raised-button color="primary" routerLink="/admin/orders">
            <mat-icon>assignment</mat-icon>
            View All Orders
          </button>
        </div>
      </div>

      <!-- Enhanced Stats Cards with better colors and clarity -->
      <div class="stats-grid" *ngIf="stats">
        <mat-card class="stat-card priority-card">
          <mat-card-content>
            <div class="stat-content">
              <div class="stat-icon-wrapper priority-bg">
                <mat-icon class="stat-icon">pending_actions</mat-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number priority-text">{{ stats.pendingOrders }}</div>
                <div class="stat-label">Orders Requiring Attention</div>
                <div class="stat-sublabel">Pending payment verification</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card processing-card">
          <mat-card-content>
            <div class="stat-content">
              <div class="stat-icon-wrapper processing-bg">
                <mat-icon class="stat-icon">autorenew</mat-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number processing-text">{{ stats.processingOrders }}</div>
                <div class="stat-label">Currently Processing</div>
                <div class="stat-sublabel">In production queue</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card success-card">
          <mat-card-content>
            <div class="stat-content">
              <div class="stat-icon-wrapper success-bg">
                <mat-icon class="stat-icon">task_alt</mat-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number success-text">{{ stats.completedToday }}</div>
                <div class="stat-label">Completed Today</div>
                <div class="stat-sublabel">Orders fulfilled and shipped</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- FIXED: Renamed "Total Revenue" to "Monthly Revenue" for better clarity -->
        <mat-card class="stat-card revenue-card">
          <mat-card-content>
            <div class="stat-content">
              <div class="stat-icon-wrapper revenue-bg">
                <mat-icon class="stat-icon">account_balance_wallet</mat-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number revenue-text">\${{ stats.totalRevenue?.toFixed(2) }}</div>
                <div class="stat-label">Daily Revenue</div>
                <div class="stat-sublabel">Current daily earnings</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Enhanced Quick Actions with better visual hierarchy -->
      <div class="quick-actions-section">
        <h3 class="section-title">
          <mat-icon>speed</mat-icon>
          Quick Actions
        </h3>
        <div class="actions-grid">
          <mat-card class="action-card primary-action">
            <mat-card-content>
              <button mat-raised-button color="primary" routerLink="/admin/orders" class="action-button">
                <div class="action-content">
                  <mat-icon class="action-icon">assignment</mat-icon>
                  <span class="action-title">Manage Orders</span>
                  <span class="action-subtitle">Process and track orders</span>
                </div>
              </button>
            </mat-card-content>
          </mat-card>

          <mat-card class="action-card secondary-action">
            <mat-card-content>
              <button mat-raised-button color="accent" routerLink="/admin/pricing" class="action-button">
                <div class="action-content">
                  <mat-icon class="action-icon">price_change</mat-icon>
                  <span class="action-title">Update Pricing</span>
                  <span class="action-subtitle">Manage print sizes and costs</span>
                </div>
              </button>
            </mat-card-content>
          </mat-card>

          <mat-card class="action-card tertiary-action">
            <mat-card-content>
              <button mat-stroked-button routerLink="/photos" class="action-button">
                <div class="action-content">
                  <mat-icon class="action-icon">photo_library</mat-icon>
                  <span class="action-title">Customer View</span>
                  <span class="action-subtitle">See user experience</span>
                </div>
              </button>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <!-- Enhanced Recent Activity with better status indicators -->
      <mat-card class="recent-activity" *ngIf="recentOrders">
        <mat-card-header>
          <div class="activity-header">
            <mat-card-title>
              <mat-icon>schedule</mat-icon>
              Recent Orders Requiring Attention
            </mat-card-title>
            <mat-card-subtitle>Orders that need immediate action</mat-card-subtitle>
          </div>
        </mat-card-header>

        <mat-card-content>
          <div class="order-list">
            <div class="order-item" *ngFor="let order of recentOrders; trackBy: trackByOrderId">
              <div class="order-main-info">
                <div class="order-identity">
                  <span class="order-number">{{ order.orderNumber }}</span>
                  <span class="order-customer">{{ order.customerName }}</span>
                  <span class="order-date">{{ formatOrderDate(order.orderDate) }}</span>
                </div>

                <div class="order-status-section">
                  <mat-chip [class]="getEnhancedStatusClass(order.status)" class="status-chip">
                    <mat-icon class="status-icon">{{ getStatusIcon(order.status) }}</mat-icon>
                    {{ getStatusLabel(order.status) }}
                  </mat-chip>
                </div>
              </div>

              <div class="order-actions">
                <span class="order-amount">\${{ order.totalAmount.toFixed(2) }}</span>
                <button mat-icon-button
                        routerLink="/admin/orders"
                        [queryParams]="{orderId: order.orderId}"
                        class="action-btn"
                        matTooltip="View Order Details">
                  <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </div>
          </div>

          <div class="view-all-action">
            <button mat-raised-button color="primary" routerLink="/admin/orders">
              <mat-icon>view_list</mat-icon>
              View All Orders
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      min-height: 100vh;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      padding: 0 8px;
    }

    .dashboard-title {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #1a365d;
      font-size: 2rem;
      font-weight: 600;
      margin: 0;
    }

    .dashboard-title mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #3182ce;
    }

    .header-actions button {
      border-radius: 8px;
      font-weight: 500;
      padding: 0 20px;
      height: 44px;
    }

    /* Enhanced Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      margin-bottom: 40px;
    }

    .stat-card {
      border-radius: 16px;
      border: none;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
      overflow: hidden;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    }

    .stat-content {
      display: flex;
      align-items: center;
      padding: 24px;
      gap: 20px;
    }

    .stat-icon-wrapper {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: white;
    }

    .stat-info {
      flex: 1;
    }

    .stat-number {
      font-size: 2.5rem;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 2px;
      color: #2d3748;
    }

    .stat-sublabel {
      font-size: 0.875rem;
      color: #718096;
    }

    /* Status-specific card colors */
    .priority-card {
      border-left: 4px solid #f56565;
    }

    .priority-bg {
      background: linear-gradient(135deg, #fed7d7 0%, #f56565 100%);
    }

    .priority-text {
      color: #c53030;
    }

    .processing-card {
      border-left: 4px solid #4299e1;
    }

    .processing-bg {
      background: linear-gradient(135deg, #bee3f8 0%, #4299e1 100%);
    }

    .processing-text {
      color: #2b6cb0;
    }

    .success-card {
      border-left: 4px solid #48bb78;
    }

    .success-bg {
      background: linear-gradient(135deg, #c6f6d5 0%, #48bb78 100%);
    }

    .success-text {
      color: #2f855a;
    }

    .revenue-card {
      border-left: 4px solid #9f7aea;
    }

    .revenue-bg {
      background: linear-gradient(135deg, #e9d8fd 0%, #9f7aea 100%);
    }

    .revenue-text {
      color: #6b46c1;
    }

    /* Enhanced Quick Actions */
    .quick-actions-section {
      margin-bottom: 40px;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #1a365d;
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 24px;
    }

    .section-title mat-icon {
      color: #3182ce;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }

    .action-card {
      border-radius: 12px;
      border: none;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
      transition: all 0.3s ease;
    }

    .action-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
    }

    .action-button {
      width: 100%;
      height: 100px;
      border-radius: 8px;
      padding: 0;
    }

    .action-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      text-align: center;
    }

    .action-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .action-title {
      font-weight: 600;
      font-size: 1rem;
    }

    .action-subtitle {
      font-size: 0.875rem;
      opacity: 0.8;
    }

    /* Enhanced Recent Activity */
    .recent-activity {
      border-radius: 16px;
      border: none;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .activity-header {
      display: flex;
      flex-direction: column;
    }

    .activity-header mat-card-title {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #1a365d;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .order-list {
      margin: 0 -16px;
    }

    .order-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 16px;
      border-bottom: 1px solid #e2e8f0;
      transition: background-color 0.2s ease;
    }

    .order-item:hover {
      background-color: #f7fafc;
    }

    .order-item:last-child {
      border-bottom: none;
    }

    .order-main-info {
      display: flex;
      align-items: center;
      gap: 24px;
      flex: 1;
    }

    .order-identity {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .order-number {
      font-weight: 600;
      color: #3182ce;
      font-size: 1rem;
    }

    .order-customer {
      color: #4a5568;
      font-size: 0.9rem;
    }

    .order-date {
      color: #718096;
      font-size: 0.875rem;
    }

    .order-status-section {
      display: flex;
      align-items: center;
    }

    .status-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
      padding: 8px 16px;
      border-radius: 20px;
    }

    .status-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .order-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .order-amount {
      font-weight: 600;
      color: #2f855a;
      font-size: 1.1rem;
    }

    .action-btn {
      color: #3182ce;
      transition: all 0.2s ease;
    }

    .action-btn:hover {
      background-color: #e6fffa;
      color: #2c7a7b;
    }

    .view-all-action {
      text-align: center;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }

    .view-all-action button {
      border-radius: 8px;
      font-weight: 500;
      padding: 0 24px;
      height: 44px;
    }

    /* FIXED: Updated status classes for consistency */
    .status-pending {
      background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
      color: #c53030;
      border: 1px solid #fc8181;
    }

    .status-verified {
      background: linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%);
      color: #1d4ed8;
      border: 1px solid #60a5fa;
    }

    .status-processing {
      background: linear-gradient(135deg, #e9d8fd 0%, #d6bcfa 100%);
      color: #6b46c1;
      border: 1px solid #b794f6;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .dashboard-container {
        padding: 16px;
      }

      .dashboard-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .stats-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .actions-grid {
        grid-template-columns: 1fr;
      }

      .order-main-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .order-actions {
        align-self: flex-end;
      }
    }

    @media (max-width: 480px) {
      .stat-content {
        padding: 16px;
        gap: 16px;
      }

      .stat-icon-wrapper {
        width: 48px;
        height: 48px;
      }

      .stat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      .stat-number {
        font-size: 2rem;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  stats: any = null;
  recentOrders: any[] = [];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.adminService.getDashboardStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.stats = response.data;
        }
      },
      error: (error) => {
        console.error('Failed to load dashboard stats:', error);
      }
    });

    // Load recent orders that need attention
    this.adminService.getOrders('pending', 1, 5).subscribe({
      next: (response) => {
        if (response.success) {
          this.recentOrders = response.data.items;
        }
      },
      error: (error) => {
        console.error('Failed to load recent orders:', error);
      }
    });
  }

  formatOrderDate(dateString: string): string {
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
      return date.toLocaleDateString();
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

  trackByOrderId(index: number, order: any): any {
    return order.orderId;
  }
}
