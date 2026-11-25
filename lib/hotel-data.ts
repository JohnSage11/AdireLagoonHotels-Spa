export interface RoomCategory {
  id: string;
  name: string;
  slug: string;
  sizeSqm: number;
  maxGuests: number;
  bedConfig: string;
  viewType: string;
  pricePerNightNgn: number;
  totalInventory: number;
  availableCount: number;
  manualStatusOverride: 'auto' | 'available' | 'limited' | 'sold_out';
  breakfastIncluded: boolean;
  description: string;
  imageUrl: string;
  amenities: string[];
  sortOrder: number;
  isVisibleInGallery?: boolean;
}

export interface HotelServiceItem {
  id: string;
  name: string;
  category: 'spa' | 'dining' | 'event_hall';
  subtitle: string;
  description: string;
  imageUrl: string;
  priceNgn: number;
  priceUnit: string;
  dailyCapacity: number;
  availableSlots: number;
  manualStatusOverride: 'auto' | 'available' | 'limited' | 'sold_out';
  isVisibleInGallery: boolean;
  durationOrSize: string;
  linkedAddOnId: string;
  sortOrder: number;
}

export interface AvailabilityBlock {
  id: string;
  roomId: string;
  roomName: string;
  startDate: string;
  endDate: string;
  blockedCount: number;
  reason: string;
  createdBy: string;
  createdAt: string;
}

export interface BookingRecord {
  id: string;
  reference: string;
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
  paymentStatus: 'paid' | 'pending_hold' | 'refunded';
  bookingStatus: 'confirmed' | 'checked_in' | 'cancelled';
  paystackReference: string;
  utmSource: string;
  whatsappSent: boolean;
  createdAt: string;
}

export interface PromoCodeRecord {
  id: string;
  code: string;
  discountPercent: number;
  perkDescription: string;
  isActive: boolean;
  usageCount: number;
}

export interface CorporateInquiryRecord {
  id: string;
  inquiryType: 'corporate_retainer' | 'conference_hall' | 'wedding_celebration';
  companyOrFamilyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  preferredHall: string;
  roomsNeeded: number;
  estimatedGuests: number;
  eventStartDate: string;
  eventEndDate: string;
  cateringNeeds: string;
  notes: string;
  status: 'new' | 'quoted' | 'confirmed';
  createdAt: string;
}

export interface RepeatGuestRecord {
  id: string;
  fullName: string;
  whatsappPhone: string;
  email: string;
  currentRoomNumber: string;
  originChannel: string;
  assignedPromoCode: string;
  utmSource: string;
  createdAt: string;
}

export interface BookingAddOn {
  id: string;
  name: string;
  priceNgn: number;
  pricingModel: 'per_person_per_day' | 'per_stay' | 'per_guest' | 'complimentary_request';
  description: string;
}

