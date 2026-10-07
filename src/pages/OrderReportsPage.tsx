import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Truck,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  User,
  Clock,
  Filter,
  BarChart3,
  CreditCard,
  FileText,
  Coins,
  AlertTriangle,
  Banknote,
} from 'lucide-react';
import { Order, Profile, Zone } from '../types';
import { db } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { formatRupiah } from '../lib/orderScheduleUtils';

export const OrderReportsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { success, error: toastError } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Period filter
  const [period, setPeriod] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all'>('week');
  const [filterCourier, setFilterCourier] = useState<string>('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ordersData, profilesData, zonesData] = await Promise.all([
        db.getOrders(currentUser),
        db.getProfiles(),
        db.getZones(),
      ]);
      setOrders(ordersData);
      setProfiles(profilesData);
      setZones(zonesData);
    } catch (err: any) {
      toastError(err.message || 'Gagal memuat data laporan.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Period filter
      if (period === 'today') {
        if (o.delivery_date !== todayStr) return false;
      } else if (period === 'yesterday') {
        if (o.delivery_date !== yesterdayStr) return false;
      } else if (period === 'week') {
        const orderDate = new Date(o.delivery_date);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (orderDate < sevenDaysAgo) return false;
      } else if (period === 'month') {
        const orderMonth = o.delivery_date.slice(0, 7);
        const currentMonth = todayStr.slice(0, 7);
        if (orderMonth !== currentMonth) return false;
      }

      // Courier filter
      if (filterCourier && o.courier_id !== filterCourier) {
        return false;
      }

      // Payment Method filter
      if (filterPaymentMethod && o.payment_method !== filterPaymentMethod) {
        return false;
      }

      return true;
    });
  }, [orders, period, filterCourier, filterPaymentMethod, todayStr, yesterdayStr]);

  // Aggregated Summary
  const summary = useMemo(() => {
    const totalCount = filteredOrders.length;
    const completedCount = filteredOrders.filter((o) => o.status === 'Selesai').length;
    const inDeliveryCount = filteredOrders.filter((o) => o.status === 'Sedang Diantar').length;
    const preparedCount = filteredOrders.filter((o) => o.status === 'Disiapkan').length;
    const receivedCount = filteredOrders.filter((o) => o.status === 'Diterima').length;

    const totalRevenue = filteredOrders
      .filter((o) => o.status !== 'Dibatalkan')
      .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

    const cashRevenue = filteredOrders
      .filter((o) => o.status !== 'Dibatalkan' && o.payment_method === 'Tunai')
      .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

    const qrisRevenue = filteredOrders
      .filter((o) => o.status !== 'Dibatalkan' && o.payment_method === 'QRIS')
      .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

    const transferRevenue = filteredOrders
      .filter((o) => o.status !== 'Dibatalkan' && o.payment_method === 'Transfer Bank')
      .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

    const paidRevenue = filteredOrders
      .filter((o) => o.payment_status === 'Lunas')
      .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

    const unpaidRevenue = filteredOrders
      .filter((o) => o.payment_status === 'Belum Lunas' && o.status !== 'Dibatalkan')
      .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

    const remittedCashRevenue = filteredOrders
      .filter(
        (o) =>
          o.status !== 'Dibatalkan' &&
          o.payment_method === 'Tunai' &&
          o.courier_remittance_status === 'Sudah Disetor ke Kas'
      )
      .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

    const pendingCourierCash = filteredOrders
      .filter(
        (o) =>
          o.status === 'Selesai' &&
          o.payment_method === 'Tunai' &&
          o.courier_remittance_status !== 'Sudah Disetor ke Kas'
      )
      .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

    const actualCompanyReceivedCash = qrisRevenue + transferRevenue + remittedCashRevenue;

    // Grouping by Courier performance
    const courierMap = new Map<
      string,
      {
        name: string;
        totalDelivered: number;
        totalRevenue: number;
        pendingCash: number;
        remittedCash: number;
      }
    >();

    filteredOrders.forEach((o) => {
      const cId = o.courier_id || 'unassigned';
      const cName = o.courier_name || 'Belum Ditugaskan';
      const existing = courierMap.get(cId) || {
        name: cName,
        totalDelivered: 0,
        totalRevenue: 0,
        pendingCash: 0,
        remittedCash: 0,
      };
      if (o.status === 'Selesai') existing.totalDelivered += 1;
      existing.totalRevenue += Number(o.total_amount) || 0;
      if (o.status === 'Selesai' && o.payment_method === 'Tunai') {
        if (o.courier_remittance_status === 'Sudah Disetor ke Kas') {
          existing.remittedCash += Number(o.total_amount) || 0;
        } else {
          existing.pendingCash += Number(o.total_amount) || 0;
        }
      }
      courierMap.set(cId, existing);
    });

    return {
      totalCount,
      completedCount,
      inDeliveryCount,
      preparedCount,
      receivedCount,
      totalRevenue,
      cashRevenue,
      qrisRevenue,
      transferRevenue,
      remittedCashRevenue,
      pendingCourierCash,
      actualCompanyReceivedCash,
      paidRevenue,
      unpaidRevenue,
      courierBreakdown: Array.from(courierMap.values()),
    };
  }, [filteredOrders]);

  // Export report to CSV
  const handleExportReportCsv = () => {
    if (filteredOrders.length === 0) {
      toastError('Tidak ada data order untuk diekspor.');
      return;
    }

    const headers = [
      'No Order',
      'Tanggal Pengantaran',
      'Slot Waktu',
      'Nama Customer',
      'No HP / WA',
      'Alamat Pengantaran',
      'Daftar Produk Buah',
      'Total Tagihan (Rp)',
      'Metode Pembayaran',
      'Status Pembayaran',
      'Status Order',
      'Kurir Pengantar',
      'Waktu Selesai Antar',
      'Catatan Kurir',
    ];

    const rows = filteredOrders.map((o) => [
      `"${o.order_number}"`,
      `"${o.delivery_date}"`,
      `"${o.delivery_slot}"`,
      `"${o.customer_name.replace(/"/g, '""')}"`,
      `"'${o.customer_phone}"`,
      `"${o.delivery_address.replace(/"/g, '""')}"`,
      `"${o.items_summary.replace(/"/g, '""')}"`,
      o.total_amount,
      `"${o.payment_method}"`,
      `"${o.payment_status}"`,
      `"${o.status}"`,
      `"${o.courier_name || '-'}"`,
      `"${o.delivered_at ? new Date(o.delivered_at).toLocaleString('id-ID') : '-'}"`,
      `"${(o.delivery_notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan_order_pengantaran_${period}_${todayStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    success(`Berhasil mengunduh laporan ${filteredOrders.length} order.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
            Report
          </h1>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Rekap omset pesanan, realisasi kas kurir, metode pembayaran, dan produktivitas tim.
          </p>
        </div>

        <button
          onClick={handleExportReportCsv}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          Ekspor Laporan (CSV / Excel)
        </button>
      </div>

      {/* Period Filter Tabs */}
      <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-gray-500 mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-gray-400" /> Periode:
          </span>
          {[
            { id: 'today', label: 'Hari Ini' },
            { id: 'yesterday', label: 'Kemarin' },
            { id: 'week', label: '7 Hari Terakhir' },
            { id: 'month', label: 'Bulan Ini' },
            { id: 'all', label: 'Semua Waktu' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                period === tab.id
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterPaymentMethod}
            onChange={(e) => setFilterPaymentMethod(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-hidden"
          >
            <option value="">Semua Metode Bayar</option>
            <option value="Tunai">Tunai / COD</option>
            <option value="QRIS">QRIS</option>
            <option value="Transfer Bank">Transfer Bank</option>
          </select>
        </div>
      </div>

      {/* Top Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Omset */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase">Total Nilai Pesanan</span>
            <div className="p-2 rounded-xl bg-gray-100 text-gray-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-gray-900 font-mono">
            {formatRupiah(summary.totalRevenue)}
          </div>
          <div className="text-[11px] text-gray-500 pt-1 flex items-center justify-between">
            <span>{summary.totalCount} Order tercatat</span>
            <span className="font-semibold text-emerald-800">
              {summary.completedCount} Selesai ({summary.totalCount > 0 ? Math.round((summary.completedCount / summary.totalCount) * 100) : 0}%)
            </span>
          </div>
        </div>

        {/* Kas Resmi Masuk Perusahaan */}
        <div className="bg-white p-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 uppercase">Kas Resmi Masuk Perusahaan</span>
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-2xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-emerald-700 font-mono">
            {formatRupiah(summary.actualCompanyReceivedCash)}
          </div>
          <p className="text-[11px] text-emerald-800 pt-1 font-medium">
            QRIS &amp; Transfer ({formatRupiah(summary.qrisRevenue + summary.transferRevenue)}) + Tunai Disetor ({formatRupiah(summary.remittedCashRevenue)})
          </p>
        </div>

        {/* Uang COD Masih di Kurir (Belum Masuk Perusahaan) */}
        <div className="bg-white p-4 rounded-2xl border-2 border-amber-300 bg-amber-50/40 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 uppercase">Uang COD Masih di Kurir</span>
            <div className="p-2 rounded-xl bg-amber-500 text-white shadow-2xs">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-amber-900 font-mono">
            {formatRupiah(summary.pendingCourierCash)}
          </div>
          <p className="text-[11px] text-amber-800 pt-1 font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-700 shrink-0" />
            <span>Belum disetorkan kurir ke kasir kantor</span>
          </p>
        </div>

        {/* Status Piutang / Belum Lunas */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase">Tagihan Belum Lunas</span>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-rose-700 font-mono">
            {formatRupiah(summary.unpaidRevenue)}
          </div>
          <p className="text-[11px] text-rose-600 pt-1 font-medium">
            Sudah Lunas: {formatRupiah(summary.paidRevenue)}
          </p>
        </div>
      </div>

      {/* Courier Productivity Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              Laporan Kinerja &amp; Saldo Setoran Kurir
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Rincian antaran dan status uang COD yang dipegang kurir vs yang sudah masuk perusahaan
            </p>
          </div>
          <span className="text-xs text-gray-400">
            {summary.courierBreakdown.length} Staf Bertugas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {summary.courierBreakdown.map((item, idx) => (
            <div
              key={idx}
              className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2 hover:border-emerald-300 transition"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 text-xs truncate">{item.name}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {item.totalDelivered} Antaran Tuntas
                </span>
              </div>
              <div className="text-xs text-gray-500 flex justify-between">
                <span>Nilai Total Diantar:</span>
                <span className="font-mono font-bold text-gray-800">
                  {formatRupiah(item.totalRevenue)}
                </span>
              </div>
              <div className="text-xs flex justify-between items-center pt-1 border-t border-gray-200">
                <span className="text-amber-900 font-semibold text-[11px]">Uang di Kurir:</span>
                <span className={`font-mono font-bold text-xs ${item.pendingCash > 0 ? 'text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded' : 'text-gray-400'}`}>
                  {formatRupiah(item.pendingCash)}
                </span>
              </div>
              <div className="text-xs flex justify-between items-center text-[11px] text-gray-500">
                <span>Setoran Masuk Kas:</span>
                <span className="font-mono font-semibold text-emerald-700">
                  {formatRupiah(item.remittedCash)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
          <span className="text-xs font-bold text-gray-700 uppercase">
            Rincian Transaksi ({filteredOrders.length} Data)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="py-2.5 px-3">No Order</th>
                <th className="py-2.5 px-3">Tgl &amp; Slot</th>
                <th className="py-2.5 px-3">Customer / Usaha</th>
                <th className="py-2.5 px-3">Item Pesanan</th>
                <th className="py-2.5 px-3 text-right">Nilai Tagihan</th>
                <th className="py-2.5 px-3">Metode Bayar</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Kurir</th>
                <th className="py-2.5 px-3 text-center">Status Kas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50/80 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">
                    #{o.order_number}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-gray-800">{o.delivery_date}</div>
                    <div className="text-[10px]">
                      {o.delivery_slot.startsWith('Sekarang') ? (
                        <span className="text-amber-700 font-bold">⚡ {o.delivery_slot}</span>
                      ) : (
                        <span className="text-gray-400">{o.delivery_slot}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-gray-900">{o.customer_name}</div>
                    <div className="text-[10px] text-gray-500">{o.customer_phone}</div>
                  </td>
                  <td className="py-2.5 px-3 max-w-[200px] truncate text-gray-700">
                    {o.items_summary}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">
                    {formatRupiah(o.total_amount)}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold">{o.payment_method}</span>
                    <span
                      className={`block text-[9px] font-bold ${
                        o.payment_status === 'Lunas' ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {o.payment_status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-800">
                      {o.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-gray-700">
                    {o.courier_name || '-'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {o.payment_method === 'Tunai' ? (
                      o.status === 'Selesai' ? (
                        o.courier_remittance_status === 'Sudah Disetor ke Kas' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Masuk Kas
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            Di Kurir
                          </span>
                        )
                      ) : (
                        <span className="text-gray-400 text-[10px]">Menunggu Antar</span>
                      )
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
                        {o.payment_method}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-400">
                    Tidak ada transaksi pada periode ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
