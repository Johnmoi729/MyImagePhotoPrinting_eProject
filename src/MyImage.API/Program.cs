using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Serilog;
using MyImage.Infrastructure.Data;
using MyImage.Core.Interfaces.Repositories;
using MyImage.Core.Interfaces.Services;
using MyImage.Infrastructure.Data.Repositories;
using MyImage.Infrastructure.Services;
using MyImage.API.Middleware;
using MyImage.Core.Entities;
using MongoDB.Bson;

// Configure Serilog for structured logging throughout the application
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/myimage-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

try
{
    Log.Information("Starting MyImage Photo Printing API with Stripe Integration and Webhook Fixes");

    var builder = WebApplication.CreateBuilder(args);

    // Configure Serilog as the logging provider
    builder.Host.UseSerilog();

    // ============================================================================
    // SERVICE CONFIGURATION
    // ============================================================================

    // ADDED: Configure Kestrel server options for better webhook handling (Redundent)
    builder.WebHost.ConfigureKestrel(options =>
    {
        // Increase request timeout for webhook processing
        options.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(2);
        options.Limits.RequestHeadersTimeout = TimeSpan.FromMinutes(1);

        // Increase max request body size for webhook payloads
        options.Limits.MaxRequestBodySize = 32 * 1024 * 1024;

        Log.Information("Kestrel configured with enhanced limits for webhook processing");
    });

    // Add controllers with API configuration and custom error handling
    builder.Services.AddControllers()
        .ConfigureApiBehaviorOptions(options =>
        {
            // Customize model validation error responses to use our ApiResponse format
            options.InvalidModelStateResponseFactory = context =>
            {
                var errors = context.ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();

                var response = MyImage.Core.DTOs.Common.ApiResponse<object>.ErrorResponse(
                    "Validation failed", errors);

                return new Microsoft.AspNetCore.Mvc.BadRequestObjectResult(response);
            };
        });

    // ============================================================================
    // ENHANCED CORS CONFIGURATION FOR WEBHOOK AND FRONTEND SUPPORT
    // ============================================================================

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowFrontend", policy =>
        {
            // Development origins - includes Angular dev server default port
            var allowedOrigins = new[]
            {
                "http://localhost:4200",   // Angular dev server HTTP (primary)
                "https://localhost:4200",  // Angular dev server HTTPS (if configured)
                "http://localhost:3000",   // Alternative dev port (for flexibility)
                "http://localhost:5159",   // API HTTP port (for API testing)
                "https://localhost:7037"   // API HTTPS port (for API testing)
            };

            Log.Information("Configuring CORS for direct frontend communication with origins: {Origins}",
                string.Join(", ", allowedOrigins));

            policy.WithOrigins(allowedOrigins)
                  .AllowAnyMethod()         // Allow GET, POST, PUT, DELETE, etc.
                  .AllowAnyHeader()         // Allow Authorization, Content-Type, etc.
                  .AllowCredentials()       // Required for cookies and auth headers
                  .SetPreflightMaxAge(TimeSpan.FromMinutes(30)) // Cache preflight requests for performance
                  .SetIsOriginAllowed(origin =>
                  {
                      // Enhanced origin checking with detailed logging for debugging
                      var isAllowed = allowedOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase) ||
                                      (builder.Environment.IsDevelopment() &&
                                       origin != null &&
                                       (origin.StartsWith("http://localhost:", StringComparison.OrdinalIgnoreCase) ||
                                        origin.StartsWith("https://localhost:", StringComparison.OrdinalIgnoreCase)));

                      Log.Debug("CORS origin check: '{Origin}' -> {IsAllowed}", origin ?? "null", isAllowed);
                      return isAllowed;
                  });
        });

        // ADDED: Special CORS policy for Stripe webhooks
        options.AddPolicy("AllowStripe", policy =>
        {
            policy.AllowAnyOrigin()  // Stripe webhooks can come from any Stripe IP
                  .WithMethods("POST") // Webhooks only use POST
                  .WithHeaders("stripe-signature", "content-type") // Only required headers
                  .SetPreflightMaxAge(TimeSpan.FromHours(1)); // Cache longer for webhooks
        });

        // Add a completely permissive policy for development debugging
        if (builder.Environment.IsDevelopment())
        {
            options.AddPolicy("DevelopmentDebug", policy =>
            {
                policy.AllowAnyOrigin()
                      .AllowAnyMethod()
                      .AllowAnyHeader();
                Log.Information("Created permissive CORS policy for development debugging");
            });
        }
    });

    // ============================================================================
    // DATABASE CONFIGURATION
    // ============================================================================

    // Register MongoDB context as singleton (connection pooling handled by MongoDB driver)
    builder.Services.AddSingleton<MongoDbContext>();

    // Register repositories as scoped services (per-request lifecycle for better transaction consistency)
    builder.Services.AddScoped<IUserRepository, UserRepository>();
    builder.Services.AddScoped<IPhotoRepository, PhotoRepository>();
    builder.Services.AddScoped<IPrintSizeRepository, PrintSizeRepository>();
    builder.Services.AddScoped<IShoppingCartRepository, ShoppingCartRepository>();
    builder.Services.AddScoped<IOrderRepository, OrderRepository>();
    builder.Services.AddScoped<ISystemSettingsRepository, SystemSettingsRepository>();

    // ============================================================================
    // BUSINESS SERVICES CONFIGURATION WITH STRIPE INTEGRATION
    // ============================================================================

    // Register business services as scoped (per-request lifecycle)
    builder.Services.AddScoped<IAuthService, AuthService>();
    builder.Services.AddScoped<IGridFsStorageService, GridFsStorageService>();
    builder.Services.AddScoped<IImageProcessingService, ImageProcessingService>();

    // ADDED: Register Stripe payment service for credit card processing
    builder.Services.AddScoped<IStripePaymentService, StripePaymentService>();

    // ============================================================================
    // STRIPE CONFIGURATION VALIDATION
    // ============================================================================

    // Validate Stripe configuration at startup
    var stripeConfig = builder.Configuration.GetSection("Stripe");
    var stripeSecretKey = stripeConfig["SecretKey"];
    var stripeWebhookSecret = stripeConfig["WebhookSecret"];

    if (string.IsNullOrEmpty(stripeSecretKey))
    {
        Log.Fatal("Stripe SecretKey not configured in appsettings.json");
        throw new InvalidOperationException("Stripe SecretKey is required for payment processing");
    }

    if (string.IsNullOrEmpty(stripeWebhookSecret))
    {
        Log.Warning("Stripe WebhookSecret not configured - webhook processing will be disabled");
    }

    Log.Information("Stripe configuration validated successfully");

    // ============================================================================
    // AUTHENTICATION AND AUTHORIZATION CONFIGURATION
    // ============================================================================

    // Configure JWT authentication with comprehensive security settings
    var jwtSettings = builder.Configuration.GetSection("JwtSettings");
    var jwtSecret = jwtSettings["Secret"] ?? throw new InvalidOperationException("JWT Secret not configured");
    var jwtIssuer = jwtSettings["Issuer"] ?? throw new InvalidOperationException("JWT Issuer not configured");
    var jwtAudience = jwtSettings["Audience"] ?? throw new InvalidOperationException("JWT Audience not configured");

    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment(); // Allow HTTP in development only
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(5), // Allow 5 minutes clock skew for server time differences
            RequireExpirationTime = true
        };

        // Enhanced logging for authentication events to aid in debugging
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Log.Warning("JWT authentication failed for {Path}: {Error}",
                    context.HttpContext.Request.Path, context.Exception.Message);
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                var userId = context.Principal?.FindFirst("user_id")?.Value ?? "unknown";
                Log.Debug("JWT token validated for user: {UserId}", userId);
                return Task.CompletedTask;
            }
        };
    });

    // Configure authorization policies for role-based access control
    builder.Services.AddAuthorization(options =>
    {
        // Admin policy requires admin role for administrative endpoints
        options.AddPolicy("AdminOnly", policy =>
            policy.RequireRole("admin"));

        // Customer policy for customer-specific operations
        options.AddPolicy("CustomerOnly", policy =>
            policy.RequireRole("customer"));
    });

    // ============================================================================
    // API DOCUMENTATION CONFIGURATION WITH STRIPE ENDPOINTS
    // ============================================================================

    // Add API documentation with Swagger/OpenAPI for development
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
        {
            Title = "MyImage Photo Printing API with Stripe Integration",
            Version = "v1",
            Description = "API for photo printing service with user management, photo upload, cart, order processing, and Stripe payment integration",
            Contact = new Microsoft.OpenApi.Models.OpenApiContact
            {
                Name = "MyImage Development Team",
                Email = "dev@myimage.com"
            }
        });

        // Configure JWT authentication in Swagger UI for testing
        options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
            Scheme = "Bearer",
            BearerFormat = "JWT",
            In = Microsoft.OpenApi.Models.ParameterLocation.Header,
            Description = "Enter 'Bearer' followed by a space and your JWT token"
        });

        options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
        {
            {
                new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                {
                    Reference = new Microsoft.OpenApi.Models.OpenApiReference
                    {
                        Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                Array.Empty<string>()
            }
        });

        // Include XML documentation if available for better API docs
        var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
        var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
        if (File.Exists(xmlPath))
        {
            options.IncludeXmlComments(xmlPath);
        }
    });

    // ============================================================================
    // ADDITIONAL SERVICES
    // ============================================================================

    // Add health checks for monitoring and load balancer integration
    builder.Services.AddHealthChecks()
        .AddCheck<DatabaseHealthCheck>("database")
        .AddCheck<StripeHealthCheck>("stripe"); // ADDED: Stripe health check

    // Configure HTTP client for external services
    builder.Services.AddHttpClient();

    // Add memory caching for performance optimization
    builder.Services.AddMemoryCache();

    // ============================================================================
    // BUILD APPLICATION
    // ============================================================================

    var app = builder.Build();

    // ============================================================================
    // ENHANCED MIDDLEWARE PIPELINE CONFIGURATION (ORDER IS CRITICAL)
    // ============================================================================

    // FIXED: Special handling for Stripe webhooks BEFORE other middleware
    app.UseWhen(context => context.Request.Path.StartsWithSegments("/api/stripe/webhook"), appBuilder =>
    {
        // For webhook requests, use minimal middleware to avoid interference
        appBuilder.UseRouting();
        appBuilder.UseCors("AllowStripe"); // Use webhook-specific CORS policy
        appBuilder.UseEndpoints(endpoints =>
        {
            endpoints.MapControllers();
        });

        Log.Information("Configured special middleware pipeline for Stripe webhooks");
    });

    // Global error handling (must be first to catch all exceptions) - but exclude webhooks
    app.UseWhen(context => !context.Request.Path.StartsWithSegments("/api/stripe/webhook"), appBuilder =>
    {
        appBuilder.UseMiddleware<ErrorHandlingMiddleware>();
    });

    // Request logging for monitoring (early in pipeline for complete request tracking) - but exclude webhooks
    app.UseWhen(context => !context.Request.Path.StartsWithSegments("/api/stripe/webhook"), appBuilder =>
    {
        appBuilder.UseMiddleware<RequestLoggingMiddleware>();
    });

    // ============================================================================
    // ENHANCED DEVELOPMENT AND PRODUCTION MIDDLEWARE CONFIGURATION
    // ============================================================================

    if (app.Environment.IsDevelopment())
    {
        // Enable Swagger UI in development
        app.UseSwagger();
        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/swagger/v1/swagger.json", "MyImage API v1");
            options.RoutePrefix = "swagger";
            options.DocumentTitle = "MyImage Photo Printing API with Stripe";
        });

        // Detailed error pages
        app.UseDeveloperExceptionPage();

        // Use the frontend-friendly CORS policy in development
        app.UseCors("AllowFrontend");

        Log.Information("Development mode: Using direct frontend CORS policy");
        Log.Information("Frontend should connect to: https://localhost:7037/api");
        Log.Information("HTTPS redirection disabled for easier local development");
        Log.Information("Stripe webhook endpoint: https://localhost:7037/api/stripe/webhook");
        Log.Information("Stripe webhook debug endpoint: https://localhost:7037/api/stripe/webhook/debug");
    }
    else
    {
        // Production settings
        app.UseHsts();
        app.UseHttpsRedirection();
        app.UseCors("AllowFrontend"); // Use same policy but with production origins
    }

    // ============================================================================
    // ENHANCED REQUEST/RESPONSE LOGGING FOR DEBUGGING WEBHOOK ISSUES
    // ============================================================================

    // This middleware provides detailed logging to help debug webhook and other API issues
    app.Use(async (context, next) =>
    {
        var isWebhook = context.Request.Path.StartsWithSegments("/api/stripe/webhook");

        if (app.Environment.IsDevelopment())
        {
            var origin = context.Request.Headers["Origin"].FirstOrDefault();
            var method = context.Request.Method;
            var path = context.Request.Path;

            // Special logging for webhook requests
            if (isWebhook)
            {
                Log.Information("🎯 Webhook request: {Method} {Path} from {RemoteIp}, Content-Length: {ContentLength}, Content-Type: {ContentType}",
                    method, path,
                    context.Connection.RemoteIpAddress,
                    context.Request.ContentLength,
                    context.Request.ContentType);

                // Log Stripe signature for debugging
                if (context.Request.Headers.ContainsKey("Stripe-Signature"))
                {
                    var signature = context.Request.Headers["Stripe-Signature"].FirstOrDefault();
                    Log.Information("🎯 Webhook Stripe-Signature header present: {SignatureLength} chars",
                        signature?.Length ?? 0);
                }
                else
                {
                    Log.Warning("🎯 Webhook missing Stripe-Signature header");
                }
            }
            else
            {
                Log.Debug("Incoming request: {Method} {Path} from origin: {Origin}",
                    method, path, origin ?? "No Origin");

                // Log preflight (OPTIONS) requests separately for debugging
                if (method == "OPTIONS")
                {
                    Log.Debug("CORS preflight request detected for {Path}", path);
                }

                if (context.Request.Headers.ContainsKey("Authorization"))
                {
                    var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
                    Log.Debug("Authorization header present: {HasBearer}",
                        authHeader?.StartsWith("Bearer ") == true ? "Yes (Bearer token)" : "Yes (Other)");
                }
            }
        }

        await next();

        if (app.Environment.IsDevelopment())
        {
            if (isWebhook)
            {
                Log.Information("🎯 Webhook response: {StatusCode} for {Method} {Path}",
                    context.Response.StatusCode,
                    context.Request.Method,
                    context.Request.Path);
            }
            else
            {
                Log.Debug("Response: {StatusCode} for {Method} {Path}",
                    context.Response.StatusCode,
                    context.Request.Method,
                    context.Request.Path);

                // Log CORS-related response headers for debugging
                if (context.Response.Headers.ContainsKey("Access-Control-Allow-Origin"))
                {
                    var allowOrigin = context.Response.Headers["Access-Control-Allow-Origin"].FirstOrDefault();
                    Log.Debug("CORS response header: Access-Control-Allow-Origin = {AllowOrigin}", allowOrigin);
                }
            }
        }
    });

    // ============================================================================
    // AUTHENTICATION AND AUTHORIZATION MIDDLEWARE (AFTER CORS, EXCLUDE WEBHOOKS)
    // ============================================================================

    // Authentication and authorization (after CORS to handle preflight requests properly)
    // FIXED: Exclude webhook endpoints from authentication middleware
    app.UseWhen(context => !context.Request.Path.StartsWithSegments("/api/stripe/webhook"), appBuilder =>
    {
        appBuilder.UseAuthentication(); // JWT token validation
        appBuilder.UseAuthorization(); // Role-based access control
    });

    // Controller routing
    app.MapControllers();

    // Health check endpoint for monitoring systems
    app.MapHealthChecks("/health");

    // ============================================================================
    // DATABASE INITIALIZATION AND SEEDING WITH STRIPE CONFIGURATION
    // ============================================================================

    // Initialize database and seed essential data including Stripe configuration
    await InitializeDatabaseAsync(app.Services);

    // ============================================================================
    // START APPLICATION
    // ============================================================================

    Log.Information("MyImage API starting on {Environment} environment with Stripe integration and webhook fixes", app.Environment.EnvironmentName);
    Log.Information("API documentation available at: /swagger (development only)");
    Log.Information("Health check available at: /health");
    Log.Information("Stripe webhook endpoint: /api/stripe/webhook");
    Log.Information("Stripe webhook health check: /api/stripe/webhook/health");

    if (app.Environment.IsDevelopment())
    {
        Log.Information("Stripe webhook debug endpoint: /api/stripe/webhook/debug");
        Log.Information("🔧 Webhook troubleshooting enabled with enhanced logging");
    }

    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    await Log.CloseAndFlushAsync();
}

