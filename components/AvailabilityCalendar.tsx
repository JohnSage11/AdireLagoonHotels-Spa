'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { useHotelStore } from '@/lib/hotel-store';
import { calculateNights, formatNaira } from '@/lib/hotel-data';

interface AvailabilityCalendarProps {
  checkIn: string;
  checkOut: string;
  onSelectRange: (nextCheckIn: string, nextCheckOut: string) => void;
  targetRoomId?: string;
  compact?: boolean;
}

const AVAILABLE_MONTHS = [
  { year: 2026, month: 10, label: 'November 2026' }, // 0-indexed month 10 = Nov
  { year: 2026, month: 11, label: 'December 2026' }, // 11 = Dec
  { year: 2027, month: 0, label: 'January 2027' },
  { year: 2027, month: 1, label: 'February 2027' },
];

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatYmd(year: number, monthZeroIndexed: number, day: number): string {
  const mm = String(monthZeroIndexed + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

function addDaysYmd(ymd: string, daysToAdd: number): string {
  const parts = ymd.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return '2026-11-26';
  const dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + daysToAdd));
  return dt.toISOString().slice(0, 10);
}

export default function AvailabilityCalendar({
  checkIn,
  checkOut,
  onSelectRange,
  targetRoomId,
  compact = false,
}: AvailabilityCalendarProps) {
  const { getDailyCalendarSummary, rooms } = useHotelStore();

  const [monthIdx, setMonthIdx] = useState<number>(() => {
    if (checkIn.startsWith('2026-12')) return 1;
    if (checkIn.startsWith('2027-01')) return 2;
    if (checkIn.startsWith('2027-02')) return 3;
    return 0;
  });

  // Two-tap selection state: 'idle' means next click picks a new check-in; 'picking_checkout' means next click picks check-out
  const [selectionPhase, setSelectionPhase] = useState<'idle' | 'picking_checkout'>('idle');

  const activeMonth = AVAILABLE_MONTHS[monthIdx] || AVAILABLE_MONTHS[0];
  const nights = calculateNights(checkIn, checkOut);

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(Date.UTC(activeMonth.year, activeMonth.month, 1));
    const daysInMonth = new Date(
      Date.UTC(activeMonth.year, activeMonth.month + 1, 0)
    ).getUTCDate();
    // Convert Sunday=0..Saturday=6 into Monday=0..Sunday=6
    const startOffset = (firstDayOfMonth.getUTCDay() + 6) % 7;

    const cells: Array<{
      day: number | null;
      dateStr: string | null;
    }> = [];

    for (let i = 0; i < startOffset; i += 1) {
      cells.push({ day: null, dateStr: null });
    }

    for (let d = 1; d <= daysInMonth; d += 1) {
      cells.push({
        day: d,
        dateStr: formatYmd(activeMonth.year, activeMonth.month, d),
      });
    }

    return cells;
  }, [activeMonth]);

  const handleDayClick = (dateStr: string) => {
    if (selectionPhase === 'idle') {
      const autoCheckout = addDaysYmd(dateStr, 2);
      onSelectRange(dateStr, autoCheckout);
      setSelectionPhase('picking_checkout');
    } else {
      if (dateStr <= checkIn) {
        // Clicked earlier or same date -> restart check-in at this date
        const autoCheckout = addDaysYmd(dateStr, 2);
        onSelectRange(dateStr, autoCheckout);
        setSelectionPhase('picking_checkout');
      } else {
        onSelectRange(checkIn, dateStr);
        setSelectionPhase('idle');
      }
    }
  };

  const applyQuickPreset = (startStr: string, endStr: string, targetMIdx: number) => {
    setMonthIdx(targetMIdx);
    onSelectRange(startStr, endStr);
    setSelectionPhase('idle');
  };

  const targetRoomName = useMemo(() => {
    if (!targetRoomId) return null;
    return rooms.find((r) => r.id === targetRoomId)?.name || null;
  }, [targetRoomId, rooms]);

  return (
    <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs overflow-hidden">
      {/* Top Calendar Header & Month Switcher */}
      <div className="bg-[#0B2545] text-white px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[#D4A359] text-xs font-mono uppercase tracking-wider">
            <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
            <span>
              {targetRoomName
                ? `Live Availability Calendar · ${targetRoomName}`
                : 'Live Room & Service Availability Calendar'}
            </span>
          </div>
          <p className="text-xs text-stone-300 mt-0.5">
            {selectionPhase === 'picking_checkout'
              ? `Check-in set to ${checkIn} — now tap your Check-out date on the grid`
              : `Selected Stay: ${checkIn} → ${checkOut} (${nights} ${
                  nights === 1 ? 'Night' : 'Nights'
                })`}
          </p>
        </div>

        {/* Month Navigation Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2 bg-white/10 rounded-lg p-1 border border-white/15">
          <button
            type="button"
            disabled={monthIdx === 0}
            onClick={() => setMonthIdx((prev) => Math.max(0, prev - 1))}
            className="p-1.5 rounded-md hover:bg-white/15 disabled:opacity-35 transition-colors cursor-pointer"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-serif text-base sm:text-lg font-bold px-2 min-w-[135px] text-center">
            {activeMonth.label}
          </span>
          <button
            type="button"
            disabled={monthIdx === AVAILABLE_MONTHS.length - 1}
            onClick={() =>
              setMonthIdx((prev) => Math.min(AVAILABLE_MONTHS.length - 1, prev + 1))
            }
            className="p-1.5 rounded-md hover:bg-white/15 disabled:opacity-35 transition-colors cursor-pointer"
            aria-label="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Date Range Presets + Status Legend */}
      <div className="bg-[#FAF7F2] px-4 sm:px-6 py-3 border-b border-stone-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 mr-1">
            Quick Dates:
          </span>
          <button
            type="button"
            onClick={() => applyQuickPreset('2026-11-27', '2026-11-29', 0)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
              checkIn === '2026-11-27' && checkOut === '2026-11-29'
                ? 'bg-[#0B2545] text-white border-[#0B2545]'
                : 'bg-white text-stone-700 border-stone-300 hover:border-[#0B2545]'
            }`}
          >
            This Weekend (27–29 Nov)
          </button>
          <button
            type="button"
            onClick={() => applyQuickPreset('2026-11-25', '2026-11-28', 0)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
              checkIn === '2026-11-25' && checkOut === '2026-11-28'
                ? 'bg-[#0B2545] text-white border-[#0B2545]'
                : 'bg-white text-stone-700 border-stone-300 hover:border-[#0B2545]'
            }`}
          >
            3-Night Lagoon Escape
          </button>
          <button
            type="button"
            onClick={() => applyQuickPreset('2026-12-18', '2026-12-22', 1)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
              checkIn === '2026-12-18' && checkOut === '2026-12-22'
                ? 'bg-[#C8963E] text-white border-[#C8963E]'
                : 'bg-white text-stone-700 border-stone-300 hover:border-[#C8963E]'
            }`}
          >
            Detty December (18–22 Dec)
          </button>
          <button
            type="button"
            onClick={() => applyQuickPreset('2027-01-08', '2027-01-11', 2)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
              checkIn === '2027-01-08' && checkOut === '2027-01-11'
                ? 'bg-[#0B2545] text-white border-[#0B2545]'
                : 'bg-white text-stone-700 border-stone-300 hover:border-[#0B2545]'
            }`}
          >
            New Year Retreat (Jan 8–11)
          </button>
        </div>

        {/* Semantic Availability Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600">
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Open</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Limited</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            <span>Sold Out / Blocked</span>
          </span>
        </div>
      </div>

      {/* 7-Column Weekday Header */}
      <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-50 text-center">
        {WEEKDAYS.map((dayName) => (
          <div
            key={dayName}
            className="py-2 text-[11px] font-mono font-semibold uppercase tracking-wider text-stone-500"
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* 7-Column Calendar Day Cells */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeMonth.label}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="grid grid-cols-7 divide-x divide-y divide-stone-200 bg-stone-100"
        >
          {calendarDays.map((cell, idx) => {
          if (!cell.day || !cell.dateStr) {
            return (
              <div
                key={`empty-${idx}`}
                className={`bg-stone-50/60 ${compact ? 'min-h-[64px]' : 'min-h-[78px] sm:min-h-[96px]'}`}
              />
            );
          }

          const dateStr = cell.dateStr;
          const summary = getDailyCalendarSummary(dateStr, targetRoomId);
          const isCheckIn = dateStr === checkIn;
          const isCheckOut = dateStr === checkOut;
          const isInStayRange = dateStr > checkIn && dateStr < checkOut;
          const isPast = dateStr < '2026-11-24';

          let cellBg = 'bg-white hover:bg-[#FAF7F2]';
          if (isCheckIn || isCheckOut) {
            cellBg = 'bg-[#0B2545] text-white';
          } else if (isInStayRange) {
            cellBg = 'bg-[#C8963E]/15 text-[#0B2545]';
          } else if (summary.status === 'sold_out') {
            cellBg = 'bg-red-50/60 text-stone-400';
          }

          return (
            <button
              key={dateStr}
              type="button"
              disabled={isPast}
              onClick={() => handleDayClick(dateStr)}
              className={`p-1.5 sm:p-2 text-left transition-all flex flex-col justify-between relative group cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                compact ? 'min-h-[64px]' : 'min-h-[78px] sm:min-h-[96px]'
              } ${cellBg}`}
            >
              {/* Top Row: Day number + Check-In/Out tag */}
              <div className="flex items-start justify-between gap-1 w-full">
                <span
                  className={`font-mono text-xs sm:text-sm font-bold tabular-nums ${
                    isCheckIn || isCheckOut
                      ? 'text-white'
                      : isInStayRange
                      ? 'text-[#0B2545]'
                      : 'text-stone-800'
                  }`}
                >
                  {cell.day}
                </span>

                {(isCheckIn || isCheckOut) && (
                  <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-tighter px-1 py-0.5 rounded bg-[#C8963E] text-white font-semibold leading-none">
                    {isCheckIn ? 'IN' : 'OUT'}
                  </span>
                )}
              </div>

              {/* Middle Row: Rooms & Services count */}
              <div className="my-0.5 space-y-0.5 w-full">
                <div className="flex items-center gap-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      summary.status === 'available'
                        ? 'bg-emerald-500'
                        : summary.status === 'limited'
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                  />
                  <span
                    className={`font-mono text-[10px] sm:text-[11px] font-semibold tabular-nums truncate ${
                      isCheckIn || isCheckOut
                        ? 'text-stone-100'
                        : summary.status === 'available'
                        ? 'text-emerald-800'
                        : summary.status === 'limited'
                        ? 'text-amber-800'
                        : 'text-red-700'
                    }`}
                  >
                    {summary.statusLabel}
                  </span>
                </div>

                {!compact && (
                  <p
                    className={`hidden sm:block text-[10px] font-mono truncate ${
                      isCheckIn || isCheckOut ? 'text-[#D4A359]' : 'text-stone-500'
                    }`}
                  >
                    +{summary.openServicesCount} spa/dining
                  </p>
                )}
              </div>

              {/* Bottom Row: Lowest Nightly Rate */}
              <div className="w-full pt-0.5 border-t border-black/5 flex items-center justify-between">
                <span
                  className={`font-mono text-[9px] sm:text-[10px] tabular-nums truncate ${
                    isCheckIn || isCheckOut ? 'text-stone-200' : 'text-stone-500'
                  }`}
                >
                  {summary.status === 'sold_out'
                    ? 'Closed'
                    : `₦${Math.round(summary.lowestRoomRateNgn / 1000)}k+`}
                </span>
                {isInStayRange && (
                  <Sparkles className="w-2.5 h-2.5 text-[#C8963E] shrink-0 hidden sm:inline" />
                )}
              </div>
            </button>
          );
        })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
