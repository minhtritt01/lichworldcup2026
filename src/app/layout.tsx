import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'vietnamese'] });

export const metadata: Metadata = {
  title: 'Trực Tiếp World Cup 2026 - Kết Quả Tỉ Số Cập Nhật 15 Giây',
  description:
    'Theo dõi trực tiếp kết quả bóng đá, lịch thi đấu 104 trận, bảng xếp hạng World Cup 2026 tự động cập nhật. 48 đội, 16 sân, 3 quốc gia chủ nhà.',
  keywords: [
    'trực tiếp bóng đá',
    'truc tiep bong da',
    'lịch thi đấu World Cup 2026',
    'kết quả World Cup 2026',
    'tỉ số World Cup 2026',
    'xem World Cup 2026',
  ],
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: 'Trực Tiếp World Cup 2026',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body
        className={`${inter.className} bg-slate-50 min-h-screen text-slate-900 antialiased`}
      >
        <nav className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow">
          <a href="/" className="font-black text-lg tracking-tight">
            ⚽ World Cup 2026
          </a>
          <span className="text-xs text-slate-400">11/06 – 19/07/2026</span>
        </nav>
        {children}
        <footer className="mt-16 bg-slate-900 text-slate-400 text-xs text-center py-6 px-4">
          © 2026 LịchWorldCup2026.vn · Dữ liệu cập nhật mỗi 15 giây · Tất cả 104 trận
        </footer>
      </body>
    </html>
  );
}