/// <summary>
/// Initialize database connection and seed initial data with Stripe configuration.
/// This method ensures the database is ready and contains essential startup data.
/// </summary>
/// <param name="services">Service provider for dependency injection</param>
/// <returns>Task representing the asynchronous initialization</returns>
static async Task InitializeDatabaseAsync(IServiceProvider services)
{
    try
    {
        Log.Information("Initializing database with Stripe configuration...");

        using var scope = services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<MongoDbContext>();

        // Test database connectivity before proceeding
        var isConnected = await context.TestConnectionAsync();
        if (!isConnected)
        {
            throw new InvalidOperationException("Unable to connect to MongoDB database");
        }

        Log.Information("Database connection established successfully");

        // Seed initial data required for application operation
        await SeedInitialDataAsync(scope.ServiceProvider);

        Log.Information("Database initialization completed successfully");
    }
    catch (Exception ex)
    {
        Log.Fatal(ex, "Failed to initialize database");
        throw;
    }
}

/// <summary>
/// Seed initial data required for application operation including Stripe configuration.
/// Creates default print sizes, admin user, system settings, and Stripe webhook configuration.
/// FIXED: Uses simplified admin creation approach with proper error handling.
/// </summary>
/// <param name="serviceProvider">Service provider for accessing repositories</param>
/// <returns>Task representing the asynchronous seeding</returns>
static async Task SeedInitialDataAsync(IServiceProvider serviceProvider)
{
    try
    {
        Log.Information("🌱 Starting initial data seeding with Stripe configuration...");

        var printSizeRepo = serviceProvider.GetRequiredService<IPrintSizeRepository>();
        var userRepo = serviceProvider.GetRequiredService<IUserRepository>();
        var settingsRepo = serviceProvider.GetRequiredService<ISystemSettingsRepository>();
        var authService = serviceProvider.GetRequiredService<IAuthService>();
        var configuration = serviceProvider.GetRequiredService<IConfiguration>();

        // 1. Seed print sizes if none exist
        var existingPrintSizes = await printSizeRepo.GetAllAsync();
        if (existingPrintSizes.Count == 0)
        {
            Log.Information("📏 Seeding default print sizes...");

            var defaultPrintSizes = new[]
            {
                new PrintSize
                {
                    SizeCode = "4x6",
                    DisplayName = "Standard 4×6",
                    Dimensions = new PrintDimensions
                    {
                        Width = 4, Height = 6, Unit = "inches",
                        PixelRequirements = new PixelRequirements
                        {
                            MinWidth = 1200, MinHeight = 1800,
                            RecommendedWidth = 2400, RecommendedHeight = 3600
                        }
                    },
                    Pricing = new PrintPricing { BasePrice = 0.29m, Currency = "USD", UpdatedBy = "system" },
                    Metadata = new PrintSizeMetadata { IsActive = true, SortOrder = 1 }
                },
                new PrintSize
                {
                    SizeCode = "5x7",
                    DisplayName = "Classic 5×7",
                    Dimensions = new PrintDimensions
                    {
                        Width = 5, Height = 7, Unit = "inches",
                        PixelRequirements = new PixelRequirements
                        {
                            MinWidth = 1500, MinHeight = 2100,
                            RecommendedWidth = 3000, RecommendedHeight = 4200
                        }
                    },
                    Pricing = new PrintPricing { BasePrice = 0.49m, Currency = "USD", UpdatedBy = "system" },
                    Metadata = new PrintSizeMetadata { IsActive = true, SortOrder = 2 }
                },
                new PrintSize
                {
                    SizeCode = "8x10",
                    DisplayName = "Large 8×10",
                    Dimensions = new PrintDimensions
                    {
                        Width = 8, Height = 10, Unit = "inches",
                        PixelRequirements = new PixelRequirements
                        {
                            MinWidth = 2400, MinHeight = 3000,
                            RecommendedWidth = 4800, RecommendedHeight = 6000
                        }
                    },
                    Pricing = new PrintPricing { BasePrice = 2.99m, Currency = "USD", UpdatedBy = "system" },
                    Metadata = new PrintSizeMetadata { IsActive = true, SortOrder = 3 }
                }
            };

            foreach (var printSize in defaultPrintSizes)
            {
                await printSizeRepo.CreateAsync(printSize);
            }

            Log.Information("✅ Seeded {Count} default print sizes", defaultPrintSizes.Length);
        }
        else
        {
            Log.Information("📏 Print sizes already exist ({Count} found), skipping seeding", existingPrintSizes.Count);
        }

        // 2. FIXED: Create default admin user with proper password handling
        Log.Information("👤 Processing admin user creation...");
        await CreateDefaultAdminUser(userRepo, authService);
        Log.Information("✅ Admin user processing completed");

        // 3. Seed system settings with Stripe configuration
        Log.Information("⚙️ Processing system settings...");
        await SeedSystemSettingsAsync(settingsRepo, configuration);
        Log.Information("✅ System settings processing completed");

        Log.Information("🎉 Initial data seeding completed successfully!");
    }
    catch (Exception ex)
    {
        Log.Error(ex, "❌ Failed to seed initial data: {Error}", ex.Message);
        throw;
    }
}