export const INITIAL_ROOMS: RoomCategory[] = [
  {
    id: 'classic-room',
    name: 'Classic Room',
    slug: 'classic-room',
    sizeSqm: 28,
    maxGuests: 2,
    bedConfig: '1 King or 2 Twin beds',
    viewType: 'City view',
    pricePerNightNgn: 95000,
    totalInventory: 52,
    availableCount: 14,
    manualStatusOverride: 'auto',
    breakfastIncluded: false,
    description:
      'A light-filled room with a writing desk, reading nook and a marble bathroom with walk-in shower. Ideal for short stays and solo travellers.',
    imageUrl: '/images/hotel_doc_3.jpg',
    amenities: [
      'Uninterrupted 24-hour power',
      'Complimentary fibre Wi-Fi',
      '55-inch smart TV with DStv',
      'Nespresso & Nigerian tea',
      'Marble walk-in rainfall shower',
      'Locally made Adire throw',
    ],
    sortOrder: 1,
    isVisibleInGallery: true,
  },
  {
    id: 'superior-lagoon-room',
    name: 'Superior Lagoon Room',
    slug: 'superior-lagoon-room',
    sizeSqm: 32,
    maxGuests: 2,
    bedConfig: '1 King bed',
    viewType: 'Lagoon view',
    pricePerNightNgn: 135000,
    totalInventory: 48,
    availableCount: 9,
    manualStatusOverride: 'auto',
    breakfastIncluded: false,
    description:
      'Our most popular room, with a generous window seat overlooking the water and a spacious bathroom with a freestanding tub.',
    imageUrl: '/images/hotel_doc_8.jpg',
    amenities: [
      'Lagoon-view window seat',
      'Freestanding soaking tub',
      'Uninterrupted 24-hour power',
      'Complimentary fibre Wi-Fi',
      'Nespresso machine & mini-bar',
      'Original Nigerian wall art',
    ],
    sortOrder: 2,
    isVisibleInGallery: true,
  },
  {
    id: 'deluxe-balcony-room',
    name: 'Deluxe Balcony Room',
    slug: 'deluxe-balcony-room',
    sizeSqm: 38,
    maxGuests: 3,
    bedConfig: '1 King bed + sofa bed',
    viewType: 'Private balcony · Lagoon view',
    pricePerNightNgn: 175000,
    totalInventory: 30,
    availableCount: 3,
    manualStatusOverride: 'limited',
    breakfastIncluded: false,
    description:
      'Step onto your own balcony with a pair of lounge chairs and watch the lagoon wake up at sunrise. Includes a separate seating area.',
    imageUrl: '/images/hotel_doc_1.jpg',
    amenities: [
      'Private sunrise balcony with loungers',
      'Separate lounge seating area',
      'Uninterrupted 24-hour power',
      'Complimentary fibre Wi-Fi',
      'Bathrobes, slippers & safe',
      '24-hour in-room dining',
    ],
    sortOrder: 3,
    isVisibleInGallery: true,
  },
  {
    id: 'family-suite',
    name: 'Family Suite',
    slug: 'family-suite',
    sizeSqm: 55,
    maxGuests: 4,
    bedConfig: '1 King bed + 2 single beds',
    viewType: 'Interconnecting rooms available',
    pricePerNightNgn: 240000,
    totalInventory: 20,
    availableCount: 6,
    manualStatusOverride: 'auto',
    breakfastIncluded: false,
    description:
      "Two sleeping areas, a living space and a kids' welcome pack with games and snacks. Cots and high chairs are free on request.",
    imageUrl: '/images/hotel_doc_4.jpg',
    amenities: [
      'Two separate sleeping areas',
      "Kids' welcome pack with games & snacks",
      'Free cots & high chairs on request',
      '55-inch smart TV with DStv & streaming',
      'Uninterrupted 24-hour power & Wi-Fi',
      '24-hour family room service',
    ],
    sortOrder: 4,
    isVisibleInGallery: true,
  },
  {
    id: 'executive-suite',
    name: 'Executive Suite',
    slug: 'executive-suite',
    sizeSqm: 68,
    maxGuests: 3,
    bedConfig: '1 King bed',
    viewType: 'Corner lagoon view',
    pricePerNightNgn: 320000,
    totalInventory: 15,
    availableCount: 4,
    manualStatusOverride: 'auto',
    breakfastIncluded: true,
    description:
      'A separate living room, dining table for four and a luxury bathroom with double vanity, rain shower and tub. Includes access to the Executive Lounge, with breakfast and evening small chops.',
    imageUrl: '/images/hotel_doc_9.jpg',
    amenities: [
      'Executive Lounge access (Breakfast & Small Chops)',
      'Corner lagoon panorama & dining for 4',
      'Double vanity, rain shower & soaking tub',
      'Uninterrupted 24-hour power & fibre Wi-Fi',
      'Dedicated check-in & pressing service',
      'Hand-dyed Abeokuta Adire robes',
    ],
    sortOrder: 5,
    isVisibleInGallery: true,
  },
  {
    id: 'presidential-suite',
    name: 'The Presidential Suite',
    slug: 'presidential-suite',
    sizeSqm: 140,
    maxGuests: 4,
    bedConfig: '2 bedrooms (King suites)',
    viewType: '270° lagoon views · Private 12th floor terrace',
    pricePerNightNgn: 1200000,
    totalInventory: 3,
    availableCount: 1,
    manualStatusOverride: 'limited',
    breakfastIncluded: true,
    description:
      'Our signature suite occupies the entire twelfth floor. Enjoy a private terrace with a plunge pool, a fully stocked bar, a dining room for eight, a dedicated butler and a private chef on request. A private lift entrance and discreet security come as standard.',
    imageUrl: '/images/rooftop_pool_sunset_deck_1795566276755.jpg',
    amenities: [
      'Private 12th-floor terrace & plunge pool',
      '24-hour dedicated butler & private lift entrance',
      'Complimentary daily breakfast & stocked bar',
      'Dining room for 8 & private chef on request',
      'Discreet security & airport transfer readiness',
      '270° Victoria Island & Lagos Lagoon views',
    ],
    sortOrder: 6,
    isVisibleInGallery: true,
  },
];

