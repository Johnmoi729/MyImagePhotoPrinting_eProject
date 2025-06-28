
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { loadStripe, Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api.models';

// Stripe configuration interface based on backend API
interface StripeConfig {
  publishableKey: string;
  currency: string;
  country: string;
  returnUrl: string;
  cancelUrl: string;
  paymentElementOptions: {
    layout: 'tabs' | 'accordion' | 'auto';
    paymentMethodOrder: Array<'card' | 'apple_pay' | 'google_pay'>;
  };
  appearance: {
    theme: 'stripe' | 'night' | 'flat';
    variables: {
      colorPrimary: string;
      colorBackground: string;
      colorText: string;
      colorDanger: string;
      fontFamily: string;
      spacingUnit: string;
      borderRadius: string;
    };
  };
}

// Payment Intent response from backend
interface PaymentIntentResponse {
  paymentIntentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private stripe: Stripe | null = null;
  private config: StripeConfig | null = null;
  private initializationPromise: Promise<void> | null = null;

  // Track initialization state
  private isInitialized = new BehaviorSubject<boolean>(false);
  public isInitialized$ = this.isInitialized.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Initialize Stripe.js with backend configuration
   */
  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.initializeInternal();
    return this.initializationPromise;
  }

  private async initializeInternal(): Promise<void> {
    try {
      // Get Stripe configuration from backend
      const configResponse = await this.getStripeConfig().toPromise();

      if (!configResponse?.success || !configResponse.data) {
        throw new Error('Failed to get Stripe configuration');
      }

      this.config = configResponse.data;

      // Initialize Stripe.js with publishable key
      this.stripe = await loadStripe(this.config.publishableKey);

      if (!this.stripe) {
        throw new Error('Failed to initialize Stripe.js');
      }

      this.isInitialized.next(true);
      console.log('Stripe service: Initialized successfully');
    } catch (error) {
      console.error('Stripe service: Initialization failed', error);
      throw error;
    }
  }

  /**
   * Get Stripe configuration from backend
   */
  getStripeConfig(): Observable<ApiResponse<StripeConfig>> {
    return this.http.get<ApiResponse<StripeConfig>>(`${environment.apiUrl}/stripe/config`);
  }

  /**
   * Create Payment Intent for checkout
   */
  createPaymentIntent(state: string, postalCode: string): Observable<PaymentIntentResponse> {
    return this.http.post<ApiResponse<PaymentIntentResponse>>(
      `${environment.apiUrl}/orders/payment-intent`,
      { state, postalCode }
    ).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to create payment intent');
        }
        return response.data;
      })
    );
  }

  /**
   * Create Stripe Elements with Payment Element
   */
  createElements(clientSecret: string): StripeElements | null {
    if (!this.stripe || !this.config) {
      console.error('Stripe service: Not initialized');
      return null;
    }

    const elements = this.stripe.elements({
      clientSecret,
      appearance: this.config.appearance
    });

    return elements;
  }

  /**
   * Create Payment Element
   */
  createPaymentElement(elements: StripeElements): StripePaymentElement | null {
    if (!elements || !this.config) {
      return null;
    }

    return elements.create('payment', {
      layout: this.config.paymentElementOptions.layout,
      paymentMethodOrder: this.config.paymentElementOptions.paymentMethodOrder
    });
  }

  /**
   * Confirm payment with Stripe
   */
  async confirmPayment(
    elements: StripeElements,
    returnUrl?: string
  ): Promise<{ error?: any; paymentIntent?: any }> {
    if (!this.stripe || !this.config) {
      throw new Error('Stripe not initialized');
    }

    const confirmUrl = returnUrl || this.config.returnUrl;

    return await this.stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: confirmUrl
      }
    });
  }

  /**
   * Handle payment result status
   */
  getPaymentResultMessage(paymentIntent: any): { success: boolean; message: string } {
    switch (paymentIntent.status) {
      case 'succeeded':
        return { success: true, message: 'Payment completed successfully!' };
      case 'processing':
        return { success: true, message: 'Payment is being processed...' };
      case 'requires_payment_method':
        return { success: false, message: 'Payment failed. Please try again.' };
      default:
        return { success: false, message: 'Something went wrong with the payment.' };
    }
  }

  /**
   * Get error message from Stripe error
   */
  getErrorMessage(stripeError: any): string {
    switch (stripeError?.code) {
      case 'card_declined':
        return 'Your card was declined. Please try a different payment method.';
      case 'insufficient_funds':
        return 'Insufficient funds. Please try a different payment method.';
      case 'expired_card':
        return 'Your card has expired. Please try a different payment method.';
      case 'incorrect_cvc':
        return 'Your card\'s security code is incorrect. Please try again.';
      case 'processing_error':
        return 'An error occurred while processing your card. Please try again.';
      case 'rate_limit':
        return 'Too many requests. Please try again in a moment.';
      default:
        return stripeError?.message || 'Payment processing failed. Please try again.';
    }
  }

  /**
   * Test Stripe connection (development only)
   */
  testConnection(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${environment.apiUrl}/stripe/test-connection`);
  }

  /**
   * Check if Stripe is ready for use
   */
  isReady(): boolean {
    return !!(this.stripe && this.config && this.isInitialized.value);
  }

  /**
   * Get Stripe instance (for advanced usage)
   */
  getStripe(): Stripe | null {
    return this.stripe;
  }

  /**
   * Get Stripe configuration (for UI customization)
   */
  getConfig(): StripeConfig | null {
    return this.config;
  }
}
