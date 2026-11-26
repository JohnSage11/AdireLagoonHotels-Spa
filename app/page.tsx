'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  Calendar,
  Sparkles,
  Utensils,
  MessageCircle,
  ArrowRight,
  Compass,
  BedDouble,
  Building2,
  Tag,
  FileText,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import BookingModal from '@/components/BookingModal';
import BookingReceiptFolio from '@/components/BookingReceiptFolio';
import LagosLocationMap from '@/components/LagosLocationMap';
import { useHotelStore } from '@/lib/hotel-store';
import {
  RoomCategory,
  FAQS,
  ADIRE_HOTEL_COORDINATES,
  formatNaira,
  calculateNights,
  resolveHotelImageUrl,
} from '@/lib/hotel-data';

export default function HomePage() {
  const { rooms, bookings, getEffectiveAvailability } = useHotelStore();

  // Synchronized Booking State
  const [checkIn, setCheckIn] = useState<string>('2026-11-26');
  const [checkOut, setCheckOut] = useState<string>('2026-11-29');
  const [adults, setAdults] = useState<number>(2);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [roomsCount, setRoomsCount] = useState<number>(1);
  const [promoCodeInput, setPromoCodeInput] = useState<string>('');

  // Modal & UI State
  const [bookingModalOpen, setBookingModalOpen] = useState<boolean>(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomCategory | null>(null);
  const [initialAddOns, setInitialAddOns] = useState<string[]>([]);
  const [modalStartStep, setModalStartStep] = useState<1 | 2 | 3>(1);

  // Manage Booking Lookup & Official Receipt State
  const [lookupOpen, setLookupOpen] = useState<boolean>(false);
  const [lookupRef, setLookupRef] = useState<string>('');
  const [lookupAttempted, setLookupAttempted] = useState<boolean>(false);

  // Gift Card Modal State
  const [giftModalOpen, setGiftModalOpen] = useState<boolean>(false);
  const [giftAmount, setGiftAmount] = useState<number>(150000);
  const [giftRecipient, setGiftRecipient] = useState<string>('');
  const [giftSuccess, setGiftSuccess] = useState<boolean>(false);

  // Newsletter & Contact Form States
  const [newsletterEmail, setNewsletterEmail] = useState<string>('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState<boolean>(false);

  const [contactName, setContactName] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [contactSubject, setContactSubject] = useState<string>('First-Time Stay Enquiry');
  const [contactMessage, setContactMessage] = useState<string>('');
  const [contactSubmitted, setContactSubmitted] = useState<boolean>(false);

  const openBookingForRoom = (
    room: RoomCategory | null,
    code?: string,
    addOns: string[] = [],
    stepToStart: 1 | 2 | 3 = room ? 3 : 1
  ) => {
    setSelectedRoom(room);
    const effectiveCode = code !== undefined ? code : promoCodeInput.trim();
    setPromoCodeInput(effectiveCode);
    setInitialAddOns(addOns);
    setModalStartStep(stepToStart);
    setBookingModalOpen(true);
  };

  const nights = calculateNights(checkIn, checkOut);
  const visibleRooms = rooms.filter((r) => r.isVisibleInGallery !== false);
  const featuredPreviewRooms = visibleRooms.slice(0, 3);

  const matchedLookupBooking = lookupRef.trim()
    ? bookings.find(
        (b) => b.reference.toUpperCase() === lookupRef.trim().toUpperCase()
      )
    : null;

  const handleManageBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLookupAttempted(true);
    if (matchedLookupBooking) {
      setLookupOpen(true);
    }
  };

  const dedicatedPages = [
    {
      title: 'Rooms & Suites',
      href: '/rooms',
      kicker: '01 / ACCOMMODATION',
      description:
        'Explore all 168 lagoon-view rooms, balcony sanctuaries, family suites, and the 12th-floor Presidential Suite.',
      icon: BedDouble,
      cta: 'View All Rooms & Suites',
    },
    {
      title: 'Dining & Spa',
      href: '/dining-spa',
      kicker: '02 / CULINARY & WELLNESS',
      description:
        'Discover Eko Kitchen smoky party jollof, rooftop suya nights, The Lagoon Lounge, and The Calabash Spa (1,000 sq m).',
      icon: Utensils,
      cta: 'Explore Dining & Spa',
    },
    {
      title: 'Special Offers',
      href: '/offers',
      kicker: '03 / DIRECT PACKAGES',
      description:
        'Claim seasonal savings, Detty December packages, diaspora airport transfers, and digital gift cards.',
      icon: Tag,
      cta: 'Browse Special Offers',
    },
    {
      title: 'Corporate & Events',
      href: '/corporate',
      kicker: '04 / B2B & CELEBRATIONS',
      description:
        'Book The Grand Ballroom (up to 600 guests), Iroko Hall, corporate group blocks, and traditional Nigerian weddings.',
      icon: Building2,
      cta: 'Open Corporate & Events',
    },
    {
      title: 'Gallery & Calendar',
      href: '/gallery',
      kicker: '05 / LIVE AVAILABILITY',
      description:
        'Inspect our interactive monthly availability calendar for rooms, spa slots, and halls, plus the full visual archive.',
      icon: Calendar,
      cta: 'Open Gallery & Calendar',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900 flex flex-col overflow-x-hidden">
      {/* Top Navigation Bar (Strict 3-Zone Contract with 7-Click Stealth Admin Logo Gate) */}
      <Navbar onBookNowClick={() => openBookingForRoom(null, undefined, [], 1)} />

      {/* 1. EDITORIAL AFRO-LUXURY HERO SECTION */}
      <section className="relative min-h-[620px] lg:min-h-[700px] flex items-center bg-[#071930] overflow-hidden">
        <Image
          src={resolveHotelImageUrl('/images/hero_adire_lagoon_sunrise_1795566274564.jpg')}
          alt="Sunrise over The Adire Lagoon Hotel & Spa in Victoria Island, Lagos"
          fill
          priority
          referrerPolicy="no-referrer"
          className="object-cover object-center opacity-80 scale-[1.01]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071930]/95 via-[#0B2545]/75 to-[#071930]/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071930] via-transparent to-black/30" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-24 lg:py-28 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-8 space-y-6"
            >
              {/* Architectural Kicker */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono uppercase tracking-[0.22em] text-[#D4A359]">
                <span>Victoria Island Waterfront Sanctuary · Lagos</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.03] tracking-tight text-balance">
                E kaabo. Where Lagos comes to rest by the water.
              </h1>

              <p className="text-base sm:text-lg text-stone-200 max-w-2xl leading-relaxed font-normal">
                Wake to golden hour over Kuramo and Five Cowries lagoon in Victoria Island, savour smoky party jollof at Eko Kitchen, and unwind inside a 1963 Nigerian architectural landmark reimagined for modern luxury.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => openBookingForRoom(null, undefined, [], 1)}
                  className="px-7 py-4 text-sm font-semibold text-white bg-[#C8963E] hover:bg-[#b5842f] hover:-translate-y-0.5 rounded-lg transition-all shadow-lg cursor-pointer flex items-center gap-2 whitespace-nowrap"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book Direct &amp; Save 15%</span>
                </button>
                <Link
                  href="/rooms"
                  className="px-6 py-4 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 hover:-translate-y-0.5 backdrop-blur-xs border border-white/25 rounded-lg transition-all whitespace-nowrap inline-flex items-center gap-2"
                >
                  <span>Explore Rooms &amp; Suites</span>
                  <ArrowRight className="w-4 h-4 text-[#D4A359]" />
                </Link>
                <a
                  href="#location-map"
                  className="px-5 py-4 text-sm font-medium text-[#D4A359] hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  <Compass className="w-4 h-4" />
                  <span>Victoria Island Map &amp; Distance Guide</span>
                </a>
              </div>
            </motion.div>

            {/* Right First-Timer At-a-Glance Card */}
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              className="lg:col-span-4 bg-[#0B2545]/85 backdrop-blur-md border border-[#D4A359]/35 rounded-2xl p-5 sm:p-6 text-white space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#D4A359]">
                  First-Timer Essentials
                </span>
                <span className="font-mono text-xs text-emerald-300 font-semibold">
                  ★ 4.8 / 5 (2,800+ Stays)
                </span>
              </div>
              <p className="font-serif text-lg sm:text-xl italic text-stone-100 leading-snug">
                &ldquo;Uninterrupted 24-hour power, hand-dyed Abeokuta Adire linens, and serene lagoon views in Victoria Island.&rdquo;
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <p className="font-mono text-base font-bold text-[#D4A359] tabular-nums">15%</p>
                  <p className="text-[10px] text-stone-300 mt-0.5">Direct Rate Off</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <p className="font-mono text-base font-bold text-white tabular-nums">24/7</p>
                  <p className="text-[10px] text-stone-300 mt-0.5">Power &amp; Fibre</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <p className="font-mono text-base font-bold text-white tabular-nums">168</p>
                  <p className="text-[10px] text-stone-300 mt-0.5">Rooms &amp; Suites</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. ARCHITECTURAL FLOATING DIRECT BOOKING CONSOLE */}
      <motion.section
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.15 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-20 -mt-10 max-w-7xl w-full mx-auto px-4 sm:px-6"
      >
        <div className="bg-[#0B2545] text-white rounded-2xl border border-[#D4A359]/40 shadow-2xl p-5 sm:p-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
            <div>
              <label className="block text-[11px] font-mono font-semibold tracking-wider text-[#D4A359] uppercase mb-1.5">
                Check-In Date
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-mono bg-[#13325B] text-white border border-white/20 rounded-lg focus:outline-none focus:border-[#C8963E]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-semibold tracking-wider text-[#D4A359] uppercase mb-1.5">
                Check-Out Date ({nights} {nights === 1 ? 'Night' : 'Nights'})
              </label>
              <input
                type="date"
                value={checkOut}
                min={checkIn}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-mono bg-[#13325B] text-white border border-white/20 rounded-lg focus:outline-none focus:border-[#C8963E]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-semibold tracking-wider text-[#D4A359] uppercase mb-1.5">
                Guests
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={adults}
                  onChange={(e) => setAdults(Number(e.target.value))}
                  aria-label="Adults"
                  className="px-2.5 py-2.5 text-sm bg-[#13325B] text-white border border-white/20 rounded-lg focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6].map((a) => (
                    <option key={a} value={a}>
                      {a} {a === 1 ? 'Adult' : 'Adults'}
                    </option>
                  ))}
                </select>
                <select
                  value={childrenCount}
                  onChange={(e) => setChildrenCount(Number(e.target.value))}
                  aria-label="Children"
                  className="px-2.5 py-2.5 text-sm bg-[#13325B] text-white border border-white/20 rounded-lg focus:outline-none"
                >
                  {[0, 1, 2, 3, 4].map((c) => (
                    <option key={c} value={c}>
                      {c} {c === 1 ? 'Child' : 'Children'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-semibold tracking-wider text-[#D4A359] uppercase mb-1.5">
                Rooms
              </label>
              <select
                value={roomsCount}
                onChange={(e) => setRoomsCount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm bg-[#13325B] text-white border border-white/20 rounded-lg focus:outline-none"
              >
                {[1, 2, 3, 4, 5].map((r) => (
                  <option key={r} value={r}>
                    {r} {r === 1 ? 'Room' : 'Rooms'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-semibold tracking-wider text-[#D4A359] uppercase mb-1.5">
                Promo Code
              </label>
              <input
                type="text"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. WELCOMEHOME"
                className="w-full px-3.5 py-2.5 text-sm font-mono uppercase bg-[#13325B] text-white placeholder:text-white/40 border border-white/20 rounded-lg focus:outline-none focus:border-[#C8963E]"
              />
            </div>

            <div>
              <button
                type="button"
                onClick={() => openBookingForRoom(null, promoCodeInput, [], 1)}
                className="w-full py-2.5 px-5 min-h-[42px] text-sm font-semibold text-white bg-[#C8963E] hover:bg-[#b5842f] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                Check Calendar &amp; Rates
              </button>
            </div>
          </div>

          {/* Utility Strip under Booking Bar */}
          <div className="mt-4 pt-3.5 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-stone-300">
            <p>
              Free cancellation up to 48 hours before arrival · Pay online in Naira via Paystack or hold for corporate arrival · Welcome Adire Chapman included.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-[#D4A359] font-medium shrink-0">
              <a
                href="#manage-booking-field"
                className="hover:underline cursor-pointer"
              >
                Manage Booking
              </a>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => {
                  setGiftSuccess(false);
                  setGiftModalOpen(true);
                }}
                className="hover:underline cursor-pointer"
              >
                Gift Cards
              </button>
              <span aria-hidden="true">·</span>
              <Link href="/offers" className="hover:underline">
                Special Offers
              </Link>
              <span aria-hidden="true">·</span>
              <Link href="/gallery" className="hover:underline">
                Live Availability Calendar
              </Link>
            </div>
          </div>
        </div>

        {/* 2B. STANDALONE MANAGE BOOKING & OFFICIAL RECEIPT FIELD (FOR EXISTING BOOKINGS) */}
        <div
          id="manage-booking-field"
          className="mt-4 bg-white rounded-2xl border-2 border-[#C8963E]/60 shadow-xl p-5 sm:p-6 text-stone-900"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            <div className="lg:col-span-7 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-[#C8963E]">
                <FileText className="w-3.5 h-3.5 text-[#0B2545]" />
                <span>Already Booked? · Official Stay Receipt Lookup</span>
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#0B2545] leading-snug">
                Manage Booking &amp; View Your Official Booking Receipt
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Exclusively for guests who have already completed a reservation and copied their{' '}
                <strong className="text-[#0B2545] font-mono">Booking Code</strong> (e.g.{' '}
                <span className="font-mono text-[#0B2545] font-semibold">ADL-849201</span>). Enter
                your Booking Code to inspect or print your detailed receipt. Bookings remain valid
                strictly for the booked stay date range.
              </p>
            </div>

            <div className="lg:col-span-5">
              <form
                onSubmit={handleManageBookingSubmit}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={lookupRef}
                    onChange={(e) => {
                      setLookupRef(e.target.value.toUpperCase());
                      setLookupAttempted(false);
                    }}
                    placeholder="Enter Booking Code (e.g. ADL-849201)"
                    aria-label="Enter your Booking Code to view your official booking receipt"
                    className="w-full pl-10 pr-3.5 py-3 text-sm font-mono uppercase bg-[#FAF7F2] text-[#0B2545] font-bold placeholder:text-stone-400 placeholder:font-normal border border-stone-300 rounded-xl focus:outline-none focus:border-[#0B2545]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-3 min-h-[46px] text-xs sm:text-sm font-semibold text-white bg-[#0B2545] hover:bg-[#163a66] rounded-xl transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 shrink-0 shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4 text-[#D4A359]" />
                  <span>View Official Receipt</span>
                </button>
              </form>

              {lookupAttempted && !matchedLookupBooking && lookupRef.trim() && (
                <p className="mt-2 text-xs text-red-700 font-medium">
                  No reservation found for code <span className="font-mono font-bold">{lookupRef.trim()}</span>. Please verify the exact <span className="font-mono">ADL-XXXXXX</span> Booking Code copied upon payment.
                </p>
              )}

              {!lookupAttempted && (
                <p className="mt-2 text-[11px] text-stone-500 flex items-center justify-between gap-2">
                  <span>Requires the Booking Code copied upon payment confirmation.</span>
                  <button
                    type="button"
                    onClick={() => {
                      setLookupRef('ADL-849201');
                      setLookupAttempted(true);
                      setLookupOpen(true);
                    }}
                    className="font-mono text-[#0B2545] hover:text-[#C8963E] underline cursor-pointer shrink-0"
                  >
                    Preview Sample Receipt (ADL-849201)
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.section>

      {/* 3. FIRST-TIMER WELCOME & 5 DEDICATED PAGE GATEWAYS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-24 space-y-14 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.14 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 space-y-5"
          >
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-16 shrink-0 rounded-xl bg-white p-1.5 border border-stone-200 shadow-xs">
                <Image
                  src={resolveHotelImageUrl('/images/hotel_doc_0.jpg')}
                  alt="The Adire Lagoon Hotel & Spa Crest"
                  fill
                  sizes="96px"
                  referrerPolicy="no-referrer"
                  className="object-contain"
                />
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#C8963E]">
                  First-Timer Guide · Since 1963
                </p>
                <p className="text-xs text-stone-500 mt-0.5">
                  Plot 14, Adetokunbo Ademola Street, Victoria Island, Lagos · 24/7 Power &amp; Security
                </p>
              </div>
            </div>

            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#0B2545] leading-[1.08] tracking-tight text-balance">
              Everything you need to know for your first stay at The Adire.
            </h2>

            <p className="text-base text-stone-700 leading-relaxed">
              Set on the tranquil lagoon waterfront of <strong className="text-[#0B2545]">Victoria Island, Lagos</strong>, The Adire blends 1960s Nigerian architectural modernism with effortless contemporary comfort. Whether you are arriving from Murtala Muhammed International Airport, attending meetings on Lagos Island, or unwinding by the Kuramo waterfront, our triple-redundant power, enterprise fibre Wi-Fi, and 24-hour concierge ensure a seamless stay.
            </p>
          </motion.div>

          {/* Right 5 Columns: Highlight Visual */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5"
          >
            <div className="relative h-[300px] sm:h-[340px] rounded-3xl overflow-hidden border border-stone-200 shadow-lg group">
              <Image
                src={resolveHotelImageUrl('/images/rooftop_pool_sunset_deck_1795566276755.jpg')}
                alt="The Adire Lagoon Hotel Rooftop Pool at Golden Hour"
                fill
                referrerPolicy="no-referrer"
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B2545]/90 via-black/25 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white space-y-1.5">
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#D4A359]">
                  12th-Floor Rooftop Infinity Deck
                </span>
                <blockquote className="font-serif text-base sm:text-lg italic leading-snug">
                  &ldquo;From the moment we arrived in Victoria Island, we felt looked after. The food, the view, the staff: everything was perfect, and not one power cut.&rdquo;
                </blockquote>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 5 Dedicated Destination Gateway Cards */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#C8963E]">
                Explore the Hotel by Section
              </p>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B2545]">
                5 Dedicated Pages for Every Part of Your Stay
              </h3>
            </div>
            <p className="text-xs text-stone-500">
              Select any destination below to open its full dedicated page
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {dedicatedPages.map((pg, idx) => {
              const IconComponent = pg.icon;
              return (
                <motion.div
                  key={pg.href}
                  initial={{ opacity: 0, y: 26, scale: 0.96 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: false, amount: 0.14 }}
                  transition={{ duration: 0.44, delay: idx * 0.06 }}
                  whileHover={{ y: -5 }}
                >
                  <Link
                    href={pg.href}
                    className="h-full p-5 bg-white rounded-2xl border border-stone-200/90 hover:border-[#C8963E] shadow-xs hover:shadow-lg transition-all flex flex-col justify-between gap-4 group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-[#C8963E] tracking-widest">
                          {pg.kicker}
                        </span>
                        <IconComponent className="w-4 h-4 text-[#0B2545] group-hover:text-[#C8963E] transition-colors" />
                      </div>
                      <h4 className="font-serif text-xl font-bold text-[#0B2545] group-hover:text-[#C8963E] transition-colors">
                        {pg.title}
                      </h4>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        {pg.description}
                      </p>
                    </div>

                    <span className="text-xs font-semibold text-[#0B2545] group-hover:text-[#C8963E] inline-flex items-center gap-1.5 pt-2 border-t border-stone-100">
                      <span>{pg.cta}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. COMPACT 3-ROOM PREVIEW FOR FIRST-TIMERS (Full Catalog on /rooms) */}
      <section className="bg-white border-y border-stone-200 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-mono font-semibold tracking-[0.2em] uppercase text-[#C8963E]">
                Quick Accommodation Preview · 168 Rooms &amp; Suites
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0B2545] tracking-tight">
                Popular Rooms for First-Time Guests
              </h2>
              <p className="text-sm text-stone-600">
                Preview three of our most requested rooms below, or visit our dedicated Rooms &amp; Suites page to compare all categories, suites, and floor plans.
              </p>
            </div>

            <Link
              href="/rooms"
              className="px-5 py-3 text-xs sm:text-sm font-semibold text-white bg-[#0B2545] hover:bg-[#163a66] rounded-lg inline-flex items-center gap-2 shrink-0 self-start md:self-end"
            >
              <span>View All {visibleRooms.length} Rooms &amp; Suites</span>
              <ArrowRight className="w-4 h-4 text-[#D4A359]" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredPreviewRooms.map((room, idx) => {
              const availability = getEffectiveAvailability(room, checkIn, checkOut);
              const isSoldOut = availability.status === 'sold_out';

              return (
                <motion.article
                  key={room.id}
                  initial={{ opacity: 0, y: 30, scale: 0.96 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: false, amount: 0.14 }}
                  transition={{ duration: 0.45, delay: idx * 0.08 }}
                  whileHover={{ y: -5 }}
                  className="bg-[#FAF7F2] rounded-2xl border border-stone-200/90 hover:border-[#C8963E] overflow-hidden flex flex-col justify-between transition-shadow duration-300 hover:shadow-lg group"
                >
                  <div>
                    <div className="relative h-52 w-full bg-stone-200 overflow-hidden">
                      <Image
                        src={resolveHotelImageUrl(room.imageUrl, room.id)}
                        alt={room.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        referrerPolicy="no-referrer"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/15" />

                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                        <span className="bg-[#0B2545]/90 text-white text-[11px] font-mono px-2.5 py-1 rounded-md">
                          {room.sizeSqm} sq m · Sleeps {room.maxGuests}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-md ${
                            availability.status === 'available'
                              ? 'bg-emerald-900/90 text-emerald-100'
                              : availability.status === 'limited'
                              ? 'bg-amber-900/90 text-amber-100'
                              : 'bg-red-900/90 text-red-100'
                          }`}
                        >
                          {availability.label}
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-4 right-4 text-white">
                        <p className="text-xs text-[#D4A359] font-medium">
                          {room.bedConfig} · {room.viewType}
                        </p>
                        <h3 className="font-serif text-xl font-bold leading-snug mt-0.5">
                          {room.name}
                        </h3>
                      </div>
                    </div>

                    <div className="p-4">
                      <p className="text-xs text-stone-700 leading-relaxed line-clamp-2">
                        {room.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-3 border-t border-stone-200 bg-white flex items-center justify-between gap-2">
                    <div>
                      <p className="font-mono text-base font-bold text-[#0B2545] tabular-nums">
                        {formatNaira(room.pricePerNightNgn)}
                        <span className="text-xs font-normal text-stone-500"> / night</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isSoldOut}
                      onClick={() => openBookingForRoom(room, promoCodeInput.trim(), [], 3)}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        isSoldOut
                          ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                          : 'bg-[#0B2545] text-white hover:bg-[#163a66]'
                      }`}
                    >
                      {isSoldOut ? 'Sold Out' : 'Reserve'}
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE VICTORIA ISLAND, LAGOS GOOGLE MAP & DISTANCE COMPARATOR (Key First-Timer Feature) */}
      <motion.section
        id="location-map"
        initial={{ opacity: 0, y: 34, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: false, amount: 0.12 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-20"
      >
        <LagosLocationMap
          onBookWithTransfer={() =>
            openBookingForRoom(
              visibleRooms[1] || visibleRooms[0],
              promoCodeInput.trim(),
              ['airport_pickup'],
              1
            )
          }
        />
      </motion.section>

      {/* 6. ESSENTIAL FIRST-TIMER FAQS, POLICIES & RECEPTION CONTACT */}
      <section className="bg-white border-t border-stone-200 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7 space-y-4">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#C8963E]">
                First-Time Guest Essentials
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B2545]">
                Frequently Asked Questions
              </h2>
              <div className="space-y-3">
                {FAQS.slice(0, 5).map((faq, idx) => (
                  <motion.div
                    key={faq.question}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, amount: 0.16 }}
                    transition={{ duration: 0.38, delay: Math.min(idx * 0.04, 0.2) }}
                    className="p-4 rounded-xl bg-[#FAF7F2] border border-stone-200 hover:border-[#C8963E] transition-colors"
                  >
                    <h3 className="text-sm font-bold text-[#0B2545]">{faq.question}</h3>
                    <p className="text-xs text-stone-700 mt-1 leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-5">
              <div className="p-6 rounded-2xl bg-[#FAF7F2] border border-stone-200 space-y-3 text-xs text-stone-700">
                <h3 className="font-serif text-xl font-bold text-[#0B2545]">
                  Arrival Policies &amp; Getting to Victoria Island
                </h3>
                <p>
                  <strong>Address:</strong> {ADIRE_HOTEL_COORDINATES.address} (6.4281° N, 3.4219° E)
                </p>
                <p>
                  <strong>Check-in:</strong> 2:00 pm · <strong>Check-out:</strong> 12:00 noon (late check-out available on request)
                </p>
                <p>
                  <strong>Airport Transfer:</strong> Murtala Muhammed International Airport (LOS) is 35–60 mins via Third Mainland Bridge. Private SUV pickup from ₦45,000.
                </p>
                <p>
                  <strong>Identification:</strong> Valid government ID (National ID, international passport or driver&apos;s licence) required at check-in.
                </p>
                <p>
                  <strong>Languages Spoken:</strong> English, Yoruba, Igbo, Hausa, Pidgin, French
                </p>
              </div>

              {/* Contact Us Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setContactSubmitted(true);
                }}
                className="p-6 rounded-2xl bg-white border border-stone-200 space-y-3"
              >
                <h3 className="font-serif text-xl font-bold text-[#0B2545]">
                  Ask Reception a Question
                </h3>
                {contactSubmitted ? (
                  <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                    Thank you for getting in touch. A member of our Victoria Island reception team will reply shortly.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Full name *"
                        className="px-3 py-2 text-xs border border-stone-300 rounded-md"
                      />
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="Email address *"
                        className="px-3 py-2 text-xs border border-stone-300 rounded-md"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="Phone / WhatsApp (optional)"
                        className="px-3 py-2 text-xs border border-stone-300 rounded-md"
                      />
                      <input
                        type="text"
                        required
                        value={contactSubject}
                        onChange={(e) => setContactSubject(e.target.value)}
                        placeholder="Subject"
                        className="px-3 py-2 text-xs border border-stone-300 rounded-md"
                      />
                    </div>
                    <textarea
                      rows={2}
                      required
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Your message or arrival question..."
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-md"
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 text-xs font-semibold text-white bg-[#0B2545] hover:bg-[#173b66] rounded-md cursor-pointer"
                    >
                      Send Message to Reception
                    </button>
                  </>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 7. NEWSLETTER & EDITORIAL DARK FOOTER */}
      <footer className="bg-[#081A33] text-stone-300 border-t border-white/10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5 space-y-3.5">
              <div className="relative w-44 h-28 rounded-xl bg-white p-2.5 shadow-sm">
                <Image
                  src={resolveHotelImageUrl('/images/hotel_doc_0.jpg')}
                  alt="The Adire Lagoon Hotel & Spa Official Logo"
                  fill
                  sizes="176px"
                  referrerPolicy="no-referrer"
                  className="object-contain p-2"
                />
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                {ADIRE_HOTEL_COORDINATES.address} (6.4281° N, 3.4219° E)
              </p>
              <div className="text-xs space-y-1 text-stone-300 pt-1">
                <p>Reservations: +234 800 000 2480 · reservations@adirelagoon.example</p>
                <p>WhatsApp Concierge (24 hours): +234 800 000 2485</p>
                <p>Front Desk (24 hours): +234 800 000 2482</p>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-2.5 text-xs">
              <p className="font-semibold text-[#D4A359] uppercase tracking-wider">
                Dedicated Site Pages
              </p>
              <ul className="space-y-2">
                <li>
                  <Link href="/rooms" className="hover:text-white">
                    Rooms &amp; Suites (/rooms)
                  </Link>
                </li>
                <li>
                  <Link href="/dining-spa" className="hover:text-white">
                    Dining &amp; The Calabash Spa (/dining-spa)
                  </Link>
                </li>
                <li>
                  <Link href="/offers" className="hover:text-white">
                    Special Offers &amp; Gift Cards (/offers)
                  </Link>
                </li>
                <li>
                  <Link href="/corporate" className="hover:text-white">
                    Corporate &amp; Events (/corporate)
                  </Link>
                </li>
                <li>
                  <Link href="/gallery" className="hover:text-white">
                    Gallery &amp; Availability Calendar
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setLookupOpen(true)}
                    className="text-[#D4A359] font-semibold hover:underline cursor-pointer"
                  >
                    Manage Existing Reservation
                  </button>
                </li>
              </ul>
            </div>

            {/* Newsletter Signup */}
            <div className="lg:col-span-4 space-y-3">
              <h4 className="font-serif text-xl font-bold text-white">
                Insider offers, delivered gently
              </h4>
              <p className="text-xs text-stone-300 leading-relaxed">
                Join our mailing list for seasonal packages, event invitations and first access to our Detty December offers.
              </p>
              {newsletterSubscribed ? (
                <p className="text-xs text-emerald-400 font-medium">
                  ✓ E kaabo! You are subscribed to our monthly insider dispatch.
                </p>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newsletterEmail.includes('@')) setNewsletterSubscribed(true);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Your email address"
                    className="flex-1 px-3.5 py-2 text-xs bg-white/10 text-white placeholder:text-stone-400 border border-white/20 rounded-md focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#C8963E] hover:bg-[#b5842f] rounded-md cursor-pointer whitespace-nowrap"
                  >
                    Subscribe
                  </button>
                </form>
              )}
              <p className="text-[11px] text-stone-400">
                Handled in line with the Nigeria Data Protection Act.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
            <p>© 2026 The Adire Lagoon Hotel &amp; Spa, Victoria Island, Lagos. All rights reserved.</p>
            <span>Instagram · Facebook · X · LinkedIn · TripAdvisor</span>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Direct Concierge Button */}
      <a
        href="https://wa.me/2348000002485?text=E%20kaabo%20The%20Adire%20Lagoon%20Hotel%20%26%20Spa!%20I%20would%20like%20to%20enquire%20about%20a%20direct%20booking."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-30 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0B2545] hover:bg-[#143966] text-white text-xs font-semibold shadow-lg border border-[#C8963E]"
      >
        <MessageCircle className="w-4 h-4 text-[#D4A359]" />
        <span>Chat on WhatsApp</span>
      </a>

      {/* Manage Booking Official Digital Stay Receipt Modal */}
      {lookupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-4xl my-auto space-y-4">
            {/* Top Search & Dismiss Bar inside Modal */}
            <div className="bg-[#0B2545] text-white px-5 py-4 rounded-2xl border border-[#C8963E]/50 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#D4A359]">
                  Manage Booking · Official Stay Receipt Verification
                </p>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-white">
                  Enter Your Booking Code to View Your Receipt
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={lookupRef}
                  onChange={(e) => setLookupRef(e.target.value.toUpperCase())}
                  placeholder="ADL-849201"
                  aria-label="Booking Code"
                  className="px-3.5 py-2 text-xs sm:text-sm font-mono uppercase bg-[#13325B] text-[#D4A359] font-bold border border-white/25 rounded-lg focus:outline-none focus:border-[#C8963E] w-44 sm:w-52"
                />
                <button
                  type="button"
                  onClick={() => setLookupOpen(false)}
                  className="p-2 text-white/75 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg cursor-pointer transition-colors"
                  aria-label="Close Receipt Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {matchedLookupBooking ? (
              <BookingReceiptFolio
                booking={matchedLookupBooking}
                onClose={() => setLookupOpen(false)}
              />
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center space-y-3 border border-stone-200 shadow-xl">
                <p className="font-serif text-xl font-bold text-[#0B2545]">
                  No Reservation Found for Booking Code &ldquo;{lookupRef.trim() || '—'}&rdquo;
                </p>
                <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
                  Please enter the exact <span className="font-mono font-bold">ADL-XXXXXX</span>{' '}
                  Booking Code that you copied upon completing your payment.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gift Card Modal */}
      {giftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 border border-stone-200">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-2xl font-bold text-[#0B2545]">
                Give the gift of a getaway.
              </h3>
              <button
                type="button"
                onClick={() => setGiftModalOpen(false)}
                className="text-xs text-stone-500 hover:text-stone-900 cursor-pointer"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-stone-600">
              Redeemable across lagoon-view stays, Eko Kitchen dining and The Calabash Spa treatments.
            </p>
            {giftSuccess ? (
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2">
                <p className="font-bold">Gift Voucher Reserved ({formatNaira(giftAmount)})</p>
                <p>
                  We have sent a Paystack Naira payment link and digital Adire Lagoon voucher for{' '}
                  <strong>{giftRecipient}</strong>.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setGiftSuccess(true);
                }}
                className="space-y-3"
              >
                <div className="grid grid-cols-3 gap-2">
                  {[50000, 150000, 350000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setGiftAmount(amt)}
                      className={`py-2 text-xs font-mono font-semibold rounded border cursor-pointer ${
                        giftAmount === amt
                          ? 'bg-[#0B2545] text-white border-[#0B2545]'
                          : 'bg-stone-50 text-stone-800 border-stone-300'
                      }`}
                    >
                      {formatNaira(amt)}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  value={giftRecipient}
                  onChange={(e) => setGiftRecipient(e.target.value)}
                  placeholder="Recipient Name & Email *"
                  className="w-full px-3.5 py-2 text-xs border border-stone-300 rounded-lg"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 text-xs font-semibold text-white bg-[#C8963E] hover:bg-[#b5842f] rounded-lg cursor-pointer"
                >
                  Purchase Gift Card ({formatNaira(giftAmount)})
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 5-Step Direct Booking & Paystack Checkout Modal with Embedded Step 1 Calendar */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        selectedRoom={selectedRoom}
        onSelectRoom={(rm) => setSelectedRoom(rm)}
        checkIn={checkIn}
        setCheckIn={setCheckIn}
        checkOut={checkOut}
        setCheckOut={setCheckOut}
        adults={adults}
        setAdults={setAdults}
        childrenCount={childrenCount}
        setChildrenCount={setChildrenCount}
        roomsCount={roomsCount}
        setRoomsCount={setRoomsCount}
        initialPromoCode={promoCodeInput}
        initialSelectedAddOns={initialAddOns}
        startAtStep={modalStartStep}
        onOpenManageBookingWithCode={(code) => {
          setLookupRef(code.toUpperCase());
          setLookupAttempted(true);
          setLookupOpen(true);
        }}
      />
    </div>
  );
}