export const INITIAL_HOTEL_SERVICES: HotelServiceItem[] = [
  {
    id: 'spa-shea-butter-massage',
    name: 'The Calabash Spa — Shea Butter Massage',
    category: 'spa',
    subtitle: '60 / 90 Min Signature Wellness Ritual · Ground-Floor Sanctuary',
    description:
      'Warm, hand-whipped Nigerian shea butter and local essential oils melt away tension in our candlelit treatment suites.',
    imageUrl: '/images/hotel_doc_10.jpg',
    priceNgn: 45000,
    priceUnit: 'per guest',
    dailyCapacity: 16,
    availableSlots: 10,
    manualStatusOverride: 'auto',
    isVisibleInGallery: true,
    durationOrSize: '60 / 90 mins · 8 Treatment Rooms',
    linkedAddOnId: 'spa_treatment',
    sortOrder: 1,
  },
  {
    id: 'spa-hibiscus-facial',
    name: 'The Calabash Spa — Hibiscus Glow Facial',
    category: 'spa',
    subtitle: '75 Min Botanical Hydration · Zobo, Black Soap & Cocoa',
    description:
      'A deeply hydrating facial ritual using pure zobo (hibiscus) extract, traditional African black soap, and organic cocoa butter.',
    imageUrl: '/images/hotel_doc_6.jpg',
    priceNgn: 55000,
    priceUnit: 'per guest',
    dailyCapacity: 12,
    availableSlots: 7,
    manualStatusOverride: 'auto',
    isVisibleInGallery: true,
    durationOrSize: '75 mins · Thermal Suite Included',
    linkedAddOnId: 'spa_treatment',
    sortOrder: 2,
  },
  {
    id: 'spa-couples-retreat',
    name: "The Calabash Spa — Couples' Lagoon Retreat",
    category: 'spa',
    subtitle: '120 Min Private Suite · Side-by-Side Massage & Hydrotherapy Soak',
    description:
      'Side-by-side shea massages in our private couples suite, followed by a private hydrotherapy soak and chilled sparkling wine.',
    imageUrl: '/images/hotel_doc_11.jpg',
    priceNgn: 140000,
    priceUnit: 'per couple',
    dailyCapacity: 6,
    availableSlots: 2,
    manualStatusOverride: 'limited',
    isVisibleInGallery: true,
    durationOrSize: '120 mins · Private Couples Suite',
    linkedAddOnId: 'spa_treatment',
    sortOrder: 3,
  },
  {
    id: 'dining-eko-kitchen-table',
    name: 'Eko Kitchen — Lagoon-Front Chef Table & Buffet',
    category: 'dining',
    subtitle: 'All-Day Fine Nigerian & Continental Dining · Lagoon Terrace',
    description:
      'Reserve a prime water-facing table for smoky party jollof, ofada rice with ayamase, peppered snail, fresh lagoon catch, or our full Nigerian breakfast buffet.',
    imageUrl: '/images/eko_kitchen_jollof_suya_1795566275900.jpg',
    priceNgn: 12000,
    priceUnit: 'per guest',
    dailyCapacity: 40,
    availableSlots: 18,
    manualStatusOverride: 'auto',
    isVisibleInGallery: true,
    durationOrSize: '6:30 am – 10:30 pm · Lagoon View',
    linkedAddOnId: 'breakfast',
    sortOrder: 4,
  },
  {
    id: 'dining-sunset-suya-cabana',
    name: 'Sunset Deck & Rooftop Pool — Suya Night Cabana',
    category: 'dining',
    subtitle: '12th-Floor Rooftop Infinity Pool · Traditional Suya & Zobo Spritzers',
    description:
      'Evening poolside cabana overlooking Victoria Island with traditional spiced beef and ram suya, grilled fish, and signature Adire Chapman cocktails.',
    imageUrl: '/images/rooftop_pool_sunset_deck_1795566276755.jpg',
    priceNgn: 18500,
    priceUnit: 'per guest',
    dailyCapacity: 15,
    availableSlots: 4,
    manualStatusOverride: 'limited',
    isVisibleInGallery: true,
    durationOrSize: '11:00 am – 11:00 pm · Rooftop Deck',
    linkedAddOnId: 'small_chops',
    sortOrder: 5,
  },
  {
    id: 'dining-lagoon-lounge-highlife',
    name: 'The Lagoon Lounge — Live Highlife & Chapman Evening',
    category: 'dining',
    subtitle: 'Leather Armchair Cocktail Lounge · Live Friday & Saturday Bands',
    description:
      'Reserve a lounge booth for handcrafted cocktails, small chops platters, and live Lagos highlife and Afrobeats performances.',
    imageUrl: '/images/hotel_doc_2.jpg',
    priceNgn: 18500,
    priceUnit: 'per guest',
    dailyCapacity: 24,
    availableSlots: 11,
    manualStatusOverride: 'auto',
    isVisibleInGallery: true,
    durationOrSize: '4:00 pm – 1:00 am · Live Music',
    linkedAddOnId: 'small_chops',
    sortOrder: 6,
  },
  {
    id: 'hall-grand-ballroom',
    name: 'The Grand Ballroom — Gala, AGM & Wedding Venue',
    category: 'event_hall',
    subtitle: '650 sq m Pillarless Hall · Up to 600 Guests · Dedicated Fibre & AV',
    description:
      'Our flagship event space for Lagos product launches, corporate AGMs, gala dinners, and traditional & white Nigerian weddings with full Eko Kitchen banquet catering.',
    imageUrl: '/images/grand_ballroom_lagos_event_1795566276900.jpg',
    priceNgn: 2500000,
    priceUnit: 'per day',
    dailyCapacity: 2,
    availableSlots: 1,
    manualStatusOverride: 'limited',
    isVisibleInGallery: true,
    durationOrSize: '650 sq m · Up to 600 Guests',
    linkedAddOnId: 'small_chops',
    sortOrder: 7,
  },
  {
    id: 'hall-iroko-conference',
    name: 'The Iroko Hall — Lagoon-Facing Conference Suite',
    category: 'event_hall',
    subtitle: '220 sq m Natural-Light Hall · Up to 200 Guests',
    description:
      'Floor-to-ceiling lagoon windows, carved 1963 Iroko timber panelling, dual 4K laser projectors, and executive tea/small chops breakout terrace.',
    imageUrl: '/images/hotel_doc_5.jpg',
    priceNgn: 950000,
    priceUnit: 'per day',
    dailyCapacity: 3,
    availableSlots: 2,
    manualStatusOverride: 'auto',
    isVisibleInGallery: true,
    durationOrSize: '220 sq m · Up to 200 Guests',
    linkedAddOnId: 'small_chops',
    sortOrder: 8,
  },
  {
    id: 'hall-executive-boardroom',
    name: 'The Boardroom & Executive Study',
    category: 'event_hall',
    subtitle: '45 sq m Private Strategy Suite · Up to 18 Executives',
    description:
      'Discreet boardroom with encrypted fibre conferencing, leather executive seating, dedicated butler service, and uninterrupted power.',
    imageUrl: '/images/hotel_doc_7.jpg',
    priceNgn: 350000,
    priceUnit: 'per day',
    dailyCapacity: 4,
    availableSlots: 3,
    manualStatusOverride: 'auto',
    isVisibleInGallery: true,
    durationOrSize: '45 sq m · Up to 18 Guests',
    linkedAddOnId: 'breakfast',
    sortOrder: 9,
  },
];

