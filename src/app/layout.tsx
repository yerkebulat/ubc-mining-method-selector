import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'UBC Mining Method Selector',
  description:
    'Open-source web implementation of the UBC Mining Method Selector based on Nicholas (1981) "Method Selection – A Numerical Approach"',
  keywords: [
    'mining',
    'method selection',
    'underground mining',
    'mining engineering',
    'UBC',
    'Nicholas',
    'rock mechanics',
  ],
  authors: [
    { name: 'David E. Nicholas', url: 'https://doi.org/10.1007/978-1-4613-3434-4_4' },
  ],
  openGraph: {
    title: 'UBC Mining Method Selector',
    description:
      'Numerical approach to mining method selection based on deposit geometry and rock mechanics',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <header className="sticky top-0 z-50 border-b border-mining-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 text-mining-700"
                >
                  <path d="M2 20h20" />
                  <path d="M5 20V8.5l7-4.5 7 4.5V20" />
                  <path d="M9 20v-4h6v4" />
                </svg>
                <span className="text-lg font-semibold text-mining-900">
                  UBC Mining Method Selector
                </span>
              </div>
              <nav className="flex items-center gap-4 text-sm">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-mining-600 hover:text-mining-900 transition-colors"
                >
                  GitHub
                </a>
              </nav>
            </div>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="border-t border-mining-200 bg-mining-50 py-8">
            <div className="container mx-auto px-4">
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <h3 className="mb-3 font-semibold text-mining-900">Attribution</h3>
                  <p className="text-sm text-mining-600">
                    Based on David E. Nicholas (1981), &quot;Method Selection – A
                    Numerical Approach&quot; and the UBC Mining Method Selector
                    spreadsheet by Miller-Tait, Pakalnis &amp; Poulin (1995).
                  </p>
                </div>
                <div>
                  <h3 className="mb-3 font-semibold text-mining-900">Implementation</h3>
                  <p className="text-sm text-mining-600">
                    Web application implemented by Yerkebulan Tazabek.
                  </p>
                </div>
                <div>
                  <h3 className="mb-3 font-semibold text-mining-900">License</h3>
                  <p className="text-sm text-mining-600">
                    This project is open source under the MIT License. See the
                    repository for details.
                  </p>
                </div>
              </div>
              <div className="mt-8 border-t border-mining-200 pt-6 text-center text-xs text-mining-500">
                &copy; {new Date().getFullYear()} UBC Mining Method Selector.
                Implemented by Yerkebulan Tazabek. Open source software.
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
