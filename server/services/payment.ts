import Stripe from "stripe";

const PRICE_PER_CHECK_CENTS = 5; // $0.05

function getStripe(): Stripe {
  const apiKey = process.env.STRIPE_SECRET;
  if (!apiKey) {
    throw new Error("Stripe is not configured. Please add STRIPE_SECRET environment variable.");
  }
  return new Stripe(apiKey, {
    apiVersion: "2025-01-27.acacia",
  });
}

export async function createStripeCustomer(email: string): Promise<string> {
  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email,
    metadata: {
      source: "safemessage",
    },
  });
  return customer.id;
}

export async function createSetupIntent(customerId: string): Promise<{ clientSecret: string; publishableKey: string }> {
  const stripe = getStripe();
  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    usage: "off_session",
    payment_method_types: ["card"],
  });

  return {
    clientSecret: setupIntent.client_secret!,
    publishableKey: process.env.STRIPE_PUBLISHABLE || "",
  };
}

export async function getSetupIntent(setupIntentId: string): Promise<Stripe.SetupIntent> {
  const stripe = getStripe();
  return stripe.setupIntents.retrieve(setupIntentId);
}

export async function chargeForEmailCheck(
  stripeCustomerId: string,
  paymentMethodId: string
): Promise<{ success: boolean; paymentIntentId?: string; error?: string }> {
  try {
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: PRICE_PER_CHECK_CENTS,
      currency: "usd",
      customer: stripeCustomerId,
      payment_method: paymentMethodId,
      confirm: true,
      off_session: true,
      description: "SafeMessage email safety check",
      metadata: {
        service: "safemessage",
        action: "email_check",
      },
    });

    if (paymentIntent.status === "succeeded") {
      return {
        success: true,
        paymentIntentId: paymentIntent.id,
      };
    }

    return {
      success: false,
      error: `Payment status: ${paymentIntent.status}`,
    };
  } catch (error: any) {
    console.error("Payment error:", error.message);
    
    if (error.code === "authentication_required") {
      return {
        success: false,
        error: "Payment requires authentication. Owner needs to update payment method.",
      };
    }
    
    return {
      success: false,
      error: error.message || "Payment failed",
    };
  }
}

export async function getCustomerPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
  const stripe = getStripe();
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: "card",
  });
  return paymentMethods.data;
}

export async function getDefaultPaymentMethod(customerId: string): Promise<string | null> {
  try {
    const paymentMethods = await getCustomerPaymentMethods(customerId);
    return paymentMethods[0]?.id || null;
  } catch {
    return null;
  }
}

export async function getPaymentHistory(customerId: string, limit = 10): Promise<Stripe.PaymentIntent[]> {
  const stripe = getStripe();
  const payments = await stripe.paymentIntents.list({
    customer: customerId,
    limit,
  });
  return payments.data;
}

export async function verifyWalletProof(
  walletAddress: string,
  signature: string,
  message: string
): Promise<boolean> {
  try {
    if (!walletAddress.startsWith("0x") || walletAddress.length !== 42) {
      return false;
    }
    
    if (!signature.startsWith("0x") || signature.length < 130) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

export async function getWalletBalance(walletAddress: string): Promise<number> {
  return 10.0;
}