export const INITIAL_PROMO_CODES: PromoCodeRecord[] = [
  {
    id: 'promo-lagoon10',
    code: 'LAGOON10',
    discountPercent: 10,
    perkDescription: '10% Direct Stay Savings + Free Late Check-Out (2:00 pm) & Welcome Adire Chapman',
    isActive: true,
    usageCount: 42,
  },
  {
    id: 'promo-welcomehome',
    code: 'WELCOMEHOME',
    discountPercent: 10,
    perkDescription: '10% Diaspora Welcome Home Discount + Complimentary Small Chops Platter on Arrival',
    isActive: true,
    usageCount: 29,
  },
];

export const BOOKING_ADD_ONS: BookingAddOn[] = [
  {
    id: 'breakfast',
    name: 'Eko Kitchen Full Breakfast Buffet',
    priceNgn: 12000,
    pricingModel: 'per_person_per_day',
    description: 'Akara, moi moi, yam & egg sauce, fried plantain & continental favourites (Included free in Executive & Presidential Suites).',
  },
  {
    id: 'airport_pickup',
    name: 'Murtala Muhammed Airport Private Pickup',
    priceNgn: 45000,
    pricingModel: 'per_stay',
    description: 'Chauffeur-driven air-conditioned SUV from LOS International Airport (45–90 mins).',
  },
  {
    id: 'spa_treatment',
    name: 'The Calabash Spa Shea Butter Massage (60 min)',
    priceNgn: 45000,
    pricingModel: 'per_guest',
    description: 'Warm hand-whipped shea butter and local essential oils in our 1,000 sq m sanctuary.',
  },
  {
    id: 'small_chops',
    name: 'Small Chops Platter & Chilled Zobo on Arrival',
    priceNgn: 18500,
    pricingModel: 'per_guest',
    description: 'Puff puff, samosas, spring rolls, chin chin & mini meat pies served in your room or Garden Lounge.',
  },
  {
    id: 'late_checkout',
    name: 'Guaranteed Late Check-Out (until 3:00 pm)',
    priceNgn: 25000,
    pricingModel: 'per_stay',
    description: 'Unwind by the rooftop pool before an evening flight (Complimentary with LAGOON10 code).',
  },
  {
    id: 'flowers_in_room',
    name: 'Fresh Tropical Flowers & Celebration Note in Room',
    priceNgn: 30000,
    pricingModel: 'per_stay',
    description: 'Hand-arranged tropical bouquet waiting on arrival for anniversaries or birthdays.',
  },
];