// ROBUST FIX: Admin user creation with detailed debugging and validation
// Replace the CreateDefaultAdminUser method in your Program.cs with this:

/// <summary>
/// Create default admin user with robust password hashing and detailed validation.
/// This version includes extensive debugging to identify and fix password hash issues.
/// </summary>
/// <param name="userRepo">User repository for database operations</param>
/// <param name="authService">Authentication service for user registration</param>
/// <returns>Task representing the asynchronous user creation</returns>
static async Task CreateDefaultAdminUser(IUserRepository userRepo, IAuthService authService)
{
    var adminEmail = "admin@myimage.com";
    var defaultPassword = "Admin123!@#";

    try
    {
        Log.Information("🔍 Starting admin user creation/verification process...");

        // Step 1: Check if admin user already exists
        var existingAdmin = await userRepo.GetByEmailAsync(adminEmail);
        if (existingAdmin != null)
        {
            Log.Information("👤 Admin user already exists: {UserId} ({Email})", existingAdmin.UserId, adminEmail);
            Log.Information("🔍 Existing password hash: {HashInfo}",
                string.IsNullOrEmpty(existingAdmin.PasswordHash) ? "EMPTY/NULL" : $"Length: {existingAdmin.PasswordHash.Length}");

            // Check if password hash is valid
            if (string.IsNullOrEmpty(existingAdmin.PasswordHash) || existingAdmin.PasswordHash.Length < 20)
            {
                Log.Warning("❌ Admin user has invalid password hash, fixing...");
                await FixAdminPassword(userRepo, existingAdmin, defaultPassword);
                return;
            }
            else
            {
                // Test existing password
                Log.Information("🧪 Testing existing admin password...");
                try
                {
                    var passwordWorksTest = BCrypt.Net.BCrypt.Verify(defaultPassword, existingAdmin.PasswordHash);
                    if (passwordWorksTest)
                    {
                        Log.Information("✅ Existing admin password is working correctly");
                        await EnsureAdminRole(userRepo, existingAdmin);
                        return;
                    }
                    else
                    {
                        Log.Warning("❌ Existing admin password doesn't match default, fixing...");
                        await FixAdminPassword(userRepo, existingAdmin, defaultPassword);
                        return;
                    }
                }
                catch (Exception ex)
                {
                    Log.Error(ex, "❌ Error testing existing password, fixing...");
                    await FixAdminPassword(userRepo, existingAdmin, defaultPassword);
                    return;
                }
            }
        }

        Log.Information("👤 No existing admin user found, creating new one...");

        // Step 2: Create new admin user using manual creation (bypass AuthService issues)
        await CreateNewAdminUser(userRepo, adminEmail, defaultPassword);

    }
    catch (Exception ex)
    {
        Log.Error(ex, "❌ Failed in admin user creation process: {Error}", ex.Message);
        throw;
    }
}

