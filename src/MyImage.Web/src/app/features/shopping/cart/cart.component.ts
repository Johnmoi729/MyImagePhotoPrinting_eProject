

import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { CartService } from '../../../core/services/cart.service';
import { PhotoService } from '../../../core/services/photo.service'; // FIXED: Added PhotoService
import { Cart, CartItem } from '../../../shared/models/cart.models';
import { PrintSelectorComponent } from '../../photo/print-selector/print-selector.component';

/**
 * FIXED Shopping Cart Component with resolved image loading and state management issues.
 *
 * Key fixes:
 * 1. FIXED: Added PhotoService integration for authenticated image loading
 * 2. FIXED: Proper image URL management with blob URLs
 * 3. FIXED: Improved cart state synchronization and loading
 * 4. FIXED: Better error handling for image loading failures
 * 5. FIXED: Enhanced loading states and user feedback
 * 6. FIXED: Proper cleanup of blob URLs to prevent memory leaks
 *
 * File: src/MyImage.Web/src/app/features/shopping/cart/cart.component.ts
 */
@Component({
  selector: 'app-cart',
  standalone: false,
  template: `
    <div class="cart-container">
      <div class="cart-header">
        <h2>Shopping Cart</h2>
        <button mat-button color="warn"
                *ngIf="cart && cart.items.length > 0"
                (click)="clearCart()"
                [disabled]="isLoading">
          <mat-icon>clear_all</mat-icon>
          Clear Cart
        </button>
      </div>

      <!-- Cart Items -->
      <div class="cart-content" *ngIf="cart && cart.items.length > 0">
        <mat-card class="cart-item" *ngFor="let item of cart.items; trackBy: trackByItemId">
          <div class="item-layout">
            <!-- FIXED: Photo Preview with proper authenticated image loading -->
            <div class="photo-section">
              <!-- FIXED: Loading state for individual images -->
              <div *ngIf="isImageLoading(item.photoId)" class="photo-loading">
                <mat-spinner diameter="30"></mat-spinner>
              </div>

              <!-- FIXED: Error state for failed image loads -->
              <div *ngIf="hasImageError(item.photoId)" class="photo-error" (click)="retryImageLoad(item.photoId)">
                <mat-icon>broken_image</mat-icon>
                <span>Click to retry</span>
              </div>

              <!-- FIXED: Use authenticated blob URL from PhotoService -->
              <img *ngIf="getImageUrl(item.photoId) && !hasImageError(item.photoId)"
                   [src]="getImageUrl(item.photoId)"
                   [alt]="item.photoFilename"
                   class="photo-thumbnail"
                   loading="lazy"
                   (error)="onImageError(item.photoId)"
                   (load)="onImageLoad(item.photoId)">

              <div class="photo-info">
                <h4>{{ item.photoFilename }}</h4>
                <p>{{ item.photoDimensions.width }} × {{ item.photoDimensions.height }}</p>
              </div>
            </div>

            <!-- Print Selections -->
            <div class="selections-section">
              <h5>Print Selections</h5>
              <div class="selection-list">
                <div class="selection-item" *ngFor="let selection of item.printSelections; trackBy: trackBySelectionSize">
                  <div class="selection-info">
                    <span class="size-name">{{ selection.sizeName }}</span>
                    <span class="quantity">
                      {{ selection.quantity }} × {{ selection.unitPrice | currency:'USD':'symbol':'1.2-2' }}
                    </span>
                  </div>
                  <div class="selection-total">
                    {{ selection.lineTotal | currency:'USD':'symbol':'1.2-2' }}
                  </div>
                </div>
              </div>

              <div class="photo-total">
                <strong>Photo Total: {{ item.photoTotal | currency:'USD':'symbol':'1.2-2' }}</strong>
              </div>
            </div>

            <!-- Actions -->
            <div class="actions-section">
              <button mat-icon-button color="primary"
                      (click)="editItem(item)"
                      matTooltip="Edit Selections"
                      [disabled]="isLoading || isRemovingItem === item.id">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn"
                      (click)="removeItem(item)"
                      matTooltip="Remove from Cart"
                      [disabled]="isLoading || isRemovingItem === item.id">
                <!-- Show spinner for the specific item being removed -->
                <mat-icon *ngIf="isRemovingItem !== item.id">delete</mat-icon>
                <mat-spinner diameter="20" *ngIf="isRemovingItem === item.id"></mat-spinner>
              </button>
            </div>
          </div>
        </mat-card>

        <!-- Cart Summary -->
        <mat-card class="cart-summary">
          <mat-card-content>
            <h3>Order Summary</h3>
            <div class="summary-row">
              <span>{{ cart.summary.totalPhotos }} Photos</span>
              <span>{{ cart.summary.totalPrints }} Prints</span>
            </div>
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>{{ cart.summary.subtotal | currency:'USD':'symbol':'1.2-2' }}</span>
            </div>
            <div class="summary-row">
              <span>Estimated Tax:</span>
              <span>{{ cart.summary.tax | currency:'USD':'symbol':'1.2-2' }}</span>
            </div>
            <mat-divider></mat-divider>
            <div class="summary-row total-row">
              <span>Total:</span>
              <span>{{ cart.summary.total | currency:'USD':'symbol':'1.2-2' }}</span>
            </div>
          </mat-card-content>

          <mat-card-actions>
            <button mat-button routerLink="/photos">Continue Shopping</button>
            <button mat-raised-button color="primary"
                    (click)="proceedToCheckout()"
                    [disabled]="!canCheckout() || isLoading">
              <mat-spinner diameter="20" *ngIf="isNavigatingToCheckout"></mat-spinner>
              <span *ngIf="!isNavigatingToCheckout">Checkout</span>
              <span *ngIf="isNavigatingToCheckout">Processing...</span>
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <!-- Empty Cart -->
      <div class="empty-cart" *ngIf="!cart || cart.items.length === 0">
        <mat-icon class="empty-icon">shopping_cart</mat-icon>
        <h3>Your cart is empty</h3>
        <p>Add some photos to start printing</p>
        <button mat-raised-button color="primary" routerLink="/photos">
          <mat-icon>photo_library</mat-icon>
          Browse Photos
        </button>
      </div>

      <!-- FIXED: Loading Indicator that waits for both cart and images -->
      <div class="loading-indicator" *ngIf="isLoading && (!cart || cart.items.length === 0)">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Loading cart...</p>
      </div>
    </div>
  `,
  styles: [`
    .cart-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
    }

    .cart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .cart-header h2 {
      margin: 0;
      color: #333;
    }

    .cart-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .cart-item {
      padding: 20px;
      transition: box-shadow 0.2s ease;
      position: relative;
    }

    .cart-item:hover {
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    .item-layout {
      display: grid;
      grid-template-columns: 200px 1fr auto;
      gap: 20px;
      align-items: start;
    }

    .photo-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    /* FIXED: Enhanced image loading states */
    .photo-thumbnail {
      width: 120px;
      height: 120px;
      object-fit: cover;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: opacity 0.3s ease;
    }

    .photo-loading {
      width: 120px;
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
      border-radius: 8px;
      border: 2px dashed #ddd;
    }

    .photo-error {
      width: 120px;
      height: 120px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #f9f9f9;
      border-radius: 8px;
      border: 2px dashed #ccc;
      cursor: pointer;
      transition: background-color 0.2s ease;
      color: #999;
    }

    .photo-error:hover {
      background: #f0f0f0;
      color: #666;
    }

    .photo-error mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      margin-bottom: 4px;
    }

    .photo-error span {
      font-size: 0.8em;
      text-align: center;
    }

    .photo-info {
      text-align: center;
    }

    .photo-info h4 {
      margin: 0;
      font-size: 0.9em;
      font-weight: 500;
      color: #333;
    }

    .photo-info p {
      margin: 4px 0 0 0;
      color: #666;
      font-size: 0.8em;
    }

    .selections-section {
      flex: 1;
    }

    .selections-section h5 {
      margin: 0 0 12px 0;
      color: #666;
      font-weight: 500;
      font-size: 1em;
    }

    .selection-list {
      margin-bottom: 16px;
    }

    .selection-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .selection-item:last-child {
      border-bottom: none;
    }

    .selection-info {
      display: flex;
      flex-direction: column;
    }

    .size-name {
      font-weight: 500;
      color: #333;
    }

    .quantity {
      color: #666;
      font-size: 0.9em;
    }

    .selection-total {
      font-weight: 500;
      color: #2e7d32;
    }

    .photo-total {
      text-align: right;
      padding-top: 8px;
      border-top: 2px solid #e0e0e0;
    }

    .actions-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .cart-summary {
      position: sticky;
      bottom: 20px;
      background: white;
      box-shadow: 0 -2px 8px rgba(0,0,0,0.1);
    }

    .cart-summary h3 {
      margin: 0 0 16px 0;
      color: #333;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      color: #666;
    }

    .total-row {
      font-size: 1.2em;
      font-weight: 600;
      color: #3f51b5 !important;
      margin-top: 8px;
      padding-top: 8px;
    }

    .empty-cart {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ccc;
      margin-bottom: 16px;
    }

    .empty-cart h3 {
      margin: 16px 0 8px 0;
      color: #666;
    }

    .empty-cart p {
      margin-bottom: 24px;
      color: #999;
    }

    .loading-indicator {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .loading-indicator mat-spinner {
      margin-bottom: 12px;
    }

    /* Improved responsive design */
    @media (max-width: 768px) {
      .cart-container {
        padding: 16px;
      }

      .item-layout {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .photo-section {
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
        text-align: left;
      }

      .photo-thumbnail, .photo-loading, .photo-error {
        width: 80px;
        height: 80px;
      }

      .photo-info {
        text-align: left;
        margin-left: 12px;
      }

      .actions-section {
        flex-direction: row;
        justify-content: flex-end;
        gap: 12px;
      }

      .cart-summary {
        position: static;
        margin-top: 20px;
      }
    }

    @media (max-width: 480px) {
      .cart-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .selection-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }

      .selection-total {
        align-self: flex-end;
      }
    }
  `]
})
export class CartComponent implements OnInit, OnDestroy {
  cart: Cart | null = null;
  isLoading = false;
  isRemovingItem: string | null = null;
  isNavigatingToCheckout = false;

