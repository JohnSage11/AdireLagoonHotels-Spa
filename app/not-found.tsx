import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <p className="text-xs font-mono uppercase tracking-wider text-[#C8963E]">
        404 · The Adire Lagoon Hotel &amp; Spa
      </p>
      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#0B2545]">
        Lost in Lagos traffic? The page you are looking for took a wrong turn.
      </h1>
      <Link
        href="/"
        className="px-6 py-3 text-sm font-semibold text-white bg-[#0B2545] hover:bg-[#173b66] rounded-md transition-colors"
      >
        Return to the homepage
      </Link>
    </div>
  );
}