/// <summary>
/// Fix admin password with robust hashing and verification
/// </summary>
static async Task FixAdminPassword(IUserRepository userRepo, User adminUser, string password)
{
    try
    {
        Log.Information("🔧 Fixing admin password...");

        // Generate a robust password hash
        var salt = BCrypt.Net.BCrypt.GenerateSalt(12);
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(password, salt);

        Log.Information("🔍 Generated new hash - Salt length: {SaltLength}, Hash length: {HashLength}",
            salt.Length, hashedPassword.Length);
        Log.Information("🔍 Hash preview: {HashPreview}...", hashedPassword.Substring(0, Math.Min(20, hashedPassword.Length)));

        // Update the user
        adminUser.PasswordHash = hashedPassword;
        adminUser.Metadata.UpdatedAt = DateTime.UtcNow;

        // Ensure role is admin
        if (adminUser.Role != "admin")
        {
            adminUser.Role = "admin";
            Log.Information("🔧 Set role to admin");
        }

        await userRepo.UpdateAsync(adminUser);
        Log.Information("💾 Updated admin user in database");

        // Verify the fix worked
        var updatedUser = await userRepo.GetByEmailAsync(adminUser.Email);
        if (updatedUser != null && !string.IsNullOrEmpty(updatedUser.PasswordHash))
        {
            Log.Information("✅ Password fix verification - Hash length: {Length}", updatedUser.PasswordHash.Length);

            // Test the password
            var testResult = BCrypt.Net.BCrypt.Verify(password, updatedUser.PasswordHash);
            if (testResult)
            {
                Log.Information("✅ Password verification test PASSED after fix");
            }
            else
            {
                Log.Error("❌ Password verification test FAILED after fix");
            }
        }
        else
        {
            Log.Error("❌ Failed to verify password fix - user not found or hash still empty");
        }

    }
    catch (Exception ex)
    {
        Log.Error(ex, "❌ Failed to fix admin password: {Error}", ex.Message);
        throw;
    }
}

