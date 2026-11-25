'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
} from 'firebase/firestore';
import { db, testConnection, handleFirestoreError, OperationType } from './firebase';
import {
  RoomCategory,
  HotelServiceItem,
  AvailabilityBlock,
  BookingRecord,
  PromoCodeRecord,
  CorporateInquiryRecord,
  RepeatGuestRecord,
  INITIAL_ROOMS,
  INITIAL_HOTEL_SERVICES,
  INITIAL_PROMO_CODES,
  INITIAL_BOOKINGS,
  INITIAL_BLOCKS,
  INITIAL_CORPORATE_INQUIRIES,
  INITIAL_REPEAT_GUESTS,
} from './hotel-data';

interface CreateBookingInput {
  roomId: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomsCount: number;
  adults: number;
  children: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  arrivalTime: string;
  specialRequests: string;
  selectedAddOns: string[];
  addOnsTotalNgn: number;
  roomSubtotalNgn: number;
  promoCode: string;
  discountAmountNgn: number;
  vatAmountNgn: number;
  consumptionTaxNgn: number;
  serviceChargeNgn: number;
  totalAmountNgn: number;
  paymentMethod: 'paystack_card' | 'paystack_transfer' | 'paystack_ussd' | 'pay_at_hotel';
  paymentStatus: 'paid' | 'pending_hold';
  paystackReference: string;
  utmSource: string;
}

export interface DailyCalendarSummary {
  dateStr: string;
  totalOpenRooms: number;
  openRoomCategoriesCount: number;
  openServicesCount: number;
  lowestRoomRateNgn: number;
  status: 'available' | 'limited' | 'sold_out';
  statusLabel: string;
}

interface HotelStoreContextValue {
  rooms: RoomCategory[];
  hotelServices: HotelServiceItem[];
  blocks: AvailabilityBlock[];
  bookings: BookingRecord[];
  promoCodes: PromoCodeRecord[];
  corporateInquiries: CorporateInquiryRecord[];
  repeatGuests: RepeatGuestRecord[];
  utmSource: string;
  setUtmSource: (utm: string) => void;
  isLoading: boolean;
  getEffectiveAvailability: (
    room: RoomCategory,
    checkIn?: string,
    checkOut?: string
  ) => {
    effectiveAvailable: number;
    blockedForDates: number;
    status: 'available' | 'limited' | 'sold_out';
    label: string;
  };
  getServiceEffectiveAvailability: (
    service: HotelServiceItem,
    checkIn?: string,
    checkOut?: string
  ) => {
    effectiveAvailable: number;
    blockedForDates: number;
    status: 'available' | 'limited' | 'sold_out';
    label: string;
  };
  getDailyCalendarSummary: (dateStr: string, targetRoomId?: string) => DailyCalendarSummary;
  createAtomicBooking: (input: CreateBookingInput) => Promise<BookingRecord>;
  updateRoomInventory: (
    roomId: string,
    availableCount: number,
    manualStatusOverride: 'auto' | 'available' | 'limited' | 'sold_out',
    pricePerNightNgn?: number,
    isVisibleInGallery?: boolean
  ) => Promise<void>;
  updateHotelService: (
    serviceId: string,
    updates: {
      availableSlots?: number;
      manualStatusOverride?: 'auto' | 'available' | 'limited' | 'sold_out';
      priceNgn?: number;
      isVisibleInGallery?: boolean;
    }
  ) => Promise<void>;
  createDateBlock: (input: {
    roomId: string;
    roomName: string;
    startDate: string;
    endDate: string;
    blockedCount: number;
    reason: string;
    createdBy: string;
  }) => Promise<void>;
  removeDateBlock: (blockId: string) => Promise<void>;
  updateBookingStatus: (
    bookingId: string,
    updates: Partial<
      Pick<
        BookingRecord,
        'bookingStatus' | 'paymentStatus' | 'paymentMethod' | 'paystackReference' | 'whatsappSent'
      >
    >
  ) => Promise<void>;
  submitCorporateInquiry: (
    input: Omit<CorporateInquiryRecord, 'id' | 'status' | 'createdAt'>
  ) => Promise<CorporateInquiryRecord>;
  updateCorporateInquiryStatus: (
    inquiryId: string,
    status: 'new' | 'quoted' | 'confirmed'
  ) => Promise<void>;
  registerRepeatGuest: (input: {
    fullName: string;
    whatsappPhone: string;
    email: string;
    currentRoomNumber: string;
    originChannel: string;
  }) => Promise<RepeatGuestRecord>;
}

