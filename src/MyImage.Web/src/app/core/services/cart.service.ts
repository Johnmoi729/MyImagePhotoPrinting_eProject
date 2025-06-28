

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, finalize, Observable, of, retry, tap, timer } from 'rxjs'; // FIXED: Added timer import
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api.models';
import { Cart, PrintSelection } from '../../shared/models/cart.models';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  // Use BehaviorSubject for reactive cart state management
  private cartSubject = new BehaviorSubject<Cart | null>(null);
  public cart$ = this.cartSubject.asObservable();

  // FIXED: Better loading state management
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  // FIXED: Track initialization to prevent race conditions
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor(private http: HttpClient) {
    // FIXED: Start initialization immediately but don't block constructor
    this.initializeCart();
  }

  /**
   * FIXED: Proper initialization that ensures cart loads on startup
   * This method ensures cart is loaded once and handles race conditions properly
   */
  private initializeCart(): void {
    if (this.initializationPromise) {
      return; // Already initializing
    }

    console.log('Cart service: Starting initialization');

    this.initializationPromise = new Promise((resolve) => {
      this.loadCartInternal().subscribe({
        next: (response) => {
          this.isInitialized = true;
          console.log('Cart service: Initialization completed successfully');
          resolve();
        },
        error: (error) => {
          this.isInitialized = true; // Mark as initialized even on error
          console.error('Cart service: Initialization failed, but continuing:', error);
          resolve(); // Don't reject - allow service to continue working
        }
      });
    });
  }

  /**
   * FIXED: Wait for initialization to complete before proceeding with operations
   */
  private async ensureInitialized(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      await this.initializationPromise;
    }
  }

  /**
   * FIXED: Public loadCart method that ensures initialization
   */
  loadCart(): Observable<ApiResponse<Cart>> {
    console.log('Cart service: Public loadCart called');

    // If not initialized, return initialization result
    if (!this.isInitialized) {
      console.log('Cart service: Not initialized, triggering initialization');
      this.initializeCart();
      return this.loadCartInternal();
    }

    // If already initialized, perform normal load
    return this.loadCartInternal();
  }

  /**
   * FIXED: Internal cart loading with proper retry configuration using timer()
   */
  private loadCartInternal(): Observable<ApiResponse<Cart>> {
    console.log('Cart service: Loading cart from API');

    // Set loading state
    this.loadingSubject.next(true);

    return this.http.get<ApiResponse<Cart>>(`${environment.apiUrl}/cart`)
      .pipe(
        // FIXED: Proper retry configuration using timer() for delay
        retry({
          count: 2,
          delay: (error, retryCount) => {
            console.log(`Cart service: Retry attempt ${retryCount} after error:`, error);
            // FIXED: Return timer observable for proper delay
            return timer(1000 * retryCount); // Progressive delay: 1s, 2s
          }
        }),
        tap(response => {
          console.log('Cart service: Load response received', response);
          if (response.success && response.data) {
            // Update cart state with new data
            this.cartSubject.next(response.data);
            console.log('Cart service: Cart state updated', response.data);
          } else {
            // API success but no data - empty cart
            this.cartSubject.next(null);
            console.log('Cart service: Empty cart loaded');
          }
        }),
        catchError(error => {
          console.error('Cart service: Failed to load cart', error);

          // FIXED: Only clear cart on specific errors, not auth errors
          if (error.status === 401 || error.status === 403) {
            // Authentication issues - clear cart
            this.cartSubject.next(null);
            console.log('Cart service: Cleared cart due to authentication error');
          } else {
            // Network errors - keep existing state if any, otherwise set to null
            const currentCart = this.cartSubject.value;
            if (!currentCart) {
              this.cartSubject.next(null);
            }
            console.log('Cart service: Keeping existing cart state due to network error');
          }

          // Return error response but don't block subsequent operations
          return of(this.createErrorResponse('Failed to load cart', error));
        }),
        finalize(() => {
          // Always clear loading state
          this.loadingSubject.next(false);
          console.log('Cart service: Load operation completed');
        })
      );
  }

  /**
   * FIXED: Add photo to cart - return Observable directly for immediate subscription
   */
  addToCart(photoId: string, printSelections: PrintSelection[]): Observable<ApiResponse<Cart>> {
    console.log('Cart service: Adding to cart', { photoId, printSelections });

    // Input validation
    if (!photoId || !printSelections || printSelections.length === 0) {
      const error = this.createErrorResponse('Invalid cart data', null, ['Photo ID and print selections are required']);
      console.warn('Cart service: Invalid input for addToCart', error);
      return of(error);
    }

    // Validate print selections
    const invalidSelections = printSelections.filter(
      selection => !selection.sizeCode || selection.quantity <= 0
    );

    if (invalidSelections.length > 0) {
      const error = this.createErrorResponse('Invalid print selections', null, ['All selections must have valid size code and quantity > 0']);
      console.warn('Cart service: Invalid print selections', invalidSelections);
      return of(error);
    }

    // FIXED: Return Observable directly - let components handle async if needed
    return this.http.post<ApiResponse<Cart>>(`${environment.apiUrl}/cart/items`, {
      photoId,
      printSelections
    }).pipe(
      tap(response => {
        console.log('Cart service: Add to cart response', response);
        if (response.success && response.data) {
          // Immediately update cart state
          this.cartSubject.next(response.data);
          console.log('Cart service: Cart updated after add', response.data);
        }
      }),
      catchError(error => {
        console.error('Cart service: Failed to add to cart', error);
        return of(this.createErrorResponse('Failed to add to cart', error));
      })
    );
  }

  /**
   * FIXED: Remove item from cart - return Observable directly
   */
  removeFromCart(itemId: string): Observable<ApiResponse<void>> {
    console.log('Cart service: Removing item from cart', itemId);

    if (!itemId) {
      const error = this.createErrorResponse('Invalid item ID', null, ['Item ID is required']);
      console.warn('Cart service: No item ID provided for removal');
      return of(error as any);
    }

    // Check current cart state and optimistically update UI
    const currentCart = this.cartSubject.value;
    if (!currentCart || !currentCart.items.find(item => item.id === itemId)) {
      console.warn('Cart service: Item not found in current cart state', itemId);
      // Item already removed, return success immediately
      return of({
        success: true,
        data: null as any,
        message: 'Item already removed',
        errors: [],
        timestamp: new Date().toISOString()
      });
    }

    // Optimistically update UI by removing item immediately
    const updatedCart = {
      ...currentCart,
      items: currentCart.items.filter(item => item.id !== itemId)
    };

    // Recalculate summary
    updatedCart.summary = {
      ...currentCart.summary,
      totalPhotos: updatedCart.items.length,
      totalPrints: updatedCart.items.reduce((total, item) =>
        total + item.printSelections.reduce((itemTotal, selection) => itemTotal + selection.quantity, 0), 0),
      subtotal: updatedCart.items.reduce((total, item) => total + item.photoTotal, 0)
    };
    updatedCart.summary.tax = updatedCart.summary.subtotal * 0.0625; // Default tax rate
    updatedCart.summary.total = updatedCart.summary.subtotal + updatedCart.summary.tax;

    // Update state immediately for better UX
    console.log('Cart service: Optimistically updating cart state');
    this.cartSubject.next(updatedCart.items.length > 0 ? updatedCart : null);

    return this.http.delete<ApiResponse<void>>(`${environment.apiUrl}/cart/items/${itemId}`)
      .pipe(
        tap(response => {
          console.log('Cart service: Remove item response', response);
          if (response.success) {
            console.log('Cart service: Server confirmed item removal');
          } else {
            console.warn('Cart service: Server did not confirm removal, reverting state');
            this.cartSubject.next(currentCart);
          }
        }),
        catchError(error => {
          console.error('Cart service: Failed to remove from cart', error);

          if (error.status === 404) {
            console.log('Cart service: Item not found on server (404), keeping optimistic update');
            return of({
              success: true,
              data: null as any,
              message: 'Item was already removed',
              errors: [],
              timestamp: new Date().toISOString()
            });
          } else {
            console.log('Cart service: Server error, reverting optimistic update');
            this.cartSubject.next(currentCart);
            return of(this.createErrorResponse('Failed to remove from cart', error) as any);
          }
        })
      );
  }

  /**
   * Update cart item with validation and error handling.
   */
  updateCartItem(itemId: string, printSelections: PrintSelection[]): Observable<ApiResponse<Cart>> {
    console.log('Cart service: Updating cart item', { itemId, printSelections });

    if (!itemId || !printSelections) {
      const error = this.createErrorResponse('Invalid update data', null, ['Item ID and print selections are required']);
      console.warn('Cart service: Invalid input for updateCartItem', error);
      return of(error);
    }

    return this.http.put<ApiResponse<Cart>>(`${environment.apiUrl}/cart/items/${itemId}`, {
      printSelections
    }).pipe(
      tap(response => {
        console.log('Cart service: Update item response', response);
        if (response.success && response.data) {
          this.cartSubject.next(response.data);
          console.log('Cart service: Cart updated after item update', response.data);
        }
      }),
      catchError(error => {
        console.error('Cart service: Failed to update cart item', error);
        return of(this.createErrorResponse('Failed to update cart item', error));
      })
    );
  }

  /**
   * FIXED: Clear entire cart - return Observable directly
   */
  clearCart(): Observable<ApiResponse<void>> {
    console.log('Cart service: Clearing cart');

    // Optimistically clear cart state immediately
    this.cartSubject.next(null);

    return this.http.delete<ApiResponse<void>>(`${environment.apiUrl}/cart`)
      .pipe(
        tap(response => {
          console.log('Cart service: Clear cart response', response);
          if (response.success) {
            console.log('Cart service: Server confirmed cart cleared');
          }
        }),
        catchError(error => {
          console.error('Cart service: Failed to clear cart', error);
          return of(this.createErrorResponse('Failed to clear cart', error) as any);
        })
      );
  }

  /**
   * Calculate tax and total for current cart state.
   */
  calculateTotal(subtotal: number, state: string, postalCode: string): Observable<ApiResponse<any>> {
    console.log('Cart service: Calculating total', { subtotal, state, postalCode });

    if (!subtotal || subtotal <= 0) {
      return of(this.createErrorResponse('Invalid subtotal', null, ['Subtotal must be greater than 0']));
    }

    if (!state || state.trim().length === 0) {
      return of(this.createErrorResponse('Invalid state', null, ['State is required for tax calculation']));
    }

    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/cart/calculate-total`, {
      subtotal,
      state,
      postalCode
    }).pipe(
      tap(response => {
        console.log('Cart service: Tax calculation response', response);
      }),
      catchError(error => {
        console.error('Cart service: Failed to calculate total', error);
        return of(this.createErrorResponse('Failed to calculate total', error));
      })
    );
  }

  /**
   * Get current cart state with null safety.
   */
  getCurrentCart(): Cart | null {
    return this.cartSubject.value;
  }

  /**
   * Get cart item count for header display.
   */
  getCartItemCount(): number {
    const cart = this.getCurrentCart();
    return cart?.summary?.totalPhotos ?? 0;
  }

  /**
   * Get cart total amount for display.
   */
  getCartTotal(): number {
    const cart = this.getCurrentCart();
    return cart?.summary?.total ?? 0;
  }

  /**
   * Check if cart has any items.
   */
  hasItems(): boolean {
    const cart = this.getCurrentCart();
    return (cart?.items?.length ?? 0) > 0;
  }

  /**
   * FIXED: Force refresh cart state from server
   */
  refreshCart(): Observable<ApiResponse<Cart>> {
    console.log('Cart service: Force refreshing cart');
    return this.loadCartInternal();
  }

  /**
   * Get cart state synchronously for immediate use
   */
  getCartSync(): Cart | null {
    return this.cartSubject.value;
  }

  /**
   * Check if cart is empty synchronously
   */
  isCartEmpty(): boolean {
    const cart = this.cartSubject.value;
    return !cart || !cart.items || cart.items.length === 0;
  }

  /**
   * FIXED: Check if service is properly initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * FIXED: Get initialization promise for components that need to wait
   */
  waitForInitialization(): Promise<void> {
    if (this.isInitialized) {
      return Promise.resolve();
    }
    return this.initializationPromise || Promise.resolve();
  }

  /**
   * Helper method to create consistent error responses.
   */
  private createErrorResponse(message: string, error?: any, errors?: string[]): ApiResponse<any> {
    return {
      success: false,
      data: null as any,
      message: message,
      errors: errors || [this.getErrorMessage(error)],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Extract meaningful error message from HTTP error response.
   */
  private getErrorMessage(error: any): string {
    if (error?.error?.message) {
      return error.error.message;
    } else if (error?.message) {
      return error.message;
    } else if (error?.status) {
      switch (error.status) {
        case 400:
          return 'Invalid request data';
        case 401:
          return 'Authentication required';
        case 403:
          return 'Access denied';
        case 404:
          return 'Resource not found';
        case 500:
          return 'Server error occurred';
        default:
          return `HTTP ${error.status} error`;
      }
    } else {
      return 'Network error occurred';
    }
  }
}