/// <summary>
/// Ensure user has admin role
/// </summary>
static async Task EnsureAdminRole(IUserRepository userRepo, User user)
{
    if (user.Role != "admin")
    {
        Log.Information("🔧 Updating user role to admin");
        user.Role = "admin";
        await userRepo.UpdateAsync(user);
        Log.Information("✅ User role updated to admin");
    }
    else
    {
        Log.Information("✅ User already has admin role");
    }
}

/// <summary>
/// Create new admin user manually with robust password handling
/// </summary>
static async Task CreateNewAdminUser(IUserRepository userRepo, string email, string password)
{
    try
    {
        Log.Information("👤 Creating new admin user manually...");

        // Generate User ID
        var userId = await userRepo.GenerateNextUserIdAsync();
        Log.Information("🆔 Generated User ID: {UserId}", userId);

        // Generate robust password hash
        var salt = BCrypt.Net.BCrypt.GenerateSalt(12);
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(password, salt);

        Log.Information("🔐 Generated password hash - Length: {Length}", hashedPassword.Length);
        Log.Information("🔍 Hash preview: {HashPreview}...", hashedPassword.Substring(0, Math.Min(20, hashedPassword.Length)));

        // Create user entity
        var adminUser = new User
        {
            Id = ObjectId.GenerateNewId(),
            UserId = userId,
            Email = email,
            PasswordHash = hashedPassword,
            Profile = new UserProfile
            {
                FirstName = "System",
                LastName = "Administrator"
            },
            Role = "admin",
            Stats = new UserStats
            {
                TotalOrders = 0,
                TotalPhotosUploaded = 0,
                TotalSpent = 0.00m
            },
            Metadata = new UserMetadata
            {
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true,
                LastLoginAt = null
            }
        };

        // Save to database
        await userRepo.CreateAsync(adminUser);
        Log.Information("💾 Created admin user in database");

        // Verify creation
        var createdUser = await userRepo.GetByEmailAsync(email);
        if (createdUser != null && !string.IsNullOrEmpty(createdUser.PasswordHash))
        {
            Log.Information("✅ Admin user creation verified - User ID: {UserId}, Hash length: {Length}",
                createdUser.UserId, createdUser.PasswordHash.Length);

            // Test the password
            var testResult = BCrypt.Net.BCrypt.Verify(password, createdUser.PasswordHash);
            if (testResult)
            {
                Log.Information("✅ Password verification test PASSED for new admin");
                Log.Warning("📝 Admin credentials - Email: {Email}, Password: {Password}", email, password);
                Log.Warning("🔒 CHANGE ADMIN PASSWORD IMMEDIATELY IN PRODUCTION");
            }
            else
            {
                Log.Error("❌ Password verification test FAILED for new admin");
            }
        }
        else
        {
            Log.Error("❌ Failed to verify admin user creation");
        }

    }
    catch (Exception ex)
    {
        Log.Error(ex, "❌ Failed to create new admin user: {Error}", ex.Message);
        throw;
    }
}

