import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import { locales } from '../../i18n';
import Navbar from '../../components/Navbar';
import LiveTicker from '../../components/LiveTicker';
import Footer from '../../components/Footer';
import '../globals.css';

const inter = Inter({ subsets: ['latin', 'vietnamese'] });

export function generateStaticParams() {
  return locales.map(locale => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'meta' });
  return {
    title: t('homeTitle'),
    description: t('homeDesc'),
    keywords: params.locale === 'vi'
      ? ['trực tiếp bóng đá', 'truc tiep bong da', 'lịch thi đấu World Cup 2026', 'kết quả World Cup 2026']
      : ['World Cup 2026 live', 'World Cup 2026 scores', 'World Cup 2026 schedule', 'FIFA 2026'],
    openGraph: {
      type: 'website',
      locale: params.locale === 'vi' ? 'vi_VN' : 'en_US',
      siteName: 'World Cup 2026 Live',
    },
    alternates: {
      canonical: params.locale === 'en' ? 'https://worldcup2026live.vn/en' : 'https://worldcup2026live.vn',
      languages: {
        'vi': 'https://worldcup2026live.vn',
        'en': 'https://worldcup2026live.vn/en',
      },
    },
    robots: { index: true, follow: true },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <html lang={params.locale} className="scroll-smooth">
      <body className={`${inter.className} bg-slate-50 min-h-screen text-slate-900 antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <Navbar />
          <LiveTicker />
          <div className="max-w-6xl mx-auto px-4">
            {children}
          </div>
          <Footer locale={params.locale} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
