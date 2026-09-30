import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProspectsPage } from './pages/ProspectsPage';
import { ZonesPage } from './pages/ZonesPage';
import { BusinessTypesPage } from './pages/BusinessTypesPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { SupabaseModal } from './components/SupabaseModal';
import { BottomNav } from './components/BottomNav';
import { PermissionDeniedBanner } from './components/PermissionDeniedBanner';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ProspectStatus } from './types';
import { db } from './lib/db';
import { Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentUser, isLoading, isOwner, isManager } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [initialStatusFilter, setInitialStatusFilter] = useState<ProspectStatus | undefined>(undefined);
  const [isCreateOpenInitially, setIsCreateOpenInitially] = useState(false);

  // Auto-sync initial master data and prospects to Supabase in background whenever app starts
  React.useEffect(() => {
    db.ensureAutoSyncedWithSupabase();
  }, []);

  // If auth is loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg animate-pulse text-2xl">
            🍎
          </div>
          <p className="text-xs font-semibold text-gray-500">Memuat PesanBuah.id...</p>
        </div>
      </div>
    );
  }

  // If user is not logged in, show production login page
  if (!currentUser) {
    return <LoginPage />;
  }

  // Handlers for cross-page navigation from dashboard
  const handleNavigateToProspects = (filterStatus?: ProspectStatus) => {
    setInitialStatusFilter(filterStatus);
    setIsCreateOpenInitially(false);
    setCurrentTab('prospects');
  };

  const handleOpenCreateProspect = () => {
    setInitialStatusFilter(undefined);
    setIsCreateOpenInitially(true);
    setCurrentTab('prospects');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-gray-900">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setInitialStatusFilter(undefined);
          setIsCreateOpenInitially(false);
          setCurrentTab(tab);
        }}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
      />

      {/* Global Permission Alert Banner if Supabase table permissions are denied */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-3">
        <PermissionDeniedBanner />
      </div>

      {/* Main Page View */}
      <main className="flex-1 pb-16 sm:pb-8">
        {currentTab === 'dashboard' && (
          <DashboardPage
            onNavigateToProspects={handleNavigateToProspects}
            onOpenCreateProspect={handleOpenCreateProspect}
            onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          />
        )}

        {currentTab === 'prospects' && (
          <ProspectsPage
            key={initialStatusFilter || 'all'}
            initialStatusFilter={initialStatusFilter}
            isCreateOpenInitially={isCreateOpenInitially}
          />
        )}

        {currentTab === 'zones' && (isOwner || isManager) && <ZonesPage />}

        {currentTab === 'business_types' && (isOwner || isManager) && <BusinessTypesPage />}

        {currentTab === 'user_management' && isOwner && <UserManagementPage />}
      </main>

      {/* Persistent Bottom Navigation Bar for Mobile / Field Usage */}
      <BottomNav
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setInitialStatusFilter(undefined);
          setIsCreateOpenInitially(false);
          setCurrentTab(tab);
        }}
      />

      {/* Connectivity & Offline Notification Indicator */}
      <OfflineIndicator />

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-3 px-4 sm:px-6 text-center text-xs text-gray-400 mb-14 md:mb-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} PesanBuah.id &bull; Sistem Database Calon Customer</span>
          <span>Akses Aktif: {currentUser.name} ({currentUser.role})</span>
        </div>
      </footer>

      {/* Supabase Connection & SQL Modal (Owner Only) */}
      {isOwner && (
        <SupabaseModal
          isOpen={isSupabaseModalOpen}
          onClose={() => setIsSupabaseModalOpen(false)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