/// <summary>
/// Seed system settings with default configuration values including Stripe settings.
/// Creates tax rates, branch locations, Stripe configuration, and other system configuration.
/// Now properly handles MongoDB _id field immutability by checking for existence first.
/// </summary>
/// <param name="settingsRepo">System settings repository</param>
/// <param name="configuration">Application configuration for Stripe settings</param>
/// <returns>Task representing the asynchronous seeding</returns>
static async Task SeedSystemSettingsAsync(ISystemSettingsRepository settingsRepo, IConfiguration configuration)
{
    Log.Information("Seeding system settings with Stripe configuration...");

    try
    {
        // Seed existing settings (tax rates, branch locations, etc.)
        await SeedExistingSettings(settingsRepo);

        // ADDED: Seed Stripe configuration
        await SeedStripeSettings(settingsRepo, configuration);

        Log.Information("System settings seeding completed successfully");
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Failed to seed system settings: {Error}", ex.Message);
        throw;
    }
}

/// <summary>
/// Seed existing system settings (tax rates, branch locations, etc.)
/// </summary>
static async Task SeedExistingSettings(ISystemSettingsRepository settingsRepo)
{
    // Check if tax rates setting already exists before creating
    var existingTaxRates = await settingsRepo.GetByKeyAsync("tax_rates");
    if (existingTaxRates == null)
    {
        var taxRatesSetting = new SystemSettings
        {
            Key = "tax_rates",
            Value = new BsonDocument
            {
                ["default"] = 0.0625, // 6.25% default rate
                ["byState"] = new BsonDocument
                {
                    ["MA"] = 0.0625, // Massachusetts
                    ["NH"] = 0.0000, // New Hampshire (no sales tax)
                    ["CT"] = 0.0635, // Connecticut
                    ["RI"] = 0.0700, // Rhode Island
                    ["VT"] = 0.0600, // Vermont
                    ["NY"] = 0.0800  // New York
                }
            },
            Metadata = new SettingMetadata
            {
                Description = "Sales tax rates by state for order calculations",
                UpdatedBy = "system",
                LastUpdated = DateTime.UtcNow
            }
        };

        await settingsRepo.UpsertAsync(taxRatesSetting);
        Log.Information("Seeded tax rates setting");
    }

    // Check if branch locations setting already exists before creating
    var existingBranchLocations = await settingsRepo.GetByKeyAsync("branch_locations");
    if (existingBranchLocations == null)
    {
        var branchLocationsSetting = new SystemSettings
        {
            Key = "branch_locations",
            Value = new BsonDocument
            {
                ["locations"] = new BsonArray
                {
                    new BsonDocument
                    {
                        ["name"] = "Boston Downtown",
                        ["address"] = "123 Main Street, Boston, MA 02101",
                        ["phone"] = "+1-617-555-0100",
                        ["hours"] = "Mon-Fri 9AM-6PM, Sat 10AM-4PM"
                    },
                    new BsonDocument
                    {
                        ["name"] = "Cambridge Center",
                        ["address"] = "456 Tech Boulevard, Cambridge, MA 02139",
                        ["phone"] = "+1-617-555-0200",
                        ["hours"] = "Mon-Fri 9AM-6PM, Sat 10AM-4PM"
                    }
                }
            },
            Metadata = new SettingMetadata
            {
                Description = "Branch locations for in-person payment option",
                UpdatedBy = "system",
                LastUpdated = DateTime.UtcNow
            }
        };

        await settingsRepo.UpsertAsync(branchLocationsSetting);
        Log.Information("Seeded branch locations setting");
    }

    // Photo cleanup settings
    var existingCleanupSettings = await settingsRepo.GetByKeyAsync("photo_cleanup_settings");
    if (existingCleanupSettings == null)
    {
        var cleanupSettings = new SystemSettings
        {
            Key = "photo_cleanup_settings",
            Value = new BsonDocument
            {
                ["retentionDays"] = 7, // Keep photos 7 days after order completion
                ["cleanupSchedule"] = "daily", // Run cleanup daily
                ["bufferDays"] = 3 // Additional buffer for customer service
            },
            Metadata = new SettingMetadata
            {
                Description = "Photo cleanup schedule and retention policies",
                UpdatedBy = "system",
                LastUpdated = DateTime.UtcNow
            }
        };

        await settingsRepo.UpsertAsync(cleanupSettings);
        Log.Information("Seeded photo cleanup settings");
    }
}

