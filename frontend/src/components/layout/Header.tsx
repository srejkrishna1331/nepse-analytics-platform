'use client';

import { useStore } from '@/store/useStore';

export default function Header() {
  const { marketData, toggleSidebar, sidebarOpen, user, logout } = useStore();

  return (
    <header
      className={`fixed top-0 right-0 ${
        sidebarOpen ? 'left-64' : 'left-16'
      } h-14 bg-dark-card border-b border-dark-border flex items-center justify-between px-6 z-40 transition-all duration-300`}
    >
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="text-gray-400 hover:text-white">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {marketData && (
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-gray-400">NEPSE</span>
              <span className="ml-2 font-semibold text-white">{marketData.nepseIndex?.toFixed(2) ?? '—'}</span>
              <span className={`ml-2 ${(marketData.change ?? 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                {(marketData.change ?? 0) >= 0 ? '+' : ''}{marketData.change?.toFixed(2) ?? '0'}
                ({(marketData.change ?? 0) >= 0 ? '+' : ''}{marketData.changePercent?.toFixed(2) ?? '0'}%)
              </span>
            </div>
            <div className="text-gray-400">
              Turnover: <span className="text-white">Rs. {((marketData.totalTurnover ?? 0) / 1e9).toFixed(2)}B</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{user.name}</span>
            <button onClick={logout} className="text-sm text-gray-400 hover:text-white">
              Logout
            </button>
          </div>
        ) : (
          <span className="text-sm text-gray-400">Demo Mode</span>
        )}
      </div>
    </header>
  );
}
