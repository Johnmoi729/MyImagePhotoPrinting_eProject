
/**
 * Stripe-specific interfaces and types for type safety
 */

export interface StripeConfig {
  publishableKey: string;
  currency: string;
  country: string;
  returnUrl: string;
  cancelUrl: string;
  paymentElementOptions: {
    layout: string;
    paymentMethodOrder: string[];
  };
  appearance: StripeAppearance;
}

export interface StripeAppearance {
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
}

export interface PaymentIntentRequest {
  state: string;
  postalCode: string;
}

export interface PaymentIntentResponse {
  paymentIntentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface StripeError {
  type: 'card_error' | 'validation_error' | 'api_error' | 'authentication_error' | 'rate_limit_error' | 'idempotency_error' | 'invalid_request_error';
  code?: string;
  message: string;
  decline_code?: string;
  param?: string;
}

export interface StripePaymentResult {
  paymentIntent?: {
    id: string;
    status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';
    amount: number;
    currency: string;
    client_secret: string;
    metadata?: { [key: string]: string };
  };
  error?: StripeError;
}

export interface StripeCustomer {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
  created: number;
  metadata?: { [key: string]: string };
}

export interface StripePaymentMethod {
  id: string;
  type: 'card' | 'apple_pay' | 'google_pay';
  card?: {
    brand: 'visa' | 'mastercard' | 'amex' | 'discover' | 'jcb' | 'unionpay' | 'diners' | 'unknown';
    last4: string;
    exp_month: number;
    exp_year: number;
    funding: 'credit' | 'debit' | 'prepaid' | 'unknown';
    country?: string;
  };
  billing_details?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      city?: string;
      country?: string;
      line1?: string;
      line2?: string;
      postal_code?: string;
      state?: string;
    };
  };
  created: number;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
  livemode: boolean;
  pending_webhooks: number;
  request?: {
    id: string;
    idempotency_key?: string;
  };
}

// Payment status tracking
export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'requires_action'
  | 'succeeded'
  | 'failed'
  | 'canceled';

export interface PaymentStatusUpdate {
  orderId: string;
  paymentIntentId: string;
  status: PaymentStatus;
  timestamp: string;
  metadata?: { [key: string]: any };
}

// Error handling
export interface PaymentError {
  code: string;
  message: string;
  type: 'user_error' | 'card_error' | 'validation_error' | 'api_error' | 'network_error';
  retryable: boolean;
  userMessage: string; // Friendly message for display
}

// Test card information
export interface TestCard {
  number: string;
  exp: string;
  cvc: string;
  description: string;
  expectedResult: 'success' | 'decline' | 'authentication_required' | 'processing_error';
}

// Stripe Elements configuration
export interface StripeElementsOptions {
  clientSecret?: string;
  appearance?: StripeAppearance;
  loader?: 'auto' | 'never';
  fonts?: Array<{
    family: string;
    src: string;
    weight?: string;
  }>;
}

export interface PaymentElementOptions {
  layout?: 'tabs' | 'accordion' | 'auto';
  business?: {
    name: string;
  };
  paymentMethodOrder?: Array<'card' | 'apple_pay' | 'google_pay'>;
  fields?: {
    billingDetails?: 'auto' | 'never' | {
      name?: 'auto' | 'never';
      email?: 'auto' | 'never';
      phone?: 'auto' | 'never';
      address?: 'auto' | 'never' | {
        country?: 'auto' | 'never';
        postalCode?: 'auto' | 'never';
      };
    };
  };
  terms?: {
    card?: 'auto' | 'never';
    applePay?: 'auto' | 'never';
    googlePay?: 'auto' | 'never';
  };
}

// Order creation with Stripe
export interface StripeOrderRequest {
  shippingAddress: {
    fullName: string;
    streetLine1: string;
    streetLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  paymentMethod: 'credit_card' | 'branch_payment';
  creditCard?: {
    encryptedCardNumber: string; // Payment Intent ID for Stripe
    cardholderName: string;
    expiryMonth: string;
    expiryYear: string;
    encryptedCvv: string;
  };
  branchPayment?: {
    preferredBranch: string;
  };
}

export interface StripeOrderResponse {
  orderId: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  createdAt: string;
  paymentIntentId?: string;
  clientSecret?: string;
  requiresAction?: boolean;
}

// Utility types
export type StripeInitializationStatus = 'uninitialized' | 'initializing' | 'ready' | 'error';

export interface StripeServiceState {
  status: StripeInitializationStatus;
  config?: StripeConfig;
  error?: string;
  lastInitialized?: Date;
}

// Analytics and monitoring
export interface StripeAnalyticsEvent {
  event: string;
  timestamp: Date;
  data: { [key: string]: any };
  userId?: string;
  sessionId?: string;
}

export interface PaymentMetrics {
  totalAttempts: number;
  successfulPayments: number;
  failedPayments: number;
  averageProcessingTime: number;
  mostCommonErrors: Array<{
    code: string;
    count: number;
    percentage: number;
  }>;
}
