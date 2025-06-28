using MyImage.Core.Entities;
using MyImage.Core.DTOs.Common;
using MongoDB.Bson;

namespace MyImage.Core.Interfaces.Services;

/// <summary>
/// Service interface for Stripe payment processing operations.
/// Handles payment intents, and charges for secure payment handling.
/// 
/// Key features:
/// - Payment Intent creation for secure payment flow
/// - Direct charge processing for immediate payment
/// - Payment status synchronization with orders
/// </summary>
public interface IStripePaymentService
{
    /// <summary>
    /// Create Stripe Payment Intent for secure payment processing.
    /// Payment Intents provide a secure way to handle payments with built-in 3D Secure support.
    /// The client confirms the payment intent on the frontend using Stripe.js.
    /// </summary>
    /// <param name="order">Order containing payment details and amount</param>
    /// <param name="stripeToken">Optional Stripe token from frontend (for direct processing)</param>
    /// <returns>Payment Intent details for frontend confirmation</returns>
    Task<StripePaymentResult> CreatePaymentIntentAsync(Order order, string? stripeToken = null);

    /// <summary>
    /// Process direct payment using encrypted credit card data.
    /// This method supports the legacy encrypted card flow while maintaining Stripe integration.
    /// Decrypts card data and creates immediate charge via Stripe API.
    /// </summary>
    /// <param name="order">Order containing payment details</param>
    /// <param name="encryptedCardData">Encrypted credit card information</param>
    /// <returns>Payment processing result</returns>
    Task<StripePaymentResult> ProcessDirectPaymentAsync(Order order, EncryptedCardData encryptedCardData);

    /// <summary>
    /// Confirm payment intent after frontend confirmation.
    /// Called when payment intent is confirmed on frontend and webhook received.
    /// Updates order status and payment information.
    /// </summary>
    /// <param name="paymentIntentId">Stripe Payment Intent ID</param>
    /// <param name="orderId">Associated order ObjectId</param>
    /// <returns>Payment confirmation result</returns>
    Task<StripePaymentResult> ConfirmPaymentAsync(string paymentIntentId, ObjectId orderId);

    /// <summary>
    /// Retrieve payment details from Stripe for admin verification.
    /// Allows admins to see complete payment information and status directly from Stripe.
    /// Useful for customer service and payment dispute resolution.
    /// </summary>
    /// <param name="paymentIntentId">Stripe Payment Intent ID</param>
    /// <returns>Complete payment information from Stripe</returns>
    Task<StripePaymentDetails?> GetPaymentDetailsAsync(string paymentIntentId);

    /// <summary>
    /// Refund payment for order cancellation or customer service.
    /// Creates refund in Stripe and updates order payment status.
    /// Supports partial refunds for customer service scenarios.
    /// </summary>
    /// <param name="paymentIntentId">Stripe Payment Intent ID to refund</param>
    /// <param name="refundAmount">Amount to refund (null for full refund)</param>
    /// <param name="reason">Reason for refund (for Stripe records)</param>
    /// <returns>Refund processing result</returns>
    Task<StripeRefundResult> RefundPaymentAsync(string paymentIntentId, decimal? refundAmount = null, string? reason = null);

    /// <summary>
    /// Get customer payment methods for returning customers.
    /// Allows customers to use saved payment methods for faster checkout.
    /// Integrates with Stripe Customer objects for payment method storage.
    /// </summary>
    /// <param name="customerEmail">Customer email to find saved payment methods</param>
    /// <returns>List of available payment methods</returns>
    Task<List<StripePaymentMethod>> GetCustomerPaymentMethodsAsync(string customerEmail);
}

/// <summary>
/// Result object for Stripe payment operations.
/// Contains payment status and relevant IDs for order tracking.
/// </summary>
public class StripePaymentResult
{
    /// <summary>
    /// Whether the payment operation was successful
    /// </summary>
    public bool IsSuccessful { get; set; }

    /// <summary>
    /// Stripe Payment Intent ID for tracking and confirmation
    /// </summary>
    public string? PaymentIntentId { get; set; }

    /// <summary>
    /// Client secret for frontend payment confirmation (if using Payment Intents)
    /// </summary>
    public string? ClientSecret { get; set; }

    /// <summary>
    /// Current payment status from Stripe
    /// Values: requires_payment_method, requires_confirmation, requires_action, processing, succeeded, canceled
    /// </summary>
    public string PaymentStatus { get; set; } = string.Empty;

    /// <summary>
    /// Amount processed in cents (Stripe format)
    /// </summary>
    public long AmountCents { get; set; }

