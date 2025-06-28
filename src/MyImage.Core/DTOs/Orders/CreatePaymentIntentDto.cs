using System.ComponentModel.DataAnnotations;

namespace MyImage.Core.DTOs.Orders;

/// <summary>
/// DTO for Payment Intent creation request.
/// Used to create Payment Intent before order placement.
/// </summary>
public class CreatePaymentIntentDto
{
    /// <summary>
    /// State code for tax calculation
    /// </summary>
    [Required(ErrorMessage = "State is required")]
    [MaxLength(10, ErrorMessage = "State cannot exceed 10 characters")]
    public string State { get; set; } = string.Empty;

    /// <summary>
    /// Postal code for tax calculation
    /// </summary>
    [Required(ErrorMessage = "Postal code is required")]
    [MaxLength(20, ErrorMessage = "Postal code cannot exceed 20 characters")]
    public string PostalCode { get; set; } = string.Empty;
}
