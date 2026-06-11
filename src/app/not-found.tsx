import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Minimal header */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative w-6 h-6 flex items-center justify-center rounded-full border border-slate-200 bg-slate-100 overflow-hidden shadow-inner dark:border-slate-700 dark:bg-slate-800">
              <Image src="/logo.png" alt="World Cup 2026" width={28} height={28} className="object-cover scale-110" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-slate-900 dark:text-white">World Cup 2026</span>
          </Link>
        </div>
      </nav>

      {/* Body */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          {/* Big 404 */}
          <p className="text-[96px] font-black leading-none tracking-tight text-slate-100 dark:text-slate-800 select-none">
            404
          </p>

          <div className="-mt-4 mb-6">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Page not found
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Trang này không tồn tại hoặc đã bị xóa.
              <br />
              This page doesn&apos;t exist or has been removed.
            </p>
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              href="/"
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition"
            >
              ← Home
            </Link>
            <Link
              href="/live"
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Live Scores
            </Link>
            <Link
              href="/teams"
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Teams
            </Link>
            <Link
              href="/reports"
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Reports
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
