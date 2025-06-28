
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

// FIXED: Added all necessary Material modules for enhanced UI
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { OrderDetailComponent } from './order-detail/order-detail.component';
import { OrderListComponent } from './order-list/order-list.component';

const routes: Routes = [
  { path: '', component: OrderListComponent },
  { path: ':id', component: OrderDetailComponent }
];

@NgModule({
  declarations: [
    OrderListComponent,
    OrderDetailComponent
  ],
  imports: [
    CommonModule,
    FormsModule, // FIXED: Added FormsModule for ngModel in filters
    RouterModule.forChild(routes),

    // FIXED: Enhanced Material module imports for full UI compatibility
    MatBadgeModule,          // For notification badges
    MatButtonModule,         // For buttons and action buttons
    MatCardModule,           // For cards and sections
    MatChipsModule,          // For status chips and tags
    MatDividerModule,        // For section dividers
    MatExpansionModule,      // For expandable order details
    MatFormFieldModule,      // For form fields and filters
    MatIconModule,           // For icons throughout the interface
    MatInputModule,          // For input fields
    MatMenuModule,           // For action menus
    MatPaginatorModule,      // For table pagination
    MatProgressSpinnerModule, // For loading states
    MatSelectModule,         // For filter dropdowns
    MatSnackBarModule,       // For notifications
    MatTableModule,          // For data tables
    MatTooltipModule         // For tooltips on action buttons
  ]
})
export class OrdersModule { }
