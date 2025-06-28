using System.ComponentModel.DataAnnotations;

namespace MyImage.Core.DTOs.Orders;

/// <summary>
/// DTO for Stripe Payment Intent response.
/// Contains Payment Intent details for frontend confirmation.
/// </summary>
public class StripePaymentIntentDto
{
    /// <summary>
    /// Stripe Payment Intent ID for tracking
    /// </summary>
    [Required]
    public string PaymentIntentId { get; set; } = string.Empty;

    /// <summary>
    /// Client secret for frontend payment confirmation
    /// </summary>
    [Required]
    public string ClientSecret { get; set; } = string.Empty;

    /// <summary>
    /// Payment amount in dollars
    /// </summary>
    public decimal Amount { get; set; }

    /// <summary>
    /// Currency code (USD)
    /// </summary>
    public string Currency { get; set; } = "usd";

    /// <summary>
    /// Payment Intent status from Stripe
    /// </summary>
    public string Status { get; set; } = string.Empty;
}
