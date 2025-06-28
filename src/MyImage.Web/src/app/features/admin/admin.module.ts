
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio'; // FIXED: Added missing MatRadioModule
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { AdminOrdersComponent } from './admin-orders/admin-orders.component';
import { AdminPricingComponent } from './admin-pricing/admin-pricing.component';
import { OrderDetailsDialogComponent } from './order-details-dialog/order-details-dialog.component';
import { OrderStatusDialogComponent } from './order-status-dialog/order-status-dialog.component';

// FIXED: Proper admin routing with dashboard as default and no wildcard redirect
const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }, // Default to dashboard
  { path: 'dashboard', component: AdminDashboardComponent },
  { path: 'orders', component: AdminOrdersComponent },
  { path: 'pricing', component: AdminPricingComponent }
  // REMOVED: wildcard route that was causing the issue
];

@NgModule({
  declarations: [
    AdminDashboardComponent,
    AdminOrdersComponent,
    AdminPricingComponent,
    OrderStatusDialogComponent,
    OrderDetailsDialogComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),

    // Material modules - FIXED: Added MatRadioModule
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTooltipModule,
    MatDividerModule,
    MatMenuModule,
    MatRadioModule // FIXED: This was missing and causing mat-radio-button errors
  ]
})
export class AdminModule { }
