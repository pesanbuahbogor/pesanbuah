import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  MapPin,
  Tag,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Database,
} from 'lucide-react';
import { getSupabase } from '../lib/supabase';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenSupabaseModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenSupabaseModal }) => {
  const { currentUser, logout, isOwner, isManager } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const isSupabaseConnected = !!getSupabase();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, visible: true },
    { id: 'prospects', label: 'Prospect (Calon Customer)', icon: Users, visible: true },
    { id: 'zones', label: 'Zone', icon: MapPin, visible: isOwner || isManager },
    { id: 'business_types', label: 'Jenis Usaha', icon: Tag, visible: isOwner || isManager },
    { id: 'user_management', label: 'User Management', icon: ShieldCheck, visible: isOwner },
  ].filter((item) => item.visible);

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'Owner':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Manager':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Sales':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between h-13.5 sm:h-14">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <div
              onClick={() => setCurrentTab('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer select-none"
            >
              <img
                src="/pwa-192x192.png"
                alt="PesanBuah.id Logo"
                className="w-8 h-8 rounded-xl shadow-xs object-cover border border-emerald-500/20"
                onError={(e) => {
                  // Fallback if image not ready
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <div>
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-gray-900 leading-tight">
                  PesanBuah<span className="text-emerald-600">.id</span>
                </span>
                <span className="hidden sm:block text-[9px] font-semibold tracking-wider uppercase text-gray-400 -mt-0.5">
                  Calon Customer
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Action: Supabase status (Owner only) & User Profile */}
          <div className="hidden md:flex items-center gap-3">
            {/* In-App PWA Install Button */}
            <PWAInstallButton />

            {/* Supabase status badge - ONLY VISIBLE TO OWNER */}
            {isOwner && (
              <button
                onClick={onOpenSupabaseModal}
                title="Pengaturan Koneksi Supabase & Skrip SQL (Hanya Owner)"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                  isSupabaseConnected
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>{isSupabaseConnected ? 'Supabase Connected' : 'Konfigurasi Supabase'}</span>
              </button>
            )}

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-gray-100 border border-gray-200 transition text-left cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                  {currentUser?.name.charAt(0) || 'U'}
                </div>
                <div className="hidden lg:block">
                  <div className="text-xs font-bold text-gray-900 truncate max-w-[120px]">
                    {currentUser?.name}
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${getRoleBadgeColor(
                        currentUser?.role
                      )}`}
                    >
                      {currentUser?.role}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {/* User Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-900">{currentUser?.name}</p>
                    <p className="text-[11px] text-gray-500 font-mono truncate">{currentUser?.email}</p>
                    <p className="text-[11px] text-gray-500 font-mono">{currentUser?.phone}</p>
                    <div className="mt-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRoleBadgeColor(
                          currentUser?.role
                        )}`}
                      >
                        Role: {currentUser?.role}
                      </span>
                    </div>
                  </div>

                  {isOwner && (
                    <button
                      onClick={() => {
                        onOpenSupabaseModal();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition cursor-pointer border-b border-gray-100"
                    >
                      <Database className="w-4 h-4 text-emerald-600" />
                      Konfigurasi Supabase
                    </button>
                  )}

                  <button
                    onClick={() => {
                      logout();
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    Logout Keluar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile hamburger menu */}
          <div className="flex md:hidden items-center gap-1.5">
            <PWAInstallButton />

            {isOwner && (
              <button
                onClick={onOpenSupabaseModal}
                className="p-2 rounded-lg bg-gray-100 text-gray-600"
                title="Supabase"
              >
                <Database className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          <div className="p-3 bg-gray-50 rounded-xl mb-3 border border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-900">{currentUser?.name}</p>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getRoleBadgeColor(
                  currentUser?.role
                )}`}
              >
                {currentUser?.role}
              </span>
            </div>
            <button
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              className="px-2.5 py-1 text-xs text-rose-600 font-semibold bg-rose-50 rounded-lg cursor-pointer"
            >
              Logout
            </button>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
};

