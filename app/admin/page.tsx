'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  BedDouble,
  Check,
  MessageCircle,
  Sparkles,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  Lock,
  LogOut,
  AlertCircle,
  ExternalLink,
  Calendar,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useHotelStore } from '@/lib/hotel-store';
import { formatNaira, BookingRecord, resolveHotelImageUrl } from '@/lib/hotel-data';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';

export default function AdminDashboardPage() {
  const {
    rooms,
    hotelServices,
    blocks,
    bookings,
    corporateInquiries,
    updateRoomInventory,
    updateHotelService,
    createDateBlock,
    removeDateBlock,
    updateBookingStatus,
    updateCorporateInquiryStatus,
  } = useHotelStore();

  // Admin Authentication Gate State (Admin / Admin@AdireLagoon)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (window.sessionStorage.getItem('adire_admin_authenticated') === 'true') {
        setIsAuthenticated(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === 'Admin' && password === 'Admin@AdireLagoon') {
      setIsAuthenticated(true);
      setLoginError('');
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('adire_admin_authenticated', 'true');
      }
    } else {
      setLoginError('Invalid staff credentials. Please check your username and password.');
    }
  };

  const router = useRouter();

  const handleExitConsole = () => {
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('adire_admin_authenticated');
    }
    router.push('/');
  };

  const [activeTab, setActiveTab] = useState<
    'inventory' | 'gallery_services' | 'bookings' | 'corporate'
  >('inventory');

  // Room Rate Editing State
  const [editingPriceMap, setEditingPriceMap] = useState<Record<string, string>>({});
  const [savedRateRoomId, setSavedRateRoomId] = useState<string>('');

  // Service Price Editing State
  const [editingServicePriceMap, setEditingServicePriceMap] = useState<Record<string, string>>(
    {}
  );
  const [savedServiceId, setSavedServiceId] = useState<string>('');

  // Date Blocker Form State (Supports both Rooms and Hotel Services)
  const [blockTargetId, setBlockTargetId] = useState<string>('classic-room');
  const [blockStartDate, setBlockStartDate] = useState<string>('2026-11-26');
  const [blockEndDate, setBlockEndDate] = useState<string>('2026-11-28');
  const [blockedCount, setBlockedCount] = useState<number>(2);
  const [blockReason, setBlockReason] = useState<string>(
    'Walk-In / Offline Reservation or Event Hold'
  );
  const [blockStaff, setBlockStaff] = useState<string>('Front Desk — Funke A.');

  // Admin Live Calendar Preview State
  const [previewCheckIn, setPreviewCheckIn] = useState<string>('2026-11-26');
  const [previewCheckOut, setPreviewCheckOut] = useState<string>('2026-11-29');

  // Booking Filter & Search
  const [bookingFilter, setBookingFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [receiptModalBooking, setReceiptModalBooking] = useState<BookingRecord | null>(
    null
  );

  // Revenue & Inventory Metrics (Strictly actual confirmed site payments, excluding demo seed bookings)
  const metrics = useMemo(() => {
    const siteActiveBookings = bookings.filter(
      (b) => !b.id.startsWith('bk-seed-') && b.bookingStatus !== 'cancelled'
    );
    const confirmedPaidSiteBookings = siteActiveBookings.filter(
      (b) => b.paymentStatus === 'paid'
    );
    const holdSiteBookings = siteActiveBookings.filter(
      (b) => b.paymentStatus === 'pending_hold'
    );

    const paidRevenueNgn = confirmedPaidSiteBookings.reduce(
      (sum, b) => sum + (Number(b.totalAmountNgn) || 0),
      0
    );
    const holdRevenueNgn = holdSiteBookings.reduce(
      (sum, b) => sum + (Number(b.totalAmountNgn) || 0),
      0
    );
    const totalDirectRevenueNgn = paidRevenueNgn;
    const estimatedOtaCommissionSavedNgn = Math.round(totalDirectRevenueNgn * 0.15);

    const totalAvailableRooms = rooms.reduce((sum, r) => sum + r.availableCount, 0);
    const totalPhysicalRooms = rooms.reduce((sum, r) => sum + r.totalInventory, 0);
    const visibleGalleryRooms = rooms.filter((r) => r.isVisibleInGallery !== false).length;
    const visibleGalleryServices = hotelServices.filter((s) => s.isVisibleInGallery).length;

    return {
      totalDirectRevenueNgn,
      paidRevenueNgn,
      holdRevenueNgn,
      confirmedPaidCount: confirmedPaidSiteBookings.length,
      estimatedOtaCommissionSavedNgn,
      activeBookingsCount: siteActiveBookings.length,
      totalAvailableRooms,
      totalPhysicalRooms,
      visibleGalleryRooms,
      visibleGalleryServices,
    };
  }, [bookings, rooms, hotelServices]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (bookingFilter === 'paid' && b.paymentStatus !== 'paid') return false;
      if (bookingFilter === 'pending_hold' && b.paymentStatus !== 'pending_hold')
        return false;
      if (bookingFilter === 'checked_in' && b.bookingStatus !== 'checked_in')
        return false;
      if (bookingFilter === 'cancelled' && b.bookingStatus !== 'cancelled')
        return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          b.guestName.toLowerCase().includes(q) ||
          b.reference.toLowerCase().includes(q) ||
          b.roomName.toLowerCase().includes(q) ||
          b.guestPhone.toLowerCase().includes(q) ||
          b.promoCode.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [bookings, bookingFilter, searchQuery]);

  const handleAddDateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const matchedRoom = rooms.find((r) => r.id === blockTargetId);
    const matchedService = hotelServices.find((s) => s.id === blockTargetId);
    const targetId = matchedRoom?.id || matchedService?.id || rooms[0]?.id;
    const targetName = matchedRoom?.name || matchedService?.name || rooms[0]?.name;
    if (!targetId || !targetName) return;

    await createDateBlock({
      roomId: targetId,
      roomName: targetName,
      startDate: blockStartDate,
      endDate: blockEndDate,
      blockedCount,
      reason: blockReason,
      createdBy: blockStaff,
    });
  };

  const handleSaveRoomRate = async (
    roomId: string,
    currentAvail: number,
    override: 'auto' | 'available' | 'limited' | 'sold_out'
  ) => {
    const rawVal = editingPriceMap[roomId];
    if (!rawVal) return;
    const parsed = Number(rawVal);
    if (Number.isNaN(parsed) || parsed < 1000) return;
    await updateRoomInventory(roomId, currentAvail, override, parsed);
    setSavedRateRoomId(roomId);
    setTimeout(() => setSavedRateRoomId(''), 2000);
  };

  const handleSaveServiceRate = async (serviceId: string) => {
    const rawVal = editingServicePriceMap[serviceId];
    if (!rawVal) return;
    const parsed = Number(rawVal);
    if (Number.isNaN(parsed) || parsed < 0) return;
    await updateHotelService(serviceId, { priceNgn: parsed });
    setSavedServiceId(serviceId);
    setTimeout(() => setSavedServiceId(''), 2000);
  };

  const handleTriggerWhatsAppReceipt = async (booking: BookingRecord) => {
    await updateBookingStatus(booking.id, { whatsappSent: true });
    setReceiptModalBooking(booking);
  };

  // HIDDEN STAFF SIGN-IN SCREEN WHEN NOT AUTHENTICATED
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B2545] text-white flex flex-col justify-between p-4 sm:p-8 overflow-x-hidden">
        <div className="max-w-md w-full mx-auto pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D4A359] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Guest Website
          </Link>
        </div>

        <main className="max-w-md w-full mx-auto my-auto bg-white text-stone-900 rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
          <div className="bg-[#FAF7F2] px-6 py-5 border-b border-stone-200 flex items-center gap-4">
            <div className="relative w-24 h-16 shrink-0 rounded-lg bg-white p-1.5 border border-stone-200 shadow-xs">
              <Image
                src="/images/hotel_doc_0.jpg"
                alt="The Adire Lagoon Hotel & Spa Logo"
                fill
                sizes="96px"
                referrerPolicy="no-referrer"
                className="object-contain"
              />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#C8963E]">
                Restricted Staff Access
              </p>
              <h1 className="font-serif text-xl font-bold text-[#0B2545]">
                Front-Desk &amp; Admin Sign In
              </h1>
            </div>
          </div>

          <form onSubmit={handleLogin} className="p-6 space-y-4">
            {loginError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Staff Username
              </label>
              <input
                type="text"
                required
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter staff username"
                className="w-full px-3.5 py-2.5 min-h-[44px] text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-[#0B2545]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Staff Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter staff password"
                  className="w-full pl-3.5 pr-11 py-2.5 min-h-[44px] text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-[#0B2545]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-stone-500 hover:text-[#0B2545] rounded-md transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide staff password' : 'Show staff password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-6 min-h-[46px] text-sm font-semibold text-white bg-[#0B2545] hover:bg-[#173a66] rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4 text-[#D4A359]" />
              Sign In to Front-Desk Console
            </button>
          </form>
        </main>

        <footer className="max-w-md w-full mx-auto text-center text-xs text-stone-400 pb-4">
          The Adire Lagoon Hotel &amp; Spa · Victoria Island, Lagos
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col overflow-x-hidden">
      {/* Top SaaS Admin Workspace Header */}
      <header className="bg-[#0B2545] text-white border-b border-white/15 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative w-20 h-14 rounded-lg bg-white p-1.5 shrink-0 shadow-xs">
              <Image
                src="/images/hotel_doc_0.jpg"
                alt="The Adire Lagoon Hotel & Spa Logo"
                fill
                sizes="80px"
                referrerPolicy="no-referrer"
                className="object-contain"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#D4A359]">
                <Link href="/" className="hover:underline flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Guest Website
                </Link>
                <span>/</span>
                <span>Victoria Island Front Desk</span>
                <span>/</span>
                <span>Authenticated: Admin</span>
              </div>
              <h1 className="font-serif text-lg sm:text-2xl font-bold text-white mt-0.5">
                The Adire Lagoon — Front-Desk Inventory, Gallery &amp; Calendar Console
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('gallery_services')}
              className="px-3.5 py-2 min-h-[38px] text-xs font-semibold text-white bg-[#C8963E] hover:bg-[#b5842f] rounded-md transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Calendar className="w-3.5 h-3.5" /> Gallery &amp; Calendar Manager
            </button>
            <Link
              href="/gallery"
              className="px-3.5 py-2 min-h-[38px] inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 rounded-md transition-colors whitespace-nowrap"
            >
              <span>View Guest Gallery &amp; Calendar</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={handleExitConsole}
              className="px-3.5 py-2 min-h-[38px] text-xs font-semibold text-red-200 hover:text-white bg-red-950/50 hover:bg-red-900/70 border border-red-400/30 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" /> Exit Console
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 flex-1">
        {/* 1. REVENUE, INVENTORY & GALLERY VISIBILITY METRICS */}
        <section className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200">
              <p className="text-xs font-medium text-stone-500">
                Total Direct Revenue Generated
              </p>
              <p className="font-mono text-xl sm:text-2xl font-bold text-[#0B2545] tabular-nums mt-1">
                {formatNaira(metrics.totalDirectRevenueNgn)}
              </p>
              <p className="text-xs text-stone-500 mt-1.5">
                {metrics.confirmedPaidCount} Confirmed Payment{metrics.confirmedPaidCount === 1 ? '' : 's'} ·
                Holds: <span className="font-mono">{formatNaira(metrics.holdRevenueNgn)}</span>
              </p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200">
              <p className="text-xs font-medium text-stone-500">
                Estimated OTA Commission Saved (15%)
              </p>
              <p className="font-mono text-xl sm:text-2xl font-bold text-emerald-700 tabular-nums mt-1">
                {formatNaira(metrics.estimatedOtaCommissionSavedNgn)}
              </p>
              <p className="text-xs text-emerald-800 mt-1.5">
                15% of confirmed direct payments retained in-house
              </p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200">
              <p className="text-xs font-medium text-stone-500">
                Live Physical Inventory Open
              </p>
              <p className="font-mono text-xl sm:text-2xl font-bold text-[#0B2545] tabular-nums mt-1">
                {metrics.totalAvailableRooms} / {metrics.totalPhysicalRooms} Rooms
              </p>
              <p className="text-xs text-stone-500 mt-1.5">
                {blocks.length} active front-desk date blocks
              </p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200">
              <p className="text-xs font-medium text-stone-500">
                Published in Gallery &amp; Calendar
              </p>
              <p className="font-mono text-xl sm:text-2xl font-bold text-[#0B2545] tabular-nums mt-1">
                {metrics.visibleGalleryRooms} Rooms · {metrics.visibleGalleryServices} Services
              </p>
              <p className="text-xs text-stone-500 mt-1.5">
                Spa, Eko Kitchen Dining &amp; Event Halls synced
              </p>
            </div>
          </div>
        </section>

        {/* Navigation Tabs for Front-Desk Modules */}
        <div className="flex items-center gap-2 border-b border-stone-300 pb-3 overflow-x-auto">
          {[
            {
              id: 'inventory',
              label: `Room Inventory & Date Blocks (${rooms.length})`,
            },
            {
              id: 'gallery_services',
              label: `Gallery & Service Calendar Control (${hotelServices.length} Services)`,
            },
            {
              id: 'bookings',
              label: `Live Bookings & Holds (${bookings.length})`,
            },
            {
              id: 'corporate',
              label: `Corporate & Weddings (${corporateInquiries.length})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                setActiveTab(
                  tab.id as 'inventory' | 'gallery_services' | 'bookings' | 'corporate'
                )
              }
              className={`px-4 py-2.5 min-h-[40px] text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'bg-[#0B2545] text-white'
                  : 'bg-white text-stone-700 border border-stone-200 hover:border-[#0B2545]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: ROOM INVENTORY, GALLERY VISIBILITY, RATE EDITOR & DATE BLOCKER */}
        {activeTab === 'inventory' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            {/* Left 7 Columns: Quick Room Count, Gallery Visibility, Status & Rate Controls */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-stone-200 overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-stone-200">
                <h2 className="font-serif text-lg sm:text-xl font-bold text-[#0B2545]">
                  Room Inventory, Gallery Visibility &amp; Naira Rate Switchboard
                </h2>
                <p className="text-xs text-stone-600 mt-0.5">
                  Adjust open room counts, toggle whether a room appears in the public Gallery &amp; Calendar, or override availability immediately.
                </p>
              </div>

              <div className="divide-y divide-stone-200">
                {rooms.map((rm) => {
                  const rateInputVal =
                    editingPriceMap[rm.id] !== undefined
                      ? editingPriceMap[rm.id]
                      : String(rm.pricePerNightNgn);
                  const isVisible = rm.isVisibleInGallery !== false;

                  return (
                    <div
                      key={rm.id}
                      className="p-4 space-y-3 hover:bg-stone-50/80"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-[#0B2545]">{rm.name}</h3>
                            <span className="font-mono text-xs text-stone-600 tabular-nums">
                              ({formatNaira(rm.pricePerNightNgn)}/night)
                            </span>
                          </div>
                          <p className="text-xs text-stone-500">
                            Physical Capacity: <strong className="font-mono">{rm.totalInventory}</strong> ·{' '}
                            {rm.viewType}
                          </p>
                        </div>

                        {/* Rate Editor inline */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono text-stone-500">₦</span>
                          <input
                            type="number"
                            min={1000}
                            step={5000}
                            value={rateInputVal}
                            onChange={(e) =>
                              setEditingPriceMap((prev) => ({
                                ...prev,
                                [rm.id]: e.target.value,
                              }))
                            }
                            className="w-28 px-2.5 py-1.5 text-xs font-mono border border-stone-300 rounded-md bg-white"
                            aria-label={`Nightly rate for ${rm.name}`}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleSaveRoomRate(
                                rm.id,
                                rm.availableCount,
                                rm.manualStatusOverride
                              )
                            }
                            className="px-2.5 py-1.5 text-xs font-semibold text-white bg-[#0B2545] hover:bg-[#173a66] rounded-md cursor-pointer whitespace-nowrap"
                          >
                            {savedRateRoomId === rm.id ? '✓ Saved' : 'Save Rate'}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        {/* - / + Counter */}
                        <div className="flex items-center border border-stone-300 rounded-lg bg-white">
                          <button
                            type="button"
                            onClick={() =>
                              updateRoomInventory(
                                rm.id,
                                Math.max(0, rm.availableCount - 1),
                                rm.manualStatusOverride
                              )
                            }
                            className="p-2.5 min-h-[38px] min-w-[38px] flex items-center justify-center text-stone-700 hover:bg-stone-100 cursor-pointer"
                            aria-label="Decrease available rooms"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 font-mono text-sm font-bold text-[#0B2545] tabular-nums">
                            {rm.availableCount} open
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateRoomInventory(
                                rm.id,
                                Math.min(rm.totalInventory, rm.availableCount + 1),
                                rm.manualStatusOverride
                              )
                            }
                            className="p-2.5 min-h-[38px] min-w-[38px] flex items-center justify-center text-stone-700 hover:bg-stone-100 cursor-pointer"
                            aria-label="Increase available rooms"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {/* Gallery & Calendar Visibility Toggle */}
                          <button
                            type="button"
                            onClick={() =>
                              updateRoomInventory(
                                rm.id,
                                rm.availableCount,
                                rm.manualStatusOverride,
                                undefined,
                                !isVisible
                              )
                            }
                            className={`px-3 py-2 min-h-[38px] text-xs font-semibold rounded-lg border flex items-center gap-1.5 cursor-pointer ${
                              isVisible
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-stone-100 text-stone-500 border-stone-300'
                            }`}
                          >
                            {isVisible ? (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>Shown in Gallery</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>Hidden from Gallery</span>
                              </>
                            )}
                          </button>

                          {/* Quick Status Override Selector */}
                          <select
                            value={rm.manualStatusOverride}
                            onChange={(e) =>
                              updateRoomInventory(
                                rm.id,
                                e.target.value === 'sold_out' ? 0 : rm.availableCount,
                                e.target.value as 'auto' | 'available' | 'limited' | 'sold_out'
                              )
                            }
                            className="px-3 py-2 min-h-[38px] text-xs font-semibold border border-stone-300 rounded-lg bg-white"
                          >
                            <option value="auto">Auto Status</option>
                            <option value="available">Force Available</option>
                            <option value="limited">Mark Limited</option>
                            <option value="sold_out">Block / Sold Out</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 5 Columns: Date-Range Blocker for Rooms OR Hotel Services */}
            <div className="lg:col-span-5 space-y-6">
              <form
                onSubmit={handleAddDateBlock}
                className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200 space-y-4"
              >
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#0B2545]">
                    Block Dates for Rooms, Spa, Dining or Event Halls
                  </h3>
                  <p className="text-xs text-stone-600">
                    Deducts rooms or service slots for specific date ranges on the public Gallery &amp; Calendar and Step 1 Booking Calendar.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Target Room Category or Hotel Service
                    </label>
                    <select
                      value={blockTargetId}
                      onChange={(e) => setBlockTargetId(e.target.value)}
                      className="w-full px-3 py-2.5 min-h-[42px] text-xs border border-stone-300 rounded-lg"
                    >
                      <optgroup label="Rooms & Suites">
                        {rooms.map((r) => (
                          <option key={r.id} value={r.id}>
                            [Room] {r.name} ({r.availableCount} open)
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="The Calabash Spa, Eko Kitchen & Event Halls">
                        {hotelServices.map((s) => (
                          <option key={s.id} value={s.id}>
                            [Service] {s.name} ({s.availableSlots} slots open)
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={blockStartDate}
                        onChange={(e) => setBlockStartDate(e.target.value)}
                        className="w-full px-3 py-2.5 min-h-[42px] text-xs border border-stone-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={blockEndDate}
                        min={blockStartDate}
                        onChange={(e) => setBlockEndDate(e.target.value)}
                        className="w-full px-3 py-2.5 min-h-[42px] text-xs border border-stone-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Rooms / Slots to Block
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={blockedCount}
                        onChange={(e) => setBlockedCount(Number(e.target.value))}
                        className="w-full px-3 py-2.5 min-h-[42px] text-xs border border-stone-300 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Logged By Staff
                      </label>
                      <input
                        type="text"
                        value={blockStaff}
                        onChange={(e) => setBlockStaff(e.target.value)}
                        className="w-full px-3 py-2.5 min-h-[42px] text-xs border border-stone-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Reason (Walk-in, Private Event Hold, OTA Reservation, Maintenance)
                    </label>
                    <input
                      type="text"
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      className="w-full px-3 py-2.5 min-h-[42px] text-xs border border-stone-300 rounded-lg"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 min-h-[44px] text-xs font-semibold text-white bg-[#0B2545] hover:bg-[#173b66] rounded-lg cursor-pointer"
                >
                  Create Instant Date Block
                </button>
              </form>

              {/* Active Date Blocks List */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200 space-y-3">
                <h3 className="text-sm font-bold text-[#0B2545]">
                  Active Date-Range Blocks ({blocks.length})
                </h3>
                {blocks.length === 0 ? (
                  <p className="text-xs text-stone-500">
                    No active date blocks. All open room and service inventory is available for direct booking.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {blocks.map((blk) => (
                      <div
                        key={blk.id}
                        className="p-3 rounded-lg bg-stone-50 border border-stone-200 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-[#0B2545]">
                            {blk.roomName} · {blk.blockedCount}{' '}
                            {blk.blockedCount === 1 ? 'unit' : 'units'} blocked
                          </p>
                          <p className="font-mono text-stone-600 mt-0.5">
                            {blk.startDate} → {blk.endDate}
                          </p>
                          <p className="text-stone-500 mt-0.5 break-words">
                            {blk.reason} ({blk.createdBy})
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDateBlock(blk.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded cursor-pointer shrink-0"
                          title="Release Date Block"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GALLERY & SERVICE CALENDAR CONTROL CENTER */}
        {activeTab === 'gallery_services' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-[#C8963E]">
                    Real-Time Gallery &amp; Calendar Curation
                  </p>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#0B2545] mt-0.5">
                    Control What Appears in the Public Gallery &amp; Calendar
                  </h2>
                  <p className="text-xs text-stone-600 mt-1">
                    Manage visibility, daily capacity slots, Naira pricing, and availability status for The Calabash Spa treatments, Eko Kitchen dining tables, and Event &amp; Conference Halls.
                  </p>
                </div>

                <Link
                  href="/gallery"
                  className="px-4 py-2.5 text-xs font-semibold text-white bg-[#0B2545] hover:bg-[#163a66] rounded-lg inline-flex items-center gap-1.5 shrink-0"
                >
                  <span>Preview Live Gallery &amp; Calendar</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-stone-200">
                {hotelServices.map((svc) => {
                  const priceInputVal =
                    editingServicePriceMap[svc.id] !== undefined
                      ? editingServicePriceMap[svc.id]
                      : String(svc.priceNgn);
                  const categoryBadge =
                    svc.category === 'spa'
                      ? 'The Calabash Spa'
                      : svc.category === 'dining'
                      ? 'Eko Kitchen Dining'
                      : 'Event & Conference Hall';

                  return (
                    <div
                      key={svc.id}
                      className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-stone-50/80"
                    >
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="relative w-20 h-16 rounded-lg overflow-hidden shrink-0 bg-stone-200 border border-stone-200">
                          <Image
                            src={resolveHotelImageUrl(svc.imageUrl, svc.id)}
                            alt={svc.name}
                            fill
                            sizes="80px"
                            referrerPolicy="no-referrer"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#0B2545] text-[#D4A359] font-semibold">
                              {categoryBadge}
                            </span>
                            <span className="text-xs font-mono text-stone-500">
                              {svc.durationOrSize}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-[#0B2545]">{svc.name}</h3>
                          <p className="text-xs text-stone-600 line-clamp-1">
                            {svc.subtitle} · Max Daily Capacity: {svc.dailyCapacity}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 shrink-0">
                        {/* Price Editor */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono text-stone-500">₦</span>
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            value={priceInputVal}
                            onChange={(e) =>
                              setEditingServicePriceMap((prev) => ({
                                ...prev,
                                [svc.id]: e.target.value,
                              }))
                            }
                            className="w-28 px-2.5 py-1.5 text-xs font-mono border border-stone-300 rounded-md bg-white"
                            aria-label={`Price for ${svc.name}`}
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveServiceRate(svc.id)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-white bg-[#0B2545] hover:bg-[#173a66] rounded-md cursor-pointer whitespace-nowrap"
                          >
                            {savedServiceId === svc.id ? '✓ Saved' : 'Save ₦'}
                          </button>
                        </div>

                        {/* Daily Slots - / + Counter */}
                        <div className="flex items-center border border-stone-300 rounded-lg bg-white">
                          <button
                            type="button"
                            onClick={() =>
                              updateHotelService(svc.id, {
                                availableSlots: Math.max(0, svc.availableSlots - 1),
                              })
                            }
                            className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center text-stone-700 hover:bg-stone-100 cursor-pointer"
                            aria-label="Decrease available slots"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 font-mono text-xs font-bold text-[#0B2545] tabular-nums">
                            {svc.availableSlots} / {svc.dailyCapacity} slots
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateHotelService(svc.id, {
                                availableSlots: Math.min(
                                  svc.dailyCapacity,
                                  svc.availableSlots + 1
                                ),
                              })
                            }
                            className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center text-stone-700 hover:bg-stone-100 cursor-pointer"
                            aria-label="Increase available slots"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Status Override */}
                        <select
                          value={svc.manualStatusOverride}
                          onChange={(e) =>
                            updateHotelService(svc.id, {
                              manualStatusOverride: e.target.value as
                                | 'auto'
                                | 'available'
                                | 'limited'
                                | 'sold_out',
                              availableSlots:
                                e.target.value === 'sold_out' ? 0 : svc.availableSlots,
                            })
                          }
                          className="px-3 py-2 min-h-[36px] text-xs font-semibold border border-stone-300 rounded-lg bg-white"
                        >
                          <option value="auto">Auto Status</option>
                          <option value="available">Force Available</option>
                          <option value="limited">Mark Limited</option>
                          <option value="sold_out">Sold Out / Closed</option>
                        </select>

                        {/* Visibility Toggle in Gallery & Calendar */}
                        <button
                          type="button"
                          onClick={() =>
                            updateHotelService(svc.id, {
                              isVisibleInGallery: !svc.isVisibleInGallery,
                            })
                          }
                          className={`px-3 py-2 min-h-[36px] text-xs font-semibold rounded-lg border flex items-center gap-1.5 cursor-pointer ${
                            svc.isVisibleInGallery
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-stone-100 text-stone-500 border-stone-300'
                          }`}
                        >
                          {svc.isVisibleInGallery ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Visible in Gallery</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Hidden</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Admin Calendar Verification Preview */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#0B2545]">
                    Live Calendar Impact Preview (Synced with Guest Booking Modal &amp; Gallery)
                  </h3>
                  <p className="text-xs text-stone-600">
                    Any inventory adjustments, service visibility changes, or date blocks created above immediately reflect on the monthly calendar below.
                  </p>
                </div>
                <span className="font-mono text-xs text-[#0B2545] font-semibold">
                  Previewing: {previewCheckIn} → {previewCheckOut}
                </span>
              </div>

              <AvailabilityCalendar
                checkIn={previewCheckIn}
                checkOut={previewCheckOut}
                onSelectRange={(nextIn, nextOut) => {
                  setPreviewCheckIn(nextIn);
                  setPreviewCheckOut(nextOut);
                }}
              />
            </div>
          </div>
        )}

        {/* TAB 3: LIVE BOOKING & HOLD QUEUE */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-[#0B2545]">
                  Live Direct Booking &amp; Corporate Hold Queue
                </h2>
                <p className="text-xs text-stone-600">
                  Real-time feed of incoming direct website bookings, Paystack statuses, promo codes, and one-click front-desk actions.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search guest, ref, room..."
                  className="px-3 py-2 min-h-[38px] text-xs border border-stone-300 rounded-lg"
                />
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {['all', 'paid', 'pending_hold', 'checked_in', 'cancelled'].map((flt) => (
                    <button
                      key={flt}
                      type="button"
                      onClick={() => setBookingFilter(flt)}
                      className={`px-3 py-1.5 min-h-[34px] text-xs font-semibold rounded-md cursor-pointer whitespace-nowrap shrink-0 ${
                        bookingFilter === flt
                          ? 'bg-[#0B2545] text-white'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {flt.replace('_', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Card List (< md) */}
            <div className="md:hidden divide-y divide-stone-200">
              {filteredBookings.map((bk) => (
                <div key={bk.id} className="p-4 space-y-3 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono font-bold text-[#0B2545] text-sm">
                        {bk.reference}
                      </p>
                      <p className="font-semibold text-stone-900 text-sm">{bk.guestName}</p>
                      <p className="text-stone-500">{bk.guestPhone}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-bold text-[#0B2545] tabular-nums">
                        {formatNaira(bk.totalAmountNgn)}
                      </p>
                      <p
                        className={`font-semibold mt-0.5 ${
                          bk.paymentStatus === 'paid' ? 'text-emerald-800' : 'text-amber-800'
                        }`}
                      >
                        {bk.paymentStatus === 'paid' ? 'PAID (Paystack)' : 'PENDING HOLD'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-1">
                    <p className="font-semibold text-stone-900">
                      {bk.roomName} × {bk.roomsCount} ({bk.nights} nights)
                    </p>
                    <p className="font-mono text-stone-600">
                      {bk.checkIn} → {bk.checkOut}
                    </p>
                    <p className="text-stone-500">
                      Promo: <strong className="font-mono">{bk.promoCode || 'NONE'}</strong> · Status:{' '}
                      <strong>{bk.bookingStatus.toUpperCase()}</strong>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {bk.bookingStatus !== 'checked_in' &&
                      bk.bookingStatus !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() =>
                            updateBookingStatus(bk.id, {
                              bookingStatus: 'checked_in',
                              paymentStatus: 'paid',
                            })
                          }
                          className="py-2.5 px-3 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer"
                        >
                          Confirm Check-In
                        </button>
                      )}

                    {bk.paymentStatus === 'pending_hold' &&
                      bk.bookingStatus !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() =>
                            updateBookingStatus(bk.id, {
                              paymentStatus: 'paid',
                            })
                          }
                          className="py-2.5 px-3 text-xs font-semibold text-[#0B2545] bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg cursor-pointer"
                        >
                          Mark Paid
                        </button>
                      )}

                    <button
                      type="button"
                      onClick={() => handleTriggerWhatsAppReceipt(bk)}
                      className="py-2.5 px-3 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer"
                    >
                      WhatsApp Receipt
                    </button>

                    {bk.bookingStatus !== 'cancelled' && (
                      <button
                        type="button"
                        onClick={() =>
                          updateBookingStatus(bk.id, {
                            bookingStatus: 'cancelled',
                          })
                        }
                        className="py-2.5 px-3 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg cursor-pointer"
                      >
                        Cancel / Release
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-600">
                    <th className="py-3 px-4 font-semibold">Reference &amp; Guest</th>
                    <th className="py-3 px-4 font-semibold">Room &amp; Dates</th>
                    <th className="py-3 px-4 font-semibold">Promo Code</th>
                    <th className="py-3 px-4 font-semibold text-right">Total (NGN)</th>
                    <th className="py-3 px-4 font-semibold">Payment &amp; Status</th>
                    <th className="py-3 px-4 font-semibold text-right">
                      Front-Desk One-Click Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {filteredBookings.map((bk) => (
                    <tr key={bk.id} className="hover:bg-stone-50/80">
                      <td className="py-3.5 px-4 align-top">
                        <p className="font-mono font-bold text-[#0B2545]">{bk.reference}</p>
                        <p className="font-semibold text-stone-900 mt-0.5">{bk.guestName}</p>
                        <p className="text-stone-500">{bk.guestPhone}</p>
                        <p className="text-stone-500">{bk.guestEmail}</p>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <p className="font-semibold text-stone-900">
                          {bk.roomName} × {bk.roomsCount}
                        </p>
                        <p className="font-mono text-stone-600 mt-0.5">
                          {bk.checkIn} → {bk.checkOut} ({bk.nights}n)
                        </p>
                        <p className="text-stone-500 mt-0.5">
                          {bk.adults} Adults, {bk.children} Children · Arrival: {bk.arrivalTime}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <p className="font-mono text-stone-800">
                          Promo: <strong>{bk.promoCode || 'NONE'}</strong>
                        </p>
                        {bk.discountAmountNgn > 0 && (
                          <p className="text-emerald-700 font-mono mt-0.5">
                            Saved {formatNaira(bk.discountAmountNgn)}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-top text-right font-mono tabular-nums">
                        <p className="text-sm font-bold text-[#0B2545]">
                          {formatNaira(bk.totalAmountNgn)}
                        </p>
                        <p className="text-[11px] text-emerald-700 mt-0.5">
                          OTA Saved: {formatNaira(Math.round(bk.totalAmountNgn * 0.15))}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 align-top space-y-1">
                        <div>
                          <span
                            className={`font-semibold ${
                              bk.paymentStatus === 'paid'
                                ? 'text-emerald-800'
                                : 'text-amber-800'
                            }`}
                          >
                            {bk.paymentStatus === 'paid'
                              ? 'PAID (Paystack)'
                              : 'PENDING HOLD'}
                          </span>
                        </div>
                        <p className="font-mono text-[11px] text-stone-500">
                          {bk.paystackReference}
                        </p>
                        <p className="font-semibold text-stone-800">
                          Booking: {bk.bookingStatus.toUpperCase()}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {bk.bookingStatus !== 'checked_in' &&
                            bk.bookingStatus !== 'cancelled' && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateBookingStatus(bk.id, {
                                    bookingStatus: 'checked_in',
                                    paymentStatus: 'paid',
                                  })
                                }
                                className="px-2.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded cursor-pointer whitespace-nowrap"
                              >
                                Confirm Check-In
                              </button>
                            )}

                          {bk.paymentStatus === 'pending_hold' &&
                            bk.bookingStatus !== 'cancelled' && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateBookingStatus(bk.id, {
                                    paymentStatus: 'paid',
                                  })
                                }
                                className="px-2.5 py-1.5 text-xs font-semibold text-[#0B2545] bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded cursor-pointer whitespace-nowrap"
                              >
                                Mark Paid
                              </button>
                            )}

                          <button
                            type="button"
                            onClick={() => handleTriggerWhatsAppReceipt(bk)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded cursor-pointer whitespace-nowrap"
                          >
                            WhatsApp Receipt
                          </button>

                          {bk.bookingStatus !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() =>
                                updateBookingStatus(bk.id, {
                                  bookingStatus: 'cancelled',
                                })
                              }
                              className="px-2.5 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded cursor-pointer whitespace-nowrap"
                            >
                              Cancel / Release Room
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: CORPORATE & WEDDING INQUIRIES */}
        {activeTab === 'corporate' && (
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-stone-200">
              <h2 className="font-serif text-lg sm:text-xl font-bold text-[#0B2545]">
                Corporate Room Blocks, Conference Hall &amp; Wedding Inquiries
              </h2>
              <p className="text-xs text-stone-600">
                Leads captured from `/corporate` and Event Hall calendar reservations.
              </p>
            </div>

            <div className="divide-y divide-stone-200">
              {corporateInquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1 text-xs">
                    <p className="font-semibold text-[#C8963E] uppercase">
                      {inq.inquiryType.replace('_', ' ')} · Status: {inq.status.toUpperCase()}
                    </p>
                    <h3 className="font-serif text-lg font-bold text-[#0B2545]">
                      {inq.companyOrFamilyName} — {inq.contactName}
                    </h3>
                    <p className="text-stone-600">
                      {inq.contactEmail} · {inq.contactPhone}
                    </p>
                    <p className="text-stone-800 font-medium pt-1">
                      Venue: {inq.preferredHall} ·{' '}
                      <span className="font-mono">
                        {inq.roomsNeeded} Rooms · {inq.estimatedGuests} Guests
                      </span>{' '}
                      ({inq.eventStartDate} to {inq.eventEndDate})
                    </p>
                    <p className="text-stone-600">Catering: {inq.cateringNeeds}</p>
                    {inq.notes && <p className="text-stone-500">Notes: {inq.notes}</p>}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {(['new', 'quoted', 'confirmed'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => updateCorporateInquiryStatus(inq.id, st)}
                        className={`px-3 py-2 min-h-[36px] text-xs font-semibold rounded-md cursor-pointer ${
                          inq.status === st
                            ? 'bg-[#0B2545] text-white'
                            : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                        }`}
                      >
                        Mark {st.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* WhatsApp Confirmation Receipt Preview Modal */}
      {receiptModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 sm:p-6 space-y-4 border border-stone-200">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold text-[#0B2545]">
                WhatsApp Confirmation Receipt Dispatched
              </h3>
              <button
                type="button"
                onClick={() => setReceiptModalBooking(null)}
                className="text-xs text-stone-500 hover:text-stone-900 cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-950 whitespace-pre-line">
              {`*E kaabo to The Adire Lagoon Hotel & Spa!*
Ref: ${receiptModalBooking.reference}
Guest: ${receiptModalBooking.guestName}
Room: ${receiptModalBooking.roomName} (x${receiptModalBooking.roomsCount})
Check-in: ${receiptModalBooking.checkIn} (2:00 pm)
Check-out: ${receiptModalBooking.checkOut} (12:00 noon)
Total: ${formatNaira(receiptModalBooking.totalAmountNgn)} (${receiptModalBooking.paymentStatus.toUpperCase()})
Plot 14, Adetokunbo Ademola Street, Victoria Island, Lagos`}
            </div>
            <div className="flex items-center justify-end gap-2">
              <a
                href={`https://wa.me/${receiptModalBooking.guestPhone.replace(
                  /[^0-9]/g,
                  ''
                )}?text=${encodeURIComponent(
                  `E kaabo ${receiptModalBooking.guestName}! Your stay at The Adire Lagoon Hotel & Spa (${receiptModalBooking.reference}) for ${receiptModalBooking.roomName} (${receiptModalBooking.checkIn} to ${receiptModalBooking.checkOut}) is confirmed. Total: ${formatNaira(receiptModalBooking.totalAmountNgn)}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" /> Open in WhatsApp
              </a>
              <button
                type="button"
                onClick={() => setReceiptModalBooking(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 rounded-lg cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
