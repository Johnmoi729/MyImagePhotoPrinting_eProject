// src/MyImage.Infrastructure/Services/StripePaymentService.cs
// CRITICAL FIXES: Line 120 variable name issue and Lines 233-234 type conversion

using Stripe;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MyImage.Core.Interfaces.Services;
using MyImage.Core.Interfaces.Repositories;
using MyImage.Core.Entities;
using MongoDB.Bson;
using System.Security.Cryptography;
using System.Text;

namespace MyImage.Infrastructure.Services;

/// <summary>
/// Service implementation for Stripe payment processing operations.
/// CRITICAL FIXES APPLIED:
/// 1. Fixed line 120: 'createdOrder' variable name issue
/// 2. Fixed lines 233-234: Type conversion for ExpMonth/ExpYear to string
/// </summary>
public class StripePaymentService : IStripePaymentService
{
    private readonly IOrderRepository _orderRepository;
    private readonly ISystemSettingsRepository _settingsRepository;
    private readonly IConfiguration _configuration;
    private readonly ILogger<StripePaymentService> _logger;

    // Stripe service clients
    private readonly PaymentIntentService _paymentIntentService;
    private readonly ChargeService _chargeService;
    private readonly CustomerService _customerService;
    private readonly PaymentMethodService _paymentMethodService;
    private readonly RefundService _refundService;

    // Webhook configuration
    private readonly string _webhookSecret;
    private readonly string _stripeSecretKey;

    public StripePaymentService(
        IOrderRepository orderRepository,
        ISystemSettingsRepository settingsRepository,
        IConfiguration configuration,
        ILogger<StripePaymentService> logger)
    {
        _orderRepository = orderRepository;
        _settingsRepository = settingsRepository;
        _configuration = configuration;
        _logger = logger;

        // Load Stripe configuration with validation
        _stripeSecretKey = configuration["Stripe:SecretKey"]
            ?? throw new InvalidOperationException("Stripe Secret Key not configured");

        // Make webhook secret optional for development
        _webhookSecret = configuration["Stripe:WebhookSecret"] ?? string.Empty;
        if (string.IsNullOrEmpty(_webhookSecret))
        {
            _logger.LogWarning("Stripe Webhook Secret not configured - webhook processing will be limited");
        }

        // Configure Stripe API key globally
        StripeConfiguration.ApiKey = _stripeSecretKey;

        // Initialize Stripe service clients
        _paymentIntentService = new PaymentIntentService();
        _chargeService = new ChargeService();
        _customerService = new CustomerService();
        _paymentMethodService = new PaymentMethodService();
        _refundService = new RefundService();

        _logger.LogInformation("StripePaymentService initialized successfully");
    }

    // COMPLETE FIX for Return URL and Payment Intent Issues

