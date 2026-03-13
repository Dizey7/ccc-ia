import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import Marquee from '@/components/Marquee';

export const metadata: Metadata = {
  title: 'CCC IA - Assistant Intelligent de Répartition',
  description: 'Application intelligente pour la gestion et répartition des agents de sécurité',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="antialiased" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 ml-64 flex flex-col">
            <TopBar />
            <main className="flex-1 pb-12">
              {children}
            </main>
            <Marquee />
          </div>
        </div>
      </body>
    </html>
  );
}
