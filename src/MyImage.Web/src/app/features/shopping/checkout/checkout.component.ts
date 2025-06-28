

import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { StripeElements, StripePaymentElement } from '@stripe/stripe-js';
import { Subject, takeUntil, timer } from 'rxjs';
import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { StripeService } from '../../../core/services/stripe.service';
import { Cart } from '../../../shared/models/cart.models';

interface ShippingAddress {
  fullName: string;
  streetLine1: string;
  streetLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

/**
 * FIXED: Checkout Component with corrected payment flow
 *
 * NEW FLOW (fixes both issues):
 * 1. User fills shipping address
 * 2. User chooses payment method
 * 3a. If credit card: Create Payment Intent → Create Order → Confirm payment
 * 3b. If branch payment: Create Order directly (no Payment Intent needed)
 *
 * FIXED: Conditional Stripe initialization only when needed
 */
@Component({
  selector: 'app-checkout',
  standalone: false,
  template: `
    <div class="checkout-container">
      <h2>Checkout</h2>

      <!-- Cart Empty State -->
      <div class="empty-cart" *ngIf="showEmptyCartMessage && !isLoadingCart">
        <mat-icon class="empty-icon">shopping_cart</mat-icon>
        <h3>Your cart is empty</h3>
        <p>Add some photos to your cart before checking out</p>
        <button mat-raised-button color="primary" routerLink="/photos">Browse Photos</button>
        <button mat-button routerLink="/cart">Return to Cart</button>
      </div>

      <!-- Checkout Process -->
      <div class="checkout-layout" *ngIf="(cart && cart.items.length > 0) || isLoadingCart">

        <!-- Loading State -->
        <div class="loading-state" *ngIf="isLoadingCart && !cart">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading checkout...</p>
        </div>

        <!-- Checkout Form -->
        <div class="checkout-form" *ngIf="cart && cart.items.length > 0">
          <mat-stepper [linear]="true" #stepper>

            <!-- Shipping Address Step -->
            <mat-step [stepControl]="shippingForm" label="Shipping Address">
              <form [formGroup]="shippingForm" class="step-form">
                <div class="form-row">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Full Name</mat-label>
                    <input matInput formControlName="fullName" required>
                    <mat-error *ngIf="shippingForm.get('fullName')?.hasError('required')">
                      Full name is required
                    </mat-error>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Street Address</mat-label>
                    <input matInput formControlName="streetLine1" required>
                    <mat-error *ngIf="shippingForm.get('streetLine1')?.hasError('required')">
                      Street address is required
                    </mat-error>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Apartment, suite, etc. (optional)</mat-label>
                    <input matInput formControlName="streetLine2">
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="half-width">
                    <mat-label>City</mat-label>
                    <input matInput formControlName="city" required>
                    <mat-error *ngIf="shippingForm.get('city')?.hasError('required')">
                      City is required
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="quarter-width">
                    <mat-label>State</mat-label>
                    <mat-select formControlName="state" required>
                      <mat-option value="MA">Massachusetts</mat-option>
                      <mat-option value="NH">New Hampshire</mat-option>
                      <mat-option value="NY">New York</mat-option>
                      <mat-option value="CT">Connecticut</mat-option>
                      <mat-option value="RI">Rhode Island</mat-option>
                      <mat-option value="VT">Vermont</mat-option>
                    </mat-select>
                    <mat-error *ngIf="shippingForm.get('state')?.hasError('required')">
                      State is required
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="quarter-width">
                    <mat-label>ZIP Code</mat-label>
                    <input matInput formControlName="postalCode" required pattern="[0-9]{5}(-[0-9]{4})?">
                    <mat-error *ngIf="shippingForm.get('postalCode')?.hasError('required')">
                      ZIP code is required
                    </mat-error>
                    <mat-error *ngIf="shippingForm.get('postalCode')?.hasError('pattern')">
                      Invalid ZIP code format
                    </mat-error>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Phone Number</mat-label>
                    <input matInput formControlName="phone" type="tel" required pattern="[\+]?[1-9][\d]{0,15}">
                    <mat-error *ngIf="shippingForm.get('phone')?.hasError('required')">
                      Phone number is required
                    </mat-error>
                    <mat-error *ngIf="shippingForm.get('phone')?.hasError('pattern')">
                      Invalid phone number format
                    </mat-error>
                  </mat-form-field>
                </div>

                <div class="step-actions">
                  <button mat-raised-button color="primary" matStepperNext
                          [disabled]="shippingForm.invalid">
                    Continue to Payment
                  </button>
                </div>
              </form>
            </mat-step>

            <!-- Payment Method Step -->
            <mat-step [stepControl]="paymentForm" label="Payment Method">
              <form [formGroup]="paymentForm" class="step-form">

                <div class="payment-methods">
                  <mat-radio-group formControlName="paymentMethod"
                                   class="payment-options"
                                   (change)="onPaymentMethodChange($event.value)">
                    <mat-radio-button value="credit_card" class="payment-option">
                      <div class="payment-info">
                        <div class="payment-title">
                          <mat-icon>credit_card</mat-icon>
                          Credit Card
                        </div>
                        <p>Secure online payment with automatic verification</p>
                      </div>
                    </mat-radio-button>

                    <mat-radio-button value="branch_payment" class="payment-option">
                      <div class="payment-info">
                        <div class="payment-title">
                          <mat-icon>store</mat-icon>
                          Pay at Branch
                        </div>
                        <p>Pay in person at our physical location</p>
                      </div>
                    </mat-radio-button>
                  </mat-radio-group>
                </div>

                <!-- FIXED: Stripe initialization status display -->
                <div class="stripe-initialization" *ngIf="paymentForm.get('paymentMethod')?.value === 'credit_card'">
                  <div class="loading-stripe" *ngIf="isInitializingStripe">
                    <mat-spinner diameter="20"></mat-spinner>
                    <span>Initializing secure payment system...</span>
                  </div>

                  <div class="stripe-error" *ngIf="stripeInitError">
                    <mat-icon color="warn">error</mat-icon>
                    <span>{{ stripeInitError }}</span>
                    <button mat-button (click)="retryStripeInit()">Retry</button>
                  </div>
                </div>

                <!-- Stripe Payment Element -->
                <div class="stripe-payment-section"
                     *ngIf="paymentForm.get('paymentMethod')?.value === 'credit_card' && isStripeReady && paymentIntent">
                  <h4>Payment Information</h4>
                  <div class="stripe-element-container">
                    <div #stripePaymentElement id="stripe-payment-element" class="stripe-element">
                      <!-- Stripe Elements renders here -->
                    </div>
                  </div>
                  <div class="payment-security-info">
                    <mat-icon>security</mat-icon>
                    <span>Your payment information is encrypted and secure</span>
                  </div>
                </div>

                <!-- Branch Payment Info -->
                <div class="branch-payment-section"
                     *ngIf="paymentForm.get('paymentMethod')?.value === 'branch_payment'">
                  <h4>Branch Payment</h4>
                  <p>You can pay for your order at any of our branch locations:</p>
                  <ul class="branch-list">
                    <li><strong>Boston Downtown</strong><br>123 Main St, Boston, MA 02101<br>Phone: (617) 555-0100</li>
                    <li><strong>Cambridge Center</strong><br>456 Tech Blvd, Cambridge, MA 02139<br>Phone: (617) 555-0200</li>
                  </ul>
                  <p><strong>Reference Number:</strong> Will be provided after order confirmation</p>
                </div>

                <div class="step-actions">
                  <button mat-button matStepperPrevious>Back</button>
                  <button mat-raised-button color="primary"
                          [disabled]="!canPlaceOrder() || isProcessingPayment"
                          (click)="finalizeOrder()">
                    <mat-spinner diameter="20" *ngIf="isProcessingPayment"></mat-spinner>
                    <span *ngIf="!isProcessingPayment">
                      Complete Order - {{ finalTotal | currency:'USD':'symbol':'1.2-2' }}
                    </span>
                  </button>
                </div>
              </form>
            </mat-step>
          </mat-stepper>
        </div>

        <!-- Order Summary -->
        <div class="order-summary" *ngIf="cart && cart.items.length > 0">
          <mat-card>
            <mat-card-header>
              <mat-card-title>Order Summary</mat-card-title>
            </mat-card-header>

            <mat-card-content>
              <div class="summary-item" *ngFor="let item of cart.items">
                <div class="item-info">
                  <span class="item-name">{{ item.photoFilename }}</span>
                  <span class="item-details">{{ getTotalPrintsForItem(item) }} prints</span>
                </div>
                <span class="item-total">{{ item.photoTotal | currency:'USD':'symbol':'1.2-2' }}</span>
              </div>

              <mat-divider></mat-divider>

              <div class="summary-row">
                <span>Subtotal:</span>
                <span>{{ cart.summary.subtotal | currency:'USD':'symbol':'1.2-2' }}</span>
              </div>

              <div class="summary-row">
                <span>Tax:</span>
                <span>{{ finalTax | currency:'USD':'symbol':'1.2-2' }}</span>
              </div>

              <div class="summary-row total-row">
                <span>Total:</span>
                <span>{{ finalTotal | currency:'USD':'symbol':'1.2-2' }}</span>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <!-- Error State -->
      <div class="error-state" *ngIf="hasError && !isLoadingCart">
        <mat-icon class="error-icon">error</mat-icon>
        <h3>Unable to Load Checkout</h3>
        <p>{{ errorMessage }}</p>
        <button mat-raised-button color="primary" (click)="retryLoad()">Try Again</button>
        <button mat-button routerLink="/cart">Return to Cart</button>
      </div>
    </div>
  `,
  styles: [`
    .checkout-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .checkout-layout {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 40px;
      margin-top: 20px;
    }

    .step-form {
      padding: 20px 0;
    }

    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }

    .full-width { width: 100%; }
    .half-width { flex: 1; }
    .quarter-width { flex: 0.5; }

    .payment-options {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .payment-option {
      padding: 16px;
      border: 1px solid #ddd;
      border-radius: 8px;
      width: 100%;
    }

    .payment-option.mat-radio-checked {
      border-color: #3f51b5;
      background-color: #f5f5ff;
    }

    .payment-info {
      margin-left: 8px;
    }

    .payment-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      margin-bottom: 4px;
    }

    /* FIXED: Better styling for Stripe initialization states */
    .stripe-initialization {
      margin: 16px 0;
      padding: 12px;
      background: #f9f9f9;
      border-radius: 6px;
    }

    .loading-stripe {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #666;
    }

    .stripe-error {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f44336;
    }

    .stripe-payment-section {
      margin-top: 20px;
      padding: 20px;
      background: #fafafa;
      border-radius: 8px;
    }

    .stripe-element-container {
      margin: 16px 0;
    }

    .stripe-element {
      padding: 16px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: white;
      min-height: 50px;
    }

    .payment-security-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
      font-size: 0.9em;
      margin-top: 12px;
    }

    .branch-payment-section {
      margin-top: 20px;
      padding: 20px;
      background: #fafafa;
      border-radius: 8px;
    }

    .branch-list {
      margin: 12px 0;
      padding-left: 20px;
    }

    .branch-list li {
      margin-bottom: 12px;
    }

    .step-actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      margin-top: 20px;
    }

    .order-summary {
      position: sticky;
      top: 20px;
      height: fit-content;
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .item-info {
      display: flex;
      flex-direction: column;
    }

    .item-name {
      font-weight: 500;
    }

    .item-details {
      color: #666;
      font-size: 0.9em;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      margin: 8px 0;
    }

    .total-row {
      font-size: 1.2em;
      font-weight: 600;
      color: #3f51b5;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #eee;
    }

    .empty-cart, .loading-state, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 20px;
      text-align: center;
    }

    .empty-icon, .error-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
    }

    .empty-icon { color: #ccc; }
    .error-icon { color: #f44336; }

    .error-state button {
      margin: 8px;
    }

    @media (max-width: 768px) {
      .checkout-layout {
        grid-template-columns: 1fr;
        gap: 20px;
      }

      .form-row {
        flex-direction: column;
      }

      .quarter-width, .half-width {
        width: 100%;
      }

      .order-summary {
        position: static;
      }
    }
  `]
})
export class CheckoutComponent implements OnInit, OnDestroy {
  @ViewChild('stripePaymentElement', { static: false }) stripeElementRef!: ElementRef;