    public async Task<StripePaymentResult> CreatePaymentIntentAsync(Order order, string? stripeToken = null)
    {
        try
        {
            _logger.LogInformation("Creating Stripe Payment Intent for order {OrderNumber}, amount: {Amount:C}",
                order.OrderNumber, order.Pricing.Total);

            // Convert amount to cents (Stripe requirement)
            var amountCents = (long)(order.Pricing.Total * 100);

            // Find or create Stripe customer
            var customer = await FindOrCreateCustomerAsync(order.UserInfo.Email, order.UserInfo.Name);

            // Base Payment Intent options
            var options = new PaymentIntentCreateOptions
            {
                Amount = amountCents,
                Currency = "usd",
                Customer = customer.Id,
                Description = $"Photo printing order {order.OrderNumber}",
                Metadata = new Dictionary<string, string>
                {
                    ["order_id"] = order.Id.ToString(),
                    ["order_number"] = order.OrderNumber,
                    ["user_email"] = order.UserInfo.Email
                }
            };

            // FIXED: Handle different input types correctly with return URLs
            if (string.IsNullOrEmpty(stripeToken))
            {
                // No token provided - use automatic payment methods with redirect control
                options.AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
                {
                    Enabled = true,
                    AllowRedirects = "never"  // FIXED: Disable redirects to avoid return_url requirement
                };
            }
            else if (stripeToken.StartsWith("tok_"))
            {
                // FIXED: Handle Stripe tokens with proper return URL
                _logger.LogDebug("Creating PaymentMethod from token: {Token}", stripeToken);

                var paymentMethodService = new PaymentMethodService();
                var paymentMethodOptions = new PaymentMethodCreateOptions
                {
                    Type = "card",
                    Card = new PaymentMethodCardOptions
                    {
                        Token = stripeToken
                    }
                };

                var paymentMethod = await paymentMethodService.CreateAsync(paymentMethodOptions);

                // Attach to customer
                await paymentMethodService.AttachAsync(paymentMethod.Id, new PaymentMethodAttachOptions
                {
                    Customer = customer.Id
                });

                // Use the created PaymentMethod with return URL
                options.PaymentMethod = paymentMethod.Id;
                options.ConfirmationMethod = "manual";
                options.Confirm = true;

                // FIXED: Add return URL to prevent redirect-based payment method errors
                options.ReturnUrl = _configuration["Stripe:ReturnUrl"] ?? "http://localhost:4200/payment-complete";

                _logger.LogDebug("Created PaymentMethod {PaymentMethodId} from token {Token}",
                    paymentMethod.Id, stripeToken);
            }
            else if (stripeToken.StartsWith("pm_"))
            {
                // PaymentMethod ID provided
                options.PaymentMethod = stripeToken;
                options.ConfirmationMethod = "manual";
                options.Confirm = true;
                options.ReturnUrl = _configuration["Stripe:ReturnUrl"] ?? "http://localhost:4200/payment-complete";
            }
            else if (stripeToken.StartsWith("pi_"))
            {
                // Payment Intent ID provided - this should not create new PI
                _logger.LogWarning("Payment Intent ID provided to CreatePaymentIntentAsync - redirecting to ConfirmPaymentAsync");
                return await ConfirmExistingPaymentIntentAsync(stripeToken, order);
            }
            else
            {
                // Unknown format - log and treat as automatic with no redirects
                _logger.LogWarning("Unknown token format: {Token} - using automatic payment methods", stripeToken);
                options.AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
                {
                    Enabled = true,
                    AllowRedirects = "never"
                };
            }

            var paymentIntent = await _paymentIntentService.CreateAsync(options);

            // Update order with Stripe metadata
            await UpdateOrderWithStripeMetadata(order, paymentIntent, customer);

            order.Payment.Status = ConvertStripeStatusToOrderStatus(paymentIntent.Status);

            if (order.Payment.CreditCard != null)
            {
                order.Payment.CreditCard.LastFour = await ExtractLast4FromPaymentIntentAsync(paymentIntent);
            }

            await _orderRepository.UpdateAsync(order);

            return new StripePaymentResult
            {
                IsSuccessful = paymentIntent.Status != "canceled" && paymentIntent.Status != "payment_failed",
                PaymentIntentId = paymentIntent.Id,
                ClientSecret = paymentIntent.ClientSecret,
                PaymentStatus = paymentIntent.Status,
                AmountCents = paymentIntent.Amount,
                Currency = paymentIntent.Currency,
                RequiresAction = paymentIntent.Status == "requires_action",
                ProcessingFee = CalculateProcessingFee(order.Pricing.Total)
            };
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error creating Payment Intent: {Error}", ex.Message);
            return new StripePaymentResult
            {
                IsSuccessful = false,
                ErrorMessage = ex.Message,
                ErrorCode = ex.StripeError?.Code
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error creating Payment Intent");
            return new StripePaymentResult
            {
                IsSuccessful = false,
                ErrorMessage = "An unexpected error occurred during payment processing"
            };
        }
    }

    // FIXED: Better handling of existing Payment Intent confirmation
    private async Task<StripePaymentResult> ConfirmExistingPaymentIntentAsync(string paymentIntentId, Order order)
    {
        try
        {
            _logger.LogInformation("Handling existing Payment Intent {PaymentIntentId}", paymentIntentId);

            // Get the existing Payment Intent
            var existingPI = await _paymentIntentService.GetAsync(paymentIntentId);

            _logger.LogInformation("Existing Payment Intent {PaymentIntentId} status: {Status}",
                paymentIntentId, existingPI.Status);

            if (existingPI.Status == "requires_payment_method")
            {
                _logger.LogError("Payment Intent {PaymentIntentId} requires payment method - cannot proceed without payment method",
                    paymentIntentId);

                return new StripePaymentResult
                {
                    IsSuccessful = false,
                    ErrorMessage = "This Payment Intent was created without a payment method. Please create a new order or provide payment method details.",
                    PaymentIntentId = paymentIntentId,
                    PaymentStatus = existingPI.Status
                };
            }

            if (existingPI.Status == "requires_confirmation")
            {
                _logger.LogInformation("Confirming Payment Intent {PaymentIntentId}", paymentIntentId);
                var confirmedPI = await _paymentIntentService.ConfirmAsync(paymentIntentId, new PaymentIntentConfirmOptions
                {
                    ReturnUrl = _configuration["Stripe:ReturnUrl"] ?? "http://localhost:4200/payment-complete"
                });

                // Update order with the confirmed status
                order.Payment.Status = ConvertStripeStatusToOrderStatus(confirmedPI.Status);
                if (confirmedPI.Status == "succeeded")
                {
                    order.Status = "payment_verified";
                    order.Payment.VerifiedAt = DateTime.UtcNow;
                    order.Payment.VerifiedBy = "stripe_immediate";
                }
                await _orderRepository.UpdateAsync(order);

                return new StripePaymentResult
                {
                    IsSuccessful = confirmedPI.Status == "succeeded",
                    PaymentIntentId = confirmedPI.Id,
                    PaymentStatus = confirmedPI.Status,
                    AmountCents = confirmedPI.Amount,
                    Currency = confirmedPI.Currency,
                    RequiresAction = confirmedPI.Status == "requires_action"
                };
            }

            if (existingPI.Status == "succeeded")
            {
                _logger.LogInformation("Payment Intent {PaymentIntentId} already succeeded", paymentIntentId);

                // Update order status
                order.Payment.Status = "verified";
                order.Status = "payment_verified";
                order.Payment.VerifiedAt = DateTime.UtcNow;
                order.Payment.VerifiedBy = "stripe_immediate";
                await _orderRepository.UpdateAsync(order);
            }

            // Return current status
            return new StripePaymentResult
            {
                IsSuccessful = existingPI.Status == "succeeded",
                PaymentIntentId = existingPI.Id,
                PaymentStatus = existingPI.Status,
                AmountCents = existingPI.Amount,
                Currency = existingPI.Currency,
                RequiresAction = existingPI.Status == "requires_action"
            };
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error handling existing Payment Intent {PaymentIntentId}: {Error}",
                paymentIntentId, ex.Message);

            return new StripePaymentResult
            {
                IsSuccessful = false,
                ErrorMessage = ex.Message,
                PaymentIntentId = paymentIntentId
            };
        }
    }

