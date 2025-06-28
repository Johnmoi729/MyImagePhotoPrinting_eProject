# MyImage Photo Printing Service - Setup Guide

## Prerequisites

### Software Requirements

**Required Installations:**

- **.NET SDK 9.0+**: Download from https://dotnet.microsoft.com/download
- **Node.js 18.0+**: Download from https://nodejs.org
- **MongoDB 6.0+**: Download from https://mongodb.com/try/download/community
- **Git**: Download from https://git-scm.com

**Development Tools (Choose One):**

- Visual Studio 2022
- Visual Studio Code with C# extension
- JetBrains Rider

**External Services:**

- **Stripe Account**: Create test account at https://stripe.com as you will need stripe key
- **MongoDB Compass** (Optional): GUI for MongoDB management

## Step 1: Setup Project

```bash
# Navigate to backend and restore .NET packages
cd src/MyImage.API
dotnet restore

# Navigate to frontend
cd src/MyImage.Web
npm install
```

## Step 2: MongoDB Configuration

### Install and Start MongoDB

### Create Database and Collections

**Open MongoDB shell or Compass:** the intial seed data will be generate one you run the back end

## Step 3: Stripe Configuration

### Get Stripe API Keys (as the system use stripe, it no longer require RSA key legacy encryption anymore)

1. **Create Stripe Account**: Go to https://stripe.com and sign up
2. **Get Test Keys**: Navigate to Developers → API keys
3. **Copy Keys**: Copy both Publishable key (pk*test*...) and Secret key (sk*test*...)

## Step 4: Backend Configuration

### Create Configuration File

**Create `src/MyImage.API/appsettings.Development.json`:**

```json
{
  "ConnectionStrings": {
    "MongoDB": "mongodb://localhost:27017/myimage"
  },
  "JwtSettings": {
    "Secret": "your-256-bit-secret-key-for-jwt-tokens-that-is-at-least-32-characters-long",
    "Issuer": "MyImage",
    "Audience": "MyImage",
    "ExpirationHours": 24
  },
  "GridFsSettings": {
    "BucketName": "photos",
    "ChunkSizeBytes": 1048576
  },
  "Stripe": {
    "SecretKey": "your_own_secret_stripe_key",
    "PublishableKey": "your_own_public_stripe_key",
    "ReturnUrl": "http://localhost:4200/payment-complete",
    "CancelUrl": "http://localhost:4200/payment-cancel"
  },
  "AppSettings": {
    "BaseUrl": "https://localhost:7037",
    "FrontendUrl": "http://localhost:4200",
    "MaxFileUploadSize": 52428800,
    "AllowedImageFormats": [".jpg", ".jpeg"],
    "ThumbnailMaxWidth": 300,
    "ThumbnailMaxHeight": 300
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "MyImage": "Debug"
    }
  },
  "AllowedHosts": "*"
}
```

### Update Stripe Keys

**Replace the following in your configuration:**

- `your_own_secret_stripe_key` → Your actual Stripe secret key
- `your_own_public_stripe_key` → Your actual Stripe publishable key

**Create `src/MyImage.API/Properties/launchSettings.json`:**

```json
{
  "$schema": "https://json.schemastore.org/launchsettings.json",
  "profiles": {
    "http": {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": false,
      "applicationUrl": "http://localhost:5159",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    },
    "https": {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": false,
      "applicationUrl": "https://localhost:7037;http://localhost:5159",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  }
}
```

## Step 5: Frontend Configuration

### Create Environment Files

**Create `src/MyImage.Web/src/environments/environment.ts`:**

```typescript
export const environment = {
  production: false,

  // API Configuration
  apiUrl: "https://localhost:7037/api",

  // Photo upload settings
  maxFileSize: 52428800, // 50MB
  supportedFormats: [".jpg", ".jpeg"],

  // UI configuration
  defaultPageSize: 20,
  imageConfig: {
    thumbnailMaxWidth: 300,
    thumbnailMaxHeight: 300,
    galleryPageSize: 12,
  },

  // Authentication
  tokenKey: "myimage_token",

  // Stripe Configuration
  stripe: {
    // Will be loaded from backend API at runtime
    publishableKey: "", // Set via /api/stripe/config endpoint
    testMode: true,

    // Payment configuration
    currency: "usd",
    country: "US",

    // Return URLs for payment completion
    paymentCompleteUrl: "http://localhost:4200/payment-complete",
    paymentCancelUrl: "http://localhost:4200/payment-cancel",

    // UI appearance settings
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#3f51b5",
        colorBackground: "#ffffff",
        colorText: "#30313d",
        colorDanger: "#df1b41",
        fontFamily: "Roboto, system-ui, sans-serif",
        spacingUnit: "4px",
        borderRadius: "8px",
      },
    },

    // Payment element options
    paymentElementOptions: {
      layout: "tabs",
      paymentMethodOrder: ["card", "apple_pay", "google_pay"],
    },

    // Test card numbers for development
    testCards: {
      visa: "4242424242424242",
      visaDebit: "4000056655665556",
      mastercard: "5555555555554444",
      amex: "378282246310005",
      declined: "4000000000000002",
      insufficientFunds: "4000000000009995",
      requiresAuth: "4000002500003155",
    },
  },

  // Legacy encryption for non-Stripe payments
  encryptionPublicKey: "",

  // Debug settings for development
  enableDebugMode: true,
  logApiCalls: true,
  logStripeEvents: true,

  // Test mode settings
  enableTestMode: true,
  testCards: {
    visa: "4242424242424242",
    visaDebit: "4000056655665556",
    mastercard: "5555555555554444",
    amex: "378282246310005",
    declined: "4000000000000002",
  },
};
```

