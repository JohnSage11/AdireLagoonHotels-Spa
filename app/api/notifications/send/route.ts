import { NextRequest, NextResponse } from 'next/server';
import { formatNaira } from '@/lib/hotel-data';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, booking } = body;

    if (!booking) {
      return NextResponse.json({ error: 'Booking payload is required.' }, { status: 400 });
    }

    const whatsappMessage = [
      `*E kaabo to The Adire Lagoon Hotel & Spa!*`,
      `Your direct booking is confirmed (${booking.reference}).`,
      ``,
      `• *Guest:* ${booking.guestName}`,
      `• *Room:* ${booking.roomName} (${booking.roomsCount} room${booking.roomsCount > 1 ? 's' : ''})`,
      `• *Check-in:* ${booking.checkIn} (from 2:00 pm)`,
      `• *Check-out:* ${booking.checkOut} (by 12:00 noon)`,
      `• *Total:* ${formatNaira(booking.totalAmountNgn)} (${
        booking.paymentStatus === 'paid' ? 'PAID via Paystack' : 'INSTANT HOLD / Pay at Hotel'
      })`,
      booking.promoCode ? `• *Promo Applied:* ${booking.promoCode}` : null,
      ``,
      `Plot 14, Adetokunbo Ademola Street, Victoria Island, Lagos`,
      `24-Hr Front Desk & WhatsApp: +234 800 000 2485`,
    ]
      .filter(Boolean)
      .join('\n');

    // Optional forwarding to configured Meta / Twilio WhatsApp Business webhook
    const whatsappWebhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
    if (whatsappWebhookUrl) {
      await fetch(whatsappWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: booking.guestPhone,
          message: whatsappMessage,
          reference: booking.reference,
        }),
      }).catch(() => {});
    }

    return NextResponse.json({
      delivered: true,
      type: type || 'booking_confirmation',
      reference: booking.reference,
      recipientPhone: booking.guestPhone,
      recipientEmail: booking.guestEmail,
      whatsappPreview: whatsappMessage,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        delivered: false,
        error: error instanceof Error ? error.message : 'Notification dispatch failed',
      },
      { status: 500 }
    );
  }
}
