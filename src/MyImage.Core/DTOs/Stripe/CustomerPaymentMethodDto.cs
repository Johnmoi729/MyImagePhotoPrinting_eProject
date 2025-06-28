using System.ComponentModel.DataAnnotations;

namespace MyImage.Core.DTOs.Stripe;

/// <summary>
/// Customer payment method information for frontend display.
/// Represents saved payment methods from Stripe.
/// </summary>
public class CustomerPaymentMethodDto
{
    /// <summary>
    /// Stripe Payment Method ID
    /// </summary>
    [Required]
    public string PaymentMethodId { get; set; } = string.Empty;

    /// <summary>
    /// Payment method type (card, bank_account, etc.)
    /// </summary>
    [Required]
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// Card brand (visa, mastercard, etc.)
    /// </summary>
    public string Brand { get; set; } = string.Empty;

    /// <summary>
    /// Last 4 digits of payment method
    /// </summary>
    public string Last4 { get; set; } = string.Empty;

    /// <summary>
    /// Expiry month (Note: May be 0 if not available from Stripe)
    /// </summary>
    public long ExpiryMonth { get; set; }

    /// <summary>
    /// Expiry year (Note: May be 0 if not available from Stripe)
    /// </summary>
    public long ExpiryYear { get; set; }

    /// <summary>
    /// Whether this is the customer's default payment method
    /// </summary>
    public bool IsDefault { get; set; }

    /// <summary>
    /// When the payment method was created
    /// </summary>
    public DateTime CreatedAt { get; set; }
}