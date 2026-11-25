import type { Metadata } from 'next';
import { Cormorant_Garamond, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { HotelStoreProvider } from '@/lib/hotel-store';
import PageTransitionWrapper from '@/components/PageTransitionWrapper';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-serif',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'The Adire Lagoon Hotel & Spa | Luxury Hotel in Victoria Island, Lagos',
  description:
    'Experience warm Nigerian hospitality at The Adire Lagoon. Lagoon-view rooms, award-winning Nigerian cuisine, a full-service spa, 24-hour power and a rooftop pool in the heart of Victoria Island. Book direct for the best rate.',
  icons: {
    icon: '/images/hotel_doc_0.jpg',
    apple: '/images/hotel_doc_0.jpg',
  },
  openGraph: {
    title: 'The Adire Lagoon Hotel & Spa | Luxury Hotel in Victoria Island, Lagos',
    description:
      'Experience warm Nigerian hospitality at The Adire Lagoon. Lagoon-view rooms, award-winning Nigerian cuisine, a full-service spa, 24-hour power and a rooftop pool in the heart of Victoria Island. Book direct for the best rate.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Adire Lagoon Hotel & Spa | Luxury Hotel in Victoria Island, Lagos',
    description:
      'Experience warm Nigerian hospitality at The Adire Lagoon. Lagoon-view rooms, award-winning Nigerian cuisine, a full-service spa, 24-hour power and a rooftop pool in the heart of Victoria Island. Book direct for the best rate.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${jakarta.variable} ${jetbrains.variable}`}
    >
      <body className="font-sans antialiased bg-[#FAF7F2] text-stone-900" suppressHydrationWarning>
        <HotelStoreProvider>
          <PageTransitionWrapper>{children}</PageTransitionWrapper>
        </HotelStoreProvider>
      </body>
    </html>
  );
}