  cart: Cart | null = null;
  shippingForm!: FormGroup;
  paymentForm!: FormGroup;

  // FIXED: Stripe integration properties - conditional initialization
  private stripeElements: StripeElements | null = null;
  private paymentElement: StripePaymentElement | null = null;
  paymentIntent: any = null;
  isStripeReady = false;
  isInitializingStripe = false; // FIXED: Don't initialize by default
  stripeInitError: string | null = null;

  // Component state
  isProcessingPayment = false;
  isLoadingCart = false;
  finalTax = 0;
  finalTotal = 0;
  hasError = false;
  errorMessage = '';
  showEmptyCartMessage = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private orderService: OrderService,
    private stripeService: StripeService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    console.log('Checkout component: Initializing with FIXED payment flow');

    // FIXED: Don't initialize Stripe immediately
    this.subscribeToCartUpdates();
    timer(100).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.validateCartAndLoad();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.paymentElement) {
      this.paymentElement.destroy();
    }
  }

  // FIXED: Conditional Stripe initialization only when credit card is selected
  private async initializeStripeIfNeeded(): Promise<void> {
    // FIXED: Reset flags when reinitializing to handle payment method switching
    if (this.isInitializingStripe) {
      console.log('Stripe initialization already in progress, waiting...');
      return;
    }

    // FIXED: Always reinitialize if switching back to credit card to ensure clean state
    this.isStripeReady = false;
    this.isInitializingStripe = true;
    this.stripeInitError = null;

    try {
      console.log('Checkout: Initializing Stripe (conditional)...');
      await this.stripeService.initialize();

      this.isStripeReady = true;
      this.isInitializingStripe = false;
      console.log('Checkout: Stripe initialized successfully');

      // If already on credit card and have shipping data, create payment intent
      if (this.paymentForm.get('paymentMethod')?.value === 'credit_card' && this.shippingForm.valid) {
        await this.createPaymentIntentForCard();
      }
    } catch (error) {
      console.error('Checkout: Stripe initialization failed', error);
      this.isInitializingStripe = false;
      this.stripeInitError = 'Failed to initialize payment system. Please try again.';
    }
  }

  // FIXED: Method called when payment method changes
  async onPaymentMethodChange(paymentMethod: string): Promise<void> {
    console.log('🔄 Payment method changed to:', paymentMethod);
    console.log('🧹 Current state before change:', {
      isStripeReady: this.isStripeReady,
      isInitializing: this.isInitializingStripe,
      hasPaymentIntent: !!this.paymentIntent,
      hasElements: !!this.stripeElements,
      hasPaymentElement: !!this.paymentElement
    });

    // FIXED: Always clean up previous state when switching payment methods
    this.cleanupStripeElements();
    this.stripeInitError = null;

    if (paymentMethod === 'credit_card') {
      console.log('💳 Switching to credit card - initializing Stripe...');
      // Initialize Stripe when credit card is selected
      await this.initializeStripeIfNeeded();
    } else {
      console.log('🏪 Switching to branch payment - no Stripe needed');
    }

    // Recalculate totals based on selected payment method
    this.updateTotalsForPaymentMethod(paymentMethod);

    console.log('✅ Payment method change complete. New state:', {
      paymentMethod,
      isStripeReady: this.isStripeReady,
      isInitializing: this.isInitializingStripe,
      hasPaymentIntent: !!this.paymentIntent,
      hasError: !!this.stripeInitError
    });
  }

  // FIXED: Create Payment Intent only for credit card payments
  private async createPaymentIntentForCard(): Promise<void> {
    if (!this.shippingForm.valid || !this.isStripeReady) {
      return;
    }

    // FIXED: Always create a fresh payment intent to avoid stale state
    this.paymentIntent = null;
    this.cleanupStripeElements();

    const shippingData = this.shippingForm.value;

    try {
      console.log('Creating fresh Payment Intent for credit card payment...');

      const paymentIntentData = await this.stripeService.createPaymentIntent(
        shippingData.state,
        shippingData.postalCode
      ).toPromise();

      if (paymentIntentData) {
        this.paymentIntent = paymentIntentData;
        this.finalTotal = paymentIntentData.amount;

        // Set up Stripe Payment Element with fresh data
        this.setupStripePaymentElement();

        console.log('Fresh Payment Intent created:', paymentIntentData.paymentIntentId);
      }
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      this.snackBar.open('Failed to initialize payment. Please try again.', 'Close', { duration: 5000 });
    }
  }

  private initializeForms(): void {
    this.shippingForm = this.fb.group({
      fullName: ['', [Validators.required]],
      streetLine1: ['', [Validators.required]],
      streetLine2: [''],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      postalCode: ['', [Validators.required, Validators.pattern(/^[0-9]{5}(-[0-9]{4})?$/)]],
      phone: ['', [Validators.required, Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/)]]
    });

    this.paymentForm = this.fb.group({
      paymentMethod: ['credit_card', [Validators.required]]
    });
  }

  private validateCartAndLoad(): void {
    this.isLoadingCart = true;
    this.hasError = false;

    const currentCart = this.cartService.getCartSync();

    if (currentCart && currentCart.items.length > 0) {
      this.cart = currentCart;
      this.finalTax = currentCart.summary.tax;
      this.finalTotal = currentCart.summary.total;
      this.isLoadingCart = false;
      return;
    }

    this.cartService.loadCart()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingCart = false;

          if (response.success && response.data && response.data.items.length > 0) {
            this.cart = response.data;
            this.finalTax = response.data.summary.tax;
            this.finalTotal = response.data.summary.total;
          } else {
            this.handleEmptyCart();
          }
        },
        error: (error) => {
          this.isLoadingCart = false;
          this.handleCartLoadError(error);
        }
      });
  }

  private subscribeToCartUpdates(): void {
    this.cartService.cart$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cart) => {
          if (cart && cart.items.length > 0) {
            this.cart = cart;
            this.finalTax = cart.summary.tax;
            this.finalTotal = cart.summary.total;
            this.showEmptyCartMessage = false;
          }
        },
        error: (error) => {
          console.error('Checkout: Error in cart subscription', error);
        }
      });
  }

  private setupStripePaymentElement(): void {
    if (!this.paymentIntent || !this.isStripeReady) {
      console.error('Checkout: Cannot set up payment element - missing payment intent or Stripe not ready');
      return;
    }

    setTimeout(() => {
      if (!this.stripeElementRef?.nativeElement) {
        console.error('Checkout: Stripe element container not found');
        return;
      }

      try {
        this.stripeElements = this.stripeService.createElements(this.paymentIntent.clientSecret);

        if (!this.stripeElements) {
          throw new Error('Failed to create Stripe elements');
        }

        this.paymentElement = this.stripeService.createPaymentElement(this.stripeElements);

        if (!this.paymentElement) {
          throw new Error('Failed to create payment element');
        }

        this.paymentElement.mount(this.stripeElementRef.nativeElement);

        console.log('Stripe Payment Element mounted successfully');
      } catch (error) {
        console.error('Checkout: Error setting up Stripe payment element', error);
        this.snackBar.open('Failed to load payment form. Please refresh the page.', 'Close', { duration: 5000 });
      }
    }, 100);
  }

  // FIXED: Single order creation method that handles both payment types
  async finalizeOrder(): Promise<void> {
    if (!this.canPlaceOrder()) {
      this.snackBar.open('Please complete all required fields', 'Close', { duration: 3000 });
      return;
    }

    this.isProcessingPayment = true;
    const paymentMethod = this.paymentForm.get('paymentMethod')?.value;
    const shippingAddress = { ...this.shippingForm.value, country: 'USA' };

    try {
      console.log('🚀 Starting order creation with payment method:', paymentMethod);

      if (paymentMethod === 'credit_card') {
        await this.processCreditCardOrder(shippingAddress);
      } else {
        await this.processBranchPaymentOrder(shippingAddress);
      }
    } catch (error) {
      this.isProcessingPayment = false;
      console.error('Checkout: Order creation failed', error);
      this.snackBar.open('Failed to complete order. Please try again.', 'Close', { duration: 5000 });
    }
  }

  // FIXED: Credit card processing - create order with Payment Intent, then confirm payment
  private async processCreditCardOrder(shippingAddress: any): Promise<void> {
    if (!this.stripeElements || !this.paymentIntent) {
      // Create Payment Intent if not already created
      await this.createPaymentIntentForCard();

      if (!this.paymentIntent) {
        throw new Error('Failed to create Payment Intent');
      }
    }

    try {
      console.log('💳 Step 1: Creating order with Payment Intent ID...');

      // Create order with Payment Intent ID using the cleaned up service method
      const orderResponse = await this.orderService.createCreditCardOrder(
        shippingAddress,
        this.paymentIntent.paymentIntentId,
        shippingAddress.fullName
      ).toPromise();

      if (!orderResponse?.success || !orderResponse.data) {
        throw new Error('Failed to create order: ' + (orderResponse?.message || 'Unknown error'));
      }

      const createdOrder = orderResponse.data;
      console.log('✅ Step 1: Order created:', createdOrder.orderNumber);

      console.log('💳 Step 2: Confirming payment...');

      // Confirm payment with Stripe
      if (!this.stripeElements) {
        throw new Error('Stripe elements not initialized');
      }

      const { error, paymentIntent } = await this.stripeService.confirmPayment(this.stripeElements);

      if (error) {
        console.error('❌ Payment confirmation error:', error);
        const errorMessage = this.stripeService.getErrorMessage(error);
        this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
        this.isProcessingPayment = false;
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('✅ Payment confirmed successfully!');
        this.handleSuccessfulOrder(createdOrder);
      } else {
        console.log('⚠️ Payment requires further action:', paymentIntent?.status);
        this.isProcessingPayment = false;
        const result = this.stripeService.getPaymentResultMessage(paymentIntent);
        this.snackBar.open(result.message, 'Close', { duration: 5000 });
      }
    } catch (error) {
      console.error('❌ Credit card order processing error:', error);
      this.isProcessingPayment = false;
      throw error;
    }
  }

  // FIXED: Branch payment processing - simple order creation
  private async processBranchPaymentOrder(shippingAddress: any): Promise<void> {
    try {
      console.log('🏪 Creating branch payment order...');

      const response = await this.orderService.createBranchPaymentOrder(
        shippingAddress,
        'Boston Downtown'
      ).toPromise();

      if (response?.success && response.data) {
        console.log('✅ Branch payment order created:', response.data.orderNumber);
        this.handleSuccessfulOrder(response.data);
      } else {
        throw new Error('Failed to create branch payment order: ' + (response?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Branch payment order creation error:', error);
      this.isProcessingPayment = false;
      throw error;
    }
  }

  private handleSuccessfulOrder(orderData: any): void {
    this.isProcessingPayment = false;

    console.log('🎯 Order successful! Order data:', orderData);
    console.log('🧭 Preparing navigation to order:', orderData.orderId);

    const successMessage = orderData.paymentStatus === 'verified' || orderData.paymentStatus === 'processing' ?
      'Payment successful! Your order has been placed.' :
      'Order placed successfully! Please pay at your selected branch.';

    this.snackBar.open(successMessage, 'Close', { duration: 5000 });

    // FIXED: Ensure we always have a valid order ID for navigation
    const orderIdForNavigation = orderData.orderId || orderData.id;
    if (!orderIdForNavigation) {
      console.error('❌ No order ID found in order data:', orderData);
      this.snackBar.open('Order created but navigation failed. Check your order history.', 'Close', { duration: 5000 });
      this.router.navigate(['/orders']);
      return;
    }

    console.log('🎯 Navigating to order details:', orderIdForNavigation);

    // Navigate to order details page
    this.router.navigate(['/orders', orderIdForNavigation]).then(success => {
      if (success) {
        console.log('✅ Navigation successful to order:', orderIdForNavigation);
      } else {
        console.error('❌ Navigation failed to order:', orderIdForNavigation);
        // Fallback to orders list
        this.router.navigate(['/orders']);
      }
    }).catch(error => {
      console.error('❌ Navigation error:', error);
      this.router.navigate(['/orders']);
    });
  }

  private updateTotalsForPaymentMethod(paymentMethod: string): void {
    if (this.cart) {
      // Both payment methods use same pricing for now
      this.finalTax = this.cart.summary.tax;
      this.finalTotal = this.cart.summary.total;
    }
  }

  private cleanupStripeElements(): void {
    // FIXED: More thorough cleanup to prevent state pollution
    if (this.paymentElement) {
      try {
        this.paymentElement.destroy();
        console.log('Payment element destroyed');
      } catch (error) {
        console.warn('Error destroying payment element:', error);
      }
      this.paymentElement = null;
    }

    this.stripeElements = null;
    this.paymentIntent = null;

    // FIXED: Reset Stripe element container content
    if (this.stripeElementRef?.nativeElement) {
      this.stripeElementRef.nativeElement.innerHTML = '';
    }

    console.log('Stripe elements cleaned up completely');
  }

  private handleEmptyCart(): void {
    this.showEmptyCartMessage = true;
    this.snackBar.open('Your cart appears to be empty', 'Close', { duration: 4000 });
  }

  private handleCartLoadError(error: any): void {
    if (error.status === 401 || error.status === 403) {
      this.errorMessage = 'Please log in to continue with checkout';
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: '/cart/checkout' }
      });
      return;
    }

    this.hasError = true;
    this.errorMessage = 'Failed to load your cart. Please try again.';
  }

  retryLoad(): void {
    this.hasError = false;
    this.showEmptyCartMessage = false;
    this.validateCartAndLoad();
  }

  retryStripeInit(): void {
    console.log('Retrying Stripe initialization...');
    this.stripeInitError = null;
    this.isStripeReady = false;
    this.isInitializingStripe = false; // FIXED: Reset flag before retry
    this.cleanupStripeElements(); // FIXED: Clean up any stale state
    this.initializeStripeIfNeeded();
  }

  canPlaceOrder(): boolean {
    const paymentMethod = this.paymentForm.get('paymentMethod')?.value;

    const basicValidation = this.shippingForm.valid &&
                           !this.isProcessingPayment &&
                           this.cart &&
                           this.cart.items &&
                           this.cart.items.length > 0;

    if (!basicValidation) {
      console.log('Basic validation failed:', {
        shippingValid: this.shippingForm.valid,
        processing: this.isProcessingPayment,
        hasCart: !!this.cart,
        hasItems: (this.cart?.items?.length ?? 0) > 0
      });
      return false;
    }

    if (paymentMethod === 'credit_card') {
      const creditCardReady = this.isStripeReady &&
                             !this.isInitializingStripe &&
                             !this.stripeInitError &&
                             this.paymentIntent != null; // FIXED: Ensure payment intent exists

      console.log('Credit card validation:', {
        stripeReady: this.isStripeReady,
        initializing: this.isInitializingStripe,
        hasError: !!this.stripeInitError,
        hasPaymentIntent: !!this.paymentIntent
      });

      return creditCardReady;
    } else {
      // Branch payment doesn't require Stripe
      console.log('Branch payment validation: ready');
      return true;
    }
  }

  getTotalPrintsForItem(item: any): number {
    return item.printSelections.reduce((total: number, selection: any) => total + selection.quantity, 0);
  }
}
