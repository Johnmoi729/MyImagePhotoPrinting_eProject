using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MongoDB.Bson;
using System.Security.Claims;
using MyImage.Core.Interfaces.Repositories;
using MyImage.Core.Interfaces.Services;
using MyImage.Core.DTOs.Cart;
using MyImage.Core.DTOs.Orders;
using MyImage.Core.DTOs.Common;
using MyImage.Core.Entities;

namespace MyImage.API.Controllers;

/// <summary>
/// Orders controller handling order creation and management with improved payment flow.
/// Better separation and validation for credit card vs branch payment methods.
/// 
/// Key improvements:
/// - Enhanced validation for different payment methods
/// - Better error handling and logging
/// - Clearer separation of payment flows
/// - Proper cart validation before processing
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize] // All order operations require authentication
[Produces("application/json")]
public class OrdersController : ControllerBase
{
    private readonly IOrderRepository _orderRepository;
    private readonly IShoppingCartRepository _cartRepository;
    private readonly IPhotoRepository _photoRepository;
    private readonly ISystemSettingsRepository _settingsRepository;
    private readonly IStripePaymentService _stripePaymentService;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(
        IOrderRepository orderRepository,
        IShoppingCartRepository cartRepository,
        IPhotoRepository photoRepository,
        ISystemSettingsRepository settingsRepository,
        IStripePaymentService stripePaymentService,
        ILogger<OrdersController> logger)
    {
        _orderRepository = orderRepository;
        _cartRepository = cartRepository;
        _photoRepository = photoRepository;
        _settingsRepository = settingsRepository;
        _stripePaymentService = stripePaymentService;
        _logger = logger;
    }