export const INITIAL_BOOKINGS: BookingRecord[] = [
  {
    id: 'bk-seed-101',
    reference: 'ADL-849201',
    roomId: 'executive-suite',
    roomName: 'Executive Suite',
    checkIn: '2026-11-25',
    checkOut: '2026-11-28',
    nights: 3,
    roomsCount: 1,
    adults: 2,
    children: 0,
    guestName: 'Chidinma & Tunde Adebayo',
    guestEmail: 'chidinma.adebayo@lagosventures.ng',
    guestPhone: '+234 803 412 9981',
    arrivalTime: '2:00 pm – 4:00 pm',
    specialRequests: 'Anniversary stay — extra Adire throws and quiet corner lagoon view please.',
    selectedAddOns: ['airport_pickup', 'small_chops'],
    addOnsTotalNgn: 82000,
    roomSubtotalNgn: 960000,
    promoCode: 'LAGOON10',
    discountAmountNgn: 96000,
    vatAmountNgn: 70950,
    consumptionTaxNgn: 47300,
    serviceChargeNgn: 94600,
    totalAmountNgn: 1158850,
    paymentMethod: 'paystack_card',
    paymentStatus: 'paid',
    bookingStatus: 'confirmed',
    paystackReference: 'PSTK_LIVE_99284710',
    utmSource: 'direct',
    whatsappSent: true,
    createdAt: '2026-11-24T09:15:00.000Z',
  },
  {
    id: 'bk-seed-102',
    reference: 'ADL-849202',
    roomId: 'superior-lagoon-room',
    roomName: 'Superior Lagoon Room',
    checkIn: '2026-11-26',
    checkOut: '2026-11-29',
    nights: 3,
    roomsCount: 2,
    adults: 2,
    children: 0,
    guestName: 'Engr. Emeka Okafor',
    guestEmail: 'e.okafor@chevron-energy.example',
    guestPhone: '+234 809 551 2044',
    arrivalTime: '4:00 pm – 6:00 pm',
    specialRequests: 'Corporate invoice required at check-in. Prayer mat requested.',
    selectedAddOns: ['breakfast'],
    addOnsTotalNgn: 72000,
    roomSubtotalNgn: 810000,
    promoCode: 'WELCOMEHOME',
    discountAmountNgn: 121500,
    vatAmountNgn: 57038,
    consumptionTaxNgn: 38025,
    serviceChargeNgn: 76050,
    totalAmountNgn: 931613,
    paymentMethod: 'pay_at_hotel',
    paymentStatus: 'pending_hold',
    bookingStatus: 'confirmed',
    paystackReference: 'HOLD_CORP_849202',
    utmSource: 'direct',
    whatsappSent: true,
    createdAt: '2026-11-24T11:40:00.000Z',
  },
  {
    id: 'bk-seed-103',
    reference: 'ADL-849203',
    roomId: 'deluxe-balcony-room',
    roomName: 'Deluxe Balcony Room',
    checkIn: '2026-11-24',
    checkOut: '2026-11-26',
    nights: 2,
    roomsCount: 1,
    adults: 2,
    children: 1,
    guestName: 'Aisha Mohammed',
    guestEmail: 'aisha.m@zenithcapital.ng',
    guestPhone: '+234 812 770 3319',
    arrivalTime: '2:00 pm – 4:00 pm',
    specialRequests: 'Halal dining preferences and high floor balcony.',
    selectedAddOns: ['spa_treatment'],
    addOnsTotalNgn: 90000,
    roomSubtotalNgn: 350000,
    promoCode: 'LAGOON10',
    discountAmountNgn: 35000,
    vatAmountNgn: 30375,
    consumptionTaxNgn: 20250,
    serviceChargeNgn: 40500,
    totalAmountNgn: 496125,
    paymentMethod: 'paystack_transfer',
    paymentStatus: 'paid',
    bookingStatus: 'checked_in',
    paystackReference: 'PSTK_TRF_77381920',
    utmSource: 'direct',
    whatsappSent: true,
    createdAt: '2026-11-24T13:05:00.000Z',
  },
];

export const INITIAL_BLOCKS: AvailabilityBlock[] = [
  {
    id: 'blk-seed-1',
    roomId: 'deluxe-balcony-room',
    roomName: 'Deluxe Balcony Room',
    startDate: '2026-11-24',
    endDate: '2026-11-27',
    blockedCount: 4,
    reason: 'Walk-in Guest & OTA Sync Block (Booking.com Offline Adjustment)',
    createdBy: 'Front Desk — Funke A.',
    createdAt: '2026-11-24T08:30:00.000Z',
  },
];

