'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';

const navItems = [
  { href: '/', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/market', label: 'Market', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  { href: '/analysis', label: 'Analysis', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { href: '/signals', label: 'Signals', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { href: '/scanner', label: 'Scanner', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
  { href: '/portfolio', label: 'Portfolio', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { href: '/news', label: 'News', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
  { href: '/assistant', label: 'Assistant', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const sidebarOpen = useStore((s) => s.sidebarOpen);

  return (
    <aside
      className={`${
        sidebarOpen ? 'w-64' : 'w-16'
      } bg-dark-card border-r border-dark-border h-screen fixed left-0 top-0 transition-all duration-300 z-50`}
    >
      <div className="p-4 border-b border-dark-border">
        <h1 className={`text-xl font-bold text-primary-400 ${!sidebarOpen && 'text-center text-sm'}`}>
          {sidebarOpen ? 'NEPSE Analytics' : 'N'}
        </h1>
      </div>

      <nav className="mt-4 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                isActive
                  ? 'bg-primary-600/20 text-primary-400'
                  : 'text-gray-400 hover:bg-dark-border/50 hover:text-gray-200'
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
