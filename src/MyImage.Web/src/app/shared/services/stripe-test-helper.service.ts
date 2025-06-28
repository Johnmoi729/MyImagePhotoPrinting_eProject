
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';

/**
 * Stripe Test Helper Service for Development
 *
 * Provides utilities for testing Stripe integration with test cards,
 * debugging payment flows, and simulating different payment scenarios.
 *
 * Only available in development mode.
 */
@Injectable({
  providedIn: 'root'
})
export class StripeTestHelperService {

  constructor(private snackBar: MatSnackBar) {}

  /**
   * Get test card numbers for different scenarios
   */
  getTestCards() {
    return {
      // Successful payments
      visa: {
        number: '4242424242424242',
        exp: '12/34',
        cvc: '123',
        description: 'Visa - Always succeeds'
      },
      visaDebit: {
        number: '4000056655665556',
        exp: '12/34',
        cvc: '123',
        description: 'Visa Debit - Always succeeds'
      },
      mastercard: {
        number: '5555555555554444',
        exp: '12/34',
        cvc: '123',
        description: 'Mastercard - Always succeeds'
      },
      amex: {
        number: '378282246310005',
        exp: '12/34',
        cvc: '1234',
        description: 'American Express - Always succeeds'
      },

      // 3D Secure authentication required
      visa3DS: {
        number: '4000002500003155',
        exp: '12/34',
        cvc: '123',
        description: 'Visa - Requires 3D Secure authentication'
      },
      mastercard3DS: {
        number: '5200828282828210',
        exp: '12/34',
        cvc: '123',
        description: 'Mastercard - Requires 3D Secure authentication'
      },

      // Declined cards
      declined: {
        number: '4000000000000002',
        exp: '12/34',
        cvc: '123',
        description: 'Visa - Always declined'
      },
      insufficientFunds: {
        number: '4000000000009995',
        exp: '12/34',
        cvc: '123',
        description: 'Visa - Declined due to insufficient funds'
      },
      lostCard: {
        number: '4000000000009987',
        exp: '12/34',
        cvc: '123',
        description: 'Visa - Declined due to lost card'
      },
      stolenCard: {
        number: '4000000000009979',
        exp: '12/34',
        cvc: '123',
        description: 'Visa - Declined due to stolen card'
      },

      // Processing errors
      processingError: {
        number: '4000000000000119',
        exp: '12/34',
        cvc: '123',
        description: 'Visa - Processing error'
      },
      incorrectCVC: {
        number: '4000000000000127',
        exp: '12/34',
        cvc: '123',
        description: 'Visa - Incorrect CVC'
      }
    };
  }

  /**
   * Auto-fill form with test card data
   */
  fillTestCard(cardType: string, formElement: HTMLFormElement): boolean {
    if (environment.production) {
      console.warn('Test card helper not available in production');
      return false;
    }

    const cards = this.getTestCards();
    const card = (cards as any)[cardType];

    if (!card) {
      this.snackBar.open(`Unknown test card type: ${cardType}`, 'Close', { duration: 3000 });
      return false;
    }

    // Try to fill common card field names
    const cardNumberField = formElement.querySelector('input[name="cardNumber"], input[placeholder*="card"], input[id*="card"]') as HTMLInputElement;
    const expiryField = formElement.querySelector('input[name="expiry"], input[placeholder*="MM/YY"], input[placeholder*="expiry"]') as HTMLInputElement;
    const cvcField = formElement.querySelector('input[name="cvc"], input[name="cvv"], input[placeholder*="CVC"], input[placeholder*="CVV"]') as HTMLInputElement;

    if (cardNumberField) {
      cardNumberField.value = card.number;
      cardNumberField.dispatchEvent(new Event('input', { bubbles: true }));
    }

    if (expiryField) {
      expiryField.value = card.exp;
      expiryField.dispatchEvent(new Event('input', { bubbles: true }));
    }

    if (cvcField) {
      cvcField.value = card.cvc;
      cvcField.dispatchEvent(new Event('input', { bubbles: true }));
    }

    this.snackBar.open(`Filled test card: ${card.description}`, 'Close', { duration: 4000 });
    return true;
  }