export const INITIAL_CORPORATE_INQUIRIES: CorporateInquiryRecord[] = [
  {
    id: 'corp-seed-1',
    inquiryType: 'conference_hall',
    companyOrFamilyName: 'West Africa Fintech Summit / Paystack Partners',
    contactName: 'Oluwaseun Balogun (Head of People & Ops)',
    contactEmail: 'seun.balogun@wafintech.ng',
    contactPhone: '+234 802 994 1120',
    preferredHall: 'The Grand Ballroom (650 sq m · up to 600 guests)',
    roomsNeeded: 25,
    estimatedGuests: 350,
    eventStartDate: '2026-12-08',
    eventEndDate: '2026-12-10',
    cateringNeeds: 'Morning tea & small chops, Eko Kitchen smoky party jollof buffet lunch, dedicated fibre line & projectors.',
    notes: 'Requesting corporate retainer rate for 25 Superior Lagoon Rooms plus 2-day Grand Ballroom rental.',
    status: 'new',
    createdAt: '2026-11-24T10:20:00.000Z',
  },
  {
    id: 'corp-seed-2',
    inquiryType: 'wedding_celebration',
    companyOrFamilyName: 'The Balogun & Adeyemi Families',
    contactName: 'Chief Mrs. Folake Adeyemi',
    contactEmail: 'folake.adeyemi@familyoffice.ng',
    contactPhone: '+234 803 300 8841',
    preferredHall: 'The Grand Ballroom + Lagoon Terrace Photos',
    roomsNeeded: 18,
    estimatedGuests: 450,
    eventStartDate: '2026-12-19',
    eventEndDate: '2026-12-20',
    cateringNeeds: 'Tasting menu for two, full Nigerian wedding banquet (party jollof, ofada rice & ayamase, suya station), bridal suite night before.',
    notes: 'Bringing live highlife band, MC and 450 guests in indigo & gold aso-ebi. Need marshals on duty.',
    status: 'quoted',
    createdAt: '2026-11-23T16:45:00.000Z',
  },
];

export const INITIAL_REPEAT_GUESTS: RepeatGuestRecord[] = [
  {
    id: 'guest-seed-1',
    fullName: 'Babajide Sanwo-Williams',
    whatsappPhone: '+234 805 229 4100',
    email: 'b.williams@oilgas-consult.ng',
    currentRoomNumber: '302',
    originChannel: 'Direct Website Guest',
    assignedPromoCode: 'LAGOON10',
    utmSource: 'direct',
    createdAt: '2026-11-24T07:50:00.000Z',
  },
  {
    id: 'guest-seed-2',
    fullName: 'Dr. Ngozi Eze',
    whatsappPhone: '+234 803 884 1290',
    email: 'ngozi.eze@medcare.ng',
    currentRoomNumber: '714',
    originChannel: 'Reception Desk Registration',
    assignedPromoCode: 'LAGOON10',
    utmSource: 'direct',
    createdAt: '2026-11-24T12:10:00.000Z',
  },
];

export const SPECIAL_OFFERS = [
  {
    id: 'offer-lagoon-direct',
    title: 'Book Direct & Save 10%',
    subtitle: 'Valid all year · Promo Code: LAGOON10',
    priceLabel: '10% Off Best Rate',
    description:
      'Reserve directly on our website and enjoy 10% off the best available rate, free cancellation up to 48 hours before arrival, complimentary fibre Wi-Fi and a welcome Adire Chapman at The Lagoon Lounge.',
    promoCode: 'LAGOON10',
    roomSlug: 'superior-lagoon-room',
    tag: 'Most Popular Direct Offer',
  },
  {
    id: 'offer-detty-december',
    title: 'Detty December Escape',
    subtitle: '15 December – 5 January · 3 Nights in Superior Lagoon Room',
    priceLabel: 'From ₦520,000 / 3 nights',
    description:
      'Three nights in a Superior Lagoon Room with daily Eko Kitchen breakfast, a Thursday or Saturday suya night for two on the Sunset Deck, private airport pickup and late check-out.',
    promoCode: 'LAGOON10',
    roomSlug: 'superior-lagoon-room',
    tag: 'Seasonal Lagos Package',
  },
  {
    id: 'offer-weekend-staycation',
    title: 'Weekend Staycation',
    subtitle: 'Friday to Sunday · 2 Nights in Deluxe Balcony Room',
    priceLabel: 'From ₦420,000 / 2 nights',
    description:
      'Unwind from Friday to Sunday in a Deluxe Balcony Room with daily breakfast buffet, a 60-minute Calabash Spa shea butter massage per guest and late check-out on Sunday.',
    promoCode: 'LAGOON10',
    roomSlug: 'deluxe-balcony-room',
    tag: 'Couples & Wellness',
  },
  {
    id: 'offer-spa-and-stay',
    title: 'Spa & Stay Retreat',
    subtitle: '1 Night + 60-Min Treatment & Thermal Suite',
    priceLabel: 'From ₦185,000 / person',
    description:
      'One calm night overlooking the lagoon, one 60-minute signature treatment per guest, full access to The Calabash Spa hydrotherapy pool and a full Nigerian & international breakfast.',
    promoCode: 'LAGOON10',
    roomSlug: 'classic-room',
    tag: 'The Calabash Spa',
  },
  {
    id: 'offer-welcome-home',
    title: 'Welcome Home Diaspora Package',
    subtitle: '4+ Nights · Promo Code: WELCOMEHOME',
    priceLabel: '10% Off + Free Airport Pickup',
    description:
      'For guests returning home from abroad. Enjoy a complimentary Murtala Muhammed Airport pickup, a hot small chops platter on arrival and 10% off stays of four nights or more.',
    promoCode: 'WELCOMEHOME',
    roomSlug: 'executive-suite',
    tag: 'Diaspora Special',
  },
];