/// <summary>
/// ADDED: Seed Stripe-specific system settings
/// </summary>
static async Task SeedStripeSettings(ISystemSettingsRepository settingsRepo, IConfiguration configuration)
{
    // Stripe configuration settings
    var existingStripeConfig = await settingsRepo.GetByKeyAsync("stripe_configuration");
    if (existingStripeConfig == null)
    {
        var stripeConfig = configuration.GetSection("Stripe");

        var stripeSettings = new SystemSettings
        {
            Key = "stripe_configuration",
            Value = new BsonDocument
            {
                ["publishable_key"] = stripeConfig["PublishableKey"] ?? "",
                ["webhook_endpoints"] = new BsonArray
                {
                    new BsonDocument
                    {
                        ["url"] = "/api/stripe/webhook",
                        ["events"] = new BsonArray
                        {
                            "payment_intent.succeeded",
                            "payment_intent.payment_failed",
                            "payment_intent.canceled",
                            "payment_intent.requires_action"
                        }
                    }
                },
                ["return_url"] = stripeConfig["ReturnUrl"] ?? "",
                ["cancel_url"] = stripeConfig["CancelUrl"] ?? "",
                ["processing_fee_rate"] = 0.029, // 2.9%
                ["processing_fee_fixed"] = 0.30  // 30 cents
            },
            Metadata = new SettingMetadata
            {
                Description = "Stripe payment processing configuration and webhook settings",
                UpdatedBy = "system",
                LastUpdated = DateTime.UtcNow
            }
        };

        await settingsRepo.UpsertAsync(stripeSettings);
        Log.Information("Seeded Stripe configuration settings");
    }

    // Payment processing settings
    var existingPaymentSettings = await settingsRepo.GetByKeyAsync("payment_processing");
    if (existingPaymentSettings == null)
    {
        var paymentSettings = new SystemSettings
        {
            Key = "payment_processing",
            Value = new BsonDocument
            {
                ["enabled_methods"] = new BsonArray { "credit_card", "branch_payment" },
                ["credit_card_processor"] = "stripe",
                ["require_cvv"] = true,
                ["require_postal_code"] = true,
                ["enable_3d_secure"] = true,
                ["auto_capture"] = true,
                ["refund_policy_days"] = 30
            },
            Metadata = new SettingMetadata
            {
                Description = "Payment processing configuration and security settings",
                UpdatedBy = "system",
                LastUpdated = DateTime.UtcNow
            }
        };

        await settingsRepo.UpsertAsync(paymentSettings);
        Log.Information("Seeded payment processing settings");
    }
}

