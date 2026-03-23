import Razorpay from 'razorpay';
import crypto from 'crypto';

let razorpayClient: Razorpay | null = null;

export const getRazorpayClient = (): Razorpay => {
  if (!razorpayClient) {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!key_id || !key_secret) {
      console.warn('Razorpay keys are not set. Using dummy keys for development.');
    }
    
    razorpayClient = new Razorpay({
      key_id: key_id || 'dummy_key_id',
      key_secret: key_secret || 'dummy_key_secret',
    });
  }
  return razorpayClient;
};

export const createRazorpayOrder = async (amount: number, receipt: string) => {
  const options = {
    amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
    currency: 'INR',
    receipt,
  };
  return await getRazorpayClient().orders.create(options);
};

export const verifyRazorpaySignature = (
  orderId: string,
  paymentId: string,
  signature: string
): boolean => {
  const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret';
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
};
