import { loadStripe, Stripe } from '@stripe/stripe-js';

// Runtime guard to ensure we only use publishable keys
const getStripePublicKey = (): string | null => {
  const key = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  
  console.log('Stripe key initialization:', {
    keyFound: !!key,
    keyPrefix: key ? key.substring(0, 8) : 'undefined',
    envVarName: 'VITE_STRIPE_PUBLIC_KEY',
    fullValue: key ? `${key.substring(0, 12)}...` : 'undefined'
  });
  
  // Log all available Stripe-related environment variables to debug
  console.log('Available Stripe env vars:', {
    VITE_STRIPE_PUBLIC_KEY: import.meta.env.VITE_STRIPE_PUBLIC_KEY ? `${import.meta.env.VITE_STRIPE_PUBLIC_KEY.substring(0, 8)}...` : 'undefined'
  });
  
  if (!key) {
    console.error('Missing VITE_STRIPE_PUBLIC_KEY environment variable');
    return null;
  }
  
  if (key.startsWith('sk_')) {
    console.error('CRITICAL: Secret key detected in frontend! This is a security issue.');
    console.error('Environment variable VITE_STRIPE_PUBLIC_KEY contains:', key.substring(0, 12) + '...');
    throw new Error('Secret key cannot be used in frontend. Please check environment configuration.');
  }
  
  if (!key.startsWith('pk_')) {
    console.error('Invalid Stripe key format. Expected publishable key (pk_...)');
    return null;
  }
  
  return key;
};

// Create a single Stripe promise to prevent multiple initializations
const createStripePromise = (): Promise<Stripe | null> | null => {
  const publicKey = getStripePublicKey();
  
  if (!publicKey) {
    return null;
  }
  
  return loadStripe(publicKey);
};

// Export singleton Stripe promise
export const stripePromise = createStripePromise();

// Utility to check if Stripe is available
export const isStripeAvailable = (): boolean => {
  return stripePromise !== null;
};