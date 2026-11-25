'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Lock, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface NavbarProps {
  onBookNowClick?: () => void;
}

export default function Navbar({ onBookNowClick }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Stealth 7-Click Logo Counter
  const clickCountRef = useRef<number>(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [adminLoginOpen, setAdminLoginOpen] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');

  const handleLogoSecretClick = (e: React.MouseEvent) => {
    clickCountRef.current += 1;

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    if (clickCountRef.current >= 7) {
      e.preventDefault();
      clickCountRef.current = 0;
      setLoginError('');
      setUsername('');
      setPassword('');
      setShowPassword(false);
      setAdminLoginOpen(true);
      return;
    }

    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 3000);
  };

  const handleAdminSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === 'Admin' && password === 'Admin@AdireLagoon') {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('adire_admin_authenticated', 'true');
      }
      setAdminLoginOpen(false);
      router.push('/admin');
    } else {
      setLoginError('Invalid staff credentials. Please check your username and password.');
    }
  };

  const navLinks = [
    { label: 'Rooms & Suites', href: '/rooms' },
    { label: 'Dining & Spa', href: '/dining-spa' },
    { label: 'Special Offers', href: '/offers' },
    { label: 'Corporate & Events', href: '/corporate' },
    { label: 'Gallery & Calendar', href: '/gallery' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-8 px-4 sm:px-6 py-3.5 sm:py-4">
          {/* Zone 1: Official Adire Lagoon Hotel & Spa Logo (7-click stealth trigger for Admin Sign-In) */}
          <Link
            href="/"
            onClick={handleLogoSecretClick}
            title="The Adire Lagoon Hotel & Spa"
            aria-label="The Adire Lagoon Hotel & Spa"
            className="relative h-12 sm:h-14 w-[138px] sm:w-[172px] shrink-0 select-none block"
          >
            <Image
              src="/images/hotel_doc_0.jpg"
              alt="The Adire Lagoon Hotel & Spa Logo"
              fill
              priority
              sizes="(max-width: 640px) 138px, 172px"
              referrerPolicy="no-referrer"
              className="object-contain object-left"
            />
          </Link>

          {/* Zone 2: 5 clean single-line text navigation links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-stone-700">
            {navLinks.map((link) => {
              const isActive =
                link.href === pathname ||
                (link.href !== '/' && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`hover:text-[#0B2545] hover:underline underline-offset-8 decoration-[#C8963E] transition-colors whitespace-nowrap shrink-0 ${
                    isActive ? 'text-[#0B2545] font-semibold underline' : ''
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {onBookNowClick ? (
              <button
                type="button"
                onClick={onBookNowClick}
                className="px-4 sm:px-5 py-2.5 min-h-[42px] text-xs md:text-sm font-semibold text-white bg-[#C8963E] hover:bg-[#b5842f] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Book Now
              </button>
            ) : (
              <Link
                href="/rooms"
                className="px-4 sm:px-5 py-2.5 min-h-[42px] inline-flex items-center text-xs md:text-sm font-semibold text-white bg-[#C8963E] hover:bg-[#b5842f] rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                Book Now
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="lg:hidden p-2.5 min-h-[42px] min-w-[42px] flex items-center justify-center text-stone-700 hover:text-[#0B2545] rounded-md border border-stone-200"
              aria-label="Toggle Navigation"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer — No public /admin link exposed */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-stone-200 bg-white px-4 sm:px-6 py-4 space-y-1 shadow-lg">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block py-3 px-2 text-sm font-medium text-stone-800 hover:text-[#C8963E] hover:bg-stone-50 rounded-md"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Hidden 7-Click Staff Admin Sign-In Modal */}
      {adminLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
            <div className="bg-[#0B2545] text-white px-6 py-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative w-16 h-12 rounded-lg bg-white p-1 shrink-0">
                  <Image
                    src="/images/hotel_doc_0.jpg"
                    alt="The Adire Lagoon Hotel & Spa Logo"
                    fill
                    sizes="64px"
                    referrerPolicy="no-referrer"
                    className="object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-mono uppercase tracking-wider text-[#D4A359] flex items-center gap-1">
                    <Lock className="w-3 h-3 shrink-0" /> Restricted Staff Portal
                  </p>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-white leading-tight">
                    Front-Desk &amp; Management Sign In
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdminLoginOpen(false)}
                className="p-2 text-white/70 hover:text-white rounded-lg cursor-pointer shrink-0"
                aria-label="Close Staff Sign In"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdminSignIn} className="p-6 space-y-4">
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
                  className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-[#0B2545]"
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
                    className="w-full pl-3.5 pr-11 py-2.5 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-[#0B2545]"
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

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAdminLoginOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-semibold text-white bg-[#0B2545] hover:bg-[#173a66] rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-[#D4A359]" />
                  Unlock Front-Desk Console
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