    /// <summary>
    /// Create order with improved payment method validation and processing.
    /// Now properly handles both credit card and branch payment without conflicts.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<EnhancedOrderCreatedDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<EnhancedOrderCreatedDto>>> CreateOrder([FromBody] CreateOrderDto createOrderDto)
    {
        try
        {
            var userId = GetAuthenticatedUserId();
            if (userId == null)
            {
                return Unauthorized(ApiResponse<object>.ErrorResponse(
                    "Authentication required",
                    "Invalid user identification"));
            }

            // Enhanced validation with better error messages
            var validationResult = ValidateOrderRequest(createOrderDto);
            if (!validationResult.IsValid)
            {
                _logger.LogWarning("Order validation failed for user {UserId}: {Errors}", userId, string.Join(", ", validationResult.Errors));
                return BadRequest(ApiResponse<object>.ErrorResponse(
                    "Invalid order data", validationResult.Errors));
            }

            // Get user's cart and validate it has items
            var cart = await _cartRepository.GetByUserIdAsync(userId.Value);
            if (cart.Items.Count == 0)
            {
                _logger.LogWarning("Attempted to create order with empty cart for user {UserId}", userId);
                return BadRequest(ApiResponse<object>.ErrorResponse(
                    "Cannot create order",
                    "Shopping cart is empty"));
            }

            // Calculate final totals with tax
            var taxRate = await GetTaxRateForState(createOrderDto.ShippingAddress.State);
            var subtotal = cart.Summary.Subtotal;
            var taxAmount = subtotal * taxRate;
            var total = subtotal + taxAmount;

            // Get user information for order
            var userClaim = User.FindFirst("user_id")?.Value ?? "";
            var emailClaim = User.FindFirst(ClaimTypes.Email)?.Value ?? "";
            var nameClaim = User.FindFirst(ClaimTypes.Name)?.Value ?? "";

            // Create base order entity
            var order = new Order
            {
                UserId = userId.Value,
                UserInfo = new OrderUserInfo
                {
                    UserId = userClaim,
                    Email = emailClaim,
                    Name = nameClaim
                },
                Status = "pending",
                Items = ConvertCartToOrderItems(cart),
                Pricing = new OrderPricing
                {
                    Subtotal = subtotal,
                    TaxRate = taxRate,
                    TaxAmount = taxAmount,
                    Total = total,
                    Currency = "USD"
                },
                ShippingAddress = ConvertToShippingAddress(createOrderDto.ShippingAddress),
                Fulfillment = new OrderFulfillment(),
                PhotoCleanup = new PhotoCleanup()
            };

            // Process payment based on method with proper validation
            var paymentResult = await ProcessOrderPayment(order, createOrderDto);
            if (!paymentResult.Success)
            {
                _logger.LogError("Payment processing failed for user {UserId}: {Error}", userId, paymentResult.ErrorMessage);
                return BadRequest(ApiResponse<object>.ErrorResponse(
                    "Payment processing failed",
                    paymentResult.ErrorMessage ?? "Unable to process payment"));
            }

            // Create order in database
            var createdOrder = await _orderRepository.CreateAsync(order);

            _logger.LogInformation("Order {OrderNumber} created successfully for user {UserId} with payment method {PaymentMethod}",
                createdOrder.OrderNumber, userId, createOrderDto.PaymentMethod);

            // Mark photos as ordered to prevent deletion
            var photoIds = cart.Items.Select(item => item.PhotoId).ToList();
            await _photoRepository.MarkPhotosAsOrderedAsync(photoIds, createdOrder.Id);

            // Clear the cart after successful order creation
            await _cartRepository.ClearCartAsync(userId.Value);

            // Create response DTO
            var response = new EnhancedOrderCreatedDto
            {
                OrderId = createdOrder.Id.ToString(),
                OrderNumber = createdOrder.OrderNumber,
                Status = createdOrder.Status,
                TotalAmount = createdOrder.Pricing.Total,
                PaymentStatus = paymentResult.PaymentStatus,
                CreatedAt = createdOrder.Metadata.CreatedAt,
                PaymentIntentId = paymentResult.PaymentIntentId,
                ClientSecret = paymentResult.ClientSecret,
                RequiresAction = paymentResult.RequiresAction
            };

            return CreatedAtAction(
                nameof(GetOrder),
                new { id = createdOrder.Id.ToString() },
                ApiResponse<EnhancedOrderCreatedDto>.SuccessResponse(
                    response,
                    $"Order {createdOrder.OrderNumber} created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error creating order");
            return StatusCode(StatusCodes.Status500InternalServerError,
                ApiResponse<object>.ErrorResponse(
                    "Failed to create order",
                    "An unexpected error occurred"));
        }
    }

    /// <summary>
    /// Create Payment Intent for order without placing the order.
    /// This endpoint creates a Stripe Payment Intent for secure payment processing.
    /// </summary>
    [HttpPost("payment-intent")]
    [ProducesResponseType(typeof(ApiResponse<StripePaymentIntentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<StripePaymentIntentDto>>> CreatePaymentIntent(
        [FromBody] CreatePaymentIntentDto paymentIntentRequest)
    {
        try
        {
            var userId = GetAuthenticatedUserId();
            if (userId == null)
            {
                return Unauthorized(ApiResponse<object>.ErrorResponse(
                    "Authentication required",
                    "Invalid user identification"));
            }

            // Get user's cart and validate it has items
            var cart = await _cartRepository.GetByUserIdAsync(userId.Value);
            if (cart.Items.Count == 0)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(
                    "Cannot create payment intent",
                    "Shopping cart is empty"));
            }

            // Calculate totals with tax
            var taxRate = await GetTaxRateForState(paymentIntentRequest.State);
            var subtotal = cart.Summary.Subtotal;
            var taxAmount = subtotal * taxRate;
            var total = subtotal + taxAmount;

            // Create temporary order for payment intent (not saved to database)
            var tempOrder = new Order
            {
                OrderNumber = "TEMP-" + Guid.NewGuid().ToString("N")[..8].ToUpper(),
                UserId = userId.Value,
                UserInfo = new OrderUserInfo
                {
                    UserId = User.FindFirst("user_id")?.Value ?? "",
                    Email = User.FindFirst(ClaimTypes.Email)?.Value ?? "",
                    Name = User.FindFirst(ClaimTypes.Name)?.Value ?? ""
                },
                Pricing = new OrderPricing
                {
                    Subtotal = subtotal,
                    TaxRate = taxRate,
                    TaxAmount = taxAmount,
                    Total = total,
                    Currency = "USD"
                }
            };

            // Create Payment Intent
            var paymentResult = await _stripePaymentService.CreatePaymentIntentAsync(tempOrder);

            if (paymentResult.IsSuccessful)
            {
                var response = new StripePaymentIntentDto
                {
                    PaymentIntentId = paymentResult.PaymentIntentId!,
                    ClientSecret = paymentResult.ClientSecret!,
                    Amount = total,
                    Currency = paymentResult.Currency,
                    Status = paymentResult.PaymentStatus
                };

                return Ok(ApiResponse<StripePaymentIntentDto>.SuccessResponse(
                    response,
                    "Payment Intent created successfully"));
            }
            else
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(
                    "Payment Intent creation failed",
                    paymentResult.ErrorMessage ?? "Unable to create payment intent"));
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating payment intent");
            return StatusCode(StatusCodes.Status500InternalServerError,
                ApiResponse<object>.ErrorResponse(
                    "Failed to create payment intent",
                    "An unexpected error occurred"));
        }
    }

    /// <summary>
    /// Get user's order history with pagination.
    /// Returns orders sorted by creation date (newest first) with payment status.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<OrderSummaryDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<PagedResult<OrderSummaryDto>>>> GetOrders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var userId = GetAuthenticatedUserId();
            if (userId == null)
            {
                return Unauthorized(ApiResponse<object>.ErrorResponse(
                    "Authentication required",
                    "Invalid user identification"));
            }

            var pagedOrders = await _orderRepository.GetUserOrdersAsync(userId.Value, page, pageSize);

            var orderSummaries = pagedOrders.Items.Select(order => new OrderSummaryDto
            {
                OrderId = order.Id.ToString(),
                OrderNumber = order.OrderNumber,
                OrderDate = order.Metadata.CreatedAt,
                Status = order.Status,
                TotalAmount = order.Pricing.Total,
                PhotoCount = order.Items.Count,
                PrintCount = order.Items.Sum(item => item.PrintSelections.Sum(ps => ps.Quantity)),
                PaymentMethod = order.Payment.Method,
                PaymentStatus = order.Payment.Status
            }).ToList();

            var result = new PagedResult<OrderSummaryDto>
            {
                Items = orderSummaries,
                TotalCount = pagedOrders.TotalCount,
                Page = pagedOrders.Page,
                PageSize = pagedOrders.PageSize
            };

            return Ok(ApiResponse<PagedResult<OrderSummaryDto>>.SuccessResponse(
                result,
                $"Retrieved {orderSummaries.Count} orders"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving orders");
            return StatusCode(StatusCodes.Status500InternalServerError,
                ApiResponse<object>.ErrorResponse(
                    "Failed to retrieve orders",
                    "An unexpected error occurred"));
        }
    }

    /// <summary>
    /// Get specific order details by ID with payment information.
    /// Returns complete order information including items, status, and payment details.
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<object>>> GetOrder(string id)
    {
        try
        {
            var userId = GetAuthenticatedUserId();
            if (userId == null)
            {
                return Unauthorized(ApiResponse<object>.ErrorResponse(
                    "Authentication required",
                    "Invalid user identification"));
            }

            if (!ObjectId.TryParse(id, out var orderId))
            {
                return NotFound(ApiResponse<object>.ErrorResponse(
                    "Order not found",
                    "Invalid order ID format"));
            }

            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null || order.UserId != userId.Value)
            {
                return NotFound(ApiResponse<object>.ErrorResponse(
                    "Order not found",
                    "Order not found or access denied"));
            }

            // Convert to detailed DTO
            var orderDetails = new
            {
                order.OrderNumber,
                order.Status,
                order.Metadata.CreatedAt,
                order.Pricing,
                order.ShippingAddress,
                Items = order.Items.Select(item => new
                {
                    item.PhotoFilename,
                    item.PrintSelections,
                    item.PhotoTotal
                }),
                Payment = new
                {
                    order.Payment.Method,
                    Status = order.Payment.Status,
                    CreditCard = order.Payment.CreditCard != null ? new
                    {
                        order.Payment.CreditCard.LastFour,
                        order.Payment.CreditCard.CardholderName
                    } : null,
                    BranchPayment = order.Payment.BranchPayment,
                    VerifiedAt = order.Payment.VerifiedAt,
                    VerifiedBy = order.Payment.VerifiedBy
                }
            };

            return Ok(ApiResponse<object>.SuccessResponse(
                orderDetails,
                "Order details retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving order details");
            return StatusCode(StatusCodes.Status500InternalServerError,
                ApiResponse<object>.ErrorResponse(
                    "Failed to retrieve order",
                    "An unexpected error occurred"));
        }
    }

    #region Helper Methods

    /// <summary>
    /// Enhanced validation for order requests with specific payment method checks
    /// </summary>
    private ValidationResult ValidateOrderRequest(CreateOrderDto createOrderDto)
    {
        var errors = new List<string>();

        // Validate shipping address
        if (createOrderDto.ShippingAddress == null)
        {
            errors.Add("Shipping address is required");
            return new ValidationResult { IsValid = false, Errors = errors };
        }

        if (string.IsNullOrWhiteSpace(createOrderDto.ShippingAddress.FullName))
            errors.Add("Full name is required");
        if (string.IsNullOrWhiteSpace(createOrderDto.ShippingAddress.StreetLine1))
            errors.Add("Street address is required");
        if (string.IsNullOrWhiteSpace(createOrderDto.ShippingAddress.City))
            errors.Add("City is required");
        if (string.IsNullOrWhiteSpace(createOrderDto.ShippingAddress.State))
            errors.Add("State is required");
        if (string.IsNullOrWhiteSpace(createOrderDto.ShippingAddress.PostalCode))
            errors.Add("Postal code is required");

        // Validate payment method
        if (string.IsNullOrWhiteSpace(createOrderDto.PaymentMethod))
        {
            errors.Add("Payment method is required");
        }
        else if (createOrderDto.PaymentMethod != "credit_card" && createOrderDto.PaymentMethod != "branch_payment")
        {
            errors.Add("Invalid payment method. Must be 'credit_card' or 'branch_payment'");
        }
        else
        {
            // Payment method specific validation
            if (createOrderDto.PaymentMethod == "credit_card")
            {
                if (createOrderDto.CreditCard == null)
                {
                    errors.Add("Credit card information is required for credit card payment");
                }
                else
                {
                    if (string.IsNullOrWhiteSpace(createOrderDto.CreditCard.EncryptedCardNumber))
                        errors.Add("Credit card number is required");
                    if (string.IsNullOrWhiteSpace(createOrderDto.CreditCard.CardholderName))
                        errors.Add("Cardholder name is required");
                    if (string.IsNullOrWhiteSpace(createOrderDto.CreditCard.ExpiryMonth))
                        errors.Add("Expiry month is required");
                    if (string.IsNullOrWhiteSpace(createOrderDto.CreditCard.ExpiryYear))
                        errors.Add("Expiry year is required");
                }
            }
            else if (createOrderDto.PaymentMethod == "branch_payment")
            {
                if (createOrderDto.BranchPayment == null)
                {
                    errors.Add("Branch payment information is required for branch payment");
                }
                else if (string.IsNullOrWhiteSpace(createOrderDto.BranchPayment.PreferredBranch))
                {
                    errors.Add("Preferred branch is required for branch payment");
                }
            }
        }

        return new ValidationResult { IsValid = errors.Count == 0, Errors = errors };
    }

    /// <summary>
    /// Process payment based on method with proper error handling
    /// </summary>
    private async Task<PaymentProcessingResult> ProcessOrderPayment(Order order, CreateOrderDto createOrderDto)
    {
        try
        {
            if (createOrderDto.PaymentMethod == "credit_card" && createOrderDto.CreditCard != null)
            {
                _logger.LogInformation("Processing credit card payment for order {OrderNumber}", order.OrderNumber);

                // Set up payment information
                order.Payment = CreateCreditCardPayment(createOrderDto.CreditCard);

                // Handle different credit card input types
                if (createOrderDto.CreditCard.EncryptedCardNumber.StartsWith("pi_"))
                {
                    // Payment Intent ID provided - mark for webhook processing
                    order.Payment.StripePaymentIntentId = createOrderDto.CreditCard.EncryptedCardNumber;
                    order.Payment.Status = "processing";
                    order.Status = "pending"; // Will be updated by webhook

                    _logger.LogInformation("Order {OrderNumber} created with Payment Intent ID: {PaymentIntentId}",
                        order.OrderNumber, createOrderDto.CreditCard.EncryptedCardNumber);

                    return new PaymentProcessingResult
                    {
                        Success = true,
                        PaymentStatus = "processing",
                        PaymentIntentId = createOrderDto.CreditCard.EncryptedCardNumber
                    };
                }
                else
                {
                    // Handle other payment types (tokens, encrypted data) - if needed
                    _logger.LogInformation("Processing direct credit card payment for order {OrderNumber}", order.OrderNumber);

                    order.Payment.Status = "pending";
                    return new PaymentProcessingResult
                    {
                        Success = true,
                        PaymentStatus = "pending"
                    };
                }
            }
            else if (createOrderDto.PaymentMethod == "branch_payment" && createOrderDto.BranchPayment != null)
            {
                _logger.LogInformation("Processing branch payment for order {OrderNumber}", order.OrderNumber);

                // Set up branch payment
                order.Payment = CreateBranchPayment(createOrderDto.BranchPayment);
                order.Payment.Status = "pending";

                return new PaymentProcessingResult
                {
                    Success = true,
                    PaymentStatus = "pending"
                };
            }
            else
            {
                return new PaymentProcessingResult
                {
                    Success = false,
                    ErrorMessage = "Invalid payment configuration"
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing payment for order {OrderNumber}", order.OrderNumber);
            return new PaymentProcessingResult
            {
                Success = false,
                ErrorMessage = "Payment processing error: " + ex.Message
            };
        }
    }

    /// <summary>
    /// Create credit card payment information
    /// </summary>
    private static OrderPayment CreateCreditCardPayment(CreditCardDto creditCard)
    {
        return new OrderPayment
        {
            Method = "credit_card",
            Status = "pending",
            CreditCard = new CreditCardInfo
            {
                LastFour = "****", // Will be updated after payment processing
                CardholderName = creditCard.CardholderName
            }
        };
    }

    /// <summary>
    /// Create branch payment information  
    /// </summary>
    private static OrderPayment CreateBranchPayment(BranchPaymentDto branchPayment)
    {
        return new OrderPayment
        {
            Method = "branch_payment",
            Status = "pending",
            BranchPayment = new BranchPaymentInfo
            {
                PreferredBranch = branchPayment.PreferredBranch,
                ReferenceNumber = $"BP-{DateTime.UtcNow:yyyy}-{Random.Shared.Next(1000000, 9999999)}"
            }
        };
    }

    private ObjectId? GetAuthenticatedUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim != null && ObjectId.TryParse(userIdClaim.Value, out var userId))
        {
            return userId;
        }
        return null;
    }

    private static List<OrderItem> ConvertCartToOrderItems(ShoppingCart cart)
    {
        return cart.Items.Select(cartItem => new OrderItem
        {
            PhotoId = cartItem.PhotoId,
            PhotoFilename = cartItem.PhotoDetails.Filename,
            PhotoFileSize = 0, // Would be populated from actual photo data
            PrintSelections = cartItem.PrintSelections.Select(ps => new OrderPrintSelection
            {
                SizeCode = ps.SizeCode,
                SizeName = ps.SizeName,
                Quantity = ps.Quantity,
                UnitPrice = ps.UnitPrice,
                Subtotal = ps.LineTotal
            }).ToList(),
            PhotoTotal = cartItem.PhotoTotal
        }).ToList();
    }

    private static ShippingAddress ConvertToShippingAddress(ShippingAddressDto dto)
    {
        return new ShippingAddress
        {
            FullName = dto.FullName,
            StreetLine1 = dto.StreetLine1,
            StreetLine2 = dto.StreetLine2,
            City = dto.City,
            State = dto.State,
            PostalCode = dto.PostalCode,
            Country = dto.Country,
            Phone = dto.Phone
        };
    }

    private async Task<decimal> GetTaxRateForState(string state)
    {
        try
        {
            var taxSettings = await _settingsRepository.GetByKeyAsync("tax_rates");
            if (taxSettings?.Value != null)
            {
                if (taxSettings.Value.TryGetValue("byState", out var byStateValue) &&
                    byStateValue.IsBsonDocument)
                {
                    var byStateDoc = byStateValue.AsBsonDocument;
                    if (byStateDoc.TryGetValue(state, out var stateRateValue) &&
                        stateRateValue.IsNumeric)
                    {
                        return (decimal)stateRateValue.AsDouble;
                    }
                }

                if (taxSettings.Value.TryGetValue("default", out var defaultValue) &&
                    defaultValue.IsNumeric)
                {
                    return (decimal)defaultValue.AsDouble;
                }
            }

            return 0.0625m; // 6.25% default
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error getting tax rate for state {State}", state);
            return 0.0625m;
        }
    }

    #endregion

    #region Helper Classes

    /// <summary>
    /// Result of order validation
    /// </summary>
    private class ValidationResult
    {
        public bool IsValid { get; set; }
        public List<string> Errors { get; set; } = new();
    }

    /// <summary>
    /// Result of payment processing
    /// </summary>
    private class PaymentProcessingResult
    {
        public bool Success { get; set; }
        public string PaymentStatus { get; set; } = "pending";
        public string? PaymentIntentId { get; set; }
        public string? ClientSecret { get; set; }
        public bool RequiresAction { get; set; }
        public string? ErrorMessage { get; set; }
    }

    #endregion
}