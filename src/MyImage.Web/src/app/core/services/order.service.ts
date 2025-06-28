
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResult } from '../../shared/models/api.models';
import { Order, ShippingAddress } from '../../shared/models/order.models';

// Enhanced interfaces for Stripe integration
interface PaymentIntentRequest {
  state: string;
  postalCode: string;
}

interface PaymentIntentResponse {
  paymentIntentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

interface EnhancedOrderResponse {
  orderId: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  paymentStatus: string;
  createdAt: string;
  paymentIntentId?: string;
  clientSecret?: string;
  requiresAction?: boolean;
}

// FIXED: Clear interface definitions for different order types
interface CreditCardOrderRequest {
  shippingAddress: ShippingAddress;
  paymentMethod: 'credit_card';
  creditCard: {
    encryptedCardNumber: string; // Payment Intent ID for new flow
    cardholderName: string;
    expiryMonth: string;
    expiryYear: string;
    encryptedCvv: string;
  };
}

interface BranchPaymentOrderRequest {
  shippingAddress: ShippingAddress;
  paymentMethod: 'branch_payment';
  branchPayment: {
    preferredBranch: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  constructor(private http: HttpClient) {}

  /**
   * Create Payment Intent before order placement (Stripe flow)
   * This should be called when user selects credit card payment
   */
  createPaymentIntent(request: PaymentIntentRequest): Observable<ApiResponse<PaymentIntentResponse>> {
    return this.http.post<ApiResponse<PaymentIntentResponse>>(
      `${environment.apiUrl}/orders/payment-intent`,
      request
    );
  }

  /**
   * FIXED: Create credit card order with Payment Intent ID
   * This method is used when payment is being processed via Stripe
   */
  createCreditCardOrder(
    shippingAddress: ShippingAddress,
    paymentIntentId: string,
    cardholderName?: string
  ): Observable<ApiResponse<EnhancedOrderResponse>> {

    const orderRequest: CreditCardOrderRequest = {
      shippingAddress,
      paymentMethod: 'credit_card',
      creditCard: {
        encryptedCardNumber: paymentIntentId, // Use Payment Intent ID as the encrypted card number
        cardholderName: cardholderName || shippingAddress.fullName,
        expiryMonth: '12', // Placeholder - actual card details handled by Stripe
        expiryYear: '2025', // Placeholder - actual card details handled by Stripe
        encryptedCvv: 'stripe_handled' // Indicates this is handled by Stripe
      }
    };

    console.log('OrderService: Creating credit card order with Payment Intent:', paymentIntentId);

    return this.http.post<ApiResponse<EnhancedOrderResponse>>(
      `${environment.apiUrl}/orders`,
      orderRequest
    );
  }

  /**
   * FIXED: Create branch payment order
   * This method creates an order for in-person payment
   */
  createBranchPaymentOrder(
    shippingAddress: ShippingAddress,
    preferredBranch: string = 'Boston Downtown'
  ): Observable<ApiResponse<EnhancedOrderResponse>> {

    const orderRequest: BranchPaymentOrderRequest = {
      shippingAddress,
      paymentMethod: 'branch_payment',
      branchPayment: {
        preferredBranch
      }
    };

    console.log('OrderService: Creating branch payment order for branch:', preferredBranch);

    return this.http.post<ApiResponse<EnhancedOrderResponse>>(
      `${environment.apiUrl}/orders`,
      orderRequest
    );
  }

  /**
   * DEPRECATED: Keeping for backward compatibility but marked for removal
   * Use createCreditCardOrder() instead
   */
  createOrderWithConfirmedPayment(
    shippingAddress: ShippingAddress,
    paymentIntentId: string
  ): Observable<ApiResponse<EnhancedOrderResponse>> {
    console.warn('OrderService: createOrderWithConfirmedPayment is deprecated, use createCreditCardOrder instead');
    return this.createCreditCardOrder(shippingAddress, paymentIntentId);
  }

  /**
   * DEPRECATED: Keeping for backward compatibility but marked for removal
   * Use createCreditCardOrder() instead
   */
  createOrderWithPaymentIntent(
    shippingAddress: ShippingAddress,
    paymentIntentId: string
  ): Observable<ApiResponse<EnhancedOrderResponse>> {
    console.warn('OrderService: createOrderWithPaymentIntent is deprecated, use createCreditCardOrder instead');
    return this.createCreditCardOrder(shippingAddress, paymentIntentId);
  }

  /**
   * LEGACY: Generic order creation method - avoid using directly
   * Use createCreditCardOrder() or createBranchPaymentOrder() instead for better type safety
   */
  createOrder(
    shippingAddress: ShippingAddress,
    paymentMethod: string,
    creditCard?: any,
    branchPayment?: any
  ): Observable<ApiResponse<EnhancedOrderResponse>> {

    console.warn('OrderService: Generic createOrder method used - consider using specific order creation methods');

    const orderData: any = {
      shippingAddress,
      paymentMethod
    };

    // Add payment-specific data based on method
    if (paymentMethod === 'credit_card' && creditCard) {
      orderData.creditCard = creditCard;
    } else if (paymentMethod === 'branch_payment' && branchPayment) {
      orderData.branchPayment = branchPayment;
    }

    return this.http.post<ApiResponse<EnhancedOrderResponse>>(
      `${environment.apiUrl}/orders`,
      orderData
    );
  }

  /**
   * Get user's orders with pagination
   */
  getOrders(page: number = 1, pageSize: number = 20): Observable<ApiResponse<PagedResult<Order>>> {
    return this.http.get<ApiResponse<PagedResult<Order>>>(
      `${environment.apiUrl}/orders?page=${page}&pageSize=${pageSize}`
    );
  }

  /**
   * Get detailed order information including payment details
   */
  getOrderDetails(orderId: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${environment.apiUrl}/orders/${orderId}`);
  }

  /**
   * Get order by order number (alternative lookup)
   */
  getOrderByNumber(orderNumber: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${environment.apiUrl}/orders/number/${orderNumber}`);
  }

