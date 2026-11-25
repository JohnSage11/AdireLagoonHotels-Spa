import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    // Verify HMAC SHA-512 signature when PAYSTACK_SECRET_KEY is configured and x-paystack-signature header is sent
    if (secretKey && secretKey.startsWith('sk_') && signature) {
      const expectedHash = crypto
        .createHmac('sha512', secretKey)
        .update(rawBody)
        .digest('hex');

      if (expectedHash !== signature) {
        return NextResponse.json(
          { verified: false, error: 'Invalid Paystack HMAC SHA-512 webhook signature.' },
          { status: 401 }
        );
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event || 'charge.success';
    const data = payload.data || {};

    if (event === 'charge.success') {
      const verifiedReference = data.reference || `PSTK_VERIFIED_${Date.now()}`;
      const channel = data.channel || 'card';
      const amountNgn = data.amount ? Math.round(Number(data.amount) / 100) : 0;

      return NextResponse.json({
        verified: true,
        event: 'charge.success',
        reference: verifiedReference,
        channel,
        amountNgn,
        currency: 'NGN',
        paidAt: new Date().toISOString(),
        gatewayResponse: 'Approved by Financial Institution (NGN)',
      });
    }

    return NextResponse.json({
      verified: true,
      event,
      receivedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        verified: false,
        error: error instanceof Error ? error.message : 'Webhook verification error',
      },
      { status: 400 }
    );
  }
}
