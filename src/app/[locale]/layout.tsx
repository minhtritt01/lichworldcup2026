import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { locales } from '../../i18n';
import Navbar from '../../components/Navbar';
import LiveTicker from '../../components/LiveTicker';
import Footer from '../../components/Footer';

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
    metadataBase: new URL('https://lichworldcup2026.vn'),
    title: t('homeTitle'),
    description: t('homeDesc'),
    keywords: params.locale === 'vi'
      ? [
          'trực tiếp bóng đá world cup 2026',
          'truc tiep bong da world cup 2026',
          'lịch thi đấu world cup 2026 hôm nay',
          'kết quả world cup 2026',
          'bảng xếp hạng world cup 2026',
          'tỉ số world cup 2026 mới nhất',
          'world cup 2026 xem kênh nào',
          'lịch thi đấu vòng bảng world cup 2026',
          'nhận định world cup 2026',
          'dự đoán tỷ số world cup 2026',
          'world cup 2026 vòng 1/8',
          'world cup 2026 bán kết',
        ]
      : [
          'World Cup 2026 live score',
          'World Cup 2026 schedule today',
          'FIFA World Cup 2026 results',
          'World Cup 2026 group standings',
          'World Cup 2026 live stream',
          'FIFA 2026 match scores',
          'World Cup 2026 round of 16',
          'World Cup 2026 predictions',
          'World Cup 2026 lineup today',
          'World Cup 2026 kickoff time',
          '2026 FIFA World Cup scores',
          'World Cup 2026 quarter final',
        ],
    openGraph: {
      type: 'website',
      locale: params.locale === 'vi' ? 'vi_VN' : 'en_US',
      siteName: 'World Cup 2026 Live',
      images: [
        {
          url: '/opengraph-image.png',
          width: 1200,
          height: 630,
          alt: 'World Cup 2026 Live',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('homeTitle'),
      description: t('homeDesc'),
      images: ['/opengraph-image.png'],
    },
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/icon.png', type: 'image/png', sizes: '512x512' },
      ],
      apple: [
        { url: '/apple-icon.png', sizes: '512x512', type: 'image/png' },
      ],
    },
    alternates: {
      canonical: params.locale === 'en' ? 'https://lichworldcup2026.vn/en' : 'https://lichworldcup2026.vn',
      languages: {
        'vi': 'https://lichworldcup2026.vn',
        'en': 'https://lichworldcup2026.vn/en',
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
    <NextIntlClientProvider messages={messages}>
      <Navbar />
      <LiveTicker />
      <div className="max-w-6xl mx-auto px-4">
        {children}
      </div>
      <Footer locale={params.locale} />
    </NextIntlClientProvider>
  );
}