  /**
   * Retry payment for failed order (if supported by backend)
   */
  retryOrderPayment(orderId: string): Observable<ApiResponse<PaymentIntentResponse>> {
    return this.http.post<ApiResponse<PaymentIntentResponse>>(
      `${environment.apiUrl}/orders/${orderId}/retry-payment`,
      {}
    );
  }

  /**
   * Cancel order (if in pending status)
   */
  cancelOrder(orderId: string, reason?: string): Observable<ApiResponse<void>> {
    const requestData = reason ? { reason } : {};
    return this.http.post<ApiResponse<void>>(
      `${environment.apiUrl}/orders/${orderId}/cancel`,
      requestData
    );
  }

  /**
   * Get order status updates (for real-time status tracking)
   */
  getOrderStatusUpdates(orderId: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${environment.apiUrl}/orders/${orderId}/status`);
  }

  /**
   * Download order invoice (if available)
   */
  downloadOrderInvoice(orderId: string): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/orders/${orderId}/invoice`, {
      responseType: 'blob'
    });
  }

  /**
   * Get available branch locations for branch payment
   */
  getBranchLocations(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${environment.apiUrl}/orders/branch-locations`);
  }

  /**
   * Validate shipping address and get tax calculation
   */
  validateShippingAddress(address: ShippingAddress): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${environment.apiUrl}/orders/validate-address`,
      address
    );
  }

  /**
   * Get estimated delivery date for shipping address
   */
  getEstimatedDelivery(address: ShippingAddress): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${environment.apiUrl}/orders/estimated-delivery`,
      address
    );
  }

  /**
   * Track order shipment (if tracking number available)
   */
  trackShipment(trackingNumber: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${environment.apiUrl}/orders/track/${trackingNumber}`
    );
  }
}
