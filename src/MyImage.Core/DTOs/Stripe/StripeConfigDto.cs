using System.ComponentModel.DataAnnotations;

namespace MyImage.Core.DTOs.Stripe;

/// <summary>
/// DTO for Stripe configuration sent to frontend.
/// Contains safe configuration data for Stripe.js initialization.
/// </summary>
public class StripeConfigDto
{
    /// <summary>
    /// Stripe publishable key for frontend
    /// </summary>
    [Required]
    public string PublishableKey { get; set; } = string.Empty;

    /// <summary>
    /// Default currency
    /// </summary>
    public string Currency { get; set; } = "usd";

    /// <summary>
    /// Country code
    /// </summary>
    public string Country { get; set; } = "US";

    /// <summary>
    /// Return URL for payment completion
    /// </summary>
    public string ReturnUrl { get; set; } = string.Empty;

    /// <summary>
    /// Cancel URL for payment cancellation
    /// </summary>
    public string CancelUrl { get; set; } = string.Empty;

    /// <summary>
    /// Payment Element configuration options
    /// </summary>
    public PaymentElementOptionsDto PaymentElementOptions { get; set; } = new();

    /// <summary>
    /// Stripe appearance customization
    /// </summary>
    public StripeAppearanceDto Appearance { get; set; } = new();
}

/// <summary>
/// Payment Element configuration options
/// </summary>
public class PaymentElementOptionsDto
{
    /// <summary>
    /// Payment Element layout style
    /// </summary>
    public string Layout { get; set; } = "tabs";

    /// <summary>
    /// Preferred order of payment methods
    /// </summary>
    public string[] PaymentMethodOrder { get; set; } = Array.Empty<string>();
}

/// <summary>
/// Stripe appearance customization options
/// </summary>
public class StripeAppearanceDto
{
    /// <summary>
    /// Stripe theme to use
    /// </summary>
    public string Theme { get; set; } = "stripe";

    /// <summary>
    /// Custom CSS variables for styling
    /// </summary>
    public Dictionary<string, string> Variables { get; set; } = new();
}