export const DINING_VENUES = [
  {
    name: 'Eko Kitchen',
    kicker: 'All-Day Lagoon-Front Restaurant',
    hours: 'Breakfast: 6:30 am – 10:30 am (11:00 am weekends) · Lunch: 12:00 pm – 3:00 pm · Dinner: 6:30 pm – 10:30 pm',
    dressCode: 'Smart casual',
    description:
      'Our all-day restaurant serves breakfast, lunch and dinner in a bright room overlooking the lagoon. Try the smoky party jollof with grilled chicken, pounded yam with egusi, ofada rice with ayamase, peppered snail, catfish pepper soup and the fresh catch of the day. The breakfast buffet adds akara, moi moi, yam and egg sauce and fried plantain.',
    highlight: 'Winner: Best Nigerian Cuisine, Lagos Food & Drink Awards 2025',
    image: '/images/eko_kitchen_jollof_suya_1795566275900.jpg',
  },
  {
    name: 'The Lagoon Lounge',
    kicker: 'Cocktail Bar & Live Highlife / Afrobeats',
    hours: '4:00 pm – 1:00 am daily · Live bands Friday & Saturday evenings',
    dressCode: 'Smart casual',
    description:
      "A stylish bar with leather armchairs, a serious cocktail list and the city's best Chapman. Live highlife and Afrobeats bands play on Friday and Saturday evenings.",
    highlight: 'Signature drink: The Adire Chapman with fresh citrus, grenadine & bitters',
    image: '/images/hotel_doc_1.jpg',
  },
  {
    name: 'Sunset Deck & Suya Grill',
    kicker: 'Rooftop Pool Bar & Traditional Suya Nights',
    hours: 'Open daily 11:00 am – 11:00 pm · Suya Nights every Thursday & Saturday from 7:00 pm',
    dressCode: 'Resort casual',
    description:
      'Our rooftop bar by the pool serves fresh juices, zobo spritzers, grilled fish and suya, sliced and spiced the traditional way overlooking Victoria Island.',
    highlight: 'Adults-only rooftop pool atmosphere after 6:00 pm',
    image: '/images/rooftop_pool_sunset_deck_1795566276755.jpg',
  },
  {
    name: 'Small Chops & Tea · 24-Hr In-Room Dining',
    kicker: 'Garden Lounge & 30-Minute Room Delivery',
    hours: 'Garden Lounge Afternoon Tea daily · In-Room Dining 24 hours',
    dressCode: 'Relaxed',
    description:
      'Enjoy puff puff, samosas, spring rolls, chin chin and mini meat pies with tea, coffee or chilled zobo for ₦18,500 per person. Or order from the full menu by phone, WhatsApp or QR code for delivery within 30 minutes.',
    highlight: 'Vegetarian, vegan, halal, gluten-free & allergy needs happily catered for',
    image: '/images/hotel_doc_2.jpg',
  },
];

export const SPA_TREATMENTS = [
  {
    name: 'Shea Butter Massage',
    duration: '60 / 90 min',
    priceNgn: 45000,
    description: 'Warm, hand-whipped shea butter and local essential oils melt away tension.',
  },
  {
    name: 'Hibiscus Glow Facial',
    duration: '75 min',
    priceNgn: 55000,
    description: 'A deeply hydrating facial using zobo (hibiscus) extract, African black soap and cocoa.',
  },
  {
    name: 'Black Soap Scrub & Wrap',
    duration: '90 min',
    priceNgn: 60000,
    description: 'Exfoliate with traditional black soap, then wrap in moringa and shea.',
  },
  {
    name: "Couples' Retreat",
    duration: '120 min',
    priceNgn: 140000,
    description: 'Side-by-side massages, a private soak and a glass of sparkling wine.',
  },
  {
    name: 'Deep Tissue Massage',
    duration: '60 min',
    priceNgn: 48000,
    description: 'A firm, focused treatment for tired shoulders and desk-bound necks.',
  },
];

export const MEETING_HALLS = [
  {
    name: 'The Grand Ballroom',
    size: '650 sq m',
    capacity: 'Up to 600 guests (theatre style)',
    idealFor: 'Product launches, AGMs, gala dinners & grand Nigerian weddings',
  },
  {
    name: 'The Iroko Hall',
    size: '220 sq m',
    capacity: 'Up to 200 guests',
    idealFor: 'Conferences, seminars & receptions with lagoon-facing windows',
  },
  {
    name: 'The Boardroom',
    size: '45 sq m',
    capacity: 'Up to 18 guests',
    idealFor: 'Executive board meetings, retreats & video-conferenced negotiations',
  },
  {
    name: 'The Executive Study',
    size: '28 sq m',
    capacity: 'Up to 10 guests',
    idealFor: 'Private briefings, executive interviews & intimate strategy sessions',
  },
];

