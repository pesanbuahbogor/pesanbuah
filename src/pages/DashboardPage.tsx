import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { Prospect, Profile, Zone, ProspectStatus } from '../types';
import {
  Users,
  UserPlus,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Briefcase,
  ArrowRight,
  Database,
  Radio,
} from 'lucide-react';
import { getSupabase, subscribeToRealtime } from '../lib/supabase';

interface DashboardPageProps {
  onNavigateToProspects: (filterStatus?: ProspectStatus) => void;
  onOpenCreateProspect: () => void;
  onOpenSupabaseModal?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToProspects,
  onOpenCreateProspect,
  onOpenSupabaseModal,
}) => {
  const { currentUser, isSales, isOwner } = useAuth();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isSupabaseConnected = !!getSupabase();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prospectsData, profilesData, zonesData] = await Promise.all([
        db.getProspects(currentUser),
        db.getProfiles(),
        db.getZones(),
      ]);
      setProspects(prospectsData);
      setProfiles(profilesData);
      setZones(zonesData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Real-time synchronization: refresh dashboard metrics instantly on any field update
  useEffect(() => {
    const unsubProspects = subscribeToRealtime('prospects', () => {
      loadData();
    });
    const unsubProfiles = subscribeToRealtime('profiles', () => {
      loadData();
    });
    const unsubZones = subscribeToRealtime('zones', () => {
      loadData();
    });

    return () => {
      unsubProspects();
      unsubProfiles();
      unsubZones();
    };
  }, []);

  // Compute metrics from actual database
  const totalCount = prospects.length;
  const prospectCount = prospects.filter((p) => p.status === 'Prospect').length;
  const followUpCount = prospects.filter((p) => p.status === 'Follow Up').length;
  const customerCount = prospects.filter((p) => p.status === 'Customer').length;
  const tidakJadiCount = prospects.filter((p) => p.status === 'Tidak Jadi').length;

  // Compute Prospects per Sales
  const salesProfiles = profiles.filter((p) => p.role === 'Sales');
  const salesMap = new Map<string, number>();
  let unassignedSalesCount = 0;

  prospects.forEach((p) => {
    if (p.sales_id) {
      salesMap.set(p.sales_id, (salesMap.get(p.sales_id) || 0) + 1);
    } else {
      unassignedSalesCount++;
    }
  });

  const prospectPerSales = salesProfiles.map((s) => ({
    id: s.id,
    name: s.name,
    count: salesMap.get(s.id) || 0,
    percentage: totalCount > 0 ? Math.round(((salesMap.get(s.id) || 0) / totalCount) * 100) : 0,
  }));

  // Compute Prospects per Zone
  const zoneMap = new Map<string, number>();
  let unassignedZoneCount = 0;

  prospects.forEach((p) => {
    if (p.zone_id) {
      zoneMap.set(p.zone_id, (zoneMap.get(p.zone_id) || 0) + 1);
    } else {
      unassignedZoneCount++;
    }
  });

  const prospectPerZone = zones.map((z) => ({
    id: z.id,
    name: z.name,
    count: zoneMap.get(z.id) || 0,
    percentage: totalCount > 0 ? Math.round(((zoneMap.get(z.id) || 0) / totalCount) * 100) : 0,
  }));

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl"></div>
            ))}
          </div>
          <div className="h-44 bg-gray-100 rounded-xl mt-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-5 py-3 space-y-2.5">
      {/* Header: Compact, slim and proportional */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white px-3.5 py-2.5 rounded-lg border border-gray-200/90 shadow-2xs">
        <div>
          <h1 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight leading-snug">
            Dashboard Calon Customer
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Halo, <span className="font-semibold text-emerald-700">{currentUser?.name}</span> ({currentUser?.role})
            {isSales && ' · Memantau prospek yang ditugaskan kepada Anda.'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Supabase Database Settings - Visible strictly to Owner only */}
          {isOwner && onOpenSupabaseModal && (
            <button
              onClick={onOpenSupabaseModal}
              title="Konfigurasi Database Supabase & Skrip SQL"
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md border transition cursor-pointer ${
                isSupabaseConnected
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isSupabaseConnected ? 'Supabase' : 'Setup Supabase'}</span>
            </button>
          )}

          <button
            onClick={onOpenCreateProspect}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-2xs transition cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            + Calon Customer
          </button>
        </div>
      </div>

      {/* KPI Cards: Compact height & proportional typography */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {/* Total Prospect */}
        <div
          onClick={() => onNavigateToProspects()}
          className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-2xs hover:border-emerald-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Total
            </span>
            <div className="p-1 rounded bg-gray-100 group-hover:bg-emerald-50 text-gray-600 group-hover:text-emerald-600 transition">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg sm:text-xl font-bold text-gray-900">{totalCount}</span>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
              Lihat <ArrowRight className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>

        {/* Status: Prospect */}
        <div
          onClick={() => onNavigateToProspects('Prospect')}
          className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs hover:border-blue-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
              Prospect
            </span>
            <div className="p-1 rounded bg-blue-50 text-blue-600">
              <Briefcase className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg sm:text-xl font-bold text-blue-900">{prospectCount}</span>
            <span className="text-[10px] text-blue-600 font-medium">Baru Masuk</span>
          </div>
        </div>

        {/* Status: Follow Up */}
        <div
          onClick={() => onNavigateToProspects('Follow Up')}
          className="bg-white p-2.5 rounded-lg border border-amber-100 shadow-2xs hover:border-amber-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
              Follow Up
            </span>
            <div className="p-1 rounded bg-amber-50 text-amber-600">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg sm:text-xl font-bold text-amber-900">{followUpCount}</span>
            <span className="text-[10px] text-amber-600 font-medium">Diproses</span>
          </div>
        </div>

        {/* Status: Customer */}
        <div
          onClick={() => onNavigateToProspects('Customer')}
          className="bg-white p-2.5 rounded-lg border border-emerald-100 shadow-2xs hover:border-emerald-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Customer
            </span>
            <div className="p-1 rounded bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg sm:text-xl font-bold text-emerald-900">{customerCount}</span>
            <span className="text-[10px] text-emerald-600 font-bold">Deal Sukses</span>
          </div>
        </div>

        {/* Status: Tidak Jadi */}
        <div
          onClick={() => onNavigateToProspects('Tidak Jadi')}
          className="bg-white p-2.5 rounded-lg border border-rose-100 shadow-2xs hover:border-rose-300 transition cursor-pointer group col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
              Tidak Jadi
            </span>
            <div className="p-1 rounded bg-rose-50 text-rose-600">
              <XCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg sm:text-xl font-bold text-rose-900">{tidakJadiCount}</span>
            <span className="text-[10px] text-rose-600 font-medium">Batal</span>
          </div>
        </div>
      </div>

      {/* Main Breakdown & Activity Grid: 3-column on lg for immediate glanceability without scrolling */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {/* Prospect per Sales */}
        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded bg-emerald-50 text-emerald-600">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-bold text-gray-900 text-xs sm:text-sm leading-tight">Prospect per Sales</h3>
              </div>
              <span className="text-[10px] text-gray-400 font-medium">{salesProfiles.length} Tim</span>
            </div>

            <div className="space-y-2 mt-2 max-h-[220px] overflow-y-auto pr-0.5">
              {prospectPerSales.length === 0 ? (
                <p className="text-xs text-gray-400 py-3 text-center">Belum ada data sales.</p>
              ) : (
                prospectPerSales.map((item) => (
                  <div key={item.id} className="space-y-0.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-gray-800 truncate text-[11px]">{item.name}</span>
                      <span className="text-gray-500 font-mono text-[10px]">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {unassignedSalesCount > 0 && (
            <div className="pt-1.5 mt-2 border-t border-gray-100 flex justify-between text-[11px] text-gray-400">
              <span>Belum Diassign</span>
              <span>{unassignedSalesCount} prospek</span>
            </div>
          )}
        </div>

        {/* Prospect per Zone */}
        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded bg-blue-50 text-blue-600">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-bold text-gray-900 text-xs sm:text-sm leading-tight">Prospect per Zone</h3>
              </div>
              <span className="text-[10px] text-gray-400 font-medium">{zones.length} Zone</span>
            </div>

            <div className="space-y-2 mt-2 max-h-[220px] overflow-y-auto pr-0.5">
              {prospectPerZone.length === 0 ? (
                <p className="text-xs text-gray-400 py-3 text-center">Belum ada data Zone.</p>
              ) : (
                prospectPerZone.map((item) => (
                  <div key={item.id} className="space-y-0.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-gray-800 truncate text-[11px] max-w-[170px]">{item.name}</span>
                      <span className="text-gray-500 font-mono text-[10px]">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {unassignedZoneCount > 0 && (
            <div className="pt-1.5 mt-2 border-t border-gray-100 flex justify-between text-[11px] text-gray-400">
              <span>Belum Diassign ke Zone</span>
              <span>{unassignedZoneCount} prospek</span>
            </div>
          )}
        </div>

        {/* Recent Prospects: Compact side card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-2xs overflow-hidden flex flex-col justify-between md:col-span-2 lg:col-span-1">
          <div>
            <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <h3 className="font-bold text-gray-900 text-xs sm:text-sm">Terbaru</h3>
              </div>
              <button
                onClick={() => onNavigateToProspects()}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 cursor-pointer"
              >
                Lihat Semua ({totalCount}) <ArrowRight className="w-2.5 h-2.5" />
              </button>
            </div>

            <div className="divide-y divide-gray-100">
              {prospects.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  onClick={() => onNavigateToProspects()}
                  className="px-3 py-2 hover:bg-gray-50/80 flex items-center justify-between transition cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-gray-900 truncate">{p.business_name}</span>
                      <span
                        className={`text-[9px] font-semibold px-1 py-0.2 rounded ${
                          p.status === 'Customer'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'Follow Up'
                            ? 'bg-amber-100 text-amber-800'
                            : p.status === 'Tidak Jadi'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5 truncate">
                      {p.pic_name} · {p.phone}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-gray-400 font-mono">
                      {new Date(p.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {prospects.length === 0 && (
                <div className="p-4 text-center text-gray-400 text-xs">
                  Belum ada calon customer terdaftar.
                </div>
              )}
            </div>
          </div>

          <div className="p-2 border-t border-gray-50 bg-gray-50/30 text-center">
            <button
              onClick={onOpenCreateProspect}
              className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 transition cursor-pointer"
            >
              + Tambah Calon Customer Baru
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
