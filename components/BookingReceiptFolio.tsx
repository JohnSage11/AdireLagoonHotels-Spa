'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Check,
  Printer,
  MessageCircle,
  Calendar,
  User,
  BedDouble,
  CreditCard,
  ShieldCheck,
  Sparkles,
  MapPin,
} from 'lucide-react';
import {
  BookingRecord,
  BOOKING_ADD_ONS,
  ADIRE_HOTEL_COORDINATES,
  formatNaira,
  resolveHotelImageUrl,
} from '@/lib/hotel-data';

interface BookingReceiptFolioProps {
  booking: BookingRecord;
  onClose?: () => void;
}

export function getBookingValidityStatus(booking: BookingRecord) {
  const todayStr = new Date().toISOString().slice(0, 10);

  if (booking.bookingStatus === 'cancelled' || booking.paymentStatus === 'refunded') {
    return {
      state: 'cancelled' as const,
      isValid: false,
      badgeText: 'CANCELLED / VOID',
      headline: 'This booking has been cancelled and is no longer valid for check-in.',
      subtext: `Original stay window: ${booking.checkIn} to ${booking.checkOut}`,
    };
  }

  if (todayStr > booking.checkOut) {
    return {
      state: 'expired' as const,
      isValid: false,
      badgeText: 'EXPIRED · STAY PERIOD ENDED',
      headline: `Booking validity expired after ${booking.checkOut} (12:00 noon).`,
      subtext: `Reservations remain valid strictly for the booked date range (${booking.checkIn} to ${booking.checkOut}).`,
    };
  }

  if (todayStr >= booking.checkIn && todayStr <= booking.checkOut) {
    return {
      state: 'active' as const,
      isValid: true,
      badgeText: 'VALID · ACTIVE STAY WINDOW',
      headline: `Valid & Active Stay — ${booking.checkIn} (2:00 pm) to ${booking.checkOut} (12:00 noon)`,
      subtext: `Present this Booking Code (${booking.reference}) at Front Desk reception in Victoria Island.`,
    };
  }

  return {
    state: 'upcoming' as const,
    isValid: true,
    badgeText: 'VALID FOR BOOKED STAY DATES',
    headline: `Valid Strictly from ${booking.checkIn} (2:00 pm) to ${booking.checkOut} (12:00 noon)`,
    subtext: `Guaranteed for ${booking.nights} ${booking.nights === 1 ? 'night' : 'nights'} · Keep Booking Code ${booking.reference} for arrival check-in.`,
  };
}

