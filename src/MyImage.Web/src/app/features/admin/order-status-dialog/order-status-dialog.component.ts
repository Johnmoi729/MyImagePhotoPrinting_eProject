
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-order-status-dialog',
  standalone: false,
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon class="dialog-icon">edit_note</mat-icon>
          Update Order Status
        </h2>
        <button mat-icon-button mat-dialog-close class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="dialog-content">
        <!-- Enhanced Order Information -->
        <div class="order-info-card">
          <div class="order-header">
            <div class="order-main">
              <h4 class="order-number">{{ data.order.orderNumber }}</h4>
              <p class="order-customer">{{ data.order.customerName }}</p>
              <p class="order-email">{{ data.order.customerEmail }}</p>
            </div>
            <div class="order-current-status">
              <label class="status-label">Current Status:</label>
              <mat-chip [class]="getCurrentStatusClass(data.order.status)" class="current-status-chip">
                <mat-icon class="status-icon">{{ getStatusIcon(data.order.status) }}</mat-icon>
                {{ getStatusLabel(data.order.status) }}
              </mat-chip>
            </div>
          </div>

          <div class="order-details">
            <div class="detail-item">
              <mat-icon>attach_money</mat-icon>
              <span class="detail-label">Total Amount:</span>
              <span class="detail-value amount">\${{ data.order.totalAmount.toFixed(2) }}</span>
            </div>
            <div class="detail-item">
              <mat-icon>photo_library</mat-icon>
              <span class="detail-label">Items:</span>
              <span class="detail-value">{{ data.order.photoCount }} photos, {{ data.order.printCount }} prints</span>
            </div>
            <div class="detail-item">
              <mat-icon>schedule</mat-icon>
              <span class="detail-label">Order Date:</span>
              <span class="detail-value">{{ formatDate(data.order.orderDate) }}</span>
            </div>
          </div>
        </div>

        <!-- FIXED: Simplified Status Selection Form -->
        <form [formGroup]="statusForm" class="status-form">
          <div class="form-section">
            <h4 class="section-title">
              <mat-icon>trending_up</mat-icon>
              Select New Status
            </h4>

            <div class="status-options">
              <!-- FIXED: Simplified radio buttons without complex nesting -->
              <div class="status-option"
                   *ngFor="let option of getAvailableStatusOptions()"
                   [class.current]="option.value === data.order.status"
                   [class.next-step]="option.isNextStep"
                   [class.disabled]="option.disabled"
                   (click)="selectStatus(option.value)"
                   [attr.tabindex]="option.disabled ? -1 : 0">

                <div class="radio-indicator">
                  <input type="radio"
                         [value]="option.value"
                         [checked]="statusForm.get('status')?.value === option.value"
                         [disabled]="option.disabled"
                         (change)="onStatusChange(option.value)"
                         class="radio-input">
                  <div class="radio-circle"></div>
                </div>

                <div class="status-content">
                  <div class="status-main">
                    <mat-icon [class]="option.iconClass">{{ option.icon }}</mat-icon>
                    <div class="status-text">
                      <span class="status-name">{{ option.label }}</span>
                      <span class="status-description">{{ option.description }}</span>
                    </div>
                  </div>

                  <div class="status-indicators" *ngIf="!option.disabled">
                    <mat-chip *ngIf="option.value === data.order.status" class="current-chip">
                      <mat-icon>radio_button_checked</mat-icon>
                      Current
                    </mat-chip>
                    <mat-chip *ngIf="option.isNextStep && option.value !== data.order.status" class="next-step-chip">
                      <mat-icon>arrow_forward</mat-icon>
                      Next Step
                    </mat-chip>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4 class="section-title">
              <mat-icon>note_add</mat-icon>
              Additional Notes
            </h4>

            <mat-form-field appearance="outline" class="notes-field">
              <mat-label>Status Change Notes (Optional)</mat-label>
              <textarea matInput
                        formControlName="notes"
                        rows="3"
                        placeholder="Add any notes about this status change..."
                        [value]="getDefaultNote(statusForm.get('status')?.value)"></textarea>
              <mat-hint>These notes will be saved in the order history</mat-hint>
            </mat-form-field>
          </div>

          <!-- Status Change Preview -->
          <div class="status-preview" *ngIf="statusForm.get('status')?.value && statusForm.get('status')?.value !== data.order.status">
            <div class="preview-header">
              <mat-icon>preview</mat-icon>
              <span>Status Change Preview</span>
            </div>

            <div class="status-transition">
              <div class="current-status">
                <mat-chip [class]="getCurrentStatusClass(data.order.status)">
                  <mat-icon>{{ getStatusIcon(data.order.status) }}</mat-icon>
                  {{ getStatusLabel(data.order.status) }}
                </mat-chip>
              </div>

              <mat-icon class="transition-arrow">arrow_forward</mat-icon>

              <div class="new-status">
                <mat-chip [class]="getCurrentStatusClass(statusForm.get('status')?.value)">
                  <mat-icon>{{ getStatusIcon(statusForm.get('status')?.value) }}</mat-icon>
                  {{ getStatusLabel(statusForm.get('status')?.value) }}
                </mat-chip>
              </div>
            </div>

            <div class="impact-info">
              <div class="impact-item" *ngFor="let impact of getStatusImpact(statusForm.get('status')?.value)">
                <mat-icon [class]="impact.type === 'warning' ? 'warning-icon' : 'info-icon'">
                  {{ impact.type === 'warning' ? 'warning' : 'info' }}
                </mat-icon>
                <span>{{ impact.message }}</span>
              </div>
            </div>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="cancel()" [disabled]="isUpdating">
          <mat-icon>close</mat-icon>
          Cancel
        </button>

        <button mat-raised-button
                color="primary"
                [disabled]="!canUpdateStatus() || isUpdating"
                (click)="updateStatus()"
                class="update-btn">
          <mat-spinner diameter="20" *ngIf="isUpdating"></mat-spinner>
          <mat-icon *ngIf="!isUpdating">save</mat-icon>
          <span *ngIf="!isUpdating">Update Status</span>
          <span *ngIf="isUpdating">Updating...</span>
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      max-width: 700px;
      width: 100%;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px 0 24px;
      margin-bottom: 20px;
    }

    .dialog-header h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #1a365d;
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0;
    }

    .dialog-icon {
      color: #3182ce;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .close-btn {
      color: #718096;
      transition: color 0.2s ease;
    }

    .close-btn:hover {
      color: #e53e3e;
    }

    .dialog-content {
      padding: 0 24px;
      max-height: 70vh;
      overflow-y: auto;
    }

    /* Enhanced Order Info Card */
    .order-info-card {
      background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
      border: 1px solid #e2e8f0;
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .order-main {
      flex: 1;
    }

    .order-number {
      color: #3182ce;
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 4px 0;
    }

    .order-customer {
      color: #2d3748;
      font-weight: 500;
      margin: 0 0 2px 0;
    }

    .order-email {
      color: #718096;
      font-size: 0.9rem;
      margin: 0;
    }

    .order-current-status {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
    }

    .status-label {
      font-size: 0.875rem;
      color: #4a5568;
      font-weight: 500;
    }

    .current-status-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
      padding: 8px 16px;
      border-radius: 20px;
    }

    .status-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .order-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .detail-item mat-icon {
      color: #718096;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .detail-label {
      color: #4a5568;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .detail-value {
      color: #2d3748;
      font-weight: 500;
      margin-left: auto;
    }

    .detail-value.amount {
      color: #2f855a;
      font-weight: 600;
    }

    /* FIXED: Simplified Status Form */
    .status-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .form-section {
      background: white;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #e2e8f0;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #2d3748;
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 16px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
    }

    .section-title mat-icon {
      color: #3182ce;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    /* FIXED: Simplified Status Options */
    .status-options {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .status-option {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: white;
    }

    /* FIXED: Highlighting Logic */
    .status-option.current {
      border-color: #3182ce;
      background: linear-gradient(135deg, #e6f3ff 0%, #cce7ff 100%);
    }

    .status-option.next-step {
      border-color: #38a169;
      background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%);
    }

    .status-option.disabled {
      opacity: 0.4;
      background: #f7fafc;
      cursor: not-allowed;
      border-color: #e2e8f0;
    }

    .status-option:not(.disabled):not(.current):not(.next-step):hover {
      border-color: #cbd5e0;
      background: #f7fafc;
    }

    .status-option.current:hover,
    .status-option.next-step:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    /* FIXED: Simplified Radio Indicator */
    .radio-indicator {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .radio-input {
      position: absolute;
      opacity: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      cursor: pointer;
    }

    .radio-input:disabled {
      cursor: not-allowed;
    }

    .radio-circle {
      width: 20px;
      height: 20px;
      border: 2px solid #cbd5e0;
      border-radius: 50%;
      position: relative;
      transition: all 0.2s ease;
    }

    .radio-input:checked + .radio-circle {
      border-color: #3182ce;
      background: #3182ce;
    }

    .radio-input:checked + .radio-circle::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 8px;
      height: 8px;
      background: white;
      border-radius: 50%;
    }

    .status-option.disabled .radio-circle {
      border-color: #e2e8f0;
      background: #f7fafc;
    }

    .status-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .status-main {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }

    .status-main mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .status-main .pending-icon { color: #e53e3e; }
    .status-main .verified-icon { color: #3182ce; }
    .status-main .processing-icon { color: #805ad5; }
    .status-main .printed-icon { color: #38a169; }
    .status-main .shipped-icon { color: #3182ce; }
    .status-main .completed-icon { color: #2f855a; }

    .status-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .status-name {
      font-weight: 600;
      color: #2d3748;
      font-size: 1rem;
    }

    .status-description {
      font-size: 0.875rem;
      color: #718096;
      line-height: 1.3;
    }

    .status-indicators {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .current-chip {
      background: linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%);
      color: #1d4ed8;
      font-size: 0.75rem;
      font-weight: 600;
      height: 24px;
      padding: 0 8px;
    }

    .next-step-chip {
      background: linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%);
      color: #276749;
      font-size: 0.75rem;
      font-weight: 600;
      height: 24px;
      padding: 0 8px;
    }

    .current-chip mat-icon,
    .next-step-chip mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .notes-field {
      width: 100%;
    }

    /* Status Preview */
    .status-preview {
      background: linear-gradient(135deg, #e6fffa 0%, #b2f5ea 100%);
      border: 1px solid #81e6d9;
      border-radius: 12px;
      padding: 16px;
      margin-top: 20px;
    }

    .preview-header {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #2c7a7b;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .status-transition {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .transition-arrow {
      color: #2c7a7b;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .impact-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .impact-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
    }

    .warning-icon {
      color: #d69e2e;
    }

    .info-icon {
      color: #3182ce;
    }

    /* Status Colors */
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

    .status-printed {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      color: #92400e;
      border: 1px solid #f59e0b;
    }

    .status-shipped {
      background: linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%);
      color: #1e40af;
      border: 1px solid #3b82f6;
    }

    .status-completed {
      background: linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%);
      color: #065f46;
      border: 1px solid #10b981;
    }

    /* Dialog Actions */
    .dialog-actions {
      padding: 20px 24px;
      background: #f7fafc;
      margin: 0 -24px -24px -24px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .update-btn {
      min-width: 140px;
      height: 44px;
      border-radius: 8px;
      font-weight: 500;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .dialog-container {
        max-width: 95vw;
      }

      .order-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .order-current-status {
        align-items: flex-start;
      }

      .order-details {
        grid-template-columns: 1fr;
      }

      .status-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .status-indicators {
        align-items: flex-start;
        flex-direction: row;
        flex-wrap: wrap;
      }

      .status-transition {
        flex-direction: column;
        gap: 8px;
      }

      .transition-arrow {
        transform: rotate(90deg);
      }
    }
  `]
})
export class OrderStatusDialogComponent {
  statusForm: FormGroup;
  isUpdating = false;

  private statusOptions = [
    {
      value: 'pending',
      label: 'Pending Payment',
      description: 'Waiting for payment verification',
      icon: 'pending',
      iconClass: 'pending-icon',
      order: 1
    },
    {
      value: 'payment_verified',
      label: 'Payment Verified',
      description: 'Payment confirmed, ready for processing',
      icon: 'verified',
      iconClass: 'verified-icon',
      order: 2
    },
    {
      value: 'processing',
      label: 'Processing',
      description: 'Order is being prepared for printing',
      icon: 'autorenew',
      iconClass: 'processing-icon',
      order: 3
    },
    {
      value: 'printed',
      label: 'Printed',
      description: 'Photos have been printed and packaged',
      icon: 'print',
      iconClass: 'printed-icon',
      order: 4
    },
    {
      value: 'shipped',
      label: 'Shipped',
      description: 'Order has been shipped to customer',
      icon: 'local_shipping',
      iconClass: 'shipped-icon',
      order: 5
    },
    {
      value: 'completed',
      label: 'Completed',
      description: 'Order delivered and photos will be deleted',
      icon: 'check_circle',
      iconClass: 'completed-icon',
      order: 6
    }
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<OrderStatusDialogComponent>,
    private fb: FormBuilder,
    private adminService: AdminService,
    private snackBar: MatSnackBar
  ) {
    this.statusForm = this.fb.group({
      status: [data.order.status, Validators.required],
      notes: ['']
    });
  }

  // FIXED: Simplified status selection methods
  selectStatus(value: string): void {
    const option = this.statusOptions.find(opt => opt.value === value);
    if (option && !this.isStatusDisabled(option)) {
      this.statusForm.patchValue({ status: value });
    }
  }

  onStatusChange(value: string): void {
    this.statusForm.patchValue({ status: value });
  }

  private isStatusDisabled(option: any): boolean {
    const currentStatus = this.data.order.status;
    const currentOrder = this.statusOptions.find(s => s.value === currentStatus)?.order || 0;

    // Current status is disabled
    if (option.value === currentStatus) return true;

    // Can't go from pending directly to completed
    if (currentStatus === 'pending' && option.value === 'completed') return true;

    return false;
  }

  getAvailableStatusOptions(): any[] {
    const currentStatus = this.data.order.status;
    const currentOrder = this.statusOptions.find(s => s.value === currentStatus)?.order || 0;

    return this.statusOptions.map(option => {
      const isCurrentStatus = option.value === currentStatus;
      const isNextStep = option.order === currentOrder + 1;
      const isDisabled = this.isStatusDisabled(option);

      return {
        ...option,
        disabled: isDisabled,
        isNextStep: isNextStep && !isCurrentStatus
      };
    });
  }

  getDefaultNote(newStatus: string): string {
    const statusNotes: { [key: string]: string } = {
      'payment_verified': 'Payment verified and ready for processing',
      'processing': 'Order moved to processing queue',
      'printed': 'Order has been printed and packaged',
      'shipped': 'Order shipped to customer',
      'completed': 'Order completed and photos scheduled for deletion'
    };

    return statusNotes[newStatus] || '';
  }

  getStatusImpact(newStatus: string): Array<{type: 'info' | 'warning', message: string}> {
    const impacts: { [key: string]: Array<{type: 'info' | 'warning', message: string}> } = {
      'payment_verified': [
        { type: 'info', message: 'Order will be added to the processing queue' },
        { type: 'info', message: 'Customer will be notified of payment confirmation' }
      ],
      'processing': [
        { type: 'info', message: 'Order will be sent to the print queue' },
        { type: 'info', message: 'Processing time typically 1-2 business days' }
      ],
      'printed': [
        { type: 'info', message: 'Order is ready for shipping' },
        { type: 'info', message: 'Customer will be notified when shipped' }
      ],
      'shipped': [
        { type: 'info', message: 'Customer will receive tracking information' },
        { type: 'info', message: 'Order can be marked complete after delivery' }
      ],
      'completed': [
        { type: 'warning', message: 'All photos associated with this order will be permanently deleted' },
        { type: 'info', message: 'Customer will receive completion notification' },
        { type: 'warning', message: 'This action cannot be undone' }
      ]
    };

    return impacts[newStatus] || [];
  }

  canUpdateStatus(): boolean {
    const selectedStatus = this.statusForm.get('status')?.value;
    return selectedStatus && selectedStatus !== this.data.order.status && this.statusForm.valid;
  }

  updateStatus(): void {
    if (this.statusForm.valid && this.canUpdateStatus()) {
      this.isUpdating = true;

      const { status, notes } = this.statusForm.value;
      const finalNotes = notes || this.getDefaultNote(status);

      this.adminService.updateOrderStatus(this.data.order.orderId, status, finalNotes).subscribe({
        next: (response) => {
          this.isUpdating = false;
          if (response.success) {
            this.snackBar.open(
              `Order ${this.data.order.orderNumber} updated to ${this.getStatusLabel(status)}`,
              'Close',
              {
                duration: 4000,
                panelClass: ['success-snackbar']
              }
            );
            this.dialogRef.close(true);
          }
        },
        error: (error) => {
          this.isUpdating = false;
          this.snackBar.open('Failed to update order status', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusLabel(status: string): string {
    const option = this.statusOptions.find(s => s.value === status);
    return option?.label || status;
  }

  getCurrentStatusClass(status: string): string {
    return `status-${status.replace('_', '-')}`;
  }

  getStatusIcon(status: string): string {
    const option = this.statusOptions.find(s => s.value === status);
    return option?.icon || 'help';
  }
}
