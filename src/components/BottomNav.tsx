import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  MapPin,
  Tag,
  ShieldCheck,
} from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, setCurrentTab }) => {
  const { isOwner, isManager } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, visible: true },
    { id: 'prospects', label: 'Prospek', icon: Users, visible: true },
    { id: 'zones', label: 'Zone', icon: MapPin, visible: isOwner || isManager },
    { id: 'business_types', label: 'Jenis Usaha', icon: Tag, visible: isOwner || isManager },
    { id: 'user_management', label: 'User Staf', icon: ShieldCheck, visible: isOwner },
  ].filter((item) => item.visible);

  return (
    <nav
      aria-label="Navigasi Bawah"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-md border-t border-gray-200 shadow-[0_-3px_12px_rgba(0,0,0,0.06)] md:hidden transition-all duration-200"
    >
      <div className="max-w-md mx-auto flex items-center justify-around px-2 h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setCurrentTab(item.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer relative ${
                isActive
                  ? 'text-emerald-700'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {isActive && (
                <span className="absolute top-1 w-6 h-0.5 rounded-full bg-emerald-600" />
              )}
              <div
                className={`p-1 rounded-lg transition ${
                  isActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-400'
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
              </div>
              <span
                className={`text-[10px] tracking-tight truncate max-w-[64px] ${
                  isActive ? 'font-bold text-emerald-800' : 'font-medium text-gray-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
