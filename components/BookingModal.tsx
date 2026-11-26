'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Check,
  ShieldCheck,
  CreditCard,
  Building2,
  Smartphone,
  MessageCircle,
  Sparkles,
  Calendar,
  Users,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Copy,
  Maximize2,
  Lock,
} from 'lucide-react';
import {
  RoomCategory,
  BOOKING_ADD_ONS,
  BookingRecord,
  formatNaira,
  resolveHotelImageUrl,
} from '@/lib/hotel-data';
import { useHotelStore } from '@/lib/hotel-store';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import BookingReceiptFolio from '@/components/BookingReceiptFolio';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRoom: RoomCategory | null;
  onSelectRoom: (room: RoomCategory) => void;
  checkIn: string;
  setCheckIn: (val: string) => void;
  checkOut: string;
  setCheckOut: (val: string) => void;
  adults: number;
  setAdults: (val: number) => void;
  childrenCount: number;
  setChildrenCount: (val: number) => void;
  roomsCount: number;
  setRoomsCount: (val: number) => void;
  initialPromoCode?: string;
  initialSelectedAddOns?: string[];
  startAtStep?: 1 | 2 | 3;
  onOpenManageBookingWithCode?: (bookingCode: string) => void;
}

interface PaystackSession {
  mode: string;
  reference: string;
  accessCode: string;
  amountNgn: number;
  virtualAccount?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  ussdCodes?: { bank: string; code: string }[];
}

