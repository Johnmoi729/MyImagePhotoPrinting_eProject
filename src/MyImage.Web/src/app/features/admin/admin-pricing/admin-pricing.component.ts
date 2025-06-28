
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-pricing',
  standalone: false,
  template: `
    <div class="pricing-container">
      <div class="pricing-header">
        <div class="header-main">
          <h2 class="page-title">
            <mat-icon>price_change</mat-icon>
            Price Management
          </h2>
          <p class="page-subtitle">Manage print sizes and pricing for all photo orders</p>
        </div>

        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="toggleAddForm()" [class.active]="showAddForm">
            <mat-icon>{{ showAddForm ? 'close' : 'add' }}</mat-icon>
            <span>{{ showAddForm ? 'Cancel' : 'Add New Size' }}</span>
          </button>
        </div>
      </div>

      <!-- Enhanced Add New Size Form -->
      <mat-card class="add-form-card" *ngIf="showAddForm" [@slideInOut]>
        <mat-card-header class="form-header">
          <mat-card-title>
            <mat-icon>add_photo_alternate</mat-icon>
            Add New Print Size
          </mat-card-title>
          <mat-card-subtitle>Configure a new print size option for customers</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="addSizeForm" class="add-size-form">
            <div class="form-section">
              <h4 class="section-title">
                <mat-icon>label</mat-icon>
                Basic Information
              </h4>

              <div class="form-row">
                <mat-form-field appearance="outline" class="size-code-field">
                  <mat-label>Size Code</mat-label>
                  <input matInput formControlName="sizeCode" placeholder="e.g., 8x10">
                  <mat-hint>Short identifier for this size</mat-hint>
                  <mat-error>Size code is required</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="display-name-field">
                  <mat-label>Display Name</mat-label>
                  <input matInput formControlName="displayName" placeholder="e.g., Large 8×10">
                  <mat-hint>Customer-facing name</mat-hint>
                  <mat-error>Display name is required</mat-error>
                </mat-form-field>
              </div>
            </div>

            <div class="form-section">
              <h4 class="section-title">
                <mat-icon>straighten</mat-icon>
                Physical Dimensions
              </h4>

              <div class="form-row">
                <mat-form-field appearance="outline" class="dimension-field">
                  <mat-label>Width (inches)</mat-label>
                  <input matInput type="number" formControlName="width" step="0.1" min="0.1">
                  <mat-error>Width is required</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="dimension-field">
                  <mat-label>Height (inches)</mat-label>
                  <input matInput type="number" formControlName="height" step="0.1" min="0.1">
                  <mat-error>Height is required</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="price-field">
                  <mat-label>Price (USD)</mat-label>
                  <input matInput type="number" formControlName="price" step="0.01" min="0.01">
                  <span matPrefix>$&nbsp;</span>
                  <mat-hint>Price per print</mat-hint>
                  <mat-error>Price is required</mat-error>
                </mat-form-field>
              </div>
            </div>

            <div class="form-section">
              <h4 class="section-title">
                <mat-icon>high_quality</mat-icon>
                Quality Requirements
              </h4>

              <div class="quality-grid">
                <mat-form-field appearance="outline" class="pixel-field">
                  <mat-label>Min Width (pixels)</mat-label>
                  <input matInput type="number" formControlName="minWidth" min="1">
                  <mat-hint>Minimum for fair quality</mat-hint>
                  <mat-error>Minimum width is required</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="pixel-field">
                  <mat-label>Min Height (pixels)</mat-label>
                  <input matInput type="number" formControlName="minHeight" min="1">
                  <mat-hint>Minimum for fair quality</mat-hint>
                  <mat-error>Minimum height is required</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="pixel-field">
                  <mat-label>Recommended Width (pixels)</mat-label>
                  <input matInput type="number" formControlName="recommendedWidth" min="1">
                  <mat-hint>For excellent quality</mat-hint>
                  <mat-error>Recommended width is required</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="pixel-field">
                  <mat-label>Recommended Height (pixels)</mat-label>
                  <input matInput type="number" formControlName="recommendedHeight" min="1">
                  <mat-hint>For excellent quality</mat-hint>
                  <mat-error>Recommended height is required</mat-error>
                </mat-form-field>
              </div>
            </div>
          </form>
        </mat-card-content>

        <mat-card-actions class="form-actions">
          <button mat-button (click)="cancelAdd()" [disabled]="isAdding">
            <mat-icon>close</mat-icon>
            Cancel
          </button>
          <button mat-raised-button
                  color="primary"
                  [disabled]="addSizeForm.invalid || isAdding"
                  (click)="addNewSize()">
            <mat-spinner diameter="20" *ngIf="isAdding"></mat-spinner>
            <mat-icon *ngIf="!isAdding">save</mat-icon>
            <span *ngIf="!isAdding">Add Print Size</span>
            <span *ngIf="isAdding">Adding...</span>
          </button>
        </mat-card-actions>
      </mat-card>

      <!-- Enhanced Sizes Table -->
      <mat-card class="sizes-table-card">
        <div class="table-header">
          <div class="table-title">
            <h3>
              <mat-icon>list_alt</mat-icon>
              Current Print Sizes
            </h3>
            <p class="table-subtitle">Manage available print sizes and their pricing</p>
          </div>

          <div class="table-actions">
            <button mat-stroked-button (click)="loadPrintSizes()" [disabled]="isLoading">
              <mat-icon>refresh</mat-icon>
              Refresh
            </button>
          </div>
        </div>

        <div class="table-container">
          <table mat-table [dataSource]="printSizes" class="sizes-table">
            <!-- Enhanced Size Code Column -->
            <ng-container matColumnDef="sizeCode">
              <th mat-header-cell *matHeaderCellDef>Size Code</th>
              <td mat-cell *matCellDef="let size">
                <div class="size-code-cell">
                  <span class="size-code">{{ size.sizeCode }}</span>
                  <span class="size-dimensions">{{ size.width }}" × {{ size.height }}"</span>
                </div>
              </td>
            </ng-container>

            <!-- Display Name Column -->
            <ng-container matColumnDef="displayName">
              <th mat-header-cell *matHeaderCellDef>Display Name</th>
              <td mat-cell *matCellDef="let size">
                <div class="display-name-cell">
                  <span class="name-primary">{{ size.displayName }}</span>
                  <span class="name-category">{{ getSizeCategory(size) }}</span>
                </div>
              </td>
            </ng-container>

            <!-- Enhanced Price Column with inline editing -->
            <ng-container matColumnDef="price">
              <th mat-header-cell *matHeaderCellDef>Price</th>
              <td mat-cell *matCellDef="let size">
                <div class="price-cell">
                  <div class="price-edit" *ngIf="editingPrice === size.id; else priceDisplay">
                    <mat-form-field appearance="outline" class="price-input">
                      <input matInput
                             type="number"
                             [(ngModel)]="tempPrice"
                             step="0.01"
                             min="0.01"
                             (keyup.enter)="savePrice(size)"
                             (keyup.escape)="cancelPriceEdit()">
                      <span matPrefix>$&nbsp;</span>
                    </mat-form-field>
                    <div class="price-actions">
                      <button mat-mini-fab color="primary" (click)="savePrice(size)" [disabled]="tempPrice <= 0">
                        <mat-icon>check</mat-icon>
                      </button>
                      <button mat-mini-fab (click)="cancelPriceEdit()">
                        <mat-icon>close</mat-icon>
                      </button>
                    </div>
                  </div>

                  <ng-template #priceDisplay>
                    <div class="price-display" (click)="startPriceEdit(size)">
                      <span class="price-value">\${{ size.price.toFixed(2) }}</span>
                      <mat-icon class="edit-icon">edit</mat-icon>
                      <div class="price-hint">Click to edit</div>
                    </div>
                  </ng-template>
                </div>
              </td>
            </ng-container>

            <!-- Enhanced Quality Requirements Column -->
            <ng-container matColumnDef="quality">
              <th mat-header-cell *matHeaderCellDef>Quality Requirements</th>
              <td mat-cell *matCellDef="let size">
                <div class="quality-info">
                  <div class="quality-row minimum">
                    <mat-icon class="quality-icon">warning</mat-icon>
                    <span class="quality-label">Minimum:</span>
                    <span class="quality-value">{{ size.minWidth }}×{{ size.minHeight }}px</span>
                  </div>
                  <div class="quality-row recommended">
                    <mat-icon class="quality-icon">star</mat-icon>
                    <span class="quality-label">Recommended:</span>
                    <span class="quality-value">{{ size.recommendedWidth }}×{{ size.recommendedHeight }}px</span>
                  </div>
                  <div class="quality-indicator">
                    <div class="quality-bar">
                      <div class="quality-fill" [style.width.%]="getQualityScore(size)"></div>
                    </div>
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- Enhanced Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let size">
                <div class="status-cell">
                  <mat-chip [class]="getStatusChipClass(size.isActive)"
                           (click)="toggleStatus(size)"
                           class="status-chip clickable">
                    <mat-icon class="status-icon">{{ getStatusIcon(size.isActive) }}</mat-icon>
                    <span>{{ size.isActive ? 'Active' : 'Inactive' }}</span>
                  </mat-chip>
                  <div class="status-info">
                    {{ size.isActive ? 'Available to customers' : 'Hidden from customers' }}
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- Enhanced Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let size">
                <div class="action-buttons">
                  <button mat-mini-fab
                          color="primary"
                          (click)="startPriceEdit(size)"
                          matTooltip="Edit Price"
                          class="action-btn edit-btn">
                    <mat-icon>edit</mat-icon>
                  </button>

                  <button mat-mini-fab
                          [color]="size.isActive ? 'warn' : 'accent'"
                          (click)="toggleStatus(size)"
                          [matTooltip]="size.isActive ? 'Deactivate Size' : 'Activate Size'"
                          class="action-btn toggle-btn">
                    <mat-icon>{{ size.isActive ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>

                  <button mat-mini-fab
                          (click)="duplicateSize(size)"
                          matTooltip="Duplicate Size"
                          class="action-btn duplicate-btn">
                    <mat-icon>content_copy</mat-icon>
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                class="size-row"
                [class.inactive-row]="!row.isActive"></tr>
          </table>
        </div>
      </mat-card>

      <!-- Enhanced Statistics -->
      <div class="stats-section">
        <mat-card class="stats-card overview-stats">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>analytics</mat-icon>
              Pricing Overview
            </mat-card-title>
          </mat-card-header>

          <mat-card-content>
            <div class="stats-grid">
              <div class="stat-item total-sizes">
                <div class="stat-icon-wrapper">
                  <mat-icon>photo_size_select_large</mat-icon>
                </div>
                <div class="stat-info">
                  <span class="stat-number">{{ printSizes.length }}</span>
                  <span class="stat-label">Total Sizes</span>
                </div>
              </div>

              <div class="stat-item active-sizes">
                <div class="stat-icon-wrapper active">
                  <mat-icon>visibility</mat-icon>
                </div>
                <div class="stat-info">
                  <span class="stat-number">{{ getActiveSizes().length }}</span>
                  <span class="stat-label">Active Sizes</span>
                </div>
              </div>

              <div class="stat-item price-range">
                <div class="stat-icon-wrapper">
                  <mat-icon>trending_up</mat-icon>
                </div>
                <div class="stat-info">
                  <span class="stat-number">\${{ getMinPrice().toFixed(2) }} - \${{ getMaxPrice().toFixed(2) }}</span>
                  <span class="stat-label">Price Range</span>
                </div>
              </div>

              <div class="stat-item average-price">
                <div class="stat-icon-wrapper revenue">
                  <mat-icon>account_balance_wallet</mat-icon>
                </div>
                <div class="stat-info">
                  <span class="stat-number">\${{ getAveragePrice().toFixed(2) }}</span>
                  <span class="stat-label">Average Price</span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stats-card popular-sizes">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>trending_up</mat-icon>
              Popular Size Categories
            </mat-card-title>
          </mat-card-header>

          <mat-card-content>
            <div class="category-stats">
              <div class="category-item" *ngFor="let category of getSizeCategories()">
                <div class="category-info">
                  <span class="category-name">{{ category.name }}</span>
                  <span class="category-count">{{ category.count }} sizes</span>
                </div>
                <div class="category-bar">
                  <div class="category-fill" [style.width.%]="category.percentage"></div>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .pricing-container {
      max-width: 1600px;
      margin: 0 auto;
      padding: 24px;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      min-height: 100vh;
    }

    .pricing-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
      padding: 0 8px;
    }

    .header-main {
      flex: 1;
    }

    .page-title {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #1a365d;
      font-size: 2rem;
      font-weight: 600;
      margin: 0 0 8px 0;
    }

    .page-title mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #3182ce;
    }

    .page-subtitle {
      color: #4a5568;
      font-size: 1rem;
      margin: 0;
    }

    .header-actions button {
      border-radius: 8px;
      font-weight: 500;
      padding: 0 20px;
      height: 44px;
      transition: all 0.3s ease;
    }

    .header-actions button.active {
      background-color: #e53e3e;
      color: white;
    }

    /* Enhanced Add Form */
    .add-form-card {
      margin-bottom: 32px;
      border-radius: 16px;
      border: none;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    .form-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 24px;
    }

    .form-header mat-card-title {
      display: flex;
      align-items: center;
      gap: 12px;
      color: white;
      font-size: 1.25rem;
      margin: 0;
    }

    .form-header mat-card-subtitle {
      color: rgba(255, 255, 255, 0.9);
      margin-top: 8px;
    }

    .add-size-form {
      padding: 24px;
    }

    .form-section {
      margin-bottom: 32px;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #2d3748;
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
    }

    .section-title mat-icon {
      color: #3182ce;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .quality-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .size-code-field {
      flex: 0 0 150px;
    }

    .display-name-field {
      flex: 1;
      min-width: 250px;
    }

    .dimension-field, .price-field {
      flex: 0 0 150px;
    }

    .pixel-field {
      min-width: 200px;
    }

    .form-actions {
      background: #f7fafc;
      padding: 16px 24px;
      margin: 0 -24px -24px -24px;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    /* Enhanced Table Styles */
    .sizes-table-card {
      border-radius: 16px;
      border: none;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      overflow: hidden;
      margin-bottom: 32px;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 24px;
      background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
      border-bottom: 1px solid #e2e8f0;
    }

    .table-title h3 {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #1a365d;
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 4px 0;
    }

    .table-subtitle {
      color: #4a5568;
      font-size: 0.9rem;
      margin: 0;
    }

    .table-actions button {
      border-radius: 8px;
      font-weight: 500;
    }

    .table-container {
      overflow-x: auto;
      background: white;
    }

    .sizes-table {
      width: 100%;
      min-width: 1000px;
    }

    .size-row {
      transition: all 0.2s ease;
      border-bottom: 1px solid #f7fafc;
    }

    .size-row:hover {
      background-color: #f7fafc;
    }

    .inactive-row {
      opacity: 0.6;
      background: linear-gradient(90deg, #fed7d7 0%, transparent 5%);
    }

    /* Enhanced Cell Styles */
    .size-code-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .size-code {
      font-weight: 600;
      color: #3182ce;
      font-family: 'Roboto Mono', monospace;
      font-size: 1rem;
    }

    .size-dimensions {
      font-size: 0.8rem;
      color: #718096;
    }

    .display-name-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .name-primary {
      font-weight: 500;
      color: #2d3748;
    }

    .name-category {
      font-size: 0.8rem;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Enhanced Price Cell */
    .price-cell {
      min-height: 60px;
      display: flex;
      align-items: center;
    }

    .price-edit {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .price-input {
      width: 100px;
    }

    .price-actions {
      display: flex;
      gap: 4px;
    }

    .price-actions button {
      min-width: 32px;
      height: 32px;
    }

    .price-display {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      cursor: pointer;
      padding: 8px 12px;
      border-radius: 8px;
      transition: all 0.2s ease;
      position: relative;
    }

    .price-display:hover {
      background-color: #e6fffa;
      transform: translateY(-1px);
    }

    .price-value {
      font-weight: 600;
      color: #2f855a;
      font-size: 1.1rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .edit-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      opacity: 0.5;
      transition: opacity 0.2s ease;
    }

    .price-display:hover .edit-icon {
      opacity: 1;
    }

    .price-hint {
      font-size: 0.75rem;
      color: #718096;
      margin-top: 2px;
    }

    /* Enhanced Quality Info */
    .quality-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .quality-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9em;
    }

    .quality-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .quality-row.minimum .quality-icon {
      color: #ed8936;
    }

    .quality-row.recommended .quality-icon {
      color: #38a169;
    }

    .quality-label {
      font-weight: 500;
      color: #4a5568;
      min-width: 80px;
    }

    .quality-value {
      font-family: 'Roboto Mono', monospace;
      color: #2d3748;
    }

    .quality-indicator {
      margin-top: 4px;
    }

    .quality-bar {
      width: 100%;
      height: 4px;
      background: #e2e8f0;
      border-radius: 2px;
      overflow: hidden;
    }

    .quality-fill {
      height: 100%;
      background: linear-gradient(90deg, #ed8936 0%, #38a169 100%);
      border-radius: 2px;
      transition: width 0.3s ease;
    }

    /* Enhanced Status Cell */
    .status-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .status-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
      padding: 8px 16px;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 100px;
      justify-content: center;
    }

    .status-chip.clickable:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .status-chip.active-chip {
      background: linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%);
      color: #276749;
      border: 1px solid #68d391;
    }

    .status-chip.inactive-chip {
      background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
      color: #c53030;
      border: 1px solid #fc8181;
    }

    .status-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .status-info {
      font-size: 0.75rem;
      color: #718096;
      text-align: center;
    }

    /* Enhanced Action Buttons */
    .action-buttons {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .action-btn {
      min-width: 36px;
      height: 36px;
      transition: all 0.2s ease;
    }

    .action-btn:hover {
      transform: scale(1.05);
    }

    .edit-btn {
      background-color: #3182ce;
      color: white;
    }

    .toggle-btn.mat-accent {
      background-color: #38a169;
      color: white;
    }

    .toggle-btn.mat-warn {
      background-color: #e53e3e;
      color: white;
    }

    .duplicate-btn {
      background-color: #805ad5;
      color: white;
    }

    /* Enhanced Statistics */
    .stats-section {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
    }

    .stats-card {
      border-radius: 16px;
      border: none;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .stats-card mat-card-header {
      background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
      padding: 20px 24px;
    }

    .stats-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #1a365d;
      font-size: 1.125rem;
      font-weight: 600;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      padding: 24px;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: #f7fafc;
      border-radius: 12px;
      transition: all 0.2s ease;
    }

    .stat-item:hover {
      background: #edf2f7;
      transform: translateY(-1px);
    }

    .stat-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e2e8f0;
    }

    .stat-icon-wrapper mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: #4a5568;
    }

    .stat-icon-wrapper.active {
      background: linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%);
    }

    .stat-icon-wrapper.active mat-icon {
      color: #276749;
    }

    .stat-icon-wrapper.revenue {
      background: linear-gradient(135deg, #e9d8fd 0%, #d6bcfa 100%);
    }

    .stat-icon-wrapper.revenue mat-icon {
      color: #6b46c1;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-number {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1a365d;
      line-height: 1;
    }

    .stat-label {
      color: #4a5568;
      font-size: 0.875rem;
      margin-top: 2px;
    }

    /* Category Stats */
    .category-stats {
      padding: 24px;
    }

    .category-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #e2e8f0;
    }

    .category-item:last-child {
      border-bottom: none;
    }

    .category-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .category-name {
      font-weight: 500;
      color: #2d3748;
    }

    .category-count {
      font-size: 0.8rem;
      color: #718096;
    }

    .category-bar {
      width: 80px;
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
    }

    .category-fill {
      height: 100%;
      background: linear-gradient(90deg, #3182ce 0%, #805ad5 100%);
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    /* Responsive Design */
    @media (max-width: 1200px) {
      .stats-section {
        grid-template-columns: 1fr;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .pricing-container {
        padding: 16px;
      }

      .pricing-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .form-row,
      .quality-grid {
        flex-direction: column;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .action-buttons {
        flex-direction: column;
        gap: 4px;
      }
    }

    /* Animations */
    @keyframes slideInOut {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class AdminPricingComponent implements OnInit {
  printSizes: any[] = [];
  showAddForm = false;
  addSizeForm: FormGroup;
  editingPrice: string | null = null;
  tempPrice: number = 0;
  isAdding = false;
  isLoading = false;

  displayedColumns = [
    'sizeCode',
    'displayName',
    'price',
    'quality',
    'status',
    'actions'
  ];

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private snackBar: MatSnackBar
  ) {
    this.addSizeForm = this.fb.group({
      sizeCode: ['', Validators.required],
      displayName: ['', Validators.required],
      width: ['', [Validators.required, Validators.min(0.1)]],
      height: ['', [Validators.required, Validators.min(0.1)]],
      price: ['', [Validators.required, Validators.min(0.01)]],
      minWidth: ['', [Validators.required, Validators.min(1)]],
      minHeight: ['', [Validators.required, Validators.min(1)]],
      recommendedWidth: ['', [Validators.required, Validators.min(1)]],
      recommendedHeight: ['', [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.loadPrintSizes();
  }

  loadPrintSizes(): void {
    this.isLoading = true;
    this.adminService.getAllPrintSizes().subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.printSizes = response.data;
        }
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Failed to load print sizes', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (this.showAddForm) {
      this.addSizeForm.reset();
    }
  }

  addNewSize(): void {
    if (this.addSizeForm.valid) {
      this.isAdding = true;

      this.adminService.addPrintSize(this.addSizeForm.value).subscribe({
        next: (response) => {
          this.isAdding = false;
          if (response.success) {
            this.snackBar.open('Print size added successfully', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.showAddForm = false;
            this.loadPrintSizes();
          }
        },
        error: () => {
          this.isAdding = false;
          this.snackBar.open('Failed to add print size', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  cancelAdd(): void {
    this.showAddForm = false;
    this.addSizeForm.reset();
  }

  startPriceEdit(size: any): void {
    this.editingPrice = size.id;
    this.tempPrice = size.price;
  }

  savePrice(size: any): void {
    if (this.tempPrice > 0) {
      this.adminService.updatePrintSize(size.id, {
        price: this.tempPrice,
        isActive: size.isActive
      }).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Price updated successfully', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.cancelPriceEdit();
            this.loadPrintSizes();
          }
        },
        error: () => {
          this.snackBar.open('Failed to update price', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  cancelPriceEdit(): void {
    this.editingPrice = null;
    this.tempPrice = 0;
  }

  toggleStatus(size: any): void {
    const newStatus = !size.isActive;

    this.adminService.updatePrintSize(size.id, {
      price: size.price,
      isActive: newStatus
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open(
            `Print size ${newStatus ? 'activated' : 'deactivated'}`,
            'Close',
            {
              duration: 3000,
              panelClass: ['success-snackbar']
            }
          );
          this.loadPrintSizes();
        }
      },
      error: () => {
        this.snackBar.open('Failed to update status', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  duplicateSize(size: any): void {
    const duplicateData = {
      sizeCode: `${size.sizeCode}_copy`,
      displayName: `${size.displayName} (Copy)`,
      width: size.width,
      height: size.height,
      price: size.price,
      minWidth: size.minWidth,
      minHeight: size.minHeight,
      recommendedWidth: size.recommendedWidth,
      recommendedHeight: size.recommendedHeight
    };

    this.adminService.addPrintSize(duplicateData).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Print size duplicated successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadPrintSizes();
        }
      },
      error: () => {
        this.snackBar.open('Failed to duplicate print size', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  // Enhanced helper methods
  getSizeCategory(size: any): string {
    const area = size.width * size.height;
    if (area <= 35) return 'Standard';
    if (area <= 80) return 'Large';
    if (area <= 150) return 'Extra Large';
    return 'Premium';
  }

  getActiveSizes(): any[] {
    return this.printSizes.filter(size => size.isActive);
  }

  getMinPrice(): number {
    const activeSizes = this.getActiveSizes();
    return activeSizes.length > 0 ? Math.min(...activeSizes.map(s => s.price)) : 0;
  }

  getMaxPrice(): number {
    const activeSizes = this.getActiveSizes();
    return activeSizes.length > 0 ? Math.max(...activeSizes.map(s => s.price)) : 0;
  }

  getAveragePrice(): number {
    const activeSizes = this.getActiveSizes();
    if (activeSizes.length === 0) return 0;
    const total = activeSizes.reduce((sum, size) => sum + size.price, 0);
    return total / activeSizes.length;
  }

  getQualityScore(size: any): number {
    // Calculate quality score based on resolution requirements
    const recommendedArea = size.recommendedWidth * size.recommendedHeight;
    const minArea = size.minWidth * size.minHeight;
    const ratio = recommendedArea / minArea;
    return Math.min(100, (ratio / 4) * 100); // Normalize to 0-100%
  }

  getStatusChipClass(isActive: boolean): string {
    return isActive ? 'active-chip' : 'inactive-chip';
  }

  getStatusIcon(isActive: boolean): string {
    return isActive ? 'visibility' : 'visibility_off';
  }

  getSizeCategories(): any[] {
    const categories = this.printSizes.reduce((acc, size) => {
      const category = this.getSizeCategory(size);
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const total = this.printSizes.length;
    return Object.entries(categories).map(([name, count]) => ({
      name,
      count: count as number,
      percentage: ((count as number) / total) * 100
    }));
  }
}