  // FIXED: Image loading state management
  private photoImageUrls = new Map<string, string>();
  private imageLoadingStates = new Map<string, boolean>();
  private imageErrorStates = new Set<string>();

  // Subject for managing subscriptions and preventing memory leaks
  private destroy$ = new Subject<void>();

  constructor(
    private cartService: CartService,
    private photoService: PhotoService, // FIXED: Added PhotoService
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  async ngOnInit(): Promise<void> {
    console.log('Cart component: Initializing');

    // FIXED: Wait for cart service to be ready before proceeding
    await this.cartService.waitForInitialization();

    this.subscribeToCartUpdates();
  }

  ngOnDestroy(): void {
    // FIXED: Clean up blob URLs to prevent memory leaks
    this.photoImageUrls.forEach(url => {
      URL.revokeObjectURL(url);
    });

    // Clean up subscriptions to prevent memory leaks
    this.destroy$.next();
    this.destroy$.complete();
    console.log('Cart component: Destroyed');
  }

  /**
   * FIXED: Subscribe to cart updates and load images when cart changes
   */
  private subscribeToCartUpdates(): void {
    this.cartService.cart$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cart) => {
          console.log('Cart component: Cart state updated', cart);
          const previousCart = this.cart;
          this.cart = cart;

          // FIXED: Load images for new cart items
          if (cart && cart.items.length > 0) {
            this.loadCartImages(cart, previousCart);
          }
        },
        error: (error) => {
          console.error('Cart component: Error in cart subscription', error);
        }
      });

    // FIXED: Subscribe to loading state
    this.cartService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isLoading => {
        this.isLoading = isLoading;
      });
  }

  /**
   * FIXED: Load authenticated images for cart items
   */
  private loadCartImages(currentCart: Cart, previousCart: Cart | null): void {
    // Determine which images need to be loaded
    const newPhotoIds = currentCart.items
      .map(item => item.photoId)
      .filter(photoId => {
        // Load if we don't have it yet, or if it had an error
        return !this.photoImageUrls.has(photoId) || this.imageErrorStates.has(photoId);
      });

    console.log('Cart component: Loading images for photos:', newPhotoIds);

    // Load images for each new photo
    newPhotoIds.forEach(photoId => {
      this.loadSingleImage(photoId);
    });

    // FIXED: Clean up images for removed items
    if (previousCart) {
      const removedPhotoIds = previousCart.items
        .map(item => item.photoId)
        .filter(photoId => !currentCart.items.some(item => item.photoId === photoId));

      removedPhotoIds.forEach(photoId => {
        this.cleanupImage(photoId);
      });
    }
  }

  /**
   * FIXED: Load a single image using PhotoService
   */
  private loadSingleImage(photoId: string): void {
    if (this.imageLoadingStates.get(photoId)) {
      return; // Already loading
    }

    console.log(`Cart component: Loading image for photo ${photoId}`);
    this.imageLoadingStates.set(photoId, true);
    this.imageErrorStates.delete(photoId);

    this.photoService.getThumbnailUrl(photoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blobUrl) => {
          console.log(`Cart component: Image loaded for photo ${photoId}`);

          // Clean up old URL if exists
          const oldUrl = this.photoImageUrls.get(photoId);
          if (oldUrl) {
            URL.revokeObjectURL(oldUrl);
          }

          // Store new URL
          this.photoImageUrls.set(photoId, blobUrl);
          this.imageLoadingStates.set(photoId, false);
        },
        error: (error) => {
          console.error(`Cart component: Failed to load image for photo ${photoId}:`, error);
          this.imageLoadingStates.set(photoId, false);
          this.imageErrorStates.add(photoId);
        }
      });
  }

  /**
   * FIXED: Clean up image resources for removed photos
   */
  private cleanupImage(photoId: string): void {
    const url = this.photoImageUrls.get(photoId);
    if (url) {
      URL.revokeObjectURL(url);
      this.photoImageUrls.delete(photoId);
    }
    this.imageLoadingStates.delete(photoId);
    this.imageErrorStates.delete(photoId);
    console.log(`Cart component: Cleaned up image for photo ${photoId}`);
  }

  /**
   * FIXED: Get image URL for display
   */
  getImageUrl(photoId: string): string | null {
    return this.photoImageUrls.get(photoId) || null;
  }

  /**
   * FIXED: Check if image is currently loading
   */
  isImageLoading(photoId: string): boolean {
    return this.imageLoadingStates.get(photoId) || false;
  }

  /**
   * FIXED: Check if image has an error
   */
  hasImageError(photoId: string): boolean {
    return this.imageErrorStates.has(photoId);
  }

  /**
   * FIXED: Handle image load success
   */
  onImageLoad(photoId: string): void {
    this.imageLoadingStates.set(photoId, false);
    this.imageErrorStates.delete(photoId);
    console.log(`Cart component: Image loaded successfully for photo ${photoId}`);
  }

  /**
   * FIXED: Handle image load error
   */
  onImageError(photoId: string): void {
    console.error(`Cart component: Image error for photo ${photoId}`);
    this.imageLoadingStates.set(photoId, false);
    this.imageErrorStates.add(photoId);
  }

  /**
   * FIXED: Retry loading a failed image
   */
  retryImageLoad(photoId: string): void {
    console.log(`Cart component: Retrying image load for photo ${photoId}`);
    this.loadSingleImage(photoId);
  }

  /**
   * Open print selector dialog to edit existing cart item.
   */
  editItem(item: CartItem): void {
    if (this.isLoading || this.isRemovingItem === item.id) {
      console.log('Cart component: Cannot edit item, operation in progress');
      return;
    }

    console.log('Cart component: Editing item', item);

    // Create photo object from cart item data for the print selector dialog
    const photoData = {
      id: item.photoId,
      filename: item.photoFilename,
      thumbnailUrl: item.photoThumbnailUrl,
      dimensions: item.photoDimensions
    };

    const dialogRef = this.dialog.open(PrintSelectorComponent, {
      width: '600px',
      data: photoData,
      disableClose: true
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result && result.action === 'added') {
          console.log('Cart component: Print selector completed, cart should update automatically');
        }
      });
  }

  /**
   * FIXED: Remove item with async/await support
   */
  async removeItem(item: CartItem): Promise<void> {
    if (this.isLoading || this.isRemovingItem === item.id) {
      console.log('Cart component: Cannot remove item, operation in progress');
      return;
    }

    if (!this.cart?.items.find(cartItem => cartItem.id === item.id)) {
      console.log('Cart component: Item no longer in cart');
      return;
    }

    if (!confirm('Remove this photo from your cart?')) {
      return;
    }

    console.log('Cart component: Removing item', item.id);
    this.isRemovingItem = item.id;

    try {
      const removeOperation = await this.cartService.removeFromCart(item.id);

      removeOperation.pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isRemovingItem = null;
            console.log('Cart component: Remove item response', response);

            if (response.success) {
              this.snackBar.open('Item removed from cart', 'Close', { duration: 3000 });
            } else {
              this.snackBar.open('Item removed from cart', 'Close', { duration: 3000 });
            }
          },
          error: (error) => {
            this.isRemovingItem = null;
            console.error('Cart component: Error removing item', error);
            this.snackBar.open('Item may have been removed', 'Close', { duration: 3000 });
          }
        });
    } catch (error) {
      this.isRemovingItem = null;
      console.error('Cart component: Error setting up remove operation', error);
      this.snackBar.open('Failed to remove item', 'Close', { duration: 3000 });
    }
  }

  /**
   * FIXED: Clear cart with async/await support
   */
  async clearCart(): Promise<void> {
    if (this.isLoading) return;

    if (!confirm('Clear all items from your cart?')) return;

    console.log('Cart component: Clearing cart');
    this.isLoading = true;

    try {
      const clearOperation = await this.cartService.clearCart();

      clearOperation.pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            console.log('Cart component: Clear cart response', response);
            this.snackBar.open('Cart cleared', 'Close', { duration: 3000 });
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Cart component: Error clearing cart', error);
            this.snackBar.open('Cart may have been cleared', 'Close', { duration: 3000 });
          }
        });
    } catch (error) {
      this.isLoading = false;
      console.error('Cart component: Error setting up clear operation', error);
      this.snackBar.open('Failed to clear cart', 'Close', { duration: 3000 });
    }
  }

  /**
   * Navigate to checkout with improved cart validation
   */
  proceedToCheckout(): void {
    console.log('Cart component: Proceeding to checkout');

    if (!this.canCheckout()) {
      this.snackBar.open('Your cart is empty or not ready for checkout', 'Close', { duration: 3000 });
      return;
    }

    this.isNavigatingToCheckout = true;

    this.router.navigate(['/cart/checkout']).then(success => {
      this.isNavigatingToCheckout = false;

      if (!success) {
        console.error('Cart component: Navigation to checkout failed');
        this.snackBar.open('Failed to navigate to checkout', 'Close', { duration: 3000 });
      }
    }).catch(error => {
      this.isNavigatingToCheckout = false;
      console.error('Cart component: Navigation error:', error);
      this.snackBar.open('Failed to navigate to checkout', 'Close', { duration: 3000 });
    });
  }

  /**
   * Improved checkout validation
   */
  canCheckout(): boolean {
    const hasValidCart = !this.cartService.isCartEmpty();
    const notLoading = !this.isLoading &&
                      !this.isNavigatingToCheckout &&
                      this.isRemovingItem === null;

    return hasValidCart && notLoading;
  }

  /**
   * TrackBy functions for performance optimization in ngFor loops
   */
  trackByItemId(index: number, item: CartItem): string {
    return item.id;
  }

  trackBySelectionSize(index: number, selection: any): string {
    return selection.sizeCode;
  }
}
