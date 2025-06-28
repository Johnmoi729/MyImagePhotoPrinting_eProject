using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MyImage.Core.DTOs.Common;
using MyImage.Core.DTOs.Stripe;
using MyImage.Core.Interfaces.Services;
using MyImage.Core.Interfaces.Repositories;
using Microsoft.Extensions.Configuration;
using System.Security.Cryptography;
using System.Text;

namespace MyImage.API.Controllers;

/// <summary>
/// Controller for Stripe configuration and client-side integration support.
/// Provides endpoints for frontend Stripe.js initialization and configuration.
/// 
/// UPDATED VERSION: Using proper DTOs from Core project instead of inline classes.
/// </summary>
[ApiController]
[Route("api/stripe")]
[Produces("application/json")]
public class StripeConfigController : ControllerBase
{
    private readonly IStripePaymentService _stripePaymentService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<StripeConfigController> _logger;
    private readonly ISystemSettingsRepository _systemSettingsRepository;

    public StripeConfigController(
        IStripePaymentService stripePaymentService,
        IConfiguration configuration,
        ILogger<StripeConfigController> logger,
        ISystemSettingsRepository systemSettingsRepository)
    {
        _stripePaymentService = stripePaymentService;
        _configuration = configuration;
        _logger = logger;
        _systemSettingsRepository = systemSettingsRepository;
    }

