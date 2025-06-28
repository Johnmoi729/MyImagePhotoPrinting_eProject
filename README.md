# MyImage Photo Printing Service - Complete Project Knowledge Base

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Business Requirements](#2-business-requirements)
3. [Technical Architecture](#3-technical-architecture)
4. [Database Design](#4-database-design)
5. [API Specifications](#5-api-specifications)
6. [Frontend Implementation](#6-frontend-implementation)
7. [Security Implementation](#7-security-implementation)
8. [Payment Integration](#8-payment-integration)
9. [User Experience Design](#9-user-experience-design)
10. [Development Workflow](#10-development-workflow)

---

## 1. Project Overview

### 1.1 Project Description

MyImage is a comprehensive online photo printing service that bridges digital photography and physical prints. The system provides end-to-end functionality for customers to upload, select, and order professional-quality prints of their digital photographs.

### 1.2 Core Value Proposition

- **Professional Quality**: High-grade printing on premium photo paper
- **User-Friendly**: Intuitive interface for non-technical users
- **Secure**: End-to-end security with automatic photo cleanup and secure Stripe payment processing
- **Flexible**: Multiple payment options and print sizes
- **Convenient**: Online ordering with delivery options

### 1.3 Target Users

- **Primary**: Individual consumers wanting to print personal photos
- **Secondary**: Small businesses needing promotional materials
- **Administrative**: Internal staff managing orders and operations

### 1.4 Technology Stack

- **Backend**: ASP.NET Core 9.0 with C# 12
- **Frontend**: Angular 19 with TypeScript 5.6
- **Database**: MongoDB 6.0+ with GridFS
- **UI Framework**: Angular Material Design
- **Payment Processing**: Stripe.net 47.2.0 + Stripe.js
- **Image Processing**: ImageSharp 3.1.6
- **Authentication**: JWT tokens with BCrypt hashing

---

## 2. Business Requirements

### 2.1 Functional Requirements

#### 2.1.1 User Management (REQ-001)

- **Registration**: Users must register before accessing functionality
- **User ID Generation**: System generates unique, human-readable User IDs (USR-YYYY-NNNNNN)
- **Authentication**: Support both email and User ID for login
- **Password Security**: BCrypt hashing with minimum complexity requirements
- **Role Management**: Customer and Admin roles with appropriate permissions

#### 2.1.2 Photo Management (REQ-002)

- **Folder Browsing**: System displays contents of desktop folders
- **JPEG Filtering**: Only JPEG files (.jpg, .jpeg) are selectable
- **Bulk Upload**: Multiple photo upload with progress tracking
- **Thumbnail Generation**: Automatic thumbnail creation for gallery display
- **Lifecycle Management**: Photos deleted after order completion

#### 2.1.3 Print Ordering (REQ-003)

- **Size Selection**: Users specify print sizes and quantities per photo
- **Multiple Sizes**: Same photo can be ordered in different sizes
- **Real-time Pricing**: Dynamic price calculation with tax
- **Quality Indicators**: Visual indicators for print quality based on resolution

#### 2.1.4 Payment Processing (REQ-004)

- **Credit Card**: Secure online payment with Stripe integration
- **Branch Payment**: Alternative in-person payment option
- **Payment Verification**: Admin verification workflow for all payments
- **Security Compliance**: PCI-compliant payment handling

#### 2.1.5 Order Management (REQ-005)

- **Order Tracking**: Complete order lifecycle from placement to completion
- **Admin Interface**: Comprehensive order management for administrators
- **Status Updates**: Real-time order status tracking

#### 2.1.6 Public Marketing (REQ-006)

- **Landing Pages**: Professional marketing pages for user acquisition
- **Sample Gallery**: Showcase of print quality and options
- **Pricing Transparency**: Clear pricing information without registration
- **Educational Content**: How-it-works and about pages

### 2.2 Non-Functional Requirements

#### 2.2.1 Performance

- **Response Time**: API responses under 2 seconds
- **File Upload**: Support files up to 50MB
- **Concurrent Users**: Handle 100+ simultaneous users
- **Image Processing**: Thumbnail generation under 5 seconds

#### 2.2.2 Security

- **Data Encryption**: All sensitive data encrypted in transit and at rest
- **Authentication**: JWT tokens with configurable expiration
- **Authorization**: Role-based access control
- **Privacy**: Automatic photo deletion after order completion

#### 2.2.3 Usability

- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Accessibility**: WCAG 2.1 AA compliance
- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge)

---

## 3. Technical Architecture

### 3.1 System Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Angular 19    │    │  ASP.NET Core   │    │    MongoDB      │
│   Frontend      │◄──►│      API        │◄──►│   + GridFS      │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Stripe.js     │    │   Stripe.net    │    │   File Storage  │
│   Payment UI    │    │   Integration   │    │   (GridFS)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 3.2 Backend Architecture (ASP.NET Core)

#### 3.2.1 Project Structure

```
MyImage.sln
├── src/
│   ├── MyImage.API/           # Web API controllers and configuration
│   ├── MyImage.Core/          # Business logic and entities
│   └── MyImage.Infrastructure/ # Data access and external services
└── docs/                      # Documentation
```

#### 3.2.2 Layered Architecture

- **API Layer**: Controllers, middleware, authentication
- **Core Layer**: Business logic, entities, DTOs, interfaces
- **Infrastructure Layer**: Data access, external services, utilities

### 3.3 Frontend Architecture (Angular 19)

#### 3.3.1 Application Structure

```
src/app/
├── core/                   # Singleton services and guards
├── shared/                 # Reusable components and models
├── features/               # Feature modules
│   ├── public/            # Marketing pages (no auth required)
│   ├── auth/              # Authentication (login, register)
│   ├── photo/             # Photo management
│   ├── shopping/          # Cart and checkout
│   ├── orders/            # Order history and tracking
│   └── admin/             # Administrative interface
└── layouts/               # Application layouts
```

---

## 4. Database Design

### 4.1 MongoDB Collections Overview

#### 4.1.1 Core Collections

- **Users**: User authentication and profile information
- **Photos**: Photo metadata with GridFS file references
- **Orders**: Complete order lifecycle tracking
- **ShoppingCarts**: Temporary cart storage with TTL expiration
- **PrintSizes**: Available print options and pricing
- **SystemSettings**: Configuration and system parameters

#### 4.1.2 GridFS Collections

- **fs.files**: File metadata for photos and thumbnails
- **fs.chunks**: Binary data storage in chunks

### 4.2 Key Collection Schemas

#### 4.2.1 Users Collection

```javascript
{
  _id: ObjectId("..."),
  userId: "USR-2024-001234",        // Human-readable unique ID
  email: "user@example.com",        // Unique index
  passwordHash: "bcrypt_hash",      // BCrypt hashed password
  profile: {
    firstName: "John",
    lastName: "Doe"
  },
  role: "customer",                 // customer | admin
  stats: {
    totalOrders: 0,
    totalPhotosUploaded: 0,
    totalSpent: 0.00
  },
  metadata: {
    createdAt: ISODate("..."),
    lastLoginAt: ISODate("..."),
    updatedAt: ISODate("..."),
    isActive: true
  }
}
```

#### 4.2.2 Orders Collection with Stripe Integration

```javascript
{
  _id: ObjectId("..."),
  orderNumber: "ORD-2024-0001234",
  userId: ObjectId("..."),
  status: "pending",               // pending | payment_verified | processing | printed | shipped | completed
  items: [{
    photoId: ObjectId("..."),
    printSelections: [{
      sizeCode: "4x6",
      quantity: 10,
      unitPrice: 0.29,
      subtotal: 2.90
    }]
  }],
  pricing: {
    subtotal: 25.50,
    taxAmount: 1.59,
    total: 27.09,
    currency: "USD"
  },
  payment: {
    method: "credit_card",          // credit_card | branch_payment
    status: "verified",             // pending | verified | failed
    stripePaymentIntentId: "pi_...",
    stripeCustomerId: "cus_...",
    stripeChargeId: "ch_..."
  },
  shippingAddress: { /* address details */ },
  fulfillment: { /* tracking and completion data */ },
  metadata: {
    createdAt: ISODate("..."),
    updatedAt: ISODate("...")
  }
}
```

---

## 5. API Specifications

### 5.1 API Design Principles

- **RESTful**: Resource-based URLs with standard HTTP methods
- **Consistent**: Standardized response format across all endpoints
- **Secure**: JWT authentication for protected endpoints
- **Documented**: Comprehensive API documentation with examples

### 5.2 Standard Response Format

```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully",
  "errors": [],
  "timestamp": "2024-01-20T10:30:00Z"
}
```

### 5.3 Key Endpoints

#### Authentication Endpoints
- `POST /api/auth/register` - User registration with User ID generation
- `POST /api/auth/login` - User authentication

#### Photo Management Endpoints
- `POST /api/photos/bulk-upload` - Multiple JPEG file upload
- `GET /api/photos` - Paginated photo gallery
- `GET /api/photos/{id}/thumbnail` - Photo thumbnail
- `DELETE /api/photos/{id}` - Photo deletion

#### Shopping Cart Endpoints
- `GET /api/cart` - Current cart contents
- `POST /api/cart/items` - Add items to cart
- `PUT /api/cart/items/{itemId}` - Update cart item
- `DELETE /api/cart/items/{itemId}` - Remove from cart

#### Order Management Endpoints
- `POST /api/orders/payment-intent` - Create Stripe Payment Intent
- `POST /api/orders` - Create order with payment
- `GET /api/orders` - Order history
- `GET /api/orders/{id}` - Order details

#### Stripe Integration Endpoints
- `GET /api/stripe/config` - Stripe configuration for frontend

#### Admin Endpoints
- `GET /api/admin/dashboard` - Admin dashboard statistics
- `GET /api/admin/orders` - All orders management
- `PUT /api/admin/orders/{id}/status` - Update order status

---

## 6. Frontend Implementation

### 6.1 Application Routing Structure

The application uses hierarchical navigation with role-based access:

- **Public Routes**: `/`, `/about`, `/pricing`, `/samples`, `/how-it-works`
- **Authentication Routes**: `/auth/login`, `/auth/register`
- **Customer Routes**: `/photos`, `/cart`, `/orders`
- **Admin Routes**: `/admin`

### 6.2 Key Features

#### 6.2.1 Public Pages
- Professional landing page with service overview
- Complete pricing information
- Sample gallery showcasing quality
- Educational "How It Works" section

#### 6.2.2 Photo Management
- Drag-and-drop upload interface
- Real-time upload progress
- Gallery view with thumbnails
- Quality-based print recommendations

#### 6.2.3 Shopping Experience
- Interactive print size selection
- Real-time price calculation
- Persistent shopping cart
- Streamlined checkout process

#### 6.2.4 Payment Processing
- Stripe Elements integration
- Multiple payment methods (Card, Apple Pay, Google Pay)
- Branch payment alternative
- Secure payment confirmation

---

## 7. Security Implementation

### 7.1 Authentication Security

- **BCrypt Hashing**: Industry-standard password hashing with salt
- **JWT Tokens**: Secure token-based authentication
- **Password Complexity**: Enforced password requirements
- **Session Management**: Configurable token expiration

### 7.2 Payment Security

- **Stripe Integration**: PCI-compliant payment processing
- **No Card Storage**: Credit card data never stored locally
- **Secure Transmission**: All payment data encrypted in transit
- **Payment Intent Flow**: Modern Stripe payment architecture

### 7.3 Data Protection

- **File Validation**: Strict JPEG-only upload filtering
- **Size Limits**: 50MB maximum file size
- **Automatic Cleanup**: Photos deleted after order completion
- **Access Control**: User-specific data isolation

---

## 8. Payment Integration

### 8.1 Stripe Payment Flow

```
Frontend (Angular) ──► Backend API ──► Stripe Platform
     │                      │               │
     │ 1. Create Payment     │               │
     │    Intent Request     │               │
     ├──────────────────────►│               │
     │                       │ 2. Create     │
     │                       │    Payment    │
     │                       │    Intent     │
     │                       ├──────────────►│
     │                       │               │
     │ 4. Client Secret      │ 3. Response   │
     │◄──────────────────────│◄──────────────┤
     │                       │               │
     │ 5. Confirm Payment    │               │
     ├─────────────────────────────────────►│
     │                       │               │
     │ 6. Payment Result     │               │
     │◄─────────────────────────────────────┤
```

### 8.2 Payment Methods

#### 8.2.1 Credit Card Processing
- Stripe Elements for secure card input
- Real-time validation and error handling
- Support for 3D Secure authentication
- Apple Pay and Google Pay integration

#### 8.2.2 Branch Payment Alternative
- In-person payment option
- Branch location selection
- Payment verification by admin
- Order tracking for branch payments

---

## 9. User Experience Design

### 9.1 Design Principles

- **User-Centered Design**: Intuitive navigation and workflows
- **Progressive Disclosure**: Complex features revealed as needed
- **Visual Hierarchy**: Clear content prioritization
- **Accessibility**: WCAG 2.1 AA compliance

### 9.2 Key User Journeys

#### 9.2.1 Customer Journey
```
Registration → Photo Upload → Print Selection → Cart → Checkout → Payment → Confirmation
```

#### 9.2.2 Admin Journey
```
Login → Dashboard → Order Management → Status Updates → Order Completion
```

### 9.3 Mobile-First Approach

- **Responsive Design**: Optimized for all screen sizes
- **Touch-Friendly**: Appropriate touch targets
- **Performance**: Fast loading on mobile networks

---

## 10. Development Workflow

### 10.1 Development Setup

#### 10.1.1 Prerequisites
- .NET SDK 9.0+
- Node.js 18.0+
- MongoDB 6.0+
- Stripe Test Account

#### 10.1.2 Configuration
- MongoDB connection strings
- Stripe API keys (test mode)
- JWT secret configuration
- CORS origins setup

### 10.2 Code Organization Standards

#### 10.2.1 Backend (C#)
- PascalCase for classes and methods
- camelCase with underscore for private fields
- Comprehensive XML documentation
- Repository pattern implementation

#### 10.2.2 Frontend (TypeScript)
- camelCase for properties and methods
- PascalCase for classes and interfaces
- Kebab-case for file naming
- Component-based architecture

### 10.3 Testing Strategy

#### 10.3.1 Unit Testing (70%)
- Service layer business logic
- Component methods and state management
- Utility functions and calculations

#### 10.3.2 Integration Testing (20%)
- API endpoint testing
- Database operations
- Stripe integration testing

#### 10.3.3 End-to-End Testing (10%)
- Complete user workflows
- Critical business scenarios
- Cross-browser compatibility

### 10.4 Key Features Summary

#### Implemented Features
- User registration and authentication
- Photo upload and management
- Print size selection with quality indicators
- Shopping cart functionality
- Stripe payment integration
- Order management and tracking
- Admin dashboard and order processing
- Public marketing pages

#### Core Workflows
1. **Customer Workflow**: Register → Upload Photos → Select Prints → Pay → Track Order
2. **Admin Workflow**: Manage Orders → Verify Payments → Update Status → Complete Orders
3. **Public Workflow**: Browse Information → View Samples → Register → Start Ordering

This knowledge base serves as the comprehensive reference for the MyImage photo printing service, covering all essential aspects from business requirements through technical implementation.