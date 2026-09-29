import type { Metadata } from 'next';
import './globals.css';
import { AntdProvider } from '../providers/AntdProvider';
import { SuperAdminProvider } from '@/context/SuperAdminContext';

export const metadata: Metadata = {
  title: 'GYMENT — Super Admin',
  description: 'Monitor and manage the GYMENT platform from one place.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-gyment-bg text-gyment-text antialiased">
        <AntdProvider>
          <SuperAdminProvider>{children}</SuperAdminProvider>
        </AntdProvider>
      </body>
    </html>
  );
}
