'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  Building2,
  Users,
  Calendar,
  Check,
  Phone,
  Mail,
  MessageCircle,
  ArrowLeft,
  Sparkles,
  Wifi,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useHotelStore } from '@/lib/hotel-store';
import { MEETING_HALLS, CorporateInquiryRecord } from '@/lib/hotel-data';

export default function CorporatePage() {
  const { submitCorporateInquiry } = useHotelStore();

  const [inquiryType, setInquiryType] = useState<
    'corporate_retainer' | 'conference_hall' | 'wedding_celebration'
  >('corporate_retainer');
  const [companyOrFamilyName, setCompanyOrFamilyName] = useState<string>('');
  const [contactName, setContactName] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('+234 ');
  const [preferredHall, setPreferredHall] = useState<string>(
    'The Grand Ballroom (650 sq m · up to 600 guests)'
  );
  const [roomsNeeded, setRoomsNeeded] = useState<number>(15);
  const [estimatedGuests, setEstimatedGuests] = useState<number>(120);
  const [eventStartDate, setEventStartDate] = useState<string>('2026-12-10');
  const [eventEndDate, setEventEndDate] = useState<string>('2026-12-12');
  const [cateringNeeds, setCateringNeeds] = useState<string>(
    'Morning Tea & Small Chops + Eko Kitchen Buffet Lunch'
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const hallParam = params.get('hall');
      const startParam = params.get('start');
      const endParam = params.get('end');

      if (hallParam) {
        setInquiryType('conference_hall');
        if (hallParam.toLowerCase().includes('iroko')) {
          setPreferredHall('The Iroko Hall (220 sq m · up to 200 guests)');
        } else if (
          hallParam.toLowerCase().includes('boardroom') ||
          hallParam.toLowerCase().includes('study')
        ) {
          setPreferredHall('The Boardroom (45 sq m · up to 18 guests)');
        } else if (hallParam.toLowerCase().includes('ballroom')) {
          setPreferredHall('The Grand Ballroom (650 sq m · up to 600 guests)');
        }
      }
      if (startParam) setEventStartDate(startParam);
      if (endParam) setEventEndDate(endParam);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedRecord, setSubmittedRecord] = useState<CorporateInquiryRecord | null>(
    null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyOrFamilyName.trim() || !contactName.trim() || !contactEmail.trim()) return;
    setIsSubmitting(true);
    try {
      const record = await submitCorporateInquiry({
        inquiryType,
        companyOrFamilyName,
        contactName,
        contactEmail,
        contactPhone,
        preferredHall,
        roomsNeeded,
        estimatedGuests,
        eventStartDate,
        eventEndDate,
        cateringNeeds,
        notes,
      });
      setSubmittedRecord(record);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900 flex flex-col">
      <Navbar />

      {/* Hero Header */}
      <section className="relative bg-[#0B2545] text-white py-16 lg:py-20 overflow-hidden">
        <Image
          src="/images/grand_ballroom_lagos_event_1795566276900.jpg"
          alt="The Grand Ballroom at The Adire Lagoon Hotel & Spa"
          fill
          referrerPolicy="no-referrer"
          className="object-cover opacity-35"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-6 space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D4A359] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Direct Booking Engine
          </Link>
          <p className="text-xs font-semibold tracking-wider uppercase text-[#D4A359]">
            B2B Lead Capture · HR Retainers · Conferences · Nigerian Weddings
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white max-w-3xl text-balance">
            Corporate Retainers, Conference Halls &amp; Grand Celebrations
          </h1>
          <p className="text-sm md:text-base text-stone-200 max-w-2xl leading-relaxed">
            With natural light, flexible layouts, uninterrupted 24-hour power with generator and inverter backup, dedicated fibre internet and a 600-guest Grand Ballroom, The Adire hosts everything from board meetings and AGMs to milestone Nigerian weddings.
          </p>
        </div>
      </section>

      {/* Main Content Split */}
      <main className="max-w-7xl mx-auto px-6 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 flex-1 overflow-hidden">
        {/* Left Column: Venues & Inclusions (Content Pack Sections 7 & 8) */}
        <motion.div
          initial={{ opacity: 0, x: -28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.14 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-5 space-y-6"
        >
          <div className="bg-white p-6 rounded-xl border border-stone-200 space-y-4">
            <h2 className="font-serif text-2xl font-bold text-[#0B2545]">
              Our Four Event &amp; Meeting Spaces
            </h2>
            <div className="space-y-3.5">
              {MEETING_HALLS.map((hall, idx) => (
                <motion.div
                  key={hall.name}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.16 }}
                  transition={{ duration: 0.38, delay: idx * 0.06 }}
                  whileHover={{ y: -3 }}
                  className="p-3.5 rounded-lg bg-[#FAF7F2] border border-stone-200 hover:border-[#C8963E] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-lg font-bold text-[#0B2545]">
                      {hall.name}
                    </h3>
                    <span className="text-xs font-mono font-semibold text-[#C8963E]">
                      {hall.size}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-stone-800 mt-0.5">
                    {hall.capacity}
                  </p>
                  <p className="text-xs text-stone-600 mt-1">{hall.idealFor}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.16 }}
            transition={{ duration: 0.45 }}
            className="bg-[#0B2545] text-white p-6 rounded-xl space-y-4 text-xs"
          >
            <h3 className="font-serif text-xl font-bold text-[#D4A359]">
              Included With Every Corporate Event &amp; Celebration
            </h3>
            <ul className="space-y-2 text-stone-200">
              <li>• 24-hour power with generator, solar and inverter backup</li>
              <li>• Dedicated fibre internet line + projectors, screens &amp; video conferencing</li>
              <li>• Interpretation booths on request &amp; dedicated event coordinator</li>
              <li>• Tailored Eko Kitchen catering (from small chops &amp; tea to smoky party jollof banquets)</li>
              <li>• Weddings include tasting menu for two, complimentary bridal suite night before &amp; family dressing rooms</li>
              <li>• Free secure on-site parking with marshals on duty 24 hours</li>
            </ul>
            <div className="pt-3 border-t border-white/15 text-stone-300">
              Direct Events Desk: <strong className="text-white">events@adirelagoon.example</strong> ·{' '}
              <strong className="text-white">+234 800 000 2484</strong>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Column: Corporate / Event Lead Capture Form */}
        <motion.div
          initial={{ opacity: 0, x: 28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.14 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-7"
        >
          <div className="bg-white p-6 md:p-8 rounded-xl border border-stone-200">
            {submittedRecord ? (
              <div className="py-8 text-center space-y-5">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                  <Check className="w-7 h-7" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-mono uppercase text-emerald-800 font-semibold">
                    Inquiry Routed to Hotel Manager &amp; Events Desk
                  </p>
                  <h2 className="font-serif text-3xl font-bold text-[#0B2545]">
                    Thank you, {submittedRecord.contactName}.
                  </h2>
                  <p className="text-sm text-stone-600 max-w-md mx-auto">
                    Your corporate/event request for{' '}
                    <strong>{submittedRecord.companyOrFamilyName}</strong> ({submittedRecord.roomsNeeded}{' '}
                    rooms · {submittedRecord.estimatedGuests} guests) is now live on our Front-Desk Admin Dashboard.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF7F2] border border-stone-200 text-left text-xs space-y-1.5 max-w-lg mx-auto">
                  <p>
                    <strong>Space Requested:</strong> {submittedRecord.preferredHall}
                  </p>
                  <p>
                    <strong>Dates:</strong> {submittedRecord.eventStartDate} to{' '}
                    {submittedRecord.eventEndDate}
                  </p>
                  <p>
                    <strong>Catering:</strong> {submittedRecord.cateringNeeds}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <a
                    href={`https://wa.me/2348000002484?text=${encodeURIComponent(
                      `Hello Adire Lagoon Events Team! I just submitted a ${submittedRecord.inquiryType} inquiry for ${submittedRecord.companyOrFamilyName} (${submittedRecord.roomsNeeded} rooms, ${submittedRecord.estimatedGuests} guests, ${submittedRecord.eventStartDate} to ${submittedRecord.eventEndDate}).`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" /> Fast-Track Quote on WhatsApp
                  </a>
                  <Link
                    href="/"
                    className="px-5 py-2.5 text-xs font-semibold text-[#0B2545] border border-[#0B2545] rounded-lg hover:bg-stone-50"
                  >
                    Return to Hotel Homepage
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSubmittedRecord(null)}
                    className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
                  >
                    Submit Another Request
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-[#0B2545]">
                    Request a Multi-Room Block, Conference Quote or Wedding Brochure
                  </h2>
                  <p className="text-xs text-stone-600 mt-1">
                    Routes directly to the Hotel Manager&apos;s live dashboard (`/admin`) and events desk.
                  </p>
                </div>

                {/* Inquiry Type Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      id: 'corporate_retainer',
                      label: 'Corporate Room Block / Retainer',
                    },
                    {
                      id: 'conference_hall',
                      label: 'Conference / AGM Hall Rental',
                    },
                    {
                      id: 'wedding_celebration',
                      label: 'Wedding & Grand Celebration',
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() =>
                        setInquiryType(
                          tab.id as
                            | 'corporate_retainer'
                            | 'conference_hall'
                            | 'wedding_celebration'
                        )
                      }
                      className={`p-3 text-xs font-semibold rounded-lg border text-left transition-colors cursor-pointer ${
                        inquiryType === tab.id
                          ? 'bg-[#0B2545] text-white border-[#0B2545]'
                          : 'bg-[#FAF7F2] text-stone-700 border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Company, Organization or Family Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={companyOrFamilyName}
                      onChange={(e) => setCompanyOrFamilyName(e.target.value)}
                      placeholder="e.g. Dangote Industries / Adeyemi Family"
                      className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Contact Person (HR / Event Planner / Host) *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Full Name & Title"
                      className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Official Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="hr@organization.ng"
                      className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Phone / WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+234 803 000 0000"
                      className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Preferred Conference Hall or Venue
                    </label>
                    <select
                      value={preferredHall}
                      onChange={(e) => setPreferredHall(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg"
                    >
                      <option value="The Grand Ballroom (650 sq m · up to 600 guests)">
                        The Grand Ballroom (650 sq m · up to 600 guests)
                      </option>
                      <option value="The Iroko Hall (220 sq m · up to 200 guests)">
                        The Iroko Hall (220 sq m · up to 200 guests)
                      </option>
                      <option value="The Boardroom (45 sq m · up to 18 guests)">
                        The Boardroom (45 sq m · up to 18 guests)
                      </option>
                      <option value="The Executive Study (28 sq m · up to 10 guests)">
                        The Executive Study (28 sq m · up to 10 guests)
                      </option>
                      <option value="Room Block / Corporate Retainer Only (No Hall Needed)">
                        Room Block / Corporate Retainer Only (No Hall Needed)
                      </option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Rooms Needed
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={168}
                        value={roomsNeeded}
                        onChange={(e) => setRoomsNeeded(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Est. Guests
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={600}
                        value={estimatedGuests}
                        onChange={(e) => setEstimatedGuests(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Check-in / Event Start Date
                    </label>
                    <input
                      type="date"
                      value={eventStartDate}
                      onChange={(e) => setEventStartDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Check-out / Event End Date
                    </label>
                    <input
                      type="date"
                      value={eventEndDate}
                      min={eventStartDate}
                      onChange={(e) => setEventEndDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Catering &amp; Banquet Preferences
                    </label>
                    <select
                      value={cateringNeeds}
                      onChange={(e) => setCateringNeeds(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg"
                    >
                      <option value="Morning Tea & Small Chops + Eko Kitchen Buffet Lunch">
                        Morning Tea &amp; Small Chops + Eko Kitchen Buffet Lunch
                      </option>
                      <option value="Full Nigerian Wedding Banquet (Party Jollof, Ofada & Suya Grill)">
                        Full Nigerian Wedding Banquet (Party Jollof, Ofada &amp; Suya Grill)
                      </option>
                      <option value="Cocktail Reception at Sunset Deck & Lagoon Terrace">
                        Cocktail Reception at Sunset Deck &amp; Lagoon Terrace
                      </option>
                      <option value="Rooms & Breakfast Only (Corporate Retainer)">
                        Rooms &amp; Breakfast Only (Corporate Retainer)
                      </option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Additional Requirements (AV equipment, interpretation booths, airport transfers, bridal suite)
                    </label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Tell us about your event schedule, billing preferences or special executive requirements..."
                      className="w-full px-3.5 py-2 text-sm border border-stone-300 rounded-lg"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 text-sm font-semibold text-white bg-[#C8963E] hover:bg-[#b5842f] rounded-lg transition-colors cursor-pointer"
                >
                  {isSubmitting
                    ? 'Routing to Hotel Manager Dashboard...'
                    : 'Submit Corporate / Event Quote Request'}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
