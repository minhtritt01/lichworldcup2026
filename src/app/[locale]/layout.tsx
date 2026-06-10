import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { locales } from '../../i18n';
import Navbar from '../../components/Navbar';
import LiveTicker from '../../components/LiveTicker';
import Footer from '../../components/Footer';
import { ThemeProvider } from '../../components/ThemeProvider';
import '../globals.css';

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
      ? ['trực tiếp bóng đá', 'truc tiep bong da', 'lịch thi đấu World Cup 2026', 'kết quả World Cup 2026']
      : ['World Cup 2026 live', 'World Cup 2026 scores', 'World Cup 2026 schedule', 'FIFA 2026'],
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
    <html lang={params.locale} className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var root = document.documentElement;
                  var stored = localStorage.getItem('theme');
                  var theme = stored === 'dark' || stored === 'light'
                    ? stored
                    : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  root.classList.toggle('dark', theme === 'dark');
                  root.style.colorScheme = theme;
                } catch (error) {}
              })()
            `,
          }}
        />
      </head>
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen antialiased transition-colors duration-150">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <Navbar />
            <LiveTicker />
            <div className="max-w-6xl mx-auto px-4">
              {children}
            </div>
            <Footer locale={params.locale} />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
