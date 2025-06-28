using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MongoDB.Bson;
using System.Security.Claims;
using MyImage.Core.Interfaces.Repositories;
using MyImage.Core.DTOs.Admin;
using MyImage.Core.DTOs.PrintSizes;
using MyImage.Core.DTOs.Common;
using MyImage.Core.Entities;
using System.Security.Claims;

namespace MyImage.API.Controllers.Admin;

/// <summary>
/// Admin controller handling administrative functions.
/// This controller implements Requirements 9 and 11 for admin order processing and price management.
/// 
/// Key features:
/// - Order management and status updates
/// - Payment verification workflow
/// - Print size and pricing management
/// - Dashboard statistics
/// - Order completion and photo cleanup
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "admin")] // Only admin users can access these endpoints
[Produces("application/json")]
public class AdminController : ControllerBase
{
    private readonly IOrderRepository _orderRepository;
    private readonly IPrintSizeRepository _printSizeRepository;
    private readonly IPhotoRepository _photoRepository;
    private readonly IUserRepository _userRepository;
    private readonly ILogger<AdminController> _logger;

    /// <summary>
    /// Initialize admin controller with required repositories and services.
    /// </summary>
    public AdminController(
        IOrderRepository orderRepository,
        IPrintSizeRepository printSizeRepository,
        IPhotoRepository photoRepository,
        IUserRepository userRepository,
        ILogger<AdminController> logger)
    {
        _orderRepository = orderRepository;
        _printSizeRepository = printSizeRepository;
        _photoRepository = photoRepository;
        _userRepository = userRepository;
        _logger = logger;
    }