    /// <summary>
    /// Get Stripe configuration for frontend initialization.
    /// Returns the publishable key and other client-safe configuration needed for Stripe.js.
    /// </summary>
    [HttpGet("config")]
    [AllowAnonymous] // Publishable key is safe to expose
    [ProducesResponseType(typeof(ApiResponse<StripeConfigDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public ActionResult<ApiResponse<StripeConfigDto>> GetStripeConfig()
    {
        try
        {
            var publishableKey = _configuration["Stripe:PublishableKey"];

            if (string.IsNullOrEmpty(publishableKey))
            {
                _logger.LogError("Stripe publishable key not configured");
                return StatusCode(StatusCodes.Status500InternalServerError,
                    ApiResponse<object>.ErrorResponse(
                        "Stripe configuration error",
                        "Payment system is not properly configured"));
            }

            var config = new StripeConfigDto
            {
                PublishableKey = publishableKey,
                Currency = "usd",
                Country = "US",
                ReturnUrl = _configuration["Stripe:ReturnUrl"] ?? $"{Request.Scheme}://{Request.Host}/payment-complete",
                CancelUrl = _configuration["Stripe:CancelUrl"] ?? $"{Request.Scheme}://{Request.Host}/payment-cancel",

                PaymentElementOptions = new PaymentElementOptionsDto
                {
                    Layout = "tabs",
                    PaymentMethodOrder = new[] { "card", "apple_pay", "google_pay" }
                },

                Appearance = new StripeAppearanceDto
                {
                    Theme = "stripe",
                    Variables = new Dictionary<string, string>
                    {
                        ["colorPrimary"] = "#0570de",
                        ["colorBackground"] = "#ffffff",
                        ["colorText"] = "#30313d",
                        ["colorDanger"] = "#df1b41",
                        ["fontFamily"] = "system-ui, sans-serif",
                        ["spacingUnit"] = "4px",
                        ["borderRadius"] = "6px"
                    }
                }
            };

            _logger.LogDebug("Stripe configuration provided to frontend");

            return Ok(ApiResponse<StripeConfigDto>.SuccessResponse(
                config,
                "Stripe configuration retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Stripe configuration");
            return StatusCode(StatusCodes.Status500InternalServerError,
                ApiResponse<object>.ErrorResponse(
                    "Configuration error",
                    "Failed to retrieve payment configuration"));
        }
    }

    /// <summary>
    /// Get saved payment methods for authenticated customer.
    /// Returns customer's saved payment methods from Stripe for faster checkout.
    /// </summary>
    [HttpGet("payment-methods")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<List<CustomerPaymentMethodDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<List<CustomerPaymentMethodDto>>>> GetPaymentMethods()
    {
        try
        {
            var userEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;

            if (string.IsNullOrEmpty(userEmail))
            {
                return Unauthorized(ApiResponse<object>.ErrorResponse(
                    "Authentication required",
                    "User email not found in token"));
            }

            var paymentMethods = await _stripePaymentService.GetCustomerPaymentMethodsAsync(userEmail);

            // Convert to DTOs with proper handling of card details
            var customerPaymentMethods = paymentMethods.Select(pm => new CustomerPaymentMethodDto
            {
                PaymentMethodId = pm.PaymentMethodId,
                Type = pm.Type,
                Brand = pm.Card?.Brand ?? "",
                Last4 = pm.Card?.Last4 ?? "",
                // Note: Expiry details may not be available in basic PaymentMethod details
                // Stripe may require additional API calls to get full card details
                ExpiryMonth = 0, // Not available in basic PaymentMethod details
                ExpiryYear = 0,  // Not available in basic PaymentMethod details
                IsDefault = pm.IsDefault,
                CreatedAt = pm.CreatedAt
            }).ToList();

            return Ok(ApiResponse<List<CustomerPaymentMethodDto>>.SuccessResponse(
                customerPaymentMethods,
                $"Retrieved {customerPaymentMethods.Count} payment methods"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving customer payment methods");
            return StatusCode(StatusCodes.Status500InternalServerError,
                ApiResponse<object>.ErrorResponse(
                    "Failed to retrieve payment methods",
                    "An unexpected error occurred"));
        }
    }

    /// <summary>
    /// Test endpoint for verifying Stripe connectivity (development only).
    /// Helps verify that Stripe API is properly configured and accessible.
    /// </summary>
    [HttpGet("test-connection")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ApiResponse<object>>> TestStripeConnection()
    {
        // Only allow in development environment
        var environment = HttpContext.RequestServices.GetService<IWebHostEnvironment>();
        if (environment?.IsDevelopment() != true)
        {
            return NotFound(ApiResponse<object>.ErrorResponse(
                "Test endpoint not available",
                "Stripe test endpoint is only available in development environment"));
        }

        try
        {
            _logger.LogInformation("Testing Stripe API connectivity");

            // Test basic Stripe API connectivity by fetching account info
            var balanceService = new Stripe.BalanceService();
            var balance = await balanceService.GetAsync();

            var testResult = new
            {
                status = "connected",
                currency = balance.Available.FirstOrDefault()?.Currency ?? "usd",
                livemode = balance.Livemode,
                stripeVersion = "latest",
                timestamp = DateTime.UtcNow
            };

            _logger.LogInformation("Stripe API connectivity test successful, livemode: {Livemode}", balance.Livemode);

            return Ok(ApiResponse<object>.SuccessResponse(
                testResult,
                "Stripe connection test successful"));
        }
        catch (Stripe.StripeException ex)
        {
            _logger.LogError(ex, "Stripe API connectivity test failed: {Error}", ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError,
                ApiResponse<object>.ErrorResponse(
                    "Stripe connection failed",
                    $"Stripe API error: {ex.Message}"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during Stripe connectivity test");
            return StatusCode(StatusCodes.Status500InternalServerError,
                ApiResponse<object>.ErrorResponse(
                    "Connection test failed",
                    "An unexpected error occurred during connectivity test"));
        }
    }

    /// <summary>
    /// Test endpoint to verify RSA encryption/decryption setup.
    /// Uses configuration directly instead of database to avoid seeding issues.
    /// Only available in development environment for security.
    /// </summary>
    [HttpGet("test-encryption")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<object>>> TestEncryption()
    {
        // Only allow in development environment for security
        var environment = HttpContext.RequestServices.GetService<IWebHostEnvironment>();
        if (environment?.IsDevelopment() != true)
        {
            return NotFound(ApiResponse<object>.ErrorResponse(
                "Test endpoint not available",
                "Encryption test endpoint is only available in development environment"));
        }

        try
        {
            _logger.LogInformation("Testing RSA encryption/decryption setup");

            // Test data to encrypt/decrypt
            var testCardNumber = "4242424242424242";
            var testCvv = "123";

            // 1. Get public key from appsettings.json (NOT from database)
            var publicKeyPem = _configuration["PaymentEncryption:PublicKey"];
            if (string.IsNullOrEmpty(publicKeyPem))
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(
                    "Configuration error",
                    "Public key not found in appsettings.json PaymentEncryption:PublicKey"));
            }

            // 2. Get private key from environment variable or user secrets
            var privateKeyPem = Environment.GetEnvironmentVariable("PAYMENT_ENCRYPTION_PRIVATE_KEY")
                ?? _configuration["PaymentEncryption:PrivateKey"];

            if (string.IsNullOrEmpty(privateKeyPem))
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(
                    "Configuration error",
                    "Private key not found. Set PAYMENT_ENCRYPTION_PRIVATE_KEY environment variable or add to user secrets."));
            }

            // 3. Test encryption with public key (simulates frontend behavior)
            string encryptedCardNumber, encryptedCvv;
            using (var rsaPublic = RSA.Create())
            {
                rsaPublic.ImportFromPem(publicKeyPem);

                var cardNumberBytes = Encoding.UTF8.GetBytes(testCardNumber);
                var cvvBytes = Encoding.UTF8.GetBytes(testCvv);

                var encryptedCardBytes = rsaPublic.Encrypt(cardNumberBytes, RSAEncryptionPadding.OaepSHA256);
                var encryptedCvvBytes = rsaPublic.Encrypt(cvvBytes, RSAEncryptionPadding.OaepSHA256);

                encryptedCardNumber = Convert.ToBase64String(encryptedCardBytes);
                encryptedCvv = Convert.ToBase64String(encryptedCvvBytes);
            }

            // 4. Test decryption with private key (simulates backend behavior)
            string decryptedCardNumber, decryptedCvv;
            using (var rsaPrivate = RSA.Create())
            {
                rsaPrivate.ImportFromPem(privateKeyPem);

                var encryptedCardBytes = Convert.FromBase64String(encryptedCardNumber);
                var encryptedCvvBytes = Convert.FromBase64String(encryptedCvv);

                var decryptedCardBytes = rsaPrivate.Decrypt(encryptedCardBytes, RSAEncryptionPadding.OaepSHA256);
                var decryptedCvvBytes = rsaPrivate.Decrypt(encryptedCvvBytes, RSAEncryptionPadding.OaepSHA256);

                decryptedCardNumber = Encoding.UTF8.GetString(decryptedCardBytes);
                decryptedCvv = Encoding.UTF8.GetString(decryptedCvvBytes);
            }

            // 5. Verify results
            var cardNumberMatch = testCardNumber == decryptedCardNumber;
            var cvvMatch = testCvv == decryptedCvv;
            var overallSuccess = cardNumberMatch && cvvMatch;

            var testResult = new
            {
                success = overallSuccess,
                publicKeyConfigured = !string.IsNullOrEmpty(publicKeyPem),
                privateKeyConfigured = !string.IsNullOrEmpty(privateKeyPem),
                encryptionTest = new
                {
                    originalCardNumber = testCardNumber,
                    // Show partial for security: encryptedCardNumber = encryptedCardNumber[..20] + "...",
                    encryptedCardNumber = encryptedCardNumber,
                    decryptedCardNumber = decryptedCardNumber,
                    cardNumberMatch = cardNumberMatch
                },
                cvvTest = new
                {
                    originalCvv = testCvv,
                    // Show partial for security: encryptedCvv = encryptedCvv[..10] + "...", 
                    encryptedCvv = encryptedCvv,
                    decryptedCvv = decryptedCvv,
                    cvvMatch = cvvMatch
                },
                keyInfo = new
                {
                    publicKeyLength = publicKeyPem.Length,
                    privateKeyLength = privateKeyPem.Length,
                    publicKeyFormat = publicKeyPem.Contains("-----BEGIN") ? "Valid PEM" : "Invalid format",
                    privateKeyFormat = privateKeyPem.Contains("-----BEGIN") ? "Valid PEM" : "Invalid format",
                    privateKeySource = Environment.GetEnvironmentVariable("PAYMENT_ENCRYPTION_PRIVATE_KEY") != null ?
                        "Environment Variable" : "User Secrets/Configuration"
                },
                nextSteps = overallSuccess ? new[]
                {
                "✅ Encryption test passed!"

            } : new[]
                {
                "🔑 Verify private key is set correctly",
                "🔧 Check key format and matching"
            }
            };

            if (overallSuccess)
            {
                _logger.LogInformation("✅ RSA encryption test passed successfully");
                return Ok(ApiResponse<object>.SuccessResponse(
                    testResult,
                    "🎉 Encryption test completed successfully!"));
            }
            else
            {
                _logger.LogWarning("❌ RSA encryption test failed: CardMatch={CardMatch}, CvvMatch={CvvMatch}",
                    cardNumberMatch, cvvMatch);
                return BadRequest(ApiResponse<object>.ErrorResponse(
                    "Encryption test failed",
                    "The encryption/decryption process did not work correctly"));
            }
        }
        catch (CryptographicException ex)
        {
            _logger.LogError(ex, "Cryptographic error during encryption test");
            return BadRequest(ApiResponse<object>.ErrorResponse(
                "Encryption error",
                $"RSA encryption/decryption failed: {ex.Message}. Check that your keys are a matching pair."));
        }
        catch (FormatException ex)
        {
            _logger.LogError(ex, "Key format error during encryption test");
            return BadRequest(ApiResponse<object>.ErrorResponse(
                "Key format error",
                $"Invalid key format: {ex.Message}. Ensure keys have proper PEM headers."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during encryption test");
            return BadRequest(ApiResponse<object>.ErrorResponse(
                "Test failed",
                $"Unexpected error: {ex.Message}"));
        }
    }
}