
/**
 * Payment method types and abstractions for Vishnu Enterprises
 * This design allows adding new payment providers (like Razorpay) easily
 */

export type PaymentMethod = 'cod' | 'upi';

export interface PaymentProvider {
  id: PaymentMethod;
  name: string;
  isActive: boolean;
  processPayment: (orderId: string, amount: number, currency: string) => Promise<PaymentResult>;
  verifyPayment: (paymentId: string, orderId: string) => Promise<boolean>;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  error?: string;
  redirectUrl?: string;
}

export const PAYMENT_METHODS: Record<PaymentMethod, Omit<PaymentProvider, 'processPayment' | 'verifyPayment'>> = {
  cod: {
    id: 'cod',
    name: 'Cash on Delivery',
    isActive: true,
  },
  upi: {
    id: 'upi',
    name: 'UPI',
    isActive: true,
  },
};

export class CODPaymentProvider implements PaymentProvider {
  id: PaymentMethod = 'cod';
  name = 'Cash on Delivery';
  isActive = true;

  async processPayment(): Promise<PaymentResult> {
    // COD doesn't require online payment processing
    return { success: true };
  }

  async verifyPayment(): Promise<boolean> {
    // COD is verified on delivery
    return true;
  }
}

export class UPIPaymentProvider implements PaymentProvider {
  id: PaymentMethod = 'upi';
  name = 'UPI';
  isActive = true;

  async processPayment(): Promise<PaymentResult> {
    // UPI is manual - payment is verified via screenshot
    return { success: true };
  }

  async verifyPayment(): Promise<boolean> {
    // Verification is done manually by admin
    return true;
  }
}

export function getPaymentProvider(method: PaymentMethod): PaymentProvider {
  switch (method) {
    case 'cod':
      return new CODPaymentProvider();
    case 'upi':
      return new UPIPaymentProvider();
    default:
      throw new Error(`Unsupported payment method: ${method}`);
  }
}