  /**
   * Show test card information in console
   */
  logTestCards(): void {
    if (environment.production) return;

    console.group('🎯 Stripe Test Cards');
    console.log('Use these test card numbers for development:');
    console.log('');

    const cards = this.getTestCards();
    Object.entries(cards).forEach(([key, card]) => {
      console.log(`${key}: ${card.number} (${card.description})`);
    });

    console.log('');
    console.log('💡 Tips:');
    console.log('- Use any future expiry date (e.g., 12/34)');
    console.log('- Use any 3-digit CVC (4 digits for Amex)');
    console.log('- 3D Secure cards will show authentication dialog');
    console.groupEnd();
  }

  /**
   * Simulate webhook events for testing
   */
  simulateWebhookEvent(eventType: string, paymentIntentId: string): void {
    if (environment.production) return;

    console.log(`🔔 Simulating Stripe webhook: ${eventType} for ${paymentIntentId}`);

    // In real implementation, this would trigger backend webhook processing
    // For development, we can simulate the effect
    switch (eventType) {
      case 'payment_intent.succeeded':
        this.snackBar.open('✅ Payment succeeded (simulated)', 'Close', { duration: 3000 });
        break;
      case 'payment_intent.payment_failed':
        this.snackBar.open('❌ Payment failed (simulated)', 'Close', { duration: 3000 });
        break;
      case 'payment_intent.requires_action':
        this.snackBar.open('🔐 Payment requires action (simulated)', 'Close', { duration: 3000 });
        break;
      default:
        this.snackBar.open(`📡 Webhook: ${eventType} (simulated)`, 'Close', { duration: 3000 });
    }
  }

  /**
   * Debug payment flow with detailed logging
   */
  debugPaymentFlow(step: string, data: any): void {
    if (environment.production) return;

    console.group(`🔍 Payment Debug: ${step}`);
    console.log('Timestamp:', new Date().toISOString());
    console.log('Data:', data);
    console.trace('Call stack');
    console.groupEnd();
  }

  /**
   * Check Stripe integration health
   */
  async checkStripeHealth(): Promise<{healthy: boolean, issues: string[]}> {
    const issues: string[] = [];

    // Check if Stripe.js is loaded
    if (typeof window !== 'undefined') {
      if (!(window as any).Stripe) {
        issues.push('Stripe.js not loaded');
      }
    }

    // Check environment configuration
    if (!environment.stripe) {
      issues.push('Stripe configuration missing in environment');
    }

    // Check API connectivity (this would be a real API call)
    try {
      // This would normally call /api/stripe/test-connection
      console.log('Stripe health check completed');
    } catch (error) {
      issues.push('API connectivity failed');
    }

    const healthy = issues.length === 0;

    if (healthy) {
      console.log('✅ Stripe integration healthy');
    } else {
      console.warn('⚠️ Stripe integration issues:', issues);
    }

    return { healthy, issues };
  }

  /**
   * Generate test order data for payment testing
   */
  generateTestOrder() {
    return {
      shippingAddress: {
        fullName: 'Test User',
        streetLine1: '123 Test Street',
        streetLine2: 'Apt 4B',
        city: 'Boston',
        state: 'MA',
        postalCode: '02101',
        country: 'USA',
        phone: '+1234567890'
      },
      amount: 27.09,
      currency: 'usd',
      items: [
        {
          name: 'Test Photo Print',
          quantity: 2,
          amount: 13.545
        }
      ]
    };
  }

  /**
   * Display developer shortcuts in console
   */
  showDeveloperShortcuts(): void {
    if (environment.production) return;

    console.group('🚀 Stripe Developer Shortcuts');
    console.log('Available in browser console:');
    console.log('');
    console.log('stripeHelper.logTestCards() - Show all test card numbers');
    console.log('stripeHelper.fillTestCard("visa", formElement) - Auto-fill card form');
    console.log('stripeHelper.checkStripeHealth() - Check integration status');
    console.log('stripeHelper.generateTestOrder() - Get test order data');
    console.log('');
    console.log('💳 Quick test cards:');
    console.log('Success: 4242424242424242');
    console.log('Declined: 4000000000000002');
    console.log('3D Secure: 4000002500003155');
    console.groupEnd();

    // Make helper available globally for console access
    if (typeof window !== 'undefined') {
      (window as any).stripeHelper = this;
    }
  }
}