    /// <summary>
    /// Currency code (USD)
    /// </summary>
    public string Currency { get; set; } = "usd";

    /// <summary>
    /// Error message if payment failed
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Additional error details for debugging
    /// </summary>
    public string? ErrorCode { get; set; }

    /// <summary>
    /// Whether the payment requires additional action (3D Secure, etc.)
    /// </summary>
    public bool RequiresAction { get; set; }

    /// <summary>
    /// Stripe Charge ID if payment was charged immediately
    /// </summary>
    public string? ChargeId { get; set; }

    /// <summary>
    /// Processing fees charged by Stripe (for accounting)
    /// </summary>
    public decimal ProcessingFee { get; set; }
}

/// <summary>
/// Encrypted credit card data for legacy payment processing.
/// Maintains compatibility with existing encryption approach.
/// </summary>
public class EncryptedCardData
{
    /// <summary>
    /// Encrypted card number using RSA public key
    /// </summary>
    public string EncryptedCardNumber { get; set; } = string.Empty;

    /// <summary>
    /// Cardholder name (not encrypted)
    /// </summary>
    public string CardholderName { get; set; } = string.Empty;

    /// <summary>
    /// Card expiry month (MM format)
    /// </summary>
    public string ExpiryMonth { get; set; } = string.Empty;

    /// <summary>
    /// Card expiry year (YYYY format)
    /// </summary>
    public string ExpiryYear { get; set; } = string.Empty;

    /// <summary>
    /// Encrypted CVV code using RSA public key
    /// </summary>
    public string EncryptedCvv { get; set; } = string.Empty;
}

/// <summary>
/// Detailed payment information from Stripe for admin use.
/// </summary>
public class StripePaymentDetails
{
    /// <summary>
    /// Stripe Payment Intent ID
    /// </summary>
    public string PaymentIntentId { get; set; } = string.Empty;

    /// <summary>
    /// Payment status from Stripe
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Amount in cents
    /// </summary>
    public long AmountCents { get; set; }

    /// <summary>
    /// Currency code
    /// </summary>
    public string Currency { get; set; } = string.Empty;

    /// <summary>
    /// Payment method details (last 4 digits, brand, etc.)
    /// </summary>
    public PaymentMethodDetails? PaymentMethod { get; set; }

    /// <summary>
    /// Customer information from Stripe
    /// </summary>
    public string? CustomerEmail { get; set; }

    /// <summary>
    /// Transaction fees
    /// </summary>
    public decimal ProcessingFee { get; set; }

    /// <summary>
    /// When payment was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When payment was confirmed
    /// </summary>
    public DateTime? ConfirmedAt { get; set; }
}

/// <summary>
/// Payment method details from Stripe
/// </summary>
public class PaymentMethodDetails
{
    /// <summary>
    /// Card brand (visa, mastercard, amex, etc.)
    /// </summary>
    public string Brand { get; set; } = string.Empty;

    /// <summary>
    /// Last 4 digits of card
    /// </summary>
    public string Last4 { get; set; } = string.Empty;

    /// <summary>
    /// Card funding type (credit, debit, prepaid, unknown)
    /// </summary>
    public string Funding { get; set; } = string.Empty;

    /// <summary>
    /// Card country code
    /// </summary>
    public string? Country { get; set; }
}

/// <summary>
/// Stripe refund result for customer service operations.
/// </summary>
public class StripeRefundResult
{
    /// <summary>
    /// Whether refund was successful
    /// </summary>
    public bool IsSuccessful { get; set; }

    /// <summary>
    /// Stripe Refund ID for tracking
    /// </summary>
    public string? RefundId { get; set; }

    /// <summary>
    /// Amount refunded in cents
    /// </summary>
    public long RefundedAmountCents { get; set; }

    /// <summary>
    /// Refund status from Stripe
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Error message if refund failed
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Expected availability date for refunded amount
    /// </summary>
    public DateTime? RefundAvailableDate { get; set; }
}

/// <summary>
/// Saved payment method for returning customers.
/// </summary>
public class StripePaymentMethod
{
    /// <summary>
    /// Stripe Payment Method ID
    /// </summary>
    public string PaymentMethodId { get; set; } = string.Empty;

    /// <summary>
    /// Payment method type (card, bank_account, etc.)
    /// </summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// Card details if payment method is a card
    /// </summary>
    public PaymentMethodDetails? Card { get; set; }

    /// <summary>
    /// Whether this is the customer's default payment method
    /// </summary>
    public bool IsDefault { get; set; }

    /// <summary>
    /// When payment method was created
    /// </summary>
    public DateTime CreatedAt { get; set; }
}