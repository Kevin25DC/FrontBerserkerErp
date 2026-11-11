import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import 'bootstrap-icons/font/bootstrap-icons.min.css';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Berserker ERP', template: '%s · Berserker ERP' },
  description: 'Facturación, cartera e inventario',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