/// <summary>
/// Health check implementation for database connectivity monitoring.
/// Used by load balancers and monitoring systems to verify service health.
/// </summary>
public class DatabaseHealthCheck : Microsoft.Extensions.Diagnostics.HealthChecks.IHealthCheck
{
    private readonly MongoDbContext _context;

    public DatabaseHealthCheck(MongoDbContext context)
    {
        _context = context;
    }

    public async Task<Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult> CheckHealthAsync(
        Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var isConnected = await _context.TestConnectionAsync();

            if (isConnected)
            {
                return Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy("Database connection is healthy");
            }
            else
            {
                return Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Unhealthy("Unable to connect to database");
            }
        }
        catch (Exception ex)
        {
            return Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Unhealthy("Database health check failed", ex);
        }
    }
}

/// <summary>
/// ADDED: Health check implementation for Stripe connectivity monitoring.
/// Verifies that Stripe API is accessible and properly configured.
/// </summary>
public class StripeHealthCheck : Microsoft.Extensions.Diagnostics.HealthChecks.IHealthCheck
{
    private readonly IConfiguration _configuration;

    public StripeHealthCheck(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task<Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult> CheckHealthAsync(
        Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var stripeSecretKey = _configuration["Stripe:SecretKey"];
            if (string.IsNullOrEmpty(stripeSecretKey))
            {
                return Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Unhealthy("Stripe SecretKey not configured");
            }

            // Basic Stripe API connectivity test
            Stripe.StripeConfiguration.ApiKey = stripeSecretKey;
            var balanceService = new Stripe.BalanceService();

            // This will throw if API key is invalid or Stripe is unreachable
            await balanceService.GetAsync(cancellationToken: cancellationToken);

            return Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy("Stripe API is accessible");
        }
        catch (Stripe.StripeException ex)
        {
            return Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Unhealthy($"Stripe API error: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            return Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Unhealthy("Stripe health check failed", ex);
        }
    }
}