const HotelStoreContext = createContext<HotelStoreContextValue | null>(null);

export function HotelStoreProvider({ children }: { children: React.ReactNode }) {
  const [rooms, setRooms] = useState<RoomCategory[]>(INITIAL_ROOMS);
  const [hotelServices, setHotelServices] = useState<HotelServiceItem[]>(INITIAL_HOTEL_SERVICES);
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>(INITIAL_BLOCKS);
  const [bookings, setBookings] = useState<BookingRecord[]>(INITIAL_BOOKINGS);
  const [promoCodes, setPromoCodes] = useState<PromoCodeRecord[]>(INITIAL_PROMO_CODES);
  const [corporateInquiries, setCorporateInquiries] = useState<CorporateInquiryRecord[]>(
    INITIAL_CORPORATE_INQUIRIES
  );
  const [repeatGuests, setRepeatGuests] = useState<RepeatGuestRecord[]>(INITIAL_REPEAT_GUESTS);
  const [utmSource] = useState<string>('direct');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const handleSetUtmSource = useCallback(() => {
    // UTM tracking disabled
  }, []);

  // Real-time Firestore sync + automatic initial seeding
  useEffect(() => {
    testConnection();

    let seededRooms = false;
    let seededServices = false;
    let seededPromos = false;
    let seededBookings = false;
    let seededBlocks = false;
    let seededCorp = false;
    let seededRepeat = false;

    const unsubRooms = onSnapshot(
      query(collection(db, 'rooms'), where('pricePerNightNgn', '>=', 1000)),
      async (snapshot) => {
        if (snapshot.empty && !seededRooms) {
          seededRooms = true;
          try {
            await Promise.all(
              INITIAL_ROOMS.map((room) => setDoc(doc(db, 'rooms', room.id), room))
            );
          } catch (err) {
            console.warn('Initial room seed skipped or pending:', err);
          }
        } else if (!snapshot.empty) {
          const loaded = snapshot.docs
            .map((d) => {
              const raw = d.data() as RoomCategory;
              return {
                ...raw,
                isVisibleInGallery: raw.isVisibleInGallery ?? true,
              };
            })
            .sort((a, b) => a.sortOrder - b.sortOrder);
          setRooms(loaded);
        }
        setIsLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'rooms');
      }
    );

    const unsubServices = onSnapshot(
      query(collection(db, 'hotel_services'), where('priceNgn', '>=', 0)),
      async (snapshot) => {
        if (snapshot.empty && !seededServices) {
          seededServices = true;
          try {
            await Promise.all(
              INITIAL_HOTEL_SERVICES.map((svc) =>
                setDoc(doc(db, 'hotel_services', svc.id), svc)
              )
            );
          } catch (err) {
            console.warn('Initial hotel_services seed skipped:', err);
          }
        } else if (!snapshot.empty) {
          const loaded = snapshot.docs
            .map((d) => d.data() as HotelServiceItem)
            .sort((a, b) => a.sortOrder - b.sortOrder);
          setHotelServices(loaded);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'hotel_services');
      }
    );

    const unsubBlocks = onSnapshot(
      query(collection(db, 'availability_blocks'), where('blockedCount', '>=', 1)),
      async (snapshot) => {
        if (snapshot.empty && !seededBlocks) {
          seededBlocks = true;
          try {
            await Promise.all(
              INITIAL_BLOCKS.map((blk) => setDoc(doc(db, 'availability_blocks', blk.id), blk))
            );
          } catch (err) {
            console.warn('Initial block seed skipped:', err);
          }
        } else {
          const loaded = snapshot.docs
            .map((d) => d.data() as AvailabilityBlock)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          setBlocks(loaded);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'availability_blocks');
      }
    );

    const unsubBookings = onSnapshot(
      query(collection(db, 'bookings'), where('nights', '>=', 1)),
      async (snapshot) => {
        if (snapshot.empty && !seededBookings) {
          seededBookings = true;
          try {
            await Promise.all(
              INITIAL_BOOKINGS.map((bk) => setDoc(doc(db, 'bookings', bk.id), bk))
            );
          } catch (err) {
            console.warn('Initial bookings seed skipped:', err);
          }
        } else if (!snapshot.empty) {
          const loaded = snapshot.docs
            .map((d) => d.data() as BookingRecord)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          setBookings(loaded);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'bookings');
      }
    );

    const unsubPromos = onSnapshot(
      query(collection(db, 'promo_codes'), where('discountPercent', '>=', 1)),
      async (snapshot) => {
        if (snapshot.empty && !seededPromos) {
          seededPromos = true;
          try {
            await Promise.all(
              INITIAL_PROMO_CODES.map((p) => setDoc(doc(db, 'promo_codes', p.id), p))
            );
          } catch (err) {
            console.warn('Initial promo codes seed skipped:', err);
          }
        } else if (!snapshot.empty) {
          setPromoCodes(snapshot.docs.map((d) => d.data() as PromoCodeRecord));
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'promo_codes');
      }
    );

    const unsubCorp = onSnapshot(
      query(collection(db, 'corporate_inquiries'), where('estimatedGuests', '>=', 1)),
      async (snapshot) => {
        if (snapshot.empty && !seededCorp) {
          seededCorp = true;
          try {
            await Promise.all(
              INITIAL_CORPORATE_INQUIRIES.map((c) =>
                setDoc(doc(db, 'corporate_inquiries', c.id), c)
              )
            );
          } catch (err) {
            console.warn('Initial corporate seed skipped:', err);
          }
        } else if (!snapshot.empty) {
          const loaded = snapshot.docs
            .map((d) => d.data() as CorporateInquiryRecord)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          setCorporateInquiries(loaded);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'corporate_inquiries');
      }
    );

    const unsubRepeat = onSnapshot(
      query(collection(db, 'repeat_guests'), where('assignedPromoCode', '>=', 'A')),
      async (snapshot) => {
        if (snapshot.empty && !seededRepeat) {
          seededRepeat = true;
          try {
            await Promise.all(
              INITIAL_REPEAT_GUESTS.map((g) => setDoc(doc(db, 'repeat_guests', g.id), g))
            );
          } catch (err) {
            console.warn('Initial repeat guests seed skipped:', err);
          }
        } else if (!snapshot.empty) {
          const loaded = snapshot.docs
            .map((d) => d.data() as RepeatGuestRecord)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          setRepeatGuests(loaded);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'repeat_guests');
      }
    );

    return () => {
      unsubRooms();
      unsubServices();
      unsubBlocks();
      unsubBookings();
      unsubPromos();
      unsubCorp();
      unsubRepeat();
    };
  }, []);

  const getEffectiveAvailability = useCallback(
    (room: RoomCategory, checkIn?: string, checkOut?: string) => {
      if (room.manualStatusOverride === 'sold_out' || room.availableCount <= 0) {
        return {
          effectiveAvailable: 0,
          blockedForDates: 0,
          status: 'sold_out' as const,
          label: 'Sold Out',
        };
      }

      let blockedForDates = 0;
      if (checkIn && checkOut) {
        blocks.forEach((blk) => {
          if (blk.roomId === room.id) {
            const overlaps = blk.startDate < checkOut && blk.endDate > checkIn;
            if (overlaps) {
              blockedForDates += blk.blockedCount;
            }
          }
        });
      }

      const effectiveAvailable = Math.max(0, room.availableCount - blockedForDates);

      if (effectiveAvailable <= 0) {
        return {
          effectiveAvailable: 0,
          blockedForDates,
          status: 'sold_out' as const,
          label: 'Sold Out for Selected Dates',
        };
      }

      if (room.manualStatusOverride === 'limited' || effectiveAvailable <= 3) {
        return {
          effectiveAvailable,
          blockedForDates,
          status: 'limited' as const,
          label: `Limited · Only ${effectiveAvailable} Left`,
        };
      }

      return {
        effectiveAvailable,
        blockedForDates,
        status: 'available' as const,
        label: `Available · ${effectiveAvailable} Rooms Open`,
      };
    },
    [blocks]
  );

  const getServiceEffectiveAvailability = useCallback(
    (service: HotelServiceItem, checkIn?: string, checkOut?: string) => {
      if (service.manualStatusOverride === 'sold_out' || service.availableSlots <= 0) {
        return {
          effectiveAvailable: 0,
          blockedForDates: 0,
          status: 'sold_out' as const,
          label: 'Fully Booked',
        };
      }

      let blockedForDates = 0;
      if (checkIn && checkOut) {
        blocks.forEach((blk) => {
          if (blk.roomId === service.id) {
            const overlaps = blk.startDate < checkOut && blk.endDate > checkIn;
            if (overlaps) {
              blockedForDates += blk.blockedCount;
            }
          }
        });
      }

      const effectiveAvailable = Math.max(0, service.availableSlots - blockedForDates);

      if (effectiveAvailable <= 0) {
        return {
          effectiveAvailable: 0,
          blockedForDates,
          status: 'sold_out' as const,
          label: 'Booked for Selected Dates',
        };
      }

      const limitedThreshold = service.category === 'event_hall' ? 1 : 3;
      if (
        service.manualStatusOverride === 'limited' ||
        effectiveAvailable <= limitedThreshold
      ) {
        return {
          effectiveAvailable,
          blockedForDates,
          status: 'limited' as const,
          label:
            service.category === 'event_hall'
              ? `Limited · ${effectiveAvailable} Slot Left`
              : `Limited · ${effectiveAvailable} Slots Left`,
        };
      }

      return {
        effectiveAvailable,
        blockedForDates,
        status: 'available' as const,
        label:
          service.category === 'event_hall'
            ? `Available · ${effectiveAvailable} Hall Slots Open`
            : `Available · ${effectiveAvailable} Daily Slots Open`,
      };
    },
    [blocks]
  );

  // Computes daily room + service availability summary for any YYYY-MM-DD calendar cell
  const getDailyCalendarSummary = useCallback(
    (dateStr: string, targetRoomId?: string): DailyCalendarSummary => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const nextDayDate = new Date(Date.UTC(y || 2026, (m || 11) - 1, (d || 26) + 1));
      const nextDayStr = nextDayDate.toISOString().slice(0, 10);

      const candidateRooms = targetRoomId
        ? rooms.filter((r) => r.id === targetRoomId)
        : rooms.filter((r) => r.isVisibleInGallery !== false);

      let totalOpenRooms = 0;
      let openRoomCategoriesCount = 0;
      let lowestRoomRateNgn = Infinity;

      candidateRooms.forEach((rm) => {
        const avail = getEffectiveAvailability(rm, dateStr, nextDayStr);
        if (avail.effectiveAvailable > 0 && avail.status !== 'sold_out') {
          totalOpenRooms += avail.effectiveAvailable;
          openRoomCategoriesCount += 1;
          if (rm.pricePerNightNgn < lowestRoomRateNgn) {
            lowestRoomRateNgn = rm.pricePerNightNgn;
          }
        }
      });

      const visibleServices = hotelServices.filter((s) => s.isVisibleInGallery);
      let openServicesCount = 0;
      visibleServices.forEach((svc) => {
        const sAvail = getServiceEffectiveAvailability(svc, dateStr, nextDayStr);
        if (sAvail.effectiveAvailable > 0 && sAvail.status !== 'sold_out') {
          openServicesCount += 1;
        }
      });

      if (lowestRoomRateNgn === Infinity) {
        lowestRoomRateNgn = candidateRooms[0]?.pricePerNightNgn || 95000;
      }

      let status: 'available' | 'limited' | 'sold_out' = 'available';
      let statusLabel = `${totalOpenRooms} rooms`;

      if (totalOpenRooms <= 0) {
        status = 'sold_out';
        statusLabel = 'Sold Out';
      } else if (
        (targetRoomId && totalOpenRooms <= 3) ||
        (!targetRoomId && (totalOpenRooms <= 12 || openRoomCategoriesCount <= 2))
      ) {
        status = 'limited';
        statusLabel = `${totalOpenRooms} left`;
      }

      return {
        dateStr,
        totalOpenRooms,
        openRoomCategoriesCount,
        openServicesCount,
        lowestRoomRateNgn,
        status,
        statusLabel,
      };
    },
    [rooms, hotelServices, getEffectiveAvailability, getServiceEffectiveAvailability]
  );

  // Atomic Firestore transaction to prevent double-bookings
  const createAtomicBooking = useCallback(
    async (input: CreateBookingInput): Promise<BookingRecord> => {
      const bookingId = `bk-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const reference = `ADL-${Math.floor(100000 + Math.random() * 900000)}`;
      const roomRef = doc(db, 'rooms', input.roomId);
      const bookingRef = doc(db, 'bookings', bookingId);

      const overlappingBlocked = blocks
        .filter(
          (blk) =>
            blk.roomId === input.roomId &&
            blk.startDate < input.checkOut &&
            blk.endDate > input.checkIn
        )
        .reduce((acc, blk) => acc + blk.blockedCount, 0);

      const newBooking: BookingRecord = {
        id: bookingId,
        reference,
        roomId: input.roomId,
        roomName: input.roomName.slice(0, 120),
        checkIn: input.checkIn.slice(0, 20),
        checkOut: input.checkOut.slice(0, 20),
        nights: Math.max(1, Math.min(90, input.nights)),
        roomsCount: Math.max(1, Math.min(20, input.roomsCount)),
        adults: Math.max(1, Math.min(40, input.adults)),
        children: Math.max(0, Math.min(40, input.children)),
        guestName: input.guestName.trim().slice(0, 140),
        guestEmail: input.guestEmail.trim().slice(0, 160),
        guestPhone: input.guestPhone.trim().slice(0, 40),
        arrivalTime: (input.arrivalTime || '2:00 pm – 4:00 pm').slice(0, 40),
        specialRequests: (input.specialRequests || 'None').slice(0, 600),
        selectedAddOns: input.selectedAddOns.slice(0, 10).map((s) => s.slice(0, 80)),
        addOnsTotalNgn: Math.round(input.addOnsTotalNgn),
        roomSubtotalNgn: Math.round(input.roomSubtotalNgn),
        promoCode: (input.promoCode || '').toUpperCase().slice(0, 40),
        discountAmountNgn: Math.round(input.discountAmountNgn),
        vatAmountNgn: Math.round(input.vatAmountNgn),
        consumptionTaxNgn: Math.round(input.consumptionTaxNgn),
        serviceChargeNgn: Math.round(input.serviceChargeNgn),
        totalAmountNgn: Math.round(input.totalAmountNgn),
        paymentMethod: input.paymentMethod,
        paymentStatus: input.paymentStatus,
        bookingStatus: 'confirmed',
        paystackReference: (input.paystackReference || reference).slice(0, 120),
        utmSource: (input.utmSource || utmSource || 'direct').slice(0, 80),
        whatsappSent: true,
        createdAt: new Date().toISOString(),
      };

      try {
        await runTransaction(db, async (transaction) => {
          const roomSnap = await transaction.get(roomRef);
          if (!roomSnap.exists()) {
            throw new Error('Selected room category was not found.');
          }
          const roomData = roomSnap.data() as RoomCategory;
          const currentEffective = roomData.availableCount - overlappingBlocked;

          if (
            roomData.manualStatusOverride === 'sold_out' ||
            currentEffective < input.roomsCount
          ) {
            throw new Error(
              `Double-booking prevented: Only ${Math.max(0, currentEffective)} room(s) remain available for ${roomData.name} on your selected dates.`
            );
          }

          const nextAvailable = Math.max(0, roomData.availableCount - input.roomsCount);
          const nextOverride =
            nextAvailable === 0
              ? 'sold_out'
              : nextAvailable <= 3 && roomData.manualStatusOverride === 'auto'
              ? 'limited'
              : roomData.manualStatusOverride;

          transaction.update(roomRef, {
            availableCount: nextAvailable,
            manualStatusOverride: nextOverride,
          });
          transaction.set(bookingRef, newBooking);
        });

        fetch('/api/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'booking_confirmation',
            booking: newBooking,
          }),
        }).catch(() => {});

        return newBooking;
      } catch (error) {
        if (error instanceof Error && error.message.includes('Double-booking prevented')) {
          throw error;
        }
        handleFirestoreError(error, OperationType.WRITE, `bookings/${bookingId}`);
      }
    },
    [blocks, utmSource]
  );

  const updateRoomInventory = useCallback(
    async (
      roomId: string,
      availableCount: number,
      manualStatusOverride: 'auto' | 'available' | 'limited' | 'sold_out',
      pricePerNightNgn?: number,
      isVisibleInGallery?: boolean
    ) => {
      const target = rooms.find((r) => r.id === roomId);
      if (!target) return;
      const clamped = Math.max(0, Math.min(target.totalInventory, availableCount));
      const payload: {
        availableCount: number;
        manualStatusOverride: 'auto' | 'available' | 'limited' | 'sold_out';
        pricePerNightNgn?: number;
        isVisibleInGallery?: boolean;
      } = {
        availableCount: clamped,
        manualStatusOverride,
      };
      if (typeof pricePerNightNgn === 'number' && pricePerNightNgn >= 1000) {
        payload.pricePerNightNgn = Math.round(pricePerNightNgn);
      }
      if (typeof isVisibleInGallery === 'boolean') {
        payload.isVisibleInGallery = isVisibleInGallery;
      }
      try {
        await updateDoc(doc(db, 'rooms', roomId), payload);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
      }
    },
    [rooms]
  );

  const updateHotelService = useCallback(
    async (
      serviceId: string,
      updates: {
        availableSlots?: number;
        manualStatusOverride?: 'auto' | 'available' | 'limited' | 'sold_out';
        priceNgn?: number;
        isVisibleInGallery?: boolean;
      }
    ) => {
      const target = hotelServices.find((s) => s.id === serviceId);
      if (!target) return;

      const payload: Record<string, number | string | boolean> = {};
      if (typeof updates.availableSlots === 'number') {
        payload.availableSlots = Math.max(
          0,
          Math.min(target.dailyCapacity, Math.round(updates.availableSlots))
        );
      }
      if (updates.manualStatusOverride) {
        payload.manualStatusOverride = updates.manualStatusOverride;
      }
      if (typeof updates.priceNgn === 'number' && updates.priceNgn >= 0) {
        payload.priceNgn = Math.round(updates.priceNgn);
      }
      if (typeof updates.isVisibleInGallery === 'boolean') {
        payload.isVisibleInGallery = updates.isVisibleInGallery;
      }

      try {
        await updateDoc(doc(db, 'hotel_services', serviceId), payload);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `hotel_services/${serviceId}`);
      }
    },
    [hotelServices]
  );

  const createDateBlock = useCallback(
    async (input: {
      roomId: string;
      roomName: string;
      startDate: string;
      endDate: string;
      blockedCount: number;
      reason: string;
      createdBy: string;
    }) => {
      const blockId = `blk-${Date.now()}`;
      const newBlock: AvailabilityBlock = {
        id: blockId,
        roomId: input.roomId,
        roomName: input.roomName.slice(0, 120),
        startDate: input.startDate.slice(0, 20),
        endDate: input.endDate.slice(0, 20),
        blockedCount: Math.max(1, Math.min(168, input.blockedCount)),
        reason: (input.reason || 'Walk-in / OTA Front-Desk Block').slice(0, 160),
        createdBy: (input.createdBy || 'Front Desk Reception').slice(0, 120),
        createdAt: new Date().toISOString(),
      };
      try {
        await setDoc(doc(db, 'availability_blocks', blockId), newBlock);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `availability_blocks/${blockId}`);
      }
    },
    []
  );

  const removeDateBlock = useCallback(async (blockId: string) => {
    try {
      await deleteDoc(doc(db, 'availability_blocks', blockId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `availability_blocks/${blockId}`);
    }
  }, []);

  const updateBookingStatus = useCallback(
    async (
      bookingId: string,
      updates: Partial<
        Pick<
          BookingRecord,
          'bookingStatus' | 'paymentStatus' | 'paymentMethod' | 'paystackReference' | 'whatsappSent'
        >
      >
    ) => {
      const existingBooking = bookings.find((b) => b.id === bookingId);
      if (!existingBooking) return;

      try {
        await updateDoc(doc(db, 'bookings', bookingId), updates);

        if (
          updates.bookingStatus === 'cancelled' &&
          existingBooking.bookingStatus !== 'cancelled'
        ) {
          const targetRoom = rooms.find((r) => r.id === existingBooking.roomId);
          if (targetRoom) {
            const restored = Math.min(
              targetRoom.totalInventory,
              targetRoom.availableCount + existingBooking.roomsCount
            );
            await updateDoc(doc(db, 'rooms', targetRoom.id), {
              availableCount: restored,
              manualStatusOverride: restored > 3 ? 'auto' : targetRoom.manualStatusOverride,
            });
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `bookings/${bookingId}`);
      }
    },
    [bookings, rooms]
  );

  const submitCorporateInquiry = useCallback(
    async (
      input: Omit<CorporateInquiryRecord, 'id' | 'status' | 'createdAt'>
    ): Promise<CorporateInquiryRecord> => {
      const inquiryId = `corp-${Date.now()}`;
      const record: CorporateInquiryRecord = {
        id: inquiryId,
        inquiryType: input.inquiryType,
        companyOrFamilyName: input.companyOrFamilyName.trim().slice(0, 160),
        contactName: input.contactName.trim().slice(0, 140),
        contactEmail: input.contactEmail.trim().slice(0, 160),
        contactPhone: input.contactPhone.trim().slice(0, 40),
        preferredHall: (input.preferredHall || 'The Grand Ballroom').slice(0, 120),
        roomsNeeded: Math.max(0, Math.min(168, input.roomsNeeded)),
        estimatedGuests: Math.max(1, Math.min(2000, input.estimatedGuests)),
        eventStartDate: input.eventStartDate.slice(0, 20),
        eventEndDate: input.eventEndDate.slice(0, 20),
        cateringNeeds: (input.cateringNeeds || 'Standard Conference / Banquet Package').slice(
          0,
          300
        ),
        notes: (input.notes || 'None').slice(0, 600),
        status: 'new',
        createdAt: new Date().toISOString(),
      };
      try {
        await setDoc(doc(db, 'corporate_inquiries', inquiryId), record);
        return record;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `corporate_inquiries/${inquiryId}`);
      }
    },
    []
  );

  const updateCorporateInquiryStatus = useCallback(
    async (inquiryId: string, status: 'new' | 'quoted' | 'confirmed') => {
      try {
        await updateDoc(doc(db, 'corporate_inquiries', inquiryId), { status });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `corporate_inquiries/${inquiryId}`);
      }
    },
    []
  );

  const registerRepeatGuest = useCallback(
    async (input: {
      fullName: string;
      whatsappPhone: string;
      email: string;
      currentRoomNumber: string;
      originChannel: string;
    }): Promise<RepeatGuestRecord> => {
      const guestId = `guest-${Date.now()}`;
      const record: RepeatGuestRecord = {
        id: guestId,
        fullName: input.fullName.trim().slice(0, 140),
        whatsappPhone: input.whatsappPhone.trim().slice(0, 40),
        email: (input.email || 'guest@adirelagoon.ng').trim().slice(0, 160),
        currentRoomNumber: (input.currentRoomNumber || 'Reception').trim().slice(0, 20),
        originChannel: (input.originChannel || 'Direct Registration').slice(0, 80),
        assignedPromoCode: 'LAGOON10',
        utmSource: 'direct',
        createdAt: new Date().toISOString(),
      };
      try {
        await setDoc(doc(db, 'repeat_guests', guestId), record);
        return record;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `repeat_guests/${guestId}`);
      }
    },
    []
  );

  return (
    <HotelStoreContext.Provider
      value={{
        rooms,
        hotelServices,
        blocks,
        bookings,
        promoCodes,
        corporateInquiries,
        repeatGuests,
        utmSource,
        setUtmSource: handleSetUtmSource,
        isLoading,
        getEffectiveAvailability,
        getServiceEffectiveAvailability,
        getDailyCalendarSummary,
        createAtomicBooking,
        updateRoomInventory,
        updateHotelService,
        createDateBlock,
        removeDateBlock,
        updateBookingStatus,
        submitCorporateInquiry,
        updateCorporateInquiryStatus,
        registerRepeatGuest,
      }}
    >
      {children}
    </HotelStoreContext.Provider>
  );
}

export function useHotelStore(): HotelStoreContextValue {
  const ctx = useContext(HotelStoreContext);
  if (!ctx) {
    throw new Error('useHotelStore must be used within a HotelStoreProvider');
  }
  return ctx;
}