    /// <summary>
    /// Update order with Stripe payment metadata after successful processing.
    /// This method should be called after successful Payment Intent creation.
    /// </summary>
    private async Task UpdateOrderWithStripeMetadata(Order order, PaymentIntent paymentIntent, Customer customer)
    {
        try
        {
            // Update order with Stripe metadata
            order.Payment.StripePaymentIntentId = paymentIntent.Id;
            order.Payment.StripeCustomerId = customer.Id;
            order.Payment.StripeProcessingFee = CalculateProcessingFee(order.Pricing.Total);

            // If payment succeeded immediately, also store charge ID
            if (paymentIntent.Status == "succeeded" && paymentIntent.LatestChargeId != null)
            {
                order.Payment.StripeChargeId = paymentIntent.LatestChargeId;
            }

            await _orderRepository.UpdateAsync(order);

            _logger.LogDebug("Updated order {OrderNumber} with Stripe metadata: PaymentIntent={PaymentIntentId}, Customer={CustomerId}",
                order.OrderNumber, paymentIntent.Id, customer.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update order {OrderNumber} with Stripe metadata", order.OrderNumber);
            // Don't throw - this is metadata update, not critical for payment flow
        }
    }

    // FIXED: ProcessDirectPaymentAsync method to handle Stripe security restrictions

    public async Task<StripePaymentResult> ProcessDirectPaymentAsync(Order order, EncryptedCardData encryptedCardData)
    {
        try
        {
            _logger.LogInformation("Processing direct payment for order {OrderNumber}", order.OrderNumber);

            // For encrypted card data, we need to use Payment Method API instead of Token API
            // This approach is more secure and works with Stripe's security restrictions

            // Decrypt credit card data
            var cardData = await DecryptCardDataAsync(encryptedCardData);

            // Validate expiry month and year
            if (!int.TryParse(cardData.ExpiryMonth, out var expMonthInt) || expMonthInt < 1 || expMonthInt > 12)
            {
                throw new ArgumentException("Invalid expiry month format");
            }

            if (!int.TryParse(cardData.ExpiryYear, out var expYearInt) || expYearInt < DateTime.Now.Year)
            {
                throw new ArgumentException("Invalid expiry year format");
            }

            // FIXED: Use Payment Method API instead of Token API to avoid raw card data restrictions
            _logger.LogDebug("Creating Payment Method from decrypted card data");

            // Find or create customer first
            var customer = await FindOrCreateCustomerAsync(order.UserInfo.Email, order.UserInfo.Name);

            // Create Payment Method using the Payment Methods API (more secure)
            var paymentMethodOptions = new PaymentMethodCreateOptions
            {
                Type = "card",
                Card = new PaymentMethodCardOptions
                {
                    Number = cardData.CardNumber,
                    ExpMonth = long.Parse(cardData.ExpiryMonth),  // PaymentMethod API expects long
                    ExpYear = long.Parse(cardData.ExpiryYear),    // PaymentMethod API expects long
                    Cvc = cardData.Cvv
                },
                BillingDetails = new PaymentMethodBillingDetailsOptions
                {
                    Name = cardData.CardholderName,
                    Email = order.UserInfo.Email
                }
            };

            var paymentMethodService = new PaymentMethodService();
            var paymentMethod = await paymentMethodService.CreateAsync(paymentMethodOptions);

            _logger.LogDebug("Created Payment Method {PaymentMethodId}", paymentMethod.Id);

            // Attach Payment Method to customer  
            await paymentMethodService.AttachAsync(paymentMethod.Id, new PaymentMethodAttachOptions
            {
                Customer = customer.Id
            });

            // Use Payment Intent flow with the created Payment Method
            return await CreatePaymentIntentAsync(order, paymentMethod.Id);
        }
        catch (StripeException ex) when (ex.StripeError?.Code == "card_declined")
        {
            _logger.LogWarning("Card declined for order {OrderNumber}: {Error}", order.OrderNumber, ex.Message);
            return new StripePaymentResult
            {
                IsSuccessful = false,
                ErrorMessage = "Your card was declined. Please try a different payment method.",
                ErrorCode = ex.StripeError.Code
            };
        }
        catch (StripeException ex) when (ex.StripeError?.Code == "insufficient_funds")
        {
            _logger.LogWarning("Insufficient funds for order {OrderNumber}: {Error}", order.OrderNumber, ex.Message);
            return new StripePaymentResult
            {
                IsSuccessful = false,
                ErrorMessage = "Insufficient funds. Please try a different payment method.",
                ErrorCode = ex.StripeError.Code
            };
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error processing direct payment for order {OrderNumber}: {Error}",
                order.OrderNumber, ex.Message);
            return new StripePaymentResult
            {
                IsSuccessful = false,
                ErrorMessage = GetUserFriendlyStripeError(ex),
                ErrorCode = ex.StripeError?.Code
            };
        }
        catch (ArgumentException ex)
        {
            _logger.LogError(ex, "Invalid card data for order {OrderNumber}: {Error}", order.OrderNumber, ex.Message);
            return new StripePaymentResult
            {
                IsSuccessful = false,
                ErrorMessage = ex.Message
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing direct payment for order {OrderNumber}", order.OrderNumber);
            return new StripePaymentResult
            {
                IsSuccessful = false,
                ErrorMessage = "Payment processing failed"
            };
        }
    }

    /// <summary>
    /// Convert Stripe errors to user-friendly messages
    /// </summary>
    private static string GetUserFriendlyStripeError(StripeException ex)
    {
        return ex.StripeError?.Code switch
        {
            "card_declined" => "Your card was declined. Please try a different payment method.",
            "insufficient_funds" => "Insufficient funds. Please try a different payment method.",
            "expired_card" => "Your card has expired. Please try a different payment method.",
            "incorrect_cvc" => "Your card's security code is incorrect. Please try again.",
            "processing_error" => "An error occurred while processing your card. Please try again.",
            "rate_limit" => "Too many requests. Please try again in a moment.",
            _ => "Payment processing failed. Please try again or use a different payment method."
        };
    }

    // ALSO UPDATE: ConfirmPaymentAsync method
    public async Task<StripePaymentResult> ConfirmPaymentAsync(string paymentIntentId, ObjectId orderId)
    {
        try
        {
            _logger.LogInformation("Confirming payment {PaymentIntentId} for order {OrderId}",
                paymentIntentId, orderId);

            // Fetch Payment Intent first to check status
            var paymentIntent = await _paymentIntentService.GetAsync(paymentIntentId, new PaymentIntentGetOptions
            {
                Expand = new List<string> { "payment_method" }
            });

            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
            {
                _logger.LogError("Order {OrderId} not found for payment confirmation", orderId);
                return new StripePaymentResult
                {
                    IsSuccessful = false,
                    ErrorMessage = "Order not found"
                };
            }

            // FIXED: Check if Payment Intent requires payment method
            if (paymentIntent.Status == "requires_payment_method")
            {
                _logger.LogError("Cannot confirm Payment Intent {PaymentIntentId} - requires payment method", paymentIntentId);

                order.Payment.Status = "failed";
                order.Status = "payment_failed";
                await _orderRepository.UpdateAsync(order);

                return new StripePaymentResult
                {
                    IsSuccessful = false,
                    PaymentIntentId = paymentIntent.Id,
                    PaymentStatus = paymentIntent.Status,
                    ErrorMessage = "Payment Intent requires a payment method to be attached before confirmation"
                };
            }

            // Update order payment status based on current Stripe status
            order.Payment.Status = ConvertStripeStatusToOrderStatus(paymentIntent.Status);

            if (paymentIntent.Status == "succeeded")
            {
                order.Payment.VerifiedAt = DateTime.UtcNow;
                order.Payment.VerifiedBy = "stripe_system";
                order.Status = "payment_verified";

                // Update credit card info with last 4 digits
                if (order.Payment.CreditCard != null)
                {
                    order.Payment.CreditCard.LastFour = await ExtractLast4FromPaymentIntentAsync(paymentIntent);
                }
            }

            await _orderRepository.UpdateAsync(order);

            _logger.LogInformation("Payment status updated for order {OrderNumber}, PI status: {Status}",
                order.OrderNumber, paymentIntent.Status);

            return new StripePaymentResult
            {
                IsSuccessful = paymentIntent.Status == "succeeded",
                PaymentIntentId = paymentIntent.Id,
                PaymentStatus = paymentIntent.Status,
                AmountCents = paymentIntent.Amount,
                Currency = paymentIntent.Currency,
                ErrorMessage = paymentIntent.Status == "requires_payment_method" ?
                    "Payment method required" : null
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error confirming payment {PaymentIntentId}", paymentIntentId);
            return new StripePaymentResult
            {
                IsSuccessful = false,
                ErrorMessage = "Payment confirmation failed"
            };
        }
    }

    public async Task<StripePaymentDetails?> GetPaymentDetailsAsync(string paymentIntentId)
    {
        try
        {
            var paymentIntent = await _paymentIntentService.GetAsync(paymentIntentId, new PaymentIntentGetOptions
            {
                Expand = new List<string> { "payment_method", "customer" }
            });

            var details = new StripePaymentDetails
            {
                PaymentIntentId = paymentIntent.Id,
                Status = paymentIntent.Status,
                AmountCents = paymentIntent.Amount,
                Currency = paymentIntent.Currency,
                CustomerEmail = paymentIntent.Customer?.Email,
                ProcessingFee = CalculateProcessingFee(paymentIntent.Amount / 100m),
                CreatedAt = paymentIntent.Created
            };

            // Extract payment method details with proper type handling
            if (paymentIntent.PaymentMethod is PaymentMethod expandedPaymentMethod && expandedPaymentMethod.Card != null)
            {
                details.PaymentMethod = new PaymentMethodDetails
                {
                    Brand = expandedPaymentMethod.Card.Brand,
                    Last4 = expandedPaymentMethod.Card.Last4,
                    Funding = expandedPaymentMethod.Card.Funding,
                    Country = expandedPaymentMethod.Card.Country
                };
            }

            return details;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting payment details for {PaymentIntentId}", paymentIntentId);
            return null;
        }
    }

    public async Task<StripeRefundResult> RefundPaymentAsync(string paymentIntentId, decimal? refundAmount = null, string? reason = null)
    {
        try
        {
            _logger.LogInformation("Processing refund for Payment Intent {PaymentIntentId}, amount: {Amount}",
                paymentIntentId, refundAmount?.ToString("C") ?? "full");

            var paymentIntent = await _paymentIntentService.GetAsync(paymentIntentId);

            var refundOptions = new RefundCreateOptions
            {
                PaymentIntent = paymentIntentId,
                Reason = reason switch
                {
                    "duplicate" => "duplicate",
                    "fraudulent" => "fraudulent",
                    _ => "requested_by_customer"
                }
            };

            if (refundAmount.HasValue)
            {
                refundOptions.Amount = (long)(refundAmount.Value * 100);
            }

            var refund = await _refundService.CreateAsync(refundOptions);

            return new StripeRefundResult
            {
                IsSuccessful = refund.Status == "succeeded" || refund.Status == "pending",
                RefundId = refund.Id,
                RefundedAmountCents = refund.Amount,
                Status = refund.Status,
                RefundAvailableDate = DateTime.UtcNow.AddBusinessDays(5)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing refund for {PaymentIntentId}", paymentIntentId);
            return new StripeRefundResult
            {
                IsSuccessful = false,
                ErrorMessage = "Refund processing failed"
            };
        }
    }

    public async Task<List<StripePaymentMethod>> GetCustomerPaymentMethodsAsync(string customerEmail)
    {
        try
        {
            // Find customer by email
            var customers = await _customerService.ListAsync(new CustomerListOptions
            {
                Email = customerEmail,
                Limit = 1
            });

            var customer = customers.FirstOrDefault();
            if (customer == null)
            {
                return new List<StripePaymentMethod>();
            }

            // Get customer's payment methods
            var paymentMethods = await _paymentMethodService.ListAsync(new PaymentMethodListOptions
            {
                Customer = customer.Id,
                Type = "card"
            });

            return paymentMethods.Select(pm => new StripePaymentMethod
            {
                PaymentMethodId = pm.Id,
                Type = pm.Type,
                Card = pm.Card != null ? new PaymentMethodDetails
                {
                    Brand = pm.Card.Brand,
                    Last4 = pm.Card.Last4,
                    Funding = pm.Card.Funding,
                    Country = pm.Card.Country
                } : null,
                CreatedAt = pm.Created
            }).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting payment methods for customer {Email}", customerEmail);
            return new List<StripePaymentMethod>();
        }
    }

    #region Private Helper Methods

    private async Task<Customer> FindOrCreateCustomerAsync(string email, string name)
    {
        // Try to find existing customer
        var customers = await _customerService.ListAsync(new CustomerListOptions
        {
            Email = email,
            Limit = 1
        });

        var customer = customers.FirstOrDefault();
        if (customer != null)
        {
            return customer;
        }

        // Create new customer
        var createOptions = new CustomerCreateOptions
        {
            Email = email,
            Name = name,
            Description = "MyImage Photo Printing Customer"
        };

        return await _customerService.CreateAsync(createOptions);
    }

    private static string ConvertStripeStatusToOrderStatus(string stripeStatus)
    {
        return stripeStatus switch
        {
            "succeeded" => "verified",
            "processing" => "processing",
            "requires_payment_method" => "pending",
            "requires_confirmation" => "pending",
            "requires_action" => "pending",
            "canceled" => "failed",
            "payment_failed" => "failed",
            _ => "pending"
        };
    }

    /// <summary>
    /// Extract last 4 digits from payment intent with proper type handling.
    /// This method handles the Stripe.NET PaymentMethod object correctly.
    /// </summary>
    private async Task<string> ExtractLast4FromPaymentIntentAsync(PaymentIntent paymentIntent)
    {
        try
        {
            // Check if payment method is expanded as a PaymentMethod object
            if (paymentIntent.PaymentMethod is PaymentMethod expandedPm && expandedPm.Card != null)
            {
                return expandedPm.Card.Last4;
            }

            // If payment method is not expanded, try to get the ID and fetch details
            var paymentMethodId = paymentIntent.PaymentMethodId;
            if (!string.IsNullOrEmpty(paymentMethodId))
            {
                var paymentMethod = await _paymentMethodService.GetAsync(paymentMethodId);
                return paymentMethod.Card?.Last4 ?? "****";
            }

            return "****";
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not extract last 4 digits from payment intent {PaymentIntentId}", paymentIntent.Id);
            return "****";
        }
    }

    private static decimal CalculateProcessingFee(decimal amount)
    {
        return Math.Round(amount * 0.029m + 0.30m, 2);
    }

    // FIXED: DecryptCardDataAsync method to use configuration directly instead of database

    private async Task<DecryptedCardData> DecryptCardDataAsync(EncryptedCardData encryptedData)
    {
        try
        {
            _logger.LogDebug("Decrypting card data for payment processing");

            // FIXED: Get private key directly from environment/configuration instead of database
            var privateKeyPem = Environment.GetEnvironmentVariable("PAYMENT_ENCRYPTION_PRIVATE_KEY")
                ?? _configuration["PaymentEncryption:PrivateKey"];

            if (string.IsNullOrEmpty(privateKeyPem))
            {
                _logger.LogError("Payment encryption private key not configured");
                throw new InvalidOperationException("Payment encryption private key not configured. Set PAYMENT_ENCRYPTION_PRIVATE_KEY environment variable or PaymentEncryption:PrivateKey in configuration.");
            }

            // Validate private key format
            if (!privateKeyPem.Contains("-----BEGIN PRIVATE KEY-----"))
            {
                _logger.LogError("Invalid private key format - must be PEM format");
                throw new InvalidOperationException("Payment encryption private key must be in PEM format");
            }

            using var rsa = RSA.Create();
            rsa.ImportFromPem(privateKeyPem);

            var decryptedData = new DecryptedCardData
            {
                CardNumber = DecryptString(encryptedData.EncryptedCardNumber, rsa),
                CardholderName = encryptedData.CardholderName,
                ExpiryMonth = encryptedData.ExpiryMonth,
                ExpiryYear = encryptedData.ExpiryYear,
                Cvv = DecryptString(encryptedData.EncryptedCvv, rsa)
            };

            _logger.LogDebug("Successfully decrypted card data for payment processing");
            return decryptedData;
        }
        catch (CryptographicException ex)
        {
            _logger.LogError(ex, "Failed to decrypt card data - cryptographic error: {Error}", ex.Message);
            throw new InvalidOperationException("Failed to decrypt payment data - please verify encryption keys are correct", ex);
        }
        catch (FormatException ex)
        {
            _logger.LogError(ex, "Failed to decrypt card data - format error: {Error}", ex.Message);
            throw new InvalidOperationException("Invalid encrypted payment data format", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error decrypting card data: {Error}", ex.Message);
            throw new InvalidOperationException("Failed to process encrypted payment data", ex);
        }
    }

    private static string DecryptString(string encryptedData, RSA rsa)
    {
        var encryptedBytes = Convert.FromBase64String(encryptedData);
        var decryptedBytes = rsa.Decrypt(encryptedBytes, RSAEncryptionPadding.OaepSHA256);
        return Encoding.UTF8.GetString(decryptedBytes);
    }

    #endregion
}

/// <summary>
/// Internal class for decrypted card data processing
/// </summary>
internal class DecryptedCardData
{
    public string CardNumber { get; set; } = string.Empty;
    public string CardholderName { get; set; } = string.Empty;
    public string ExpiryMonth { get; set; } = string.Empty;
    public string ExpiryYear { get; set; } = string.Empty;
    public string Cvv { get; set; } = string.Empty;
}

/// <summary>
/// Extension methods for date calculations
/// </summary>
public static class DateTimeExtensions
{
    public static DateTime AddBusinessDays(this DateTime startDate, int businessDays)
    {
        var direction = businessDays < 0 ? -1 : 1;
        var format = startDate;
        var businessDaysCount = Math.Abs(businessDays);

        while (businessDaysCount > 0)
        {
            format = format.AddDays(direction);
            if (format.DayOfWeek != DayOfWeek.Saturday && format.DayOfWeek != DayOfWeek.Sunday)
            {
                businessDaysCount--;
            }
        }

        return format;
    }
}