function buildStaticPaystackSession(amountNgn: number): PaystackSession {
  const ts = Date.now();
  const suffix = Math.floor(1000 + Math.random() * 9000);
  const accessCode = `ACC_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  return {
    mode: 'test_simulator',
    reference: `PSTK_TEST_${ts}_${suffix}`,
    accessCode,
    amountNgn: Math.round(amountNgn),
  };
}

export default function BookingModal({
  isOpen,
  onClose,
  selectedRoom,
  onSelectRoom,
  checkIn,
  setCheckIn,
  checkOut,
  setCheckOut,
  adults,
  setAdults,
  childrenCount,
  setChildrenCount,
  roomsCount,
  setRoomsCount,
  initialPromoCode = '',
  initialSelectedAddOns,
  startAtStep,
  onOpenManageBookingWithCode,
}: BookingModalProps) {
  const {
    rooms,
    promoCodes,
    getEffectiveAvailability,
    createAtomicBooking,
  } = useHotelStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(startAtStep || (selectedRoom ? 3 : 1));
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>(initialSelectedAddOns || []);
  const [promoInput, setPromoInput] = useState<string>(initialPromoCode);
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountPercent: number;
    perkDescription: string;
  } | null>(null);
  const [promoFeedback, setPromoFeedback] = useState<string>('');

  // Guest Details
  const [guestName, setGuestName] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('+234 ');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [arrivalTime, setArrivalTime] = useState<string>('2:00 pm – 4:00 pm');
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [paymentChoice, setPaymentChoice] = useState<'paystack' | 'pay_at_hotel'>('paystack');
  const [paystackChannel, setPaystackChannel] = useState<
    'paystack_card' | 'paystack_transfer' | 'paystack_ussd'
  >('paystack_card');

  // Paystack interactive gateway state
  const [paystackSession, setPaystackSession] = useState<PaystackSession | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [confirmedBooking, setConfirmedBooking] = useState<BookingRecord | null>(null);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);
  const [hasCopiedCode, setHasCopiedCode] = useState<boolean>(false);
  const [copyGateWarning, setCopyGateWarning] = useState<string>('');
  const [expandedPreviewRoom, setExpandedPreviewRoom] = useState<RoomCategory | null>(null);

  // Track prop changes cleanly without synchronous effect cascading
  const [prevOpenKey, setPrevOpenKey] = useState<string>('');
  const addOnsKey = (initialSelectedAddOns || []).join(',');
  const currentOpenKey = `${isOpen}-${selectedRoom?.id || 'none'}-${initialPromoCode}-${addOnsKey}-${startAtStep || 'auto'}`;
  if (isOpen && prevOpenKey !== currentOpenKey) {
    setPrevOpenKey(currentOpenKey);
    setErrorMsg('');
    setPaystackSession(null);
    setConfirmedBooking(null);
    setHasCopiedCode(false);
    setCopiedRef(false);
    setCopyGateWarning('');
    setStep(startAtStep || (selectedRoom ? 3 : 1));
    if (initialSelectedAddOns && initialSelectedAddOns.length > 0) {
      setSelectedAddOns(initialSelectedAddOns);
    }
    if (initialPromoCode) {
      setPromoInput(initialPromoCode);
      const match = promoCodes.find(
        (p) => p.code.toUpperCase() === initialPromoCode.trim().toUpperCase() && p.isActive
      );
      if (match) {
        setAppliedPromo({
          code: match.code,
          discountPercent: match.discountPercent,
          perkDescription: match.perkDescription,
        });
        setPromoFeedback(`Applied ${match.code}: ${match.perkDescription}`);
      }
    }
  } else if (!isOpen && prevOpenKey !== '') {
    setPrevOpenKey('');
  }

  if (!isOpen) return null;

  const activeRoom = selectedRoom || rooms[1] || rooms[0];
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const nights = diffDays > 0 ? diffDays : 1;

  // Pricing Math (Nigerian Naira ₦)
  const roomSubtotalNgn = activeRoom.pricePerNightNgn * nights * roomsCount;

  // Calculate Add-ons
  const totalGuests = Math.max(1, adults + childrenCount);
  const addOnsTotalNgn = selectedAddOns.reduce((sum, addOnId) => {
    const item = BOOKING_ADD_ONS.find((a) => a.id === addOnId);
    if (!item) return sum;
    // Breakfast is complimentary for Executive Suite and The Presidential Suite
    if (item.id === 'breakfast' && activeRoom.breakfastIncluded) {
      return sum;
    }
    // Late check-out is complimentary when LAGOON10 is applied
    if (item.id === 'late_checkout' && appliedPromo?.code === 'LAGOON10') {
      return sum;
    }
    // Small chops platter on arrival is complimentary with WELCOMEHOME
    if (item.id === 'small_chops' && appliedPromo?.code === 'WELCOMEHOME') {
      return sum;
    }
    if (item.pricingModel === 'per_person_per_day') {
      return sum + item.priceNgn * totalGuests * nights;
    }
    if (item.pricingModel === 'per_guest') {
      return sum + item.priceNgn * totalGuests;
    }
    return sum + item.priceNgn;
  }, 0);

  const discountPercent = appliedPromo ? appliedPromo.discountPercent : 0;
  const discountAmountNgn = Math.round((roomSubtotalNgn * discountPercent) / 100);
  const netPreTaxNgn = Math.max(0, roomSubtotalNgn - discountAmountNgn + addOnsTotalNgn);

  // Content Pack Page 4: 7.5% VAT, 5% Consumption Tax, 10% Service Charge
  const vatAmountNgn = Math.round(netPreTaxNgn * 0.075);
  const consumptionTaxNgn = Math.round(netPreTaxNgn * 0.05);
  const serviceChargeNgn = Math.round(netPreTaxNgn * 0.1);
  const totalAmountNgn = netPreTaxNgn + vatAmountNgn + consumptionTaxNgn + serviceChargeNgn;

  const handleApplyPromo = (codeToApply?: string) => {
    const clean = (codeToApply ?? promoInput).trim().toUpperCase();
    if (!clean) {
      setAppliedPromo(null);
      setPromoFeedback('');
      return;
    }
    const found = promoCodes.find((p) => p.code.toUpperCase() === clean && p.isActive);
    if (found) {
      setAppliedPromo({
        code: found.code,
        discountPercent: found.discountPercent,
        perkDescription: found.perkDescription,
      });
      setPromoInput(found.code);
      setPromoFeedback(`Applied ${found.code} (${found.discountPercent}% off): ${found.perkDescription}`);
    } else {
      setAppliedPromo(null);
      setPromoFeedback('Promo code not recognized. Try WELCOMEHOME or LAGOON10.');
    }
  };

  const toggleAddOn = (id: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleProceedToPaymentOrHold = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!guestName.trim() || guestName.trim().length < 2) {
      setErrorMsg('Please check this field and try again: Enter your full name.');
      return;
    }
    if (!guestEmail.trim() || !guestEmail.includes('@')) {
      setErrorMsg('Please check this field and try again: Enter a valid email address.');
      return;
    }
    if (!guestPhone.trim() || guestPhone.trim().length < 7) {
      setErrorMsg('Please check this field and try again: Enter a valid phone or WhatsApp number.');
      return;
    }

    setIsProcessing(true);
    try {
      if (paymentChoice === 'pay_at_hotel') {
        // Direct Corporate / Property Hold
        const created = await createAtomicBooking({
          roomId: activeRoom.id,
          roomName: activeRoom.name,
          checkIn,
          checkOut,
          nights,
          roomsCount,
          adults,
          children: childrenCount,
          guestName,
          guestEmail,
          guestPhone,
          arrivalTime,
          specialRequests,
          selectedAddOns,
          addOnsTotalNgn,
          roomSubtotalNgn,
          promoCode: appliedPromo?.code || '',
          discountAmountNgn,
          vatAmountNgn,
          consumptionTaxNgn,
          serviceChargeNgn,
          totalAmountNgn,
          paymentMethod: 'pay_at_hotel',
          paymentStatus: 'pending_hold',
          paystackReference: '',
          utmSource: 'direct',
        });
        setConfirmedBooking(created);
        setStep(5);
      } else {
        // Initialize Paystack Transaction via /api/paystack/initialize (with client-side fallback for static GitHub Pages)
        try {
          const res = await fetch('/api/paystack/initialize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: guestEmail,
              amountNgn: totalAmountNgn,
              guestName,
              guestPhone,
              roomName: activeRoom.name,
              checkIn,
              checkOut,
            }),
          });
          if (!res.ok) {
            throw new Error('Static or offline fallback');
          }
          const data = await res.json();
          setPaystackSession(data);
        } catch {
          setPaystackSession(buildStaticPaystackSession(totalAmountNgn));
        }
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'An unexpected error occurred during checkout.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompletePaystackPayment = async () => {
    if (!paystackSession) return;
    setIsProcessing(true);
    setErrorMsg('');

    try {
      // 1. Verify transaction via /api/paystack/webhook (with client-side fallback for static GitHub Pages)
      let verifiedReference = paystackSession.reference;
      try {
        const webhookRes = await fetch('/api/paystack/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'charge.success',
            data: {
              reference: paystackSession.reference,
              amount: paystackSession.amountNgn * 100,
              currency: 'NGN',
              channel: paystackChannel.replace('paystack_', ''),
              customer: {
                email: guestEmail,
                name: guestName,
                phone: guestPhone,
              },
            },
          }),
        });
        if (webhookRes.ok) {
          const webhookData = await webhookRes.json();
          if (webhookData?.reference) {
            verifiedReference = webhookData.reference;
          }
        }
      } catch {
        // Static GitHub Pages fallback uses the initialized session reference
      }

      // 2. Commit atomic booking to Firestore & decrement room availability
      const created = await createAtomicBooking({
        roomId: activeRoom.id,
        roomName: activeRoom.name,
        checkIn,
        checkOut,
        nights,
        roomsCount,
        adults,
        children: childrenCount,
        guestName,
        guestEmail,
        guestPhone,
        arrivalTime,
        specialRequests,
        selectedAddOns,
        addOnsTotalNgn,
        roomSubtotalNgn,
        promoCode: appliedPromo?.code || '',
        discountAmountNgn,
        vatAmountNgn,
        consumptionTaxNgn,
        serviceChargeNgn,
        totalAmountNgn,
        paymentMethod: paystackChannel,
        paymentStatus: 'paid',
        paystackReference: verifiedReference,
        utmSource: 'direct',
      });

      setPaystackSession(null);
      setConfirmedBooking(created);
      setStep(5);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Payment verification or room lock failed.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const stepLabels = [
    { num: 1, title: '1. Select Dates' },
    { num: 2, title: '2. Choose Room' },
    { num: 3, title: '3. Add Extras' },
    { num: 4, title: '4. Your Details' },
    { num: 5, title: '5. Confirm' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4 md:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[94dvh] flex flex-col">
        {/* Top Modal Header */}
        <div className="bg-[#0B2545] text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between border-b border-white/10 shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="relative w-14 h-10 sm:w-16 sm:h-11 rounded-md bg-white p-1 shrink-0">
              <Image
                src={resolveHotelImageUrl('/images/hotel_doc_0.jpg')}
                alt="The Adire Lagoon Hotel & Spa Logo"
                fill
                sizes="64px"
                referrerPolicy="no-referrer"
                className="object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs text-[#D4A359] font-medium truncate">
                Best Direct Rate Guarantee · Free Cancellation up to 48h · Welcome Chapman
              </p>
              <h2 className="font-serif text-lg sm:text-xl md:text-2xl font-bold truncate">
                Direct Reservation — The Adire Lagoon Hotel &amp; Spa
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (step === 5 && confirmedBooking && !hasCopiedCode) {
                setCopyGateWarning(
                  `Required before closing: Please click "Copy Booking Code (${confirmedBooking.reference})" below so you can access your receipt anytime in Manage Booking.`
                );
                return;
              }
              onClose();
            }}
            className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="Close booking modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5-Step Progress Bar (from Content Pack Section 18) */}
        <div className="bg-[#FAF7F2] px-4 sm:px-6 py-2.5 sm:py-3 border-b border-stone-200 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          {stepLabels.map((s) => {
            const isCurrent = step === s.num;
            const isDone = step > s.num;
            return (
              <button
                key={s.num}
                type="button"
                disabled={s.num === 5 && !confirmedBooking}
                onClick={() => {
                  if (s.num < 5) setStep(s.num);
                }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isCurrent
                    ? 'bg-[#0B2545] text-white'
                    : isDone
                    ? 'text-emerald-800 bg-emerald-50'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {isDone ? `✓ ${s.title}` : s.title}
              </button>
            );
          })}
        </div>

        {/* Main Scrollable Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto overflow-x-hidden flex-1 space-y-5 sm:space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Reservation Alert</p>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}

          {/* STEP 1: SELECT DATES & INTERACTIVE AVAILABILITY CALENDAR */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h3 className="font-serif text-2xl font-bold text-[#0B2545]">
                  1. Select Your Stay Dates &amp; Guests
                </h3>
                <p className="text-sm text-stone-600 mt-1">
                  Tap your Check-in and Check-out dates on the live calendar below to verify daily room &amp; service availability, or enter dates directly. Check-in is from 2:00 pm; check-out is 12:00 noon.
                </p>
              </div>

              {/* Embedded Interactive Monthly Availability Calendar */}
              <AvailabilityCalendar
                checkIn={checkIn}
                checkOut={checkOut}
                onSelectRange={(nextIn, nextOut) => {
                  setCheckIn(nextIn);
                  setCheckOut(nextOut);
                }}
                targetRoomId={selectedRoom?.id}
                compact
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Check-in Date
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-[#0B2545]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Check-out Date
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    min={checkIn}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-[#0B2545]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Number of Rooms
                  </label>
                  <select
                    value={roomsCount}
                    onChange={(e) => setRoomsCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-[#0B2545]"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'Room' : 'Rooms'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Adults
                  </label>
                  <select
                    value={adults}
                    onChange={(e) => setAdults(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-[#0B2545]"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'Adult' : 'Adults'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Children (Under 12 stay free)
                  </label>
                  <select
                    value={childrenCount}
                    onChange={(e) => setChildrenCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-[#0B2545]"
                  >
                    {[0, 1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'Child' : 'Children'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Promo Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      placeholder="e.g. WELCOMEHOME"
                      className="w-full px-3 py-2.5 text-sm font-mono uppercase border border-stone-300 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyPromo()}
                      className="px-3 py-2 text-xs font-semibold bg-stone-900 text-white rounded-lg hover:bg-stone-800 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#FAF7F2] border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-sm text-stone-700">
                  Selected Duration:{' '}
                  <strong className="font-mono text-[#0B2545]">
                    {nights} {nights === 1 ? 'Night' : 'Nights'}
                  </strong>{' '}
                  ({checkIn} → {checkOut}) · {adults} Adults, {childrenCount} Children ·{' '}
                  {roomsCount} {roomsCount === 1 ? 'Room' : 'Rooms'}
                </div>
                <button
                  type="button"
                  onClick={() => setStep(selectedRoom ? 3 : 2)}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-[#C8963E] hover:bg-[#b5842f] rounded-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  {selectedRoom ? `Continue with ${selectedRoom.name}` : 'Choose Room'}{' '}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CHOOSE ROOM */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-[#0B2545]">
                    2. Choose Your Room or Suite
                  </h3>
                  <p className="text-sm text-stone-600">
                    Click any room photograph to expand a full-size view. Real-time inventory synchronized with our Victoria Island front desk.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Change Dates
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rooms.map((rm) => {
                  const avail = getEffectiveAvailability(rm, checkIn, checkOut);
                  const isSelected = activeRoom.id === rm.id;
                  const isSoldOut = avail.status === 'sold_out' || avail.effectiveAvailable < roomsCount;

                  return (
                    <div
                      key={rm.id}
                      className={`rounded-xl border transition-all flex flex-col justify-between overflow-hidden ${
                        isSelected
                          ? 'border-[#0B2545] bg-[#FAF7F2] ring-1 ring-[#0B2545]'
                          : 'border-stone-200 bg-white'
                      }`}
                    >
                      <div>
                        {/* Expandable Room Image Thumbnail Header */}
                        <div
                          onClick={() => setExpandedPreviewRoom(rm)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setExpandedPreviewRoom(rm);
                            }
                          }}
                          className="relative h-44 w-full bg-stone-900 overflow-hidden group cursor-pointer"
                          aria-label={`Expand photo of ${rm.name}`}
                        >
                          <Image
                            src={resolveHotelImageUrl(rm.imageUrl, rm.id)}
                            alt={rm.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 420px"
                            referrerPolicy="no-referrer"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

                          {/* Top Left Size & Capacity Pill */}
                          <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-xs text-[11px] font-mono text-white">
                            {rm.sizeSqm} sq m · Sleeps {rm.maxGuests}
                          </span>

                          {/* Top Right Expand Photo Trigger */}
                          <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-md bg-[#0B2545]/85 group-hover:bg-[#C8963E] text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors shadow-sm">
                            <Maximize2 className="w-3 h-3" />
                            <span>Expand Photo</span>
                          </span>

                          {/* Bottom View Type Label */}
                          <span className="absolute bottom-2.5 left-3 right-3 text-xs font-medium text-stone-100 truncate">
                            {rm.viewType}
                          </span>
                        </div>

                        <div className="p-4 pb-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-serif text-lg font-bold text-[#0B2545]">
                              {rm.name}
                            </h4>
                            <span
                              className={`text-xs font-semibold shrink-0 ${
                                avail.status === 'available'
                                  ? 'text-emerald-700'
                                  : avail.status === 'limited'
                                  ? 'text-amber-700'
                                  : 'text-red-700'
                              }`}
                            >
                              {avail.label}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 mt-1">
                            Sleeps {rm.maxGuests} · {rm.bedConfig}
                          </p>
                          <p className="text-xs text-stone-600 mt-2 line-clamp-2">
                            {rm.description}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 mt-3 pt-3 border-t border-stone-200/80 flex items-center justify-between gap-2">
                        <div>
                          <span className="font-mono text-base font-bold text-[#0B2545] tabular-nums">
                            {formatNaira(rm.pricePerNightNgn)}
                          </span>
                          <span className="text-xs text-stone-500"> / night</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setExpandedPreviewRoom(rm)}
                            className="px-2.5 py-2 text-xs font-semibold text-[#0B2545] bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            title={`View larger image of ${rm.name}`}
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">View Photo</span>
                          </button>
                          <button
                            type="button"
                            disabled={isSoldOut}
                            onClick={() => {
                              onSelectRoom(rm);
                              setStep(3);
                            }}
                            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                              isSoldOut
                                ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                                : isSelected
                                ? 'bg-[#0B2545] text-white'
                                : 'bg-[#C8963E] text-white hover:bg-[#b5842f]'
                            }`}
                          >
                            {isSoldOut ? 'Sold Out' : isSelected ? 'Selected · Continue' : 'Select Room'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* EXPANDED ROOM PHOTO LIGHTBOX OVERLAY */}
              <AnimatePresence>
                {expandedPreviewRoom && (() => {
                  const previewAvail = getEffectiveAvailability(
                    expandedPreviewRoom,
                    checkIn,
                    checkOut
                  );
                  const previewSoldOut =
                    previewAvail.status === 'sold_out' ||
                    previewAvail.effectiveAvailable < roomsCount;

                  return (
                    <motion.div
                      key={expandedPreviewRoom.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
                      onClick={() => setExpandedPreviewRoom(null)}
                    >
                      <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 14 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 10 }}
                        transition={{ duration: 0.26, ease: 'easeOut' }}
                        className="relative w-full max-w-3xl bg-white rounded-2xl overflow-hidden shadow-2xl border border-stone-200 max-h-[90dvh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* High-Resolution Expanded Room Image */}
                        <div className="relative h-64 sm:h-96 w-full bg-stone-950 shrink-0">
                          <Image
                            src={resolveHotelImageUrl(
                              expandedPreviewRoom.imageUrl,
                              expandedPreviewRoom.id
                            )}
                            alt={expandedPreviewRoom.name}
                            fill
                            sizes="(max-width: 1024px) 100vw, 800px"
                            referrerPolicy="no-referrer"
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30" />

                          <button
                            type="button"
                            onClick={() => setExpandedPreviewRoom(null)}
                            className="absolute top-3.5 right-3.5 px-3 py-1.5 rounded-lg bg-black/70 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <X className="w-4 h-4" />
                            <span>Close Photo</span>
                          </button>

                          <div className="absolute bottom-4 left-4 right-4 text-white flex flex-wrap items-end justify-between gap-3">
                            <div>
                              <p className="text-xs font-mono uppercase tracking-wider text-[#D4A359]">
                                {expandedPreviewRoom.sizeSqm} sq m · {expandedPreviewRoom.bedConfig} ·{' '}
                                {expandedPreviewRoom.viewType}
                              </p>
                              <h4 className="font-serif text-2xl sm:text-3xl font-bold">
                                {expandedPreviewRoom.name}
                              </h4>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-md text-xs font-semibold ${
                                previewAvail.status === 'available'
                                  ? 'bg-emerald-900/90 text-emerald-200 border border-emerald-500/40'
                                  : previewAvail.status === 'limited'
                                  ? 'bg-amber-900/90 text-amber-200 border border-amber-500/40'
                                  : 'bg-red-900/90 text-red-200 border border-red-500/40'
                              }`}
                            >
                              {previewAvail.label}
                            </span>
                          </div>
                        </div>

                      {/* Room Details & Select Footer */}
                      <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
                        <p className="text-sm text-stone-700 leading-relaxed">
                          {expandedPreviewRoom.description}
                        </p>

                        <div className="flex flex-wrap gap-1.5">
                          <span className="px-2.5 py-1 rounded-md bg-[#FAF7F2] border border-stone-200 text-xs font-medium text-[#0B2545]">
                            Sleeps up to {expandedPreviewRoom.maxGuests}
                          </span>
                          <span className="px-2.5 py-1 rounded-md bg-[#FAF7F2] border border-stone-200 text-xs font-medium text-[#0B2545]">
                            {expandedPreviewRoom.bedConfig}
                          </span>
                          {expandedPreviewRoom.amenities.map((amenity) => (
                            <span
                              key={amenity}
                              className="px-2.5 py-1 rounded-md bg-stone-100 text-xs text-stone-700"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>

                        <div className="pt-3 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <span className="font-mono text-xl font-bold text-[#0B2545] tabular-nums">
                              {formatNaira(expandedPreviewRoom.pricePerNightNgn)}
                            </span>
                            <span className="text-xs text-stone-500"> / night</span>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => setExpandedPreviewRoom(null)}
                              className="px-4 py-2.5 text-xs font-semibold text-stone-700 border border-stone-300 hover:bg-stone-100 rounded-lg cursor-pointer"
                            >
                              Back to Rooms
                            </button>
                            <button
                              type="button"
                              disabled={previewSoldOut}
                              onClick={() => {
                                onSelectRoom(expandedPreviewRoom);
                                setExpandedPreviewRoom(null);
                                setStep(3);
                              }}
                              className={`px-5 py-2.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                                previewSoldOut
                                  ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                                  : 'bg-[#C8963E] hover:bg-[#b5842f] text-white'
                              }`}
                            >
                              {previewSoldOut
                                ? 'Sold Out for Selected Dates'
                                : `Select ${expandedPreviewRoom.name} & Continue`}
                            </button>
                          </div>
                        </div>
                      </div>
                      </motion.div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </div>
          )}

          {/* STEP 3: ADD EXTRAS */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-[#0B2545]">
                    3. Enhance Your Stay with Nigerian Hospitality Extras
                  </h3>
                  <p className="text-sm text-stone-600">
                    Selected Room: <strong className="text-[#0B2545]">{activeRoom.name}</strong> ({nights}{' '}
                    {nights === 1 ? 'night' : 'nights'})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Change Room
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {BOOKING_ADD_ONS.map((addon) => {
                  const isChecked = selectedAddOns.includes(addon.id);
                  const isFreeBreakfast =
                    addon.id === 'breakfast' && activeRoom.breakfastIncluded;
                  const isFreeLateCheckout =
                    addon.id === 'late_checkout' && appliedPromo?.code === 'LAGOON10';
                  const isFreeChops =
                    addon.id === 'small_chops' && appliedPromo?.code === 'WELCOMEHOME';

                  return (
                    <div
                      key={addon.id}
                      onClick={() => toggleAddOn(addon.id)}
                      className={`p-4 rounded-xl border transition-colors cursor-pointer flex items-start gap-3.5 ${
                        isChecked
                          ? 'border-[#0B2545] bg-[#FAF7F2]'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center border mt-0.5 shrink-0 ${
                          isChecked
                            ? 'bg-[#0B2545] border-[#0B2545] text-white'
                            : 'border-stone-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold text-stone-900">
                            {addon.name}
                          </h4>
                          <span className="font-mono text-xs font-bold text-[#0B2545] tabular-nums whitespace-nowrap">
                            {isFreeBreakfast || isFreeLateCheckout || isFreeChops
                              ? 'COMPLIMENTARY'
                              : formatNaira(addon.priceNgn)}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 mt-1">{addon.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Promo Code Engine Bar */}
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-stone-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-[#0B2545]">
                      Direct Booking Promo Code
                    </p>
                    <p className="text-xs text-stone-600">
                      Have a promotional code? Enter <strong>WELCOMEHOME</strong> (10% off + complimentary small chops) or <strong>LAGOON10</strong> (10% off + free late check-out).
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      placeholder="Enter promo code"
                      className="px-3 py-2 text-xs font-mono uppercase bg-white border border-stone-300 rounded-lg w-40"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyPromo()}
                      className="px-4 py-2 text-xs font-semibold bg-[#0B2545] text-white rounded-lg hover:bg-[#163a66] cursor-pointer whitespace-nowrap"
                    >
                      Apply Code
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-stone-500">Quick apply:</span>
                  {['WELCOMEHOME', 'LAGOON10'].map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => handleApplyPromo(code)}
                      className={`text-xs font-mono px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                        appliedPromo?.code === code
                          ? 'bg-[#0B2545] text-white border-[#0B2545]'
                          : 'bg-white text-stone-700 border-stone-300 hover:border-[#0B2545]'
                      }`}
                    >
                      {code}
                    </button>
                  ))}
                </div>
                {promoFeedback && (
                  <p className="text-xs font-medium text-emerald-800">{promoFeedback}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-xs font-semibold text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 cursor-pointer"
                >
                  Back to Rooms
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-[#C8963E] hover:bg-[#b5842f] rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  Continue to Your Details <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: YOUR DETAILS & PAYSTACK / HOLD CHECKOUT */}
          {step === 4 && !paystackSession && (
            <form
              onSubmit={handleProceedToPaymentOrHold}
              className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 min-w-0"
            >
              <div className="lg:col-span-7 space-y-4 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#0B2545]">
                    4. Guest Details &amp; Payment Method
                  </h3>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Extras
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 min-w-0">
                  <div className="sm:col-span-2 min-w-0">
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Full Name (as on Government ID / Passport) *
                    </label>
                    <input
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. Chidinma Adebayo"
                      className="w-full px-3.5 py-2.5 min-h-[44px] text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-[#0B2545]"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Phone / WhatsApp Number (for Instant Receipt) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="+234 803 000 0000"
                      className="w-full px-3.5 py-2.5 min-h-[44px] text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-[#0B2545]"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="guest@company.ng"
                      className="w-full px-3.5 py-2.5 min-h-[44px] text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-[#0B2545]"
                    />
                  </div>
                  <div className="sm:col-span-2 min-w-0">
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Estimated Arrival Window (Check-in from 2:00 pm · Free luggage storage for early arrivals)
                    </label>
                    <select
                      value={arrivalTime}
                      onChange={(e) => setArrivalTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 min-h-[44px] text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-[#0B2545]"
                    >
                      <option value="Before 2:00 pm (Early luggage drop)">
                        Before 2:00 pm (Early luggage drop)
                      </option>
                      <option value="2:00 pm – 4:00 pm">2:00 pm – 4:00 pm (Standard Check-in)</option>
                      <option value="4:00 pm – 7:00 pm">4:00 pm – 7:00 pm</option>
                      <option value="7:00 pm – 10:00 pm">7:00 pm – 10:00 pm</option>
                      <option value="Late Arrival (After 10:00 pm — 24h Front Desk)">
                        Late Arrival (After 10:00 pm — 24h Front Desk)
                      </option>
                    </select>
                  </div>
                  <div className="sm:col-span-2 min-w-0">
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Special Requests (Dietary needs, celebrations, prayer mat/Bible/Quran, accessibility needs)
                    </label>
                    <textarea
                      rows={2}
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="Anything we should know? Halal/vegan meals, prayer mat, cots/high chairs, roll-in shower..."
                      className="w-full px-3.5 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-[#0B2545]"
                    />
                  </div>
                </div>

                {/* Payment Mode Selector */}
                <div className="pt-2 space-y-2.5 min-w-0">
                  <label className="block text-xs font-semibold text-stone-700">
                    Choose Payment Option
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentChoice('paystack')}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer min-w-0 ${
                        paymentChoice === 'paystack'
                          ? 'border-[#0B2545] bg-[#FAF7F2]'
                          : 'border-stone-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#0B2545]">
                          Pay Now via Paystack
                        </span>
                        <CreditCard className="w-4 h-4 text-[#C8963E] shrink-0" />
                      </div>
                      <p className="text-xs text-stone-600 mt-1">
                        Instant confirmation via NGN Card (Verve, Mastercard, Visa), Bank Transfer or USSD.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentChoice('pay_at_hotel')}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer min-w-0 ${
                        paymentChoice === 'pay_at_hotel'
                          ? 'border-[#0B2545] bg-[#FAF7F2]'
                          : 'border-stone-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#0B2545]">
                          Pay at the Hotel / Corporate Hold
                        </span>
                        <Building2 className="w-4 h-4 text-[#C8963E] shrink-0" />
                      </div>
                      <p className="text-xs text-stone-600 mt-1">
                        Instant room hold for corporate bookings. Pay by Naira transfer or POS at reception.
                      </p>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Full Naira Breakdown (Responsive Stacked & Wrapped Rows on Mobile) */}
              <div className="lg:col-span-5 bg-[#FAF7F2] p-4 sm:p-5 rounded-xl border border-stone-200 flex flex-col justify-between space-y-4 min-w-0 overflow-hidden">
                <div className="space-y-3 min-w-0">
                  <div className="pb-3 border-b border-stone-200 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <p className="text-xs text-stone-500">Selected Accommodation</p>
                    </div>
                    <h4 className="font-serif text-lg font-bold text-[#0B2545] break-words">
                      {activeRoom.name}
                    </h4>
                    <p className="text-xs text-stone-600 mt-0.5 break-words">
                      {checkIn} to {checkOut} ({nights} {nights === 1 ? 'night' : 'nights'}) ·{' '}
                      {roomsCount} {roomsCount === 1 ? 'room' : 'rooms'}
                    </p>
                  </div>

                  <div className="space-y-2.5 text-xs text-stone-700 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 min-w-0">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-stone-800">Room Rate Subtotal</p>
                        <p className="text-[11px] font-mono text-stone-500 break-words">
                          {formatNaira(activeRoom.pricePerNightNgn)} × {nights}{' '}
                          {nights === 1 ? 'night' : 'nights'} × {roomsCount}{' '}
                          {roomsCount === 1 ? 'room' : 'rooms'}
                        </p>
                      </div>
                      <span className="font-mono font-semibold text-stone-900 tabular-nums shrink-0 text-right">
                        {formatNaira(roomSubtotalNgn)}
                      </span>
                    </div>

                    {selectedAddOns.length > 0 && (
                      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 min-w-0">
                        <span className="min-w-0 flex-1 break-words">
                          Selected Extras ({selectedAddOns.length})
                        </span>
                        <span className="font-mono font-semibold text-stone-900 tabular-nums shrink-0 text-right">
                          {formatNaira(addOnsTotalNgn)}
                        </span>
                      </div>
                    )}

                    {appliedPromo && (
                      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 text-emerald-800 font-medium min-w-0">
                        <span className="min-w-0 flex-1 break-words">
                          Promo ({appliedPromo.code} · {appliedPromo.discountPercent}% off)
                        </span>
                        <span className="font-mono font-semibold tabular-nums shrink-0 text-right">
                          -{formatNaira(discountAmountNgn)}
                        </span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-stone-200 space-y-1.5 text-stone-500 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-0.5 min-w-0">
                        <span className="min-w-0 flex-1 break-words">7.5% Federal VAT</span>
                        <span className="font-mono tabular-nums shrink-0 text-right">
                          {formatNaira(vatAmountNgn)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-0.5 min-w-0">
                        <span className="min-w-0 flex-1 break-words">
                          5% Lagos State Consumption Tax
                        </span>
                        <span className="font-mono tabular-nums shrink-0 text-right">
                          {formatNaira(consumptionTaxNgn)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-0.5 min-w-0">
                        <span className="min-w-0 flex-1 break-words">
                          10% Hospitality Service Charge
                        </span>
                        <span className="font-mono tabular-nums shrink-0 text-right">
                          {formatNaira(serviceChargeNgn)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-300 flex flex-wrap items-baseline justify-between gap-2 font-bold text-[#0B2545] min-w-0">
                      <span className="text-sm sm:text-base">Total Due (NGN)</span>
                      <span className="font-mono text-lg sm:text-xl tabular-nums break-all text-right">
                        {formatNaira(totalAmountNgn)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 min-w-0">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-3 px-4 min-h-[46px] text-xs sm:text-sm font-semibold text-white bg-[#0B2545] hover:bg-[#153966] rounded-lg transition-colors cursor-pointer disabled:opacity-50 whitespace-normal break-words text-center leading-snug"
                  >
                    {isProcessing
                      ? 'Finding the best rates & locking room...'
                      : paymentChoice === 'paystack'
                      ? `Pay ${formatNaira(totalAmountNgn)} via Paystack`
                      : `Confirm Instant Hold (${formatNaira(totalAmountNgn)})`}
                  </button>
                  <p className="text-[11px] text-stone-500 text-center leading-relaxed">
                    Free cancellation up to 48 hours before arrival. Valid government ID required at check-in.
                  </p>
                </div>
              </div>
            </form>
          )}

          {/* INTERACTIVE PAYSTACK NGN CHECKOUT OVERLAY (Inside Step 4) */}
          {step === 4 && paystackSession && (
            <div className="max-w-lg mx-auto bg-stone-50 border border-stone-200 rounded-xl p-4 sm:p-6 space-y-5 min-w-0 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#09A5DB] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    P
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-stone-900 break-words">
                      Paystack Checkout · The Adire Lagoon Hotel &amp; Spa
                    </h4>
                    <p className="text-xs text-stone-500 truncate">{guestEmail}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <p className="text-xs text-stone-500">Pay</p>
                  <p className="font-mono text-base font-bold text-emerald-700 tabular-nums">
                    {formatNaira(paystackSession.amountNgn)}
                  </p>
                </div>
              </div>

              {/* Channel Selector Tabs: Card / Bank Transfer / USSD */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-200/80 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPaystackChannel('paystack_card')}
                  className={`py-2 px-2 sm:px-3 text-[11px] sm:text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                    paystackChannel === 'paystack_card'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaystackChannel('paystack_transfer')}
                  className={`py-2 px-2 sm:px-3 text-[11px] sm:text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                    paystackChannel === 'paystack_transfer'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Transfer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaystackChannel('paystack_ussd')}
                  className={`py-2 px-2 sm:px-3 text-[11px] sm:text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                    paystackChannel === 'paystack_ussd'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">USSD</span>
                </button>
              </div>

              {paystackChannel === 'paystack_card' && (
                <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-stone-200 space-y-3 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
                    <span>Supported Nigerian Cards</span>
                    <span className="font-semibold text-stone-800">
                      Verve · Mastercard · Visa
                    </span>
                  </div>
                  <div className="p-3 rounded bg-stone-50 border border-stone-200 font-mono text-xs text-stone-700 flex flex-wrap items-center justify-between gap-2">
                    <span className="break-all">4084 08•• •••• 4081 (Test NGN Visa)</span>
                    <span className="text-emerald-700 font-semibold shrink-0">READY</span>
                  </div>
                  <p className="text-xs text-stone-500 break-all">
                    Reference: <span className="font-mono">{paystackSession.reference}</span>
                  </p>
                </div>
              )}

              {paystackChannel === 'paystack_transfer' && (
                <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-stone-200 space-y-2 text-xs min-w-0">
                  <p className="text-stone-600">
                    Transfer exact amount to our dedicated Paystack Virtual Account:
                  </p>
                  <div className="p-3 rounded bg-stone-50 border border-stone-200 space-y-1 break-words">
                    <p className="text-stone-500">
                      Bank:{' '}
                      <strong className="text-stone-900">
                        {paystackSession.virtualAccount?.bankName}
                      </strong>
                    </p>
                    <p className="text-stone-500">
                      Account Number:{' '}
                      <strong className="font-mono text-base text-[#0B2545]">
                        {paystackSession.virtualAccount?.accountNumber}
                      </strong>
                    </p>
                    <p className="text-stone-500">
                      Beneficiary:{' '}
                      <strong className="text-stone-900">
                        {paystackSession.virtualAccount?.accountName}
                      </strong>
                    </p>
                  </div>
                </div>
              )}

              {paystackChannel === 'paystack_ussd' && (
                <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-stone-200 space-y-2 text-xs min-w-0">
                  <p className="text-stone-600">
                    Dial any of the USSD codes below on your registered Nigerian mobile line:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {paystackSession.ussdCodes?.map((u) => (
                      <div
                        key={u.bank}
                        className="p-2.5 rounded bg-stone-50 border border-stone-200 break-words"
                      >
                        <p className="font-semibold text-stone-800">{u.bank}</p>
                        <p className="font-mono text-[#0B2545] mt-0.5 break-all">{u.code}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPaystackSession(null)}
                  className="w-full sm:w-auto px-4 py-2.5 min-h-[42px] text-xs font-semibold text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-100 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleCompletePaystackPayment}
                  className="w-full sm:flex-1 py-2.5 px-4 min-h-[44px] text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-normal break-words text-center leading-snug"
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>
                    {isProcessing
                      ? 'Verifying Paystack Webhook...'
                      : `Authorize & Confirm ${formatNaira(paystackSession.amountNgn)}`}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: CONFIRMATION PAGE WITH MANDATORY BOOKING CODE COPY GATE & PREMIUM RECEIPT FOLIO */}
          {step === 5 && confirmedBooking && (
            <div className="max-w-3xl mx-auto space-y-6 py-2">
              {/* MANDATORY BOOKING CODE COPY VAULT */}
              <div
                className={`rounded-2xl p-5 sm:p-6 border-2 transition-all ${
                  hasCopiedCode
                    ? 'bg-emerald-950 text-white border-emerald-500 shadow-lg'
                    : 'bg-[#0B2545] text-white border-[#C8963E] shadow-2xl'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="space-y-2 text-left">
                    <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#D4A359]">
                      {hasCopiedCode ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="text-emerald-300 font-bold">
                            Booking Code Copied &amp; Verified
                          </span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 text-[#D4A359] shrink-0" />
                          <span className="font-bold">
                            Mandatory Step Before Closing · Save Your Booking Code
                          </span>
                        </>
                      )}
                    </div>

                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white leading-tight">
                      E kaabo! Copy your Booking Code:{' '}
                      <span className="font-mono text-[#D4A359] underline decoration-[#C8963E]/60 underline-offset-4">
                        {confirmedBooking.reference}
                      </span>
                    </h3>

                    <p className="text-xs sm:text-sm text-stone-200 leading-relaxed max-w-xl">
                      Please copy your Booking Code now. You will enter{' '}
                      <strong className="font-mono text-[#D4A359]">
                        {confirmedBooking.reference}
                      </strong>{' '}
                      in the standalone <strong>Manage Booking</strong> section on the home page
                      anytime you want to view or print your official stay receipt. Your booking
                      remains valid strictly for your booked stay range (
                      <strong className="text-white">
                        {confirmedBooking.checkIn} to {confirmedBooking.checkOut}
                      </strong>
                      ).
                    </p>
                  </div>

                  <div className="shrink-0 flex flex-col items-stretch sm:items-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          if (navigator.clipboard && navigator.clipboard.writeText) {
                            navigator.clipboard.writeText(confirmedBooking.reference);
                          } else {
                            const el = document.createElement('textarea');
                            el.value = confirmedBooking.reference;
                            document.body.appendChild(el);
                            el.select();
                            document.execCommand('copy');
                            document.body.removeChild(el);
                          }
                        } catch {
                          // Clipboard fallback complete
                        }
                        setCopiedRef(true);
                        setHasCopiedCode(true);
                        setCopyGateWarning('');
                      }}
                      className={`px-6 py-4 rounded-xl font-mono text-sm font-bold flex items-center justify-center gap-2.5 cursor-pointer transition-all shadow-lg whitespace-nowrap ${
                        hasCopiedCode
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950'
                          : 'bg-[#C8963E] hover:bg-[#d9a648] text-white ring-4 ring-[#C8963E]/30'
                      }`}
                    >
                      {hasCopiedCode ? (
                        <>
                          <Check className="w-5 h-5" />
                          <span>Copied: {confirmedBooking.reference}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5" />
                          <span>Copy Booking Code ({confirmedBooking.reference})</span>
                        </>
                      )}
                    </button>
                    <span className="text-[11px] font-mono text-stone-300 text-center sm:text-right">
                      {hasCopiedCode
                        ? '✓ Unlocked — You may now close or open Manage Booking'
                        : 'Required to unlock "Done" and close this window'}
                    </span>
                  </div>
                </div>

                {copyGateWarning && !hasCopiedCode && (
                  <div className="mt-4 p-3 rounded-xl bg-amber-500/20 border border-amber-400/60 text-amber-100 text-xs flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>{copyGateWarning}</span>
                  </div>
                )}
              </div>

              {/* OFFICIAL PREMIUM STAY RECEIPT FOLIO */}
              <BookingReceiptFolio booking={confirmedBooking} />

              {/* STEP 5 BOTTOM COMPLETION CONTROLS (GATED BY MANDATORY COPY) */}
              <div className="bg-[#FAF7F2] p-4 sm:p-5 rounded-xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-stone-600 text-center sm:text-left">
                  {hasCopiedCode ? (
                    <span className="text-emerald-800 font-semibold">
                      ✓ Booking Code {confirmedBooking.reference} copied to clipboard. Use it anytime
                      in the Manage Booking field on the home page.
                    </span>
                  ) : (
                    <span className="text-amber-900 font-semibold">
                      ⚠ Copy your Booking Code ({confirmedBooking.reference}) above to unlock the
                      buttons on the right.
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
                  {onOpenManageBookingWithCode && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!hasCopiedCode) {
                          setCopyGateWarning(
                            `Please click "Copy Booking Code (${confirmedBooking.reference})" at the top first to unlock.`
                          );
                          return;
                        }
                        onClose();
                        onOpenManageBookingWithCode(confirmedBooking.reference);
                      }}
                      className={`px-4 py-2.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                        hasCopiedCode
                          ? 'bg-white text-[#0B2545] border-[#0B2545] hover:bg-stone-100'
                          : 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                      }`}
                    >
                      Check in Manage Booking
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (!hasCopiedCode) {
                        setCopyGateWarning(
                          `Please click "Copy Booking Code (${confirmedBooking.reference})" at the top before closing.`
                        );
                        return;
                      }
                      onClose();
                    }}
                    className={`px-6 py-2.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                      hasCopiedCode
                        ? 'bg-[#0B2545] hover:bg-[#163963] text-white'
                        : 'bg-stone-300 text-stone-500 cursor-not-allowed'
                    }`}
                  >
                    {!hasCopiedCode && <Lock className="w-3.5 h-3.5" />}
                    <span>{hasCopiedCode ? 'Done & Close' : 'Copy Code to Unlock Done'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