export default function BookingReceiptFolio({ booking, onClose }: BookingReceiptFolioProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const validity = getBookingValidityStatus(booking);
  const logoSrc = resolveHotelImageUrl('/images/hotel_doc_0.jpg');

  const handleCopyCode = () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(booking.reference);
      } else {
        const el = document.createElement('textarea');
        el.value = booking.reference;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
    } catch {
      // Fallback handled silently
    }
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const resolvedAddOnNames = (booking.selectedAddOns || []).map((id) => {
    const match = BOOKING_ADD_ONS.find((a) => a.id === id);
    return match ? match.name : id;
  });

  const paymentMethodLabel =
    booking.paymentMethod === 'paystack_card'
      ? 'Paystack Card (Visa / Mastercard / Verve)'
      : booking.paymentMethod === 'paystack_transfer'
      ? 'Paystack Instant Bank Transfer'
      : booking.paymentMethod === 'paystack_ussd'
      ? 'Paystack USSD Banking'
      : 'Pay at Hotel Reception (Guaranteed Hold)';

  const formattedIssueDate = (() => {
    try {
      return new Date(booking.createdAt).toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return booking.createdAt.slice(0, 10);
    }
  })();

  const qrPayload = JSON.stringify({
    hotel: 'The Adire Lagoon Hotel & Spa',
    code: booking.reference,
    guest: booking.guestName,
    room: booking.roomName,
    roomsCount: booking.roomsCount,
    validFrom: booking.checkIn,
    validTo: booking.checkOut,
    totalNgn: booking.totalAmountNgn,
    status: validity.badgeText,
  });

  return (
    <div className="bg-white rounded-2xl border-2 border-[#C8963E]/60 shadow-2xl overflow-hidden text-stone-900 print:shadow-none print:border-stone-300">
      {/* 1. LUXURY FOLIO HEADER */}
      <div className="bg-[#0B2545] text-white px-5 sm:px-8 py-6 border-b-2 border-[#C8963E] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-14 rounded-xl bg-white p-1.5 shrink-0 border border-[#D4A359]/40 shadow-md">
              <Image
                src={logoSrc}
                alt="The Adire Lagoon Hotel & Spa Crest"
                fill
                sizes="80px"
                referrerPolicy="no-referrer"
                className="object-contain"
              />
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#D4A359]">
                Official Digital Reservation Receipt
              </p>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-white leading-tight mt-0.5">
                The Adire Lagoon Hotel &amp; Spa
              </h3>
              <p className="text-xs text-stone-300 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#D4A359] shrink-0" />
                <span>{ADIRE_HOTEL_COORDINATES.address}</span>
              </p>
            </div>
          </div>

          {/* Right Booking Code Seal */}
          <div className="bg-[#071930] border border-[#D4A359]/50 rounded-xl px-4 py-3 text-left sm:text-right shrink-0">
            <p className="text-[10px] font-mono uppercase tracking-widest text-stone-300">
              Booking Code
            </p>
            <div className="flex sm:justify-end items-center gap-2 mt-0.5">
              <span className="font-mono text-lg sm:text-xl font-bold text-[#D4A359] tracking-wider tabular-nums">
                {booking.reference}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Copy Booking Code"
                aria-label="Copy Booking Code"
              >
                {copiedCode ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-[#D4A359]" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-stone-400 font-mono mt-0.5">
              Issued: {formattedIssueDate}
            </p>
          </div>
        </div>
      </div>

      {/* 2. STAY DATE-RANGE VALIDITY BANNER */}
      <div
        className={`px-5 sm:px-8 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          validity.state === 'active' || validity.state === 'upcoming'
            ? 'bg-emerald-950 text-emerald-50 border-emerald-800'
            : validity.state === 'expired'
            ? 'bg-amber-950 text-amber-50 border-amber-800'
            : 'bg-red-950 text-red-50 border-red-800'
        }`}
      >
        <div className="flex items-start sm:items-center gap-3">
          {validity.isValid ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
          ) : validity.state === 'expired' ? (
            <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
          ) : (
            <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5 sm:mt-0" />
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#D4A359]">
                {validity.badgeText}
              </span>
              <span className="text-white/40" aria-hidden="true">
                ·
              </span>
              <span className="text-xs font-mono text-stone-200">
                {booking.nights} {booking.nights === 1 ? 'Night' : 'Nights'} Stay Window
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-white mt-0.5">
              {validity.headline}
            </p>
            <p className="text-[11px] text-stone-300 mt-0.5">{validity.subtext}</p>
          </div>
        </div>

        <div className="shrink-0 text-left sm:text-right font-mono text-xs bg-black/25 px-3.5 py-2 rounded-lg border border-white/10">
          <p className="text-[10px] uppercase tracking-wider text-stone-300">Valid Stay Dates</p>
          <p className="font-bold text-[#D4A359] tabular-nums">
            {booking.checkIn} → {booking.checkOut}
          </p>
        </div>
      </div>

      {/* 3. CONCISE & DETAILED BOOKING PARTICULARS */}
      <div className="p-5 sm:p-8 bg-[#FAF7F2] space-y-6">
        {/* Top 4-Metric Check-In / Check-Out / Room / Status Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-stone-200/90">
            <p className="text-[10px] font-mono uppercase tracking-wider text-stone-500 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#C8963E]" /> Check-In Date
            </p>
            <p className="font-mono text-sm sm:text-base font-bold text-[#0B2545] mt-1 tabular-nums">
              {booking.checkIn}
            </p>
            <p className="text-[11px] text-stone-500">From 2:00 pm ({booking.arrivalTime})</p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-stone-200/90">
            <p className="text-[10px] font-mono uppercase tracking-wider text-stone-500 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#C8963E]" /> Check-Out Date
            </p>
            <p className="font-mono text-sm sm:text-base font-bold text-[#0B2545] mt-1 tabular-nums">
              {booking.checkOut}
            </p>
            <p className="text-[11px] text-stone-500">
              By 12:00 noon ({booking.nights} {booking.nights === 1 ? 'night' : 'nights'})
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-stone-200/90">
            <p className="text-[10px] font-mono uppercase tracking-wider text-stone-500 flex items-center gap-1">
              <BedDouble className="w-3 h-3 text-[#C8963E]" /> Accommodation
            </p>
            <p className="font-serif text-sm sm:text-base font-bold text-[#0B2545] mt-1 truncate">
              {booking.roomName}
            </p>
            <p className="text-[11px] text-stone-500">
              {booking.roomsCount} {booking.roomsCount === 1 ? 'Room' : 'Rooms'} · {booking.adults}{' '}
              {booking.adults === 1 ? 'Adult' : 'Adults'}
              {booking.children > 0
                ? `, ${booking.children} ${booking.children === 1 ? 'Child' : 'Children'}`
                : ''}
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-stone-200/90">
            <p className="text-[10px] font-mono uppercase tracking-wider text-stone-500 flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-[#C8963E]" /> Payment Status
            </p>
            <p
              className={`font-mono text-sm sm:text-base font-bold mt-1 ${
                booking.paymentStatus === 'paid'
                  ? 'text-emerald-800'
                  : booking.paymentStatus === 'pending_hold'
                  ? 'text-amber-800'
                  : 'text-red-800'
              }`}
            >
              {booking.paymentStatus === 'paid'
                ? 'PAID IN FULL'
                : booking.paymentStatus === 'pending_hold'
                ? 'HOTEL HOLD'
                : 'REFUNDED'}
            </p>
            <p className="text-[11px] text-stone-500 truncate" title={booking.paystackReference}>
              Ref: {booking.paystackReference}
            </p>
          </div>
        </div>

        {/* 2-Column Detailed Guest Profile & Itemized Financial Folio */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 5 Cols: Guest Details & Special Requests + QR Seal */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                <h4 className="font-serif text-base font-bold text-[#0B2545] flex items-center gap-2">
                  <User className="w-4 h-4 text-[#C8963E]" />
                  <span>Registered Guest Details</span>
                </h4>
                <span className="text-[11px] font-mono text-stone-500 uppercase">
                  {booking.bookingStatus.replace('_', ' ')}
                </span>
              </div>

              <dl className="space-y-2.5 text-xs">
                <div className="flex justify-between gap-2">
                  <dt className="text-stone-500">Primary Guest:</dt>
                  <dd className="font-semibold text-stone-900 text-right">{booking.guestName}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-stone-500">Email Address:</dt>
                  <dd className="font-mono text-stone-800 text-right break-all">
                    {booking.guestEmail}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-stone-500">WhatsApp / Phone:</dt>
                  <dd className="font-mono text-stone-800 text-right">{booking.guestPhone}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-stone-500">Arrival Window:</dt>
                  <dd className="font-medium text-stone-800 text-right">{booking.arrivalTime}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-stone-500">Payment Channel:</dt>
                  <dd className="font-medium text-stone-800 text-right">{paymentMethodLabel}</dd>
                </div>
                {booking.specialRequests && booking.specialRequests !== 'None' && (
                  <div className="pt-2 border-t border-stone-100">
                    <dt className="text-stone-500 mb-1">Special Requests &amp; Preferences:</dt>
                    <dd className="text-stone-800 bg-[#FAF7F2] p-2.5 rounded-lg border border-stone-200/80 italic">
                      &ldquo;{booking.specialRequests}&rdquo;
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Digital QR Verification Block */}
            <div className="bg-white p-4 rounded-xl border border-stone-200 flex items-center gap-4">
              <div className="p-2 bg-[#FAF7F2] rounded-lg border border-stone-200 shrink-0">
                <QRCodeSVG
                  value={qrPayload}
                  size={76}
                  bgColor="#FAF7F2"
                  fgColor="#0B2545"
                  level="M"
                />
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#C8963E] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Front-Desk Express Check-In Seal
                </p>
                <p className="font-semibold text-[#0B2545]">
                  Code: <span className="font-mono">{booking.reference}</span>
                </p>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Valid strictly for {booking.checkIn} to {booking.checkOut}. Present this receipt
                  or Booking Code at reception upon arrival.
                </p>
              </div>
            </div>
          </div>

          {/* Right 7 Cols: Itemized Financial Folio */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-stone-200 overflow-hidden">
            <div className="bg-[#0B2545]/5 px-5 py-3.5 border-b border-stone-200 flex items-center justify-between">
              <h4 className="font-serif text-base font-bold text-[#0B2545] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C8963E]" />
                <span>Itemized Stay &amp; Tax Breakdown (NGN ₦)</span>
              </h4>
              <span className="text-[11px] font-mono text-stone-500">
                Ref: {booking.reference}
              </span>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="flex items-start justify-between gap-4 pb-2.5 border-b border-stone-100">
                <div>
                  <p className="font-semibold text-stone-900">
                    {booking.roomName} ({booking.roomsCount}{' '}
                    {booking.roomsCount === 1 ? 'Room' : 'Rooms'} × {booking.nights}{' '}
                    {booking.nights === 1 ? 'Night' : 'Nights'})
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Check-in {booking.checkIn} · Check-out {booking.checkOut}
                  </p>
                </div>
                <span className="font-mono font-semibold text-stone-900 tabular-nums shrink-0">
                  {formatNaira(booking.roomSubtotalNgn)}
                </span>
              </div>

              {/* Selected Add-Ons */}
              <div className="flex items-start justify-between gap-4 pb-2.5 border-b border-stone-100">
                <div>
                  <p className="font-medium text-stone-800">Selected Extras &amp; Add-Ons</p>
                  <p className="text-[11px] text-stone-500">
                    {resolvedAddOnNames.length > 0
                      ? resolvedAddOnNames.join(' · ')
                      : 'Complimentary 24/7 power, fibre Wi-Fi & welcome Adire Chapman included'}
                  </p>
                </div>
                <span className="font-mono font-medium text-stone-800 tabular-nums shrink-0">
                  {booking.addOnsTotalNgn > 0 ? formatNaira(booking.addOnsTotalNgn) : '₦0'}
                </span>
              </div>

              {/* Promo Discount */}
              {booking.discountAmountNgn > 0 && (
                <div className="flex items-center justify-between gap-4 pb-2.5 border-b border-stone-100 text-emerald-800">
                  <span>
                    Direct Booking Discount{' '}
                    {booking.promoCode ? `(Promo Code: ${booking.promoCode})` : ''}
                  </span>
                  <span className="font-mono font-semibold tabular-nums shrink-0">
                    -{formatNaira(booking.discountAmountNgn)}
                  </span>
                </div>
              )}

              {/* Statutory Taxes & Service Charge */}
              <div className="space-y-1.5 pt-1 text-stone-600">
                <div className="flex items-center justify-between">
                  <span>Federal Value Added Tax (VAT · 7.5%)</span>
                  <span className="font-mono tabular-nums">{formatNaira(booking.vatAmountNgn)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Lagos State Hotel Consumption Tax (5%)</span>
                  <span className="font-mono tabular-nums">
                    {formatNaira(booking.consumptionTaxNgn)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Hotel Service Charge (10%)</span>
                  <span className="font-mono tabular-nums">
                    {formatNaira(booking.serviceChargeNgn)}
                  </span>
                </div>
              </div>

              {/* Grand Total Bar */}
              <div className="mt-4 pt-4 border-t-2 border-dashed border-stone-300 flex items-baseline justify-between gap-4">
                <div>
                  <p className="font-serif text-base font-bold text-[#0B2545]">
                    {booking.paymentStatus === 'paid'
                      ? 'Total Amount Paid'
                      : 'Total Amount Due at Reception'}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Inclusive of VAT, Lagos Consumption Tax &amp; Service Charge
                  </p>
                </div>
                <span className="font-mono text-xl sm:text-2xl font-bold text-[#0B2545] tabular-nums">
                  {formatNaira(booking.totalAmountNgn)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. RECEIPT ACTION FOOTER */}
        <div className="pt-3 border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <p className="text-[11px] text-stone-500">
            24-Hr Front Desk &amp; Concierge: <strong className="text-stone-700">+234 800 000 2485</strong> · Victoria Island, Lagos
          </p>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3.5 py-2 text-xs font-semibold text-[#0B2545] bg-white hover:bg-stone-100 border border-stone-300 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Copied {booking.reference}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#C8963E]" />
                  <span>Copy Booking Code</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 text-xs font-semibold text-[#0B2545] bg-white hover:bg-stone-100 border border-stone-300 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-[#0B2545]" />
              <span>Print / Save PDF Receipt</span>
            </button>

            <a
              href={`https://wa.me/2348000002485?text=${encodeURIComponent(
                `E kaabo Adire Lagoon Front Desk! Here is my official booking receipt code ${booking.reference} for ${booking.guestName} (${booking.roomName}, Valid Stay: ${booking.checkIn} to ${booking.checkOut}, Total: ${formatNaira(booking.totalAmountNgn)}).`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Front Desk</span>
            </a>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0B2545] hover:bg-[#163a66] rounded-lg cursor-pointer transition-colors"
              >
                Close Receipt
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