**Create `src/MyImage.Web/src/environments/environment.prod.ts`:**

```typescript
export const environment = {
  production: true,

  // Production API - will be set during deployment
  apiUrl: "/api",

  // Photo upload settings
  maxFileSize: 52428800, // 50MB
  supportedFormats: [".jpg", ".jpeg"],

  // UI configuration
  defaultPageSize: 20,
  imageConfig: {
    thumbnailMaxWidth: 300,
    thumbnailMaxHeight: 300,
    galleryPageSize: 12,
  },

  // Authentication
  tokenKey: "myimage_token",

  // Stripe Configuration - Production
  stripe: {
    // Will be loaded from backend API at runtime
    publishableKey: "", // Set via /api/stripe/config endpoint

    // Payment configuration
    currency: "usd",
    country: "US",

    // Production return URLs
    paymentCompleteUrl: "https://your-domain.com/payment-complete",
    paymentCancelUrl: "https://your-domain.com/payment-cancel",

    // UI appearance settings
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#3f51b5",
        colorBackground: "#ffffff",
        colorText: "#30313d",
        colorDanger: "#df1b41",
        fontFamily: "Roboto, system-ui, sans-serif",
        spacingUnit: "4px",
        borderRadius: "8px",
      },
    },

    // Payment element options
    paymentElementOptions: {
      layout: "tabs",
      paymentMethodOrder: ["card", "apple_pay", "google_pay"],
    },
  },

  // Legacy encryption for non-Stripe payments
  encryptionPublicKey: "",

  // Production settings
  enableDebugMode: false,
  logApiCalls: false,
  enableTestMode: false,
  testCards: {},
};
```

## Step 7: Run the Application

### Start Backend API (run on port https)

```bash
cd src/MyImage.API
dotnet run --launch-profile https
```

**Expected Output:**

```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: https://localhost:7037
info: Microsoft.Hosting.Lifetime[0]
      Application started. Press Ctrl+C to shut down.
```

### Start Frontend Application

```bash
# In a new terminal
cd src/MyImage.Web
ng serve
```

**Expected Output:**

```
** Angular Live Development Server is listening on localhost:4200 **
✔ Compiled successfully.
```

## Step 8: Verify Setup

### Test API Endpoints

```bash
# Test health endpoint
curl https://localhost:7037/api/health

# Test Stripe configuration
curl https://localhost:7037/api/stripe/config
```

### Test Frontend

1. **Open Browser**: Navigate to http://localhost:4200
2. **Check Landing Page**: Should load without errors
3. **Test Registration**: Create a test account
4. **Test Login**: Log in with created account

### Create Admin User

```javascript
// Connect to MongoDB and run:
use myimage_dev

// First, register a normal user through the UI
// Then update their role to admin
db.users.updateOne(
  { email: "admin@test.com" },  // Replace with your admin email
  { $set: { role: "admin" } }
)
```

## Common Issues and Solutions

### MongoDB Connection Issues

**Problem**: Cannot connect to MongoDB
**Solution**:

```bash
# Check if MongoDB is running
mongosh
# If fails, start MongoDB service
# Windows: net start MongoDB
# macOS: brew services start mongodb-community@6.0
```

### Stripe Integration Issues

**Problem**: Stripe configuration not loading
**Solution**: Verify API keys are correctly set in `appsettings.Development.json`

### CORS Errors

**Problem**: Frontend cannot connect to backend
**Solution**: Ensure `CorsOrigins` includes `http://localhost:4200` in backend configuration

### SSL Certificate Errors

**Problem**: Browser shows security warnings
**Solution**: Trust the self-signed certificate or use HTTP in development

## Test Data for Development

### Test User Accounts

**Customer Account:**

- Email: customer@test.com
- Password: Test123!@#

**Admin Account:**

- Email: admin@myimage.com
- Password: Admin123!@#
- (Remember to update role to "admin" in database)

### Test Credit Cards (Development Only)

- **Successful Payment**: 4242424242424242
- **Declined Payment**: 4000000000000002
- **Requires 3D Secure**: 4000002500003155

**Any future expiry date and any 3-digit CVC**

## Next Steps

1. **Test All Features**: Upload photos, create orders, process payments
2. **Admin Testing**: Test order management and status updates
3. **API Testing**: Use Postman to test API endpoints
4. **Production Setup**: Configure for production deployment when ready

For additional support, refer to the User Guide section of the eProject report or check the troubleshooting section for common issues.
