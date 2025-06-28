using System.ComponentModel.DataAnnotations;

namespace MyImage.Core.DTOs.Orders;

/// <summary>
/// Enhanced order created DTO with Stripe payment information.
/// Extends basic order creation response with Stripe-specific data.
/// </summary>
public class EnhancedOrderCreatedDto : OrderCreatedDto
{
    /// <summary>
    /// Stripe Payment Intent ID for frontend integration
    /// </summary>
    public string? PaymentIntentId { get; set; }

    /// <summary>
    /// Client secret for frontend payment confirmation
    /// </summary>
    public string? ClientSecret { get; set; }

    /// <summary>
    /// Whether payment requires additional action (3D Secure)
    /// </summary>
    public bool RequiresAction { get; set; }
}