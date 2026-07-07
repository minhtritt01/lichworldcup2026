import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { GoogleAnalytics } from '@next/third-parties/google';
import { ThemeProvider } from '../components/ThemeProvider';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  const theme = cookies().get('theme')?.value === 'dark' ? 'dark' : 'light';

  return (
    <html
      lang="en"
      className={`scroll-smooth ${theme === 'dark' ? 'dark' : ''}`}
      suppressHydrationWarning
    >
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
        <ThemeProvider initialTheme={theme}>
          {children}
        </ThemeProvider>
      </body>
      <GoogleAnalytics gaId="G-31RBWHFLB7" />
    </html>
  );
}