export const LOCAL_EXPERIENCES = [
  {
    name: 'Lekki Conservation Centre',
    description: 'Walk the canopy bridge above the forest, billed as one of the longest in Africa.',
  },
  {
    name: 'Nike Art Gallery',
    description: 'Five floors of Nigerian art, a favourite stop for visitors.',
  },
  {
    name: 'Lekki Arts & Crafts Market',
    description: 'Bargain for beads, carvings and authentic hand-dyed adire fabric.',
  },
  {
    name: 'Freedom Park',
    description: 'A former colonial prison turned cultural park, with live music and food stalls.',
  },
  {
    name: 'Boat Trip to Tarkwa Bay',
    description: 'A day on the water from Victoria Island, with beach time and fresh seafood.',
  },
  {
    name: 'Cooking Class with Our Chef',
    description: 'Learn to make smoky party jollof rice and egusi soup in our demonstration kitchen.',
  },
];

export const GALLERY_ITEMS = [
  {
    caption: '1. Sunrise from a Superior Lagoon Room',
    category: 'Accommodation',
    imageUrl: '/images/hero_adire_lagoon_sunrise_1795566274564.jpg',
  },
  {
    caption: '2. The lobby & corridor, with original 1963 architectural woodwork',
    category: 'Heritage',
    imageUrl: '/images/hotel_doc_5.jpg',
  },
  {
    caption: '3. A plate of party jollof, suya and grilled chicken at Eko Kitchen',
    category: 'Dining',
    imageUrl: '/images/eko_kitchen_jollof_suya_1795566275900.jpg',
  },
  {
    caption: '4. The rooftop pool at golden hour',
    category: 'Amenities',
    imageUrl: '/images/rooftop_pool_sunset_deck_1795566276755.jpg',
  },
  {
    caption: '5. Lagoon-view soaking tub in our luxury suites',
    category: 'Accommodation',
    imageUrl: '/images/hotel_doc_9.jpg',
  },
  {
    caption: "6. The Calabash Spa's candlelit treatment sanctuary",
    category: 'Spa & Wellness',
    imageUrl: '/images/hotel_doc_10.jpg',
  },
  {
    caption: '7. The Grand Ballroom, set for a Lagos wedding & executive gala',
    category: 'Meetings & Events',
    imageUrl: '/images/grand_ballroom_lagos_event_1795566276900.jpg',
  },
  {
    caption: '8. Room 302 heritage detailing & modern marble vanity',
    category: 'Accommodation',
    imageUrl: '/images/hotel_doc_6.jpg',
  },
];

export const FAQS = [
  {
    question: 'Is breakfast included in the room rate?',
    answer:
      'Breakfast is included in the Executive Suite and Presidential Suite rates. For other rooms, you can add our Eko Kitchen full breakfast buffet for ₦12,000 per person per day.',
  },
  {
    question: 'Do you have 24-hour electricity?',
    answer:
      'Yes. We run on our own generators, solar and inverter backup, so the lights, air conditioning and fibre Wi-Fi stay on around the clock without interruption.',
  },
  {
    question: 'Do you offer airport pickup?',
    answer:
      "Yes. Our private car service from Murtala Muhammed International Airport can be booked from ₦45,000 each way. Please give us 24 hours' notice and send your flight number on WhatsApp.",
  },
  {
    question: 'Can I pay in Naira?',
    answer:
      "Absolutely. All rates are quoted in Naira (₦), and you can pay online via Paystack (Verve, Mastercard, Visa, Bank Transfer or USSD) or at the hotel. Foreign currency is also accepted at the day's rate.",
  },
  {
    question: 'Is the hotel safe?',
    answer:
      'Yes. We have 24-hour security, CCTV, controlled access to guest floors and a free secure on-site car park with valet service and marshals on duty 24 hours.',
  },
  {
    question: 'Do you have family rooms and accessible facilities?',
    answer:
      'Yes. Our Family Suite sleeps four with interconnecting rooms available, and we offer 8 fully accessible rooms with roll-in showers, step-free public access, backup-powered lifts to all 12 floors, hearing loops and braille signage.',
  },
  {
    question: 'Can I buy a gift card?',
    answer:
      'Gift cards for stays, Eko Kitchen dining and The Calabash Spa treatments are available online and at reception.',
  },
];

export const ADIRE_HOTEL_COORDINATES = {
  name: 'The Adire Lagoon Hotel & Spa',
  address: 'Plot 14, Adetokunbo Ademola Street, Victoria Island, Lagos',
  lat: 6.4281,
  lng: 3.4219,
};

export function formatNaira(amount: number): string {
  const rounded = Math.round(amount);
  const formatted = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${rounded < 0 ? '-' : ''}₦${formatted}`;
}

export function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(`${checkIn}T00:00:00Z`);
  const end = new Date(`${checkOut}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 1;
}
