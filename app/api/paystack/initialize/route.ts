import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      amountNgn,
      guestName,
      guestPhone,
      roomName,
      checkIn,
      checkOut,
      channels = ['card', 'bank_transfer', 'ussd'],
    } = body;

    if (!email || !amountNgn || Number(amountNgn) <= 0) {
      return NextResponse.json(
        { error: 'Valid guest email and positive Naira amount are required.' },
        { status: 400 }
      );
    }

    const amountInKobo = Math.round(Number(amountNgn) * 100);
    const reference = `PSTK_ADL_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    // If a live/test Paystack Secret Key is configured in env, call Paystack Transaction Initialize API
    if (secretKey && secretKey.startsWith('sk_')) {
      const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: amountInKobo,
          currency: 'NGN',
          reference,
          channels,
          metadata: {
            hotel: 'The Adire Lagoon Hotel & Spa, Victoria Island, Lagos',
            guest_name: guestName,
            guest_phone: guestPhone,
            room_name: roomName,
            check_in: checkIn,
            check_out: checkOut,
          },
        }),
      });

      const paystackData = await paystackRes.json();
      if (paystackData.status && paystackData.data) {
        return NextResponse.json({
          mode: 'live_api',
          reference: paystackData.data.reference,
          authorizationUrl: paystackData.data.authorization_url,
          accessCode: paystackData.data.access_code,
          amountNgn,
          amountInKobo,
          currency: 'NGN',
        });
      }
    }

    // Interactive Paystack Test-Mode Simulator fallback (supports Card, Bank Transfer & USSD out-of-the-box)
    return NextResponse.json({
      mode: 'interactive_test',
      reference,
      accessCode: `ACC_${reference}`,
      amountNgn,
      amountInKobo,
      currency: 'NGN',
      virtualAccount: {
        bankName: 'Paystack-Titan Trust Bank',
        accountNumber: '9048291044',
        accountName: 'THE ADIRE LAGOON HOTEL & SPA VI',
      },
      ussdCodes: [
        { bank: 'GTBank', code: `*737*000*${Math.floor(1000 + Math.random() * 8999)}#` },
        { bank: 'Access Bank', code: `*901*000*${Math.floor(1000 + Math.random() * 8999)}#` },
        { bank: 'Zenith Bank', code: `*966*000*${Math.floor(1000 + Math.random() * 8999)}#` },
        { bank: 'UBA', code: `*919*000*${Math.floor(1000 + Math.random() * 8999)}#` },
      ],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Unable to initialize Paystack transaction.',
      },
      { status: 500 }
    );
  }
}
