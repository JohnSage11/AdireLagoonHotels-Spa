'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  Calendar,
  BedDouble,
  Sparkles,
  Utensils,
  Building2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Filter,
  Users,
  Eye,
  Compass,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import BookingModal from '@/components/BookingModal';
import LagosLocationMap from '@/components/LagosLocationMap';
import { useHotelStore } from '@/lib/hotel-store';
import {
  RoomCategory,
  HotelServiceItem,
  GALLERY_ITEMS,
  calculateNights,
  formatNaira,
} from '@/lib/hotel-data';

type OfferingFilter = 'all' | 'rooms' | 'spa' | 'dining' | 'event_hall';

function GalleryAndCalendarContent() {
  const {
    rooms,
    hotelServices,
    getEffectiveAvailability,
    getServiceEffectiveAvailability,
  } = useHotelStore();

  // Synchronized Date Range State
  const [checkIn, setCheckIn] = useState<string>('2026-11-26');
  const [checkOut, setCheckOut] = useState<string>('2026-11-29');
  const [adults, setAdults] = useState<number>(2);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [roomsCount, setRoomsCount] = useState<number>(1);

  // Gallery Filter State
  const [activeCategory, setActiveCategory] = useState<OfferingFilter>('all');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [calendarRoomFocusId, setCalendarRoomFocusId] = useState<string>('');

  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState<boolean>(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomCategory | null>(null);
  const [initialPromoCode, setInitialPromoCode] = useState<string>('');
  const [initialAddOns, setInitialAddOns] = useState<string[]>([]);
  const [modalStartStep, setModalStartStep] = useState<1 | 2 | 3>(1);

  const nights = calculateNights(checkIn, checkOut);

  // Admin-controlled visible rooms & services
  const visibleRooms = useMemo(() => {
    return rooms.filter((r) => r.isVisibleInGallery !== false);
  }, [rooms]);

  const visibleServices = useMemo(() => {
    return hotelServices.filter((s) => s.isVisibleInGallery);
  }, [hotelServices]);

  // Evaluate availability for the picked date range
  const evaluatedRooms = useMemo(() => {
    return visibleRooms
      .map((room) => ({
        room,
        avail: getEffectiveAvailability(room, checkIn, checkOut),
      }))
      .filter((item) => !onlyAvailable || item.avail.status !== 'sold_out');
  }, [visibleRooms, getEffectiveAvailability, checkIn, checkOut, onlyAvailable]);

  const evaluatedServices = useMemo(() => {
    return visibleServices
      .filter((svc) => {
        if (activeCategory === 'all' || activeCategory === 'rooms') return true;
        return svc.category === activeCategory;
      })
      .map((service) => ({
        service,
        avail: getServiceEffectiveAvailability(service, checkIn, checkOut),
      }))
      .filter((item) => !onlyAvailable || item.avail.status !== 'sold_out');
  }, [
    visibleServices,
    activeCategory,
    getServiceEffectiveAvailability,
    checkIn,
    checkOut,
    onlyAvailable,
  ]);

  // Summary counts for the selected date range
  const rangeSummary = useMemo(() => {
    let openRoomTypes = 0;
    let totalOpenPhysicalRooms = 0;
    visibleRooms.forEach((r) => {
      const av = getEffectiveAvailability(r, checkIn, checkOut);
      if (av.status !== 'sold_out' && av.effectiveAvailable > 0) {
        openRoomTypes += 1;
        totalOpenPhysicalRooms += av.effectiveAvailable;
      }
    });

    let openSpaCount = 0;
    let openDiningCount = 0;
    let openHallCount = 0;
    visibleServices.forEach((s) => {
      const av = getServiceEffectiveAvailability(s, checkIn, checkOut);
      if (av.status !== 'sold_out' && av.effectiveAvailable > 0) {
        if (s.category === 'spa') openSpaCount += 1;
        if (s.category === 'dining') openDiningCount += 1;
        if (s.category === 'event_hall') openHallCount += 1;
      }
    });

    return {
      openRoomTypes,
      totalOpenPhysicalRooms,
      openSpaCount,
      openDiningCount,
      openHallCount,
    };
  }, [
    visibleRooms,
    visibleServices,
    getEffectiveAvailability,
    getServiceEffectiveAvailability,
    checkIn,
    checkOut,
  ]);

  const handleBookRoomForDates = (room: RoomCategory) => {
    setSelectedRoom(room);
    setInitialAddOns([]);
    setModalStartStep(3);
    setBookingModalOpen(true);
  };

  const handleBookServiceWithStay = (service: HotelServiceItem) => {
    const defaultRoom =
      visibleRooms.find(
        (r) => getEffectiveAvailability(r, checkIn, checkOut).status !== 'sold_out'
      ) || visibleRooms[0];
    setSelectedRoom(defaultRoom || null);
    setInitialAddOns(service.linkedAddOnId ? [service.linkedAddOnId] : []);
    setModalStartStep(1);
    setBookingModalOpen(true);
  };

  const showRoomsSection = activeCategory === 'all' || activeCategory === 'rooms';
  const showServicesSection = activeCategory !== 'rooms';

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900 flex flex-col">
      <Navbar
        onBookNowClick={() => {
          setSelectedRoom(null);
          setInitialAddOns([]);
          setModalStartStep(1);
          setBookingModalOpen(true);
        }}
      />

      {/* Editorial Hero Header */}
      <section className="relative bg-[#0B2545] text-white overflow-hidden border-b border-white/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-[#D4A359]">
                <Calendar className="w-3.5 h-3.5" />
                <span>Real-Time Self-Booking Availability &amp; Visual Showcase</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight leading-[1.08]">
                Interactive Gallery &amp; Live Availability Calendar
              </h1>
              <p className="text-sm sm:text-base text-stone-200 max-w-2xl leading-relaxed">
                Select your stay or event dates on the monthly calendar below to inspect live availability across our 168 lagoon-facing rooms &amp; suites, The Calabash Spa rituals, Eko Kitchen dining tables, and executive event halls.
              </p>
            </div>

            {/* Live Date-Range Availability Telemetry Box */}
            <div className="lg:col-span-4 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
                <span className="text-xs font-mono uppercase tracking-wider text-[#D4A359]">
                  Selected Window ({nights} {nights === 1 ? 'Night' : 'Nights'})
                </span>
                <span className="font-mono text-xs text-white font-semibold">
                  {checkIn} → {checkOut}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-white/8 border border-white/10">
                  <p className="text-stone-300">Open Rooms</p>
                  <p className="font-mono text-base font-bold text-white tabular-nums mt-0.5">
                    {rangeSummary.totalOpenPhysicalRooms} Rooms
                  </p>
                  <p className="text-[11px] text-emerald-300">
                    {rangeSummary.openRoomTypes} of {visibleRooms.length} categories
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/8 border border-white/10">
                  <p className="text-stone-300">Open Services</p>
                  <p className="font-mono text-base font-bold text-white tabular-nums mt-0.5">
                    {rangeSummary.openSpaCount +
                      rangeSummary.openDiningCount +
                      rangeSummary.openHallCount}{' '}
                    Venues
                  </p>
                  <p className="text-[11px] text-[#D4A359]">
                    {rangeSummary.openSpaCount} Spa · {rangeSummary.openDiningCount} Dining ·{' '}
                    {rangeSummary.openHallCount} Halls
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12 flex-1">
        {/* SECTION 1: INTERACTIVE MONTHLY AVAILABILITY CALENDAR */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-[#C8963E]">
                Step 1 · Pick Your Dates
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B2545]">
                Tap Any Check-In &amp; Check-Out Date Range
              </h2>
            </div>

            {/* Optional Room Category Calendar Focus + Direct Date Inputs */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-lg border border-stone-300 text-xs">
                <span className="text-stone-500 font-medium">Calendar View:</span>
                <select
                  value={calendarRoomFocusId}
                  onChange={(e) => setCalendarRoomFocusId(e.target.value)}
                  className="font-semibold text-[#0B2545] bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="">All Rooms &amp; Services</option>
                  {visibleRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({formatNaira(r.pricePerNightNgn)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-stone-300 text-xs">
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="font-mono text-[#0B2545] focus:outline-none"
                  aria-label="Check-in Date"
                />
                <span className="text-stone-400">→</span>
                <input
                  type="date"
                  value={checkOut}
                  min={checkIn}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="font-mono text-[#0B2545] focus:outline-none"
                  aria-label="Check-out Date"
                />
              </div>
            </div>
          </div>

          <AvailabilityCalendar
            checkIn={checkIn}
            checkOut={checkOut}
            targetRoomId={calendarRoomFocusId || undefined}
            onSelectRange={(nextIn, nextOut) => {
              setCheckIn(nextIn);
              setCheckOut(nextOut);
            }}
          />
        </section>

        {/* SECTION 2: FILTERABLE GALLERY OF ROOMS, SPA, DINING & EVENT HALLS FOR SELECTED DATES */}
        <section className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-200">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-[#C8963E]">
                Step 2 · Explore Available Offerings for {checkIn} to {checkOut}
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B2545]">
                Rooms, Calabash Spa, Eko Kitchen &amp; Event Halls
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'all', label: 'All Offerings', icon: Sparkles },
                { id: 'rooms', label: `Rooms & Suites (${evaluatedRooms.length})`, icon: BedDouble },
                { id: 'spa', label: 'The Calabash Spa', icon: Sparkles },
                { id: 'dining', label: 'Eko Kitchen & Bars', icon: Utensils },
                { id: 'event_hall', label: 'Event & Conference Halls', icon: Building2 },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveCategory(tab.id as OfferingFilter)}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-[#0B2545] text-white'
                        : 'bg-white text-stone-700 border border-stone-200 hover:border-[#0B2545]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}

              <label className="inline-flex items-center gap-2 text-xs font-medium text-stone-700 bg-white px-3 py-2 rounded-lg border border-stone-200 cursor-pointer ml-auto lg:ml-2">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="rounded border-stone-300 text-[#0B2545]"
                />
                <span>Hide Sold Out</span>
              </label>
            </div>
          </div>

          {/* 2A. ROOMS & SUITES GALLERY GRID */}
          {showRoomsSection && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#0B2545] flex items-center gap-2">
                  <BedDouble className="w-5 h-5 text-[#C8963E]" />
                  <span>Lagoon &amp; City Rooms &amp; Suites</span>
                </h3>
                <span className="text-xs font-mono text-stone-500">
                  Showing rates for {nights} {nights === 1 ? 'night' : 'nights'} ({checkIn} →{' '}
                  {checkOut})
                </span>
              </div>

              {evaluatedRooms.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center space-y-2">
                  <p className="font-serif text-lg font-bold text-[#0B2545]">
                    No room categories match your current filter for {checkIn} → {checkOut}
                  </p>
                  <p className="text-xs text-stone-600">
                    Try selecting different dates on the calendar above or unchecking &ldquo;Hide Sold Out&rdquo;.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {evaluatedRooms.map(({ room, avail }, idx) => {
                    const isSoldOut = avail.status === 'sold_out';
                    const staySubtotal = room.pricePerNightNgn * nights;

                    return (
                      <motion.article
                        key={room.id}
                        initial={{ opacity: 0, y: 30, scale: 0.96 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: false, amount: 0.14 }}
                        transition={{ duration: 0.45, delay: (idx % 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                        whileHover={{ y: -6 }}
                        className="bg-white rounded-2xl border border-stone-200/90 hover:border-[#C8963E] overflow-hidden shadow-xs hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between group"
                      >
                        <div>
                          {/* Room Photography */}
                          <div className="relative h-56 w-full overflow-hidden bg-stone-200">
                            <Image
                              src={room.imageUrl}
                              alt={room.name}
                              fill
                              sizes="(max-width: 768px) 100vw, 33vw"
                              referrerPolicy="no-referrer"
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/20" />

                            {/* Top Status Indicator */}
                            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                              <span className="bg-[#0B2545]/90 backdrop-blur-xs text-white text-[11px] font-mono px-2.5 py-1 rounded-md">
                                {room.sizeSqm} sq m · Sleeps {room.maxGuests}
                              </span>
                              <span
                                className={`text-[11px] font-semibold px-2.5 py-1 rounded-md backdrop-blur-xs flex items-center gap-1 ${
                                  avail.status === 'available'
                                    ? 'bg-emerald-900/90 text-emerald-100'
                                    : avail.status === 'limited'
                                    ? 'bg-amber-900/90 text-amber-100'
                                    : 'bg-red-900/90 text-red-100'
                                }`}
                              >
                                {avail.status === 'available' && (
                                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                                )}
                                {avail.status === 'limited' && (
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                )}
                                {avail.status === 'sold_out' && (
                                  <XCircle className="w-3 h-3 shrink-0" />
                                )}
                                <span>{avail.label}</span>
                              </span>
                            </div>

                            <div className="absolute bottom-3 left-3 right-3 text-white">
                              <p className="text-[11px] text-[#D4A359] font-medium">
                                {room.viewType} · {room.bedConfig}
                              </p>
                              <h4 className="font-serif text-xl font-bold leading-snug">
                                {room.name}
                              </h4>
                            </div>
                          </div>

                          <div className="p-5 space-y-3">
                            <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">
                              {room.description}
                            </p>
                            <p className="text-[11px] text-stone-500">
                              {room.amenities.slice(0, 3).join(' · ')}
                            </p>
                          </div>
                        </div>

                        <div className="px-5 pb-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                          <div>
                            <div className="flex items-baseline gap-1">
                              <span className="font-mono text-lg font-bold text-[#0B2545] tabular-nums">
                                {formatNaira(room.pricePerNightNgn)}
                              </span>
                              <span className="text-xs text-stone-500">/ night</span>
                            </div>
                            <p className="text-[11px] font-mono text-stone-500 tabular-nums">
                              {nights} {nights === 1 ? 'night' : 'nights'}:{' '}
                              <strong className="text-stone-700">
                                {formatNaira(staySubtotal)}
                              </strong>
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={isSoldOut}
                            onClick={() => handleBookRoomForDates(room)}
                            className={`px-4 py-2.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                              isSoldOut
                                ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                                : 'bg-[#0B2545] hover:bg-[#163a66] text-white'
                            }`}
                          >
                            <span>{isSoldOut ? 'Unavailable' : 'Reserve Dates'}</span>
                            {!isSoldOut && <ArrowRight className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 2B. HOTEL SERVICES & VENUES GALLERY GRID (SPA, DINING, EVENT HALLS) */}
          {showServicesSection && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#0B2545] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#C8963E]" />
                  <span>
                    The Calabash Spa, Eko Kitchen Dining &amp; Event Halls Availability
                  </span>
                </h3>
                <span className="text-xs font-mono text-stone-500">
                  Controlled live by Front-Desk &amp; Concierge
                </span>
              </div>

              {evaluatedServices.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center space-y-2">
                  <p className="font-serif text-lg font-bold text-[#0B2545]">
                    No services or venues available for the selected filter
                  </p>
                  <p className="text-xs text-stone-600">
                    Try switching category filters or selecting another date window on the calendar.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {evaluatedServices.map(({ service, avail }, idx) => {
                    const isSoldOut = avail.status === 'sold_out';
                    const categoryLabel =
                      service.category === 'spa'
                        ? 'The Calabash Spa'
                        : service.category === 'dining'
                        ? 'Eko Kitchen & Lounges'
                        : 'Event & Conference Hall';

                    return (
                      <motion.article
                        key={service.id}
                        initial={{ opacity: 0, y: 30, scale: 0.96 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: false, amount: 0.14 }}
                        transition={{ duration: 0.45, delay: (idx % 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                        whileHover={{ y: -6 }}
                        className="bg-white rounded-2xl border border-stone-200/90 hover:border-[#C8963E] overflow-hidden shadow-xs hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between group"
                      >
                        <div>
                          <div className="relative h-52 w-full overflow-hidden bg-stone-200">
                            <Image
                              src={service.imageUrl}
                              alt={service.name}
                              fill
                              sizes="(max-width: 768px) 100vw, 33vw"
                              referrerPolicy="no-referrer"
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25" />

                            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                              <span className="bg-[#0B2545]/90 backdrop-blur-xs text-[#D4A359] text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-md">
                                {categoryLabel}
                              </span>
                              <span
                                className={`text-[11px] font-semibold px-2.5 py-1 rounded-md backdrop-blur-xs flex items-center gap-1 ${
                                  avail.status === 'available'
                                    ? 'bg-emerald-900/90 text-emerald-100'
                                    : avail.status === 'limited'
                                    ? 'bg-amber-900/90 text-amber-100'
                                    : 'bg-red-900/90 text-red-100'
                                }`}
                              >
                                <span>{avail.label}</span>
                              </span>
                            </div>

                            <div className="absolute bottom-3 left-3 right-3 text-white">
                              <p className="text-[11px] text-stone-200 font-mono">
                                {service.durationOrSize}
                              </p>
                              <h4 className="font-serif text-lg font-bold leading-snug">
                                {service.name}
                              </h4>
                            </div>
                          </div>

                          <div className="p-5 space-y-2.5">
                            <p className="text-xs font-semibold text-[#0B2545]">
                              {service.subtitle}
                            </p>
                            <p className="text-xs text-stone-600 leading-relaxed">
                              {service.description}
                            </p>
                          </div>
                        </div>

                        <div className="px-5 pb-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                          <div>
                            <span className="font-mono text-base font-bold text-[#0B2545] tabular-nums">
                              {formatNaira(service.priceNgn)}
                            </span>
                            <span className="text-xs text-stone-500">
                              {' '}
                              / {service.priceUnit}
                            </span>
                          </div>

                          {service.category === 'event_hall' ? (
                            <Link
                              href={`/corporate?hall=${encodeURIComponent(
                                service.name
                              )}&start=${checkIn}&end=${checkOut}`}
                              className={`px-4 py-2.5 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 ${
                                isSoldOut
                                  ? 'bg-stone-200 text-stone-500 pointer-events-none'
                                  : 'bg-[#C8963E] hover:bg-[#b5842f] text-white'
                              }`}
                            >
                              <span>{isSoldOut ? 'Hall Booked' : 'Reserve Hall'}</span>
                              {!isSoldOut && <ArrowRight className="w-3.5 h-3.5" />}
                            </Link>
                          ) : (
                            <button
                              type="button"
                              disabled={isSoldOut}
                              onClick={() => handleBookServiceWithStay(service)}
                              className={`px-4 py-2.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                                isSoldOut
                                  ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                                  : 'bg-[#C8963E] hover:bg-[#b5842f] text-white'
                              }`}
                            >
                              <span>{isSoldOut ? 'Fully Booked' : 'Book with Stay'}</span>
                              {!isSoldOut && <ArrowRight className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        {/* SECTION 3: ARCHITECTURAL & HERITAGE PHOTOGRAPHY ARCHIVE */}
        <section className="space-y-5 pt-4 border-t border-stone-200">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-[#C8963E]">
                1963 Heritage Meets Contemporary Lagos
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B2545]">
                Architectural &amp; Lagoon Visual Archive
              </h2>
            </div>
            <p className="text-xs text-stone-600 max-w-md">
              From hand-carved Iroko timber corridors and indigo Adire textiles to our 12th-floor sunset infinity pool overlooking Victoria Island.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {GALLERY_ITEMS.map((item, index) => (
              <motion.div
                key={item.caption}
                initial={{ opacity: 0, y: 28, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: false, amount: 0.14 }}
                transition={{ duration: 0.45, delay: (index % 4) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -5 }}
                className={`group relative rounded-2xl overflow-hidden border border-stone-200 hover:border-[#C8963E] bg-stone-900 transition-colors ${
                  index === 0 || index === 3 ? 'sm:col-span-2 h-64 sm:h-72' : 'h-60 sm:h-72'
                }`}
              >
                <Image
                  src={item.imageUrl}
                  alt={item.caption}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  referrerPolicy="no-referrer"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                <div className="absolute bottom-3.5 left-4 right-4 text-white">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4A359]">
                    {item.category}
                  </span>
                  <p className="font-serif text-base font-bold leading-snug mt-0.5">
                    {item.caption}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* SECTION 4: INTERACTIVE LAGOS ISLAND LOCATION & DISTANCE COMPARISON MAP */}
        <motion.section
          id="location-map"
          initial={{ opacity: 0, y: 32, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: false, amount: 0.12 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="pt-4"
        >
          <LagosLocationMap
            onBookWithTransfer={() => {
              setSelectedRoom(visibleRooms[1] || visibleRooms[0] || null);
              setInitialAddOns(['airport_pickup']);
              setModalStartStep(1);
              setBookingModalOpen(true);
            }}
          />
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="bg-[#0B2545] text-stone-300 border-t border-white/10 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>
            The Adire Lagoon Hotel &amp; Spa · Plot 14, Adetokunbo Ademola Street, Victoria Island, Lagos
          </p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <Link href="/corporate" className="hover:text-white">
              Corporate &amp; Weddings
            </Link>
          </div>
        </div>
      </footer>

      {/* Self-Booking Modal with Embedded Availability Calendar */}
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
        initialPromoCode={initialPromoCode}
        initialSelectedAddOns={initialAddOns}
        startAtStep={modalStartStep}
      />
    </div>
  );
}

export default function GalleryAndCalendarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B2545] text-white flex items-center justify-center p-6 text-sm">
          Loading Gallery &amp; Live Availability Calendar...
        </div>
      }
    >
      <GalleryAndCalendarContent />
    </Suspense>
  );
}
