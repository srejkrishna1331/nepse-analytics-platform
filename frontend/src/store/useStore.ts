'use client';

import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface MarketData {
  nepseIndex: number;
  change: number;
  changePercent: number;
  totalTurnover: number;
  totalVolume: number;
}

interface AppStore {
  user: User | null;
  token: string | null;
  theme: 'dark' | 'light';
  marketData: MarketData | null;
  selectedSymbol: string;
  sidebarOpen: boolean;

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  toggleTheme: () => void;
  setMarketData: (data: MarketData) => void;
  setSelectedSymbol: (symbol: string) => void;
  toggleSidebar: () => void;
  logout: () => void;
}

export const useStore = create<AppStore>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  theme: 'dark',
  marketData: null,
  selectedSymbol: 'NABIL',
  sidebarOpen: true,

  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token });
  },
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  setMarketData: (data) => set({ marketData: data }),
  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));
