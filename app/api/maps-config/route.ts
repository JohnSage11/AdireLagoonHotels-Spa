import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function isValidGoogleMapsKey(key?: string): key is string {
  if (!key) return false;
  const trimmed = key.trim();
  if (
    trimmed.length < 30 ||
    trimmed.includes('MY_') ||
    trimmed.includes('YOUR_') ||
    trimmed.includes('PLACEHOLDER') ||
    trimmed.includes('FIREBASE_')
  ) {
    return false;
  }
  return trimmed.startsWith('AIza');
}

export async function GET() {
  const candidate =
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.VITE_GOOGLE_MAPS_API_KEY ||
    '';

  const apiKey = isValidGoogleMapsKey(candidate) ? candidate.trim() : '';

  return NextResponse.json({ apiKey });
}