    /// <summary>
    /// Get admin dashboard statistics.
    /// Provides overview of system status and pending work for daily admin workflow.
    /// Shows key metrics like pending orders, processing orders, and revenue.
    //  Get admin dashboard statistics with logical status grouping.
    /// Processing orders now includes all work-in-progress statuses for meaningful overview.
    /// </summary>
    /// <returns>Dashboard statistics</returns>
    /// <response code="200">Dashboard statistics retrieved successfully</response>
    /// <response code="401">Authentication required</response>
    /// <response code="403">Admin role required</response>
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(ApiResponse<AdminDashboardDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<AdminDashboardDto>>> GetDashboard()
    {
        try
        {
            _logger.LogDebug("Admin dashboard request from user {UserId}", GetAdminUserId());

            // SIMPLE: Use existing methods to get logical status groups

            // Pending group: pending + payment_verified (orders needing attention)
            var pendingOrdersResult = await _orderRepository.GetOrdersByStatusAsync("pending", 1, 1000);
            var paymentVerifiedResult = await _orderRepository.GetOrdersByStatusAsync("payment_verified", 1, 1000);
            var pendingCount = pendingOrdersResult.TotalCount + paymentVerifiedResult.TotalCount;

            // Processing group: processing + printed + shipped (orders being worked on)
            var processingResult = await _orderRepository.GetOrdersByStatusAsync("processing", 1, 1000);
            var printedResult = await _orderRepository.GetOrdersByStatusAsync("printed", 1, 1000);
            var shippedResult = await _orderRepository.GetOrdersByStatusAsync("shipped", 1, 1000);
            var processingCount = processingResult.TotalCount + printedResult.TotalCount + shippedResult.TotalCount;

            // Get completed orders for today
            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);
            var completedToday = await _orderRepository.GetCompletedOrdersAsync(today, tomorrow);

            // Safe revenue calculation
            var totalRevenue = completedToday
                .Where(order => order.Pricing != null)
                .Sum(order => order.Pricing.Total);

            var dashboard = new AdminDashboardDto
            {
                PendingOrders = pendingCount,        // Now includes pending + payment_verified
                ProcessingOrders = processingCount,  // Now includes processing + printed + shipped
                CompletedToday = completedToday.Count,
                TotalRevenue = totalRevenue,
                ActiveUsers = 50, // Placeholder
                StorageUsed = 1024L * 1024L * 1024L * 5 // 5GB placeholder
            };

            _logger.LogInformation("Enhanced dashboard: Pending={Pending} (pending+verified), Processing={Processing} (processing+printed+shipped), Completed={Completed}, Revenue={Revenue:C}",
                pendingCount, processingCount, completedToday.Count, totalRevenue);

            return Ok(ApiResponse<AdminDashboardDto>.SuccessResponse(
                dashboard,
                "Dashboard statistics retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving admin dashboard");
            return StatusCode(StatusCodes.Status500InternalServerError,
                ApiResponse<object>.ErrorResponse(
                    "Failed to retrieve dashboard",
                    "An unexpected error occurred"));
        }
    }

    /// <summary>
    /// Get orders for admin management with filtering by status.
    /// Returns paginated list of orders for admin workflow processing.
    /// Includes customer information and payment status for verification.
    /// GetOrders with logical status grouping using existing methods.
    /// Supports logical groupings by making multiple calls to existing repository methods.
    /// </summary>
    /// <param name="status">Filter by order status (optional)</param>
    /// <param name="page">Page number</param>
    /// <param name="pageSize">Items per page</param>
    /// <returns>Paginated orders for admin management</returns>
    /// <response code="200">Orders retrieved successfully</response>
    /// <response code="401">Authentication required</response>
    /// <response code="403">Admin role required</response>
    [HttpGet("orders")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<AdminOrderDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<PagedResult<AdminOrderDto>>>> GetOrders(
    [FromQuery] string? status = null,
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 20)
    {
        try
        {
            _logger.LogDebug("Admin orders request: status={Status}, page={Page}", status, page);

            List<Order> allFilteredOrders;
            int totalCount;

            if (!string.IsNullOrEmpty(status))
            {
                // SIMPLE: Handle logical grouping using existing methods
                if (status.ToLowerInvariant() == "pending")
                {
                    // Logical grouping: pending + payment_verified (orders needing attention)
                    var pendingOrders = await _orderRepository.GetOrdersByStatusAsync("pending", 1, 1000);
                    var paymentVerifiedOrders = await _orderRepository.GetOrdersByStatusAsync("payment_verified", 1, 1000);

                    allFilteredOrders = pendingOrders.Items.Concat(paymentVerifiedOrders.Items)
                        .OrderByDescending(o => o.Metadata.CreatedAt)
                        .ToList();
                    totalCount = pendingOrders.TotalCount + paymentVerifiedOrders.TotalCount;

                    _logger.LogDebug("Retrieved pending group orders: {Count} total", totalCount);
                }
                else if (status.ToLowerInvariant() == "processing")
                {
                    // Logical grouping: processing + printed + shipped (orders being worked on)
                    var processingOrders = await _orderRepository.GetOrdersByStatusAsync("processing", 1, 1000);
                    var printedOrders = await _orderRepository.GetOrdersByStatusAsync("printed", 1, 1000);
                    var shippedOrders = await _orderRepository.GetOrdersByStatusAsync("shipped", 1, 1000);

                    allFilteredOrders = processingOrders.Items
                        .Concat(printedOrders.Items)
                        .Concat(shippedOrders.Items)
                        .OrderByDescending(o => o.Metadata.CreatedAt)
                        .ToList();
                    totalCount = processingOrders.TotalCount + printedOrders.TotalCount + shippedOrders.TotalCount;

                    _logger.LogDebug("Retrieved processing group orders: {Count} total", totalCount);
                }
                else
                {
                    // Exact status filtering (existing behavior)
                    var pagedOrders = await _orderRepository.GetOrdersByStatusAsync(status, 1, 1000);
                    allFilteredOrders = pagedOrders.Items;
                    totalCount = pagedOrders.TotalCount;

                    _logger.LogDebug("Retrieved orders filtered by exact status: {Status}", status);
                }
            }
            else
            {
                // No status filter: Get ALL orders (existing behavior)
                var pagedOrders = await _orderRepository.GetAllOrdersAsync(1, 1000);
                allFilteredOrders = pagedOrders.Items;
                totalCount = pagedOrders.TotalCount;

                _logger.LogDebug("Retrieved all orders without status filter");
            }

            // Simple pagination on the combined results
            var skip = (page - 1) * pageSize;
            var paginatedOrders = allFilteredOrders.Skip(skip).Take(pageSize).ToList();

            var adminOrders = paginatedOrders.Select(order => new AdminOrderDto
            {
                OrderId = order.Id.ToString(),
                OrderNumber = order.OrderNumber,
                CustomerName = order.UserInfo.Name,
                CustomerEmail = order.UserInfo.Email,
                Status = order.Status,
                PaymentMethod = order.Payment.Method,
                PaymentStatus = order.Payment.Status,
                TotalAmount = order.Pricing.Total,
                OrderDate = order.Metadata.CreatedAt,
                PaymentVerifiedDate = order.Payment.VerifiedAt,
                PhotoCount = order.Items.Count,
                PrintCount = order.Items.Sum(item => item.PrintSelections.Sum(ps => ps.Quantity))
            }).ToList();

            var result = new PagedResult<AdminOrderDto>
            {
                Items = adminOrders,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };

            var statusDescription = GetStatusDescription(status);
            return Ok(ApiResponse<PagedResult<AdminOrderDto>>.SuccessResponse(
                result,
                $"Retrieved {adminOrders.Count} {statusDescription}"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving admin orders");
            return StatusCode(StatusCodes.Status500InternalServerError,
                ApiResponse<object>.ErrorResponse(
                    "Failed to retrieve orders",
                    "An unexpected error occurred"));
        }
    }

    /// <summary>
    /// Update order status in admin workflow.
    /// This endpoint implements Requirement 9 for admin order processing.
    /// Allows progression through order statuses: pending → payment_verified → processing → printed → shipped → completed.
    /// Update order status with improved validation and admin verification.
    /// </summary>
    /// <param name="orderId">Order ID to update</param>
    /// <param name="updateDto">New status and optional notes</param>
    /// <returns>Updated order confirmation</returns>
    /// <response code="200">Order status updated successfully</response>
    /// <response code="400">Invalid status transition or data</response>
    /// <response code="401">Authentication required</response>
    /// <response code="403">Admin role required</response>
    /// <response code="404">Order not found</response>
    [HttpPut("orders/{orderId}/status")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<object>>> UpdateOrderStatus(
    string orderId,
    [FromBody] UpdateOrderStatusDto updateDto)
    {
        try
        {
            var adminUserId = GetAdminUserId();

            // FIXED: Proper admin role verification without Forbid() error
            if (!VerifyAdminRole())
            {
                _logger.LogWarning("Non-admin user {UserId} attempted to update order status", adminUserId);

                // FIXED: Return proper ActionResult instead of using Forbid() with ApiResponse
                return StatusCode(StatusCodes.Status403Forbidden,
                    ApiResponse<object>.ErrorResponse(
                        "Access denied",
                        "Admin role required"));
            }

            _logger.LogInformation("Admin {AdminId} updating order {OrderId} status to {Status}",
                adminUserId, orderId, updateDto.Status);

            if (!ObjectId.TryParse(orderId, out var orderObjectId))
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(
                    "Invalid order ID",
                    "Order ID format is invalid"));
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();

                return BadRequest(ApiResponse<object>.ErrorResponse(
                    "Invalid status update data", errors));
            }

            var order = await _orderRepository.GetByIdAsync(orderObjectId);
            if (order == null)
            {
                return NotFound(ApiResponse<object>.ErrorResponse(
                    "Order not found",
                    "Order not found"));
            }

            // Validate status transition is allowed
            if (!IsValidStatusTransition(order.Status, updateDto.Status))
            {
                _logger.LogWarning("Invalid status transition attempted: {CurrentStatus} → {NewStatus} for order {OrderNumber}",
                    order.Status, updateDto.Status, order.OrderNumber);

                return BadRequest(ApiResponse<object>.ErrorResponse(
                    "Invalid status transition",
                    $"Cannot change status from {order.Status} to {updateDto.Status}"));
            }

            // Store previous status for logging
            var previousStatus = order.Status;

            // Update order status and related fields
            order.Status = updateDto.Status;

            // Handle payment verification with enhanced logic
            if (updateDto.Status == "payment_verified" && order.Payment.Status == "pending")
            {
                order.Payment.Status = "verified";
                order.Payment.VerifiedAt = DateTime.UtcNow;
                order.Payment.VerifiedBy = adminUserId;

                _logger.LogInformation("Payment verified for order {OrderNumber} by admin {AdminId}",
                    order.OrderNumber, adminUserId);
            }

            // Handle fulfillment status updates with enhanced tracking
            switch (updateDto.Status)
            {
                case "processing":
                    _logger.LogInformation("Order {OrderNumber} moved to print queue", order.OrderNumber);
                    break;

                case "printed":
                    order.Fulfillment.PrintedAt = DateTime.UtcNow;
                    _logger.LogInformation("Order {OrderNumber} marked as printed", order.OrderNumber);
                    break;

                case "shipped":
                    order.Fulfillment.ShippedAt = DateTime.UtcNow;
                    _logger.LogInformation("Order {OrderNumber} marked as shipped", order.OrderNumber);
                    break;
            }

            // Add admin notes with timestamp and user identification
            if (!string.IsNullOrWhiteSpace(updateDto.Notes))
            {
                var noteEntry = $"[{DateTime.UtcNow:yyyy-MM-dd HH:mm}] {adminUserId}: {updateDto.Notes}";
                order.Fulfillment.Notes.Add(noteEntry);
            }

            // Add status change tracking note
            var statusChangeNote = $"[{DateTime.UtcNow:yyyy-MM-dd HH:mm}] {adminUserId}: Status changed from {previousStatus} to {updateDto.Status}";
            order.Fulfillment.Notes.Add(statusChangeNote);

            await _orderRepository.UpdateAsync(order);

            _logger.LogInformation("Order {OrderNumber} status updated from {OldStatus} to {NewStatus} by admin {AdminId}",
                order.OrderNumber, previousStatus, updateDto.Status, adminUserId);

            return Ok(ApiResponse<object>.SuccessResponse(
                new
                {
                    OrderNumber = order.OrderNumber,
                    PreviousStatus = previousStatus,
                    NewStatus = updateDto.Status,
                    UpdatedBy = adminUserId,
                    UpdatedAt = DateTime.UtcNow
                },
                $"Order status updated to {updateDto.Status}"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating order status");
            return StatusCode(StatusCodes.Status500InternalServerError,
                ApiResponse<object>.ErrorResponse(
                    "Failed to update order status",
                    "An unexpected error occurred"));
        }
    }

    /// <summary>
    /// Complete order and trigger photo cleanup.
    /// This endpoint implements Requirement 10 for photo deletion after order completion.
    /// Marks order as completed and schedules photos for deletion.
    /// </summary>
    /// <param name="orderId">Order ID to complete</param>
    /// <param name="completeDto">Completion details including shipping info</param>
    /// <returns>Completion confirmation with cleanup statistics</returns>
    /// <response code="200">Order completed successfully</response>
    /// <response code="400">Invalid completion data or order not ready</response>
    /// <response code="401">Authentication required</response>
    /// <response code="403">Admin role required</response>
    /// <response code="404">Order not found</response>
    [HttpPost("orders/{orderId}/complete")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<object>>> CompleteOrder(
        string orderId,
        [FromBody] CompleteOrderDto completeDto)
    {
        try
        {
            var adminUserId = GetAdminUserId();
            _logger.LogInformation("Admin {AdminId} completing order {OrderId}", adminUserId, orderId);

            if (!ObjectId.TryParse(orderId, out var orderObjectId))
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(
                    "Invalid order ID",
                    "Order ID format is invalid"));
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();

                return BadRequest(ApiResponse<object>.ErrorResponse(
                    "Invalid completion data", errors));
            }

            var order = await _orderRepository.GetByIdAsync(orderObjectId);
            if (order == null)
            {
                return NotFound(ApiResponse<object>.ErrorResponse(
                    "Order not found",
                    "Order not found"));
            }

            // Verify order is in a state that can be completed
            if (order.Status == "completed")
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(
                    "Order already completed",
                    "This order has already been completed"));
            }

            if (order.Status != "printed" && order.Status != "shipped")
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(
                    "Order not ready for completion",
                    "Order must be printed or shipped before completion"));
            }

            // Update order to completed status
            order.Status = "completed";
            order.Fulfillment.CompletedAt = DateTime.UtcNow;
            order.Fulfillment.ShippedAt = completeDto.ShippingDate;

            if (!string.IsNullOrWhiteSpace(completeDto.TrackingNumber))
            {
                order.Fulfillment.TrackingNumber = completeDto.TrackingNumber;
            }

            if (!string.IsNullOrWhiteSpace(completeDto.Notes))
            {
                var noteEntry = $"[{DateTime.UtcNow:yyyy-MM-dd HH:mm}] {adminUserId}: COMPLETED - {completeDto.Notes}";
                order.Fulfillment.Notes.Add(noteEntry);
            }

            // Schedule photos for deletion (7 days buffer for customer service)
            var deletionDate = DateTime.UtcNow.AddDays(7);
            var photoIds = order.Items.Select(item => item.PhotoId).ToList();
            var storageFreed = order.Items.Sum(item => item.PhotoFileSize);

            foreach (var photoId in photoIds)
            {
                await _photoRepository.MarkForDeletionAsync(photoId, deletionDate);
            }

            // Update cleanup tracking
            order.PhotoCleanup = new PhotoCleanup
            {
                IsCompleted = false, // Will be completed by cleanup job
                PhotosDeleted = 0,
                StorageFreed = 0,
                CleanupDate = null
            };

            await _orderRepository.UpdateAsync(order);

            _logger.LogInformation("Order {OrderNumber} completed by admin {AdminId}, {PhotoCount} photos scheduled for deletion",
                order.OrderNumber, adminUserId, photoIds.Count);

            var response = new
            {
                OrderId = order.Id.ToString(),
                Status = order.Status,
                PhotosScheduledForDeletion = photoIds.Count,
                DeletionScheduledFor = deletionDate,
                EstimatedStorageToFree = storageFreed
            };

            return Ok(ApiResponse<object>.SuccessResponse(
                response,
                $"Order {order.OrderNumber} completed successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing order");
            return StatusCode(StatusCodes.Status500InternalServerError,
                ApiResponse<object>.ErrorResponse(
                    "Failed to complete order",
                    "An unexpected error occurred"));
        }
    }

    /// <summary>
    /// Get all print sizes for admin management.
    /// Returns both active and inactive print sizes for administrative control.
    /// </summary>
    /// <returns>All print sizes with admin metadata</returns>
    /// <response code="200">Print sizes retrieved successfully</response>
    /// <response code="401">Authentication required</response>
    /// <response code="403">Admin role required</response>
    [HttpGet("print-sizes")]
    [ProducesResponseType(typeof(ApiResponse<List<AdminPrintSizeDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<List<AdminPrintSizeDto>>>> GetPrintSizes()
    {
        try
        {
            var printSizes = await _printSizeRepository.GetAllAsync();

            var adminPrintSizes = printSizes.Select(ps => new AdminPrintSizeDto
            {
                Id = ps.Id.ToString(),
                SizeCode = ps.SizeCode,
                DisplayName = ps.DisplayName,
                Width = ps.Dimensions.Width,
                Height = ps.Dimensions.Height,
                Unit = ps.Dimensions.Unit,
                Price = ps.Pricing.BasePrice,
                Currency = ps.Pricing.Currency,
                IsActive = ps.Metadata.IsActive,
                MinWidth = ps.Dimensions.PixelRequirements.MinWidth,
                MinHeight = ps.Dimensions.PixelRequirements.MinHeight,
                RecommendedWidth = ps.Dimensions.PixelRequirements.RecommendedWidth,
                RecommendedHeight = ps.Dimensions.PixelRequirements.RecommendedHeight,
                SortOrder = ps.Metadata.SortOrder,
                LastUpdated = ps.Pricing.LastUpdated,
                UpdatedBy = ps.Pricing.UpdatedBy,
                CreatedAt = ps.Metadata.CreatedAt
            }).ToList();

            return Ok(ApiResponse<List<AdminPrintSizeDto>>.SuccessResponse(
                adminPrintSizes,
                $"Retrieved {adminPrintSizes.Count} print sizes"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving admin print sizes");
            return StatusCode(StatusCodes.Status500InternalServerError,
                ApiResponse<object>.ErrorResponse(
                    "Failed to retrieve print sizes",
                    "An unexpected error occurred"));
        }
    }

    /// <summary>
    /// Update print size pricing and settings.
    /// This endpoint implements Requirement 11 where "admin will decide the price and other things".
    /// </summary>
    /// <param name="printSizeId">Print size ID to update</param>
    /// <param name="updateDto">Updated pricing and settings</param>
    /// <returns>Update confirmation</returns>
    /// <response code="200">Print size updated successfully</response>
    /// <response code="400">Invalid update data</response>
    /// <response code="401">Authentication required</response>
    /// <response code="403">Admin role required</response>
    /// <response code="404">Print size not found</response>
    [HttpPut("print-sizes/{printSizeId}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<object>>> UpdatePrintSize(
        string printSizeId,
        [FromBody] UpdatePrintSizeDto updateDto)
    {
        try
        {
            var adminUserId = GetAdminUserId();
            _logger.LogInformation("Admin {AdminId} updating print size {PrintSizeId}", adminUserId, printSizeId);

            if (!ObjectId.TryParse(printSizeId, out var printSizeObjectId))
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(
                    "Invalid print size ID",
                    "Print size ID format is invalid"));
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();

                return BadRequest(ApiResponse<object>.ErrorResponse(
                    "Invalid print size data", errors));
            }

            var printSize = await _printSizeRepository.GetByIdAsync(printSizeObjectId);
            if (printSize == null)
            {
                return NotFound(ApiResponse<object>.ErrorResponse(
                    "Print size not found",
                    "Print size not found"));
            }

            // Update pricing information
            printSize.Pricing.BasePrice = updateDto.Price;
            printSize.Pricing.LastUpdated = DateTime.UtcNow;
            printSize.Pricing.UpdatedBy = adminUserId;

            // Update metadata
            printSize.Metadata.IsActive = updateDto.IsActive;
            printSize.Metadata.SortOrder = updateDto.SortOrder;
            printSize.Metadata.UpdatedAt = DateTime.UtcNow;

            await _printSizeRepository.UpdateAsync(printSize);

            _logger.LogInformation("Print size {SizeCode} updated by admin {AdminId}: price=${Price}, active={IsActive}",
                printSize.SizeCode, adminUserId, updateDto.Price, updateDto.IsActive);

            return Ok(ApiResponse<object>.SuccessResponse(
                null,
                $"Print size {printSize.SizeCode} updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating print size");
            return StatusCode(StatusCodes.Status500InternalServerError,
                ApiResponse<object>.ErrorResponse(
                    "Failed to update print size",
                    "An unexpected error occurred"));
        }
    }

    /// <summary>
    /// Create new print size option.
    /// Allows admin to add new print sizes and pricing options for customers.
    /// </summary>
    /// <param name="createDto">New print size information</param>
    /// <returns>Created print size information</returns>
    /// <response code="201">Print size created successfully</response>
    /// <response code="400">Invalid creation data or size code already exists</response>
    /// <response code="401">Authentication required</response>
    /// <response code="403">Admin role required</response>
    [HttpPost("print-sizes")]
    [ProducesResponseType(typeof(ApiResponse<AdminPrintSizeDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<AdminPrintSizeDto>>> CreatePrintSize([FromBody] CreatePrintSizeDto createDto)
    {
        try
        {
            var adminUserId = GetAdminUserId();
            _logger.LogInformation("Admin {AdminId} creating new print size {SizeCode}", adminUserId, createDto.SizeCode);

            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();

                return BadRequest(ApiResponse<object>.ErrorResponse(
                    "Invalid print size data", errors));
            }

            // Check if size code already exists
            if (await _printSizeRepository.SizeCodeExistsAsync(createDto.SizeCode))
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(
                    "Size code already exists",
                    $"A print size with code '{createDto.SizeCode}' already exists"));
            }

            // Create new print size entity
            var printSize = new PrintSize
            {
                SizeCode = createDto.SizeCode,
                DisplayName = createDto.DisplayName,
                Dimensions = new PrintDimensions
                {
                    Width = createDto.Width,
                    Height = createDto.Height,
                    Unit = "inches",
                    PixelRequirements = new PixelRequirements
                    {
                        MinWidth = createDto.MinWidth,
                        MinHeight = createDto.MinHeight,
                        RecommendedWidth = createDto.RecommendedWidth,
                        RecommendedHeight = createDto.RecommendedHeight
                    }
                },
                Pricing = new PrintPricing
                {
                    BasePrice = createDto.Price,
                    Currency = "USD",
                    LastUpdated = DateTime.UtcNow,
                    UpdatedBy = adminUserId
                },
                Metadata = new PrintSizeMetadata
                {
                    IsActive = true,
                    SortOrder = 99, // Place new sizes at end by default
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            var createdPrintSize = await _printSizeRepository.CreateAsync(printSize);

            var responseDto = new AdminPrintSizeDto
            {
                Id = createdPrintSize.Id.ToString(),
                SizeCode = createdPrintSize.SizeCode,
                DisplayName = createdPrintSize.DisplayName,
                Width = createdPrintSize.Dimensions.Width,
                Height = createdPrintSize.Dimensions.Height,
                Unit = createdPrintSize.Dimensions.Unit,
                Price = createdPrintSize.Pricing.BasePrice,
                Currency = createdPrintSize.Pricing.Currency,
                IsActive = createdPrintSize.Metadata.IsActive,
                MinWidth = createdPrintSize.Dimensions.PixelRequirements.MinWidth,
                MinHeight = createdPrintSize.Dimensions.PixelRequirements.MinHeight,
                RecommendedWidth = createdPrintSize.Dimensions.PixelRequirements.RecommendedWidth,
                RecommendedHeight = createdPrintSize.Dimensions.PixelRequirements.RecommendedHeight,
                SortOrder = createdPrintSize.Metadata.SortOrder,
                LastUpdated = createdPrintSize.Pricing.LastUpdated,
                UpdatedBy = createdPrintSize.Pricing.UpdatedBy,
                CreatedAt = createdPrintSize.Metadata.CreatedAt
            };

            _logger.LogInformation("Print size {SizeCode} created successfully by admin {AdminId}",
                createDto.SizeCode, adminUserId);

            return CreatedAtAction(
                nameof(GetPrintSizes),
                ApiResponse<AdminPrintSizeDto>.SuccessResponse(
                    responseDto,
                    $"Print size {createDto.SizeCode} created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating print size");
            return StatusCode(StatusCodes.Status500InternalServerError,
                ApiResponse<object>.ErrorResponse(
                    "Failed to create print size",
                    "An unexpected error occurred"));
        }
    }

    /// <summary>
    /// Helper method to get admin user ID from JWT token claims.
    /// </summary>
    private string GetAdminUserId()
    {
        return User.FindFirst("user_id")?.Value ?? "unknown_admin";
    }

    /// <summary>
    /// ENHANCED: Helper method to verify admin role with proper claims checking.
    /// </summary>
    private bool VerifyAdminRole()
    {
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        var isAdmin = userRole == "admin";

        if (!isAdmin)
        {
            _logger.LogWarning("Non-admin user attempted admin operation. Role: {Role}", userRole ?? "none");
        }

        return isAdmin;
    }

    /// <summary>
    /// Validate that status transition is allowed in the order workflow.
    /// Prevents invalid status changes that would break the order process.
    /// Validate status transitions with comprehensive business rules.
    /// </summary>
    /// <param name="currentStatus">Current order status</param>
    /// <param name="newStatus">Requested new status</param>
    /// <returns>True if transition is valid</returns>
    private static bool IsValidStatusTransition(string currentStatus, string newStatus)
    {
        // Define allowed status transitions based on business workflow
        var allowedTransitions = new Dictionary<string, string[]>
        {
            ["pending"] = new[] { "payment_verified", "cancelled" },
            ["payment_verified"] = new[] { "processing", "cancelled" },
            ["processing"] = new[] { "printed", "cancelled" },
            ["printed"] = new[] { "shipped", "completed" },
            ["shipped"] = new[] { "completed" },
            ["completed"] = new string[0], // No transitions from completed
            ["cancelled"] = new string[0],  // No transitions from cancelled
            ["payment_failed"] = new[] { "pending", "cancelled" } // Allow retry from payment failure
        };

        return allowedTransitions.ContainsKey(currentStatus) &&
               allowedTransitions[currentStatus].Contains(newStatus);
    }

    /// <summary>
    /// Simple helper method for status descriptions.
    /// </summary>
    private static string GetStatusDescription(string? status)
    {
        if (string.IsNullOrEmpty(status))
            return "orders";

        return status.ToLowerInvariant() switch
        {
            "pending" => "orders needing attention",
            "processing" => "orders being processed",
            _ => $"orders with status '{status}'"
        };
    }
}